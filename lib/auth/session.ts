import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://revure-api.beige.app/v1/';
let pendingRefresh: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (!pendingRefresh) {
    pendingRefresh = axios.post<{ token?: string }>(API_BASE_URL.replace(/\/$/, '') + '/auth/refresh', {}, { withCredentials: true })
      .then(({ data }) => {
        if (!data?.token) return null;
        Cookies.set('revure_token', data.token, { expires: 1, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
        return data.token;
      })
      .catch(() => null)
      .finally(() => { pendingRefresh = null; });
  }
  return pendingRefresh;
}

export function clearAccessSession() {
  Cookies.remove('revure_token');
  Cookies.remove('revure_user');
}

export async function logoutSession(accessToken?: string) {
  const token = accessToken || Cookies.get('revure_token');
  try {
    await axios.post(API_BASE_URL.replace(/\/$/, '') + '/auth/logout', {}, {
      withCredentials: true,
      timeout: 10000,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  } catch (error) {
    // An already-invalid session can be cleared locally. Preserve credentials on
    // network/server failures so the user can retry revoking their session.
    if (!axios.isAxiosError(error) || error.response?.status !== 401) throw error;
  }
  clearAccessSession();
}
