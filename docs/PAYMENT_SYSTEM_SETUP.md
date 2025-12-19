# Payment System Setup Guide

**Date:** December 19, 2025
**Status:** 🚧 In Progress
**Priority:** High - Core Feature

---

## Overview

Comprehensive payment system with:
- Dynamic creator pricing (hourly rate × hours)
- Equipment rental pricing
- 25% Beige platform margin (configurable, hidden from users)
- Stripe payment integration
- Review display for trust
- Complete booking form

---

## Environment Variables Required

### Backend (.env in beige-server)

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Payment Configuration
BEIGE_MARGIN_PERCENT=25
```

### Frontend (.env in revure-v2-landing)

```env
# Stripe Publishable Key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...

# API Endpoint (already configured)
NEXT_PUBLIC_API_ENDPOINT=https://revure-api.beige.app/v1/
```

---

## Stripe Setup

### 1. Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up or log in
3. Complete business verification

### 2. Get API Keys

**Test Mode (Development):**
1. Go to Developers → API Keys
2. Copy **Publishable key** (starts with `pk_test_`)
3. Copy **Secret key** (starts with `sk_test_`)

**Live Mode (Production):**
1. Switch to "Live mode" toggle
2. Copy **Live Publishable key** (`pk_live_`)
3. Copy **Live Secret key** (`sk_live_`)

### 3. Configure Webhooks

1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `.`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy **Signing secret** (`whsec_...`)

---

## Pricing Calculation Logic

### How It Works

```javascript
// User inputs
hours = 3
equipment_selected = [
  { id: 45, price: 120 },
  { id: 67, price: 80 }
]

// Backend calculation
creator.hourly_rate = 150

cp_cost = 150 × 3 = $450
equipment_cost = 120 + 80 = $200
subtotal = 450 + 200 = $650

// Beige platform margin (25%, configurable)
beige_margin = 650 × 0.25 = $162.50

