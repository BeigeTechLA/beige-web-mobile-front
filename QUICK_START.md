# Quick Start Guide - API Integration

## Current Status

**BUILD STATUS:** ✅ Production build successful

The API integration is complete and ready to use. The Waitlist component is already integrated and working.

## Start Development

### 1. Start Backend API (Terminal 1)
```bash
cd /Users/amrik/Documents/revure/revure-v2-backend
npm run dev
```
Expected output: `Revure V2 Backend Server running on port 5001`

### 2. Start Frontend (Terminal 2)
```bash
cd /Users/amrik/Documents/revure/revure-v2-landing
npm run dev
```
Expected output: `ready - started server on 0.0.0.0:3000`

### 3. Test the Integration

Open http://localhost:3000 in your browser.

#### Test 1: Waitlist Form (Already Working)
1. Scroll to the "Coming to Your City Soon" section
2. Fill out the waitlist form:
   - Full Name: "John Doe"
   - Email: "john@example.com"
   - Phone: "555-1234"
   - Company: "Test Company"
   - Location: "New York"
3. Click "Join Waitlist"
4. You should see:
   - Toast notification: "You have successfully joined the waitlist!"
   - Backend console: `POST /v1/waitlist/join`
   - Form resets after 3 seconds

#### Test 2: Check Backend Response
Open browser DevTools (F12) → Network tab, submit waitlist form again:
- Request URL: `http://localhost:5001/v1/waitlist/join`
- Method: POST
- Status: 200 OK
- Response: JSON with waitlist entry data

## Quick API Usage Examples

### Example 1: Use Auth Hook
```tsx
"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";

export function LoginButton() {
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    try {
      await login({
        email: "test@example.com",
        password: "password123"
      });
      toast.success("Login successful!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <button onClick={handleLogin} disabled={isLoading}>
      {isLoading ? "Logging in..." : "Login"}
    </button>
  );
}
```

### Example 2: Search Creators
```tsx
"use client";

import { useSearchCreatorsQuery } from "@/lib/redux/features/creators/creatorsApi";

export function CreatorList() {
  const { data, isLoading } = useSearchCreatorsQuery({
    budget: 500,
    location: "Los Angeles",
    page: 1,
    limit: 10
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.data.map(creator => (
        <div key={creator.crew_member_id}>
          <h3>{creator.name}</h3>
          <p>{creator.role_name}</p>
          <p>${creator.hourly_rate}/hr</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Create Booking
```tsx
"use client";

import { useCreateBookingMutation } from "@/lib/redux/features/booking/bookingApi";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";

export function BookingButton() {
  const { isAuthenticated } = useAuth();
  const [createBooking, { isLoading }] = useCreateBookingMutation();

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error("Please login first");
      return;
    }

    try {
      const result = await createBooking({
        order_name: "My Event",
        start_date_time: new Date().toISOString(),
        duration_hours: 4,
        location: "Los Angeles",
        budget_min: 500,
        budget_max: 1000
      }).unwrap();

      toast.success(`Booking created! Confirmation: ${result.confirmation_number}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <button onClick={handleBooking} disabled={isLoading}>
      {isLoading ? "Creating..." : "Book Now"}
    </button>
  );
}
```

## Available Hooks & APIs

### Authentication
```tsx
import { useAuth } from "@/lib/hooks/useAuth";
import {
  useLoginMutation,
  useRegisterMutation,
  useQuickRegisterMutation,
  useGetCurrentUserQuery
} from "@/lib/redux/features/auth/authApi";
```

### Creators
```tsx
import {
  useSearchCreatorsQuery,
  useGetCreatorProfileQuery,
  useGetCreatorPortfolioQuery,
  useGetCreatorReviewsQuery
} from "@/lib/redux/features/creators/creatorsApi";
```

### Bookings
```tsx
import {
  useCreateBookingMutation,
  useGetUserBookingsQuery,
  useGetBookingQuery,
  useUpdateBookingMutation
} from "@/lib/redux/features/booking/bookingApi";
```

### Waitlist
```tsx
import { useJoinWaitlistMutation } from "@/lib/redux/features/waitlist/waitlistApi";
```

## Environment Setup

Ensure `.env` file exists with:
```env
NEXT_PUBLIC_API_ENDPOINT=http://localhost:5001/v1/
```

## Debugging

### Check if API is reachable
```bash
curl http://localhost:5001/health
```
Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-18T...",
  "service": "revure-v2-backend"
}
```

### Check browser console
Open DevTools (F12) → Console
- Look for API request logs
- Check for error messages
- Verify Redux state updates

### Check backend logs
Terminal running backend should show:
```
[2024-12-18T...] POST /v1/waitlist/join
Headers: {...}
Body: {...}
```

## Common Issues

### Issue: CORS Error
**Solution:** Ensure backend CORS is configured for http://localhost:3000

### Issue: 401 Unauthorized
**Solution:** Check if JWT token is present in cookies (DevTools → Application → Cookies)

### Issue: Network Error
**Solution:**
1. Verify backend is running on port 5001
2. Check NEXT_PUBLIC_API_ENDPOINT in .env
3. Ensure no firewall blocking localhost

### Issue: TypeScript Errors
**Solution:** Run `npm install` to ensure all types are installed

## Next Steps

1. ✅ Waitlist form integrated
2. Integrate search results page with real API
3. Integrate creator profile with real API
4. Add authentication modal
5. Complete booking flow
6. Add user dashboard

See `API_INTEGRATION_GUIDE.md` for detailed documentation.
See `EXAMPLE_IMPLEMENTATIONS.md` for code examples.

## Support

- Full API documentation: `/API_INTEGRATION_GUIDE.md`
- Code examples: `/EXAMPLE_IMPLEMENTATIONS.md`
- Integration summary: `/INTEGRATION_COMPLETE.md`
