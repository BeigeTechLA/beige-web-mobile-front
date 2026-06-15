import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
import { User } from '@/lib/types';
import { normalizePermissionsPayload } from '@/lib/permissions';

interface AuthState {
  user: User | null;
  token: string | null;
  permissions: Record<string, Record<string, boolean>> | null;
  permissionsVersion: number;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  permissions: null,
  permissionsVersion: 0,
  isAuthenticated: false,
  isLoading: true,
};

// Load initial state from cookies
if (typeof window !== 'undefined') {
  const token = Cookies.get('revure_token');
  const userStr = Cookies.get('revure_user');

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      initialState.user = user;
      initialState.token = token;
      initialState.isAuthenticated = true;
      
      const permissionsStr = Cookies.get('revure_permissions');
      if (permissionsStr) {
        initialState.permissions = normalizePermissionsPayload(JSON.parse(permissionsStr));
      }
    } catch (e) {
      console.error('Failed to parse user or permissions from cookie:', e);
      Cookies.remove('revure_token');
      Cookies.remove('revure_user');
      Cookies.remove('revure_permissions');
    }
  }
  initialState.isLoading = false;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.permissions = null;
      state.permissionsVersion = 0;
      state.isAuthenticated = true;
      state.isLoading = false;

      // Store in cookies (expires in 7 days)
      Cookies.set('revure_token', token, { expires: 7 });
      Cookies.set('revure_user', JSON.stringify(user), { expires: 7 });
      Cookies.remove('revure_permissions');
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.permissions = null;
      state.permissionsVersion = 0;
      state.isAuthenticated = false;
      state.isLoading = false;

      // Clear cookies
      Cookies.remove('revure_token');
      Cookies.remove('revure_user');
      Cookies.remove('revure_permissions');
    },
    setPermissions: (state, action: PayloadAction<Record<string, Record<string, boolean>>>) => {
      const normalizedPermissions = normalizePermissionsPayload(action.payload);
      state.permissions = normalizedPermissions;
      state.permissionsVersion += 1;
      Cookies.set('revure_permissions', JSON.stringify(normalizedPermissions), { expires: 7 });
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        Cookies.set('revure_user', JSON.stringify(state.user), { expires: 7 });
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, logout, updateUser, setLoading, setPermissions } = authSlice.actions;
export default authSlice.reducer;
