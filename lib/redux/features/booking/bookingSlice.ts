import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BookingData } from '@/lib/types';

interface BookingState {
  currentBooking: Partial<BookingData> | null;
  isDraft: boolean;
}

const initialState: BookingState = {
  currentBooking: null,
  isDraft: false,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setBookingData: (state, action: PayloadAction<Partial<BookingData>>) => {
      state.currentBooking = {
        ...state.currentBooking,
        ...action.payload,
      };
    },
    clearBooking: (state) => {
      state.currentBooking = null;
      state.isDraft = false;
    },
    setDraft: (state, action: PayloadAction<boolean>) => {
      state.isDraft = action.payload;
    },
  },
});

export const { setBookingData, clearBooking, setDraft } = bookingSlice.actions;
export default bookingSlice.reducer;
