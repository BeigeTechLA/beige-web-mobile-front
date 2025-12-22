import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import type {
  User,
  LoginCredentials,
  LoginResponse,
  RegisterData,
  RegisterResponse,
  QuickRegisterData,
  VerifyEmailData,
  CreatorRegistrationStep1Data,
  CreatorRegistrationStep1Response,
  CreatorRegistrationStep2Data,
  CreatorRegistrationStep3Data,
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
    // Login with email and password
    login: builder.mutation<LoginResponse, LoginCredentials>({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
      // Backend returns { message, token, user } directly
      transformResponse: (response: LoginResponse) => response,
    }),

    // Register new user (client or creator)
    register: builder.mutation<RegisterResponse, RegisterData>({
      query: (data) => ({
        url: 'auth/register',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: RegisterResponse) => response,
    }),

    // Quick registration during booking flow
    quickRegister: builder.mutation<LoginResponse, QuickRegisterData>({
      query: (data) => ({
        url: 'auth/quick-register',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: LoginResponse) => response,
    }),

    // Verify email with verification code
    verifyEmail: builder.mutation<{ message: string }, VerifyEmailData>({
      query: (data) => ({
        url: 'auth/verify-email',
        method: 'POST',
        body: data,
      }),
    }),

    // Get current user info (protected route)
    getCurrentUser: builder.query<User, void>({
      query: () => 'auth/me',
      transformResponse: (response: { success: boolean; user: User }) => response.user,
    }),

    // Get permissions for a specific role
    getPermissions: builder.query<string[], string>({
      query: (role) => `auth/permissions/${role}`,
      transformResponse: (response: { success: boolean; permissions: string[] }) => response.permissions,
    }),

    // Forgot password - request reset token
    forgotPassword: builder.mutation<{ message: string; resetToken: string }, { email: string }>({
      query: (data) => ({
        url: 'auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),

    // Reset password with token
    resetPassword: builder.mutation<{ message: string }, { resetToken: string; newPassword: string; confirmPassword: string }>({
      query: (data) => ({
        url: 'auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),

    // Change password (authenticated)
    changePassword: builder.mutation<{ message: string }, { oldPassword: string; newPassword: string; confirmPassword: string; userId: number }>({
      query: (data) => ({
        url: 'auth/change-password',
        method: 'POST',
        body: data,
      }),
    }),

    // Creator registration - Step 1: Basic info
    registerCreatorStep1: builder.mutation<CreatorRegistrationStep1Response, FormData>({
      query: (formData) => ({
        url: 'auth/register-crew-step1',
        method: 'POST',
        body: formData,
      }),
    }),

    // Creator registration - Step 2: Professional details
    registerCreatorStep2: builder.mutation<{ message: string; crew_member: unknown }, CreatorRegistrationStep2Data>({
      query: (data) => ({
        url: 'auth/register-crew-step2',
        method: 'POST',
        body: data,
      }),
    }),

    // Creator registration - Step 3: Portfolio and availability
    registerCreatorStep3: builder.mutation<{ message: string; crew_member: unknown }, FormData>({
      query: (formData) => ({
        url: 'auth/register-crew-step3',
        method: 'POST',
        body: formData,
      }),
    }),

    // Get crew member details by ID
    getCrewMemberDetails: builder.query<{ step1: unknown; step2: unknown; step3: unknown }, number>({
      query: (crewMemberId) => `auth/crew-member/${crewMemberId}`,
      transformResponse: (response: { error: boolean; data: { step1: unknown; step2: unknown; step3: unknown } }) => response.data,
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useQuickRegisterMutation,
  useVerifyEmailMutation,
  useGetCurrentUserQuery,
  useGetPermissionsQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useRegisterCreatorStep1Mutation,
  useRegisterCreatorStep2Mutation,
  useRegisterCreatorStep3Mutation,
  useGetCrewMemberDetailsQuery,
} = authApi;
