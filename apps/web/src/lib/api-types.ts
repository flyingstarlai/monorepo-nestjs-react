/**
 * Standardized API response type definitions for consistency across the application
 */

// Base API response wrapper
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  code?: string;
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Paginated response wrapper
export interface PaginatedResponse<T = any> {
  items: T[];
  pagination: PaginationMeta;
  success: boolean;
  message?: string;
}

// Cursor-based pagination for infinite scroll
export interface CursorPaginationMeta {
  cursor?: string;
  nextCursor?: string;
  hasMore: boolean;
  limit: number;
}

// Cursor-based paginated response
export interface CursorPaginatedResponse<T = any> {
  items: T[];
  pagination: CursorPaginationMeta;
  success: boolean;
  message?: string;
}

// Error response format
export interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: Record<string, any>;
  field?: string; // For validation errors
  timestamp: string;
  path?: string;
}

// Success response with no data
export interface SuccessResponse {
  success: true;
  message: string;
  code?: string;
  timestamp: string;
}

// Bulk operation response
export interface BulkOperationResponse<T = any> {
  success: boolean;
  message: string;
  results: Array<{
    item: T;
    success: boolean;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// File upload response
export interface FileUploadResponse {
  success: boolean;
  message: string;
  file: {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
  };
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  services: Record<string, {
    status: 'healthy' | 'unhealthy' | 'degraded';
    responseTime?: number;
    lastCheck: string;
  }>;
}

// Search response
export interface SearchResponse<T = any> {
  items: T[];
  pagination: PaginationMeta;
  facets?: Record<string, Array<{
    value: string;
    count: number;
  }>>;
  suggestions?: string[];
  totalHits: number;
  searchTime: number;
}

// Rate limit response headers
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  retryAfter?: number; // Seconds to wait
}

// API version info
export interface ApiVersionResponse {
  version: string;
  buildNumber?: string;
  commitHash?: string;
  buildDate?: string;
  environment: 'development' | 'staging' | 'production';
}

// Generic list response (non-paginated)
export interface ListResponse<T = any> {
  items: T[];
  total: number;
  success: boolean;
  message?: string;
}

// Count response
export interface CountResponse {
  count: number;
  success: boolean;
}

// Status update response
export interface StatusUpdateResponse {
  id: string;
  status: string;
  previousStatus: string;
  updatedAt: string;
  success: boolean;
  message?: string;
}

// Batch operation request
export interface BatchOperationRequest<T = any> {
  operation: 'create' | 'update' | 'delete';
  items: T[];
  options?: {
    continueOnError?: boolean;
    validateOnly?: boolean;
  };
}

// Sorting options
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Filtering options
export interface FilterOptions {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'ilike';
  value: any;
}

// Query parameters for list endpoints
export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: SortOptions[];
  filters?: FilterOptions[];
  search?: string;
  fields?: string[]; // Field selection
}

// API request context
export interface ApiRequestContext {
  requestId: string;
  timestamp: string;
  userId?: string;
  workspaceId?: string;
  userAgent?: string;
  ip?: string;
}

// Response with metadata
export interface ResponseWithMetadata<T = any> {
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
    duration: number; // Response time in ms
    version: string;
  };
  success: boolean;
  message?: string;
}

// Type guards for response checking
export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true } {
  return response.success === true;
}

export function isErrorResponse(response: any): response is ErrorResponse {
  return response && response.success === false;
}

export function isPaginatedResponse<T>(response: any): response is PaginatedResponse<T> {
  return response && Array.isArray(response.items) && response.pagination;
}

export function isCursorPaginatedResponse<T>(response: any): response is CursorPaginatedResponse<T> {
  return response && Array.isArray(response.items) && response.pagination && 'cursor' in response.pagination;
}

// Utility functions for creating standard responses
export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function createPaginatedResponse<T>(
  items: T[],
  pagination: PaginationMeta,
  message?: string
): PaginatedResponse<T> {
  return {
    success: true,
    items,
    pagination,
    message,
  };
}

export function createErrorResponse(
  message: string,
  code?: string,
  details?: Record<string, any>
): ErrorResponse {
  return {
    success: false,
    message,
    code,
    details,
    timestamp: new Date().toISOString(),
  };
}