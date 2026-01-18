# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Revure V2 Landing** is a Next.js 15 customer-facing web application for booking video/photo shoots with content creators. It features two booking flow versions (V2 and V3) with distinct UX patterns and backend integrations.

**Related Repositories:**
- **Backend:** `../revure-v2-backend` (Node.js/Express API on port 5001)
- **Original App:** `../web` (untouched legacy codebase)
- **Admin Backend:** `beige-server` (shares database with revure-v2-backend)

**Key Technologies:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Redux Toolkit (RTK Query)
- Framer Motion (animations)
- Material-UI (@mui) for date/time pickers
- Stripe (payment processing)
- Mapbox (location selection)

## Development Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack on http://localhost:3000
yarn dev

# Production
npm run build        # Build for production (ignores TS/ESLint errors - see next.config.ts)
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint (currently ignored during builds)
```

**Backend Development** (in `../revure-v2-backend`):
```bash
npm run dev          # Start backend on http://localhost:5001
npm run db:setup     # Initialize and seed database
npm run db:seed:full # Seed database with test data
```

## Architecture & Data Flow

### Booking Flow Architecture

The application supports **two distinct booking flows**:

#### **V2 Flow** (4-step traditional flow)

**Location:** `components/book-a-shoot/BookAShootV2.tsx`

**Progress Tracker:** 4 visible steps
- Step 1: Project Details
- Step 2: More Details
- Step 3: Date & Time
- Step 4: Review & Match

**Detailed Step Breakdown:**

**Step 1: Project Details** (`Step1ProjectDetails.tsx`)
- **Service Type** (radio select): shoot_raw | shoot_edit | edit_files
- **Content Type** (multi-checkbox): videographer, photographer, cinematographer, all
  - Shows pricing tooltip on hover (fetched from pricing catalog)
  - "All" auto-selects when all 3 roles selected individually
- **Shoot Type** (dropdown): wedding, music, commercial, tv, podcast, short_film, movie, corporate, private
- **Edit Type** (multi-select dropdown): Dynamically populated based on shoot type
  - Wedding: highlights, full ceremony, reception, etc.
  - Commercial: short-form, long-form, social media, etc.
  - Only shown if serviceType involves editing (shoot_edit or edit_files)
- **Validation:** Service type, content type (if shooting), shoot type, edit type (if editing) all required

**Step 2: More Details** (`Step2MoreDetails.tsx`)
- **Shoot Name** (text input): Required
- **Crew Size** (stepper): 1-20 people
  - Initially auto-set to number of content types selected in Step 1
  - Crew Breakdown: Distribute crew size across selected roles (videographer, photographer, cinematographer)
  - Must allocate all crew members before proceeding
- **Reference Link** (URL input): Optional, validated URL format
- **Special Note** (textarea): Optional project notes
- **Budget Range** (dual-slider): $100-$20,000 with $500 minimum gap
- **Add-ons** (yes/no toggle):
  - If "Yes": Shows collapsible categories from pricing catalog API
  - Categories filtered by shoot type (excludes "services" category)
  - Each item has checkbox + quantity control
  - Real-time quote calculation as items selected
  - Shows live pricing summary with discounts
- **Redux Integration:** All pricing state synced to pricingSlice for global access

**Step 3: Date & Time** (`Step3DateTime.tsx`)
- **Start Date & Time** (Material-UI DateTimePicker): Required, must be future
- **End Date & Time** (Material-UI DateTimePicker): Required, must be after start
- **Location** (Mapbox autocomplete): Required, stores as JSON with coordinates
- **Studio Needed** (yes/no toggle):
  - If "Yes": Shows studio selection and duration slider (1-12 hours)
- Auto-calculates duration_hours from start/end time

**Step 4: Review** (`Step4Review.tsx`)
- **Guest Email** (email input): Required, validated email format
- Summary of all selections with edit buttons
- Live pricing quote display (if add-ons selected)
- "Find Creative" button triggers submission
- Shows loading state during API calls
- On success: Redirects to `/search-results?booking_id=X&content_types=...&location=...&min_budget=...&max_budget=...`

**V2 Data Flow:**
```
BookAShootV2 → Step Components → Redux (pricingSlice, bookingSlice)
→ pricingApi.saveQuote() [if add-ons selected]
→ guestBookingApi.createGuestBooking() [with quote_id]
→ Backend: POST /v1/pricing/quotes → POST /v1/guest-bookings/create
→ Redirect to /search-results with query params
```

**V2 State Management:**
- **bookingSlice:** Stores form data across steps
- **pricingSlice:** Stores selected items, quote calculation, catalog
- **RTK Query:** Handles all API calls with loading/error states
- Form data persisted in Redux until submission

#### **V3 Flow** (6-internal-step simplified flow)

**Location:** `components/book-a-shoot/v3/BookAShootV3.tsx`

**Progress Tracker:** 3 visible steps (but 6 internal steps)
- Step 1: Choose Service
- Step 2: Customized Details
- Step 3: Book & Confirm

**Internal Step Management:**
- `activeStep` (1-3): Controls progress tracker display
- `internalStep` (1-6): Controls actual step component rendering
- Step transitions with special loading animation between steps 3→4→5

**Detailed Step Breakdown:**

**Internal Step 1: Choose Service** (`V3Step1ChooseService.tsx`) → `activeStep: 1`
- **Content Type** (multi-checkbox cards): videographer, photographer, cinematographer, editing
  - "Select All" checkbox selects first 3 (excludes editing)
  - Editing marked "Coming Soon"
  - Each card shows icon + label
- **Shoot Type** (card grid + dropdown):
  - Featured cards: Corporate Event, Wedding, Private (with images, people count, duration)
  - Dropdown for other types: music, tv, podcast, short_film, movie
- **Date & Time** (Material-UI DateTimePickers):
  - Start Date & Time: Required, must be future
  - End Date & Time: Required, must be after start date, disabled until start date selected
- **Edits Needed** (yes/no toggle):
  - If "Yes": Shows edit type dropdowns
    - Video Edit Types: Multi-select based on shoot type (highlights, full ceremony, etc.)
    - Photo Edit Types: Multi-select (basic retouch, high-end retouch, color correction)
- **Validation:** Content type, shoot type, start/end dates required. If edits needed, at least one edit type required.

**Internal Step 2: More Details** (`V3Step2MoreDetails.tsx`) → `activeStep: 2`
- **Team Included in Package** (readonly display):
  - Shows crew members selected in Step 1 content type
  - Each role displayed as card with icon (videographer, photographer, etc.)
- **Add More Team Members** (yes/no toggle):
  - If "Yes": Shows all 6 team roles with quantity controls
    - Videographer ($275), Photographer ($275), Editor ($150)
    - Sound Engineer ($275), Producer ($220), Director ($275)
  - Stores extra team as string array in `teamIncluded` field
- **Location** (Mapbox LocationPicker): Required, stores address + coordinates
- **Special Instructions** (textarea): Optional project details
- **Reference Links** (text input): Optional URL
- **Validation:** Location required

**Internal Step 3: Crew Matching** (`V3Step3CrewMatching.tsx`) → `activeStep: 2`
- **Recommended Crew Size Banner**: Shows based on shoot type + location
- **Example Recommendation Card**: Static card showing corporate event example
- **Matching Method Selection** (two cards):
  - **AI Matchmaker** (recommended): AI analyzes budget + requirements for instant matches
    - Features: Budget optimization, AI portfolio analysis
  - **Browse Manually**: Search catalog and hand-pick team (secondary option, shown with opacity)
- Stores selection in `matchingMethod` field ('ai_matchmaker' | 'manual')
- No validation, can proceed with either option

**Internal Step 4: Loading Animation** (`V3LoadingFindingCreative.tsx`) → No activeStep change
- **Duration:** 2.5 seconds (hardcoded setTimeout)
- **Display:** Animated "Finding Creative" message with loader
- **Purpose:** Simulates AI matching process
- **Transition:** Auto-advances to Step 5 after 2.5s
- **Progress Tracker:** Hidden during loading (no activeStep displayed)
- **Navigation:** Back button hidden during loading

**Internal Step 5: Dream Team Selection** (`V3SelectDreamTeam.tsx`) → `activeStep: 2`
- **Carousel Display:** 3D card carousel with 4 mock creators
  - Center card: Full size, full opacity
  - Side cards: 85% scale, 50% opacity, slight rotation
  - Navigation: Left/Right buttons to cycle through
- **Creator Cards:**
  - Image (320x320px), name, role, rating (with star), reviews count
  - Top Match badge, rating badge
  - Price displayed (e.g., $275)
  - Actions: "Add to Crew" (green) | "Remove" (red) | "View Profile"
- **Selection:** Multi-select, stores crew IDs in `selectedCrewIds` array
- **Continue Button:** Shows count "Continue with X Members"
- **Mock Data:** Currently 4 hardcoded creators (Ethan Cole, Sarah Jenkins, Marcus Ray, Elena Rodriguez)

**Internal Step 6: Book & Confirm** (`V3Step4BookConfirm.tsx`) → `activeStep: 3`
- **Left Column:**
  - **Project Summary Card**:
    - Content type, shoot type, date/time, location
    - Edit button to go back
  - **Editing Services**: Shows selected video/photo edit types
  - **Contact Information** (inputs):
    - Full Name (required)
    - Email (required, validated format)
    - Phone (required)
  - **Payment Method** (radio cards):
    - Credit/Debit Card (selected by default, styled with gold bg)
    - Pay via Stripe (secondary option)
- **Right Column (Sticky):**
  - **Pricing Summary Card** (gold background):
    - Package Offer: $3,251.00 (base)
    - Additional Team: $275 × selected crew count
    - Total Amount calculation
    - "Pay $X.XX" button (black bg, gold text)
    - Shows "Processing..." with spinner during submission
- **Validation:** Full name, email required before payment
- **On Submit:** Calls `onConfirm()` → `handleBookingSubmission()` in BookAShootV3

**V3 Data Flow:**
```
BookAShootV3 → Step Components → Local State (useState formData)
→ handleBookingSubmission() builds payload
→ pricingApi.saveQuote() [builds quote from contentType]
→ guestBookingApi.createGuestBooking() [includes V3-specific fields + quote_id]
→ Backend: POST /v1/pricing/quotes → POST /v1/guest-bookings/create
→ Backend triggers Google Sheets webhook (appendBookingToSheet)
→ Redirect to /search-results/payment?shootId={booking_id}
```

**V3 State Management:**
- **Local State Only:** All form data in `formData` state (type: `BookingDataV3`)
- **No Redux:** Intentionally avoids Redux for simpler, linear flow
- **RTK Query:** Only for API calls (pricingApi, guestBookingApi)
- Form data NOT persisted - refreshing page loses progress

**V3 Step Synchronization Logic:**
```typescript
// activeStep → internalStep mapping
internalStep 1 → activeStep 1
internalStep 2 → activeStep 2
internalStep 3 → activeStep 2
internalStep 4 → [hidden] (loading)
internalStep 5 → activeStep 2
internalStep 6 → activeStep 3

