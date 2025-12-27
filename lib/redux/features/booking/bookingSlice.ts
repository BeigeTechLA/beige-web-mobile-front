import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CrewBreakdown {
  videographer: number;
  photographer: number;
  cinematographer: number;
}

export interface BookingState {
  crewSize: number;
  crewBreakdown: CrewBreakdown;
  contentTypes: string[];
}

const initialState: BookingState = {
  crewSize: 1,
  crewBreakdown: { videographer: 0, photographer: 0, cinematographer: 0 },
  contentTypes: [],
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setCrewSize: (state, action: PayloadAction<number>) => {
      state.crewSize = Math.max(1, action.payload);
    },
    
    setCrewBreakdown: (state, action: PayloadAction<CrewBreakdown>) => {
      state.crewBreakdown = action.payload;
    },
    
    updateCrewBreakdownItem: (state, action: PayloadAction<{ type: keyof CrewBreakdown; count: number }>) => {
      state.crewBreakdown[action.payload.type] = Math.max(0, action.payload.count);
    },
    
    setContentTypes: (state, action: PayloadAction<string[]>) => {
      state.contentTypes = action.payload;
    },
    
    resetBooking: () => initialState,
  },
});

export const {
  setCrewSize,
  setCrewBreakdown,
  updateCrewBreakdownItem,
  setContentTypes,
  resetBooking,
} = bookingSlice.actions;

// Selectors
export const selectCrewSize = (state: { booking: BookingState }) => state.booking.crewSize;
export const selectCrewBreakdown = (state: { booking: BookingState }) => state.booking.crewBreakdown;
export const selectContentTypes = (state: { booking: BookingState }) => state.booking.contentTypes;
export const selectTotalCrewAssigned = (state: { booking: BookingState }) => 
  Object.values(state.booking.crewBreakdown).reduce((a, b) => a + b, 0);

export default bookingSlice.reducer;
