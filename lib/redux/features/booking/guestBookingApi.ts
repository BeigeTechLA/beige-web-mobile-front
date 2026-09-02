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
  start_date_time?: string;
  start_date?: string | null;
  start_time?: string | null;
  duration_hours?: number | null;
  end_time?: string | null;
  time_zone?: string | null;
  budget_min?: number;
  budget_max?: number;
  expected_viewers?: number;
  stream_quality?: string;
  crew_size?: string;
  location?: string;
  location_latitude?: number | null;
  location_longitude?: number | null;
  streaming_platforms?: string[];
  crew_roles?: string[];
  skills_needed?: string;
  equipments_needed?: string;
  is_draft?: boolean;
  full_name?: string;
  phone?: string;
  edits_needed?: boolean;
  video_edit_types?: string[];
  photo_edit_types?: string[];
  matching_method?: string;
  selected_crew_ids?: number[];
  special_instructions?: string;
  reference_links?: string[];
  booking_type?: 'single_day' | 'multi_day';
  booking_days?: unknown[];
  estimated_delivery_date?: string | null;
  end_date_time?: string;
  // Pricing quote reference
  quote_id?: number | null;
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
  start_time?: string;
  duration_hours?: number | null;
  event_location: LocationObject | null;
  budget: number | string | null;
  event_type?: string | null;
  description?: string | null;
  crew_size_needed?: number | null;
  skills_needed?: string | null;
  equipments_needed?: string | null;
  is_draft: boolean;
  created_at: string;
  // Pricing quote reference
  quote_id?: number | null;
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
    createGuestBookingV4: builder.mutation<GuestBookingResponse, GuestBookingData>({
      query: (data) => ({
        url: 'book-a-shoot/v4/guest-bookings/create',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<GuestBookingResponse>) => response.data!,
    }),
    updateGuestBooking: builder.mutation<GuestBookingResponse, { id: number; data: Partial<GuestBookingData> }>({
      query: ({ id, data }) => ({
        url: `guest-bookings/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<GuestBookingResponse>) => response.data!,
    }),
    updateGuestBookingV4: builder.mutation<GuestBookingResponse, { id: number; data: Partial<GuestBookingData> }>({
      query: ({ id, data }) => ({
        url: `book-a-shoot/v4/guest-bookings/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<GuestBookingResponse>) => response.data!,
    }),
    getGuestBookingById: builder.query<GuestBookingResponse, string>({
      query: (id) => `guest-bookings/${id}`,
      transformResponse: (response: ApiResponse<GuestBookingResponse>) => response.data!,
    }),
    getGuestBookingByIdV4: builder.query<GuestBookingResponse, string>({
      query: (id) => `book-a-shoot/v4/guest-bookings/${id}`,
      transformResponse: (response: ApiResponse<GuestBookingResponse>) => response.data!,
    }),
  }),
});

export const {
  useCreateGuestBookingMutation,
  useCreateGuestBookingV4Mutation,
  useUpdateGuestBookingMutation,
  useUpdateGuestBookingV4Mutation,
  useGetGuestBookingByIdQuery,
  useGetGuestBookingByIdV4Query
} = guestBookingApi;