import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { InvestorData, InvestorResponse, ApiResponse } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:5001/v1/';

export const investorApi = createApi({
  reducerPath: 'investorApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
  }),
  endpoints: (builder) => ({
    // Submit investor interest form
    submitInvestorInterest: builder.mutation<InvestorResponse, InvestorData>({
      query: (data) => ({
        url: 'investors',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<InvestorResponse>) => response.data!,
    }),
  }),
});

export const {
  useSubmitInvestorInterestMutation,
} = investorApi;