// Navigation logic
prevStep() from internalStep 5 → goes to internalStep 3 (skips loading)
nextStep() from internalStep 3 → internalStep 4 (loading) → auto to 5 after 2.5s
```

### State Management

**Redux Store Structure** (`lib/redux/store.ts`):
```
store
├── authSlice          # User authentication state
├── bookingSlice       # Booking form data (primarily for V2)
├── pricingSlice       # Pricing calculator state (V2 heavy)
├── authApi            # RTK Query: Authentication endpoints
├── bookingApi         # RTK Query: Authenticated bookings
├── guestBookingApi    # RTK Query: Guest bookings (V2 & V3)
├── pricingApi         # RTK Query: Pricing catalog & quotes
└── creatorsApi        # RTK Query: Creator search & profiles
```

**When to use Redux vs Local State:**
- **Redux:** V2 booking flow (complex pricing state shared across steps)
- **Local State:** V3 booking flow (simplified, step-local data with `useState`)
- **RTK Query:** All API calls (automatically handles loading/error states)

### API Integration

**Base URL:** `process.env.NEXT_PUBLIC_API_ENDPOINT` (defaults to `http://localhost:5001/v1/`)

**Key API Endpoints (RTK Query):**
```typescript
// Booking APIs
guestBookingApi.useCreateGuestBookingMutation()  // POST /v1/guest-bookings/create
bookingApi.useGetBookingByIdQuery(id)            // GET /v1/bookings/:id

// Pricing APIs
pricingApi.useSaveQuoteMutation()                // POST /v1/pricing/quotes
pricingApi.useCalculateQuoteMutation()           // POST /v1/pricing/calculate
pricingApi.useGetCatalogQuery()                  // GET /v1/pricing/catalog

// Creator APIs
creatorsApi.useSearchCreatorsQuery(params)       // GET /v1/creators/search
creatorsApi.useGetCreatorByIdQuery(id)           // GET /v1/creators/:id
```

