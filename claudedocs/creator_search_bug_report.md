# Creator Search Bug Report - CONFIRMED ROOT CAUSE

## Executive Summary

The creator search API at `/v1/creators/search` returns **0 results** due to a location string format mismatch between frontend and backend. Additionally, the `shoot_type` parameter sent by the frontend is completely ignored by the backend.

## Confirmed Issues

### 🚨 CRITICAL: Location String Format Mismatch

**URL Parameter:**
```
location=2|B+West+Temple+Street,Los+Angeles,California+90012
```

**Database Storage Format:**
```
"Los Angeles, CA"
"New York, NY"
"Brooklyn, NY"
```

**SQL Query Generated:**
```sql
WHERE location LIKE '%2|B+West+Temple+Street,Los+Angeles,California+90012%'
```

**Database Test Results:**
- Total active creators: **21**
- Match with bad location string: **0** ❌
- Match with cleaned location string: **0** ❌
- Match with "Los Angeles" only: **5** ✅

**Root Cause:**
1. The location parameter includes a `2|` prefix (likely from frontend encoding)
2. The `+` characters are not URL-decoded to spaces
3. The full street address doesn't match the simplified city format in database
4. Database stores: `"Los Angeles, CA"`
5. Search looks for: `"2|B+West+Temple+Street,Los+Angeles,California+90012"`

### ⚠️ HIGH: shoot_type Parameter Ignored

**Frontend Sends:**
```javascript
// /Users/amrik/Documents/revure/revure-v2-landing/app/book-a-shoot/page.tsx:195
const searchParams = new URLSearchParams({
  booking_id: String(bookingResult.booking_id),
  shoot_type: formData.shootType,  // e.g., "wedding"
  location: formData.location || "",
  budget: String(quote?.total || formData.budgetMax),
});
```

**Backend Expects:**
```javascript
// /Users/amrik/Documents/revure/revure-v2-backend/src/controllers/creators.controller.js:86-97
const {
  budget,
  min_budget,
  max_budget,
  location,
  skills,
  content_type,      // INTEGER: role_id (1-5)
  content_types,     // STRING: comma-separated role_ids
  maxDistance,
  page = 1,
  limit = 20
} = req.query;
// shoot_type is NOT extracted or used!
```

**Impact:**
- The `shoot_type=wedding` parameter is silently ignored
- No error is thrown
- No filtering by event type occurs
- This is a semantic mismatch: `shoot_type` describes the EVENT, `content_type` describes the CREATOR ROLE

## Detailed Analysis

### File: `/Users/amrik/Documents/revure/revure-v2-backend/src/controllers/creators.controller.js`

**Location Filtering Logic (Lines 139-144):**
```javascript
// Location filter - use text search if no coordinates or no maxDistance
if (location && !useProximitySearch && parsedLocation) {
  whereClause.location = {
    [Op.like]: `%${parsedLocation.address || location}%`
  };
}
```

**Problem:**
- `parsedLocation.address` contains the full malformed string
- No cleaning of the `2|` prefix
- No URL decoding of `+` to spaces
- No extraction of just the city name

### File: `/Users/amrik/Documents/revure/revure-v2-backend/src/utils/locationHelpers.js`

**parseLocation Function (Lines 16-53):**
```javascript
function parseLocation(location) {
  if (!location) return null;

  try {
    // If already an object, return as-is
    if (typeof location === 'object' && location !== null) {
      return location;
    }

    // Try to parse as JSON (Mapbox format)
    if (typeof location === 'string') {
      try {
        const parsed = JSON.parse(location);
        // ... handles JSON format
      } catch (e) {
        // Not JSON, treat as plain string address
        return {
          lat: null,
          lng: null,
          address: location  // ← Returns raw string, including 2| prefix and + chars
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing location:', error);
    return null;
  }
}
```

**Problem:**
- Function doesn't clean or normalize location strings
- Assumes input is either valid JSON or a clean address string
- Doesn't handle URL-encoded characters or prefixes

## Database Evidence

**Query Results:**
```
Total active creators: 21

Sample creator locations:
- ID 1: Alex, Location: 'Los Angeles, CA', Rate: $150.00
- ID 2: Sarah, Location: 'Los Angeles, CA', Rate: $120.00
- ID 3: Marcus, Location: 'Los Angeles, CA', Rate: $200.00
- ID 4: Emily, Location: 'New York, NY', Rate: $140.00
- ID 5: David, Location: 'Brooklyn, NY', Rate: $110.00

Results with bad location '2|B+West+Temple+Street,Los+Angeles,California+90012': 0
Results with clean location 'B West Temple Street,Los Angeles,California 90012': 0
Results with city only 'Los Angeles': 5
```

**Conclusions:**
- 21 active creators exist in database ✅
- All have simple city/state format locations ✅
- The malformed location string matches ZERO records ❌
- Even the cleaned full address matches ZERO (database has city-only) ❌
- Extracting just "Los Angeles" would match 5 creators ✅

## Exact Filtering SQL Logic

Based on code analysis, the WHERE clause for the failing query is:

```sql
SELECT
  crew_member_id, first_name, last_name, primary_role,
  hourly_rate, rating, location, years_of_experience,
  bio, skills, is_available, created_at
FROM crew_members
WHERE
  is_active = 1                                                           -- ✅ 21 matches
  AND is_draft = 0                                                       -- ✅ 21 matches
  AND hourly_rate <= 3956.25                                             -- ✅ All match (high limit)
  AND location LIKE '%2|B+West+Temple+Street,Los+Angeles,California+90012%'  -- ❌ 0 matches
ORDER BY
  rating DESC,
  created_at DESC
```

