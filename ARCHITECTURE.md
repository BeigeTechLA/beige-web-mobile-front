# API Integration Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js 15 Frontend                          │
│                  (revure-v2-landing)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/JSON
                              │ JWT Auth
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│              Redux Store (RTK Query)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Auth State  │  │ Booking State│  │  API Cache   │       │
│  │  - user      │  │  - formData  │  │  - creators  │       │
│  │  - token     │  │  - draft     │  │  - bookings  │       │
│  │  - isAuth    │  │              │  │  - waitlist  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└───────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                   API Client Layer                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Axios Client (apiClient.ts)                            │ │
│  │  - JWT Token Interceptor                                │ │
│  │  - Error Handler                                        │ │
│  │  - Cookie Manager                                       │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              │ Bearer Token
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│           Express Backend API (revure-v2-backend)              │
│                    http://localhost:5001/v1/                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  /auth   │  │/creators │  │/bookings │  │/waitlist │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└───────────────────────────────────────────────────────────────┘
                              │
                              │ Sequelize ORM
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                     MySQL Database                             │
│                        (revurge)                               │
└───────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Authentication Flow

```
User Action (Login)
       │
       ▼
┌──────────────────┐
│  Login Form      │
│  Component       │
└────────┬─────────┘
         │ useAuth().login()
         │
         ▼
┌──────────────────┐
│  useLoginMutation│ ──────┐
│  (RTK Query)     │       │ POST /auth/login
└────────┬─────────┘       │
         │                 │
         │                 ▼
         │         ┌──────────────────┐
         │         │  Backend API     │
         │         │  authController  │
         │         └────────┬─────────┘
         │                  │
         │                  │ JWT + User Data
         │                  │
         │         ┌────────▼─────────┐
         │         │  Response        │
         │         │  { token, user } │
         │         └────────┬─────────┘
         │                  │
         │◄─────────────────┘
         │
         ▼
┌──────────────────┐
│  setCredentials  │
│  Action          │
└────────┬─────────┘
         │
         ├──────────────────────┐
         │                      │
         ▼                      ▼
┌──────────────────┐   ┌──────────────────┐
│  Redux State     │   │  Cookies         │
│  auth.user       │   │  revure_token    │
│  auth.token      │   │  revure_user     │
│  auth.isAuth     │   │  (7 day expiry)  │
└──────────────────┘   └──────────────────┘
```

### 2. API Request Flow (Protected Endpoint)

```
Component Hook
       │
       ▼
┌──────────────────────┐
│  useCreateBooking    │
│  Mutation            │
└───────────┬──────────┘
            │
            ▼
┌──────────────────────┐
│  RTK Query           │
│  Middleware          │
└───────────┬──────────┘
            │
            ▼
┌──────────────────────┐
│  fetchBaseQuery      │
│  prepareHeaders      │
│  + JWT Token         │
└───────────┬──────────┘
            │
            ▼
┌──────────────────────┐
│  Axios Interceptor   │
│  Authorization:      │
│  Bearer <token>      │
└───────────┬──────────┘
            │
            │ HTTPS POST
            │
            ▼
┌──────────────────────┐
│  Backend API         │
│  /bookings/create    │
└───────────┬──────────┘
            │
            ├─────────────┐
            │             │
    ✅ Success       ❌ Error (401)
            │             │
            ▼             ▼
    ┌──────────┐   ┌──────────────┐
    │ Response │   │ Auto Logout  │
    │ + Cache  │   │ Clear Token  │
    └──────────┘   │ Clear Cookies│
                   └──────────────┘
```

### 3. Creator Search Flow