**Backend Request Mapping (Guest Bookings):**
```typescript
// Frontend payload (V3 example)
{
  order_name: string,
  guest_email: string,
  content_type: string,        // comma-separated: "videographer,photographer"
  shoot_type: string,          // e.g., "Brand Campaign"
  start_date_time: string,     // ISO 8601 format
  end_time: string,
  location: string,
  budget_min: number,
  budget_max: number,
  crew_size: string,
  quote_id: number | null,     // From pricingApi.saveQuote

  // V3-specific fields
  full_name: string,
  phone: string,
  edits_needed: boolean,
  video_edit_types: string[],
  photo_edit_types: string[],
  team_included: boolean,
  add_team_members: boolean,
  special_instructions: string,
  reference_links: string,
  matching_method: "ai" | "manual",
  selected_crew_ids: number[]
}

// Backend response
{
  booking_id: number,
  project_name: string,
  guest_email: string,
  event_date: string,
  is_draft: boolean,
  quote_id: number | null,
  created_at: string
}
```

### Location Handling

**Frontend:** Uses Mapbox for location selection with autocomplete
**Storage Format:** JSON string with address + coordinates
```typescript
// LocationObject structure
{
  address: string | null,
  coordinates: { lat: number, lng: number } | null,
  hasCoordinates: boolean
}
```
**Backend Parsing:** `src/utils/locationHelpers.ts` normalizes location data

