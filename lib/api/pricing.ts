/**
 * Pricing API Client
 * 
 * Frontend API client for the pricing catalog and quote calculation.
 */

import apiClient from '../apiClient';

// ============================================================================
// Types
// ============================================================================

export interface PricingCategory {
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: number;
  items: PricingItem[];
}

export interface PricingItem {
  item_id: number;
  category_id: number;
  pricing_mode: 'general' | 'wedding' | 'both';
  name: string;
  slug: string;
  rate: number;
  rate_type: 'flat' | 'per_hour' | 'per_day' | 'per_unit';
  rate_unit: string | null;
  description: string | null;
  min_quantity: number;
  max_quantity: number | null;
  display_order: number;
  is_active: number;
  category?: {
    category_id: number;
    name: string;
    slug: string;
  };
}

export interface DiscountTier {
  tier_id: number;
  pricing_mode: 'general' | 'wedding';
  min_hours: number;
  max_hours: number | null;
  discount_percent: number;
}

export interface QuoteLineItem {
  item_id: number;
  item_name: string;
  category_name: string;
  category_slug: string;
  quantity: number;
  unit_price: number;
  rate_type: string;
  rate_unit: string | null;
  line_total: number;
}

export interface QuoteCalculation {
  pricingMode: 'general' | 'wedding';
  shootHours: number;
  lineItems: QuoteLineItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  priceAfterDiscount: number;
  marginPercent: number;
  marginAmount: number;
  total: number;
}

export interface SavedQuote extends QuoteCalculation {
  quote_id: number;
  booking_id: number | null;
  user_id: number | null;
  guest_email: string | null;
  status: 'draft' | 'pending' | 'confirmed' | 'expired' | 'cancelled';
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  line_items: Array<{
    line_item_id: number;
    quote_id: number;
    item_id: number;
    item_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    notes: string | null;
    pricing_item?: PricingItem;
  }>;
}

export interface SelectedItem {
  item_id: number;
  quantity: number;
}

// ============================================================================
// API Response Types
// ============================================================================

interface CatalogResponse {
  success: boolean;
  data: {
    pricingMode: string;
    categories: PricingCategory[];
  };
}

interface DiscountsResponse {
  success: boolean;
  data: {
    pricingMode: string;
    tiers: DiscountTier[];
  };
}

interface CalculateResponse {
  success: boolean;
  data: QuoteCalculation;
}

interface SaveQuoteResponse {
  success: boolean;
  data: SavedQuote;
}

interface GetQuoteResponse {
  success: boolean;
  data: SavedQuote;
}

interface GetItemsResponse {
  success: boolean;
  data: PricingItem[];
  count: number;
}

interface GetItemResponse {
  success: boolean;
  data: PricingItem;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get the pricing catalog with all categories and items
 * @param mode - Optional pricing mode ('general', 'wedding')
 * @param eventType - Optional event type to auto-determine mode
 */
export async function getCatalog(
  mode?: 'general' | 'wedding',
  eventType?: string
): Promise<PricingCategory[]> {
  const params: Record<string, string> = {};
  if (mode) params.mode = mode;
  if (eventType) params.event_type = eventType;

  const response = await apiClient.get<CatalogResponse>('/pricing/catalog', params);
  return response.data.categories;
}

/**
 * Get discount tiers for a pricing mode
 * @param mode - Pricing mode ('general' or 'wedding')
 */
export async function getDiscountTiers(
  mode: 'general' | 'wedding' = 'general'
): Promise<DiscountTier[]> {
  const response = await apiClient.get<DiscountsResponse>('/pricing/discounts', { mode });
  return response.data.tiers;
}

/**
 * Calculate a quote from selected items
 * @param items - Array of selected items with quantities
 * @param shootHours - Number of shoot hours
 * @param eventType - Event type for pricing mode determination
 * @param marginPercent - Optional margin override
 */
export async function calculateQuote(
  items: SelectedItem[],
  shootHours: number,
  eventType?: string,
  marginPercent?: number
): Promise<QuoteCalculation> {
  const response = await apiClient.post<CalculateResponse>('/pricing/calculate', {
    items,
    shootHours,
    eventType,
    marginPercent,
  });
  return response.data;
}

/**
 * Save a quote to the database
 * @param items - Array of selected items with quantities
 * @param shootHours - Number of shoot hours
 * @param eventType - Event type
 * @param options - Additional options (guestEmail, bookingId, notes)
 */
export async function saveQuote(
  items: SelectedItem[],
  shootHours: number,
  eventType: string,
  options?: {
    guestEmail?: string;
    bookingId?: number;
    notes?: string;
  }
): Promise<SavedQuote> {
  const response = await apiClient.post<SaveQuoteResponse>('/pricing/quotes', {
    items,
    shootHours,
    eventType,
    ...options,
  });
  return response.data;
}

/**
 * Get a saved quote by ID
 * @param quoteId - Quote ID
 */
export async function getQuote(quoteId: number): Promise<SavedQuote> {
  const response = await apiClient.get<GetQuoteResponse>(`/pricing/quotes/${quoteId}`);
  return response.data;
}

/**
 * Get all pricing items (for admin or item lookup)
 * @param filters - Optional filters
 */
export async function getAllItems(filters?: {
  category_id?: number;
  pricing_mode?: 'general' | 'wedding';
  is_active?: boolean;
}): Promise<PricingItem[]> {
  const params: Record<string, string | number | boolean> = {};
  if (filters?.category_id) params.category_id = filters.category_id;
  if (filters?.pricing_mode) params.pricing_mode = filters.pricing_mode;
  if (filters?.is_active !== undefined) params.is_active = filters.is_active;

  const response = await apiClient.get<GetItemsResponse>('/pricing/items', params);
  return response.data;
}

/**
 * Get a single pricing item by ID
 * @param itemId - Pricing item ID
 */
export async function getItem(itemId: number): Promise<PricingItem> {
  const response = await apiClient.get<GetItemResponse>(`/pricing/items/${itemId}`);
  return response.data;
}

/**
 * Determine pricing mode from event type (client-side helper)
 * @param eventType - Event type string
 */
export function determinePricingMode(eventType: string | undefined): 'general' | 'wedding' {
  if (!eventType) return 'general';
  const normalizedType = eventType.toLowerCase().trim();
  
  const weddingKeywords = ['wedding', 'bridal', 'engagement', 'ceremony', 'reception'];
  
  for (const keyword of weddingKeywords) {
    if (normalizedType.includes(keyword)) {
      return 'wedding';
    }
  }
  
  return 'general';
}

/**
 * Format currency for display
 * @param amount - Amount in dollars
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get rate type display text
 * @param rateType - Rate type from API
 * @param rateUnit - Rate unit from API
 */
export function getRateTypeDisplay(rateType: string, rateUnit: string | null): string {
  if (rateUnit) return rateUnit;
  
  switch (rateType) {
    case 'per_hour':
      return 'per hour';
    case 'per_day':
      return 'per day';
    case 'per_unit':
      return 'each';
    case 'flat':
    default:
      return '';
  }
}

// Export all functions as a namespace for convenience
export const pricingApi = {
  getCatalog,
  getDiscountTiers,
  calculateQuote,
  saveQuote,
  getQuote,
  getAllItems,
  getItem,
  determinePricingMode,
  formatCurrency,
  getRateTypeDisplay,
};

export default pricingApi;

