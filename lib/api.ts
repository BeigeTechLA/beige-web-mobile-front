import axios from 'axios';
import Cookies from 'js-cookie';

import type { Creator, Review, Equipment, PaymentIntentResponse, BookingResponse, BookingFormData } from '@/types/payment';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://revure-api.beige.app/v1/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Add request interceptor to include JWT token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('revure_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// Role mapping
export const ROLE_MAP: Record<number, string> = {
  1: 'Videographer',
  2: 'Photographer',
  3: 'Editor',
  4: 'Producer',
  5: 'Director',
};

export const creatorApi = {
  getById: async (creatorId: string): Promise<Creator> => {
    const response = await api.get(`/creators/${creatorId}`);
    const rawCreator = response.data.data || response.data;

    // Get reviews to count them
    const reviewsResponse = await api.get(`/reviews/by-creator/${creatorId}`);
    const reviews = reviewsResponse.data.data || reviewsResponse.data;
    const reviewsCount = Array.isArray(reviews) ? reviews.length : 0;

    // Transform API response to match frontend interface
    return {
      id: rawCreator.id?.toString() || creatorId,
      name: rawCreator.name,
      role: ROLE_MAP[rawCreator.role] || 'Creative Professional',
      price: rawCreator.price,
      hourly_rate: rawCreator.price, // Use price as hourly_rate for backward compatibility
      location: typeof rawCreator.location === 'string'
        ? rawCreator.location
        : rawCreator.location?.address || '',
      profile_image: rawCreator.image || rawCreator.profile_image || '',
      rating: rawCreator.rating || 0,
      reviews_count: reviewsCount,
      bio: rawCreator.bio,
    };
  },
};

export const reviewApi = {
  getByCreator: async (creatorId: string, limit: number = 5): Promise<Review[]> => {
    const response = await api.get(`/reviews/by-creator/${creatorId}`, {
      params: { limit },
    });
    const rawReviews = response.data.data || response.data;

    // Transform API response to match frontend interface
    if (Array.isArray(rawReviews)) {
      return rawReviews.map((review: any) => ({
        id: review.review_id?.toString() || review.id,
        rating: review.rating,
        comment: review.review_text || review.comment || '',
        reviewer_name: review.user_name || review.reviewer_name || 'Anonymous',
        reviewer_image: review.reviewer_image,
        created_at: review.created_at,
      }));
    }
    return rawReviews;
  },
};

export const equipmentApi = {
  getByCreator: async (creatorId: string): Promise<Equipment[]> => {
    const response = await api.get(`/equipment/by-creator/${creatorId}`);
    return response.data.data || response.data;
  },
};

export const paymentApi = {
  createIntent: async (
    creatorId: string,
    bookingData: BookingFormData & { guest_email?: string; user_id?: string | number; referral_code?: string },
    hourlyRate: number
  ): Promise<PaymentIntentResponse> => {
    const response = await api.post('/payments/create-intent', {
      creator_id: creatorId,
      hours: bookingData.hours,
      hourly_rate: hourlyRate,
      equipment: [], // No equipment for now
      shoot_date: bookingData.shoot_date,
      location: bookingData.location,
      shoot_type: bookingData.shoot_type,
      notes: bookingData.special_requests || '',
      user_id: bookingData.user_id,
      guest_email: bookingData.guest_email,
      referral_code: bookingData.referral_code,
    });
    // API returns { success: true, data: { clientSecret, paymentIntentId, pricing } }
    return response.data.data;
  },

  confirmBooking: async (
    paymentIntentId: string,
    bookingData: BookingFormData & { creator_id: string; guest_email?: string; user_id?: string | number; hourly_rate?: number; referral_code?: string; booking_id?: string | number }
  ): Promise<BookingResponse> => {
    const response = await api.post('/payments/confirm', {
      paymentIntentId: paymentIntentId,
      creator_id: bookingData.creator_id,
      user_id: bookingData.user_id,
      hours: bookingData.hours,
      hourly_rate: bookingData.hourly_rate,
      equipment: [], // No equipment for now
      shoot_date: bookingData.shoot_date,
      location: bookingData.location,
      shoot_type: bookingData.shoot_type,
      notes: bookingData.special_requests || '',
      guest_email: bookingData.guest_email,
      referral_code: bookingData.referral_code,
      booking_id: bookingData.booking_id,
    });
    return response.data;
  },
};

// Affiliate API Types
export interface AffiliateValidationResponse {
  valid: boolean;
  referral_code?: string;
  affiliate_name?: string;
  message?: string;
}

export interface AffiliateInfo {
  affiliate_id: number;
  referral_code: string;
  status: 'active' | 'paused' | 'suspended';
  total_referrals: number;
  successful_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  payout_method?: 'bank_transfer' | 'paypal' | 'stripe';
  payout_details?: Record<string, unknown>;
  created_at: string;
}

export interface AffiliateDashboardStats {
  affiliate: {
    affiliate_id: number;
    referral_code: string;
    status: string;
  };
  stats: {
    total_referrals: number;
    successful_referrals: number;
    pending_referrals: number;
    cancelled_referrals: number;
    conversion_rate: string;
  };
  earnings: {
    total_earnings: number;
    pending_earnings: number;
    paid_earnings: number;
    commission_per_booking: number;
  };
  recent_referrals: Array<{
    referral_id: number;
    booking_amount: number | null;
    commission_amount: number;
    status: string;
    payout_status: string;
    created_at: string;
    payment: {
      payment_id: number;
      total_amount: number;
      shoot_date: string;
      status: string;
    } | null;
  }>;
}

export interface ReferralHistoryItem {
  referral_id: number;
  referral_code: string;
  booking_amount: number | null;
  commission_amount: number;
  status: string;
  payout_status: string;
  created_at: string;
  payment: {
    payment_id: number;
    total_amount: number;
    shoot_date: string;
    location: string;
    status: string;
  } | null;
}

export interface QuotesDashboardOverview {
  total_quotes: number;
  accepted_quotes: number;
  pending_quotes: number;
  draft_quotes: number;
  rejected_quotes: number;
  expired_quotes: number;
  total_amount: number;
}

export interface QuotesDashboardGrowthPeriod {
  total_quotes: number;
  accepted_quotes: number;
  pending_quotes: number;
  draft_quotes: number;
  rejected_quotes: number;
  expired_quotes: number;
  total_amount: number;
}

export interface QuotesDashboardGrowth {
  compare_label: string;
  total_quotes: number;
  accepted_quotes: number;
  pending_quotes: number;
  draft_quotes: number;
  rejected_quotes: number;
  expired_quotes: number;
  total_amount: number;
  current_period: QuotesDashboardGrowthPeriod;
  previous_period: QuotesDashboardGrowthPeriod;
}

export interface QuotesDashboardChartItem {
  label: string;
  quote_count: number;
  total_amount: number;
  accepted_count?: number;
  pending_count?: number;
  draft_count?: number;
  rejected_count?: number;
  expired_count?: number;
  sent_count?: number;
}

export interface QuotesDashboardData {
  overview: QuotesDashboardOverview;
  growth?: QuotesDashboardGrowth | null;
  chart: QuotesDashboardChartItem[];
}

export interface QuotesDashboardResponse {
  success: boolean;
  data: QuotesDashboardData | null;
  error?: string;
}

