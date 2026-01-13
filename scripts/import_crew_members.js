/**
 * Crew Members Import Script
 *
 * This script provides utilities to import crew members from the JSON file:
 * - Generate SQL INSERT statements
 * - Validate data structure
 * - Call backend API (if endpoint exists)
 *
 * Usage:
 *   node scripts/import_crew_members.js --mode=sql        # Generate SQL file
 *   node scripts/import_crew_members.js --mode=validate   # Validate data only
 *   node scripts/import_crew_members.js --mode=api        # Call backend API (requires endpoint)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  dataFile: path.join(__dirname, 'crew_members_data.json'),
  sqlOutput: path.join(__dirname, 'import_crew_members_generated.sql'),
  apiEndpoint: process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://revure-api.beige.app/v1/',
  tableName: 'crew_members'
};

// Read crew members data
function loadCrewMembers() {
  try {
    const data = fs.readFileSync(CONFIG.dataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading crew members data:', error.message);
    process.exit(1);
  }
}

// Validate crew member data
function validateCrewMember(member, index) {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!member.first_name) errors.push(`Missing first_name`);
  if (!member.last_name) errors.push(`Missing last_name`);
  if (!member.email) errors.push(`Missing email`);
  if (!member.skills || member.skills.length === 0) warnings.push(`No skills defined`);

  // Email validation
  if (member.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
    errors.push(`Invalid email format: ${member.email}`);
  }

  // Phone validation (basic)
  if (member.phone && !/^\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(member.phone)) {
    warnings.push(`Phone format may be invalid: ${member.phone}`);
  }

  // Hourly rate validation
  if (member.hourly_rate && (member.hourly_rate < 0 || member.hourly_rate > 1000)) {
    warnings.push(`Unusual hourly rate: $${member.hourly_rate}`);
  }

  return { errors, warnings };
}

// Validate all crew members
function validateAllData(crewMembers) {
  console.log('\n🔍 Validating crew members data...\n');

  let totalErrors = 0;
  let totalWarnings = 0;

  crewMembers.forEach((member, index) => {
    const { errors, warnings } = validateCrewMember(member, index);

    if (errors.length > 0 || warnings.length > 0) {
      console.log(`\n${index + 1}. ${member.first_name} ${member.last_name} (${member.email})`);

      if (errors.length > 0) {
        console.log('  ❌ Errors:');
        errors.forEach(err => console.log(`     - ${err}`));
        totalErrors += errors.length;
      }

      if (warnings.length > 0) {
        console.log('  ⚠️  Warnings:');
        warnings.forEach(warn => console.log(`     - ${warn}`));
        totalWarnings += warnings.length;
      }
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Validation complete: ${crewMembers.length} crew members`);
  console.log(`   ❌ Errors: ${totalErrors}`);
  console.log(`   ⚠️  Warnings: ${totalWarnings}`);
  console.log('='.repeat(60) + '\n');

  return { totalErrors, totalWarnings };
}

// Escape SQL strings
function escapeSQLString(str) {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

// Generate SQL INSERT statement for a crew member
function generateSQLInsert(member) {
  const firstName = escapeSQLString(member.first_name);
  const lastName = escapeSQLString(member.last_name);
  const email = escapeSQLString(member.email);
  const phone = escapeSQLString(member.phone || '');
  const skills = escapeSQLString(JSON.stringify(member.skills));
  const city = escapeSQLString(member.city || '');
  const state = escapeSQLString(member.state || '');
  const hourlyRate = member.hourly_rate || 0;
  const equipment = escapeSQLString(JSON.stringify(member.equipment || []));
  const portfolioUrl = escapeSQLString(member.portfolio_url || '');
  const profilePhoto = escapeSQLString(member.profile_photo || '');
  const bio = escapeSQLString(`${member.skills.join(', ')} specialist with professional experience`);

  return `INSERT INTO ${CONFIG.tableName} (first_name, last_name, email, phone_number, skills, city, state, hourly_rate, equipment_ownership, portfolio_url, profile_image, bio)
VALUES (${firstName}, ${lastName}, ${email}, ${phone}, ${skills}, ${city}, ${state}, ${hourlyRate}, ${equipment}, ${portfolioUrl}, ${profilePhoto}, ${bio});`;
}

// Generate complete SQL file
function generateSQLFile(crewMembers) {
  console.log('\n📝 Generating SQL file...\n');

  const sqlLines = [
    '-- =====================================================',
    '-- Revure Crew Members Import Script (Auto-generated)',
    '-- =====================================================',
    `-- Generated on: ${new Date().toISOString()}`,
    `-- Total crew members: ${crewMembers.length}`,
    '',
    '-- =====================================================',
    '-- STEP 1: Clean existing crew members (optional)',
    '-- =====================================================',
    '-- WARNING: This will delete all existing crew members',
    '-- Uncomment the line below to execute',
    `-- DELETE FROM ${CONFIG.tableName};`,
    '',
    '-- =====================================================',
    '-- STEP 2: Insert new crew members',
    '-- =====================================================',
    ''
  ];

  crewMembers.forEach((member, index) => {
    if (index > 0 && index % 5 === 0) {
      sqlLines.push(''); // Add blank line every 5 records for readability
    }
    sqlLines.push(generateSQLInsert(member));
  });

  sqlLines.push('');
  sqlLines.push('-- =====================================================');
  sqlLines.push('-- STEP 3: Verify import');
  sqlLines.push('-- =====================================================');
  sqlLines.push(`-- SELECT COUNT(*) as total_crew_members FROM ${CONFIG.tableName};`);
  sqlLines.push(`-- SELECT first_name, last_name, email, city, state, hourly_rate FROM ${CONFIG.tableName} ORDER BY created_at DESC LIMIT 20;`);
  sqlLines.push('');

  const sqlContent = sqlLines.join('\n');

  try {
    fs.writeFileSync(CONFIG.sqlOutput, sqlContent, 'utf8');
    console.log(`✅ SQL file generated successfully:`);
    console.log(`   📁 ${CONFIG.sqlOutput}`);
    console.log(`   📊 ${crewMembers.length} INSERT statements`);
    console.log(`   💾 ${(sqlContent.length / 1024).toFixed(2)} KB\n`);
  } catch (error) {
    console.error('❌ Error writing SQL file:', error.message);
    process.exit(1);
  }
}

// Call backend API to import crew members
async function importViaAPI(crewMembers) {
  console.log('\n🚀 Importing via API...\n');
  console.log(`   API Endpoint: ${CONFIG.apiEndpoint}`);
  console.log(`   Total records: ${crewMembers.length}\n`);

  // Note: This requires an admin endpoint on the backend
  // Adjust the endpoint and payload format as needed

  console.log('⚠️  Note: This feature requires a backend admin endpoint.');
  console.log('   Example endpoint: POST /admin/crew-members/bulk-import');
  console.log('   Example payload: { "crew_members": [...], "clear_existing": true }');
  console.log('\n   Please implement the backend endpoint first, then update this script.\n');

  // Example implementation (uncomment and adjust when endpoint is ready):
  /*
  const fetch = require('node-fetch');

  try {
    const response = await fetch(`${CONFIG.apiEndpoint}admin/crew-members/bulk-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication header if needed:
        // 'Authorization': `Bearer ${process.env.ADMIN_API_TOKEN}`
      },
      body: JSON.stringify({
        crew_members: crewMembers,
        clear_existing: true // Set to false to append instead of replace
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Import successful!');
      console.log(`   Imported: ${result.imported} crew members`);
      console.log(`   Errors: ${result.errors || 0}`);
    } else {
      console.error('❌ Import failed:', result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ API call failed:', error.message);
    process.exit(1);
  }
  */
}

