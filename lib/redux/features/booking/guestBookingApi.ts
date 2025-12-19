import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ApiResponse } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:5001/v1/';

export interface GuestBookingData {
  order_name: string;
  guest_email: string;
  project_type?: string | null;
  content_type?: string | null;
  shoot_type?: string;
  edit_type?: string;
  description?: string;
  event_type?: string;
  start_date_time: string;
  duration_hours?: number;
  end_time?: string;
  budget_min?: number;
  budget_max?: number;
  expected_viewers?: number;
  stream_quality?: string;
  crew_size?: string;
  location?: string;
  streaming_platforms?: string[];
  crew_roles?: string[];
  skills_needed?: string;
  equipments_needed?: string;
  is_draft?: boolean;
}

export interface LocationObject {
  address: string | null;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  hasCoordinates: boolean;
}

export interface GuestBookingResponse {
  booking_id: number;
  project_name: string;
  guest_email: string;
  event_date: string;
  event_location: LocationObject | null;
  budget: number | null;
  is_draft: boolean;
  created_at: any;
}

export const guestBookingApi = createApi({
  reducerPath: 'guestBookingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
  }),
  endpoints: (builder) => ({
    createGuestBooking: builder.mutation<GuestBookingResponse, GuestBookingData>({
      query: (data) => ({
        url: 'guest-bookings/create',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<GuestBookingResponse>) => response.data!,
    }),
  }),
});

export const { useCreateGuestBookingMutation } = guestBookingApi;
