---
name: Booking Flow Enhancements
overview: Implement 8 enhancements to the booking flow including multicheck dropdown, dynamic pricing tooltips, crew size management, cart icon, dynamic headings, Google Sheets integration, and payment status updates.
todos:
  - id: remove-price-matchmaking
    content: Remove price display from MatchedCreatorCard and CreatorCard components
    status: completed
  - id: dynamic-heading
    content: Update SimilarCreatorsSection heading to be dynamic based on content type
    status: completed
  - id: multicheck-dropdown
    content: Convert Edit Type dropdown to support multiple selections
    status: completed
  - id: pricing-tooltips
    content: Add hover tooltips showing rates on content type buttons in Step 1
    status: completed
  - id: dynamic-crew-size
    content: Implement dynamic crew size with service quantity controls in Step 2
    status: completed
    dependencies:
      - multicheck-dropdown
  - id: cart-icon
    content: Add cart icon to Navbar showing crew size on search/matchmaking pages
    status: completed
    dependencies:
      - dynamic-crew-size
  - id: google-sheets-booking
    content: "Backend: Add Google Sheets sync for bookings on creation"
    status: completed
  - id: payment-status-update
    content: "Backend: Update booking status when payment is completed"
    status: completed
---

# Booking Flow Enhancements Plan

## 1. Edit Type Dropdown - Multicheck Support

**File:** [`components/book-a-shoot/DropdownSelect.tsx`](components/book-a-shoot/DropdownSelect.tsx)Create a new `MultiSelectDropdown` component or extend `DropdownSelect` with a `multiSelect` prop:

- Change radio buttons to checkboxes
- Support array values instead of single string
- Display selected items as pills with remove buttons
- Update [`Step1ProjectDetails.tsx`](components/book-a-shoot/Step1ProjectDetails.tsx) to use array for `editType`

---

## 2. Price Hover Tooltips on Content Type (Step 1)

**Files:** [`components/book-a-shoot/Step1ProjectDetails.tsx`](components/book-a-shoot/Step1ProjectDetails.tsx)

- Fetch base rates from pricing API catalog for videographer/photographer/cinematographer
- Add tooltip component that appears on hover showing hourly rate (e.g., "From $150/hr")
- Use existing [`lib/redux/features/pricing/pricingApi.ts`](lib/redux/features/pricing/pricingApi.ts) to get rates

---

## 3. Dynamic Crew Size with Service Quantity Controls (Step 2)

**Files:**

- [`components/book-a-shoot/Step2MoreDetails.tsx`](components/book-a-shoot/Step2MoreDetails.tsx)
- [`app/book-a-shoot/page.tsx`](app/book-a-shoot/page.tsx)
- Change crew size input to numeric stepper
- When user sets crew size (e.g., 5), dynamically generate service rows based on selected content types from Step 1
- Each service row shows the content type (videographer, photographer, etc.) with quantity controls
- Total across all services should not exceed crew size
- Store as `crewBreakdown: { videographer: 2, photographer: 3 }` in booking data

---

## 4. Remove Price from Matchmaking Screen

**Files:**

- [`app/search-results/components/MatchedCreatorCard.tsx`](app/search-results/components/MatchedCreatorCard.tsx)
- [`app/search-results/components/CreatorCard.tsx`](app/search-results/components/CreatorCard.tsx)
- Remove the `{price}` display from both card components
- Remove the price prop passing from parent components

---

## 5. Dynamic Cart Icon Based on Crew Size

**Files:**

- [`src/components/landing/Navbar.tsx`](src/components/landing/Navbar.tsx)
- Create new: `components/ui/CartIcon.tsx`
- [`lib/redux/features/pricing/pricingSlice.ts`](lib/redux/features/pricing/pricingSlice.ts)
- Add crew size to Redux state for cross-page access
- Create `CartIcon` component with badge showing crew count
- Conditionally render in Navbar only on `/search-results` and `/search-results/[creatorId]` pages
- Icon shows total crew members selected

---

## 6. Dynamic Section Heading Based on Content Type

**File:** [`app/search-results/components/SimilarCreatorsSection.tsx`](app/search-results/components/SimilarCreatorsSection.tsx)

- Pass `contentTypes` from URL params to component
- Update heading from "We Think You'll Love These" to "We Think You'll Love These {ContentType}s"
- Handle multiple content types (e.g., "Videographers & Photographers")
- Capitalize and pluralize correctly

---

## 7. Google Sheets Sync on Booking Creation

**Backend Files:**

- [`src/utils/googleSheetsService.js`](revure-v2-backend/src/utils/googleSheetsService.js) - Add booking sync function
- [`src/controllers/guest-bookings.controller.js`](revure-v2-backend/src/controllers/guest-bookings.controller.js) - Call sync on creation

Create `appendBookingToSheet()` function mirroring the existing investor integration:

- Columns: Booking ID, Project Name, Guest Email, Event Type, Event Date, Location, Budget, Crew Size, Content Types, Created At
- Use separate spreadsheet ID env var: `BOOKING_SPREADSHEET_ID`

---

## 8. Update Booking Status on Payment Completion

**Backend Files:**

- [`src/controllers/payments.controller.js`](revure-v2-backend/src/controllers/payments.controller.js)
- [`src/models/stream_project_booking.js`](revure-v2-backend/src/models/stream_project_booking.js)

In `confirmPayment` controller:

- After successful payment confirmation, update the associated booking's status
- Add `payment_status` field or use existing status fields
- Set `is_completed = 1` or add new `payment_completed_at` timestamp

---

## Implementation Order

1. Start with simpler UI changes (Points 4, 6)
2. Implement multicheck dropdown (Point 1)
3. Add pricing tooltips (Point 2)
4. Build dynamic crew size (Point 3)