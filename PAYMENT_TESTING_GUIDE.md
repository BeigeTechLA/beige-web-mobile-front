# Payment Page Testing Guide

Quick reference for testing the payment page implementation.

## Setup

1. **Add Stripe Key**
   ```bash
   # In .env file
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
   ```

2. **Start Development Server**
   ```bash
   yarn dev
   ```

3. **Navigate to Payment Page**
   ```
   http://localhost:3000/search-results/[creatorId]/payment
   ```

## Stripe Test Cards

Use these test card numbers for testing:

| Card Number         | Result                    |
|---------------------|---------------------------|
| 4242 4242 4242 4242 | Success                   |
| 4000 0000 0000 9995 | Insufficient funds        |
| 4000 0000 0000 0002 | Card declined             |
| 4000 0025 0000 3155 | 3D Secure required        |

**For all cards:**
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- Name: Any name

## Test Scenarios

### 1. Loading State
- Navigate to payment page
- Should see loading spinner
- Should load creator, reviews, equipment data

### 2. Creator Not Found
- Navigate to: `/search-results/invalid-id/payment`
- Should show "Creator Not Found" message
- Should have "Back to Search" button

### 3. Booking Form Validation
- Try submitting without filling required fields
- Should show toast error: "Please fill in all required booking details"
- Fill all fields and submit - should proceed to payment

### 4. Equipment Selection
- Select/deselect equipment items
- Verify pricing breakdown updates in real-time
- Check equipment cost appears in summary

### 5. Hours Calculation
- Change hours in booking form
- Verify CP Cost updates: hourly_rate × hours
- Verify Total updates accordingly

### 6. Payment Flow - Success
1. Fill booking form completely
2. Click "Proceed to Payment"
3. Enter test card: 4242 4242 4242 4242
4. Enter cardholder name
5. Click "Confirm & Pay"
6. Should see success screen with correct amount
7. Click "View Booking Summary"

### 7. Payment Flow - Failure
1. Fill booking form
2. Proceed to payment
3. Use declined card: 4000 0000 0000 0002
4. Should show error toast
5. Should remain on payment page

### 8. Responsive Design
- Test on desktop (>1024px)
- Test on tablet (768-1023px)
- Test on mobile (<767px)
- Verify all elements are readable and clickable

### 9. Navigation
- Click "Back" button
- Should return to search results
- Preserve shootId query param if present

### 10. Reviews Display
- Verify reviews show correctly
- Check rating stars display
- Verify date formatting
- Test with 0, 1, 3, 5 reviews

## API Mock Testing (If Backend Not Ready)

If backend endpoints aren't ready, you can test with mock data:

1. **Update `/lib/api.ts`** - Add fallback mock data:

```typescript
export const creatorApi = {
  getById: async (creatorId: string): Promise<Creator> => {
    try {
      const response = await api.get(`/creators/${creatorId}`);
      return response.data;
    } catch (error) {
      // Mock fallback for testing
      return {
        id: creatorId,
        name: "Test Creator",
        role: "Photographer",
        hourly_rate: 150,
        location: "New York, NY",
        profile_image: "/images/avater-details.png",
        rating: 4.8,
        reviews_count: 42,
      };
    }
  },
};
```

## Browser Console Checks

Open browser console and verify:

1. No TypeScript errors
2. No React warnings
3. API calls logging correctly
4. Payment intent created successfully
5. State updates logging as expected

## Expected Console Logs

```
Processing payment... { shootId, amount, creator }
Payment successful!
Shoot name: [user input]
```

## Error Scenarios to Test

1. **Network Error**
   - Disconnect internet
   - Should show appropriate error toast

2. **Invalid Creator ID**
   - Use non-existent ID
   - Should show creator not found page

3. **Stripe Loading Error**
   - Invalid Stripe key
   - Should disable payment button

4. **Form Validation**
   - Empty required fields
   - Should prevent submission
   - Should show error message

## Performance Checks

- [ ] Page loads within 3 seconds
- [ ] API calls complete within 2 seconds
- [ ] No layout shifts during loading
- [ ] Smooth animations (60fps)
- [ ] Images load progressively

## Accessibility Checks

- [ ] Tab through all form fields
- [ ] All inputs have labels
- [ ] Error messages are announced
- [ ] Color contrast meets WCAG AA
- [ ] Focus states are visible

## Cross-Browser Testing

Test on:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Known Limitations

1. **Backend Integration**: Requires backend API endpoints to be implemented
2. **Payment Confirmation**: Requires Stripe webhook setup for production
3. **Email Notifications**: Not yet implemented
4. **Booking History**: Not yet implemented
5. **Refunds**: Not yet implemented

## Troubleshooting

### Issue: "Failed to load creator information"
- Check API endpoint is accessible
- Verify creator ID exists in database
- Check network tab for API response

### Issue: "Failed to initialize payment"
- Verify Stripe key is set in .env
- Check payment intent endpoint
- Verify amount is greater than 0

### Issue: Stripe Elements not loading
- Verify NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set
- Check browser console for Stripe errors
- Ensure @stripe packages are installed

### Issue: Form validation not working
- Check browser console for errors
- Verify all required fields have values
- Check toast notifications are working

## Production Checklist

Before deploying to production:

- [ ] Replace Stripe test key with live key
- [ ] Set up Stripe webhooks
- [ ] Configure backend API endpoints
- [ ] Add error tracking (e.g., Sentry)
- [ ] Enable payment confirmation emails
- [ ] Add booking receipt generation
- [ ] Set up payment audit logging
- [ ] Configure refund policy
- [ ] Add terms and conditions
- [ ] Test with real payment methods

## Contact

For issues or questions about the payment implementation:
- Check `/PAYMENT_IMPLEMENTATION.md` for technical details
- Review `/app/search-results/[creatorId]/payment/README.md` for component docs
