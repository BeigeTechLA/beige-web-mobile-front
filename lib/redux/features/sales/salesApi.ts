import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import type {
  SalesLead,
  SalesLeadDetails,
  PaginatedLeadsResponse,
  DiscountCode,
  DiscountCodeDetails,
  DiscountCodeValidation,
  PaymentLink,
  PaymentLinkDetails,
  DashboardStats,
  SalesRepStats,
  SalesRepWorkload,
  FunnelData,
  CreateDiscountCodeRequest,
  CreatePaymentLinkRequest,
  AssignLeadRequest,
  UpdateLeadStatusRequest,
  TrackBookingStartRequest,
  ApplyDiscountCodeRequest,
  SalesLeadActivity,
} from '@/types/sales';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:5001/v1/';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export const salesApi = createApi({
  reducerPath: 'salesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = Cookies.get('revure_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Lead', 'DiscountCode', 'PaymentLink', 'DashboardStats'],
  endpoints: (builder) => ({
    // =====================================================
    // Lead Tracking Endpoints (Public)
    // =====================================================

    trackEarlyInterest: builder.mutation<
      ApiResponse<{ lead_id: number; booking_id: number; is_new: boolean }>,
      { guest_email: string; user_id?: number; content_type?: string; shoot_type?: string; client_name?: string }
    >({
      query: (data) => ({
        url: 'sales/leads/track-early-interest',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Lead'],
    }),

    trackBookingStart: builder.mutation<ApiResponse<{ lead_id: number; is_new: boolean }>, TrackBookingStartRequest>({
      query: (data) => ({
        url: 'sales/leads/track-start',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Lead'],
    }),

    trackPaymentPageReached: builder.mutation<ApiResponse<void>, { booking_id: number }>({
      query: (data) => ({
        url: 'sales/leads/track-payment-page',
        method: 'POST',
        body: data,
      }),
    }),

    createSalesAssistedLead: builder.mutation<
      ApiResponse<{ lead_id: number }>,
      { booking_id: number; user_id?: number; guest_email?: string; client_name?: string }
    >({
      query: (data) => ({
        url: 'sales/leads/contact-sales',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Lead'],
    }),

    // =====================================================
    // Lead Management Endpoints
    // =====================================================

    getLeads: builder.query<
      PaginatedLeadsResponse,
      { page?: number; limit?: number; status?: string; lead_type?: string; assigned_to?: string; search?: string; start_date?: string; end_date?: string }
    >({
      query: (params) => ({
        url: 'sales/leads',
        params,
      }),
      transformResponse: (response: ApiResponse<PaginatedLeadsResponse>) => response.data!,
      providesTags: (result) =>
        result
          ? [
            ...result.leads.map(({ lead_id }) => ({ type: 'Lead' as const, id: lead_id })),
            { type: 'Lead', id: 'LIST' },
          ]
          : [{ type: 'Lead', id: 'LIST' }],
    }),

    getLeadById: builder.query<SalesLeadDetails, number>({
      query: (id) => `sales/leads/${id}`,
      transformResponse: (response: ApiResponse<SalesLeadDetails>) => response.data!,
      providesTags: (result, error, id) => [{ type: 'Lead', id }],
    }),

    assignLead: builder.mutation<ApiResponse<void>, { leadId: number; sales_rep_id: number }>({
      query: ({ leadId, sales_rep_id }) => ({
        url: `sales/leads/${leadId}/assign`,
        method: 'PUT',
        body: { sales_rep_id },
      }),
      invalidatesTags: (result, error, { leadId }) => [{ type: 'Lead', id: leadId }, { type: 'Lead', id: 'LIST' }],
    }),

    updateLeadStatus: builder.mutation<ApiResponse<void>, { leadId: number; status: string }>({
      query: ({ leadId, status }) => ({
        url: `sales/leads/${leadId}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (result, error, { leadId }) => [{ type: 'Lead', id: leadId }, { type: 'Lead', id: 'LIST' }],
    }),

    // =====================================================
    // Discount Code Endpoints
    // =====================================================

    generateDiscountCode: builder.mutation<ApiResponse<DiscountCode>, CreateDiscountCodeRequest>({
      query: (data) => ({
        url: 'sales/discount-codes',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['DiscountCode', 'Lead'],
    }),

    validateDiscountCode: builder.query<DiscountCodeValidation, string>({
      query: (code) => `sales/discount-codes/${code}/validate`,
      transformResponse: (response: ApiResponse<DiscountCodeValidation['data']>) => ({
        valid: response.success,
        data: response.data,
        message: response.message,
      }),
    }),

    applyDiscountCode: builder.mutation<
      ApiResponse<{ original_total: number; discount_amount: number; final_total: number }>,
      { code: string; data: ApplyDiscountCodeRequest }
    >({
      query: ({ code, data }) => ({
        url: `sales/discount-codes/${code}/apply`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['DiscountCode', 'Lead'],
    }),

    getDiscountCodeDetails: builder.query<DiscountCodeDetails, number>({
      query: (id) => `sales/discount-codes/${id}`,
      transformResponse: (response: ApiResponse<DiscountCodeDetails>) => response.data!,
      providesTags: (result, error, id) => [{ type: 'DiscountCode', id }],
    }),

    deactivateDiscountCode: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `sales/discount-codes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'DiscountCode', id }],
    }),

    getDiscountCodeUsageHistory: builder.query<
      { discount_code: any; usage_history: any[] },
      number
    >({
      query: (id) => `sales/discount-codes/${id}/usage`,
      transformResponse: (response: ApiResponse<{ discount_code: any; usage_history: any[] }>) => response.data!,
    }),

    // =====================================================
    // Payment Link Endpoints
    // =====================================================

    generatePaymentLink: builder.mutation<ApiResponse<PaymentLink>, CreatePaymentLinkRequest>({
      query: (data) => ({
        url: 'sales/payment-links',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PaymentLink', 'Lead'],
    }),

    getPaymentLinkDetails: builder.query<PaymentLinkDetails, string>({
      query: (token) => `sales/payment-links/${token}`,
      transformResponse: (response: ApiResponse<PaymentLinkDetails>) => response.data!,
    }),

    validatePaymentLink: builder.query<{
      valid: boolean;
      success: boolean;
      message?: string;
      reason_code?: string;
      booking_id?: number;
      discount_code?: string;
    }, string>({
      query: (token) => `sales/payment-links/${token}/validate`,
      transformResponse: (response: any) => {
        return {
          success: response.success,
          valid: response.valid,
          message: response.message,
          reason_code: response.reason_code,
          ...response.data,
        };
      },
    }),

    markPaymentLinkUsed: builder.mutation<ApiResponse<void>, string>({
      query: (token) => ({
        url: `sales/payment-links/${token}/mark-used`,
        method: 'POST',
      }),
      invalidatesTags: ['PaymentLink', 'Lead'],
    }),

    getSalesRepPaymentLinks: builder.query<{ links: PaymentLink[] }, { repId: number; status?: string }>({
      query: ({ repId, status = 'all' }) => ({
        url: `sales/payment-links/rep/${repId}`,
        params: { status },
      }),
      transformResponse: (response: ApiResponse<{ links: PaymentLink[] }>) => response.data!,
      providesTags: ['PaymentLink'],
    }),

    // =====================================================
    // Dashboard Endpoints
    // =====================================================

    getDashboardStats: builder.query<DashboardStats, { period?: string; sales_rep_id?: number }>({
      query: (params = {}) => ({
        url: 'sales/dashboard/stats',
        params,
      }),
      transformResponse: (response: ApiResponse<DashboardStats>) => response.data!,
      providesTags: ['DashboardStats'],
    }),

    getSalesRepStats: builder.query<SalesRepStats, { repId: number; period?: string }>({
      query: ({ repId, period = '30days' }) => ({
        url: `sales/dashboard/rep-stats/${repId}`,
        params: { period },
      }),
      transformResponse: (response: ApiResponse<SalesRepStats>) => response.data!,
    }),

    getSalesRepsWorkload: builder.query<{ sales_reps: SalesRepWorkload[] }, void>({
      query: () => 'sales/dashboard/sales-reps',
      transformResponse: (response: ApiResponse<{ sales_reps: SalesRepWorkload[] }>) => response.data!,
    }),

    getRecentActivities: builder.query<{ activities: SalesLeadActivity[] }, { limit?: number; sales_rep_id?: number }>({
      query: (params = {}) => ({
        url: 'sales/dashboard/recent-activities',
        params,
      }),
      transformResponse: (response: ApiResponse<{ activities: SalesLeadActivity[] }>) => response.data!,
    }),

    getLeadsFunnelData: builder.query<FunnelData, { period?: string; sales_rep_id?: number }>({
      query: (params = {}) => ({
        url: 'sales/dashboard/funnel',
        params,
      }),
      transformResponse: (response: ApiResponse<FunnelData>) => response.data!,
    }),
   updateBookingCrew: builder.mutation<
  ApiResponse<any>, // Changed to any so you can access response.data
  { 
    booking_id: number; 
    crew_roles: Record<string, number>;
    location?: string;           // Added
    description?: string;        // Added
    reference_links?: string;    // Added
  }
>({
  query: ({ booking_id, ...payload }) => ({ // Use spread to get everything except id
    url: `sales/bookings/${booking_id}/crew`,
    method: "PATCH",
    body: payload, // This now sends crew_roles, location, description, and reference_links
  }),
}),
  }),
});

export const {
  // Lead tracking
  useTrackEarlyInterestMutation,
  useTrackBookingStartMutation,
  useTrackPaymentPageReachedMutation,
  useCreateSalesAssistedLeadMutation,
  // Lead management
  useGetLeadsQuery,
  useGetLeadByIdQuery,
  useAssignLeadMutation,
  useUpdateLeadStatusMutation,
  // Discount codes
  useGenerateDiscountCodeMutation,
  useValidateDiscountCodeQuery,
  useLazyValidateDiscountCodeQuery,
  useApplyDiscountCodeMutation,
  useGetDiscountCodeDetailsQuery,
  useDeactivateDiscountCodeMutation,
  useGetDiscountCodeUsageHistoryQuery,
  // Payment links
  useGeneratePaymentLinkMutation,
  useGetPaymentLinkDetailsQuery,
  useValidatePaymentLinkQuery,
  useLazyValidatePaymentLinkQuery,
  useMarkPaymentLinkUsedMutation,
  useGetSalesRepPaymentLinksQuery,
  // Dashboard
  useGetDashboardStatsQuery,
  useGetSalesRepStatsQuery,
  useGetSalesRepsWorkloadQuery,
  useGetRecentActivitiesQuery,
  useGetLeadsFunnelDataQuery,
  useUpdateBookingCrewMutation,
} = salesApi;
