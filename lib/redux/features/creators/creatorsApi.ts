import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Creator,
  CreatorProfile,
  CreatorSearchParams,
  PortfolioItem,
  Review,
  PaginatedResponse,
  ApiResponse,
  RawCreator
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
    getRandomCreators: builder.query<Creator[], { limit?: number }>({
      query: ({ limit = 10 }) => ({
        url: 'creators/random',
        params: { limit },
      }),
      transformResponse: (response: ApiResponse<Creator[]>) => response.data!,
      providesTags: ['Creator'],
    }),
    getRandomCrew: builder.query<Creator[], void>({
      query: () => ({
        url: 'creator/get-random-crew',
      }),
      transformResponse: (response: ApiResponse<RawCreator[]>) => {
        const rawCreators = response.data || [];
        const S3_BASE_URL =  process.env.NEXT_PUBLIC_S3_PREFIX || "https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/";;

        return rawCreators.map((raw) => {
          let profileImage = "";
          if (raw.crew_member_files && raw.crew_member_files.length > 0) {
            const photoFile = raw.crew_member_files.find(f => f.file_type === 'profile_photo');
            if (photoFile) {
              if (photoFile.file_path.startsWith('http')) {
                profileImage = photoFile.file_path;
              } else {
                profileImage = `${S3_BASE_URL}${photoFile.file_path}`;
              }
            }
          }

          let roleId = 0;
          try {
            if (raw.primary_role) {
              const parsed = JSON.parse(raw.primary_role);
              if (Array.isArray(parsed) && parsed.length > 0) {
                roleId = parseInt(parsed[0]);
              }
            }
          } catch (e) {
            // ignore
          }

          return {
            crew_member_id: raw.crew_member_id,
            name: `${raw.first_name} ${raw.last_name}`,
            email: raw.email,
            phone: raw.phone_number,
            profile_image: profileImage,
            profile_photo: profileImage, // Map to both just in case
            role_id: roleId,
            role_name: "Creative Professional", // Default since we don't have map
            hourly_rate: parseFloat(raw.hourly_rate || "0"),
            rating: raw.rating || 0,
            total_reviews: 0,
            bio: raw.bio || "",
            location: raw.location,
            experience_years: raw.years_of_experience,
            skills: raw.skills || [],
            is_available: raw.is_available === 1,
          } as Creator;
        });
      },
      providesTags: ['Creator'],
    }),
  }),
});

export const {
  useSearchCreatorsQuery,
  useGetCreatorProfileQuery,
  useGetCreatorPortfolioQuery,
  useGetCreatorReviewsQuery,
  useGetRandomCreatorsQuery,
  useGetRandomCrewQuery,
} = creatorsApi;
