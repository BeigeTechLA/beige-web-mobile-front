import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:5001/v1/';

interface ApiError {
  error: boolean;
  message: string;
  details?: unknown;
}

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
        if (token && config.headers) {
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

          // Handle specific status codes
          switch (status) {
            case 401:
              // Unauthorized - clear token and redirect to login
              Cookies.remove('revure_token');
              Cookies.remove('revure_user');
              if (typeof window !== 'undefined') {
                console.error('Unauthorized: Token expired or invalid');
              }
              break;
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

          return Promise.reject({
            status,
            message: data?.message || 'An error occurred',
            details: data?.details,
          });
        } else if (error.request) {
          console.error('Network error: No response received');
          return Promise.reject({
            status: 0,
            message: 'Network error: Unable to reach server',
          });
        } else {
          console.error('Request error:', error.message);
          return Promise.reject({
            status: 0,
            message: error.message,
          });
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