export interface SalesQuoteListUser {
  id?: number | string;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

export interface QuotesListPagination {
  page?: number;
  limit?: number;
  total?: number;
  total_pages?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export type QuotesListSummary = Record<string, number | string | null | undefined>;

export interface SalesQuoteListItem {
  id?: number | string;
  quote_id?: number | string;
  sales_quote_id?: number | string;
  client_user_id?: number | string;
  user_id?: number | string;
  client_id?: number | string;
  quote_number?: string;
  client_name?: string;
  client?: string;
  customer_name?: string;
  guest_email?: string;
  client_email?: string;
  client_phone?: string | null;
  client_address?: string;
  address?: string;
  location?: string;
  project_description?: string;
  project?: string;
  description?: string;
  video_shoot_type?: string;
  total_amount?: number | string;
  total?: number | string;
  amount?: number | string;
  status?: string;
  quote_status?: string;
  expires_at?: string | null;
  valid_until?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  salesperson?: string;
  sales_person?: string;
  sales_rep?: string;
  sales_rep_name?: string;
  created_by_name?: string;
  assigned_sales_rep?: SalesQuoteListUser | null;
  created_by?: SalesQuoteListUser | null;
  [key: string]: unknown;
}

export interface QuotesListEnvelope {
  pagination?: QuotesListPagination | null;
  summary?: QuotesListSummary | null;
  quotes?: SalesQuoteListItem[];
  items?: SalesQuoteListItem[];
  results?: SalesQuoteListItem[];
  rows?: SalesQuoteListItem[];
  list?: SalesQuoteListItem[];
  data?: SalesQuoteListItem[];
  [key: string]: unknown;
}

export interface QuotesListResponse {
  success: boolean;
  data: SalesQuoteListItem[] | QuotesListEnvelope | null;
  error?: string;
}

export interface QuoteChangeRequestUser {
  id?: number | string;
  name?: string | null;
  email?: string | null;
  [key: string]: unknown;
}

export interface QuoteChangeRequestSummary {
  summary?: string | null;
  lines?: string[] | null;
  [key: string]: unknown;
}

export interface QuoteChangeRequestItem {
  activity_id?: number | string;
  quote_id?: number | string | null;
  quote_number?: string | null;
  booking_id?: number | string | null;
  client_name?: string | null;
  client_email?: string | null;
  assigned_sales_rep?: QuoteChangeRequestUser | null;
  requested_by?: QuoteChangeRequestUser | null;
  request_type?: string | null;
  previous_total?: number | string | null;
  new_total?: number | string | null;
  extra_amount?: number | string | null;
  reduced_amount?: number | string | null;
  approval_status?: string | null;
  overall_change_summary?: QuoteChangeRequestSummary | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface QuoteChangeRequestsEnvelope {
  pagination?: QuotesListPagination | null;
  items?: QuoteChangeRequestItem[];
  rows?: QuoteChangeRequestItem[];
  results?: QuoteChangeRequestItem[];
  list?: QuoteChangeRequestItem[];
  data?: QuoteChangeRequestItem[];
  [key: string]: unknown;
}

export interface QuoteChangeRequestsResponse {
  success: boolean;
  data: QuoteChangeRequestItem[] | QuoteChangeRequestsEnvelope | null;
  message?: string;
  error?: string;
}

export interface QuoteChangeRequestReviewResponse {
  success: boolean;
  message?: string;
  data?: {
    request?: QuoteChangeRequestItem | null;
    account_credit?: unknown;
    approved_entries?: unknown[];
    rejected_entries?: unknown[];
    [key: string]: unknown;
  } | null;
  error?: string;
}

export interface SalesQuoteDetailLineItem {
  id?: number | string;
  line_item_id?: number | string;
  item_id?: number | string;
  catalog_item_id?: number | string;
  subtitle?: string;
  section_type?: string;
  source_type?: string;
  item_name?: string;
  name?: string;
  label?: string;
  type?: string;
  category_name?: string;
  category_slug?: string;
  quantity?: number | string;
  duration_hours?: number | string;
  duration?: number | string;
  hours?: number | string;
  crew_size?: number | string;
  crew?: number | string;
  crew_count?: number | string;
  estimated_pricing?: number | string;
  unit_rate?: number | string;
  rate?: number | string;
  effective_rate?: number | string;
  line_total?: number | string;
  total_amount?: number | string;
  amount?: number | string;
  price?: number | string;
  rate_type?: string;
  configuration?: unknown;
  configuration_json?: unknown;
  [key: string]: unknown;
}

export interface SalesQuoteDetailData {
  id?: number | string;
  quote_id?: number | string;
  sales_quote_id?: number | string;
  quote_number?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  guest_email?: string;
  client_address?: string;
  address?: string;
  location?: string;
  project_description?: string;
  video_shoot_type?: string;
  quote_validity_days?: number | string;
  quote_status?: string;
  status?: string;
  valid_until?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  tax_type?: string;
  tax_rate?: number | string;
  tax_amount?: number | string;
  sales_tax?: number | string;
  discount_type?: string;
  discount_value?: number | string;
  discount_amount?: number | string;
  subtotal?: number | string;
  amount_after_tax?: number | string;
  total_after_tax?: number | string;
  total?: number | string;
  total_amount?: number | string;
  final_total?: number | string;
  amount_after_discount?: number | string;
  booking_id?: number | string;
  additional_payment?: {
    additional_amount?: number | string | null;
    previously_paid_amount?: number | string | null;
    revised_total?: number | string | null;
    outstanding_amount?: number | string | null;
    payment_status?: string | null;
    last_sent_at?: string | null;
    invoice_number?: string | null;
    invoice_url?: string | null;
  } | null;
  converted_booking_details?: {
    booking_id?: number | string;
    booking_type?: string | null;
    time_zone?: string | null;
    start_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    duration_hours?: number | string | null;
    location?: string | null;
    reference_links?: string | null;
    special_instructions?: string | null;
    booking_days?: Array<{
      date?: string | null;
      event_date?: string | null;
      start_time?: string | null;
      end_time?: string | null;
      duration_hours?: number | string | null;
      time_zone?: string | null;
    }> | null;
  } | null;
  accepted_at?: string | null;
  terms_conditions?: string | string[] | null;
  line_items?: SalesQuoteDetailLineItem[];
  items?: SalesQuoteDetailLineItem[];
  quote_items?: SalesQuoteDetailLineItem[];
  rows?: SalesQuoteDetailLineItem[];
  activities?: Array<{
    activity_type?: string;
    message?: string;
    metadata?: Record<string, unknown> | null;
    metadata_json?: string | null;
    created_at?: string | null;
    performed_by?: SalesQuoteListUser | null;
  }>;
  quote?: SalesQuoteDetailData;
  data?: unknown;
  [key: string]: unknown;
}

export interface SalesQuoteDetailResponse {
  success: boolean;
  data: SalesQuoteDetailData | null;
  error?: string;
}

export interface SalesQuoteStatusUpdateResponse {
  success: boolean;
  data: SalesQuoteDetailData | null;
  error?: string;
  message?: string;
}

export interface SalesQuoteSendResponse {
  success: boolean;
  data: SalesQuoteDetailData | null;
  error?: string;
  message?: string;
}

export interface SalesQuoteInvoiceData {
  quote_id?: number | string;
  booking_id?: number | string;
  projectTitle?: string;
  invoiceUrl?: string | null;
  invoicePdf?: string | null;
  invoiceNumber?: string | null;
  totalAmount?: number | string;
  isPaid?: boolean;
  [key: string]: unknown;
}

export interface SalesQuoteInvoiceResponse {
  success: boolean;
  data: SalesQuoteInvoiceData | null;
  error?: string;
  message?: string;
}

export interface SalesQuoteConvertToBookingData {
  quote_id: number;
  lead_id: number;
  booking_id: number;
  already_converted: boolean;
  lead_source?: string;
  booking_mode_hint?: string | null;
  payment_link_ready_hint?: boolean;
  prefill_data?: unknown;
  booking_summary?: unknown;
  missing_required_fields?: string[];
}

export type SalesQuoteConvertSingleDayPayload = {
  booking_type: "single_day";
  time_zone: string;
  start_date: string;
  start_time: string;
  end_time: string;
  location: string;
  location_latitude?: number | null;
  location_longitude?: number | null;
};

export type SalesQuoteConvertMultiDayPayload = {
  booking_type: "multi_day";
  time_zone: string;
  location: string;
  location_latitude?: number | null;
  location_longitude?: number | null;
  booking_days: Array<{
    date: string;
    start_time: string;
    end_time: string;
  }>;
};

export type SalesQuoteConvertToBookingPayload =
  | SalesQuoteConvertSingleDayPayload
  | SalesQuoteConvertMultiDayPayload;

export interface SalesQuoteConvertToBookingResponse {
  success: boolean;
  data: SalesQuoteConvertToBookingData | null;
  error?: string;
  message?: string;
}

export type LeadBookingScheduleSingleDayPayload = {
  location: string;
  location_latitude?: number | null;
  location_longitude?: number | null;
  booking_type: "single_day";
  time_zone: string;
  start_date: string;
  start_time: string;
  end_time: string;
};

export type LeadBookingScheduleMultiDayPayload = {
  location: string;
  location_latitude?: number | null;
  location_longitude?: number | null;
  booking_type: "multi_day";
  time_zone: string;
  booking_days: Array<{
    date: string;
    start_time: string;
    end_time: string;
  }>;
};

export type LeadBookingSchedulePayload =
  | LeadBookingScheduleSingleDayPayload
  | LeadBookingScheduleMultiDayPayload;

export interface SalesLeadUpdateBookingScheduleResponse {
  success: boolean;
  data: unknown;
  error?: string;
  message?: string;
}

export const affiliateApi = {
  // Validate a referral code (public endpoint)
  validateCode: async (code: string, userId?: string | number | null): Promise<AffiliateValidationResponse> => {
    try {
      const url = userId
        ? `/affiliates/validate/${code}?user_id=${userId}`
        : `/affiliates/validate/${code}`;

      const response = await api.get(url);

      return {
        valid: response.data.valid || false,
        referral_code: response.data.data?.referral_code,
        affiliate_name: response.data.data?.affiliate_name,
        message: response.data.message, // Success message
      };
    } catch (error: any) {
      // FIX: Extract the message from the server error response
      return {
        valid: false,
        message: error.response?.data?.message || "Invalid referral code"
      };
    }
  },

  // Get current user's affiliate info (requires auth)
  getMyAffiliate: async (token: string): Promise<AffiliateInfo> => {
    const response = await api.get('/affiliates/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  // Get affiliate dashboard stats (requires auth)
  getDashboardStats: async (token: string): Promise<AffiliateDashboardStats> => {
    const response = await api.get('/affiliates/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  // Get referral history (requires auth)
  getReferralHistory: async (
    token: string,
    params: { page?: number; limit?: number; status?: string } = {}
  ): Promise<{ referrals: ReferralHistoryItem[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> => {
    const response = await api.get('/affiliates/referrals', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data.data;
  },

  // Update payout details (requires auth)
  updatePayoutDetails: async (
    token: string,
    data: { payout_method?: string; payout_details?: Record<string, unknown> }
  ): Promise<{ payout_method: string; payout_details: Record<string, unknown> }> => {
    const response = await api.put(
      "/affiliates/payout-details",
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.data;
  },

  // Get client dashboard summary (affiliate dashboard)
  getDashboardSummary: async (token: string, params: { date_on?: string; range?: string } = {}) => {
    try {
      const response = await api.get('/client/get-dashboard-summary', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Get Affiliate Dashboard Summary Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch dashboard summary',
      };
    }
  },

  // Get client credit summary (available/used/pending)
  getClientCreditSummary: async (token: string) => {
    try {
      const response = await api.get('/client/credit/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Get Client Credit Summary Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch credit summary',
      };
    }
  },

  // Get client credit history (where credit was created/used)
  getClientCreditHistory: async (
    token: string,
    params: { page?: number; limit?: number } = {}
  ) => {
    try {
      const response = await api.get('/client/credit/history', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Get Client Credit History Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch credit history',
      };
    }
  },

  // Get shoots count by category (affiliate dashboard)
  getShootsCountByCategory: async (token: string, params: { tab?: string; date_on?: string } = {}) => {
    try {
      const finalParams: any = { ...params };
      if (finalParams.tab && finalParams.tab !== 'All') {
        finalParams.type = finalParams.tab.toLowerCase();
        delete finalParams.tab;
      }
      const response = await api.get('/client/get-shoots-count-by-category', {
        headers: { Authorization: `Bearer ${token}` },
        params: finalParams,
      });
      return response.data;
    } catch (error) {
      console.error('Get Shoots Count By Category Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch shoots count by category',
      };
    }
  },
  // Get shoot status (affiliate dashboard)
  getShootStatus: async (token: string, params: { range?: 'all' | 'monthly' | 'month'; date_on?: string } = {}) => {
    try {
      const response = await api.get('/client/get-shoot-status', {
        headers: { Authorization: `Bearer ${token}` },
        params: { range: 'all', ...params },
      });
      return response.data;
    } catch (error) {
      console.error('Get Shoot Status Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch shoot status',
      };
    }
  },
  // Get my shoots (affiliate dashboard)
  getMyShoots: async (token: string, params: { status?: string; range?: string; date_on?: string; search?: string } = {}) => {
    try {
      const response = await api.get('/client/get-my-shoots', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Get My Shoots Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch shoots',
      };
    }
  },
  // Get project details (affiliate dashboard)
  getProjectDetails: async (token: string, id: string | number) => {
    try {
      const response = await api.get(`client/get-project/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
    }
  },
  // Get recent activity (affiliate dashboard)
  getRecentActivity: async (token: string, params: { limit?: number; date_on?: string } = {}) => {
    try {
      const response = await api.get('/client/get-recent-activity', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10, ...params },
      });
      return response.data;
    } catch (error) {
      console.error('Get Recent Activity Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch recent activity',
      };
    }
  },
  // Get top creative partners (affiliate dashboard)
  getTopCreativePartners: async (token: string, params: { range?: 'all' | 'monthly' | 'month'; date_on?: string } = {}) => {
    try {
      const response = await api.get('/client/get-top-creative-partners', {
        headers: { Authorization: `Bearer ${token}` },
        params: { range: 'all', ...params },
      });
      return response.data;
    } catch (error) {
      console.error('Get Top Creative Partners Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch top creatives',
      };
    }
  },
  // Get post production members (affiliate dashboard)
  getPostProductionMembers: async (token: string) => {
    try {
      const response = await api.get('/admin/get-post-production-members', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Get Post Production Members Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch post production members',
      };
    }
  },
  // Assign post production member (affiliate dashboard)
  assignPostProductionMember: async (token: string, payload: { post_production_member_id: number; project_id: number }) => {
    try {
      const response = await api.post('/client/assign-post-production-member', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Assign Post Production Member Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to assign post production member',
      };
    }
  },

  // Submit project form (affiliate dashboard)
  submitProjectForm: async (token: string, payload: any) => {
    try {
      const response = await api.post('/client/submit-project-form', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      console.error('Submit Project Form Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to submit project form',
      };
    }
  },

  // Submit project form as guest
  submitProjectFormGuest: async (payload: any) => {
    try {
      const response = await api.post('/client/submit-project-form-guest', payload);
      return response.data;
    } catch (error: any) {
      console.error('Submit Project Form Guest Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to submit project form',
      };
    }
  },

  // Get booking details as guest
  getBookingDetailsGuest: async (projectId: number) => {
    try {
      const response = await api.get(`/client/get-booking-details/${projectId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get Booking Details Guest Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch booking details',
      };
    }
  },


  // Get project form submission (pending forms)
  getProjectFormSubmission: async (token: string) => {
    try {
      const response = await api.get('/client/get-project-form-submission', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      console.error('Get Project Form Submission Error:', error.response?.data || error.message);
      return {
        error: true,
        message: 'Failed to fetch pending project forms',
        projects: []
      };
    }
  },
};


export const getEquipmentSuggestions = async (queryParams = {}) => {
  try {
    const response = await api.get(
      'admin/equipment-autocomplete',
      {
        params: queryParams,
      }
    );

    return response;
  } catch (error) {
    console.error('Get Equipment Suggestions Error:', error);
    return {
      success: false,
      data: null,
      error: 'Failed to fetch equipment suggestions',
    };
  }
};

export const getStatusCount = async (payload: { crew_member_id: number, creator_id: number }) => {
  try {
    const response = await api.post(
      "creator/status-count",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Get Status Count Error:", error);
    return {
      success: false,
      data: null,
      error: "Failed to fetch status counts",
    };
  }
};


export const getPendingProjects = async (payload: { crew_member_id: number }) => {
  try {
    const response = await api.post(
      "creator/pending-projects",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Get Pending Projects Error:", error);
    return {
      success: false,
      data: null,
      error: "Failed to fetch pending projects",
    };
  }
};

export const GetUpcomingShoots = async (payload: { crew_member_id: number }) => {
  try {
    const response = await api.post(
      "creator/upcoming-accepted-project",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Get Upcoming Shoots Error:", error);
    return {
      success: false,
      data: null,
      error: "Failed to fetch upcoming shoots",
    };
  }
};

export const getAcceptedShoots = async (payload: { crew_member_id: number }) => {
  try {
    const response = await api.post(
      "creator/accepted-shoots",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Get Accepted Shoots Error:", error);
    return {
      success: false,
      data: null,
      error: "Failed to fetch accepted shoots",
    };
  }
};


export const acceptOrDeclineProject = async (payload: {
  project_id: number;
  crew_member_id: number;
  crew_accept: 0 | 1 | 2;
}) => {
  try {
    const response = await api.post(
      "creator/accept-project",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Accept/Decline Project Error:", error);
    return {
      success: false,
      data: null,
      error: "Failed to process accept/decline request",
    };
  }
};

export const getProject = async (projectId: number) => {
  try {
    const response = await api.get(`admin/get-project/${projectId}`);
    return response.data;
  } catch (error) {
    return {
      success: false,
      data: null,
      error: "Failed to fetch project details",
    };
  }
};


export const updateReferralCode = async (payload: {
  affiliate_id: number;
  referral_code: string;
}) => {
  try {
    const response = await api.put(
      "affiliates/update/referral",
      payload
    );

    const data = response.data;
    const message =
      data?.message ||
      data?.data?.message ||
      data?.error ||
      "";

    if (
      data?.success === false ||
      String(message).toLowerCase().includes("already in use")
    ) {
      const businessError: any = new Error(
        message || "Referral code already in use"
      );
      businessError.response = {
        data: {
          ...data,
          message: message || "Referral code already in use",
        },
      };
      throw businessError;
    }

    return data;
  } catch (error) {
    console.error("Update Referral Code Error:", error);
    throw error;
  }
};

export const getCrewAvailability = async (payload: any) => {
  try {
    const response = await api.post("creator/availability", payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    console.error('Get Crew Availability Error:', error);
    return {
      success: false,
      data: null,
      error: 'Failed to fetch crew availability',
    };
  }
};

export const getProjectDetails = async (payload: any) => {
  try {
    const response = await api.post("creator/project-details", payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    console.error('Get Project Details Error:', error);
    return {
      success: false,
      data: null,
      error: 'Failed to fetch project details',
    };
  }
};


export const AddAvailability = async (payload: any) => {
  try {
    const response = await api.post("creator/add-availability", payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    console.error('Get Crew Availability Error:', error);
    return {
      success: false,
      data: null,
      error: 'Failed to fetch crew availability',
    };
  }
};

// export const getProjectDetails = async (payload) => {
//   try {
//     const response = await api.post("", payload, {
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });
//     return response;
//   } catch (error) {
//     console.error('Get Project Details Error:', error);
//     return {
//       success: false,
//       data: null,
//       error: 'Failed to fetch project details',
//     };
//   }
// };


export const GetMyProfile = async (payload: any) => {
  try {
    const response = await api.post("creator/get-profile-detail", payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
    console.log('Profile Response:', response);
  } catch (error) {
    console.error('Get Profile Error:', error);
    return {
      success: false,
      data: null,
      error: 'Failed to fetch Profile',
    };
  }
};

export const EditMyProfile = async (payload: any) => {
  try {
    const response = await api.post("creator/edit-profile", payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
    console.log('Profile Response:', response);
  } catch (error) {
    console.error('Get Profile Error:', error);
    return {
      success: false,
      data: null,
      error: 'Failed to fetch Profile',
    };
  }
};

export const UploadProfilePhoto = async (file: File, crewMemberId: string | number) => {
  try {
    const formData = new FormData();
    // Backend expects 'profile_photo'
    formData.append("profile_photo", file);
    formData.append("crew_member_id", crewMemberId.toString());

    // Send as multipart/form-data
    const response = await api.post(`creator/profile/upload-profile-photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  } catch (error: any) {
    console.error(`Upload Profile Photo Error:`, error.response?.data || error.message);
    // Return a consistent error structure that the frontend expects (response.data.error)
    return {
      data: {
        error: true,
        message: error.response?.data?.message || "Upload failed"
      }
    };
  }
};

export const UploadProfileFile = async (fileType: string, files: File | File[], crewMemberId: string | number, metadata: any = {}) => {
  try {
    const formData = new FormData();

    // 1. Append all files to the 'files[]' field
    if (Array.isArray(files)) {
      files.forEach((file) => {
        formData.append("files[]", file);
      });
    } else {
      formData.append("files[]", files);
    }

    formData.append("crew_member_id", crewMemberId.toString());

    // 2. Append metadata
    if (metadata.title) formData.append("title", metadata.title);
    if (metadata.tag) formData.append("tag", metadata.tag);

    const response = await api.post(`creator/profile/files/${fileType}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  } catch (error) {
    console.error(`Upload ${fileType} Error:`, error);
    return { error: true, message: "Upload failed" };
  }
};

export const AddPortfolioLinks = async (payload: { crew_member_id: number; portfolio_links: { url: string; platform: string }[] }) => {
  try {
    const response = await api.post("creator/profile/add-portfolio-links", payload);
    return response;
  } catch (error) {
    console.error("Add Portfolio Links Error:", error);
    return {
      success: false,
      data: null,
      error: "Failed to add portfolio links",
    };
  }
};

export const EditPortfolioLink = async (crewFilesId: string | number, payload: { crew_member_id: number; url: string; title?: string; platform: string }) => {
  try {
    const response = await api.post(`creator/profile/edit-portfolio-link/${crewFilesId}`, payload);
    return response;
  } catch (error) {
    console.error("Edit Portfolio Link Error:", error);
    return {
      success: false,
      data: null,
      error: "Failed to edit portfolio link",
    };
  }
};

export const DeleteProfileFile = async (crewFilesId: string | number, payload: any) => {
  try {
    // Note: We use api.delete and pass the ID in the URL string
    const response = await api.delete(`creator/profile-file/${crewFilesId}`, { data: payload });
    return response;
  } catch (error) {
    console.error('Delete File Error:', error);
    return {
      success: false,
      data: null,
      error: 'Failed to delete file',
    };
  }
};

export const adminApi = {
  createInternalCredential: async (payload: {
    name: string;
    email: string;
    password: string;
    phone_number?: string;
    user_type: number;
  }) => {
    try {
      const response = await api.post('/auth/admin/create-internal-credential', payload);
      return response.data;
    } catch (error: any) {
      console.error('Create Internal Credential Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to create internal credential',
      };
    }
  },
  getCreditPointsDashboard: async (params: {
    range?: string;
    start_date?: string;
    end_date?: string;
    date_on?: string;
  } = {}) => {
    try {
      const response = await api.get('finance/admin/credit-points/dashboard', {
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error('Get Credit Points Dashboard Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch credit points dashboard',
      };
    }
  },
  getCreditPointsUserById: async (userId: string | number) => {
    try {
      const response = await api.get(`finance/admin/credit-points/users/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get Credit Points User Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch credit points user details',
      };
    }
  },
  getCreditPointsUserByGuestEmail: async (guestEmail: string) => {
    try {
      const response = await api.get('finance/admin/credit-points/users', {
        params: { guest_email: guestEmail },
      });
      return response.data;
    } catch (error: any) {
      console.error('Get Credit Points User By Guest Email Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch credit points user details',
      };
    }
  },
  exportCreditPoints: async () => {
    try {
      const response = await api.get('finance/admin/credit-points/export');
      return response.data;
    } catch (error: any) {
      console.error('Export Credit Points Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to export credit points',
      };
    }
  },
  createManualCreditPoint: async (payload: {
    user_type: string;
    target_user_id: number;
    amount: number;
    credit_type: string;
    expires_at?: string;
    reason: string;
    notes?: string;
    restrictions_json?: Record<string, unknown>;
    notify_user: boolean;
  }) => {
    try {
      const response = await api.post('finance/admin/credit-points/manual', payload);
      return response.data;
    } catch (error: any) {
      console.error('Create Manual Credit Point Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to create credit point',
      };
    }
  },
  getDashboardSummary: async (params: { range?: string; start_date?: string; end_date?: string; date_on?: string } = {}) => {
    try {
      const response = await api.get('admin/get-dashboard-summary', { params });
      return response.data;
    } catch (error) {
      console.error('Get Dashboard Summary Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch dashboard summary',
      };
    }
  },
  getTotalRevenue: async () => {
    try {
      const response = await api.get('admin/dashboard/revenue/total');
      return response.data;
    } catch (error) {
      console.error('Get Total Revenue Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch total revenue',
      };
    }
  },
  getClientFullDetails: async (userId: string | number) => {
    try {
      const response = await api.get(`admin/get-client-details-with-shoots/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get Client Full Details Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch client profile and shoots',
      };
    }
  },
  getProjectFulfillmentStats: async (projectId: string | number) => {
    try {
      const response = await api.post(`admin/get-project-fullfillment-stats/${projectId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get Project Fulfillment Stats Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch project fulfillment stats',
      };
    }
  },
  getCrewForShoot: async (params: { project_id: number | string, role_type: string, search_query: string, radius?: number }) => {
    try {
      const response = await api.get('admin/get-crew-for-shoot/', { params });
      return response.data;
    } catch (error) {
      console.error('Get Crew For Shoot Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch crew for shoot',
      };
    }
  },
  getCrewForBooking: async (params: { booking_id: number | string, role_type: string, search_query: string, radius?: number }) => {
    try {
      const response = await api.get('admin/get-crew-for-booking/', { params });
      return response.data;
    } catch (error: any) {
      // Backward-compatible fallback for environments still using project_id.
      try {
        const fallbackResponse = await api.get('admin/get-crew-for-shoot/', {
          params: {
            project_id: params.booking_id,
            role_type: params.role_type,
            search_query: params.search_query,
            radius: params.radius,
          },
        });
        return fallbackResponse.data;
      } catch (fallbackError) {
        console.error('Get Crew For Booking Error:', error);
        return {
          success: false,
          data: null,
          error: 'Failed to fetch crew for booking',
        };
      }
    }
  },
  getMonthlyRevenue: async () => {
    try {
      const response = await api.get('admin/dashboard/revenue/monthly');
      return response.data;
    } catch (error) {
      console.error('Get Monthly Revenue Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch monthly revenue',
      };
    }
  },
  getWeeklyRevenue: async () => {
    try {
      const response = await api.get('admin/dashboard/revenue/weekly');
      return response.data;
    } catch (error) {
      console.error('Get Weekly Revenue Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch weekly revenue',
      };
    }
  },
  getPayoutTotal: async () => {
    try {
      const response = await api.get('admin/dashboard/payout/total');
      return response.data;
    } catch (error) {
      console.error('Get Payout Total Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch payout total',
      };
    }
  },
  getPayoutWeeklyGraph: async () => {
    try {
      const response = await api.get('admin/dashboard/payout/weekly-graph');
      return response.data;
    } catch (error) {
      console.error('Get Payout Weekly Graph Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch payout weekly graph',
      };
    }
  },
  deleteProject: async (projectId: string | number) => {
    try {
      const response = await api.delete(`admin/delete-project/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Delete Project Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to delete project',
      };
    }
  },
  getPayoutPending: async () => {
    try {
      const response = await api.get('admin/dashboard/payout/pending');
      return response.data;
    } catch (error) {
      console.error('Get Payout Pending Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch payout pending',
      };
    }
  },
  getCPCount: async () => {
    try {
      const response = await api.get('admin/dashboard/cp/count');
      return response.data;
    } catch (error) {
      console.error('Get CP Count Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch CP count',
      };
    }
  },
  getCategoryWiseCPCount: async () => {
    try {
      const response = await api.get('admin/dashboard/category-wise-cp/count');
      return response.data;
    } catch (error) {
      console.error('Get Category Wise CP Count Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch category wise CP count',
      };
    }
  },
  getProjects: async (params: { status?: string; range?: string; start_date?: string; end_date?: string; date_on?: string; production_filter?: string } = {}) => {
    try {
      const response = await api.get('admin/get-projects', {
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error('Get Projects Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || 'Failed to fetch projects',
      };
    }
  },

  getProjectDetails: async (id: string) => {
    try {
      const response = await api.get(`admin/get-project/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get Project Details Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch project details',
      };
    }
  },

  getCrewMemberDetail: async (id: string) => {
    try {
      const response = await api.get(`admin/crew-member/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get Crew Member Detail Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch crew member details',
      };
    }
  },
  getSkills: async () => {
    try {
      const response = await api.get('admin/skills');
      return response.data;
    } catch (error: any) {
      console.error('Get Skills Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch skills',
      };
    }
  },
  getShootStatus: async (range: 'all' | 'monthly' = 'all') => {
    try {
      const response = await api.get('admin/dashboard/shoot-status', {
        params: { range },
      });
      return response.data;
    } catch (error: any) {
      console.error('Get Shoot Status Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch shoot status',
      };
    }
  },
  getTopCreativePartners: async (params: { range?: string; start_date?: string; end_date?: string } = {}) => {
    try {
      const response = await api.get('admin/dashboard/top-creative-partners', {
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error('Get Top Creative Partners Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch top creative partners',
      };
    }
  },
  getCrewMembers: async (params: { page?: number; limit?: number; search?: string; status?: string } = {}) => {
    try {
      const response = await api.post('admin/get-crew-members', {
        page: params.page || 1,
        limit: params.limit || 50,
        search: params.search,
        status: params.status,
      });
      return response.data;
    } catch (error: any) {
      console.error('Get Crew Members Error:', error.response?.data || error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || 'Failed to fetch crew members',
      };
    }
  },

  getapprovedCrewMembers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sort_by?: string;
    sort_order?: string;
    start_date?: string;
    end_date?: string;
  } = {}) => {
    try {
      const response = await api.post('admin/get-approved-crew-members', {
        page: params.page || 1,
        limit: params.limit || 50,
        search: params.search,
        status: params.status,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        start_date: params.start_date,
        end_date: params.end_date
      });
      return response.data;
    } catch (error: any) {
      console.error('Get Crew Members Error:', error.response?.data || error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || 'Failed to fetch crew members',
      };
    }
  },
  verifyCrewMember: async (payload: { crew_member_id: number; status: number }) => {
    try {
      const response = await api.post('admin/verify-crew-member', payload);
      return response.data;
    } catch (error: any) {
      console.error('Verify Crew Member Error:', error.response?.data || error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || 'Failed to verify crew member',
      };
    }
  },
  getAdminDashboardDetail: async (payload: { crew_member_id: string | number }) => {
    try {
      const response = await api.post('admin/dashboard-detail', payload);
      return response.data;
    } catch (error: any) {
      // Suppress error logging for 401/403 as this happens when non-admins (e.g. Sales Reps) view CP profiles
      const status = error.response?.status;
      if (status !== 401 && status !== 403) {
        console.error('Get Admin Dashboard Detail Error:', error.response?.data || error.message);
      }
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch dashboard detail',
      };
    }
  },
  getCrewMemberAssignedProjects: async (payload: { crew_member_id: string | number }) => {
    try {
      const response = await api.post('admin/crew-member-assigned-projects', payload);
      return response.data;
    } catch (error: any) {
      console.error('Get Crew Member Assigned Projects Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch assigned projects',
      };
    }
  },

  getRecentActivity: async (limit: number = 10) => {
    try {
      const response = await api.get('admin/recent-activity', {
        params: { limit },
      });
      return response.data;
    } catch (error: any) {
      console.error('Get Recent Activity Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch recent activity',
      };
    }
  },

  getShootCategoryCount: async (tab?: string) => {
    try {
      const response = await api.get('admin/shoot-category-count', {
        params: tab ? { tab } : {},
      });
      return response.data;
    } catch (error: any) {
      console.error('Get Shoot Category Count Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch shoot category count',
      };
    }
  },

  getPostProductionMembers: async () => {
    try {
      const response = await api.get('admin/get-post-production-members');
      return response.data;
    } catch (error: any) {
      console.error('Get Post Production Members Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch post production members',
      };
    }
  },

  assignPostProductionMember: async (payload: { post_production_member_id: number; project_id: number }) => {
    try {
      const response = await api.post('admin/assign-post-production-member', payload);
      return response.data;
    } catch (error: any) {
      console.error('Assign Post Production Member Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to assign post production member',
      };
    }
  },
  removeProjectCrew: async (payload: { project_id: number; crew_member_id: number }) => {
    try {
      const response = await api.post('admin/remove-project-crew', payload);
      return response.data;
    } catch (error: any) {
      console.error('Remove Project Crew Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to remove assigned creative partner',
      };
    }
  },
  getDashboardChartData: async (params: { range?: string; date_on?: string } = {}) => {
    try {
      const response = await api.get('admin/dashboard-chart-data', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get Dashboard Chart Data Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch dashboard chart data',
      };
    }
  },
  getClients: async (params: { page?: number; limit?: number; search?: string; status?: string; assigned_to?: string } = {}) => {
    try {
      const response = await api.get('sales/client-leads', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get Client Leads Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch client leads',
      };
    }
  },
  getAdminClients: async (params: { page?: number; limit?: number; search?: string; status?: string; range?: string; start_date?: string; end_date?: string } = {}) => {
    try {
      const response = await api.get('admin/get-clients', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get Admin Clients Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch clients',
      };
    }
  },

  getPendingCP: async (params: { page?: number; limit?: number; search?: string } = {}) => {
    try {
      const response = await api.get('admin/get-pending-cp', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get Pending CP Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch pending creative partners',
      };
    }
  },

  checkCpDeleteStatus: async (crew_member_id: string | number) => {
    try {
      const response = await api.get(`admin/check-cp-delete-status`, {
        params: { crew_member_id }
      });
      return response.data;
    } catch (error: any) {
      console.error('Check CP Delete Status Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to check CP delete status',
      };
    }
  },

  deleteCp: async (crew_member_id: string | number) => {
    try {
      const response = await api.post(`admin/delete-cp`, {
        crew_member_id: Number(crew_member_id)
      });
      return response.data;
    } catch (error: any) {
      console.error('Delete CP Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to delete creative partner',
      };
    }
  },

  getClientById: async (id: string | number) => {
    try {
      const response = await api.get(`admin/get-client-by-id/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get Client By ID Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch client details',
      };
    }
  },

  getClientShoots: async (id: string | number) => {
    try {
      const response = await api.get(`admin/get-clients-shoots/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get Client Shoots Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch client shoots',
      };
    }
  },
  getProjectForm: async (id: string | number) => {
    try {
      const response = await api.get(`admin/get-project-form/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get Project Form Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        id
      });
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || 'Failed to fetch project form details',
      };
    }
  },
};

export const GetCreatorDashboardCount = async (payload: any) => {
  try {
    const response = await api.post("creator/dashboard-count", payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    console.error('Get Dashboard Count Error:', error);
    return {
      success: false,
      data: null,
      error: 'Failed to fetch Dashboard Count',
    };
  }
};

export const GetCreatorDashboardDetails = async (payload: any) => {
  try {
    const response = await api.post("creator/dashboard-details", payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    console.error('Get Dashboard Details Error:', error);
    return {
      success: false,
      data: null,
      error: 'Failed to fetch Dashboard Details',
    };
  }
};

export const GetCreatorStats = async (payload: any) => {
  try {
    const response = await api.post("creator/get-crew-stats", payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    console.error('Get Crew Stats Error:', error);
    return {
      success: false,
      data: null,
      error: 'Failed to fetch Crew Stats',
    };
  }
};

export const getAvailabilityDetails = async (payload: { year: string, month: string, crew_member_id: string | number }) => {
  try {
    const response = await api.post("creator/availability", payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Get Availability Details Error:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to fetch availability details',
    };
  }
};

export const CheckVerificationStatus = async (payload: { crew_member_id: any }) => {
  try {
    const response = await api.post("creator/check-verification-status", payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error: any) {
    console.error('Check Verification Status Error:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to fetch verification status',
    };
  }
};

export const CheckCPStatus = async () => {
  try {
    const response = await api.get("creator/check-cp-status");
    return response.data;
  } catch (error: any) {
    // If we get a 401, it means the token is invalid or the CP is deleted/inactive
    if (error.response?.status === 401) {
      return {
        success: false,
        is_deleted: true,
        error: "Unauthorized"
      };
    }
    console.error('Check CP Status Error:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to check CP status',
    };
  }
};

export const ConfirmCPEventLocation = async () => {
  try {
    const response = await api.post("auth/cp-event-location/confirm", {}, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error: any) {
    console.error('Confirm CP Event Location Error:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to confirm event location',
    };
  }
};

export const salesApi = {
  getLeads: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    lead_type?: string;
    assigned_to?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
    intent?: string;
    cp_assignment?: string;
    production_filter?: string;
  } = {}) => {
    try {
      const response = await api.get('/sales/leads', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get Leads Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch leads',
      };
    }
  },
  getLeadsBoard: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    lead_type?: string;
    assigned_to?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
    intent?: string;
    cp_assignment?: string;
    production_filter?: string;
  } = {}) => {
    try {
      const response = await api.get('/sales/leads/board', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get Leads Board Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch leads board',
      };
    }
  },
  getLeadStats: async (leadId: number | string) => {
    try {
      const response = await api.get(`/sales/get-lead-stats/${leadId}`);
      return response.data;
    } catch (error) {
      console.error('Get Lead Stats Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch lead stats',
      };
    }
  },
  getClientLeadStats: async (leadId: number | string) => {
    try {
      const response = await api.get(`/sales/get-client-lead-stats/${leadId}`);
      return response.data;
    } catch (error) {
      console.error('Get Client Lead Stats Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch client lead stats',
      };
    }
  },
  getCrewForLead: async (params: { lead_id: number | string, role_type: string, search_query: string, radius?: number }) => {
    try {
      const response = await api.get('admin/get-crew-for-lead/', { params });
      return response.data;
    } catch (error) {
      console.error('Get Crew For Lead Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch crew for lead',
      };
    }
  },
  createQuoteDraft: async (data: Record<string, unknown>) => {
    try {
      const response = await api.post('/sales/quotes', data);
      return response.data;
    } catch (error: any) {
      console.error('Create Quote Draft Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to create quote draft',
      };
    }
  },
  updateQuote: async (quoteId: number | string, data: Record<string, unknown>) => {
    try {
      const response = await api.put<SalesQuoteDetailResponse>(`/sales/quotes/${quoteId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Update Quote Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to update quote',
      };
    }
  },
  duplicateQuote: async (quoteId: number | string) => {
    try {
      const response = await api.post<SalesQuoteDetailResponse>(
        `/sales/quotes/${quoteId}/duplicate`,
        {}
      );
      return response.data;
    } catch (error: any) {
      console.error('Duplicate Quote Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to duplicate quote',
      };
    }
  },
  getQuotesDashboard: async (
    params: {
      range?: string;
      date_on?: string;
      status?: string;
      assigned_sales_rep_id?: number | string;
    } = {}
  ) => {
    try {
      const response = await api.get<QuotesDashboardResponse>('/sales/quotes/dashboard', { params });
      return response.data;
    } catch (error) {
      console.error('Get Quotes Dashboard Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch quotes dashboard data',
      };
    }
  },
  getQuotesList: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      range?: string;
      date_on?: string;
      assigned_sales_rep_id?: number | string;
    } = {}
  ) => {
    try {
      const response = await api.get<QuotesListResponse>('/sales/quotes', { params });
      return response.data;
    } catch (error) {
      console.error('Get Quotes List Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch quotes list',
      };
    }
  },
  getClientQuotesList: async (
    clientUserId: number | string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      range?: string;
      date_on?: string;
      assigned_sales_rep_id?: number | string;
    } = {}
  ) => {
    try {
      const response = await api.get<QuotesListResponse>('/sales/quotes', {
        params: {
          ...params,
          client_user_id: clientUserId,
          user_id: clientUserId,
          client_id: clientUserId,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Get Client Quotes List Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch client quotes list',
      };
    }
  },
  updateAffiliateQuoteStatus: async (quoteId: number | string, status: string) => {
    try {
      void status;
      const response = await api.get<SalesQuoteStatusUpdateResponse>(
        `/sales/quotes/reject/${quoteId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Update Affiliate Quote Status Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to update affiliate quote status',
      };
    }
  },
  getQuoteDetail: async (quoteId: number | string) => {
    try {
      const response = await api.get<SalesQuoteDetailResponse>(`/sales/quotes/${quoteId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get Quote Detail Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch quote detail',
      };
    }
  },
  getQuoteVersions: async (quoteId: number | string) => {
    try {
      const response = await api.get(`/sales/quotes/${quoteId}/versions`);
      return response.data;
    } catch (error: any) {
      console.error('Get Quote Versions Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch quote versions',
      };
    }
  },
  getQuoteVersionDetail: async (quoteId: number | string, versionId: number | string) => {
    try {
      const response = await api.get(`/sales/quotes/${quoteId}/versions/${versionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get Quote Version Detail Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch quote version detail',
      };
    }
  },
  getPublicQuoteDetail: async (quoteId: number | string) => {
    try {
      const response = await publicApi.get<SalesQuoteDetailResponse>(
        `/sales/quotes/public/${quoteId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Get Public Quote Detail Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch public quote detail',
      };
    }
  },
  sendQuoteProposal: async (quoteId: number | string) => {
    try {
      const response = await api.post<SalesQuoteSendResponse>(`/sales/quotes/${quoteId}/send`, {});
      return response.data;
    } catch (error: any) {
      console.error('Send Quote Proposal Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to send quote proposal',
      };
    }
  },
  getInvoiceHistory: async (params: { page?: number; limit?: number; search?: string; status?: string } = {}) => {
    try {
      const response = await api.get('/sales/dashboard/invoice-history', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get Invoice History Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch invoice history',
      };
    }
  },
  getQuoteChangeRequests: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      approval_status?: string;
      request_type?: string;
    } = {}
  ) => {
    try {
      const response = await api.get<QuoteChangeRequestsResponse>(
        '/sales/dashboard/quote-change-requests',
        { params }
      );
      return response.data;
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;

      console.error(
        'Get Quote Change Requests Error:',
        axios.isAxiosError(error) ? error.response?.data || error.message : error
      );

      return {
        success: false,
        data: null,
        message: errorMessage || 'Failed to fetch quote change requests',
        error: errorMessage || 'Failed to fetch quote change requests',
      } satisfies QuoteChangeRequestsResponse;
    }
  },
  approveQuoteChangeRequest: async (activityId: number | string) => {
    try {
      const response = await api.post<QuoteChangeRequestReviewResponse>(
        '/sales/dashboard/quote-change-requests/approve',
        { activity_id: activityId }
      );
      return response.data;
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;

      console.error(
        'Approve Quote Change Request Error:',
        axios.isAxiosError(error) ? error.response?.data || error.message : error
      );

      return {
        success: false,
        data: null,
        message: errorMessage || 'Failed to approve quote change request',
        error: errorMessage || 'Failed to approve quote change request',
      } satisfies QuoteChangeRequestReviewResponse;
    }
  },
  rejectQuoteChangeRequest: async (activityId: number | string) => {
    try {
      const response = await api.post<QuoteChangeRequestReviewResponse>(
        '/sales/dashboard/quote-change-requests/reject',
        { activity_id: activityId }
      );
      return response.data;
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;

      console.error(
        'Reject Quote Change Request Error:',
        axios.isAxiosError(error) ? error.response?.data || error.message : error
      );

      return {
        success: false,
        data: null,
        message: errorMessage || 'Failed to reject quote change request',
        error: errorMessage || 'Failed to reject quote change request',
      } satisfies QuoteChangeRequestReviewResponse;
    }
  },
  previewQuoteInvoice: async (quoteId: number | string) => {
    try {
      const response = await api.post<SalesQuoteInvoiceResponse>(
        `/sales/quotes/${quoteId}/preview-invoice`,
        {}
      );
      return response.data;
    } catch (error: any) {
      console.error('Preview Quote Invoice Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to preview quote invoice',
      };
    }
  },
  sendQuoteInvoice: async (quoteId: number | string) => {
    try {
      const response = await api.post<SalesQuoteInvoiceResponse>(
        `/sales/quotes/${quoteId}/send-invoice`,
        {}
      );
      return response.data;
    } catch (error: any) {
      console.error('Send Quote Invoice Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to send quote invoice',
      };
    }
  },
  updateQuoteStatus: async (quoteId: number | string, status: string) => {
    try {
      const response = await api.patch<SalesQuoteStatusUpdateResponse>(
        `/sales/quotes/${quoteId}/status`,
        { status }
      );
      return response.data;
    } catch (error: any) {
      console.error('Update Quote Status Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to update quote status',
      };
    }
  },
  convertQuoteToBooking: async (
    quoteId: number | string,
    payload: SalesQuoteConvertToBookingPayload
  ) => {
    try {
      const response = await api.post<SalesQuoteConvertToBookingResponse>(
        `/sales/quotes/${quoteId}/convert-to-booking`,
        payload
      );
      return response.data;
    } catch (error: any) {
      console.error('Convert Quote To Booking Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to convert quote to booking',
      };
    }
  },
  updateLeadBookingSchedule: async (
    leadId: number | string,
    payload: LeadBookingSchedulePayload
  ) => {
    try {
      const response = await api.put<SalesLeadUpdateBookingScheduleResponse>(
        `/sales/leads/${leadId}/booking-schedule`,
        payload
      );
      return response.data;
    } catch (error: any) {
      console.error('Update Lead Booking Schedule Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to update booking schedule',
      };
    }
  },
  getQuoteCatalog: async () => {
    try {
      const response = await api.get('/sales/quotes/catalog');
      return response.data;
    } catch (error) {
      console.error('Get Quote Catalog Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch quote catalog',
      };
    }
  },
  createQuoteCatalog: async (data: {
    section_type: string;
    name: string;
    default_rate: number;
    rate_type: string;
    rate_unit: string | null;
  }) => {
    try {
      const response = await api.post('/sales/quotes/catalog', data);
      return response.data;
    } catch (error: any) {
      console.error('Create Quote Catalog Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to create catalog item',
      };
    }
  },
  updateQuoteCatalog: async (
    id: number | string,
    data: {
      section_type: string;
      name: string;
      default_rate: number;
      rate_type: string;
      rate_unit: string | null;
    },
  ) => {
    try {
      const response = await api.put(`/sales/quotes/catalog/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Update Quote Catalog Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to update catalog item',
      };
    }
  },
  createShootType: async (data: { name: string; content_type: number }) => {
    try {
      const response = await api.post('/sales/quotes/shoot-types', data);
      return response.data;
    } catch (error: any) {
      console.error('Create Shoot Type Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to create shoot type',
      };
    }
  },
  getShootTypes: async (id: number | string) => {
    try {
      const response = await api.get(`/sales/quotes/shoot-types/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Shoot Types Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch shoot types',
      };
    }
  },
  getAiEditingTypes: async () => {
    try {
      const response = await api.get('/sales/quotes/ai-editing-types');
      return response.data;
    } catch (error) {
      console.error('Get AI Editing Types Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch AI editing types',
      };
    }
  },
  createAiEditingType: async (data: { category: "video" | "photo"; label: string }) => {
    try {
      const response = await api.post('/sales/quotes/ai-editing-types', data);
      return response.data;
    } catch (error: any) {
      console.error('Create AI Editing Type Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to create AI editing type',
      };
    }
  },
  deleteAiEditingType: async (id: number | string) => {
    try {
      const editingTypeId = Number(id);

      if (!Number.isInteger(editingTypeId) || editingTypeId <= 0) {
        return {
          success: false,
          data: null,
          error: 'Invalid AI editing type id',
        };
      }

      const response = await api.delete(`/sales/quotes/ai-editing-types/${editingTypeId}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete AI Editing Type Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to delete AI editing type',
      };
    }
  },
  deleteShootType: async (id: number | string) => {
    try {
      const shootTypeId = Number(id);

      if (!Number.isInteger(shootTypeId) || shootTypeId <= 0) {
        return {
          success: false,
          data: null,
          error: 'Invalid shoot type id',
        };
      }

      const response = await api.delete(`/sales/quotes/shoot-types/${shootTypeId}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete Shoot Type Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to delete shoot type',
      };
    }
  },
  getClientDropdown: async (search?: string) => {
    try {
      const url = search ? `/sales/client-dropdown?search=${search}` : '/sales/client-dropdown';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Get Client Dropdown Error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch client dropdown',
      };
    }
  },
  createClient: async (data: { name: string; email: string; phone_number: string }) => {
    try {
      const response = await api.post('/sales/create-client', data);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      console.error('Create Client Error:', error);
      return {
        success: false,
        data: null,
        error: apiError.response?.data?.message || 'Failed to create client',
      };
    }
  },
  getSalesReps: async (options?: { includeInactive?: boolean }) => {
    try {
      const response = await api.get('/sales/sales-reps', {
        params: options?.includeInactive ? { include_inactive: true } : undefined,
      });
      return response.data;
    } catch (error: any) {
      console.error('Get Sales Reps Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch sales representatives',
      };
    }
  },
  getSalesRepStatusDetails: async (
    params: {
      sales_rep_id: number | string;
      date?: string;
      start_date?: string;
      end_date?: string;
      search?: string;
      lead_status?: string;
      lead_type?: string;
    }
  ) => {
    try {
      const response = await api.get('/sales/status-details', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get Sales Rep Status Details Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch sales representative status details',
      };
    }
  },
  getDashboardOverview: async (period: string = 'all_time') => {
    try {
      const response = await api.get('/sales/dashboard/overview', {
        params: { period },
      });
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      const isLogoutLikeFailure =
        status === 401 ||
        status === 403 ||
        error?.code === 'ERR_CANCELED' ||
        error?.message === 'canceled';

      if (!isLogoutLikeFailure) {
        console.error('Get Dashboard Overview Error:', error.response?.data || error.message);
      }

      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch dashboard overview',
      };
    }
  },
  getCurrentSalesStatus: async () => {
    try {
      const response = await api.get('/sales/current-status');
      return response.data;
    } catch (error: any) {
      console.error('Get Current Sales Status Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch current sales status',
      };
    }
  },
  toggleSalesStatus: async (payload: { is_available: 0 | 1; reason?: string }) => {
    try {
      const response = await api.post('/sales/toggle-status', payload);
      return response.data;
    } catch (error: any) {
      console.error('Toggle Sales Status Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to update sales status',
      };
    }
  },
  changeLeadSalesRep: async (leadId: number | string, sales_rep_id: number | string) => {
    try {
      const response = await api.put(`/sales/leads/${leadId}/change-sales-rep`, {
        sales_rep_id: Number(sales_rep_id),
      });
      return response.data;
    } catch (error: any) {
      console.error('Change Lead Sales Rep Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to update assigned sales representative',
      };
    }
  },
  assignLeadToSelf: async (leadId: number | string) => {
    try {
      const response = await api.put(`/sales/leads/${leadId}/assign-self`);
      return response.data;
    } catch (error: any) {
      console.error('Assign Lead To Self Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to assign lead to yourself',
      };
    }
  },
  recordLeadManualPayment: async (
    leadId: number | string,
    payload: {
      payment_type: "full" | "partial";
      amount?: number;
      payment_mode: "cash" | "wire" | "ach" | "zelle" | "venmo" | "cashapp" | "applepay" | "other";
      other_payment_mode?: string;
      proof_url: string;
      notes?: string;
    }
  ) => {
    try {
      const response = await api.post(`/sales/leads/${leadId}/manual-payment`, payload);
      return response.data;
    } catch (error: any) {
      console.error('Record Lead Manual Payment Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to record manual payment',
      };
    }
  },
  recordClientLeadManualPayment: async (
    leadId: number | string,
    payload: {
      payment_type: "full" | "partial";
      amount?: number;
      payment_mode: "cash" | "wire" | "ach" | "zelle" | "venmo" | "cashapp" | "applepay" | "other";
      other_payment_mode?: string;
      proof_url: string;
      notes?: string;
    }
  ) => {
    try {
      const response = await api.post(`/sales/client-leads/${leadId}/manual-payment`, payload);
      return response.data;
    } catch (error: any) {
      console.error('Record Client Lead Manual Payment Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to record manual payment',
      };
    }
  },
  uploadManualPaymentProof: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("proof_file", file);
      const response = await api.post('/sales/leads/manual-payment/upload-proof', formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error: any) {
      console.error('Upload Manual Payment Proof Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to upload proof file',
      };
    }
  },
  getLeadPaymentMeta: async (leadId: number | string, isClientLead = false) => {
    try {
      const endpoint = isClientLead ? `/sales/client-leads/${leadId}` : `/sales/leads/${leadId}`;
      const response = await api.get(endpoint);
      const lead = response?.data?.data || null;
      return {
        success: true,
        data: lead,
      };
    } catch (error: any) {
      console.error('Get Lead Payment Meta Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch lead payment details',
      };
    }
  },
  changeClientLeadSalesRep: async (leadId: number | string, sales_rep_id: number | string) => {
    try {
      const response = await api.put(`/sales/client-leads/${leadId}/change-sales-rep`, {
        sales_rep_id: Number(sales_rep_id),
      });
      return response.data;
    } catch (error: any) {
      console.error('Change Client Lead Sales Rep Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to update assigned sales representative',
      };
    }
  },
  assignClientLeadToSelf: async (leadId: number | string) => {
    try {
      const response = await api.put(`/sales/client-leads/${leadId}/assign-self`);
      return response.data;
    } catch (error: any) {
      console.error('Assign Client Lead To Self Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to assign client lead to yourself',
      };
    }
  },
  deleteQuoteCatalog: async (id: number | string) => {
    try {
      const response = await api.delete(`/sales/quotes/catalog/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete Quote Catalog Error:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to delete catalog item',
      };
    }
  },

  saveSignature: async (payload: {
    quote_id: number | string;
    signer_name: string;
    signer_email?: string;
    signature_base64: string;
  }) => {
    try {
      const response = await api.post('/signatures/sign', payload);
      return response.data;
    } catch (error: any) {
      console.error('Save Signature Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to save signature',
      };
    }
  },

  signAndAcceptQuote: async (payload: {
    quote_id: number | string;
    signature: File;
    signer_email: string;
    signer_name: string;
  }) => {
    try {
      const formData = new FormData();
      formData.append('quote_id', String(payload.quote_id));
      formData.append('signature', payload.signature);
      formData.append('signer_email', payload.signer_email);
      formData.append('signer_name', payload.signer_name);

      const response = await api.post('/signatures/sign', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      console.error('Sign And Accept Quote Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to sign and accept quote',
      };
    }
  },

  getSignatureByQuote: async (quote_id: number | string) => {
    try {
      const response = await api.get(`/signatures/quote/${quote_id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get Signature Error:', error.response?.data || error.message);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch signature',
      };
    }
  },

  downloadSignedPdf: (quote_id: number | string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://revure-api.beige.app/v1/';
    return `${baseUrl}signatures/download/${quote_id}`;
  },
};
