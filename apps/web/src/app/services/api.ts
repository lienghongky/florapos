/**
 * Central HTTP client for all API communication.
 * All service modules import `request()` from here.
 */
export const API_URL = '/api';

interface RequestOptions extends RequestInit {
    token?: string;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers = new Headers(options.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    const isFormData = fetchOptions.body instanceof FormData;

    if (!headers.has('Content-Type') && !isFormData) {
        headers.set('Content-Type', 'application/json');
    }

    const config: RequestInit = {
        ...fetchOptions,
        headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);

    // Handle 401 Unauthorized globally if needed in future (e.g. redirect to login)
    // For now, we just pass it through or throw

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.statusText}`);
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
}
