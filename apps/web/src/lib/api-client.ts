/**
 * Unified API Client with centralized baseUrl configuration
 * Object-based approach for better compatibility with functional patterns
 */

import { ApiError, createApiError, AuthError } from './api-errors';

// Single source of truth for API base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Default request timeout in milliseconds
export const DEFAULT_TIMEOUT = 30000;

// Request configuration interface
export interface ApiRequestConfig extends RequestInit {
  timeout?: number;
  skipAuth?: boolean;
  retries?: number;
  skipRefresh?: boolean; // Skip token refresh for this request
}

// Response interface for type safety
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
  ok: boolean;
}

// Request interceptor interface
export interface RequestInterceptor {
  (config: ApiRequestConfig): ApiRequestConfig | Promise<ApiRequestConfig>;
}

// Response interceptor interface
export interface ResponseInterceptor<T = any> {
  (response: ApiResponse<T>): ApiResponse<T> | Promise<ApiResponse<T>>;
}

// Error interceptor interface
export interface ErrorInterceptor {
  (error: Error): Error | Promise<Error>;
}

// Internal state for the API client
let apiClientState = {
  baseUrl: API_BASE_URL.replace(/\/$/, ''), // Remove trailing slash
  defaultTimeout: DEFAULT_TIMEOUT,
  requestInterceptors: [] as RequestInterceptor[],
  responseInterceptors: [] as ResponseInterceptor[],
  errorInterceptors: [] as ErrorInterceptor[],
  isRefreshing: false,
  refreshPromise: null as Promise<string> | null,
};

/**
 * Get authentication token from storage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

/**
 * Set authentication token to storage
 */
function setAuthToken(token: string): void {
  localStorage.setItem('access_token', token);
}

/**
 * Remove authentication token from storage
 */
function removeAuthToken(): void {
  localStorage.removeItem('access_token');
}

/**
 * Check if token is expired
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    if (!decoded.exp) return true;
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Refresh authentication token
 */
async function refreshToken(): Promise<string> {
  if (apiClientState.isRefreshing && apiClientState.refreshPromise) {
    return apiClientState.refreshPromise;
  }

  apiClientState.isRefreshing = true;
  apiClientState.refreshPromise = performTokenRefresh();

  try {
    const newToken = await apiClientState.refreshPromise;
    return newToken;
  } finally {
    apiClientState.isRefreshing = false;
    apiClientState.refreshPromise = null;
  }
}

/**
 * Perform actual token refresh
 */
