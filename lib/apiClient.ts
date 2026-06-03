import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:5001/v1/';

interface ApiError {
  error: boolean;
  message: string;
  details?: unknown;
}

type ApiClientError = Error & {
  status?: number;
  details?: unknown;
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add JWT token to headers
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = Cookies.get('revure_token');
        if (token && config.headers && !config.headers.Authorization) {
          // Respect explicitly provided Authorization headers (e.g. external shared-link access tokens).
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors globally
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response) {
          const { status, data } = error.response;
          const isSilentError = error.config?.headers?.["x-silent-error"] === "true";
          // Handle specific status codes
          if (!isSilentError) {
            switch (status) {
              case 401: {
                const requestUrl = String(error.config?.url || '').toLowerCase();
                const isExternalShareRequest = requestUrl.includes('external-file-manager/share/');
                // For shared-link OTP/token endpoints, do not clear the logged-in session cookies.
                if (!isExternalShareRequest) {
                  Cookies.remove('revure_token');
                  Cookies.remove('revure_user');
                }
                if (typeof window !== 'undefined') {
                  console.error('Unauthorized: Token expired or invalid');
                }
                break;
              }
              case 403:
                console.error('Forbidden: Insufficient permissions');
                break;
              case 404:
                console.error('Not found:', data?.message || 'Resource not found');
                break;
              case 500:
                console.error('Server error:', data?.message || 'Internal server error');
                break;
              default:
                console.error('API Error:', data?.message || 'Unknown error');
            }
          }

          const apiError: ApiClientError = new Error(data?.message || 'An error occurred');
          apiError.status = status;
          apiError.details = data?.details;
          return Promise.reject(apiError);
        } else if (error.request) {
          console.error('Network error: No response received');
          const networkError: ApiClientError = new Error('Network error: Unable to reach server');
          networkError.status = 0;
          return Promise.reject(networkError);
        } else {
          console.error('Request error:', error.message);
          const requestError: ApiClientError = new Error(error.message);
          requestError.status = 0;
          return Promise.reject(requestError);
        }
      }
    );
  }

  // GET request
  async get<T>(url: string, params?: Record<string, unknown>) {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  // POST request
  async post<T>(url: string, data?: unknown) {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  // PUT request
  async put<T>(url: string, data?: unknown) {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  // PATCH request
  async patch<T>(url: string, data?: unknown) {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  // DELETE request
  async delete<T>(url: string) {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  // Get the underlying axios instance if needed
  getInstance() {
    return this.client;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
