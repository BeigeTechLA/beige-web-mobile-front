import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Creator,
  CreatorProfile,
  CreatorSearchParams,
  PortfolioItem,
  Review,
  PaginatedResponse,
  ApiResponse
} from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:5001/v1/';

export const creatorsApi = createApi({
  reducerPath: 'creatorsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
  }),
  tagTypes: ['Creator'],
  endpoints: (builder) => ({
    searchCreators: builder.query<PaginatedResponse<Creator>, CreatorSearchParams>({
      query: (params) => ({
        url: 'creators/search',
        params,
      }),
      transformResponse: (response: ApiResponse<PaginatedResponse<Creator>>) => response.data!,
      providesTags: ['Creator'],
    }),
    getCreatorProfile: builder.query<CreatorProfile, number>({
      query: (id) => `creators/${id}`,
      transformResponse: (response: ApiResponse<CreatorProfile>) => response.data!,
      providesTags: (result, error, id) => [{ type: 'Creator', id }],
    }),
    getCreatorPortfolio: builder.query<PaginatedResponse<PortfolioItem>, { id: number; page?: number; limit?: number }>({
      query: ({ id, page = 1, limit = 12 }) => ({
        url: `creators/${id}/portfolio`,
        params: { page, limit },
      }),
      transformResponse: (response: ApiResponse<PaginatedResponse<PortfolioItem>>) => response.data!,
    }),
    getCreatorReviews: builder.query<PaginatedResponse<Review>, { id: number; page?: number; limit?: number }>({
      query: ({ id, page = 1, limit = 10 }) => ({
        url: `creators/${id}/reviews`,
        params: { page, limit },
      }),
      transformResponse: (response: ApiResponse<PaginatedResponse<Review>>) => response.data!,
    }),
  }),
});

export const {
  useSearchCreatorsQuery,
  useGetCreatorProfileQuery,
  useGetCreatorPortfolioQuery,
  useGetCreatorReviewsQuery,
} = creatorsApi;