async function performTokenRefresh(): Promise<string> {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    throw new AuthError('No refresh token available');
  }

  try {
    const response = await fetch(`${apiClientState.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new AuthError('Failed to refresh token');
    }

    const data = await response.json();
    const newToken = data.access_token;
    
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    
    setAuthToken(newToken);
    return newToken;
  } catch (error) {
    // If refresh fails, clear tokens and redirect to login
    removeAuthToken();
    localStorage.removeItem('refresh_token');
    
    // Dispatch event for global auth state handling
    window.dispatchEvent(new CustomEvent('auth:logout'));
    
    throw new AuthError('Token refresh failed');
  }
}

/**
 * Create request headers with authentication
 */
async function createHeaders(config: ApiRequestConfig): Promise<HeadersInit> {
  const headers = new Headers(config.headers);

  // Set default content type if not present and there's a body
  if (config.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Add authentication header if not skipped
  if (!config.skipAuth) {
    let token = getAuthToken();
    
    // If token is expired and refresh is not skipped, try to refresh
    if (token && isTokenExpired(token) && !config.skipRefresh) {
      try {
        token = await refreshToken();
      } catch {
        // If refresh fails, continue without token (will result in 401)
        token = null;
      }
    }
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return headers;
}

/**
 * Create abort controller with timeout
 */
function createAbortController(timeout?: number): AbortController {
  const controller = new AbortController();
  const timeoutMs = timeout || apiClientState.defaultTimeout;
  
  setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return controller;
}

/**
 * Apply request interceptors
 */
async function applyRequestInterceptors(config: ApiRequestConfig): Promise<ApiRequestConfig> {
  let processedConfig = { ...config };
  
  for (const interceptor of apiClientState.requestInterceptors) {
    processedConfig = await interceptor(processedConfig);
  }
  
  return processedConfig;
}

/**
 * Apply response interceptors
 */
async function applyResponseInterceptors<T>(response: ApiResponse<T>): Promise<ApiResponse<T>> {
  let processedResponse = { ...response };
  
  for (const interceptor of apiClientState.responseInterceptors) {
    processedResponse = await interceptor(processedResponse);
  }
  
  return processedResponse;
}

/**
 * Apply error interceptors
 */
async function applyErrorInterceptors(error: Error): Promise<Error> {
  let processedError = error;
  
  for (const interceptor of apiClientState.errorInterceptors) {
    try {
      processedError = await interceptor(processedError);
    } catch (interceptorError) {
      // If interceptor throws, use original error
      console.error('Error interceptor failed:', interceptorError);
    }
  }
  
  return processedError;
}

/**
 * Handle fetch response and errors
 */
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let data: T;
  let responseText: string;

  try {
    responseText = await response.text();
    
    // Handle empty responses
    if (!responseText) {
      data = null as T;
    } else {
      // Try to parse as JSON
      data = JSON.parse(responseText);
    }
  } catch (error) {
    throw new ApiError(
      'Invalid JSON response from server',
      'INVALID_RESPONSE',
      response.status
    );
  }

  if (!response.ok) {
    throw ApiError.fromResponse(response, responseText);
  }

  const apiResponse: ApiResponse<T> = {
    data,
    status: response.status,
    headers: response.headers,
    ok: response.ok,
  };

  // Apply response interceptors
  return await applyResponseInterceptors(apiResponse);
}

/**
 * Make HTTP request with error handling and authentication
 */
async function request<T = any>(
  endpoint: string,
  config: ApiRequestConfig = {}
): Promise<ApiResponse<T>> {
  const {
    timeout,
    skipAuth = false,
    skipRefresh = false,
    retries = 0,
    ...fetchConfig
  } = config;

  // Apply request interceptors
  const processedConfig = await applyRequestInterceptors({
    ...fetchConfig,
    skipAuth,
    skipRefresh,
  });

  // Construct full URL
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${apiClientState.baseUrl}${endpoint}`;

  // Create headers with authentication
  const headers = await createHeaders(processedConfig);

  // Create abort controller for timeout
  const controller = createAbortController(timeout);

  let lastError: Error;

  // Retry logic
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...processedConfig,
        headers,
        signal: controller.signal,
      });

      return await handleResponse<T>(response);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on abort or client errors (4xx)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 'TIMEOUT');
      }

      if (error instanceof ApiError && error.statusCode && error.statusCode < 500) {
        // Apply error interceptors before throwing
        throw await applyErrorInterceptors(error);
      }

      // If this is last attempt, throw error
      if (attempt === retries) {
        if (error instanceof ApiError) {
          throw await applyErrorInterceptors(error);
        }
        const apiError = new ApiError(
          'Network error occurred',
          'NETWORK_ERROR',
          undefined,
          error
        );
        throw await applyErrorInterceptors(apiError);
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }

  // This should never be reached, but TypeScript needs it
  throw await applyErrorInterceptors(lastError!);
}

/**
 * Convenience methods for HTTP verbs
 */
const apiMethods = {
  get: <T = any>(endpoint: string, config?: ApiRequestConfig) => 
    request<T>(endpoint, { ...config, method: 'GET' }),
    
  post: <T = any>(endpoint: string, data?: any, config?: ApiRequestConfig) => 
    request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  put: <T = any>(endpoint: string, data?: any, config?: ApiRequestConfig) => 
    request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  patch: <T = any>(endpoint: string, data?: any, config?: ApiRequestConfig) => 
    request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: <T = any>(endpoint: string, config?: ApiRequestConfig) => 
    request<T>(endpoint, { ...config, method: 'DELETE' }),

  upload: <T = any>(
    endpoint: string,
    file: File,
    config?: ApiRequestConfig & { onProgress?: (progress: number) => void }
  ) => {
    const formData = new FormData();
    formData.append('file', file);

    // If there's additional data, add it to form data
    if (config?.body) {
      Object.entries(config.body as Record<string, any>).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: formData,
      // Don't set Content-Type header for FormData (browser sets it with boundary)
      headers: Object.fromEntries(
        Object.entries(config?.headers || {}).filter(([key]) => 
          key.toLowerCase() !== 'content-type'
        )
      ),
    });
  },

  healthCheck: () => 
    request<void>('/health', { skipAuth: true, timeout: 5000 })
      .then(() => true)
      .catch(() => false),
};

/**
 * Interceptor management
 */
