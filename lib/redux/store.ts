import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./features/auth/authSlice";
import bookingReducer from "./features/booking/bookingSlice";
import pricingReducer from "./features/pricing/pricingSlice";
import { authApi } from "./features/auth/authApi";
import { creatorsApi } from "./features/creators/creatorsApi";
import { bookingsApi } from "./features/booking/bookingApi";
import { guestBookingApi } from "./features/booking/guestBookingApi";
import { waitlistApi } from "./features/waitlist/waitlistApi";
import { investorApi } from "./features/investors/investorApi";
import { pricingApi } from "./features/pricing/pricingApi";

// Persist config for booking slice only
const bookingPersistConfig = {
  key: "booking",
  storage,
  // Whitelist specific fields to persist
  whitelist: ["crewSize", "selectedCreators", "crewBreakdown", "contentTypes"],
};

// Create persisted booking reducer
const persistedBookingReducer = persistReducer(
  bookingPersistConfig,
  bookingReducer
);

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  booking: persistedBookingReducer,
  pricing: pricingReducer,
  [authApi.reducerPath]: authApi.reducer,
  [creatorsApi.reducerPath]: creatorsApi.reducer,
  [bookingsApi.reducerPath]: bookingsApi.reducer,
  [guestBookingApi.reducerPath]: guestBookingApi.reducer,
  [waitlistApi.reducerPath]: waitlistApi.reducer,
  [investorApi.reducerPath]: investorApi.reducer,
  [pricingApi.reducerPath]: pricingApi.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist action types
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      authApi.middleware,
      creatorsApi.middleware,
      bookingsApi.middleware,
      guestBookingApi.middleware,
      waitlistApi.middleware,
      investorApi.middleware,
      pricingApi.middleware
    ),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
