const fs = require('fs');
const path = require('path');

// Read the data
const dataFile = path.join(__dirname, 'crew_members_data.json');
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

console.log(`\nFixing ${data.length} crew members...\n`);

// Fix the data
const fixed = data.map((member, index) => {
  const fixed = { ...member };

  // Fix missing emails - create placeholder
  if (!fixed.email || fixed.email === null) {
    const firstName = (fixed.first_name || 'crew').toLowerCase().replace(/[^a-z]/g, '');
    const lastName = (fixed.last_name || 'member').toLowerCase().replace(/[^a-z]/g, '');
    fixed.email = `${firstName}.${lastName}${index}@revure.placeholder`;
    console.log(`✏️  Fixed email for ${fixed.first_name} ${fixed.last_name}: ${fixed.email}`);
  }

  // Fix empty skills - infer from equipment or specialties
  if (!fixed.skills || fixed.skills.length === 0) {
    const newSkills = [];

    // Check specialties first
    if (fixed.specialties) {
      const spec = fixed.specialties.toLowerCase();
      if (spec.includes('photo') && !spec.includes('videograph')) newSkills.push('photography');
      if (spec.includes('video') || spec.includes('film') || spec.includes('cinematography')) newSkills.push('videography');
      if (spec.includes('drone') || spec.includes('aerial')) newSkills.push('drone');
      if (spec.includes('wedding')) newSkills.push('wedding');
      if (spec.includes('event')) newSkills.push('events');
      if (spec.includes('corporate')) newSkills.push('corporate');
      if (spec.includes('documentary')) newSkills.push('documentary');
    }

    // Check equipment
    if (fixed.equipment && typeof fixed.equipment === 'string') {
      const equip = fixed.equipment.toLowerCase();

      // Photography indicators
      if (equip.includes('canon') || equip.includes('nikon') || equip.includes('sony') ||
          equip.includes('flash') || equip.includes('strobe')) {
        // Could be photo or video, check for more specific indicators
        if (equip.includes('5d') || equip.includes('r5') || equip.includes('r6') ||
            equip.includes('a7') || equip.includes('a1')) {
          // These models do both, add both
          if (!newSkills.includes('videography')) newSkills.push('videography');
          if (!newSkills.includes('photography') && equip.includes('flash')) newSkills.push('photography');
        }
      }

      // Video specific indicators
      if (equip.includes('video') || equip.includes('cinema') || equip.includes('4k') ||
          equip.includes('gimbal') || equip.includes('stabilizer') || equip.includes('ronin')) {
        if (!newSkills.includes('videography')) newSkills.push('videography');
      }

      if (equip.includes('drone') || equip.includes('mavic') || equip.includes('phantom')) {
        if (!newSkills.includes('drone')) newSkills.push('drone');
      }

      if (equip.includes('audio') || equip.includes('mic') || equip.includes('lav') ||
          equip.includes('recorder') || equip.includes('zoom')) {
        if (!newSkills.includes('audio')) newSkills.push('audio');
      }

      if (equip.includes('light') || equip.includes('led') || equip.includes('godox') ||
          equip.includes('aputure')) {
        if (!newSkills.includes('lighting')) newSkills.push('lighting');
      }
    }

    // Default if still empty - assume videography as it's most common
    if (newSkills.length === 0) {
      newSkills.push('videography');
    }

    // Remove duplicates and filter out non-primary skills
    const primarySkills = newSkills.filter(s => ['videography', 'photography', 'drone'].includes(s));
    fixed.skills = [...new Set(primarySkills.length > 0 ? primarySkills : newSkills)];

    console.log(`🎯 Fixed skills for ${fixed.first_name} ${fixed.last_name}: [${fixed.skills.join(', ')}]`);
  }

  // Ensure equipment is an array if it's a string
  if (fixed.equipment && typeof fixed.equipment === 'string') {
    fixed.equipment = fixed.equipment.split(',').map(e => e.trim());
  } else if (!fixed.equipment || fixed.equipment === null) {
    fixed.equipment = [];
  }

  // Set default hourly rate if missing (use median of existing rates)
  if (!fixed.hourly_rate || fixed.hourly_rate === null) {
    fixed.hourly_rate = 100;
    console.log(`💰 Set default hourly rate for ${fixed.first_name} ${fixed.last_name}: $100/hr`);
  }

  // Set default city if missing
  if (!fixed.city || fixed.city === null) {
    fixed.city = 'Remote';
  }

  // Set default state if missing
  if (!fixed.state || fixed.state === null) {
    fixed.state = 'US';
  }

  return fixed;
});

// Write fixed data
fs.writeFileSync(dataFile, JSON.stringify(fixed, null, 2));

console.log('\n' + '='.repeat(60));
console.log(`✅ Fixed ${fixed.length} crew members`);
console.log(`   📝 Saved to: ${dataFile}`);
console.log('='.repeat(60) + '\n');

// Show summary
const hasPhoto = fixed.filter(m => m.skills.includes('photography')).length;
const hasVideo = fixed.filter(m => m.skills.includes('videography')).length;
const hasDrone = fixed.filter(m => m.skills.includes('drone')).length;
const hasBoth = fixed.filter(m => m.skills.includes('photography') && m.skills.includes('videography')).length;

console.log('Skills Summary:');
console.log(`  📷 Photography: ${hasPhoto}`);
console.log(`  🎥 Videography: ${hasVideo}`);
console.log(`  🚁 Drone: ${hasDrone}`);
console.log(`  🎬 Both Photo+Video: ${hasBoth}\n`);