const interceptorMethods = {
  addRequest: (interceptor: RequestInterceptor): number => 
    apiClientState.requestInterceptors.push(interceptor) - 1,

  removeRequest: (index: number): void => 
    apiClientState.requestInterceptors.splice(index, 1),

  addResponse: <T = any>(interceptor: ResponseInterceptor<T>): number => 
    apiClientState.responseInterceptors.push(interceptor as ResponseInterceptor) - 1,

  removeResponse: (index: number): void => 
    apiClientState.responseInterceptors.splice(index, 1),

  addError: (interceptor: ErrorInterceptor): number => 
    apiClientState.errorInterceptors.push(interceptor) - 1,

  removeError: (index: number): void => 
    apiClientState.errorInterceptors.splice(index, 1),

  clear: (): void => {
    apiClientState.requestInterceptors = [];
    apiClientState.responseInterceptors = [];
    apiClientState.errorInterceptors = [];
  },
};

/**
 * Configuration methods
 */
const configMethods = {
  setBaseUrl: (baseUrl: string): void => {
    apiClientState.baseUrl = baseUrl.replace(/\/$/, '');
  },

  getBaseUrl: (): string => apiClientState.baseUrl,

  setDefaultTimeout: (timeout: number): void => {
    apiClientState.defaultTimeout = timeout;
  },

  getDefaultTimeout: (): number => apiClientState.defaultTimeout,
};

// Add default error interceptor for handling 401 responses
interceptorMethods.addError(async (error: Error) => {
  if (error instanceof ApiError && error.statusCode === 401) {
    // Token is invalid, clear it and dispatch logout event
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }
  return error;
});

// Add default request interceptor for adding request ID
interceptorMethods.addRequest(async (config) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-Request-ID': requestId,
      'X-Client-Version': import.meta.env.VITE_APP_VERSION || '1.0.0',
    },
  };
});

// Export the unified API client object
export const apiClient = {
  ...apiMethods,
  interceptors: interceptorMethods,
  config: configMethods,
  request,
};

// Export a factory function for creating custom instances (useful for testing)
export function createApiClient(baseUrl?: string, timeout?: number) {
  // Create a new state object for this instance
  const customState = {
    baseUrl: (baseUrl || API_BASE_URL).replace(/\/$/, ''),
    defaultTimeout: timeout || DEFAULT_TIMEOUT,
    requestInterceptors: [] as RequestInterceptor[],
    responseInterceptors: [] as ResponseInterceptor[],
    errorInterceptors: [] as ErrorInterceptor[],
    isRefreshing: false,
    refreshPromise: null as Promise<string> | null,
  };

  // Create custom methods that use the custom state
  const customClient = {
    ...apiMethods,
    interceptors: {
      addRequest: (interceptor: RequestInterceptor): number => 
        customState.requestInterceptors.push(interceptor) - 1,

      removeRequest: (index: number): void => 
        customState.requestInterceptors.splice(index, 1),

      addResponse: <T = any>(interceptor: ResponseInterceptor<T>): number => 
        customState.responseInterceptors.push(interceptor as ResponseInterceptor) - 1,

      removeResponse: (index: number): void => 
        customState.responseInterceptors.splice(index, 1),

      addError: (interceptor: ErrorInterceptor): number => 
        customState.errorInterceptors.push(interceptor) - 1,

      removeError: (index: number): void => 
        customState.errorInterceptors.splice(index, 1),

      clear: (): void => {
        customState.requestInterceptors = [];
        customState.responseInterceptors = [];
        customState.errorInterceptors = [];
      },
    },
    config: {
      setBaseUrl: (baseUrl: string): void => {
        customState.baseUrl = baseUrl.replace(/\/$/, '');
      },

      getBaseUrl: (): string => customState.baseUrl,

      setDefaultTimeout: (timeout: number): void => {
        customState.defaultTimeout = timeout;
      },

      getDefaultTimeout: (): number => customState.defaultTimeout,
    },
    request: <T = any>(endpoint: string, config: ApiRequestConfig = {}): Promise<ApiResponse<T>> => {
      // Temporarily replace the global state for this request
      const originalState = apiClientState;
      apiClientState = customState;
      
      try {
        return request<T>(endpoint, config);
      } finally {
        apiClientState = originalState;
      }
    },
  };

  // Add default interceptors to new instances
  customClient.interceptors.addError(async (error: Error) => {
    if (error instanceof ApiError && error.statusCode === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    return error;
  });

  customClient.interceptors.addRequest(async (config) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      ...config,
      headers: {
        ...config.headers,
        'X-Request-ID': requestId,
        'X-Client-Version': import.meta.env.VITE_APP_VERSION || '1.0.0',
      },
    };
  });

  return customClient;
}