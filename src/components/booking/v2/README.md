# V2 Booking Modal System - Redux-Free Migration

## Overview

This is a complete migration of the booking modal system from `src/components/landing-v2/booking/` with all Redux dependencies removed and replaced with local React state management. The UI/UX remains 100% identical to the original.

## File Structure

```
src/components/booking/v2/
├── BookingModal.tsx           # Main modal orchestrator (Redux-free)
├── BookingModalDemo.tsx       # Demo/example component
├── index.ts                   # Barrel exports
├── README.md                  # This file
├── steps/
│   ├── Step1_ProjectNeeds.tsx # Project type & content selection
│   ├── Step2_ShootType.tsx    # Shoot and edit type selection
│   ├── Step3_InfoBudget.tsx   # Shoot info and budget range
│   ├── Step4_LocationDate.tsx # Location, date, and studio options
│   ├── Step5_Review.tsx       # Review and confirm
│   └── Step6_Loading.tsx      # Loading animation
└── component/
    ├── CustomSlider.tsx       # Custom range slider
    ├── DateTimePicker.tsx     # MUI date/time picker wrapper
    └── DropdownSelect.tsx     # Custom dropdown component
```

## Key Changes from Original

### 1. State Management
**Before (Redux):**
```typescript
import { useAppDispatch, useAppSelector } from "@/src/redux/hooks";
import { updateFormData, setCurrentStep } from "@/src/redux/features/booking/bookingSlice";

const dispatch = useAppDispatch();
const formData = useAppSelector((state) => state.booking.formData);
const currentStep = useAppSelector((state) => state.booking.currentStep);

dispatch(updateFormData({ shootName: "New Project" }));
```

**After (Local State):**
```typescript
const [formData, setFormData] = useState<BookingData>(initialData);
const [currentStep, setCurrentStep] = useState(0);

const updateData = (updates: Partial<BookingData>) => {
  setFormData((prev) => ({ ...prev, ...updates }));
};

updateData({ shootName: "New Project" });
```

### 2. API Integration
**Before (RTK Query):**
```typescript
import { usePostOrderMutation } from "@/src/redux/features/shoot/shootApi";

const [postOrder, { isLoading }] = usePostOrderMutation();
const response = await postOrder(orderData).unwrap();
router.push(`/search-results?shootId=${response.id}`);
```

**After (Mocked):**
```typescript
const orderData = { /* booking data */ };
console.log("Order created:", orderData);

const mockOrderId = `order_${Date.now()}`;
console.log(`Navigate to: /search-results?shootId=${mockOrderId}`);
```

### 3. Navigation
**Before:**
```typescript
import { useRouter } from "next/navigation";
const router = useRouter();
router.push(`/search-results?shootId=${orderId}`);
```

**After:**
```typescript
console.log(`Navigate to: /search-results?shootId=${mockOrderId}`);
```

### 4. Error Handling
**Before:**
```typescript
toast.error("Booking Failed", {
  description: error?.data?.message || error?.message || "Failed to create booking"
});
```

**After:**
```typescript
toast.error("Booking Failed", {
  description: "Failed to create booking. Please try again."
});
```

## Usage

### Basic Usage

```tsx
import { BookingModal } from "@/src/components/booking/v2";
import { useState } from "react";

function MyPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Book Now
      </button>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
```

### With Demo Component

```tsx
import { BookingModalDemo } from "@/src/components/booking/v2/BookingModalDemo";

function DemoPage() {
  return <BookingModalDemo />;
}
```

## Data Flow

```
User Interaction
      ↓
Step Component validates input
      ↓
updateData() updates local state
      ↓
onNext() advances to next step
      ↓
Step 5: Review → handleFindCreative()
      ↓
Step 6: Loading animation (2s)
      ↓
Console log navigation + close modal
```

## Booking Data Structure

