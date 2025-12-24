import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { setCredentials, logout as logoutAction } from '../redux/features/auth/authSlice';
import {
  useLoginMutation,
  useRegisterMutation,
  useQuickRegisterMutation,
  useSendOTPMutation,
  useResendOTPMutation,
  useVerifyEmailMutation,
  useGetCurrentUserQuery,
  useRegisterCreatorStep1Mutation,
  useRegisterCreatorStep2Mutation,
  useRegisterCreatorStep3Mutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from '../redux/features/auth/authApi';
import type { 
  LoginCredentials, 
  RegisterData, 
  QuickRegisterData,
  VerifyEmailData,
  CreatorRegistrationStep2Data,
} from '../types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  const [loginMutation, { isLoading: isLoginLoading, error: loginError }] = useLoginMutation();
  const [registerMutation, { isLoading: isRegisterLoading, error: registerError }] = useRegisterMutation();
  const [quickRegisterMutation, { isLoading: isQuickRegisterLoading }] = useQuickRegisterMutation();
  const [sendOTPMutation, { isLoading: isSendOTPLoading }] = useSendOTPMutation();
  const [resendOTPMutation, { isLoading: isResendOTPLoading }] = useResendOTPMutation();
  const [verifyEmailMutation, { isLoading: isVerifyEmailLoading }] = useVerifyEmailMutation();
  const [forgotPasswordMutation, { isLoading: isForgotPasswordLoading }] = useForgotPasswordMutation();
  const [resetPasswordMutation, { isLoading: isResetPasswordLoading }] = useResetPasswordMutation();
  const [registerCreatorStep1Mutation, { isLoading: isStep1Loading }] = useRegisterCreatorStep1Mutation();
  const [registerCreatorStep2Mutation, { isLoading: isStep2Loading }] = useRegisterCreatorStep2Mutation();
  const [registerCreatorStep3Mutation, { isLoading: isStep3Loading }] = useRegisterCreatorStep3Mutation();

  // Only fetch current user if we have a token and no user data
  const { data: currentUserData, refetch: refetchUser } = useGetCurrentUserQuery(undefined, {
    skip: !token || !!user,
  });

  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await loginMutation(credentials).unwrap();
    // Backend returns { message, token, user }
    dispatch(setCredentials({ user: result.user, token: result.token }));
    return result;
  }, [loginMutation, dispatch]);

  const register = useCallback(async (data: RegisterData) => {
    const result = await registerMutation(data).unwrap();
    // Backend returns { message, userId, verificationCode }
    // User needs to verify email before being logged in
    return result;
  }, [registerMutation]);

  const quickRegister = useCallback(async (data: QuickRegisterData) => {
    const result = await quickRegisterMutation(data).unwrap();
    dispatch(setCredentials({ user: result.user, token: result.token }));
    return result;
  }, [quickRegisterMutation, dispatch]);

  const sendOTP = useCallback(async (email: string) => {
    const result = await sendOTPMutation({ email }).unwrap();
    return result;
  }, [sendOTPMutation]);

  const resendOTP = useCallback(async (email: string) => {
    const result = await resendOTPMutation({ email }).unwrap();
    return result;
  }, [resendOTPMutation]);

  const verifyEmail = useCallback(async (data: VerifyEmailData) => {
    const result = await verifyEmailMutation(data).unwrap();
    // If verification returns a token, automatically log in the user
    if (result.token && result.user) {
      dispatch(setCredentials({ user: result.user, token: result.token }));
    }
    return result;
  }, [verifyEmailMutation, dispatch]);

  const forgotPassword = useCallback(async (email: string) => {
    const result = await forgotPasswordMutation({ email }).unwrap();
    return result;
  }, [forgotPasswordMutation]);

  const resetPassword = useCallback(async (resetToken: string, newPassword: string, confirmPassword: string) => {
    const result = await resetPasswordMutation({ resetToken, newPassword, confirmPassword }).unwrap();
    return result;
  }, [resetPasswordMutation]);

  // Creator registration steps
  const registerCreatorStep1 = useCallback(async (formData: FormData) => {
    const result = await registerCreatorStep1Mutation(formData).unwrap();
    return result;
  }, [registerCreatorStep1Mutation]);

  const registerCreatorStep2 = useCallback(async (data: CreatorRegistrationStep2Data) => {
    const result = await registerCreatorStep2Mutation(data).unwrap();
    return result;
  }, [registerCreatorStep2Mutation]);

  const registerCreatorStep3 = useCallback(async (formData: FormData) => {
    const result = await registerCreatorStep3Mutation(formData).unwrap();
    return result;
  }, [registerCreatorStep3Mutation]);

  const logout = useCallback(() => {
    dispatch(logoutAction());
    router.push('/');
  }, [dispatch, router]);

  const getCurrentUser = useCallback(async () => {
    if (!token) {
      throw new Error('No authentication token found');
    }
    return refetchUser();
  }, [token, refetchUser]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading: isLoading || isLoginLoading || isRegisterLoading || isQuickRegisterLoading,
    isLoginLoading,
    isRegisterLoading,
    isSendOTPLoading,
    isResendOTPLoading,
    isVerifyEmailLoading,
    isForgotPasswordLoading,
    isResetPasswordLoading,
    isCreatorRegistrationLoading: isStep1Loading || isStep2Loading || isStep3Loading,
    loginError,
    registerError,
    login,
    register,
    quickRegister,
    sendOTP,
    resendOTP,
    verifyEmail,
    forgotPassword,
    resetPassword,
    registerCreatorStep1,
    registerCreatorStep2,
    registerCreatorStep3,
    logout,
    getCurrentUser,
    currentUserData,
  };
};
