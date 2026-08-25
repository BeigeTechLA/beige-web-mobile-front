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
  CreateClientPaymentLinkRequest,
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
  errors?: string[];
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
      {
        booking_id?: number | null;
        guest_email: string;
        user_id?: number;
        content_type?: string;
        shoot_type?: string;
        client_name?: string;
        start_date?: string | null;
        start_time?: string | null;
        end_time?: string | null;
        time_zone?: string;
        startDate?: string;
        endDate?: string;
        booking_type?: "single_day" | "multi_day";
        booking_days?: Array<Record<string, any>>;
        edits_needed?: boolean;
        video_edit_types?: string[];
        photo_edit_types?: string[];
        estimated_delivery_date?: string | null;
        studio_booking_for?: string;
        project_name?: string;
        special_instructions?: string;
        studio_total?: number;
        studio_items?: Array<{
          studio_id: string;
          name: string;
          location?: string;
          image?: string;
          pricing_category?: string;
          pricing_label?: string;
          quantity: number;
          unit_price: number;
          total: number;
          pricing_mode: "hourly" | "weekend";
          price_label?: string;
          selected_date?: string;
          start_time?: string;
          end_time?: string;
          time_zone?: string;
          studio_booking_type?: "single_day" | "multi_day";
          booking_days?: Array<Record<string, any>>;
          cast_and_crew_count?: number;
          update_studio_datetime?: boolean;
          lat?: number;
          lng?: number;
          price_label?: string;
        }>;
      }
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
      { page?: number; limit?: number; status?: string; lead_type?: string; assigned_to?: string; search?: string; start_date?: string; end_date?: string; intent?: string; timeline_status?: string; shoot_status?: string; cp_assignment?: string; production_filter?: string }
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

    deleteLead: builder.mutation<ApiResponse<void>, number>({
      query: (leadId) => ({
        url: `sales/leads/${leadId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, leadId) => [{ type: 'Lead', id: leadId }, { type: 'Lead', id: 'LIST' }],
    }),

    deleteClientLead: builder.mutation<ApiResponse<void>, number>({
      query: (clientLeadId) => ({
        url: `sales/client-leads/${clientLeadId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, clientLeadId) => [{ type: 'Lead', id: clientLeadId }, { type: 'Lead', id: 'LIST' }],
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
    generateClientDiscountCode: builder.mutation<ApiResponse<DiscountCode>, { 
      client_lead_id: number; 
      booking_id: number; 
      discount_type: string; 
      discount_value: number; 
      usage_type: string 
    }>({
      query: (data) => ({
        url: 'sales/client-discount-codes',
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
    generateClientPaymentLink: builder.mutation<ApiResponse<PaymentLink>, CreateClientPaymentLinkRequest>({
      query: (data) => ({
        url: 'sales/client-payment-links',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PaymentLink', 'Lead'],
    }),

    getPaymentLinkDetails: builder.query<PaymentLinkDetails, string>({
      query: (token) => `sales/payment-links/${token}`,
      transformResponse: (response: ApiResponse<PaymentLinkDetails>) => response.data!,
    }),

    sendInvoice: builder.mutation({
      query: (body: { booking_id: number }) => ({
        url: 'sales/send-invoice',
        method: 'POST',
        body,
      }),
    }),
    previewInvoice: builder.mutation({
      query: (body: { booking_id: number }) => ({
        url: 'sales/preview-invoice',
        method: 'POST',
        body,
      }),
    }),
    updateLeadIntent: builder.mutation<any, { lead_id: number; intent: string; notes?: string }>({
      query: (body) => ({
        url: `sales/leads/intent`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { lead_id }) => [{ type: 'Lead', id: lead_id }, { type: 'Lead', id: 'LIST' }],
    }),
    updateClientLeadIntent: builder.mutation<any, { lead_id: number; intent: string; notes?: string }>({
      query: (body) => ({
        url: 'sales/client-leads/intent',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { lead_id }) => [{ type: 'Lead', id: lead_id }, { type: 'Lead', id: 'LIST' }],
    }),

    validatePaymentLink: builder.query<{
      valid: boolean;
      success: boolean;
      message?: string;
      reason_code?: string;
      booking_id?: number;
      discount_code?: string;
      requested_amount?: number | string | null;
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

    notifyPaymentLink: builder.mutation<ApiResponse<void>, { payment_link_id: number }>({
      query: (data) => ({
        url: 'sales/payment-links/notify',
        method: 'POST',
        body: data,
      }),
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
        shoot_type?: string;
        booking_type?: "single_day" | "multi_day";
        start_date?: string;
        start_time?: string;
        end_time?: string;
        time_zone?: string;
        booking_days?: Array<{
          date: string;
          start_time: string;
          end_time: string;
          time_zone?: string;
        }>;
        duration_hours?: number;
        edits_needed?: boolean;
        video_edit_types?: string[];
        photo_edit_types?: string[];
        location?: string;           // Added
        location_latitude?: number;
        location_longitude?: number;
        description?: string;        // Added
        reference_links?: string | string[];    // Changed to accept array
      }
    >({
      query: ({ booking_id, ...payload }) => ({ // Use spread to get everything except id
        url: `sales/bookings/${booking_id}/crew`,
        method: "PATCH",
        body: payload, // This now sends crew_roles, location, description, and reference_links
      }),
    }),
    removeAssignedCrew: builder.mutation<ApiResponse<void>, { lead_id?: number; client_lead_id?: number; crew_member_id: number }>({
      query: ({ lead_id, client_lead_id, crew_member_id }) => ({
        url: 'admin/remove-assigned-crew',
        method: 'POST',
        body: lead_id != null
          ? { lead_id, crew_member_id }
          : { client_lead_id, crew_member_id },
      }),
      invalidatesTags: (result, error, { lead_id, client_lead_id }) => {
        const leadKey = lead_id ?? client_lead_id;
        return leadKey ? [{ type: 'Lead', id: leadKey }, { type: 'Lead', id: 'LIST' }] : [{ type: 'Lead', id: 'LIST' }];
      },
    }),
    updateLeadBooking: builder.mutation<ApiResponse<any>, { booking_id: number; payload: any; lead_id?: number }>({
      query: ({ booking_id, payload }) => ({
        url: `sales/leads/${booking_id}/booking`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: (result, error, { lead_id }) => lead_id ? [{ type: 'Lead', id: lead_id }] : ['Lead'],
    }),
    updateClientBooking: builder.mutation<ApiResponse<any>, { booking_id: number; payload: any; lead_id?: number }>({
      query: ({ booking_id, payload }) => ({
        url: `sales/client/${booking_id}/booking`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: (result, error, { lead_id }) => lead_id ? [{ type: 'Lead', id: lead_id }] : ['Lead'],
    }),
    updateClientLeadBooking: builder.mutation<ApiResponse<any>, { lead_id: number; payload: any }>({
      query: ({ lead_id, payload }) => ({
        url: `sales/client-leads/${lead_id}/booking`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: (result, error, { lead_id }) => [{ type: 'Lead', id: lead_id }, { type: 'Lead', id: 'LIST' }],
    }),

    assignCrewFromLead: builder.mutation<ApiResponse<void>, { lead_id?: number; client_lead_id?: number; crew_member_ids: number[]; allow_pending_compensation_assignment?: boolean }>({
      query: (data) => ({
        url: 'admin/assign-crew-from-lead',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Lead'],
    }),
    assignCrewFromShoot: builder.mutation<ApiResponse<void>, { project_id: number; crew_member_ids: number[]; allow_pending_compensation_assignment?: boolean }>({
      query: (data) => ({
        url: 'admin/assign-crew-from-shoot',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Lead'], // Invalidating Lead could trigger shoots/projects refresh depending on setup
    }),
    getCrewForLead: builder.query<any[], { lead_id: number | string; role_type: string; search_query?: string; radius?: number; latitude?: number; longitude?: number }>({
      query: (params) => ({
        url: 'admin/get-crew-for-lead',
        params,
      }),
      transformResponse: (response: ApiResponse<any[]>) => response.data || [],
    }),
    getClientFullDetails: builder.query<any, string | number>({
      query: (userId) => `admin/get-client-details-with-shoots/${userId}`,
      transformResponse: (response: ApiResponse<any>) => response.data,
    }),
    getClientLeadById: builder.query<any, number>({
      query: (id) => `sales/client-leads/${id}`,
      transformResponse: (response: ApiResponse<any>) => response.data!,
      providesTags: (result, error, id) => [{ type: 'Lead', id }],
    }),

    // =====================================================
    // Availability Endpoints
    // =====================================================

    addAvailability: builder.mutation<ApiResponse<void>, {
      date: string;
      availability_status: number;
      is_full_day: number;
      start_time?: string | null;
      end_time?: string | null;
      recurrence?: number;
      recurrence_until?: string;
      recurrence_days?: string[];
      recurrence_day_of_month?: number;
      notes?: string;
    }>({
      query: (data) => ({
        url: 'sales/add-availability',
        method: 'POST',
        body: data,
      }),
    }),

    getAvailability: builder.mutation<ApiResponse<any>, {
      sales_rep_id?: number;
      year: string | number;
      month: string | number;
    }>({
      query: (data) => ({
        url: 'sales/availability',
        method: 'POST',
        body: data,
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
  useDeleteLeadMutation,
  useDeleteClientLeadMutation,
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
  useGenerateClientPaymentLinkMutation,
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
  useRemoveAssignedCrewMutation,
  useUpdateLeadBookingMutation,
  useUpdateClientBookingMutation,
  useAssignCrewFromLeadMutation,
  useAssignCrewFromShootMutation,
  useNotifyPaymentLinkMutation,
  useGetCrewForLeadQuery,
  useLazyGetCrewForLeadQuery,
  useGetClientFullDetailsQuery,
  useGetClientLeadByIdQuery,
  useUpdateClientLeadBookingMutation,
  usePreviewInvoiceMutation,
  useSendInvoiceMutation,
  useUpdateLeadIntentMutation,
  useUpdateClientLeadIntentMutation,
  useGenerateClientDiscountCodeMutation,
  useAddAvailabilityMutation,
  useGetAvailabilityMutation
} = salesApi;