```
Search Results Page
       │
       ▼
┌──────────────────────┐
│ useSearchCreators    │
│ Query({ budget,      │
│   location, ... })   │
└───────────┬──────────┘
            │
            ▼
┌──────────────────────┐
│  Check Cache         │
│  (RTK Query)         │
└───────────┬──────────┘
            │
        Cache Hit?
       ┌────┴────┐
       │         │
      YES       NO
       │         │
       │         ▼
       │  ┌──────────────┐
       │  │ API Request  │
       │  │ GET /creators│
       │  │ /search      │
       │  └──────┬───────┘
       │         │
       │         ▼
       │  ┌──────────────┐
       │  │ Backend      │
       │  │ Sequelize    │
       │  │ MySQL Query  │
       │  └──────┬───────┘
       │         │
       │         ▼
       │  ┌──────────────┐
       │  │ Update Cache │
       │  └──────┬───────┘
       │         │
       └─────────┘
               │
               ▼
       ┌──────────────┐
       │ Return Data  │
       │ { data: [...],│
       │  pagination }│
       └──────┬───────┘
              │
              ▼
       ┌──────────────┐
       │ Render UI    │
       │ CreatorCards │
       └──────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    app/layout.tsx                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │          <ReduxProvider>                          │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │         Application Components              │ │ │
│  │  │                                              │ │ │
│  │  │  ┌──────────────────────────────────────┐  │ │ │
│  │  │  │     Pages & Components               │  │ │ │
│  │  │  │                                       │  │ │ │
│  │  │  │  ┌────────────────────────────────┐  │  │ │ │
│  │  │  │  │  useAuth Hook                  │  │  │ │ │
│  │  │  │  │  - login()                     │  │  │ │ │
│  │  │  │  │  - logout()                    │  │  │ │ │
│  │  │  │  │  - register()                  │  │  │ │ │
│  │  │  │  │  - user                        │  │  │ │ │
│  │  │  │  │  - isAuthenticated             │  │  │ │ │
│  │  │  │  └────────────────────────────────┘  │  │ │ │
│  │  │  │                                       │  │ │ │
│  │  │  │  ┌────────────────────────────────┐  │  │ │ │
│  │  │  │  │  RTK Query Hooks               │  │  │ │ │
│  │  │  │  │  - useSearchCreatorsQuery      │  │  │ │ │
│  │  │  │  │  - useGetCreatorProfileQuery   │  │  │ │ │
│  │  │  │  │  - useCreateBookingMutation    │  │  │ │ │
│  │  │  │  │  - useJoinWaitlistMutation     │  │  │ │ │
│  │  │  │  └────────────────────────────────┘  │  │ │ │
│  │  │  │                                       │  │ │ │
│  │  │  └───────────────────────────────────────┘  │ │ │
│  │  │                                              │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## File Dependency Graph

```
Components (src/components/)
    │
    ├── Uses → useAuth (lib/hooks/useAuth.ts)
    │           │
    │           ├── Uses → authSlice (actions)
    │           │           │
    │           │           └── Updates → Redux Store
    │           │
    │           └── Uses → authApi (mutations/queries)
    │                       │
    │                       └── Calls → Backend API
    │
    ├── Uses → RTK Query Hooks
    │           │
    │           ├── creatorsApi
    │           ├── bookingsApi
    │           └── waitlistApi
    │               │
    │               └── All use → fetchBaseQuery
    │                             │
    │                             └── Configured with → apiClient
    │                                                    │
    │                                                    └── Axios + Interceptors
    │
    └── Uses → Redux State (via useAppSelector)
                │
                └── Reads from → Redux Store
                                  │
                                  ├── auth slice
                                  └── booking slice