### Payment Flow

1. Booking created → Redirected to `/search-results/payment?shootId={booking_id}`
2. Payment page fetches booking details via `bookingApi.useGetBookingByIdQuery()`
3. Stripe integration via `@stripe/react-stripe-js` and `@stripe/stripe-js`
4. Payment processed → Confirmation page with booking reference number

## Project Structure

```
revure-v2-landing/
├── app/                                # Next.js App Router
│   ├── page.tsx                       # Landing page (imports LandingPage.tsx)
│   ├── layout.tsx                     # Root layout with Redux Provider
│   ├── globals.css                    # Global styles + Tailwind
│   ├── book-a-shoot/page.tsx          # Booking flow entry (switches V2/V3)
│   ├── search-results/                # Creator search & profiles
│   │   ├── page.tsx                  # Search results listing
│   │   ├── payment/page.tsx          # Payment page (V3 redirect)
│   │   └── [creatorId]/              # Dynamic creator profiles
│   │       ├── page.tsx              # Creator profile page
│   │       └── payment/page.tsx      # Creator-specific payment
│   ├── (auth)/                        # Auth pages (login, signup, reset)
│   ├── affiliate/dashboard/page.tsx   # Affiliate dashboard
│   └── creator/dashboard/             # Creator portal
│
├── components/
│   ├── book-a-shoot/                  # Booking flow components
│   │   ├── BookAShootV2.tsx          # V2 booking orchestrator
│   │   ├── Step1ProjectDetails.tsx   # V2 steps (1-4)
│   │   ├── Step2MoreDetails.tsx
│   │   ├── Step3DateTime.tsx
│   │   ├── Step4Review.tsx
│   │   ├── v3/                       # V3 booking flow
│   │   │   ├── BookAShootV3.tsx     # V3 orchestrator
│   │   │   ├── V3Step1ChooseService.tsx
│   │   │   ├── V3Step2MoreDetails.tsx
│   │   │   ├── V3Step3CrewMatching.tsx
│   │   │   ├── V3LoadingFindingCreative.tsx
│   │   │   ├── V3SelectDreamTeam.tsx
│   │   │   ├── V3Step4BookConfirm.tsx
│   │   │   └── components/          # V3 sub-components
│   │   ├── PricingSummary.tsx       # V2 pricing sidebar
│   │   ├── QuoteBuilder.tsx         # V2 interactive pricing
│   │   └── StepProgressTracker.tsx  # Progress indicator (shared)
│   │
│   └── ui/                           # Shadcn UI components
│       ├── button.tsx                # 7 button variants
│       ├── card.tsx
│       ├── datepicker.tsx            # Custom MUI-based picker
│       ├── timepicker.tsx
│       └── ...
│
├── src/components/
│   ├── landing/                      # Landing page sections
│   │   ├── LandingPage.tsx          # Main landing orchestrator
│   │   ├── Hero.tsx
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── ...17 landing components
│   └── booking/v2/                   # V2 booking UI components
│
├── lib/
│   ├── redux/                        # Redux Toolkit setup
│   │   ├── store.ts                 # Redux store configuration
│   │   ├── hooks.ts                 # Typed hooks (useAppDispatch, useAppSelector)
│   │   └── features/                # Feature slices & RTK Query APIs
│   │       ├── auth/                # authSlice, authApi
│   │       ├── booking/             # bookingSlice, bookingApi, guestBookingApi
│   │       ├── pricing/             # pricingSlice, pricingApi
│   │       └── creators/            # creatorsApi
│   ├── api/                          # API type definitions
│   │   └── pricing.ts               # Pricing types (QuoteCalculation, SavedQuote)
│   ├── utils/                        # Utility functions
│   │   └── locationHelpers.ts       # Location parsing/formatting
│   ├── hooks/                        # Custom hooks
│   │   ├── useAuth.ts               # Authentication hook
│   │   └── useBookingFlowVersion.ts # V2/V3 version detection
│   ├── types.ts                      # Shared TypeScript types
│   ├── utils.ts                      # cn() utility, date helpers
│   └── apiClient.ts                  # Axios client (legacy, prefer RTK Query)
│
├── public/                           # Static assets
│   ├── videos/                      # Landing page videos
│   └── images/                      # Logos, icons
│
├── tsconfig.json                     # TypeScript config (paths: @/*)
├── next.config.ts                    # ESLint/TS errors ignored for rapid dev
├── tailwind.config.ts                # Tailwind v4 config
└── package.json                      # Dependencies & scripts
```

