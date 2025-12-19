import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import bookingReducer from './features/booking/bookingSlice';
import { authApi } from './features/auth/authApi';
import { creatorsApi } from './features/creators/creatorsApi';
import { bookingsApi } from './features/booking/bookingApi';
import { guestBookingApi } from './features/booking/guestBookingApi';
import { waitlistApi } from './features/waitlist/waitlistApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    booking: bookingReducer,
    [authApi.reducerPath]: authApi.reducer,
    [creatorsApi.reducerPath]: creatorsApi.reducer,
    [bookingsApi.reducerPath]: bookingsApi.reducer,
    [guestBookingApi.reducerPath]: guestBookingApi.reducer,
    [waitlistApi.reducerPath]: waitlistApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      creatorsApi.middleware,
      bookingsApi.middleware,
      guestBookingApi.middleware,
      waitlistApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
