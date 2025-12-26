import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { 
  PricingCategory, 
  DiscountTier, 
  QuoteCalculation, 
  SavedQuote,
  SelectedItem,
  PricingItem 
} from '@/lib/api/pricing';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:5001/v1/';

export const pricingApi = createApi({
  reducerPath: 'pricingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      // Get token from cookies if available
      if (typeof window !== 'undefined') {
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(c => c.trim().startsWith('revure_token='));
        if (tokenCookie) {
          const token = tokenCookie.split('=')[1];
          headers.set('Authorization', `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ['Catalog', 'Quote', 'Item'],
  endpoints: (builder) => ({
    // Get pricing catalog
    getCatalog: builder.query<PricingCategory[], { mode?: string; eventType?: string }>({
      query: ({ mode, eventType } = {}) => {
        const params = new URLSearchParams();
        if (mode) params.append('mode', mode);
        if (eventType) params.append('event_type', eventType);
        return `/pricing/catalog?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: { categories: PricingCategory[] } }) => 
        response.data.categories,
      providesTags: ['Catalog'],
    }),

    // Get discount tiers
    getDiscountTiers: builder.query<DiscountTier[], string>({
      query: (mode = 'general') => `/pricing/discounts?mode=${mode}`,
      transformResponse: (response: { success: boolean; data: { tiers: DiscountTier[] } }) => 
        response.data.tiers,
    }),

    // Calculate quote
    calculateQuote: builder.mutation<QuoteCalculation, {
      items: SelectedItem[];
      shootHours: number;
      eventType?: string;
      marginPercent?: number;
    }>({
      query: (body) => ({
        url: '/pricing/calculate',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { success: boolean; data: QuoteCalculation }) => 
        response.data,
    }),

    // Save quote
    saveQuote: builder.mutation<SavedQuote, {
      items: SelectedItem[];
      shootHours: number;
      eventType: string;
      guestEmail?: string;
      bookingId?: number;
      notes?: string;
    }>({
      query: (body) => ({
        url: '/pricing/quotes',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { success: boolean; data: SavedQuote }) => 
        response.data,
      invalidatesTags: ['Quote'],
    }),

    // Get quote by ID
    getQuote: builder.query<SavedQuote, number>({
      query: (quoteId) => `/pricing/quotes/${quoteId}`,
      transformResponse: (response: { success: boolean; data: SavedQuote }) => 
        response.data,
      providesTags: (result, error, id) => [{ type: 'Quote', id }],
    }),

    // Get all pricing items
    getAllItems: builder.query<PricingItem[], {
      category_id?: number;
      pricing_mode?: string;
      is_active?: boolean;
    }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.category_id) searchParams.append('category_id', params.category_id.toString());
        if (params.pricing_mode) searchParams.append('pricing_mode', params.pricing_mode);
        if (params.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
        return `/pricing/items?${searchParams.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: PricingItem[] }) => 
        response.data,
      providesTags: ['Item'],
    }),

    // Get single pricing item
    getItem: builder.query<PricingItem, number>({
      query: (itemId) => `/pricing/items/${itemId}`,
      transformResponse: (response: { success: boolean; data: PricingItem }) => 
        response.data,
      providesTags: (result, error, id) => [{ type: 'Item', id }],
    }),
  }),
});

export const {
  useGetCatalogQuery,
  useGetDiscountTiersQuery,
  useCalculateQuoteMutation,
  useSaveQuoteMutation,
  useGetQuoteQuery,
  useGetAllItemsQuery,
  useGetItemQuery,
} = pricingApi;

