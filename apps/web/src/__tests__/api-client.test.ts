/**
 * Integration tests for the unified API client
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiClient, createApiClient } from '@/lib/api-client';
import { ApiError, AuthError, NetworkError } from '@/lib/api-errors';
import { configureApiLogger, getLogEntries, clearLogs } from '@/lib/api-logger';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearLogs();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Requests', () => {
    it('should make a successful GET request', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve(mockResponse),
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      });

      const response = await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Headers),
        })
      );
      expect(response.data).toEqual(mockResponse);
      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
    });

    it('should make a POST request with data', async () => {
      const postData = { name: 'Test' };
      const mockResponse = { id: 1, ...postData };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers(),
        json: () => Promise.resolve(mockResponse),
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      });

      const response = await apiClient.post('/test', postData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
          headers: expect.any(Headers),
        })
      );
      expect(response.data).toEqual(mockResponse);
    });

    it('should handle API errors correctly', async () => {
      const errorResponse = { message: 'Not found', code: 'NOT_FOUND' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers(),
        json: () => Promise.resolve(errorResponse),
        text: () => Promise.resolve(JSON.stringify(errorResponse)),
      });

      await expect(apiClient.get('/not-found')).rejects.toThrow(ApiError);
    });

    it('should retry failed requests', async () => {
      // First two calls fail, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers(),
          json: () => Promise.resolve({ message: 'Server error' }),
          text: () => Promise.resolve('{"message": "Server error"}'),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers(),
          json: () => Promise.resolve({ message: 'Server error' }),
          text: () => Promise.resolve('{"message": "Server error"}'),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: () => Promise.resolve({ data: 'success' }),
          text: () => Promise.resolve('{"data": "success"}'),
        });

      const response = await apiClient.get('/test', { retries: 2 });

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(response.data).toEqual({ data: 'success' });
    });
  });

  describe('Authentication', () => {
    it('should include auth token when available', async () => {
      const token = 'test-token';
      localStorageMock.getItem.mockReturnValue(token);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ data: 'test' }),
        text: () => Promise.resolve('{"data": "test"}'),
      });

      await apiClient.get('/protected');

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers;
      expect(headers.get('Authorization')).toBe(`Bearer ${token}`);
    });

    it('should skip auth when requested', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ data: 'test' }),
        text: () => Promise.resolve('{"data": "test"}'),
      });

      await apiClient.get('/public', { skipAuth: true });

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers;
      expect(headers.get('Authorization')).toBeNull();
    });

    it('should handle expired tokens', async () => {
      const expiredToken = 'expired-token';
      const newToken = 'new-token';

      // Mock expired token
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'access_token') return expiredToken;
        if (key === 'refresh_token') return 'refresh-token';
        return null;
      });

      // First call fails with 401, then succeeds after refresh
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          headers: new Headers(),
          json: () => Promise.resolve({ message: 'Token expired' }),
          text: () => Promise.resolve('{"message": "Token expired"}'),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: () => Promise.resolve({ access_token: newToken }),
          text: () => Promise.resolve(`{"access_token": "${newToken}"}`),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: () => Promise.resolve({ data: 'success' }),
          text: () => Promise.resolve('{"data": "success"}'),
        });

      const response = await apiClient.get('/protected');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'access_token',
        newToken
      );
      expect(response.data).toEqual({ data: 'success' });
    });
  });

  describe('Interceptors', () => {
    it('should apply request interceptors', async () => {
      const requestInterceptor = vi.fn((config) => ({
        ...config,
        headers: { ...config.headers, 'X-Custom': 'test' },
      }));

      apiClient.interceptors.addRequest(requestInterceptor);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ data: 'test' }),
        text: () => Promise.resolve('{"data": "test"}'),
      });

      await apiClient.get('/test');

      expect(requestInterceptor).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].headers.get('X-Custom')).toBe('test');

      apiClient.interceptors.removeRequest(0);
    });

    it('should apply response interceptors', async () => {
      const responseInterceptor = vi.fn((response) => ({
        ...response,
        data: { ...response.data, intercepted: true },
      }));

      apiClient.interceptors.addResponse(responseInterceptor);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ data: 'test' }),
        text: () => Promise.resolve('{"data": "test"}'),
      });

      const response = await apiClient.get('/test');

      expect(responseInterceptor).toHaveBeenCalled();
      expect(response.data).toEqual({ data: 'test', intercepted: true });

      apiClient.interceptors.removeResponse(0);
    });

    it('should apply error interceptors', async () => {
      const errorInterceptor = vi.fn((error) => {
        error.message = 'Intercepted: ' + error.message;
        return error;
      });

      apiClient.interceptors.addError(errorInterceptor);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers(),
        json: () => Promise.resolve({ message: 'Server error' }),
        text: () => Promise.resolve('{"message": "Server error"}'),
      });

      await expect(apiClient.get('/error')).rejects.toThrow(
        'Intercepted: Server error'
      );
      expect(errorInterceptor).toHaveBeenCalled();

      apiClient.interceptors.removeError(0);
    });
  });

  describe('File Upload', () => {
    it('should upload files correctly', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const mockResponse = {
        id: 'file-id',
        url: 'https://example.com/file.txt',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve(mockResponse),
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      });

      const response = await apiClient.upload('/upload', file);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/upload'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
      expect(response.data).toEqual(mockResponse);
    });
  });

  describe('Configuration', () => {
    it('should allow configuration changes', () => {
      const customClient = createApiClient('https://api.example.com', 10000);

      expect(customClient.config.getBaseUrl()).toBe('https://api.example.com');
      expect(customClient.config.getDefaultTimeout()).toBe(10000);

      customClient.config.setBaseUrl('https://new-api.example.com');
      customClient.config.setDefaultTimeout(20000);

      expect(customClient.config.getBaseUrl()).toBe(
        'https://new-api.example.com'
      );
      expect(customClient.config.getDefaultTimeout()).toBe(20000);
    });
  });

  describe('Health Check', () => {
    it('should return true for healthy API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ status: 'healthy' }),
        text: () => Promise.resolve('{"status": "healthy"}'),
      });

      const isHealthy = await apiClient.healthCheck();

      expect(isHealthy).toBe(true);
    });

    it('should return false for unhealthy API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: new Headers(),
        json: () => Promise.resolve({ status: 'unhealthy' }),
        text: () => Promise.resolve('{"status": "unhealthy"}'),
      });

      const isHealthy = await apiClient.healthCheck();

      expect(isHealthy).toBe(false);
    });
  });
});

describe('API Error Handling', () => {
  it('should create appropriate error types', () => {
    const authError = new AuthError('Authentication failed');
    expect(authError.name).toBe('AuthError');
    expect(authError.statusCode).toBe(401);

    const networkError = new NetworkError('Network error');
    expect(networkError.name).toBe('NetworkError');
    expect(networkError.code).toBe('NETWORK_ERROR');
  });

  it('should create errors from HTTP responses', () => {
    const response = new Response('Not found', { status: 404 });
    const error = ApiError.fromResponse(response, '{"message": "Not found"}');

    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Not found');
  });
});

describe('API Logging', () => {
  beforeEach(() => {
    configureApiLogger({
      enabled: true,
      level: 'debug',
      logToConsole: false,
      logToStorage: false,
    });
  });

  it('should log requests and responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'x-request-id': 'test-123' }),
      json: () => Promise.resolve({ data: 'test' }),
      text: () => Promise.resolve('{"data": "test"}'),
    });

    await apiClient.get('/test');

    const logs = getLogEntries();
    expect(logs).toHaveLength(2); // Request + Response
    expect(logs[0].type).toBe('request');
    expect(logs[1].type).toBe('response');
  });

  it('should log errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers(),
      json: () => Promise.resolve({ message: 'Server error' }),
      text: () => Promise.resolve('{"message": "Server error"}'),
    });

    try {
      await apiClient.get('/error');
    } catch {
      // Expected to throw
    }

    const logs = getLogEntries();
    expect(logs.some((log) => log.type === 'error')).toBe(true);
  });
});

describe('Integration with Auth Store', () => {
  it('should handle auth logout events', async () => {
    let eventFired = false;
    const eventHandler = () => {
      eventFired = true;
    };
    window.addEventListener('auth:logout', eventHandler);

    // Mock a 401 response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers(),
      json: () => Promise.resolve({ message: 'Unauthorized' }),
      text: () => Promise.resolve('{"message": "Unauthorized"}'),
    });

    try {
      await apiClient.get('/protected');
    } catch {
      // Expected to throw
    }

    // Wait a bit for the event to be dispatched
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(eventFired).toBe(true);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');

    window.removeEventListener('auth:logout', eventHandler);
  });
});
