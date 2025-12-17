import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { setCredentials, logout as logoutAction } from '../redux/features/auth/authSlice';
import {
  useLoginMutation,
  useRegisterMutation,
  useQuickRegisterMutation,
  useGetCurrentUserQuery
} from '../redux/features/auth/authApi';
import type { LoginCredentials, RegisterData, QuickRegisterData } from '../types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation();
  const [registerMutation, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [quickRegisterMutation, { isLoading: isQuickRegisterLoading }] = useQuickRegisterMutation();

  // Only fetch current user if we have a token and no user data
  const { data: currentUserData, refetch: refetchUser } = useGetCurrentUserQuery(undefined, {
    skip: !token || !!user,
  });

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const result = await loginMutation(credentials).unwrap();
      dispatch(setCredentials(result));
      return result;
    } catch (error) {
      throw error;
    }
  }, [loginMutation, dispatch]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const result = await registerMutation(data).unwrap();
      dispatch(setCredentials(result));
      return result;
    } catch (error) {
      throw error;
    }
  }, [registerMutation, dispatch]);

  const quickRegister = useCallback(async (data: QuickRegisterData) => {
    try {
      const result = await quickRegisterMutation(data).unwrap();
      dispatch(setCredentials(result));
      return result;
    } catch (error) {
      throw error;
    }
  }, [quickRegisterMutation, dispatch]);

  const logout = useCallback(() => {
    dispatch(logoutAction());
  }, [dispatch]);

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
    login,
    register,
    quickRegister,
    logout,
    getCurrentUser,
    currentUserData,
  };
};