```typescript
type BookingData = {
  projectType: "shoot_edit" | "shoot_raw" | null;
  contentType: "videography" | "photography" | "both" | null;
  shootType: string;              // "Wedding", "Corporate", etc.
  editType: string;               // "Cinematic", "Documentary", etc.
  shootName: string;              // Project name
  crewSize: string;               // "2-5", etc.
  referenceLink: string;          // URL reference
  specialNote: string;            // Additional notes
  budgetMin: number;              // Minimum budget (default: 100)
  budgetMax: number;              // Maximum budget (default: 15000)
  startDate: string;              // ISO date string
  endDate: string;                // ISO date string
  location: string;               // Shoot location
  needStudio: boolean;            // Studio requirement flag
  studio: string;                 // Selected studio
  studioTimeDuration: number;     // Hours (2-24)
};
```

## Validation

Each step has built-in validation:

**Step 1:** Project type and content type required
**Step 2:** Shoot type and edit type required
**Step 3:** Shoot name (min 3 chars), budget max ≥ $100
**Step 4:** Start date (not in past), location (min 3 chars)
**Step 5:** Final sanity check before submission

All validation uses `sonner` toast notifications for user feedback.

## Styling

All styles are preserved exactly from the original:
- Colors: `#E8D1AB` (beige), `#1A1A1A` (black), `#FAFAFA` (background)
- Border radius: `12px` for inputs, `24px` for modal
- Transitions: All hover states and animations intact
- Responsive: All breakpoints maintained

## Dependencies

Already installed in the project:
- `framer-motion` - Animations and transitions
- `lucide-react` - Icons
- `sonner` - Toast notifications
- `@mui/x-date-pickers` - Date/time picker
- `@mui/material` - Material UI components
- `date-fns` - Date utilities
- `react-flatpickr` - Date picker (used in original, kept for compatibility)

## Migration Notes

### What Was Removed
- All Redux imports (`@reduxjs/toolkit`, `react-redux`)
- RTK Query hooks (`usePostOrderMutation`)
- Redux action dispatchers
- Redux selectors
- Redux state types from external slices

### What Was Preserved
- 100% of visual design (colors, spacing, fonts, animations)
- All validation logic
- All user interactions
- All step transitions
- All component functionality
- Error handling structure (adapted for local state)

### What Was Simplified
- State management (Redux → useState)
- API calls (real → mocked)
- Navigation (router.push → console.log)
- Error messages (server errors → generic messages)

## Testing Checklist

- [ ] Modal opens and closes properly
- [ ] All 6 steps render correctly
- [ ] Step navigation (Next/Back) works
- [ ] Form inputs update state correctly
- [ ] Validation shows appropriate error messages
- [ ] Date picker functions properly
- [ ] Dropdown selections work
- [ ] Budget slider updates correctly
- [ ] Studio toggle shows/hides studio options
- [ ] Review step displays all entered data
- [ ] Loading animation plays
- [ ] Console logs show correct navigation intent
- [ ] Modal resets on close
- [ ] Responsive design works on mobile/tablet/desktop

## Console Output Example

When completing the booking flow, you'll see:

```
Find Creative button clicked
Current formData: {
  projectType: "shoot_edit",
  contentType: "videography",
  shootType: "Wedding",
  editType: "Cinematic",
  shootName: "John & Jane Wedding",
  // ... rest of data
}
Validation passed, creating order...
Order created: {
  order_name: "John & Jane Wedding",
  project_type: "shoot_edit",
  // ... formatted order data
}
Navigate to: /search-results?shootId=order_1702345678901
```

## Future Integration

When ready to connect to backend:

1. **Restore router navigation:**
   ```typescript
   import { useRouter } from "next/navigation";
   const router = useRouter();
   router.push(`/search-results?shootId=${orderId}`);
   ```

2. **Add API integration:**
   ```typescript
   const response = await fetch('/api/orders', {
     method: 'POST',
     body: JSON.stringify(orderData)
   });
   const result = await response.json();
   ```

3. **Handle real errors:**
   ```typescript
   catch (error: any) {
     toast.error("Booking Failed", {
       description: error.message || "Failed to create booking"
     });
   }
   ```

## Support

For questions or issues with this migration, check:
- Original source: `src/components/landing-v2/booking/`
- Migration plan: `/Users/amrik/Documents/revure/web/V2_UI_MIGRATION_PLAN.md`
- UI components: `src/components/landing-v2/ui/`