// Total charged to customer
total_amount = 650 + 162.50 = $812.50
```

### Frontend Display

**User sees:**
```
Creator Fee: $450 (3 hrs × $150/hr)
Equipment: $200
―――――――――――――――
Total: $812.50
```

**User does NOT see:**
- Beige margin amount ($162.50)
- Margin percentage (25%)

**Platform keeps:**
- $162.50 commission from this booking

---

## Database Schema

### payment_transactions Table

```sql
CREATE TABLE payment_transactions (
  payment_id INT PRIMARY KEY AUTO_INCREMENT,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_charge_id VARCHAR(255),

  creator_id INT NOT NULL,
  user_id INT NULL,
  guest_email VARCHAR(255) NULL,

  hours DECIMAL(5,2) NOT NULL,
  cp_cost DECIMAL(10,2) NOT NULL,
  equipment_cost DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL,

  beige_margin_percent DECIMAL(5,2) NOT NULL,
  beige_margin_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,

  shoot_date DATE NOT NULL,
  location VARCHAR(255) NOT NULL,
  shoot_type VARCHAR(100),
  special_requests TEXT,

  status ENUM('pending', 'succeeded', 'failed', 'refunded') DEFAULT 'pending',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (creator_id) REFERENCES crew_members(crew_member_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  INDEX idx_stripe_intent (stripe_payment_intent_id),
  INDEX idx_status (status)
);
```

### payment_equipment Table

```sql
CREATE TABLE payment_equipment (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payment_id INT NOT NULL,
  equipment_id INT NOT NULL,
  equipment_price DECIMAL(10,2) NOT NULL,

  FOREIGN KEY (payment_id) REFERENCES payment_transactions(payment_id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id)
);
```

---

## API Endpoints

### Create Payment Intent

**POST** `/v1/payments/create-intent`

**Request:**
```json
{
  "creator_id": 123,
  "hours": 3,
  "equipment_ids": [45, 67],
  "shoot_date": "2025-12-25",
  "location": "Los Angeles, CA",
  "shoot_type": "Event Photography",
  "special_requests": "Need outdoor lighting setup",
  "user_id": 456,
  "guest_email": null
}
```

**Response:**
```json
{
  "success": true,
  "client_secret": "pi_3Abc123_secret_xyz789",
  "payment_id": 1001,
  "breakdown": {
    "cp_cost": 450.00,
    "equipment_cost": 200.00,
    "total": 812.50
  }
}
```

### Confirm Payment

**POST** `/v1/payments/confirm`

**Request:**
```json
{
  "payment_intent_id": "pi_3Abc123",
  "payment_id": 1001
}
```

**Response:**
```json
{
  "success": true,
  "status": "succeeded",
  "booking_id": 5678
}
```

### Stripe Webhook

**POST** `/v1/payments/webhook`

Automatically called by Stripe when payment events occur.

---

## Frontend Integration

### Install Dependencies

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Payment Page Structure

```tsx
/search-results/[creatorId]/payment
├── Dynamic CP Profile (fetched from API)
├── Last Reviews (5 most recent)
├── Booking Form
│   ├── Hours Input
│   ├── Date Picker
│   ├── Location Input
│   └── Shoot Type Dropdown
├── Equipment Selection (checkboxes)
├── Live Pricing Calculator
└── Stripe Payment Form
```

---

## Testing

### Test Cards (Stripe Test Mode)

**Successful Payment:**
```
4242 4242 4242 4242
Any future expiry (e.g., 12/25)
Any 3-digit CVC
Any ZIP code
```

**Declined Card:**
```
4000 0000 0000 0002
```

**Requires Authentication (3D Secure):**
```
4000 0025 0000 3155
```

### Test Flow

1. Navigate to `/search-results/123/payment`
2. Fill booking form:
   - Hours: 3
   - Date: Tomorrow
   - Location: "New York, NY"
   - Shoot Type: "Event Photography"
3. Select equipment (2 items)
4. Verify pricing updates live
5. Enter test card: 4242 4242 4242 4242
6. Submit payment
7. Verify success message
8. Check database for payment record

---

## Security Considerations

### Backend

- ✅ Validate all inputs (hours, date, equipment existence)
- ✅ Verify Stripe webhook signatures
- ✅ Use environment variables for secrets
- ✅ Prevent duplicate payments (check payment_intent_id)
- ✅ Log all payment attempts

### Frontend

- ✅ Use Stripe Elements (PCI compliant, no card data touches server)
- ✅ Validate form before submission
- ✅ Show loading states during payment
- ✅ Handle errors gracefully
- ✅ Use HTTPS only

---

## Deployment Checklist

### Backend (EC2)

- [ ] Add Stripe keys to environment
- [ ] Run database migrations
- [ ] Install stripe npm package
- [ ] Deploy payment controller
- [ ] Test webhook endpoint
- [ ] Configure Stripe webhook URL

### Frontend (Vercel)

- [ ] Add Stripe publishable key to env
- [ ] Deploy payment page updates
- [ ] Test end-to-end flow
- [ ] Verify pricing calculations

---

## Troubleshooting

### Payment Intent Creation Fails

**Error:** "Creator not found"
- Check creator_id exists in database
- Verify creator is active/available

**Error:** "Equipment not found"
- Check equipment_ids are valid
- Ensure equipment belongs to creator

### Stripe Payment Fails

**Error:** "Card declined"
- User's card was declined by bank
- Show error message, allow retry

**Error:** "Invalid API key"
- Check STRIPE_SECRET_KEY is correct
- Verify test/live mode consistency

### Webhook Not Receiving Events

- Verify webhook URL is publicly accessible
- Check webhook signing secret is correct
- Review Stripe Dashboard → Webhooks → Logs

---

## Future Enhancements

1. **Refund Support**
   - Add refund endpoint
   - Partial refund capability

2. **Payment Plans**
   - Split payments (deposit + final)
   - Installment options

3. **Analytics**
   - Track conversion rates
   - Popular equipment
   - Average booking value

4. **Receipts**
   - Email receipts automatically
   - PDF invoice generation

---

## Support Resources

- [Stripe Documentation](https://stripe.com/docs/api)
- [Stripe Elements React](https://stripe.com/docs/stripe-js/react)
- [Payment Intents Guide](https://stripe.com/docs/payments/payment-intents)
- [Testing Guide](https://stripe.com/docs/testing)

---

*Last Updated: December 19, 2025*
*Status: Backend and frontend implementation in progress*
