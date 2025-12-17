import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import type {
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  QuickRegisterData,
  ApiResponse
} from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:5001/v1/';

export const authApi = createApi({
  reducerPath: 'authApi',
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
  endpoints: (builder) => ({
    login: builder.mutation<AuthTokens, LoginCredentials>({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: ApiResponse<AuthTokens>) => response.data!,
    }),
    register: builder.mutation<AuthTokens, RegisterData>({
      query: (data) => ({
        url: 'auth/register',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<AuthTokens>) => response.data!,
    }),
    quickRegister: builder.mutation<AuthTokens, QuickRegisterData>({
      query: (data) => ({
        url: 'auth/quick-register',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<AuthTokens>) => response.data!,
    }),
    getCurrentUser: builder.query<User, void>({
      query: () => 'auth/me',
      transformResponse: (response: ApiResponse<User>) => response.data!,
    }),
    getPermissions: builder.query<string[], string>({
      query: (role) => `auth/permissions/${role}`,
      transformResponse: (response: ApiResponse<string[]>) => response.data!,
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useQuickRegisterMutation,
  useGetCurrentUserQuery,
  useGetPermissionsQuery,
} = authApi;
