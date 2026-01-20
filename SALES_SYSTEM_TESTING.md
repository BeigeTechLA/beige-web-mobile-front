# Sales Discount System - Testing Guide

## 🎯 Implementation Status: COMPLETE ✅

All features have been implemented and are ready for testing.

---

## 📋 Pre-Testing Setup

### 1. Run Database Migration (Backend)

```bash
cd /Users/amrik/Documents/revure/revure-v2-backend

# Run the migration SQL script
mysql -u your_username -p your_database < migrations/20260121_01_create_sales_system_tables.sql

# Or using your preferred MySQL client
```

### 2. Create Sales Rep Test Account

You'll need a user with `role = 'sales_rep'` or `role = 'admin'` to access the sales dashboard.

```sql
-- Update an existing user to sales_rep
UPDATE users SET role = 'sales_rep' WHERE email = 'test@example.com';

-- Or create a new user
INSERT INTO users (email, password, name, role, created_at) 
VALUES ('salesrep@test.com', 'hashed_password', 'Test Sales Rep', 'sales_rep', NOW());
```

### 3. Environment Variables (Verify)

Ensure these are set in your backend `.env`:

```env
DISCOUNT_CODE_PREFIX=REV
DISCOUNT_CODE_LENGTH=8
JWT_SECRET=your_secret
STRIPE_SECRET_KEY=your_stripe_key
```

### 4. Start Services

```bash
# Terminal 1 - Backend
cd /Users/amrik/Documents/revure/revure-v2-backend
npm run dev

# Terminal 2 - Frontend
cd /Users/amrik/Documents/revure/revure-v2-landing
npm run dev
```

---

## 🧪 Testing Flows

### Flow 1: Self-Serve Lead Tracking

**Objective:** Verify that self-serve leads are automatically tracked.

1. **Start Booking**
   - Visit: `http://localhost:3000/book-a-shoot`
   - Complete Step 1 and click "Next"
   - ✅ **Expected:** Lead created with `lead_type = 'self_serve'`, `lead_status = 'in_progress_self_serve'`

2. **Reach Payment Page**
   - Complete booking details
   - Navigate to payment page
   - ✅ **Expected:** Lead updated with `lead_status = 'in_progress_self_serve'` (still)

3. **Check Sales Dashboard**
   - Login as sales rep
   - Visit: `http://localhost:3000/sales/dashboard`
   - Go to Leads page: `http://localhost:3000/sales/leads`
   - ✅ **Expected:** See the lead in the table

**Verification Queries:**
```sql
SELECT * FROM sales_leads ORDER BY created_at DESC LIMIT 5;
SELECT * FROM sales_lead_activities ORDER BY created_at DESC LIMIT 10;
```

---

### Flow 2: Sales-Assisted Lead (Contact Sales)

**Objective:** Test "Talk To Someone" button functionality.

1. **Create Booking & Reach Payment**
   - Complete booking flow
   - Navigate to payment page: `/search-results/[creatorId]/payment?shootId=123`

2. **Click "Talk To Someone"**
   - Click the button in the right sidebar
   - ✅ **Expected:** Toast notification: "Sales team has been notified!"
   - ✅ **Expected:** Lead updated with `lead_type = 'sales_assisted'`, `lead_status = 'in_progress_sales_assisted'`
   - ✅ **Expected:** `contacted_sales_at` timestamp set
   - ✅ **Expected:** Lead auto-assigned to a sales rep (round-robin)

3. **Verify in Dashboard**
   - Visit `/sales/leads`
   - Filter by "Sales Assisted" type
   - ✅ **Expected:** See the lead with assigned sales rep

**Verification Queries:**
```sql
SELECT 
  sl.*,
  u.name as sales_rep_name
FROM sales_leads sl
LEFT JOIN users u ON sl.assigned_sales_rep_id = u.id
WHERE sl.lead_type = 'sales_assisted'
ORDER BY sl.created_at DESC;
```

---

### Flow 3: Generate & Use Discount Code

**Objective:** Test discount code generation and application.

1. **Generate Discount Code**
   - Login as sales rep
   - Go to: `/sales/leads`
   - Click on a lead to view details
   - Click "Generate Discount Code"
   - Fill form:
     - Type: Percentage
     - Value: 15%
     - Usage: One-time use
     - Expiration: (optional) 7 days from now
   - Click "Generate Code"
   - ✅ **Expected:** Code generated (e.g., `REV7A3B2C`)
   - ✅ **Expected:** Copy button available
   - Click "Copy" and note the code

