# Booking Modal V2 - Developer Cheat Sheet

## 🚀 Quick Integration (Copy & Paste)

### Basic Usage
```tsx
"use client";
import { useState } from "react";
import { BookingModal } from "@/src/components/booking/v2";

export default function Page() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Book Now</button>
      <BookingModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

## 📁 File Locations

```
/src/components/booking/v2/
├── BookingModal.tsx          # Main component
├── BookingModalDemo.tsx      # Example usage
├── index.ts                  # Exports
├── steps/                    # All 6 step components
├── component/                # UI components
├── README.md                 # Full docs
├── QUICKSTART.md            # Quick start
└── VISUAL_CHECKLIST.md      # Visual QA
```

## 🎨 Key Colors

```css
#E8D1AB  /* Primary beige/gold */
#dcb98a  /* Hover beige */
#1A1A1A  /* Dark text/selected */
#FAFAFA  /* Light background */
#E5E5E5  /* Input borders */
```

## 📊 Data Structure

```typescript
type BookingData = {
  projectType: "shoot_edit" | "shoot_raw" | null;
  contentType: "videography" | "photography" | "both" | null;
  shootType: string;           // "Wedding", "Corporate", etc.
  editType: string;            // "Cinematic", "Documentary", etc.
  shootName: string;
  crewSize: string;
  referenceLink: string;
  specialNote: string;
  budgetMin: number;           // Default: 100
  budgetMax: number;           // Default: 15000
  startDate: string;           // ISO date string
  endDate: string;
  location: string;
  needStudio: boolean;
  studio: string;
  studioTimeDuration: number;  // Hours: 2-24
};
```

## 🔄 Flow Steps

1. **Step 1:** Project type + content type
2. **Step 2:** Shoot type + edit type
3. **Step 3:** Name, crew, budget, notes
4. **Step 4:** Date, location, studio
5. **Step 5:** Review all data
6. **Step 6:** Loading (2s) → Close

## ✅ Validation Rules

| Field | Rule |
|-------|------|
| projectType | Required |
| contentType | Required |
| shootType | Required, non-empty |
| editType | Required, non-empty |
| shootName | Required, min 3 chars |
| budgetMax | Min $100 |
| startDate | Required, not in past |
| location | Required, min 3 chars |

## 🛠️ Common Customizations

### Change Loading Duration
```tsx
// In BookingModal.tsx, line ~218
setTimeout(() => { /* ... */ }, 3000); // 3 seconds
```

### Pre-fill Test Data
```tsx
const testData: BookingData = {
  projectType: "shoot_edit",
  contentType: "videography",
  shootType: "Wedding",
  editType: "Cinematic",
  shootName: "Test Shoot",
  crewSize: "3-5",
  budgetMin: 2000,
  budgetMax: 8000,
  location: "Los Angeles",
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString(),
  // ... rest
};
// Then modify BookingModal to accept initialData prop
```

### Custom Button Styles
```tsx
<button
  onClick={() => setOpen(true)}
  className="px-8 py-4 bg-[#E8D1AB] hover:bg-[#dcb98a]
             text-black font-medium text-lg rounded-[12px]
             transition-colors shadow-lg"
>
  Book Your Shoot
</button>
```

## 🐛 Troubleshooting

### Modal won't open
```tsx
console.log("isOpen:", isOpen); // Check state
```

### Styles don't match
```tsx
// Verify globals.css is imported in layout
import "@/src/styles/globals.css";
```

### Date picker error
```bash
# Check dependencies
yarn add @mui/x-date-pickers @mui/material date-fns
```

### Import errors
```tsx
// Use absolute path
import { BookingModal } from "@/src/components/booking/v2";
```

## 📝 Console Output

```
Find Creative button clicked
Current formData: { projectType: "shoot_edit", ... }
Validation passed, creating order...
Order created: { order_name: "...", ... }
Navigate to: /search-results?shootId=order_1702345678901
```

## 🔌 Backend Integration

### 1. Create API function
```typescript
// src/lib/api/booking.ts
export async function createBooking(data: BookingData) {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}
```

### 2. Update modal
```tsx
import { useRouter } from 'next/navigation';
import { createBooking } from '@/lib/api/booking';

const router = useRouter();

try {
  const result = await createBooking(formData);
  router.push(`/search-results?shootId=${result.id}`);
} catch (error) {
  toast.error("Booking Failed");
}
```

## 📚 Documentation Links

- **Full Docs:** `README.md`
- **Quick Start:** `QUICKSTART.md`
- **Visual QA:** `VISUAL_CHECKLIST.md`
- **Migration:** `BOOKING_V2_MIGRATION_SUMMARY.md`

## 🎯 Key Props

```tsx
interface BookingModalProps {
  isOpen: boolean;      // Controls modal visibility
  onClose: () => void;  // Called when modal closes
}
```

## 🏗️ Component Exports

```typescript
// Main modal
export { BookingModal } from "./BookingModal";

// Type definition
export type { BookingData } from "./BookingModal";

// Individual steps (if needed)
export { Step1ProjectNeeds } from "./steps/Step1_ProjectNeeds";
// ... etc

// UI components
export { CustomSlider } from "./component/CustomSlider";
export { DateTimePicker } from "./component/DateTimePicker";
export { DropdownSelect } from "./component/DropdownSelect";
```

## ⚡ Performance Tips

1. **Lazy load:** Use dynamic imports for modal
2. **Memoize:** Wrap in React.memo if parent re-renders often
3. **Debounce:** Add debounce to slider inputs
4. **Optimize images:** Use Next.js Image for any added images

## 🔍 Testing Quick Checks

```tsx
// 1. Open modal
setOpen(true);

// 2. Fill all steps
// 3. Check console output
// 4. Verify state reset after close

// Expected console logs:
// - "Find Creative button clicked"
// - "Current formData: { ... }"
// - "Order created: { ... }"
// - "Navigate to: /search-results?shootId=..."
```

## 🎨 Responsive Breakpoints

```css
/* Mobile: < 768px */
px-4, p-8, text-lg, grid-cols-1

/* Tablet/Desktop: ≥ 768px */
md:p-[50px], md:text-2xl, md:grid-cols-2/3

/* Large: ≥ 1024px */
lg:w-[760px] (most steps)
lg:w-[1200px] (step 3)
```

## 🚨 Important Notes

- **State:** Local useState only, no Redux
- **API:** Mocked with console.logs
- **Navigation:** Console logs, not router.push
- **Reset:** State resets on modal close
- **Validation:** Toast notifications for errors
- **Duration:** Loading animation is 2 seconds

## ✨ Pro Tips

```tsx
// Track analytics
const handleClose = () => {
  analytics.track('booking_closed', { step: currentStep });
  setOpen(false);
};

// A/B test variants
const showSimplified = useFeatureFlag('simplified-booking');

// Autosave draft
useEffect(() => {
  localStorage.setItem('booking-draft', JSON.stringify(formData));
}, [formData]);
```

---

**Quick Reference Card v1.0**
*For full details, see README.md*