## Key Patterns & Conventions

### Component Patterns

**Step Component Interface:**
```typescript
interface StepProps {
  data: BookingData;              // Form data state
  updateData: (data: Partial<BookingData>) => void;
  onNext: () => void;             // Proceed to next step
  onBack: () => void;             // Return to previous step
}
```

**RTK Query Hook Usage:**
```typescript
// Mutations (POST/PUT/DELETE)
const [createBooking, { isLoading, error }] = useCreateGuestBookingMutation();
const result = await createBooking(bookingData).unwrap();

// Queries (GET)
const { data, isLoading, error } = useGetBookingByIdQuery(bookingId);
```

### TypeScript Conventions

- Use `@/` path alias for absolute imports (configured in `tsconfig.json`)
- API types defined in `lib/api/` and `lib/types.ts`
- Component prop types defined inline or in same file
- Redux types auto-generated by RTK Query (`RootState`, `AppDispatch`)

### Styling Patterns

**Tailwind Utilities:**
- Brand colors: `bg-[#101010]` (dark), `text-[#ECE1CE]` (beige accent)
- Responsive: Mobile-first (`lg:`, `md:` breakpoints)
- Animations: Framer Motion for complex animations, Tailwind for simple ones

**Component Styling:**
```tsx
// Use cn() utility for conditional classes
import { cn } from "@/lib/utils";
<div className={cn("base-class", isActive && "active-class")} />
```

### Form Handling

**V2 Flow:** Controlled components with Redux state
**V3 Flow:** Controlled components with local `useState`
**Validation:** Client-side validation before API calls (no react-hook-form currently)

## Important Notes

### Build Configuration

**ESLint & TypeScript errors are intentionally ignored during builds** (see `next.config.ts`):
```typescript
eslint: { ignoreDuringBuilds: true },
typescript: { ignoreBuildErrors: true }
```
This was configured for rapid prototyping during UI migration. When implementing new features:
- Fix TypeScript errors as you go
- Run `npm run lint` locally before committing
- Do not add more type errors

### Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_API_ENDPOINT=http://localhost:5001/v1/
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1...
```

### Database Schema

Backend uses MySQL `revurge` database with key tables:
- `stream_project_booking` - Bookings (booking_id is primary key)
- `users` - User accounts
- `crew_members` - Creator profiles
- `pricing_items` - Catalog of services/equipment (IDs: 10=photographer, 11=videographer, 12=cinematographer)
- `saved_quotes` - Pricing quotes linked to bookings

**Important:** Crew role item IDs are hardcoded in V3 flow (BookAShootV3.tsx:97-101). Update if backend schema changes.

### Google Sheets Integration (V3)

V3 booking flow sends data to Google Sheets via backend webhook after successful booking creation. Backend handles this automatically in `guest-bookings.controller.js`.

### Testing Booking Flows

**V2 Flow:**
1. Navigate to `/book-a-shoot` (defaults to V2)
2. Complete all 4 steps with valid data
3. Verify quote appears in Step 4 Review
4. Submit → Should redirect to `/search-results?booking_id=X`

**V3 Flow:**
1. Set `useBookingFlowVersion` to return "v3" or access via specific route
2. Complete steps: Choose Service → More Details → Crew Matching
3. Watch loading animation (Step 4)
4. Select crew members (Step 5)
5. Review and confirm (Step 6) → Should redirect to `/search-results/payment?shootId=X`

**Common Issues:**
- Missing `NEXT_PUBLIC_API_ENDPOINT` → API calls fail silently
- Backend not running → Check `http://localhost:5001/v1/health`
- CORS errors → Backend must allow `http://localhost:3000` origin
- Quote creation fails → Check backend pricing catalog is seeded (`npm run db:seed:full`)

## Working with V2 vs V3

### Quick Comparison

| Aspect | V2 Flow | V3 Flow |
|--------|---------|---------|
| **Steps** | 4 visible steps | 3 visible steps (6 internal) |
| **State** | Redux (pricingSlice, bookingSlice) | Local useState |
| **Persistence** | Survives page refresh | Lost on page refresh |
| **Pricing** | Real-time quote with add-ons | Simplified package pricing |
| **Crew Selection** | Manual breakdown by role | AI matchmaker + carousel selection |
| **Redirect** | `/search-results` | `/search-results/payment` |
| **Backend Fields** | Standard booking fields | + V3-specific fields (full_name, phone, etc.) |
| **Integrations** | Pricing API | Pricing API + Google Sheets |
| **Complexity** | High (pricing calculator) | Low (streamlined UX) |
| **Use Case** | Power users, detailed quotes | Quick bookings, guided flow |

### When editing V2:

**Files to modify:**
```
components/book-a-shoot/
├── BookAShootV2.tsx          # Main orchestrator
├── Step1ProjectDetails.tsx   # Service/content/shoot type
├── Step2MoreDetails.tsx      # Crew, budget, add-ons
├── Step3DateTime.tsx         # Date, time, location
├── Step4Review.tsx           # Review and submit
├── PricingSummary.tsx        # Live pricing sidebar
├── QuoteBuilder.tsx          # Interactive pricing tool
└── [shared components]       # DropdownSelect, MultiSelectDropdown, etc.
```

**State management:**
- Update `lib/redux/features/pricing/pricingSlice.ts` for pricing logic
- Update `lib/redux/features/booking/bookingSlice.ts` for booking data
- Use `useSelector(selectQuote)` to access quote data
- Use `dispatch(setQuote())` to update pricing

**Key focus areas:**
- Pricing calculator accuracy (discount tiers, margin calculation)
- Crew breakdown validation (must allocate all crew members)
- Add-ons catalog integration (category filtering, quantity controls)
- Real-time quote updates (debounced recalculation on item changes)

**Common V2 tasks:**
1. **Adding new service type:** Update `serviceType` options in Step1, handle in pricing logic
2. **Modifying pricing:** Update backend `pricing_items` table, frontend auto-fetches
3. **Changing crew breakdown:** Modify `Step2MoreDetails.tsx` crew size logic
4. **Adding validation:** Add to step's `handleNext()` function with toast error

### When editing V3:

**Files to modify:**
```
components/book-a-shoot/v3/
├── BookAShootV3.tsx              # Main orchestrator + submission
├── V3Step1ChooseService.tsx      # Content, shoot type, date, edits
├── V3Step2MoreDetails.tsx        # Team, location, instructions
├── V3Step3CrewMatching.tsx       # AI matchmaker selection
├── V3LoadingFindingCreative.tsx  # Loading animation
├── V3SelectDreamTeam.tsx         # Crew carousel selection
├── V3Step4BookConfirm.tsx        # Review, contact, payment
├── types.ts                      # BookingDataV3 interface
└── index.ts                      # Exports + initialDataV3
```

**State management:**
- All form data in `formData` useState in `BookAShootV3.tsx`
- Pass data down via props to step components
- Update via `updateData()` callback
- NO Redux for form state (only RTK Query for API)

