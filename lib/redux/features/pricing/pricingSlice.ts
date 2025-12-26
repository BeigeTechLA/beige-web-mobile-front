import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { 
  PricingCategory, 
  QuoteCalculation, 
  SelectedItem,
  DiscountTier 
} from '@/lib/api/pricing';

export interface PricingState {
  // Catalog data
  categories: PricingCategory[];
  discountTiers: DiscountTier[];
  pricingMode: 'general' | 'wedding';
  
  // Selected items for quote
  selectedItems: SelectedItem[];
  shootHours: number;
  
  // Calculated quote
  quote: QuoteCalculation | null;
  
  // Loading states
  isLoadingCatalog: boolean;
  isCalculating: boolean;
  
  // Error states
  catalogError: string | null;
  calculationError: string | null;
}

const initialState: PricingState = {
  categories: [],
  discountTiers: [],
  pricingMode: 'general',
  selectedItems: [],
  shootHours: 3, // Default 3 hours
  quote: null,
  isLoadingCatalog: false,
  isCalculating: false,
  catalogError: null,
  calculationError: null,
};

const pricingSlice = createSlice({
  name: 'pricing',
  initialState,
  reducers: {
    // Catalog loading
    setCatalogLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoadingCatalog = action.payload;
    },
    
    setCatalog: (state, action: PayloadAction<PricingCategory[]>) => {
      state.categories = action.payload;
      state.catalogError = null;
    },
    
    setCatalogError: (state, action: PayloadAction<string>) => {
      state.catalogError = action.payload;
      state.isLoadingCatalog = false;
    },
    
    setDiscountTiers: (state, action: PayloadAction<DiscountTier[]>) => {
      state.discountTiers = action.payload;
    },
    
    // Pricing mode
    setPricingMode: (state, action: PayloadAction<'general' | 'wedding'>) => {
      state.pricingMode = action.payload;
      // Clear quote when mode changes
      state.quote = null;
    },
    
    // Shoot hours
    setShootHours: (state, action: PayloadAction<number>) => {
      state.shootHours = Math.max(0, action.payload);
    },
    
    // Item selection
    addItem: (state, action: PayloadAction<SelectedItem>) => {
      const existingIndex = state.selectedItems.findIndex(
        item => item.item_id === action.payload.item_id
      );
      
      if (existingIndex >= 0) {
        // Update quantity if item already exists
        state.selectedItems[existingIndex].quantity += action.payload.quantity;
      } else {
        // Add new item
        state.selectedItems.push(action.payload);
      }
    },
    
    removeItem: (state, action: PayloadAction<number>) => {
      state.selectedItems = state.selectedItems.filter(
        item => item.item_id !== action.payload
      );
    },
    
    updateItemQuantity: (state, action: PayloadAction<{ itemId: number; quantity: number }>) => {
      const item = state.selectedItems.find(i => i.item_id === action.payload.itemId);
      if (item) {
        if (action.payload.quantity <= 0) {
          // Remove item if quantity is 0 or less
          state.selectedItems = state.selectedItems.filter(
            i => i.item_id !== action.payload.itemId
          );
        } else {
          item.quantity = action.payload.quantity;
        }
      }
    },
    
    toggleItem: (state, action: PayloadAction<{ itemId: number; defaultQuantity?: number }>) => {
      const existingIndex = state.selectedItems.findIndex(
        item => item.item_id === action.payload.itemId
      );
      
      if (existingIndex >= 0) {
        // Remove if exists
        state.selectedItems.splice(existingIndex, 1);
      } else {
        // Add with default quantity
        state.selectedItems.push({
          item_id: action.payload.itemId,
          quantity: action.payload.defaultQuantity || 1,
        });
      }
    },
    
    clearItems: (state) => {
      state.selectedItems = [];
      state.quote = null;
    },
    
    // Quote calculation
    setCalculating: (state, action: PayloadAction<boolean>) => {
      state.isCalculating = action.payload;
    },
    
    setQuote: (state, action: PayloadAction<QuoteCalculation>) => {
      state.quote = action.payload;
      state.calculationError = null;
      state.isCalculating = false;
    },
    
    setCalculationError: (state, action: PayloadAction<string>) => {
      state.calculationError = action.payload;
      state.isCalculating = false;
    },
    
    clearQuote: (state) => {
      state.quote = null;
      state.calculationError = null;
    },
    
    // Reset entire pricing state
    resetPricing: () => initialState,
  },
});

export const {
  setCatalogLoading,
  setCatalog,
  setCatalogError,
  setDiscountTiers,
  setPricingMode,
  setShootHours,
  addItem,
  removeItem,
  updateItemQuantity,
  toggleItem,
  clearItems,
  setCalculating,
  setQuote,
  setCalculationError,
  clearQuote,
  resetPricing,
} = pricingSlice.actions;

// Selectors
export const selectCategories = (state: { pricing: PricingState }) => state.pricing.categories;
export const selectPricingMode = (state: { pricing: PricingState }) => state.pricing.pricingMode;
export const selectSelectedItems = (state: { pricing: PricingState }) => state.pricing.selectedItems;
export const selectShootHours = (state: { pricing: PricingState }) => state.pricing.shootHours;
export const selectQuote = (state: { pricing: PricingState }) => state.pricing.quote;
export const selectIsLoadingCatalog = (state: { pricing: PricingState }) => state.pricing.isLoadingCatalog;
export const selectIsCalculating = (state: { pricing: PricingState }) => state.pricing.isCalculating;
export const selectDiscountTiers = (state: { pricing: PricingState }) => state.pricing.discountTiers;

// Check if an item is selected
export const selectIsItemSelected = (itemId: number) => (state: { pricing: PricingState }) => 
  state.pricing.selectedItems.some(item => item.item_id === itemId);

// Get quantity for a specific item
export const selectItemQuantity = (itemId: number) => (state: { pricing: PricingState }) => {
  const item = state.pricing.selectedItems.find(i => i.item_id === itemId);
  return item?.quantity || 0;
};

// Get total number of selected items
export const selectTotalSelectedItems = (state: { pricing: PricingState }) => 
  state.pricing.selectedItems.reduce((sum, item) => sum + item.quantity, 0);

export default pricingSlice.reducer;

