import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import type {
  Booking,
  BookingData,
  BookingResponse,
  PaginatedResponse,
  ApiResponse
} from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:5001/v1/';

export const bookingsApi = createApi({
  reducerPath: 'bookingsApi',
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
  tagTypes: ['Booking'],
  endpoints: (builder) => ({
    createBooking: builder.mutation<BookingResponse, BookingData>({
      query: (data) => ({
        url: 'bookings/create',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<BookingResponse>) => response.data!,
      invalidatesTags: ['Booking'],
    }),
    getUserBookings: builder.query<PaginatedResponse<Booking>, { page?: number; limit?: number; status?: string }>({
      query: ({ page = 1, limit = 10, status }) => ({
        url: 'bookings',
        params: { page, limit, status },
      }),
      transformResponse: (response: ApiResponse<PaginatedResponse<Booking>>) => response.data!,
      providesTags: ['Booking'],
    }),
    getBooking: builder.query<Booking, number>({
      query: (id) => `bookings/${id}`,
      transformResponse: (response: ApiResponse<Booking>) => response.data!,
      providesTags: (result, error, id) => [{ type: 'Booking', id }],
    }),
    updateBooking: builder.mutation<Booking, { id: number; data: Partial<BookingData> }>({
      query: ({ id, data }) => ({
        url: `bookings/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Booking>) => response.data!,
      invalidatesTags: (result, error, { id }) => [{ type: 'Booking', id }, 'Booking'],
    }),
  }),
});

export const {
  useCreateBookingMutation,
  useGetUserBookingsQuery,
  useGetBookingQuery,
  useUpdateBookingMutation,
} = bookingsApi;
