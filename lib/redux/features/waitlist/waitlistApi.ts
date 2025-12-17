import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { WaitlistData, WaitlistEntry, ApiResponse } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:5001/v1/';

export const waitlistApi = createApi({
  reducerPath: 'waitlistApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
  }),
  endpoints: (builder) => ({
    joinWaitlist: builder.mutation<WaitlistEntry, WaitlistData>({
      query: (data) => ({
        url: 'waitlist/join',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<WaitlistEntry>) => response.data!,
    }),
  }),
});

export const { useJoinWaitlistMutation } = waitlistApi;
