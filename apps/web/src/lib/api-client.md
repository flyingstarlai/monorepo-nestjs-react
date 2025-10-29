# API Client Documentation

## Overview

The unified API client provides a centralized, object-based approach to making HTTP requests with built-in authentication, error handling, logging, and monitoring capabilities.

## Features

- ✅ **Single Source of Truth**: Centralized baseUrl configuration
- ✅ **Automatic Authentication**: Token management and refresh
- ✅ **Error Handling**: Standardized error classes and handling
- ✅ **Retry Logic**: Automatic retries with exponential backoff
- ✅ **Interceptors**: Request/response/error interceptors
- ✅ **Logging**: Comprehensive request/response logging
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Performance Monitoring**: Built-in metrics collection

## Basic Usage

### Simple Requests

```typescript
import { apiClient } from '@/lib/api-client';

// GET request
const response = await apiClient.get('/users');
console.log(response.data); // Typed response data

// POST request
const newUser = await apiClient.post('/users', { 
  name: 'John Doe', 
  email: 'john@example.com' 
});

// PUT request
const updatedUser = await apiClient.put('/users/1', { 
  name: 'Jane Doe' 
});

// DELETE request
await apiClient.delete('/users/1');
```

### Advanced Configuration

```typescript
import { apiClient } from '@/lib/api-client';

// Request with custom configuration
const response = await apiClient.get('/users', {
  timeout: 10000,        // Custom timeout
  retries: 2,            // Custom retry count
  skipAuth: false,       // Skip authentication
  headers: {             // Custom headers
    'X-Custom-Header': 'value'
  }
});
```

## Authentication

### Automatic Token Management

The API client automatically handles authentication tokens:

```typescript
// Token is automatically included from localStorage
const response = await apiClient.get('/protected-data');

// Skip authentication for public endpoints
const publicData = await apiClient.get('/public-data', { 
  skipAuth: true 
});
```

### Manual Token Refresh

```typescript
import { apiClient } from '@/lib/api-client';

// Skip automatic refresh for this request
const response = await apiClient.get('/data', {
  skipRefresh: true
});
```

## Error Handling

### Standardized Error Classes

```typescript
import { ApiError, AuthError, NetworkError } from '@/lib/api-errors';

try {
  const response = await apiClient.get('/users');
} catch (error) {
  if (error instanceof AuthError) {
    // Handle authentication errors
    console.log('Authentication failed:', error.message);
  } else if (error instanceof NetworkError) {
    // Handle network errors
    console.log('Network error:', error.message);
  } else if (error instanceof ApiError) {
    // Handle general API errors
    console.log(`API Error ${error.statusCode}:`, error.message);
  }
}
```

### Error Information

```typescript
try {
  await apiClient.get('/users');
} catch (error) {
  if (error instanceof ApiError) {
    console.log('Status:', error.statusCode);
    console.log('Code:', error.code);
    console.log('Message:', error.message);
    console.log('Response:', error.response);
  }
}
```

## Interceptors

### Request Interceptors

```typescript
import { apiClient } from '@/lib/api-client';

// Add request interceptor
const interceptorId = apiClient.interceptors.addRequest(async (config) => {
  // Modify request config
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-Custom-Header': 'value',
      'X-Timestamp': Date.now().toString(),
    },
  };
});

// Remove interceptor
apiClient.interceptors.removeRequest(interceptorId);
```

### Response Interceptors

```typescript
// Add response interceptor
const interceptorId = apiClient.interceptors.addResponse(async (response) => {
  // Modify response
  console.log('Response received:', response.status);
  
  return {
    ...response,
    data: {
      ...response.data,
      processedAt: new Date().toISOString(),
    },
  };
});
```

### Error Interceptors

```typescript
// Add error interceptor
const interceptorId = apiClient.interceptors.addError(async (error) => {
  // Handle or modify errors
  if (error instanceof ApiError && error.statusCode === 401) {
    // Redirect to login on auth error
    window.location.href = '/login';
  }
  
  return error;
});
```

