# Google Forms Integration - Payment Success Page

## Issue

After successful payment, users were not being redirected to Google Forms to complete detailed shoot information. The success page only showed "View Booking Summary" button.

## Solution

Added Google Forms CTA button to the payment success page, matching the implementation from the single-creator payment flow.

## Changes Made

### File: `app/search-results/payment/page.tsx`

**Location**: Success View (when `step === "success"`)

**Added Features**:

1. **Form URL Selection Logic**:
   - Wedding shoots → Wedding-specific Google Form
   - Other shoots → General Google Form
   - Based on `booking.event_type`

```typescript
const getFormUrl = () => {
  const weddingFormUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLSdg9VNPGWzS0-48TtYCfejktfl2j3Hl4sAD4HSkUoQIMP9WQA/viewform";
  const generalFormUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLSeYWPQXfFBqzt4FHVy6ccrS4WVbjFLHJQeIu56rj_zEinGGfQ/viewform";

  return booking?.event_type?.toLowerCase().includes("wedding")
    ? weddingFormUrl
    : generalFormUrl;
};
```

2. **Google Forms CTA Button**:
   - Primary button: "Complete All The Details For Your Shoot"
   - Opens Google Form in new tab
   - Helper text: "Help us prepare better by providing detailed shoot information"

3. **Updated Button Hierarchy**:
   - Primary (prominent): Google Forms CTA
   - Secondary (subtle): View Booking Summary

## User Flow

```
Payment Succeeded
    ↓
Success Page Displayed
    ↓
User sees Google Forms CTA button
    ↓
User clicks "Complete All The Details For Your Shoot"
    ↓
Google Form opens in new tab (wedding or general)
    ↓
User fills out detailed shoot information
    ↓
[Optional] User clicks "View Booking Summary" to return to booking
```

## Google Forms URLs

### Wedding Form

```
https://docs.google.com/forms/d/e/1FAIpQLSdg9VNPGWzS0-48TtYCfejktfl2j3Hl4sAD4HSkUoQIMP9WQA/viewform
```

### General Form

```
https://docs.google.com/forms/d/e/1FAIpQLSeYWPQXfFBqzt4FHVy6ccrS4WVbjFLHJQeIu56rj_zEinGGfQ/viewform
```

## UI Changes

**Before**:

- Payment Success heading
- Amount paid
- "View Booking Summary" button (primary)

**After**:

- Payment Success heading
- Amount paid
- **"Complete All The Details For Your Shoot" button (primary)**
- Helper text about form purpose
- "View Booking Summary" button (secondary, subtle style)

## Testing Checklist

- [ ] Complete a wedding booking payment
- [ ] Verify Google Forms button appears on success page
- [ ] Click button and verify wedding form opens in new tab
- [ ] Complete a non-wedding booking payment
- [ ] Verify general form opens instead
- [ ] Test on mobile devices
- [ ] Verify "View Booking Summary" button still works

## Related

- Single-creator payment flow already has this feature
- Google Forms collect detailed shoot requirements
- Forms help sales team prepare better for shoots

## Date Added

January 31, 2026

## Next Steps (Optional)

- Track Google Form completion status per booking
- Add reminder in dashboard if form not completed
- Pre-fill Google Form with booking details via URL parameters
