export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3400/api/v1';

/** Error thrown for non-2xx responses. Carries the HTTP status so callers can
 *  distinguish auth failures (401) from other errors. */
export class ApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`API Error ${status}: ${body}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Read token from localStorage and attach it for authenticated requests
  const token = typeof window !== 'undefined' ? localStorage.getItem('cse_auth_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorBody = await response.text();
    throw new ApiError(response.status, errorBody);
  }
  
  return response.json() as Promise<T>;
}
