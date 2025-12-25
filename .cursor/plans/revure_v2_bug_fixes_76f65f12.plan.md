---
name: Revure V2 Bug Fixes
overview: "This plan addresses 7 issues: currency change from SAR to USD, forgot password production URL fix, adding Book A Shoot navigation, logo external redirect, investor form validation fix, Google Sheets integration for investor data, and search results loading flash fix."
todos:
  - id: currency-fix
    content: Change SAR to USD in affiliate dashboard formatCurrency function and text
    status: completed
  - id: book-a-shoot-nav
    content: Add Book A Shoot navigation link to affiliate dashboard sidebar
    status: completed
  - id: loading-flash-fix
    content: Fix search results Suspense fallback to show proper loading state
    status: completed
  - id: logo-redirect
    content: Change logo click in Navbar and Footer to redirect to book.beige.app
    status: completed
  - id: investor-form-fix
    content: Fix investor form MultiSelectDropdown sync with react-hook-form
    status: completed
  - id: google-sheets
    content: Create Google Sheets integration service for investor form submissions
    status: completed
  - id: env-update
    content: Document production FRONTEND_URL environment variable requirement
    status: completed
---

# Revure V2 Bug Fixes and Improvements

## 1. Currency Change: SAR to USD

**File:** [`app/affiliate/dashboard/page.tsx`](app/affiliate/dashboard/page.tsx)

Change the `formatCurrency` function and the hardcoded "SAR 200" text:

```typescript
// Line 92-96: Change SAR to USD
const formatCurrency = (amount: number) => {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
};

// Line 451: Change "Get SAR 200" to "Get $200"
```

---

## 2. Forgot Password Production URL

**File:** [`src/utils/emailService.js`](revure-v2-backend/src/utils/emailService.js) (Backend)

The code already uses `process.env.FRONTEND_URL` with localhost as fallback. This is a deployment configuration issue:

- Ensure `FRONTEND_URL=https://book.beige.app` is set in the production `.env` file on the server
- The code at line 329 will use the production URL when the env variable is properly set

---

## 3. Add Book A Shoot Navigation to Affiliate Dashboard

**File:** [`app/affiliate/dashboard/page.tsx`](app/affiliate/dashboard/page.tsx)

Add a "Book A Shoot" link in the Sidebar component (around line 146-170):

```typescript
// Add Camera icon import
import { Camera } from "lucide-react";

// In Sidebar component, add after Overview button:
<Link 
  href="/book-a-shoot"
  className="flex items-center w-full gap-3 px-3 py-3 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
>
  <Camera size={20} />
  <span>Book A Shoot</span>
</Link>
```

---

## 4. Logo Click Redirects to book.beige.app

**File:** [`src/components/landing/Navbar.tsx`](src/components/landing/Navbar.tsx)

Change the logo click handler (line 99-113) to redirect to external URL:

```typescript
// Change from handleNavClick("/") to window.open
<a
  href="https://book.beige.app"
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center"
>
  <Image src="/images/logos/beige_logo_vb.png" ... />
</a>
```

**File:** [`src/components/landing/Footer.tsx`](src/components/landing/Footer.tsx)

Same change for footer logo.

---

## 5. Investor Form Validation Fix (Invalid Value)

**File:** [`components/investors/InvestorForm.tsx`](components/investors/InvestorForm.tsx)

The issue: `MultiSelectDropdown` components update local state (`selectedRounds`, `selectedTimings`, `selectedBudget`) but don't sync with react-hook-form. The form fields remain empty, causing validation to fail.

**Fix:** Sync the MultiSelectDropdown values with the form:

```typescript
// Add useEffect hooks to sync state with form
useEffect(() => {
  form.setValue("investmentRounds", selectedRounds.join(","));
}, [selectedRounds]);

useEffect(() => {
  form.setValue("investmentTiming", selectedTimings.join(","));
}, [selectedTimings]);

useEffect(() => {
  form.setValue("investmentAmount", selectedBudget.join(","));
}, [selectedBudget]);
```

---

## 6. Google Sheets Integration for Investor Form

**New File:** [`src/utils/googleSheetsService.js`](revure-v2-backend/src/utils/googleSheetsService.js) (Backend)

Create a service to append investor data to Google Sheets using the Google Sheets API.

**Modify:** [`src/controllers/investor.controller.js`](revure-v2-backend/src/controllers/investor.controller.js)

After successfully creating the investor entry in the database, call the Google Sheets service to append the row.

**Required Setup:**
- Create a Google Cloud project with Sheets API enabled
- Create a service account and download credentials JSON
- Share the target spreadsheet with the service account email
- Add environment variables: `GOOGLE_SHEETS_CREDENTIALS`, `INVESTOR_SPREADSHEET_ID`

---

## 7. Search Results Loading Flash Fix

**File:** [`app/search-results/page.tsx`](app/search-results/page.tsx)

The Suspense fallback (line 183) shows an empty div that causes a flash. Change it to show a proper loading state that matches the main loading UI:

```typescript
<Suspense fallback={
  <div className="pt-32 pb-20 flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
      <p className="text-white text-lg">Finding the perfect creators for you...</p>
    </div>
  </div>
}>
```

---

## Implementation Order

1. Simple fixes first (currency, loading flash, navigation)
2. Logo redirect changes
3. Investor form validation fix
4. Google Sheets integration (requires API setup)
5. Production environment variable update (deployment task)