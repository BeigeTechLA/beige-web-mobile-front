import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import { clearAccessSession, refreshAccessToken } from '@/lib/auth/session';

export function createBaseQueryWithReauth(baseUrl: string) {
  const baseQuery = fetchBaseQuery({
    baseUrl,
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = Cookies.get('revure_token');
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  });

  return async (args: Parameters<typeof baseQuery>[0], api: Parameters<typeof baseQuery>[1], extraOptions: Parameters<typeof baseQuery>[2]) => {
    const result = await baseQuery(args, api, extraOptions);
    const url = typeof args === 'string' ? args : String(args.url || '');
    if (result.error?.status === 401 && !url.toLowerCase().includes('auth/refresh')) {
      const token = await refreshAccessToken();
      if (token) return baseQuery(args, api, extraOptions);
      clearAccessSession();
    }
    return result;
  };
}