2. **Apply Discount on Payment Page**
   - As a customer, navigate to payment page
   - Find "Have a discount code?" section
   - Enter the generated code
   - Click "Apply"
   - ✅ **Expected:** Green success banner appears
   - ✅ **Expected:** Pricing breakdown shows discount line item
   - ✅ **Expected:** Total amount reduced correctly

3. **Complete Payment**
   - Complete Stripe payment
   - ✅ **Expected:** Booking created successfully
   - ✅ **Expected:** Lead status updated to `booked`
   - ✅ **Expected:** Discount code marked as used (`used_count = 1`)

**Verification Queries:**
```sql
-- Check discount code
SELECT * FROM discount_codes WHERE code = 'REV7A3B2C';

-- Check usage
SELECT 
  dcu.*,
  sl.lead_status
FROM discount_code_usage dcu
JOIN sales_leads sl ON dcu.lead_id = sl.lead_id
WHERE dcu.code = 'REV7A3B2C';

-- Check booking status
SELECT * FROM stream_project_booking 
WHERE stream_project_booking_id = [your_booking_id];
```

---

### Flow 4: Generate & Use Payment Link

**Objective:** Test payment link generation and redemption.

1. **Generate Payment Link**
   - In sales dashboard, view a lead with a booking
   - Click "Generate Payment Link"
   - Select/link a discount code (or skip)
   - Set expiration: 72 hours
   - Click "Generate Link"
   - ✅ **Expected:** Payment link generated with secure token
   - Copy the full URL (e.g., `http://localhost:3000/payment-link/abc123xyz`)

2. **Open Payment Link**
   - Open the link in an incognito/private window
   - ✅ **Expected:** Landing page shows:
     - Green checkmark
     - "Payment Link Verified"
     - Booking summary
     - Discount code info (if included)
     - 5-second countdown
   - ✅ **Expected:** Auto-redirects to payment page after 5 seconds
   - OR click "Proceed to Payment" immediately

3. **Complete Payment**
   - On payment page, verify:
     - Booking details pre-filled
     - Discount code auto-applied (if included)
     - Pricing correct
   - Complete Stripe payment
   - ✅ **Expected:** Payment successful
   - ✅ **Expected:** Lead status updated to `booked`
   - ✅ **Expected:** Payment link marked as used

4. **Try Reusing Link**
   - Try opening the same payment link again
   - ✅ **Expected:** Error page: "Link Already Used"

**Verification Queries:**
```sql
-- Check payment link
SELECT * FROM payment_links WHERE token = 'abc123xyz';

-- Check if marked as used
SELECT 
  pl.*,
  sl.lead_status
FROM payment_links pl
JOIN sales_leads sl ON pl.lead_id = sl.lead_id
WHERE pl.token = 'abc123xyz';
```

---

### Flow 5: Sales Dashboard Analytics

**Objective:** Verify dashboard statistics and reporting.

1. **View Dashboard Overview**
   - Visit: `/sales/dashboard`
   - Select period: 30 days
   - ✅ **Expected:** See metrics:
     - Total Leads
     - Conversion Rate
     - Total Revenue
     - Booked Leads

2. **Check Leads by Status**
   - ✅ **Expected:** Progress bars showing lead distribution
   - ✅ **Expected:** Percentage calculations correct

3. **Check Quick Stats**
   - ✅ **Expected:** Self-serve vs Sales-assisted breakdown
   - ✅ **Expected:** Discount code stats (active/total)
   - ✅ **Expected:** Payment link stats (used/total)

4. **Check Recent Activities**
   - ✅ **Expected:** Timeline of lead activities
   - ✅ **Expected:** Timestamps show "Xm ago", "Xh ago", etc.

---

### Flow 6: Discount Code Auto-Application (URL Params)

**Objective:** Test discount auto-apply from URL.

1. **Generate Discount Code**
   - Create a discount code via sales dashboard (e.g., `REV15OFF`)

2. **Create Payment URL with Discount**
   - Construct URL: `/search-results/[creatorId]/payment?shootId=123&discount=REV15OFF`
   - Open in browser

3. **Verify Auto-Application**
   - ✅ **Expected:** Discount code automatically applied on page load
   - ✅ **Expected:** Green success banner visible
   - ✅ **Expected:** Pricing shows discount immediately
   - ✅ **Expected:** Discount input shows the code

---

### Flow 7: Edge Cases & Error Handling

**Objective:** Test error scenarios.

1. **Invalid Discount Code**
   - Enter code: `INVALID123`
   - Click "Apply"
   - ✅ **Expected:** Error toast: "Invalid discount code"
   - ✅ **Expected:** Pricing unchanged

2. **Expired Discount Code**
   - Create a discount code with past expiration
   - Try to apply it
   - ✅ **Expected:** Error: "Discount code has expired"

