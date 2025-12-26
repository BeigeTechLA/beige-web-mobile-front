# Creator Search API Investigation Report

**Investigation Date:** 2025-12-27
**API Endpoint:** `/v1/creators/search`
**Issue:** Empty results being returned

## Problem URL Analysis

**Actual URL being called:**
```
/v1/creators/search?budget=3956.25&location=2|B+West+Temple+Street,Los+Angeles,California+90012&shoot_type=wedding
```

### Parameter Breakdown

| Parameter | Value | Expected Field | Status |
|-----------|-------|----------------|--------|
| `budget` | `3956.25` | `hourly_rate` (with `Op.lte`) | ✅ Valid |
| `location` | `2\|B+West+Temple+Street,Los+Angeles,California+90012` | `location` (with `Op.like`) | ⚠️ Issue Found |
| `shoot_type` | `wedding` | ❌ **NOT MAPPED** | 🚨 **CRITICAL BUG** |

## Root Cause Analysis

### Issue 1: `shoot_type` Parameter Not Handled

**Location:** `/Users/amrik/Documents/revure/revure-v2-backend/src/controllers/creators.controller.js` (Line 84-97)

**Current Code:**
```javascript
const {
  budget,
  min_budget,
  max_budget,
  location,
  skills,
  content_type,      // ← Expecting this
  content_types,     // ← Or this
  maxDistance,
  page = 1,
  limit = 20
} = req.query;
// shoot_type is NOT extracted!
```

**Problem:**
- Frontend sends: `shoot_type=wedding`
- Backend expects: `content_type` (number) or `content_types` (array/string of numbers)
- Result: The `shoot_type` parameter is completely ignored

**Evidence from Frontend:**
```typescript
// /Users/amrik/Documents/revure/revure-v2-landing/app/book-a-shoot/page.tsx:195
const searchParams = new URLSearchParams({
  booking_id: String(bookingResult.booking_id),
  shoot_type: formData.shootType,  // ← Sends "wedding" as string
  location: formData.location || "",
  budget: String(quote?.total || formData.budgetMax),
});
```

**Database Schema:**
- `crew_members.primary_role` is an INTEGER (role_id: 1-5)
- Role mapping:
  - 1: Videographer
  - 2: Photographer
  - 3: Editor
  - 4: Producer
  - 5: Director

**Mismatch:**
- `shoot_type="wedding"` is a **string** describing the event type
- `primary_role` is an **integer** describing the creator's role
- These are completely different concepts!

### Issue 2: Location Format Parsing

**Location Input:**
```
2|B+West+Temple+Street,Los+Angeles,California+90012
```

**Parsing Test Result:**
```json
{
  "lat": null,
  "lng": null,
  "address": "2|B+West+Temple+Street,Los+Angeles,California+90012"
}
```

**Problem:**
- The location string has a `2|` prefix (possibly a location ID or type indicator)
- The `+` characters should be URL-decoded to spaces
- The parser treats the entire string as plain text address

**SQL WHERE Clause Generated:**
```javascript
whereClause.location = {
  [Op.like]: `%2|B+West+Temple+Street,Los+Angeles,California+90012%`
}
```

**Impact:**
- Database likely has locations stored as:
  - `"Los Angeles, CA"`
  - `"B West Temple Street, Los Angeles, California 90012"`
- The search string includes the `2|` prefix, which won't match
- The `+` characters aren't decoded, looking for literal `+` instead of spaces

### Issue 3: Budget Filter Confusion

**Current Logic (Line 122-137):**
```javascript
if (min_budget || max_budget || budget) {
  whereClause.hourly_rate = {};

  if (min_budget) {
    whereClause.hourly_rate[Op.gte] = parseFloat(min_budget);
  }
  if (max_budget) {
    whereClause.hourly_rate[Op.lte] = parseFloat(max_budget);
  }

  // Backward compatibility: budget param means max rate
  if (budget && !max_budget) {
    whereClause.hourly_rate[Op.lte] = parseFloat(budget);
  }
}
```

**Issue:**
- URL sends `budget=3956.25` which is interpreted as max hourly rate
- `$3956.25/hour` is an extremely high rate (likely means total project budget)
- This would filter OUT most creators who have reasonable hourly rates ($50-500/hr)
- SQL: `WHERE hourly_rate <= 3956.25` (this would match everyone, so not causing empty results)

