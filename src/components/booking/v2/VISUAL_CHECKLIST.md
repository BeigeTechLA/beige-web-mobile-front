# Visual Accuracy Checklist - Booking Modal V2

## Purpose
Verify that the migrated V2 booking modal maintains 100% visual accuracy with the original landing-v2 version.

---

## Color Palette Verification

### Primary Colors
- [ ] Beige/Gold: `#E8D1AB` (buttons, accents, highlights)
- [ ] Dark Gold: `#E6AA46` (gradient end)
- [ ] Dark Black: `#1A1A1A` (text, selected states)
- [ ] Light Gray: `#FAFAFA` (backgrounds)
- [ ] Border Gray: `#E5E5E5` (input borders)
- [ ] Divider Gray: `#CACACA` (section dividers)

### Interactive States
- [ ] Hover beige: `#dcb98a`
- [ ] Hover gray: `#CCCCCC`
- [ ] Selected background: `#FFF8E6`
- [ ] Focus border: `#1A1A1A`

### Special Elements
- [ ] Radio gradient: `linear-gradient(134deg, #E8D1AB 17.17%, #E6AA46 76.39%)`
- [ ] Studio checkbox: `#ECE1CE`
- [ ] Loading background: `#0A0A0A`
- [ ] Loading glow: `blue-500/20`

---

## Typography Verification

### Headers
- [ ] Main title: `text-3xl font-bold text-[#1A1A1A]`
- [ ] Step labels: `text-xl font-medium text-[#212122E5]`
- [ ] Review title: `text-xl font-medium text-[#000]`

### Body Text
- [ ] Input labels: `text-base text-[#000]/60`
- [ ] Input text: `text-[#1A1A1A]`
- [ ] Button text: `text-lg` or `text-2xl font-medium`
- [ ] Helper text: `text-xs text-[#666]`

### Review Details
- [ ] Location/Date: `text-sm font-medium text-[#1D1D1BCC]`
- [ ] Edit type: `text-sm font-medium text-[#1A1A1A]`

---

## Spacing & Layout Verification

### Modal Container
- [ ] Modal padding: `px-4` (mobile), no padding (loading)
- [ ] Step padding: `p-8 md:p-[50px]`
- [ ] Border radius: `rounded-[24px]` (modal)
- [ ] Min height: `min-h-[500px]`

### Header Section
- [ ] Title padding: `pb-10 md:pb-[50px]`
- [ ] Border bottom: `border-b border-b-[#CACACA]`
- [ ] Close button position: `top-10 right-10 md:top-[50px] md:right-[50px]`

### Input Elements
- [ ] Input height: `h-[82px]`
- [ ] Input padding: `px-4`
- [ ] Input border radius: `rounded-[12px]`
- [ ] Textarea height: `h-[148px]`

### Buttons
- [ ] Button height: `h-[96px]` (main steps), `h-[64px]` (review)
- [ ] Button border radius: `rounded-[12px]`
- [ ] Grid gap: `gap-4`

### Grid Layouts
- [ ] Step 1 content: `grid-cols-2` (project), `grid-cols-3` (content)
- [ ] Step 3 top: `grid-cols-1 md:grid-cols-3`
- [ ] Step 3 bottom: `grid-cols-1 md:grid-cols-2`
- [ ] Step 4 date: `flex gap-6`
- [ ] Review details: `grid-cols-1 md:grid-cols-2`

---

## Interactive Element Verification

### Selection Cards (Step 1)
- [ ] Unselected: border `#E5E5E5`, hover `#CCCCCC`
- [ ] Selected: border + bg `#1A1A1A`, text white
- [ ] Radio button: circular with gradient fill when selected
- [ ] Inner dot: `w-2 h-2` black circle

### Dropdowns (Step 2)
- [ ] Trigger height: `h-[82px]`
- [ ] Dropdown position: `top-[90px]`
- [ ] Selected item: `bg-[#FFF8E6]`
- [ ] Checkbox: black when selected, gray border when not
- [ ] Chevron rotation: 180deg when open

### Budget Slider (Step 3)
- [ ] Track height: `h-[6px]`
- [ ] Track color: `#3A3A3A` (full), `#E8D1AB` (filled)
- [ ] Thumb size: `w-5 h-5`
- [ ] Thumb color: `#E8D1AB` with border `#CBB894`
- [ ] Labels: Min/Max with current values

### Date Picker (Step 4)
- [ ] Height: `82px`
- [ ] Border radius: `12px`
- [ ] Background: `#FAFAFA`
- [ ] Selected date color: `#E8D1AB`
- [ ] MUI theme matches design

### Studio Checkbox (Step 4)
- [ ] Icon size: `w-10 h-10`
- [ ] Icon background: `#F5F5F5`
- [ ] Checkbox size: `w-6 h-6`
- [ ] Selected bg: `#ECE1CE`
- [ ] Checkmark: `w-4 h-4` stroke-width 3

### Studio Slider (Step 4)
- [ ] Appears when needStudio is true
- [ ] Range: 2-24 hours
- [ ] Track color: `#1A1A1A`
- [ ] Fill color: `#E1CAA1`
- [ ] Labels: 02h, 04h, 08h, 12h, 16h, 20h, 24h

### Review Card (Step 5)
- [ ] Background: white
- [ ] Border radius: `rounded-[20px]`
- [ ] Padding: `p-6`
- [ ] Icon container: `w-[50px] h-[50px]` bg `#E8D1AB/80`
- [ ] Bottom border: `border-b border-[#F0F0F0]`

