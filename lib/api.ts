import axios from 'axios';
import type { Creator, Review, Equipment, PaymentIntentResponse, BookingResponse, BookingFormData } from '@/types/payment';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://revure-api.beige.app/v1/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const creatorApi = {
  getById: async (creatorId: string): Promise<Creator> => {
    const response = await api.get(`/creators/${creatorId}`);
    return response.data.data || response.data;
  },
};

export const reviewApi = {
  getByCreator: async (creatorId: string, limit: number = 5): Promise<Review[]> => {
    const response = await api.get(`/reviews/by-creator/${creatorId}`, {
      params: { limit },
    });
    return response.data.data || response.data;
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