```

## State Management

```
Redux Store
│
├── auth (authSlice.ts)
│   ├── user: User | null
│   ├── token: string | null
│   ├── isAuthenticated: boolean
│   └── isLoading: boolean
│
├── booking (bookingSlice.ts)
│   ├── currentBooking: Partial<BookingData> | null
│   └── isDraft: boolean
│
├── authApi (RTK Query)
│   ├── endpoints
│   │   ├── login
│   │   ├── register
│   │   ├── quickRegister
│   │   └── getCurrentUser
│   └── cache
│
├── creatorsApi (RTK Query)
│   ├── endpoints
│   │   ├── searchCreators
│   │   ├── getCreatorProfile
│   │   ├── getCreatorPortfolio
│   │   └── getCreatorReviews
│   └── cache
│
├── bookingsApi (RTK Query)
│   ├── endpoints
│   │   ├── createBooking
│   │   ├── getUserBookings
│   │   ├── getBooking
│   │   └── updateBooking
│   └── cache
│
└── waitlistApi (RTK Query)
    ├── endpoints
    │   └── joinWaitlist
    └── cache
```

## Cookie Management

```
Browser Cookies
│
├── revure_token
│   ├── Value: JWT token string
│   ├── Expiry: 7 days
│   ├── Path: /
│   └── Usage: Auto-attached to API requests
│
└── revure_user
    ├── Value: JSON stringified User object
    ├── Expiry: 7 days
    ├── Path: /
    └── Usage: Restore auth state on reload
```

## Error Handling Flow

```
API Call
   │
   ▼
Try/Catch
   │
   ├──────── Success ────────┐
   │                         │
   │                         ▼
   │                  Update State
   │                  Show Success Toast
   │
   └──────── Error ──────────┐
                             │
                             ▼
                    Axios Interceptor
                             │
                    ┌────────┴────────┐
                    │                 │
                401/403          Other Errors
                    │                 │
                    ▼                 ▼
            Auto Logout         Show Error Toast
            Clear Cookies       Return Error Object
            Redirect?           { status, message }
```

## Technology Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **State Management:** Redux Toolkit + RTK Query
- **HTTP Client:** Axios
- **UI Library:** Material-UI (MUI)
- **Styling:** Tailwind CSS
- **Notifications:** Sonner (Toast)
- **TypeScript:** Full type safety

### Backend
- **Framework:** Express.js
- **Database:** MySQL
- **ORM:** Sequelize
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **CORS:** Enabled for localhost:3000

## Security Features

1. **JWT Authentication**
   - Bearer token in Authorization header
   - 7-day token expiry
   - HTTP-only cookies (configurable)

2. **CORS Protection**
   - Configured allowed origins
   - Credentials enabled for cookies

3. **Request Validation**
   - TypeScript types enforce structure
   - Backend validation on all inputs

4. **Auto-logout**
   - On 401 response
   - On token expiry

## Performance Optimizations

1. **RTK Query Caching**
   - Automatic request deduplication
   - Cache invalidation on mutations
   - Background refetching

2. **React Query Features**
   - Stale-while-revalidate
   - Window focus refetching
   - Optimistic updates ready

3. **Code Splitting**
   - Next.js automatic code splitting
   - Dynamic imports for modals

## Development Workflow

```
Developer Makes Change
        │
        ▼
Hot Module Reload (Next.js)
        │
        ▼
TypeScript Compilation
        │
        ├──── Type Error ────┐
        │                    │
        │                    ▼
        │            Show in IDE
        │            Fix Error
        │
        ▼
Redux DevTools
Browser Console
        │
        ▼
API Request in Network Tab
        │
        ▼
Backend Logs
```

## Monitoring Points

1. **Frontend**
   - Redux DevTools (state changes)
   - Browser Console (errors)
   - Network Tab (API calls)
   - React DevTools (component tree)

2. **Backend**
   - Express logs (requests)
   - MySQL logs (queries)
   - Error logs (failures)

## Deployment Considerations

### Environment Variables
```env
# Frontend
NEXT_PUBLIC_API_ENDPOINT=https://api.revure.com/v1/

# Backend
DATABASE_URL=mysql://...
JWT_SECRET=...
CORS_ORIGINS=https://revure.com
```

### Build Process
```bash
# Frontend
npm run build
npm run start

# Backend
npm start
```

---

**Architecture Version:** 1.0
**Last Updated:** December 18, 2024
