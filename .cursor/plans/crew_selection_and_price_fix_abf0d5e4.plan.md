---
name: Crew Selection and Price Fix
overview: Implement an "Add to Crew" cart system that allows users to select multiple creators up to their crew size limit, and remove price display from all pages (search results and creator profile).
todos:
  - id: extend-booking-slice
    content: Add selectedCreators state, actions (add/remove/clear), and selectors to bookingSlice
    status: completed
  - id: update-cart-icon
    content: Update CartIcon to show X/Y progress and dropdown with selected creators
    status: completed
  - id: update-matched-card
    content: Add 'Add to Crew' button logic to MatchedCreatorCard
    status: completed
  - id: update-creator-card
    content: Add 'Add to Crew' button logic to CreatorCard
    status: completed
  - id: update-profile-page
    content: Remove price section and add crew selection button to creator profile
    status: completed
  - id: update-search-page
    content: Pass hourlyRate to creator card components
    status: completed
---

# Crew Selection Cart System and Price Removal

## Current State

- **Cart Icon**: Already exists in navbar ([`components/ui/CartIcon.tsx`](components/ui/CartIcon.tsx)) but only shows crew size, not selected creators
- **Booking State**: Redux slice exists ([`lib/redux/features/booking/bookingSlice.ts`](lib/redux/features/booking/bookingSlice.ts)) with `crewSize` and `crewBreakdown`
- **Price Display**: Already removed from search result cards, but still shows on creator profile page ([`app/search-results/[creatorId]/page.tsx`](app/search-results/[creatorId]/page.tsx) lines 221-234)

## Implementation Plan

### 1. Extend Redux Booking Slice for Selected Creators

Update [`lib/redux/features/booking/bookingSlice.ts`](lib/redux/features/booking/bookingSlice.ts):

```typescript
interface SelectedCreator {
  id: string;
  name: string;
  role: string;
  image: string;
  hourlyRate: number;
}

interface BookingState {
  // ... existing fields
  selectedCreators: SelectedCreator[];
}
```

Add actions: `addCreator`, `removeCreator`, `clearSelectedCreators`Add selectors: `selectSelectedCreators`, `selectSelectedCreatorIds`, `selectIsCrewComplete`

### 2. Update CartIcon Component

Modify [`components/ui/CartIcon.tsx`](components/ui/CartIcon.tsx) to show progress like "2/4" (selected/total crew size) and add a dropdown showing selected creators with remove option.

### 3. Update Creator Cards with "Add to Crew" Button

Modify both:

- [`app/search-results/components/MatchedCreatorCard.tsx`](app/search-results/components/MatchedCreatorCard.tsx)
- [`app/search-results/components/CreatorCard.tsx`](app/search-results/components/CreatorCard.tsx)

Changes:

- Add `hourlyRate` prop (needed for selection tracking)
- Replace "Book Now"/"View Profile" with conditional button:
- If creator already selected: Show "Remove" button (red)
- If crew is full: Show "View Profile" button (link only)
- Otherwise: Show "Add to Crew" button (primary action)

### 4. Update Creator Profile Page

Modify [`app/search-results/[creatorId]/page.tsx`](app/search-results/[creatorId]/page.tsx):

- Remove the "Starting Price" section (lines 221-234)
- Replace "Proceed to Payment" with "Add to Crew" / "Remove from Crew" button based on selection state

### 5. Update Search Results Page to Pass Hourly Rate

Modify [`app/search-results/page.tsx`](app/search-results/page.tsx) to include `hourlyRate` in the `transformCreator` function.

### 6. Add Crew Selection Summary/Checkout Flow

Add a floating "Proceed to Payment" button that appears when crew selection is complete, or show validation message when trying to proceed with incomplete crew.---

## Data Flow Diagram

```mermaid
flowchart TD
    Step2[Step 2: Set Crew Size=4] --> Redux[Redux: crewSize=4, selectedCreators=[]]
    Redux --> SearchResults[Search Results Page]
    SearchResults --> CartIcon[Cart Icon: 0/4]
    
    AddCreator1[Click Add to Crew] --> Redux
    Redux --> CartIcon2[Cart Icon: 1/4]
    
    AddCreator4[Add 3 more creators] --> Redux
    Redux --> CartIcon3[Cart Icon: 4/4 Complete]
    
    CartIcon3 --> PaymentBtn[Proceed to Payment Button Enabled]
    PaymentBtn --> Payment[Payment Page]
```

---

## Files to Modify