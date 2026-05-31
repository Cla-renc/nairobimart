/**
 * API Client Utility
 * 
 * Automatically routes API calls to the correct backend:
 * - Development: http://localhost:3000/api
 * - Vercel Frontend: https://nairobimart-api.onrender.com/api
 * - Render Backend: http://localhost:3000/api (internal)
 */

export const getApiUrl = (): string => {
  // In browser, use NEXT_PUBLIC_API_URL if set (points to Render)
  if (typeof window !== 'undefined') {
    const publicUrl = process.env.NEXT_PUBLIC_API_URL;
    if (publicUrl) {
      return publicUrl;
    }
  }
  
  // Server-side, use internal localhost or NEXT_PUBLIC_URL
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