## SQL Query Being Executed

Based on the code analysis, the actual SQL query would be:

```sql
SELECT
  crew_member_id,
  first_name,
  last_name,
  primary_role,
  hourly_rate,
  rating,
  location,
  years_of_experience,
  bio,
  skills,
  is_available,
  created_at
FROM crew_members
WHERE
  is_active = 1
  AND is_draft = 0
  AND hourly_rate <= 3956.25
  AND location LIKE '%2|B+West+Temple+Street,Los+Angeles,California+90012%'
  -- shoot_type parameter completely ignored!
ORDER BY
  rating DESC,
  created_at DESC
```

**Why This Returns Empty:**

1. ✅ `is_active = 1` - Likely has active creators
2. ✅ `is_draft = 0` - Likely has non-draft creators
3. ✅ `hourly_rate <= 3956.25` - High limit, should match most creators
4. ❌ **`location LIKE '%2|B+West+Temple+Street,Los+Angeles,California+90012%'`** - **THIS FAILS**
   - Database likely has: `"Los Angeles, CA"` or `"B West Temple Street, Los Angeles, CA 90012"`
   - Search is looking for: `"2|B+West+Temple+Street,Los+Angeles,California+90012"`
   - No match due to `2|` prefix and `+` characters

## Verification Needed

To confirm the root cause, check:

1. **What's in the database?**
   ```sql
   SELECT crew_member_id, location FROM crew_members
   WHERE is_active = 1 AND is_draft = 0
   LIMIT 5;
   ```

2. **Test without location filter:**
   ```
   /v1/creators/search?budget=3956.25
   ```
   Should return results if location is the issue.

3. **Test with clean location:**
   ```
   /v1/creators/search?budget=3956.25&location=Los Angeles
   ```
   Should return results if the `2|` prefix is the problem.

## Recommended Fixes

### Fix 1: Handle `shoot_type` Parameter (High Priority)

**Option A:** Map shoot_type to content_type
```javascript
// In searchCreators function, after line 97
let finalContentType = content_type;

// Map shoot_type to content_type if provided
if (shoot_type && !content_type && !content_types) {
  const shootTypeMapping = {
    'wedding': 2,        // Photographer
    'event': 2,          // Photographer
    'commercial': 1,     // Videographer
    'portrait': 2,       // Photographer
    // Add more mappings as needed
  };
  finalContentType = shootTypeMapping[shoot_type.toLowerCase()];
}
```

**Option B:** Ignore shoot_type (document mismatch)
- Document that `shoot_type` is for bookings, not creator search
- Update frontend to use `content_type` or `content_types` instead

### Fix 2: Clean Location String (Critical)

**In parseLocation function or before using location:**
```javascript
// Clean the location string before parsing
if (location && typeof location === 'string') {
  let cleanLocation = location;

  // Remove ID prefix (e.g., "2|")
  cleanLocation = cleanLocation.replace(/^\d+\|/, '');

  // URL decode + characters to spaces
  cleanLocation = cleanLocation.replace(/\+/g, ' ');

  // Now parse the cleaned location
  parsedLocation = parseLocation(cleanLocation);
}
```

### Fix 3: Budget Interpretation

**Clarify budget vs hourly_rate:**
```javascript
// Add a query param for total_budget vs hourly_rate
const { budget, hourly_rate_max, total_budget, ... } = req.query;

if (hourly_rate_max || budget) {
  // Use as hourly rate filter
  whereClause.hourly_rate = {
    [Op.lte]: parseFloat(hourly_rate_max || budget)
  };
}

// If total_budget is provided, skip hourly rate filter
// (let frontend calculate affordability later)
```

## Impact Assessment

**Current State:**
- 🚨 **Search returns 0 results** due to location string mismatch
- ⚠️ `shoot_type` parameter silently ignored (no error thrown)
- ⚠️ Budget parameter semantic mismatch (project budget vs hourly rate)

**User Experience:**
- User completes booking form with all details
- Redirected to search results page
- Sees "No creators found" message
- No clear indication of what went wrong

## Next Steps

1. **Immediate:** Fix location string cleaning to handle `2|` prefix and `+` characters
2. **Short-term:** Map `shoot_type` to `content_type` or document the parameter mismatch
3. **Long-term:** Align frontend and backend parameter naming conventions
4. **Testing:** Verify database has appropriate test data with proper location formats
