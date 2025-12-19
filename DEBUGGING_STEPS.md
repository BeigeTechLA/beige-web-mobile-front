# Debugging Steps for event_location Error

## The Error
```
Uncaught Error: Minified React error #31
Objects are not valid as a React child
object with keys {address, coordinates, hasCoordinates}
```

## Quick Fixes to Try

### 1. Clear Browser Storage
```javascript
// Open browser console and run:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 2. Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

### 3. Check for Direct Object Rendering

Search your codebase for any of these patterns:
```tsx
// ❌ WRONG - Will cause error
<div>{booking.event_location}</div>
<div>{result.event_location}</div>

// ✅ CORRECT - Use helper function
import { formatLocationForDisplay } from '@/lib/utils/locationHelpers';
<div>{formatLocationForDisplay(booking.event_location)}</div>
```

## Where to Look

1. **Toast Notifications** - Check if any toast is displaying the full result object
2. **Debug Components** - Look for any dev/debug panels showing Redux state
3. **Props** - Check if event_location object is being passed as a string prop

## Using Location Data Correctly

```typescript
import { formatLocationForDisplay, hasValidCoordinates } from '@/lib/utils/locationHelpers';

// Display address as text
<p>{formatLocationForDisplay(booking.event_location)}</p>

// Check if has coordinates
{hasValidCoordinates(booking.event_location) && (
  <Map
    lat={booking.event_location.coordinates.lat}
    lng={booking.event_location.coordinates.lng}
  />
)}

// Access individual fields safely
<div>
  {booking.event_location?.address || 'No address'}
</div>
```

## Run Development Mode

To get better error messages:
```bash
NODE_ENV=development npm run dev
```

This will show the exact component name causing the error instead of minified code.