## File Uploads

### Simple File Upload

```typescript
import { apiClient } from '@/lib/api-client';

const fileInput = document.getElementById('file') as HTMLInputElement;
const file = fileInput.files?.[0];

if (file) {
  const response = await apiClient.upload('/upload', file);
  console.log('Uploaded file:', response.data);
}
```

### Upload with Progress

```typescript
const response = await apiClient.upload('/upload', file, {
  onProgress: (progress) => {
    console.log(`Upload progress: ${progress}%`);
  },
  // Additional form data
  body: {
    description: 'File description',
    category: 'documents',
  },
});
```

## Configuration

### Global Configuration

```typescript
import { apiClient } from '@/lib/api-client';

// Update base URL
apiClient.config.setBaseUrl('https://api.example.com');

// Update default timeout
apiClient.config.setDefaultTimeout(15000);

// Get current configuration
const baseUrl = apiClient.config.getBaseUrl();
const timeout = apiClient.config.getDefaultTimeout();
```

### Environment Variables

Create a `.env` file with the following variables:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_API_DEFAULT_TIMEOUT=30000
VITE_API_MAX_RETRIES=3
VITE_API_ENABLE_RETRY=true

# Logging Configuration
VITE_API_LOGGING_ENABLED=true
VITE_API_LOG_LEVEL=info
VITE_API_LOG_REQUEST_BODY=false
VITE_API_LOG_RESPONSE_BODY=false

# Features
VITE_API_ENABLE_TOKEN_REFRESH=true
VITE_API_ENABLE_REQUEST_DEDUPPLICATION=true
```

## Logging

### Enable Logging

```typescript
import { configureApiLogger } from '@/lib/api-logger';

configureApiLogger({
  enabled: true,
  level: 'debug',
  includeRequestBody: true,
  includeResponseBody: true,
  logToConsole: true,
  logToStorage: true,
});
```

### View Logs

```typescript
import { getLogEntries, getPerformanceMetrics } from '@/lib/api-logger';

// Get all logs
const logs = getLogEntries();

// Get filtered logs
const errorLogs = getLogEntries({
  level: 'error',
  limit: 50,
});

// Get performance metrics
const metrics = getPerformanceMetrics();
console.log('Average response time:', metrics.averageResponseTime);
console.log('Error rate:', metrics.errorRate);
```

### Export Logs

```typescript
import { exportLogs } from '@/lib/api-logger';

// Export logs to JSON file
exportLogs();
```

## Error Boundaries

### Using API Error Boundary

```typescript
import { ApiErrorBoundary } from '@/components/error-boundary/api-error-boundary';

function MyComponent() {
  return (
    <ApiErrorBoundary
      showToast={true}
      maxRetries={3}
      onError={(error, errorInfo) => {
        console.error('API Error in component:', error);
      }}
    >
      <YourComponent />
    </ApiErrorBoundary>
  );
}
```

### Higher-Order Component

```typescript
import { withApiErrorBoundary } from '@/components/error-boundary/api-error-boundary';

const ProtectedComponent = withApiErrorBoundary(MyComponent, {
  showToast: true,
  maxRetries: 2,
});
```

### Error Hook

```typescript
import { useApiErrorHandler } from '@/components/error-boundary/api-error-boundary';

function MyComponent() {
  const { handleError } = useApiErrorHandler();

  const fetchData = async () => {
    try {
      const response = await apiClient.get('/data');
      return response.data;
    } catch (error) {
      handleError(error, 'fetchData');
    }
  };

  return <button onClick={fetchData}>Fetch Data</button>;
}
```

## Testing

### Mock API Client

```typescript
import { createApiClient } from '@/lib/api-client';

// Create test client
const testClient = createApiClient('http://localhost:3001', 5000);

