# Payment Page Quick Start Guide

Get the payment page running in 5 minutes.

## Step 1: Install Dependencies (Already Done)

```bash
yarn install
```

Dependencies installed:
- @stripe/stripe-js@8.6.0
- @stripe/react-stripe-js@5.4.1

## Step 2: Configure Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Update `.env`:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
```

## Step 3: Start Development Server

```bash
yarn dev
```

Server runs at: http://localhost:3000

## Step 4: Test the Payment Page

Navigate to:
```
http://localhost:3000/search-results/123/payment
```

Replace `123` with any creator ID from your database.

## Step 5: Test Payment Flow

### Without Backend (Frontend Only Testing)

The page will show error for missing creator data. To test the UI:

1. Check `/lib/api.ts` - it's ready for backend integration
2. Components render correctly even with loading states
3. Use browser DevTools to see API calls being made

### With Backend Ready

If backend endpoints are ready:

1. Creator loads automatically from `/v1/creators/:creatorId`
2. Reviews fetch from `/v1/reviews/by-creator/:creatorId`
3. Equipment loads from `/v1/equipment/by-creator/:creatorId`
4. Fill booking form (all required fields)
5. Click "Proceed to Payment"
6. Enter test card: **4242 4242 4242 4242**
7. Expiry: Any future date (e.g., 12/34)
8. CVC: Any 3 digits (e.g., 123)
9. Name: Any name
10. Click "Confirm & Pay"
11. Success screen appears

## Common Test Cards

| Card                | Result                    |
|---------------------|---------------------------|
| 4242 4242 4242 4242 | Success                   |
| 4000 0000 0000 9995 | Insufficient funds        |
| 4000 0000 0000 0002 | Declined                  |

## Folder Structure

```
revure-v2-landing/
├── app/
│   └── search-results/
│       └── [creatorId]/
│           └── payment/
│               ├── page.tsx                      ← Main page
│               └── components/
│                   ├── BookingForm.tsx          ← Form inputs
│                   ├── EquipmentSelector.tsx    ← Equipment list
│                   ├── PricingBreakdown.tsx     ← Price display
│                   ├── ReviewsList.tsx          ← Reviews
│                   └── StripePaymentForm.tsx    ← Payment
├── lib/
│   └── api.ts                                    ← API client
├── types/
│   └── payment.ts                                ← TypeScript types
└── .env                                          ← Config
```

## What Works Now

- ✓ Full UI components rendered
- ✓ Responsive design (mobile, tablet, desktop)
- ✓ Form validation
- ✓ Real-time pricing calculations
- ✓ Stripe integration ready
- ✓ Loading states
- ✓ Error handling
- ✓ Toast notifications

## What Needs Backend

API endpoints to implement:

```
GET  /v1/creators/:creatorId
GET  /v1/reviews/by-creator/:creatorId?limit=5
GET  /v1/equipment/by-creator/:creatorId
POST /v1/payments/create-intent
POST /v1/bookings/confirm
```

## Example API Response Formats

### Creator Response
```json
{
  "id": "123",
  "name": "John Doe",
  "role": "Photographer",
  "hourly_rate": 150,
  "location": "New York, NY",
  "profile_image": "https://...",
  "rating": 4.8,
  "reviews_count": 42
}
```

### Reviews Response
```json
[
  {
    "id": "r1",
    "rating": 5,
    "comment": "Great work!",
    "reviewer_name": "Jane Smith",
    "reviewer_image": "https://...",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### Equipment Response
```json
[
  {
    "id": "e1",
    "name": "Sony A7III",
    "price": 50,
    "location": "New York, NY",
    "description": "Professional camera"
  }
]
```

### Payment Intent Response
```json
{
  "client_secret": "pi_xxx_secret_xxx",
  "payment_intent_id": "pi_xxx",
  "amount": 200
}
```

## Troubleshooting

### Stripe Elements Not Loading
```bash
# Check .env file
cat .env | grep STRIPE

# Should see:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### API Calls Failing
```bash
# Check API endpoint
cat .env | grep API

# Should see:
NEXT_PUBLIC_API_ENDPOINT=https://revure-api.beige.app/v1/
```

### Build Errors
```bash
# Rebuild
yarn build

# Should see:
✓ Compiled successfully
```

## Development Tips

1. **Check Browser Console** - All API calls are logged
2. **Use React DevTools** - Inspect component state
3. **Network Tab** - Monitor API requests/responses
4. **Toast Notifications** - Show user feedback for all actions

## File Paths (Absolute)

All files located at:
```
/Users/amrik/Documents/revure/revure-v2-landing/
```

Key files:
- `/types/payment.ts` - Types
- `/lib/api.ts` - API client
- `/app/search-results/[creatorId]/payment/page.tsx` - Main page
- `/.env` - Configuration

## Documentation Files

- `PAYMENT_IMPLEMENTATION.md` - Full technical details
- `PAYMENT_TESTING_GUIDE.md` - Testing scenarios
- `app/search-results/[creatorId]/payment/README.md` - Component docs
- `PAYMENT_QUICKSTART.md` - This file

## Support

For detailed information:
1. Check `PAYMENT_IMPLEMENTATION.md` for architecture
2. Check `PAYMENT_TESTING_GUIDE.md` for testing
3. Check component README for specific features

---

**Ready to Go!** 🚀

The payment page is fully implemented and ready for backend integration.
