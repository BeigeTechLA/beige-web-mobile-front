# Booking Modal V2 - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Import the Component

```tsx
import { BookingModal } from "@/src/components/booking/v2";
```

### Step 2: Add State Management

```tsx
const [isBookingOpen, setIsBookingOpen] = useState(false);
```

### Step 3: Render the Modal

```tsx
<BookingModal
  isOpen={isBookingOpen}
  onClose={() => setIsBookingOpen(false)}
/>
```

### Step 4: Trigger the Modal

```tsx
<button onClick={() => setIsBookingOpen(true)}>
  Book Your Shoot
</button>
```

---

## 📋 Complete Example

```tsx
"use client";

import { useState } from "react";
import { BookingModal } from "@/src/components/booking/v2";

export default function MyPage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">
        Welcome to Revure
      </h1>

      <button
        onClick={() => setIsBookingOpen(true)}
        className="px-6 py-3 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium rounded-lg"
      >
        Book Your Shoot
      </button>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}
```

---

## 🧪 Testing the Modal

### Option 1: Use the Demo Component

```tsx
import { BookingModalDemo } from "@/src/components/booking/v2/BookingModalDemo";

export default function TestPage() {
  return <BookingModalDemo />;
}
```

### Option 2: Check Console Output

After completing the booking flow, check your browser console:

```
Find Creative button clicked
Current formData: { projectType: "shoot_edit", ... }
Validation passed, creating order...
Order created: { order_name: "...", ... }
Navigate to: /search-results?shootId=order_1702345678901
```

---

## 🎨 Styling Integration

### Using with Existing Styles

The modal uses these color variables:

```css
/* Add to your globals.css if needed */
:root {
  --beige-primary: #E8D1AB;
  --beige-hover: #dcb98a;
  --dark-text: #1A1A1A;
  --light-bg: #FAFAFA;
}
```

### Custom Button Styling

```tsx
<button
  onClick={() => setIsBookingOpen(true)}
  className="px-8 py-4 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-lg rounded-[12px] transition-colors"
>
  Book Now
</button>
```

---

## 📊 Understanding the Data Flow

### 1. User Starts Booking
```
User clicks "Book Now" → Modal opens at Step 1
```

### 2. User Progresses Through Steps
```
Step 1: Select project type and content type
Step 2: Choose shoot type and edit type
Step 3: Enter shoot name, budget, crew size
Step 4: Select dates, location, studio options
Step 5: Review all information
Step 6: Loading animation (2 seconds)
```

### 3. Validation at Each Step
```tsx
// Step 1: Project type & content type required
if (!data.projectType || !data.contentType) {
  toast.error("Selection Required");
  return;
}
```

### 4. Final Submission
```tsx
// Console logs the order data and mock navigation
console.log("Order created:", orderData);
console.log("Navigate to: /search-results?shootId=...");
```

---

## 🔧 Common Customizations

### Change Loading Duration

In `BookingModal.tsx`, line ~218:

```tsx
setTimeout(() => {
  console.log(`Navigate to: /search-results?shootId=${mockOrderId}`);
  onClose();
}, 2000); // Change this value (milliseconds)
```

### Add Custom Validation

In any step component:

```tsx
const handleNext = () => {
  // Add your validation
  if (data.shootName.includes("test")) {
    toast.error("Custom Error", {
      description: "Shoot name cannot contain 'test'"
    });
    return;
  }

  // Existing validation
  onNext();
};
```

### Modify Budget Range

In `Step3_InfoBudget.tsx`, line ~141:

```tsx
<input
  type="range"
  min="100"    // Change minimum
  max="20000"  // Change maximum
  step="100"   // Change increment
  // ...
/>
```

---

## 🐛 Troubleshooting

### Modal Won't Open
```tsx
// Check state is being updated
console.log("isBookingOpen:", isBookingOpen);

// Verify modal is rendered
<BookingModal isOpen={isBookingOpen} onClose={...} />
```

### Styles Look Wrong
```tsx
// Ensure globals.css is imported
import "@/src/styles/globals.css";

// Check Tailwind config includes component paths
content: [
  "./src/components/**/*.{js,ts,jsx,tsx}",
]
```

### Date Picker Issues
```tsx
// Verify MUI dependencies are installed
yarn add @mui/x-date-pickers @mui/material date-fns
```

### Console Errors
```tsx
// Check import paths
import { BookingModal } from "@/src/components/booking/v2";

// Verify all dependencies are installed
yarn install
```

---

## 📚 API Integration (Future)

When you're ready to connect to a backend:

### 1. Create API Client

```typescript
// src/lib/api/booking.ts
export async function createBooking(data: BookingData) {
  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) throw new Error('Booking failed');
  return response.json();
}
```

### 2. Update BookingModal

```tsx
import { useRouter } from 'next/navigation';
import { createBooking } from '@/src/lib/api/booking';

const router = useRouter();

const handleFindCreative = async () => {
  try {
    const result = await createBooking(formData);
    setTimeout(() => {
      router.push(`/search-results?shootId=${result.id}`);
    }, 2000);
  } catch (error) {
    toast.error("Booking Failed");
    setCurrentStep(4);
  }
};
```

---

## 🎯 Next Steps

1. **Test the Demo:**
   ```bash
   # Create a test page
   src/app/booking-demo/page.tsx
   ```

2. **Review Documentation:**
   - `README.md` - Full technical details
   - `VISUAL_CHECKLIST.md` - Design verification
   - `BOOKING_V2_MIGRATION_SUMMARY.md` - Complete overview

3. **Integrate into Landing Page:**
   ```tsx
   import { BookingModal } from "@/src/components/booking/v2";
   // Add to your Hero section or CTA buttons
   ```

4. **Plan Backend Integration:**
   - Review API requirements
   - Design order data structure
   - Implement navigation logic

---

## 💡 Pro Tips

### Tip 1: Pre-fill Data for Testing
```tsx
const testData = {
  projectType: "shoot_edit",
  contentType: "videography",
  shootType: "Wedding",
  // ... rest of fields
};

<BookingModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  initialData={testData} // Add this prop (requires modification)
/>
```

### Tip 2: Track Conversion Events
```tsx
const handleClose = () => {
  // Track how far user got
  console.log("User closed at step:", currentStep);
  setIsOpen(false);
};
```

### Tip 3: A/B Test Different Flows
```tsx
const variant = useABTest();

<BookingModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  skipStep2={variant === "simplified"} // Requires modification
/>
```

---

## 📞 Support

Having issues? Check these resources:

1. **Component README:** `src/components/booking/v2/README.md`
2. **Visual Checklist:** `src/components/booking/v2/VISUAL_CHECKLIST.md`
3. **Migration Summary:** `BOOKING_V2_MIGRATION_SUMMARY.md`
4. **Original Source:** `src/components/landing-v2/booking/` (for reference)

---

## ✅ Success Checklist

- [ ] Component imports without errors
- [ ] Modal opens when button clicked
- [ ] All 6 steps render correctly
- [ ] Validation shows appropriate errors
- [ ] Console logs show expected output
- [ ] Modal closes and resets properly
- [ ] Styling matches design specifications
- [ ] Responsive design works on all devices

---

**Happy Coding!** 🎉