// Use in tests
const response = await testClient.get('/test-endpoint');
```

### Test with Custom Configuration

```typescript
const testClient = createApiClient();
testClient.config.setBaseUrl('http://mock-api.test');
testClient.interceptors.addRequest((config) => {
  // Add test headers
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-Test': 'true',
    },
  };
});
```

## Best Practices

### 1. Error Handling

```typescript
// ✅ Good: Specific error handling
try {
  const response = await apiClient.get('/users');
} catch (error) {
  if (error instanceof AuthError) {
    // Handle auth specifically
  } else if (error instanceof NetworkError) {
    // Handle network issues
  } else {
    // Handle other errors
  }
}

// ❌ Bad: Generic error handling
try {
  const response = await apiClient.get('/users');
} catch (error) {
  console.log('Something went wrong');
}
```

### 2. Type Safety

```typescript
// ✅ Good: Define response types
interface User {
  id: string;
  name: string;
  email: string;
}

const response = await apiClient.get<User[]>('/users');
const users: User[] = response.data;

// ❌ Bad: Any type
const response = await apiClient.get('/users');
const users = response.data; // Type is any
```

### 3. Configuration

```typescript
// ✅ Good: Use environment variables
const baseUrl = import.meta.env.VITE_API_BASE_URL;

// ❌ Bad: Hardcoded values
const baseUrl = 'http://localhost:3000';
```

### 4. Interceptors

```typescript
// ✅ Good: Clean interceptor management
const interceptorId = apiClient.interceptors.addRequest(myInterceptor);
// Later...
apiClient.interceptors.removeRequest(interceptorId);

// ❌ Bad: Memory leaks
apiClient.interceptors.addRequest(myInterceptor);
// Never removed
```

## Migration Guide

### From Fetch

```typescript
// Before
const response = await fetch('/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
const data = await response.json();

// After
const response = await apiClient.get('/users');
const data = response.data;
```

### From Axios

```typescript
// Before
import axios from 'axios';

const response = await axios.get('/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
const data = response.data;

// After
const response = await apiClient.get('/users');
const data = response.data;
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the API server allows requests from your domain
2. **Token Not Found**: Check that tokens are being stored in localStorage
3. **Timeout Issues**: Increase timeout configuration for slow endpoints
4. **Type Errors**: Ensure proper TypeScript types are defined

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
configureApiLogger({
  enabled: true,
  level: 'debug',
  includeRequestBody: true,
  includeResponseBody: true,
});
```

### Performance Monitoring

Monitor API performance:

```typescript
import { getPerformanceMetrics } from '@/lib/api-logger';

// Check metrics periodically
const metrics = getPerformanceMetrics();
if (metrics.averageResponseTime > 2000) {
  console.warn('API response time is slow');
}
```

## API Reference

### Methods

- `get<T>(endpoint, config?)` - GET request
- `post<T>(endpoint, data?, config?)` - POST request
- `put<T>(endpoint, data?, config?)` - PUT request
- `patch<T>(endpoint, data?, config?)` - PATCH request
- `delete<T>(endpoint, config?)` - DELETE request
- `upload<T>(endpoint, file, config?)` - File upload
- `healthCheck()` - API health check

### Configuration

- `config.setBaseUrl(url)` - Set base URL
- `config.getBaseUrl()` - Get base URL
- `config.setDefaultTimeout(ms)` - Set default timeout
- `config.getDefaultTimeout()` - Get default timeout

### Interceptors

- `interceptors.addRequest(interceptor)` - Add request interceptor
- `interceptors.removeRequest(id)` - Remove request interceptor
- `interceptors.addResponse(interceptor)` - Add response interceptor
- `interceptors.removeResponse(id)` - Remove response interceptor
- `interceptors.addError(interceptor)` - Add error interceptor
- `interceptors.removeError(id)` - Remove error interceptor
- `interceptors.clear()` - Clear all interceptors

For more detailed information, see the inline TypeScript documentation in the source files.