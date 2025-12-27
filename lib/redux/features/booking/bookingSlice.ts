import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';

export interface CrewBreakdown {
  videographer: number;
  photographer: number;
  cinematographer: number;
}

export interface SelectedCreator {
  id: string;
  name: string;
  role: string;
  image: string;
  hourlyRate: number;
}

export interface BookingState {
  crewSize: number;
  crewBreakdown: CrewBreakdown;
  contentTypes: string[];
  selectedCreators: SelectedCreator[];
}

const initialState: BookingState = {
  crewSize: 1,
  crewBreakdown: { videographer: 0, photographer: 0, cinematographer: 0 },
  contentTypes: [],
  selectedCreators: [],
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setCrewSize: (state, action: PayloadAction<number>) => {
      state.crewSize = Math.max(1, action.payload);
      // If crew size is reduced, remove excess selected creators
      if (state.selectedCreators.length > state.crewSize) {
        state.selectedCreators = state.selectedCreators.slice(0, state.crewSize);
      }
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
    
    // New actions for selected creators
    addCreator: (state, action: PayloadAction<SelectedCreator>) => {
      // Don't add if already selected or crew is full
      const alreadySelected = state.selectedCreators.some(c => c.id === action.payload.id);
      const crewFull = state.selectedCreators.length >= state.crewSize;
      
      if (!alreadySelected && !crewFull) {
        state.selectedCreators.push(action.payload);
      }
    },
    
    removeCreator: (state, action: PayloadAction<string>) => {
      state.selectedCreators = state.selectedCreators.filter(c => c.id !== action.payload);
    },
    
    clearSelectedCreators: (state) => {
      state.selectedCreators = [];
    },
    
    resetBooking: () => initialState,
  },
});

export const {
  setCrewSize,
  setCrewBreakdown,
  updateCrewBreakdownItem,
  setContentTypes,
  addCreator,
  removeCreator,
  clearSelectedCreators,
  resetBooking,
} = bookingSlice.actions;

// Base selectors
export const selectCrewSize = (state: { booking: BookingState }) => state.booking.crewSize;
export const selectCrewBreakdown = (state: { booking: BookingState }) => state.booking.crewBreakdown;
export const selectContentTypes = (state: { booking: BookingState }) => state.booking.contentTypes;
export const selectSelectedCreators = (state: { booking: BookingState }) => state.booking.selectedCreators;

// Derived selectors
export const selectTotalCrewAssigned = (state: { booking: BookingState }) => 
  Object.values(state.booking.crewBreakdown).reduce((a, b) => a + b, 0);

// Memoized selectors for selected creators
export const selectSelectedCreatorIds = createSelector(
  [selectSelectedCreators],
  (selectedCreators) => selectedCreators.map(c => c.id)
);

export const selectSelectedCreatorsCount = createSelector(
  [selectSelectedCreators],
  (selectedCreators) => selectedCreators.length
);

export const selectIsCrewComplete = createSelector(
  [selectSelectedCreators, selectCrewSize],
  (selectedCreators, crewSize) => selectedCreators.length >= crewSize
);

export const selectCanAddMoreCreators = createSelector(
  [selectSelectedCreators, selectCrewSize],
  (selectedCreators, crewSize) => selectedCreators.length < crewSize
);

export default bookingSlice.reducer;
