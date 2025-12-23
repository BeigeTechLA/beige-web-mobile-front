import axios from 'axios';
import type { Creator, Review, Equipment, PaymentIntentResponse, BookingResponse, BookingFormData } from '@/types/payment';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://revure-api.beige.app/v1/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Role mapping
const ROLE_MAP: Record<number, string> = {
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
    bookingData: BookingFormData & { guest_email?: string },
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
      guest_email: bookingData.guest_email,
    });
    // API returns { success: true, data: { clientSecret, paymentIntentId, pricing } }
    return response.data.data;
  },

  confirmBooking: async (
    paymentIntentId: string,
    bookingData: BookingFormData & { creator_id: string; guest_email?: string; hourly_rate?: number; referral_code?: string }
  ): Promise<BookingResponse> => {
    const response = await api.post('/payments/confirm', {
      paymentIntentId: paymentIntentId,
      creator_id: bookingData.creator_id,
      hours: bookingData.hours,
      hourly_rate: bookingData.hourly_rate,
      equipment: [], // No equipment for now
      shoot_date: bookingData.shoot_date,
      location: bookingData.location,
      shoot_type: bookingData.shoot_type,
      notes: bookingData.special_requests || '',
      guest_email: bookingData.guest_email,
      referral_code: bookingData.referral_code,
    });
    return response.data;
  },
};

// Affiliate API Types
export interface AffiliateValidationResponse {
  valid: boolean;
  referral_code?: string;
  affiliate_name?: string;
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

export const affiliateApi = {
  // Validate a referral code (public endpoint)
  validateCode: async (code: string): Promise<AffiliateValidationResponse> => {
    try {
      const response = await api.get(`/affiliates/validate/${code}`);
      return {
        valid: response.data.valid || false,
        referral_code: response.data.data?.referral_code,
        affiliate_name: response.data.data?.affiliate_name,
      };
    } catch (error) {
      return { valid: false };
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
    const response = await api.put('/affiliates/payout-details', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },
};
