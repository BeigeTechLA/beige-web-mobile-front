# Crew Members Import Tools

This directory contains tools for importing crew members into the Revure database.

## Files

- **`crew_members_data.json`** - Source data with 46 crew members
- **`import_crew_members.sql`** - SQL script for direct database import
- **`import_crew_members.js`** - Node.js utility for validation and SQL generation

## Quick Start

### Option 1: Direct SQL Import (Recommended)

If you have direct database access:

```bash
# 1. Review the SQL file first
cat scripts/import_crew_members.sql

# 2. Connect to your database and run the SQL file
# For MySQL:
mysql -u username -p database_name < scripts/import_crew_members.sql

# For PostgreSQL:
psql -U username -d database_name -f scripts/import_crew_members.sql
```

⚠️ **Important**: The SQL file includes a `DELETE FROM crew_members;` statement. Review and uncomment it carefully after backing up your data.

### Option 2: Using the Node.js Utility

#### Validate Data

Check data integrity before import:

```bash
node scripts/import_crew_members.js --mode=validate
```

This will check for:
- Missing required fields
- Invalid email formats
- Phone number validation
- Unusual hourly rates

#### Generate Fresh SQL

Generate a new SQL file with the latest data:

```bash
node scripts/import_crew_members.js --mode=sql
```

This creates `import_crew_members_generated.sql` with validated data.

#### View Statistics

See data distribution and statistics:

```bash
node scripts/import_crew_members.js --mode=stats
```

Shows:
- Skills distribution
- Location breakdown
- Hourly rate statistics

## Data Structure

Each crew member record includes:

```json
{
  "first_name": "Amit",
  "last_name": "Sharma",
  "email": "amit.sharma@example.com",
  "phone": "+1-555-0101",
  "skills": ["videography", "cinematography", "drone"],
  "city": "Los Angeles",
  "state": "CA",
  "hourly_rate": 250,
  "equipment": ["Sony FX6", "DJI Mavic 3 Pro", "Gimbal"],
  "portfolio_url": "https://portfolio.com/amit",
  "profile_photo": "https://images.unsplash.com/photo-..."
}
```

## Database Schema Requirements

The SQL assumes the following table structure:

```sql
CREATE TABLE crew_members (
  crew_member_id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(50),
  skills JSON,
  city VARCHAR(255),
  state VARCHAR(50),
  hourly_rate DECIMAL(10,2),
  equipment_ownership JSON,
  portfolio_url TEXT,
  profile_image TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

Adjust field names in the SQL file if your schema differs.

## Data Overview

### Total Crew Members: 46

### Skills Breakdown:
- **Videography specialists**: 10 crew members
- **Photography specialists**: 10 crew members
- **Hybrid (Photo + Video)**: 16 crew members
- **Specialized roles**: 10 crew members (editors, drone operators, etc.)

### Top Locations:
- Los Angeles, CA: 7 members
- San Francisco, CA: 6 members
- New York, NY: 4 members
- Portland, OR: 2 members
- And more across 15+ cities

### Rate Range:
- Minimum: $210/hr
- Maximum: $320/hr
- Average: ~$265/hr

## Important Notes

1. **Backup First**: Always backup your existing crew_members table before running the DELETE statement
2. **Review SQL**: Check the generated SQL for any schema differences
3. **Email Uniqueness**: All emails are unique and use example.com domain
4. **Profile Photos**: Using placeholder Unsplash images (replace with actual photos later)
5. **Skills Format**: Skills are stored as JSON arrays for flexibility
6. **Equipment**: Equipment ownership is also JSON for multiple items

## Troubleshooting

### Schema Mismatch

If you get column name errors:

1. Check your actual table schema: `DESCRIBE crew_members;`
2. Update the SQL INSERT statements to match your column names
3. Or run with `--mode=validate` to check data integrity first

### Duplicate Emails

If you get duplicate email errors:

1. Check existing records: `SELECT email FROM crew_members;`
2. Either delete existing records or modify emails in `crew_members_data.json`
3. Re-generate SQL: `node scripts/import_crew_members.js --mode=sql`

### JSON Format Issues

If your database doesn't support JSON columns:

1. Skills and equipment might need to be stored as TEXT
2. Update SQL to use TEXT columns and stringify: `equipment_ownership = '["item1","item2"]'`

## Next Steps

After importing:

1. **Verify Import**:
   ```sql
   SELECT COUNT(*) FROM crew_members;
   SELECT first_name, last_name, email, city FROM crew_members LIMIT 10;
   ```

2. **Update Profile Photos**: Replace Unsplash placeholder URLs with actual crew member photos

3. **Map to Roles**: If you have a `roles` table, link crew members to their primary roles via `role_id`

4. **Create Users**: If crew members need login access, create corresponding user accounts

5. **Test Search**: Verify the creator search API returns the new crew members correctly

## Backend Integration

If you need to import via API instead of direct SQL:

1. Create a backend admin endpoint: `POST /admin/crew-members/bulk-import`
2. Add authentication/authorization for admin-only access
3. Update `import_crew_members.js` with the endpoint implementation
4. Run: `node scripts/import_crew_members.js --mode=api`

## Support

For issues or questions:
- Check database logs for error details
- Verify table schema matches expected structure
- Test with a small subset first (comment out most INSERT statements)
- Review validation output before importing
