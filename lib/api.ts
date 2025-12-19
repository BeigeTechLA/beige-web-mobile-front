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
    bookingData: BookingFormData,
    amount: number
  ): Promise<PaymentIntentResponse> => {
    const response = await api.post('/payments/create-intent', {
      creator_id: creatorId,
      ...bookingData,
      amount,
    });
    return response.data;
  },

  confirmBooking: async (
    paymentIntentId: string,
    bookingData: BookingFormData & { creator_id: string }
  ): Promise<BookingResponse> => {
    const response = await api.post('/bookings/confirm', {
      payment_intent_id: paymentIntentId,
      ...bookingData,
    });
    return response.data;
  },
};
