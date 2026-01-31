# Payment Amount Fix - Discount Code Integration

## Issue Discovered
After successfully implementing the discount code feature, we discovered that the payment page was charging the wrong amount:
- **UI Display**: Correctly showed discounted price ($55 for 99% off)
- **Actual Payment**: Was charging the full subtotal ($4400)

## Root Cause
The payment page was hardcoded to use `quote.subtotal` for both:
1. Creating the Stripe payment intent (line 530)
2. Displaying the payment button amount (line 728)

This was intentional to "avoid discounts and margins" but broke when we added sales rep discount codes.

## Fix Applied

### Backend (Already Fixed)
✅ `guest-bookings.controller.js` - `getBookingPaymentDetails` endpoint now returns actual discount data from database instead of hardcoded zeros

### Frontend (Fixed Now)

#### 1. Payment Intent Creation
**File**: `app/search-results/payment/page.tsx`
**Line**: ~530

**Before**:
```typescript
amount: quote.subtotal, // Always charged full price
```

**After**:
```typescript
amount: quote.total, // Uses total which includes discounts and margins
```

#### 2. Payment Button Display
**File**: `app/search-results/payment/page.tsx`
**Line**: ~728

**Before**:
```typescript
<StripePaymentFormMulti
  amount={quote.subtotal}  // Button showed wrong amount
  ...
/>
```

**After**:
```typescript
<StripePaymentFormMulti
  amount={quote.total}  // Button shows correct amount
  ...
/>
```

## How It Works Now

### Quote Structure
The quote object has these key fields:
- `subtotal`: Base price before any discounts/margins
- `discount_percent`: Discount percentage (from sales rep code)
- `discount_amount`: Dollar amount of discount
- `price_after_discount`: subtotal - discount_amount
- `margin_percent`: Beige margin percentage (0 for V3, 25% for V2)
- `margin_amount`: Dollar amount of margin
- `total`: **FINAL AMOUNT** = price_after_discount + margin_amount

### Flow
1. **V3 Booking** (skip_discount: true, skip_margin: true)
   - No auto hour-based discount
   - No Beige margin
   - `total` = `subtotal`

2. **Sales Rep Applies Discount Code**
   - Manual discount is saved to quote
   - `discount_amount` is set
   - `total` = subtotal - discount_amount + margin_amount

3. **Payment Page**
   - Loads quote via `getBookingPaymentDetails`
   - Creates payment intent with `quote.total`
   - Shows button with `quote.total`
   - Displays breakdown with discount line item

## V3 Booking Flow Confirmed
✅ `V3Step4BookConfirm.tsx` correctly passes:
```typescript
skip_discount: true,  // Remove hour-based discounts
skip_margin: true,    // Remove Beige margin
```

✅ `pricing.service.js` correctly respects these flags:
```javascript
const discountPercent = skipDiscount ? 0 : await getDiscountPercent(shootHours, pricingMode);
const effectiveMarginToApply = skipMargin ? 0 : effectiveMargin;
```

## Testing Checklist
- [ ] Refresh payment page after applying discount code
- [ ] Verify "Discount Applied" line shows correct amount
- [ ] Verify "Total" shows correct final amount
- [ ] Verify payment button shows correct amount
- [ ] Complete test payment and verify Stripe charge is correct amount
- [ ] Test with different discount percentages (10%, 50%, 100%)
- [ ] Test with booking that has margin vs no margin

## Related Files
- `app/search-results/payment/page.tsx` - Payment page (FIXED)
- `src/controllers/guest-bookings.controller.js` - Payment details endpoint (FIXED)
- `components/book-a-shoot/v3/V3Step4BookConfirm.tsx` - V3 booking flow (VERIFIED)
- `src/services/pricing.service.js` - Quote calculation (VERIFIED)

## Date Fixed
January 31, 2026