**Key focus areas:**
- User flow simplicity (clear progression, minimal friction)
- Step synchronization (activeStep vs internalStep)
- Loading animation timing (2.5s hardcoded in BookAShootV3.tsx:49-52)
- Crew carousel UX (Framer Motion animations, card scaling)
- Contact info collection (Step 6 validation)

**Common V3 tasks:**
1. **Adding new field:** Update `BookingDataV3` type → `initialDataV3` → step component → backend
2. **Modifying crew carousel:** Edit `V3SelectDreamTeam.tsx` mock data or integrate real API
3. **Changing step flow:** Modify `internalStep` logic and `activeStep` synchronization
4. **Updating pricing:** Edit base price in `V3Step4BookConfirm.tsx:39` (currently hardcoded $3,251)

### Adding new V3 fields (step-by-step):

```typescript
// 1. Update types (v3/types.ts)
export type BookingDataV3 = {
  // ... existing fields
  newField: string;  // Add your new field
};

export const initialDataV3: BookingDataV3 = {
  // ... existing defaults
  newField: "",  // Add default value
};

// 2. Add form input (e.g., V3Step2MoreDetails.tsx)
<input
  value={data.newField}
  onChange={(e) => updateData({ newField: e.target.value })}
  className="..."
  placeholder="Enter new field"
/>

// 3. Include in submission (BookAShootV3.tsx handleBookingSubmission)
const bookingData: any = {
  // ... existing fields
  new_field: formData.newField,  // Map to backend field name
};

// 4. Backend handles field (guest-bookings.controller.js)
const {
  // ... existing fields
  new_field,
} = req.body;

bookingData.new_field = new_field || null;
```

### Comparison: When to choose which flow

**Choose V2 when:**
- User needs detailed pricing breakdown with add-ons
- Complex projects requiring specific equipment/services
- User wants to customize crew composition
- Budget optimization is priority
- User is familiar with detailed quote processes

**Choose V3 when:**
- Quick booking is priority
- User prefers guided, simplified flow
- AI recommendations are valuable
- Payment needed immediately after booking
- User is new to platform (less overwhelming)

**Technical differences:**
```typescript
// V2 Submission
const result = await createGuestBooking({
  order_name,
  guest_email,
  project_type: 'shoot_edit',
  content_type: 'videographer,photographer',
  crew_size: '3',
  // ... standard fields
  quote_id: savedQuoteId  // Links to detailed quote
});
// → Redirect to /search-results (find creators)

// V3 Submission
const result = await createGuestBooking({
  order_name,
  guest_email,
  content_type: 'videographer,photographer',
  // ... standard fields
  full_name: 'John Doe',        // V3-specific
  phone: '+1234567890',          // V3-specific
  edits_needed: true,            // V3-specific
  video_edit_types: ['...'],     // V3-specific
  selected_crew_ids: [1, 2, 3],  // V3-specific
  quote_id: savedQuoteId
});
// → Redirect to /search-results/payment (direct payment)
```

## Backend Integration Checklist

When working with backend endpoints:
1. Check backend is running: `curl http://localhost:5001/v1/health`
2. Verify endpoint in `../revure-v2-backend/src/routes/`
3. Check RTK Query API definition in `lib/redux/features/`
4. Ensure request payload matches backend controller expectations
5. Check backend logs for validation errors
6. Test with authenticated vs guest flows (auth header required for `/bookings/*`, not `/guest-bookings/*`)

## Common Tasks

### Adding a new booking field to V3
1. Edit `components/book-a-shoot/v3/index.ts` → Update `BookingDataV3` type
2. Edit appropriate step component (e.g., `V3Step2MoreDetails.tsx`) → Add form input
3. Edit `BookAShootV3.tsx:handleBookingSubmission()` → Include in backend payload
4. Backend: Update `guest-bookings.controller.js` to handle new field

### Adding a new pricing item
1. Backend: Seed database with new item in `pricing_items` table
2. Frontend: `pricingApi.useGetCatalogQuery()` will auto-fetch new items
3. Update UI components to display/select new item

### Debugging API calls
1. Open Redux DevTools → RTK Query tab
2. Check request payload and response
3. Check Network tab for actual HTTP request
4. Check backend logs: `npm run dev` in `../revure-v2-backend`

### Running end-to-end tests
1. Start backend: `cd ../revure-v2-backend && npm run dev`
2. Start frontend: `npm run dev`
3. Test full booking flow from landing page → booking → payment
4. Check database for created records: `mysql -u root -p revurge`
