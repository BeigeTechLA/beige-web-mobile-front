# API Integration Guide - Revure V2 Landing

## Overview

This guide demonstrates how to integrate the revure-v2-backend APIs with the Next.js frontend using Redux Toolkit and RTK Query.

## Setup Complete

### Installed Dependencies
- `axios` - HTTP client for direct API calls
- `@reduxjs/toolkit` - State management and RTK Query
- `react-redux` - React bindings for Redux
- `js-cookie` - Cookie management for JWT tokens

### Created Files

#### Core Infrastructure
1. `/lib/apiClient.ts` - Axios client with JWT interceptors
2. `/lib/types.ts` - TypeScript interfaces for all API data
3. `/lib/redux/store.ts` - Redux store configuration
4. `/lib/redux/hooks.ts` - Typed Redux hooks
5. `/lib/redux/ReduxProvider.tsx` - Redux Provider component

#### Redux Features
1. `/lib/redux/features/auth/authSlice.ts` - Auth state management
2. `/lib/redux/features/auth/authApi.ts` - Auth API endpoints
3. `/lib/redux/features/booking/bookingSlice.ts` - Booking state
4. `/lib/redux/features/booking/bookingApi.ts` - Booking API endpoints
5. `/lib/redux/features/creators/creatorsApi.ts` - Creator search/profile APIs
6. `/lib/redux/features/waitlist/waitlistApi.ts` - Waitlist API

#### Custom Hooks
1. `/lib/hooks/useAuth.ts` - Authentication hook with login/logout/register

## Usage Examples

### 1. Waitlist Form (Already Integrated)

The Waitlist component at `/src/components/landing/Waitlist.tsx` now uses the API:

```tsx
import { useJoinWaitlistMutation } from "@/lib/redux/features/waitlist/waitlistApi";
import { toast } from "sonner";

const [joinWaitlist, { isLoading }] = useJoinWaitlistMutation();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await joinWaitlist(formData).unwrap();
    toast.success("You have successfully joined the waitlist!");
  } catch (error) {
    toast.error("Failed to join waitlist. Please try again.");
  }
};
```

### 2. Authentication Flow

#### Using the useAuth Hook

```tsx
import { useAuth } from "@/lib/hooks/useAuth";

function LoginComponent() {
  const { login, isLoading, isAuthenticated, user } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login({ email, password });
      toast.success(`Welcome back, ${user?.name}!`);
    } catch (error) {
      toast.error("Login failed. Please check your credentials.");
    }
  };

  if (isAuthenticated) {
    return <div>Welcome, {user?.name}</div>;
  }

  return <LoginForm onSubmit={handleLogin} isLoading={isLoading} />;
}
```

#### Quick Register During Booking

```tsx
import { useAuth } from "@/lib/hooks/useAuth";

function QuickRegisterForm() {
  const { quickRegister, isLoading } = useAuth();

  const handleQuickRegister = async (data: { name: string; email: string; phone?: string }) => {
    try {
      const result = await quickRegister(data);
      toast.success("Account created! Continue with your booking.");
      // User is now authenticated, proceed with booking
    } catch (error) {
      toast.error("Registration failed. Please try again.");
    }
  };
}
```

### 3. Creator Search

```tsx
import { useSearchCreatorsQuery } from "@/lib/redux/features/creators/creatorsApi";

function SearchResults() {
  const [searchParams, setSearchParams] = useState({
    budget: 500,
    location: "Los Angeles",
    page: 1,
    limit: 20
  });

  const { data, isLoading, error } = useSearchCreatorsQuery(searchParams);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {data?.data.map(creator => (
        <CreatorCard key={creator.crew_member_id} creator={creator} />
      ))}
      <Pagination
        currentPage={data?.pagination.page}
        totalPages={data?.pagination.totalPages}
        onPageChange={(page) => setSearchParams({ ...searchParams, page })}
      />
    </div>
  );
}
```

### 4. Creator Profile

