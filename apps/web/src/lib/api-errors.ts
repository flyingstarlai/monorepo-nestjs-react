/**
 * Standardized API error classes for consistent error handling
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromResponse(response: Response, responseText?: string): ApiError {
    let message = `HTTP ${response.status}`;
    let code: string | undefined;
    let parsedResponse: any;

    try {
      parsedResponse = responseText ? JSON.parse(responseText) : null;
      message = parsedResponse?.message || message;
      code = parsedResponse?.code;
    } catch {
      // Use default message if JSON parsing fails
    }

    return new ApiError(message, code, response.status, parsedResponse);
  }
}

export class AuthError extends ApiError {
  constructor(message: string, code?: string) {
    super(message, code, 401);
    this.name = 'AuthError';
  }

  static isAuthError(error: any): error is AuthError {
    return error instanceof AuthError || error?.statusCode === 401;
  }
}

export class WorkspaceError extends ApiError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'WorkspaceError';
  }
}

export class AdminApiError extends ApiError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'AdminApiError';
  }
}

export class NetworkError extends ApiError {
  constructor(message: string = 'Network error occurred') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class PermissionError extends ApiError {
  constructor(message: string = 'Permission denied') {
    super(message, 'PERMISSION_DENIED', 403);
    this.name = 'PermissionError';
  }
}

export class ServerError extends ApiError {
  constructor(message: string = 'Internal server error') {
    super(message, 'SERVER_ERROR', 500);
    this.name = 'ServerError';
  }
}

/**
 * Utility function to create appropriate error based on HTTP status
 */
export function createApiError(
  status: number,
  message?: string,
  response?: any
): ApiError {
  switch (status) {
    case 400:
      return new ValidationError(message || 'Bad request');
    case 401:
      return new AuthError(message || 'Authentication required');
    case 403:
      return new PermissionError(message || 'Permission denied');
    case 404:
      return new NotFoundError(message || 'Resource not found');
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(message || 'Server error');
    default:
      return new ApiError(
        message || `HTTP ${status}`,
        undefined,
        status,
        response
      );
  }
}
