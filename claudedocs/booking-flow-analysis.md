# Booking Search Flow Analysis - "No Creators Found" Issue

## Investigation Date
2025-12-27

## Problem Statement
The frontend booking search flow is showing "No creators found" after completing the booking form.

---

## CRITICAL FINDINGS

### 1. PARAMETER MISMATCH: shoot_type vs content_types

**Issue Identified:**
The search results page is sending `shoot_type` to the creators search API, but the API expects role-based filtering parameters (`content_type` or `content_types`).

**Evidence:**

#### Frontend Code (book-a-shoot/page.tsx, lines 193-198)
```typescript
const searchParams = new URLSearchParams({
  booking_id: String(bookingResult.booking_id),
  shoot_type: formData.shootType,          // ← PROBLEM: Sending shoot_type
  location: formData.location || "",
  budget: String(quote?.total || formData.budgetMax),
});

router.push(`/search-results?${searchParams.toString()}`);
```

#### Search Results API Call (search-results/page.tsx, lines 48-79)
```typescript
// Extract search parameters
const budget = searchParams.get("budget") ? Number(searchParams.get("budget")) : undefined;
const location = searchParams.get("location") || undefined;
const content_type = searchParams.get("content_type") ? Number(searchParams.get("content_type")) : undefined;
const content_types = searchParams.get("content_types") || undefined;

// Fetch creators from backend API
const { data, isLoading, error } = useSearchCreatorsQuery({
  budget,
  location,
  maxDistance,
  skills,
  content_type,      // ← API expects this
  content_types,     // ← or this
  page: 1,
  limit: 20,
});
```

**The Problem:**
- Form data has `shootType` (e.g., "Wedding", "Corporate Event")
- Navigation sends this as `shoot_type` URL parameter
- Search results page looks for `content_type` or `content_types`
- Since these are undefined, API gets NO role filter
- Backend likely returns empty results when role filter is missing

---

### 2. MISSING ROLE MAPPING

The booking form collects `contentType` array with role values:
```typescript
contentType: ("videographer" | "photographer" | "cinematographer" | "all")[]
```

This data exists in formData but is NOT being passed to the search results page.

**Current Navigation (line 193-198):**
```typescript
const searchParams = new URLSearchParams({
  booking_id: String(bookingResult.booking_id),
  shoot_type: formData.shootType,      // Event type (wrong param)
  location: formData.location || "",
  budget: String(quote?.total || formData.budgetMax),
  // ← MISSING: formData.contentType
});
```

**Should Include:**
```typescript
const searchParams = new URLSearchParams({
  booking_id: String(bookingResult.booking_id),
  content_types: formData.contentType.join(","),  // ← Need to add this
  location: formData.location || "",
  budget: String(quote?.total || formData.budgetMax),
});
```

---

### 3. LOCATION FORMAT VERIFICATION

**Current Implementation:**
- Location is passed as plain string from `formData.location`
- No transformation or geocoding before sending to API
- Backend may expect specific format (address string, coordinates, or both)

**Location Flow:**
1. Step3DateTime collects location string
2. Stored in `formData.location`
3. Passed directly to search API as-is

**Potential Issues:**
- If backend expects geocoded coordinates, search may fail
- Location radius search (maxDistance) is undefined by default
- No validation of location format

---

### 4. BUDGET PARAMETER HANDLING

**Two Different Budget Systems:**

**Search Results Page Expects:**
```typescript
budget?: number;           // Single value
min_budget?: number;      // Range min
max_budget?: number;      // Range max
```

**Currently Sending:**
```typescript
budget: String(quote?.total || formData.budgetMax)  // Only max value as single budget
```

**Potential Issue:**
- Sending only max budget as single value
- Not sending budget range (min_budget/max_budget)
- Backend may filter incorrectly with single value vs range

---

## DATA FLOW DIAGRAM

```
Step 1: Project Details
  → contentType: ["videographer", "photographer"]
  → serviceType: "shoot_edit"
  → shootType: "Wedding"

Step 2: More Details
  → budgetMin: 100
  → budgetMax: 15000
  → shootName: "My Wedding"

Step 3: Date & Time
  → location: "New York, NY"
  → startDate: "2025-01-15T10:00"
  → endDate: "2025-01-15T18:00"

Step 4: Review & Submit
  ↓
handleFindCreative()
  ↓
createGuestBooking({
  shoot_type: "Wedding",           ← Event type
  content_type: "videographer,photographer",  ← Roles needed
  location: "New York, NY",
  budget_min: 100,
  budget_max: 15000,
  ...
})
  ↓
Navigate to /search-results?
  booking_id=123
  &shoot_type=Wedding              ← WRONG: Event type, not role
  &location=New York, NY
  &budget=15000
  ↓
Search Results Page
  ↓
useSearchCreatorsQuery({
  content_type: undefined,         ← MISSING: No role filter!
  location: "New York, NY",
  budget: 15000,
  ...
})
  ↓
Backend API: creators/search
  ↓
NO RESULTS (missing role filter)
```