// Display statistics
function displayStats(crewMembers) {
  console.log('\n📊 Crew Members Statistics:\n');

  // Count by skills
  const skillCounts = {};
  crewMembers.forEach(member => {
    member.skills.forEach(skill => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
  });

  console.log('  Skills Distribution:');
  Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([skill, count]) => {
      console.log(`    ${skill}: ${count}`);
    });

  // Count by location
  const locationCounts = {};
  crewMembers.forEach(member => {
    const location = `${member.city}, ${member.state}`;
    locationCounts[location] = (locationCounts[location] || 0) + 1;
  });

  console.log('\n  Top Locations:');
  Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([location, count]) => {
      console.log(`    ${location}: ${count}`);
    });

  // Hourly rate statistics
  const rates = crewMembers.map(m => m.hourly_rate).filter(r => r > 0);
  const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);

  console.log('\n  Hourly Rate Statistics:');
  console.log(`    Average: $${avgRate.toFixed(2)}/hr`);
  console.log(`    Range: $${minRate}/hr - $${maxRate}/hr`);
  console.log('');
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const mode = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'help';

  console.log('\n' + '='.repeat(60));
  console.log('  Revure Crew Members Import Utility');
  console.log('='.repeat(60));

  if (mode === 'help' || !['sql', 'validate', 'api', 'stats'].includes(mode)) {
    console.log('\nUsage:');
    console.log('  node scripts/import_crew_members.js --mode=sql        Generate SQL file');
    console.log('  node scripts/import_crew_members.js --mode=validate   Validate data only');
    console.log('  node scripts/import_crew_members.js --mode=api        Import via API');
    console.log('  node scripts/import_crew_members.js --mode=stats      Display statistics');
    console.log('');
    return;
  }

  const crewMembers = loadCrewMembers();
  console.log(`\n✅ Loaded ${crewMembers.length} crew members from JSON file\n`);

  switch (mode) {
    case 'validate':
      validateAllData(crewMembers);
      break;

    case 'sql':
      const { totalErrors } = validateAllData(crewMembers);
      if (totalErrors === 0) {
        generateSQLFile(crewMembers);
      } else {
        console.log('❌ Cannot generate SQL due to validation errors. Fix them first.\n');
        process.exit(1);
      }
      break;

    case 'api':
      validateAllData(crewMembers);
      importViaAPI(crewMembers);
      break;

    case 'stats':
      displayStats(crewMembers);
      break;
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  loadCrewMembers,
  validateCrewMember,
  validateAllData,
  generateSQLFile,
  importViaAPI,
  displayStats
};
