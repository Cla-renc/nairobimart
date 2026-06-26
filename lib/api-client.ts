/**
 * API Client Utility
 * 
 * Automatically routes API calls to the correct backend:
 * - Development: http://localhost:3000/api
 * - Vercel Frontend: https://nairobimart-api.onrender.com/api
 * - Render Backend: http://localhost:3000/api (internal)
 */

export const getApiUrl = (): string => {
  // Prefer explicit render backend URL for both client and server.
  // Set NEXT_PUBLIC_API_URL in Vercel to your Render backend base URL.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    return apiUrl.replace(/\/$/, '');
  }

  // Fall back to frontend base URL for local dev or if backend URL is not configured.
  return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
};

/**
 * Fetch wrapper that automatically adds the API base URL
 * 
 * Usage:
 * const response = await apiFetch('/products');
 * const json = await response.json();
 */
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  // Ensure credentials are sent with requests (for cookies/auth)
  const config: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  return fetch(url, config);
};

/**
 * Convenience method for common API calls
 * 
 * Usage:
 * const data = await apiCall('/products', 'GET');
 * const result = await apiCall('/checkout', 'POST', { items: [...] });
 */
export const apiCall = async <T = unknown>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  body?: unknown
): Promise<T> => {
  const response = await apiFetch(endpoint, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({ message: response.statusText }))) as {
      message?: string;
    };
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json() as Promise<T>;
};