### Loading Animation (Step 6)
- [ ] Background: `#0A0A0A`
- [ ] Central glow: `300x300` blur `100px`
- [ ] Main star: `64x64` fill `#E8D1AB`
- [ ] Rotation: 0 → 180 → 360 (3s loop)
- [ ] Scale pulse: 0.8 → 1.2 → 0.8
- [ ] Secondary stars: scale 0 → 1 → 0 (2s, 2.5s)

---

## Animation Verification

### Modal Animations
- [ ] Backdrop fade in/out: opacity 0 ↔ 1
- [ ] Modal scale in: scale 0.95 → 1, y 20 → 0
- [ ] Modal scale out: scale 1 → 0.95, opacity 1 → 0

### Button Animations
- [ ] Hover state: smooth color transition
- [ ] Disabled state: opacity 50%, no pointer events

### Dropdown Animations
- [ ] Chevron rotation: 180deg transition-transform 200ms
- [ ] Dropdown appear: instant (no animation specified)

### Loading Animations
- [ ] Star rotation: continuous 3s ease-in-out
- [ ] Star scale: 0.8 ↔ 1.2 smooth transition
- [ ] Secondary stars: staggered delays (0.5s, 1.2s)
- [ ] Text fade in: opacity 0 → 1, y 10 → 0, delay 0.2s

### Input Animations
- [ ] Border color: smooth transition on focus/hover
- [ ] Slider thumb: smooth drag behavior

---

## Responsive Breakpoints

### Mobile (< 768px)
- [ ] Modal padding: `px-4`
- [ ] Step padding: `p-8`
- [ ] Single column layouts
- [ ] Button text: `text-lg`
- [ ] Header padding: `pb-10`
- [ ] Close button: `top-10 right-10`

### Tablet/Desktop (≥ 768px)
- [ ] Step padding: `md:p-[50px]`
- [ ] Multi-column grids: `md:grid-cols-2/3`
- [ ] Button text: `text-2xl`
- [ ] Header padding: `md:pb-[50px]`
- [ ] Close button: `md:top-[50px] md:right-[50px]`

### Large Desktop (≥ 1024px)
- [ ] Modal max width: `lg:w-[760px]` (steps 1,2,4,5)
- [ ] Modal max width: `lg:w-[1200px]` (step 3)
- [ ] Content centered

---

## Accessibility Verification

### Keyboard Navigation
- [ ] Tab order: logical flow through form
- [ ] Enter key: submits active button
- [ ] Escape key: closes modal (should verify)
- [ ] Focus visible: outlines on interactive elements

### Screen Readers
- [ ] Labels: all inputs have descriptive labels
- [ ] Button text: descriptive action names
- [ ] Error messages: announce via toast
- [ ] Modal: proper ARIA attributes (check)

### Visual Accessibility
- [ ] Color contrast: text readable on backgrounds
- [ ] Focus indicators: visible on all inputs
- [ ] Disabled states: clearly indicated
- [ ] Error states: visual + text feedback

---

## Edge Case Testing

### Data Validation
- [ ] Empty inputs: appropriate error messages
- [ ] Past dates: blocked with error message
- [ ] Minimum budget: enforced at $100
- [ ] Short strings: min 3 chars for name/location
- [ ] Budget constraints: min + 500 ≤ max

### State Management
- [ ] Modal closes: state resets
- [ ] Back button: preserves previous data
- [ ] Next button: validates before advancing
- [ ] Multiple opens: starts fresh each time

### Error Recovery
- [ ] Validation error: stays on current step
- [ ] API error (mocked): returns to review step
- [ ] Toast notifications: appropriate duration

### Loading States
- [ ] Button disabled: during submission
- [ ] Loading step: 2-second animation
- [ ] Console logging: all expected outputs

---

## Browser-Specific Checks

### Chrome/Edge (Chromium)
- [ ] Range slider thumb: renders correctly
- [ ] Date picker: MUI overlay works
- [ ] Animations: smooth 60fps
- [ ] Backdrop blur: renders

### Firefox
- [ ] Range slider thumb: Firefox-specific styling
- [ ] Date picker: functions correctly
- [ ] Grid layouts: proper spacing
- [ ] Framer Motion: animations work

### Safari
- [ ] Range slider: webkit-specific styling
- [ ] Date picker: iOS compatibility
- [ ] Blur effects: render correctly
- [ ] Touch interactions: responsive

---

## Final Verification

### Side-by-Side Comparison
1. Open original: `/src/components/landing-v2/booking/`
2. Open migration: `/src/components/booking/v2/`
3. Compare each step visually
4. Verify color values match exactly
5. Check spacing with browser DevTools
6. Measure element dimensions

### DevTools Inspection
- [ ] Colors: use color picker to verify hex values
- [ ] Spacing: measure padding/margins
- [ ] Animations: inspect computed styles
- [ ] Responsive: test all breakpoints

### User Flow Testing
- [ ] Complete booking: start to finish
- [ ] Use back buttons: verify data preservation
- [ ] Trigger all validations: see all error messages
- [ ] Test all input types: text, select, date, range
- [ ] Verify console output: matches expected format

---

## Sign-Off

When all items are checked:

**Visual Accuracy:** ___% (target: 100%)
**Functional Accuracy:** ___% (target: 100%)
**Responsive Design:** ___% (target: 100%)
**Animation Quality:** ___% (target: 100%)

**Reviewed By:** _________________
**Date:** _________________
**Approved:** [ ] Yes [ ] No

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________