---

## ROOT CAUSES

### PRIMARY CAUSE
**Missing content_types parameter in search navigation**

The form collects role types (`formData.contentType`) but doesn't pass them to the search results page. This is the main reason for "No creators found".

### SECONDARY CAUSES

1. **Parameter naming confusion:**
   - `shoot_type` (event type like "Wedding") vs
   - `content_type`/`content_types` (role type like "videographer")

2. **Budget parameter format:**
   - Sending single `budget` value instead of `min_budget`/`max_budget` range

3. **Location format unknown:**
   - No validation of what backend expects (string vs coordinates)

---

## API TYPE DEFINITIONS

### CreatorSearchParams (lib/types.ts, lines 151-162)
```typescript
export interface CreatorSearchParams {
  budget?: number;
  min_budget?: number;
  max_budget?: number;
  location?: string;
  maxDistance?: number;
  skills?: string;
  content_type?: number;      // Single role ID
  content_types?: string;     // Comma-separated role names
  page?: number;
  limit?: number;
}
```

### GuestBookingData (guestBookingApi.ts, lines 6-31)
```typescript
export interface GuestBookingData {
  order_name: string;
  guest_email: string;
  shoot_type?: string;        // Event type
  content_type?: string;      // Roles needed (comma-separated)
  location?: string;
  budget_min?: number;
  budget_max?: number;
  ...
}
```

---

## REQUIRED FIXES

### FIX #1: Add content_types to Search Navigation (CRITICAL)

**File:** `/Users/amrik/Documents/revure/revure-v2-landing/app/book-a-shoot/page.tsx`
**Lines:** 193-198

**Change from:**
```typescript
const searchParams = new URLSearchParams({
  booking_id: String(bookingResult.booking_id),
  shoot_type: formData.shootType,
  location: formData.location || "",
  budget: String(quote?.total || formData.budgetMax),
});
```

**Change to:**
```typescript
const searchParams = new URLSearchParams({
  booking_id: String(bookingResult.booking_id),
  content_types: formData.contentType.join(","),  // ← ADD THIS
  location: formData.location || "",
  min_budget: String(formData.budgetMin),         // ← Use range
  max_budget: String(quote?.total || formData.budgetMax),
});
```

### FIX #2: Remove shoot_type from Search Params (Optional)

The `shoot_type` parameter is event-specific and may not be used by the creator search API. It can be removed from the search params if the backend doesn't use it for filtering.

### FIX #3: Verify Backend API Expectations

**Action Items:**
1. Confirm backend API endpoint: `GET /v1/creators/search`
2. Verify which parameters are required vs optional
3. Test if location requires geocoding or accepts plain text
4. Confirm content_type vs content_types usage

---

## VERIFICATION CHECKLIST

After implementing fixes:

- [ ] Form data includes contentType array
- [ ] contentType is converted to comma-separated string
- [ ] Search URL includes content_types parameter
- [ ] Budget range (min/max) is passed instead of single value
- [ ] Location is in correct format for backend
- [ ] API returns creators matching the roles
- [ ] Empty state only shows when truly no matches exist

---

## RECENT CHANGES CONTEXT

**Relevant Commits:**
- `f50e7ca` - Step 3 of new book a shoot page (added DateTime step)
- `438c0ee` - Steps 1&2 of new book a shoot page (initial form)
- `4831acc` - Step 4 of new book a shoot page (review and submit)
- `6eb6e25` - Implement new pricing system with dynamic quote builder

**Timeline:**
The booking flow was recently built (Dec 24-25, 2025). The handleFindCreative function was updated from a mock implementation to real API integration, but the search parameter mapping wasn't properly aligned with the search API expectations.

---

## RECOMMENDATIONS

### Immediate Actions
1. Add `content_types` parameter to search navigation (CRITICAL)
2. Use budget range instead of single value
3. Test with real booking data to verify fix

### Future Improvements
1. Add TypeScript type safety for URL parameters
2. Create shared constants for parameter names
3. Add validation before navigation
4. Implement proper location geocoding if needed
5. Add error tracking to identify missing parameters
6. Consider using booking_id to fetch search criteria from backend

---

## TESTING NOTES

**Test Case:**
1. Fill booking form with:
   - Content Type: Videographer + Photographer
   - Shoot Type: Wedding
   - Location: New York, NY
   - Budget: $2000-$5000
2. Submit form
3. Verify URL: `/search-results?booking_id=X&content_types=videographer,photographer&location=New York, NY&min_budget=2000&max_budget=5000`
4. Verify API call includes content_types
5. Verify creators are returned

**Expected Backend Query:**
```
GET /v1/creators/search?content_types=videographer,photographer&location=New York, NY&min_budget=2000&max_budget=5000&page=1&limit=20
```