```tsx
import { useGetCreatorProfileQuery } from "@/lib/redux/features/creators/creatorsApi";
import { useParams } from "next/navigation";

function CreatorProfile() {
  const params = useParams();
  const creatorId = parseInt(params.creatorId as string);

  const { data: creator, isLoading } = useGetCreatorProfileQuery(creatorId);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1>{creator?.name}</h1>
      <p>{creator?.role_name}</p>
      <p>${creator?.hourly_rate}/hr</p>
      <p>Rating: {creator?.rating} ({creator?.total_reviews} reviews)</p>
      <div>
        <h2>Skills</h2>
        {creator?.skills?.map(skill => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
    </div>
  );
}
```

### 5. Create Booking

```tsx
import { useCreateBookingMutation } from "@/lib/redux/features/booking/bookingApi";
import { useAuth } from "@/lib/hooks/useAuth";

function BookingForm() {
  const { isAuthenticated } = useAuth();
  const [createBooking, { isLoading }] = useCreateBookingMutation();

  const handleCreateBooking = async (bookingData: BookingData) => {
    if (!isAuthenticated) {
      toast.error("Please login to create a booking");
      return;
    }

    try {
      const result = await createBooking(bookingData).unwrap();
      toast.success(`Booking created! Confirmation: ${result.confirmation_number}`);
      // Redirect to booking confirmation page
    } catch (error) {
      toast.error("Failed to create booking. Please try again.");
    }
  };

  return <BookingFormUI onSubmit={handleCreateBooking} isLoading={isLoading} />;
}
```

### 6. User Bookings List

```tsx
import { useGetUserBookingsQuery } from "@/lib/redux/features/booking/bookingApi";

function MyBookings() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetUserBookingsQuery({ page, limit: 10 });

  return (
    <div>
      <h1>My Bookings</h1>
      {data?.data.map(booking => (
        <div key={booking.stream_project_booking_id}>
          <h3>{booking.order_name}</h3>
          <p>Status: {booking.status}</p>
          <p>Date: {new Date(booking.start_date_time).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
```

## Backend API Endpoints

### Authentication
- `POST /v1/auth/login` - Login with email/password
- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/quick-register` - Quick signup during booking
- `GET /v1/auth/me` - Get current user (requires auth)
- `GET /v1/auth/permissions/:role` - Get role permissions

### Creators
- `GET /v1/creators/search` - Search creators with filters
  - Query params: `budget`, `location`, `skills`, `content_type`, `page`, `limit`
- `GET /v1/creators/:id` - Get creator profile
- `GET /v1/creators/:id/portfolio` - Get creator portfolio
- `GET /v1/creators/:id/reviews` - Get creator reviews

### Bookings (Requires Authentication)
- `POST /v1/bookings/create` - Create new booking
- `GET /v1/bookings` - Get user's bookings
  - Query params: `page`, `limit`, `status`
- `GET /v1/bookings/:id` - Get booking details
- `PUT /v1/bookings/:id` - Update booking

### Waitlist
- `POST /v1/waitlist/join` - Join waitlist

## Environment Variables

Required in `.env` or `.env.local`:

```env
NEXT_PUBLIC_API_ENDPOINT=http://localhost:5001/v1/
```

## Authentication Flow

1. User logs in via `login()` or registers via `register()`
2. JWT token is stored in cookies (`revure_token`)
3. User data is stored in Redux state and cookies (`revure_user`)
4. All subsequent API requests include JWT token in Authorization header
5. On 401 response, token is cleared and user is logged out

## Error Handling

All API calls include error handling:

```tsx
try {
  const result = await apiCall(data).unwrap();
  // Handle success
} catch (error) {
  // Error shape: { status: number, message: string, details?: unknown }
  const errorMessage = error.message || "An error occurred";
  toast.error(errorMessage);
}
```

## Next Steps

1. Update search results page to use `useSearchCreatorsQuery`
2. Update creator profile page to use `useGetCreatorProfileQuery`
3. Implement authentication in BookingModal components
4. Add booking creation flow
5. Create user dashboard for managing bookings

## Testing

Start the backend server:
```bash
cd /Users/amrik/Documents/revure/revure-v2-backend
npm run dev
```

Start the frontend:
```bash
cd /Users/amrik/Documents/revure/revure-v2-landing
npm run dev
```

Test the waitlist form at: http://localhost:3000/#waitlist