**Result:** 0 rows returned

## Impact on User Experience

1. User fills out booking form on `/book-a-shoot`
2. User clicks "Find Creative"
3. Booking is created successfully
4. User is redirected to `/search-results?booking_id=X&shoot_type=wedding&location=2|B+West+Temple+Street,Los+Angeles,California+90012&budget=3956.25`
5. Search API returns **0 results**
6. User sees: "No creators found matching your criteria"
7. User is confused (there are 21 active creators, 5 in Los Angeles!)

## Required Fixes

### Fix 1: Clean Location String (CRITICAL - Blocking Issue)

**Location:** `/Users/amrik/Documents/revure/revure-v2-backend/src/controllers/creators.controller.js`

**Before parseLocation is called (around line 106):**
```javascript
if (location) {
  // Clean the location string before parsing
  let cleanedLocation = location;

  // Remove numeric prefix with pipe (e.g., "2|")
  cleanedLocation = cleanedLocation.replace(/^\d+\|/, '');

  // Decode URL-encoded + to spaces
  cleanedLocation = cleanedLocation.replace(/\+/g, ' ');

  // Now parse the cleaned location
  parsedLocation = parseLocation(cleanedLocation);

  useProximitySearch = Boolean(
    parsedLocation &&
    parsedLocation.lat &&
    parsedLocation.lng &&
    maxDistance
  );
}
```

**Alternative: Extract city name for broader matching:**
```javascript
if (location && !useProximitySearch && parsedLocation) {
  let searchLocation = parsedLocation.address || location;

  // Extract city name (more robust matching)
  // "B West Temple Street,Los Angeles,California 90012" → "Los Angeles"
  const cityMatch = searchLocation.match(/,\s*([^,]+),\s*[A-Z]{2}/);
  if (cityMatch) {
    searchLocation = cityMatch[1].trim();
  }

  whereClause.location = {
    [Op.like]: `%${searchLocation}%`
  };
}
```

### Fix 2: Handle shoot_type Parameter (HIGH - Feature Gap)

**Option A: Map to content_type (if semantic mapping exists)**
```javascript
// After line 97, add shoot_type extraction
const {
  budget,
  min_budget,
  max_budget,
  location,
  skills,
  content_type,
  content_types,
  shoot_type,  // ← ADD THIS
  maxDistance,
  page = 1,
  limit = 20
} = req.query;

// Map shoot_type to content_type if no explicit content_type provided
if (shoot_type && !content_type && !content_types) {
  // Example mapping (adjust based on business logic)
  const shootTypeToRole = {
    'wedding': '2',        // Photographer
    'event': '2',          // Photographer
    'commercial': '1',     // Videographer
    'portrait': '2',       // Photographer
    'video': '1',          // Videographer
  };

  const mappedRole = shootTypeToRole[shoot_type.toLowerCase()];
  if (mappedRole) {
    content_types = mappedRole;
  }
}
```

**Option B: Document and ignore (if no semantic mapping)**
- Add API documentation that `shoot_type` is not used for creator search
- Update frontend to send `content_type` instead
- Remove `shoot_type` from search URL parameters

### Fix 3: Budget Parameter Clarification (MEDIUM - Semantic Issue)

**Current behavior:**
- `budget=3956.25` is treated as max hourly rate
- This is likely the total project budget, not hourly rate

**Recommended:**
- Document that `budget` parameter means max hourly rate
- Frontend should calculate appropriate hourly rate from total budget
- OR: Add separate `total_budget` parameter and skip hourly rate filter

## Testing Plan

1. **Test with cleaned location:**
   ```
   GET /v1/creators/search?budget=3956.25&location=Los Angeles
   ```
   Expected: Returns 5+ creators from Los Angeles

2. **Test without location:**
   ```
   GET /v1/creators/search?budget=3956.25
   ```
   Expected: Returns 21 creators

3. **Test with shoot_type mapping:**
   ```
   GET /v1/creators/search?budget=3956.25&location=Los Angeles&shoot_type=wedding
   ```
   Expected: Returns photographers in Los Angeles (if mapping implemented)

4. **Test full workflow:**
   - Complete booking form on frontend
   - Verify search results page shows creators
   - Verify location and filters are applied correctly

## Files Requiring Changes

1. `/Users/amrik/Documents/revure/revure-v2-backend/src/controllers/creators.controller.js`
   - Line 105-113: Clean location string before parsing
   - Line 86-97: Extract and handle shoot_type parameter
   - Line 154-169: Optionally map shoot_type to content_type

2. `/Users/amrik/Documents/revure/revure-v2-landing/app/book-a-shoot/page.tsx`
   - Line 193-198: Either remove shoot_type or map to content_type
   - Consider sending just city name instead of full address

## Priority

- **P0 (Critical):** Location string cleaning - blocks all searches from book-a-shoot flow
- **P1 (High):** shoot_type handling - silently ignores user intent
- **P2 (Medium):** Budget parameter documentation - semantic confusion

## Conclusion

The empty results are caused by:
1. **PRIMARY:** Location string format mismatch (`"2|B+West+Temple+Street,Los+Angeles,California+90012"` vs `"Los Angeles, CA"`)
2. **SECONDARY:** shoot_type parameter completely ignored by backend
3. **TERTIARY:** Budget parameter semantic ambiguity (total vs hourly)

**Immediate action:** Implement location string cleaning in the backend controller.
**Short-term:** Decide how to handle shoot_type (map, ignore, or reject).
**Long-term:** Align frontend/backend parameter naming and data formats.