3. **Max Usage Reached**
   - Create multi-use code with `max_uses = 1`
   - Use it once
   - Try to use again
   - ✅ **Expected:** Error: "Discount code usage limit reached"

4. **Expired Payment Link**
   - Create payment link with past expiration
   - Try to open it
   - ✅ **Expected:** Page shows: "Link Expired" with orange clock icon

5. **Invalid Payment Link Token**
   - Visit: `/payment-link/invalid-token-123`
   - ✅ **Expected:** Page shows: "Invalid Payment Link"

---

## 🔍 Database Verification Queries

### Check All Leads
```sql
SELECT 
  sl.lead_id,
  sl.lead_type,
  sl.lead_status,
  sl.client_name,
  sl.guest_email,
  u.name as assigned_to,
  sl.created_at,
  sl.last_activity_at
FROM sales_leads sl
LEFT JOIN users u ON sl.assigned_sales_rep_id = u.id
ORDER BY sl.created_at DESC;
```

### Check Discount Code Usage
```sql
SELECT 
  dc.code,
  dc.discount_type,
  dc.discount_value,
  dc.usage_type,
  dc.used_count,
  dc.max_uses,
  dc.is_active,
  dc.expires_at
FROM discount_codes dc
ORDER BY dc.created_at DESC;
```

### Check Payment Links
```sql
SELECT 
  pl.payment_link_id,
  pl.token,
  pl.booking_id,
  pl.is_used,
  pl.is_expired,
  pl.expires_at,
  pl.used_at,
  dc.code as discount_code
FROM payment_links pl
LEFT JOIN discount_codes dc ON pl.discount_code_id = dc.discount_code_id
ORDER BY pl.created_at DESC;
```

### Check Activities Log
```sql
SELECT 
  sla.activity_type,
  sla.metadata,
  sl.client_name,
  sl.lead_status,
  sla.created_at
FROM sales_lead_activities sla
JOIN sales_leads sl ON sla.lead_id = sl.lead_id
ORDER BY sla.created_at DESC
LIMIT 20;
```

### Check Lead Assignment Distribution
```sql
SELECT 
  u.name as sales_rep,
  u.email,
  COUNT(sl.lead_id) as assigned_leads
FROM users u
LEFT JOIN sales_leads sl ON u.id = sl.assigned_sales_rep_id
WHERE u.role = 'sales_rep'
GROUP BY u.id, u.name, u.email
ORDER BY assigned_leads DESC;
```

---

## 🐛 Common Issues & Fixes

### Issue: Sales dashboard shows 404
**Fix:** Ensure you're logged in with `role = 'sales_rep'` or `role = 'admin'`

### Issue: Discount code not applying
**Fix:** 
1. Check if code is active: `SELECT * FROM discount_codes WHERE code = 'YOUR_CODE';`
2. Verify `is_active = 1`
3. Check expiration date
4. Verify usage limits

### Issue: Payment link not working
**Fix:**
1. Check expiration: `SELECT expires_at, is_expired FROM payment_links WHERE token = 'TOKEN';`
2. Check if already used: `is_used = 0`
3. Verify booking_id exists

### Issue: Lead not appearing in dashboard
**Fix:**
1. Verify lead created: `SELECT * FROM sales_leads WHERE booking_id = [id];`
2. Check filters in dashboard (status, type, assignment)
3. Refresh page

---

## ✅ Completion Checklist

- [ ] Database migration executed successfully
- [ ] Sales rep account created and accessible
- [ ] Self-serve lead tracking works
- [ ] Sales-assisted lead creation works
- [ ] "Talk To Someone" button functional
- [ ] Discount codes can be generated
- [ ] Discount codes can be applied on payment page
- [ ] Discount auto-applies from URL params
- [ ] Payment links can be generated
- [ ] Payment links redirect correctly
- [ ] Payment links expire properly
- [ ] Sales dashboard displays correct data
- [ ] Lead filtering works
- [ ] Recent activities show up
- [ ] All error states display properly
- [ ] Round-robin assignment works

---

## 📊 Success Metrics

After testing, verify:
1. ✅ All 14 features working end-to-end
2. ✅ No console errors in browser
3. ✅ No server errors in backend logs
4. ✅ Database tables populated correctly
5. ✅ User experience smooth and intuitive

---

## 🎉 Next Steps After Testing

1. **Fix any bugs found during testing**
2. **Merge `feat/sales-discount-system` to main**
3. **Deploy to staging/production**
4. **Train sales team on new features**
5. **Monitor analytics and conversion rates**

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check backend server logs
3. Verify database queries above
4. Review the implementation files in the commit history
