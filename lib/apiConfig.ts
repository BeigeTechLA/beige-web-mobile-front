/**
 * Centralized API Configuration
 * 
 * This file provides a single source of truth for API endpoints.
 * Use this instead of hardcoding URLs in components.
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_API_ENDPOINT: The base API URL (e.g., http://localhost:5001/v1/)
 * 
 * For production, set NEXT_PUBLIC_API_ENDPOINT to your production API URL
 */

// Get API base URL from environment variables
// Falls back to localhost for development
const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:5001/v1/';
  }
  return process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:5001/v1/';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Helper function to build full API URLs
 * @param endpoint - The API endpoint (e.g., 'admin/get-crew-for-lead/')
 * @returns Full URL with the endpoint appended to base URL
 */
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

export default API_BASE_URL;
