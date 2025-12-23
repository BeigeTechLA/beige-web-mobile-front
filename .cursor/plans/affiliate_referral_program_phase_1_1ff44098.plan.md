---
name: Affiliate Referral Program Phase 1
overview: Build an MVP affiliate/referral system that auto-creates affiliate accounts on signup, tracks referral codes at checkout, and provides basic dashboards for affiliates and admins with a fixed 200 SAR payout per successful booking.
todos:
  - id: db-migration
    content: Create SQL migration for affiliates, referrals, and affiliate_payouts tables
    status: completed
  - id: backend-models
    content: "Create Sequelize models: affiliates.js, referrals.js, affiliate_payouts.js"
    status: completed
    dependencies:
      - db-migration
  - id: affiliate-controller
    content: Create affiliate.controller.js with CRUD, code validation, and dashboard stats
    status: completed
    dependencies:
      - backend-models
  - id: affiliate-routes
    content: Create affiliate.routes.js with public and authenticated endpoints
    status: completed
    dependencies:
      - affiliate-controller
  - id: modify-registration
    content: Modify auth.controller.js register() to auto-create affiliate record on signup
    status: completed
    dependencies:
      - backend-models
  - id: modify-payment
    content: Modify payments.controller.js to accept referral_code and create referral record
    status: completed
    dependencies:
      - backend-models
  - id: admin-endpoints
    content: Add admin endpoints for affiliate management and payout approval
    status: completed
    dependencies:
      - affiliate-controller
  - id: frontend-checkout
    content: Add referral code input field to StripePaymentForm.tsx with validation
    status: completed
    dependencies:
      - affiliate-routes
  - id: frontend-api
    content: Add affiliateApi to lib/api.ts and Redux slice for affiliate state
    status: completed
    dependencies:
      - affiliate-routes
  - id: affiliate-dashboard
    content: Create /affiliate/dashboard page with stats and earnings breakdown
    status: completed
    dependencies:
      - frontend-api
---

# Affiliate & Referral Program - Phase 1 MVP

## Architecture Overview

```mermaid
flowchart TB
    subgraph Frontend["Frontend (revure-v2-landing)"]
        Checkout[Checkout Page]
        AffiliateDash[Affiliate Dashboard]
    end
    
    subgraph Backend["Backend (revure-v2-backend)"]
        AffiliateAPI[Affiliate API]
        PaymentAPI[Payment API]
        AdminAPI[Admin API]
    end
    
    subgraph Database["Database"]
        Affiliates[(affiliates)]
        Referrals[(referrals)]
        Payouts[(affiliate_payouts)]
        PaymentTx[(payment_transactions)]
    end
    
    Checkout -->|validate referral code| AffiliateAPI
    Checkout -->|submit with referral_code| PaymentAPI
    PaymentAPI -->|create referral record| Referrals
    AffiliateDash -->|get stats| AffiliateAPI
    AdminAPI -->|approve payouts| Payouts
    Referrals --> PaymentTx



```