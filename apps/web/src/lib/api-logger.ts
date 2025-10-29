/**
 * API Client logging and monitoring utilities
 */

import { apiClient } from './api-client';
import { ApiError } from './api-errors';

// Logger configuration
interface LoggerConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  maxLogEntries: number;
  includeRequestBody: boolean;
  includeResponseBody: boolean;
  logToConsole: boolean;
  logToStorage: boolean;
}

// Log entry structure
interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  type: 'request' | 'response' | 'error';
  url: string;
  method?: string;
  status?: number;
  duration?: number;
  requestId?: string;
  userId?: string;
  workspaceId?: string;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

// Performance metrics
interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  slowestRequest: {
    url: string;
    duration: number;
    timestamp: string;
  };
  fastestRequest: {
    url: string;
    duration: number;
    timestamp: string;
  };
  errorRate: number;
  statusCodes: Record<number, number>;
  endpoints: Record<string, {
    count: number;
    averageTime: number;
    errors: number;
  }>;
}

// Default configuration
const defaultConfig: LoggerConfig = {
  enabled: import.meta.env.DEV || false,
  level: import.meta.env.DEV ? 'debug' : 'info',
  maxLogEntries: 1000,
  includeRequestBody: import.meta.env.DEV || false,
  includeResponseBody: import.meta.env.DEV || false,
  logToConsole: true,
  logToStorage: true,
};

// Logger state
let loggerConfig = { ...defaultConfig };
let logEntries: LogEntry[] = [];
let performanceMetrics: PerformanceMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageResponseTime: 0,
  slowestRequest: { url: '', duration: 0, timestamp: '' },
  fastestRequest: { url: '', duration: Infinity, timestamp: '' },
  errorRate: 0,
  statusCodes: {},
  endpoints: {},
};

/**
 * Configure the API logger
 */
export function configureApiLogger(config: Partial<LoggerConfig>): void {
  loggerConfig = { ...loggerConfig, ...config };
}

/**
 * Get current logger configuration
 */
export function getApiLoggerConfig(): LoggerConfig {
  return { ...loggerConfig };
}

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogEntry['level'],
  type: LogEntry['type'],
  data: Partial<LogEntry>
): LogEntry {
  return {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    level,
    type,
    url: data.url || '',
    method: data.method,
    status: data.status,
    duration: data.duration,
    requestId: data.requestId,
    userId: getCurrentUserId(),
    workspaceId: getCurrentWorkspaceId(),
    ...data,
  };
}

/**
 * Get current user ID from auth store or token
 */
function getCurrentUserId(): string | undefined {
  try {
    const token = localStorage.getItem('access_token');
    if (token) {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.sub?.toString();
    }
  } catch {
    // Ignore errors
  }
  return undefined;
}

/**
 * Get current workspace ID from URL or store
 */
function getCurrentWorkspaceId(): string | undefined {
  try {
    const match = window.location.pathname.match(/^\/c\/([^/]+)/);
    return match?.[1];
  } catch {
    // Ignore errors
  }
  return undefined;
}

/**
 * Add log entry to storage and console
 */
function addLogEntry(entry: LogEntry): void {
  if (!loggerConfig.enabled) return;

  // Check log level
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevelIndex = levels.indexOf(loggerConfig.level);
  const entryLevelIndex = levels.indexOf(entry.level);
  
  if (entryLevelIndex < currentLevelIndex) return;

  // Add to memory storage
  logEntries.push(entry);
  
  // Trim old entries if exceeding max
  if (logEntries.length > loggerConfig.maxLogEntries) {
    logEntries = logEntries.slice(-loggerConfig.maxLogEntries);
  }

  // Log to console
  if (loggerConfig.logToConsole) {
    const consoleMethod = entry.level === 'error' ? 'error' :
                       entry.level === 'warn' ? 'warn' :
                       entry.level === 'info' ? 'info' : 'debug';
    
    const logData = {
      ...entry,
      // Include request/response body only if configured
      ...(loggerConfig.includeRequestBody && entry.metadata?.requestBody && {
        requestBody: entry.metadata.requestBody
      }),
      ...(loggerConfig.includeResponseBody && entry.metadata?.responseBody && {
        responseBody: entry.metadata.responseBody
      }),
    };

    console[consoleMethod](`[API Logger] ${entry.type.toUpperCase()}`, logData);
  }

  // Persist to localStorage if enabled
  if (loggerConfig.logToStorage) {
    try {
      const storageKey = 'api_logs';
      const existingLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existingLogs.push(entry);
      
      // Keep only recent logs in storage
      if (existingLogs.length > 500) {
        existingLogs.splice(0, existingLogs.length - 500);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(existingLogs));
    } catch (error) {
      console.warn('Failed to save logs to localStorage:', error);
    }
  }

  // Update performance metrics
  updatePerformanceMetrics(entry);
}

/**
 * Update performance metrics
 */
function updatePerformanceMetrics(entry: LogEntry): void {
  if (entry.type === 'response' && entry.duration !== undefined) {
    performanceMetrics.totalRequests++;
    
    if (entry.status && entry.status >= 200 && entry.status < 400) {
      performanceMetrics.successfulRequests++;
    } else {
      performanceMetrics.failedRequests++;
    }

    // Update average response time
    const totalTime = performanceMetrics.averageResponseTime * (performanceMetrics.totalRequests - 1) + entry.duration;
    performanceMetrics.averageResponseTime = totalTime / performanceMetrics.totalRequests;

    // Update slowest/fastest requests
    if (entry.duration > performanceMetrics.slowestRequest.duration) {
      performanceMetrics.slowestRequest = {
        url: entry.url,
        duration: entry.duration,
        timestamp: entry.timestamp,
      };
    }

    if (entry.duration < performanceMetrics.fastestRequest.duration) {
      performanceMetrics.fastestRequest = {
        url: entry.url,
        duration: entry.duration,
        timestamp: entry.timestamp,
      };
    }

    // Update error rate
    performanceMetrics.errorRate = performanceMetrics.failedRequests / performanceMetrics.totalRequests;

    // Update status codes
    if (entry.status) {
      performanceMetrics.statusCodes[entry.status] = (performanceMetrics.statusCodes[entry.status] || 0) + 1;
    }

    // Update endpoint metrics
    const endpoint = entry.method ? `${entry.method} ${entry.url}` : entry.url;
    if (!performanceMetrics.endpoints[endpoint]) {
      performanceMetrics.endpoints[endpoint] = {
        count: 0,
        averageTime: 0,
        errors: 0,
      };
    }

    const endpointMetrics = performanceMetrics.endpoints[endpoint];
    endpointMetrics.count++;
    
    const newAverageTime = (endpointMetrics.averageTime * (endpointMetrics.count - 1) + entry.duration) / endpointMetrics.count;
    endpointMetrics.averageTime = newAverageTime;

    if (entry.status && (entry.status < 200 || entry.status >= 400)) {
      endpointMetrics.errors++;
    }
  }
}

/**
 * Setup API client interceptors for logging
 */
export function setupApiLogging(): void {
  // Request interceptor
  apiClient.interceptors.addRequest(async (config) => {
    const requestId = (config.headers as Record<string, string>)?.['X-Request-ID'];
    const url = config.url || '';
    const method = config.method?.toUpperCase();

    addLogEntry(createLogEntry('info', 'request', {
      url,
      method,
      requestId,
      metadata: {
        headers: config.headers,
        ...(loggerConfig.includeRequestBody && config.body && {
          requestBody: config.body,
        }),
      },
    }));

    return config;
  });

  // Response interceptor
  apiClient.interceptors.addResponse(async (response) => {
    const requestId = (response.headers as Record<string, string>)?.['x-request-id'];
    const url = response.url || '';
    const method = 'GET'; // We don't have method info in response

    addLogEntry(createLogEntry('info', 'response', {
      url,
      method,
      status: response.status,
      requestId,
      metadata: {
        ...(loggerConfig.includeResponseBody && {
          responseBody: response.data,
        }),
      },
    }));

    return response;
  });

  // Error interceptor
  apiClient.interceptors.addError(async (error) => {
    const requestId = (error as any).requestId;
    const url = (error as any).url || '';
    const method = (error as any).method?.toUpperCase();

    addLogEntry(createLogEntry('error', 'error', {
      url,
      method,
      requestId,
      status: (error as ApiError).statusCode,
      error: {
        message: error.message,
        code: (error as ApiError).code,
        stack: error.stack,
      },
    }));

    return error;
  });
}

/**
 * Get all log entries
 */
export function getLogEntries(filter?: {
  level?: LogEntry['level'];
  type?: LogEntry['type'];
  url?: string;
  requestId?: string;
  limit?: number;
}): LogEntry[] {
  let filtered = [...logEntries];

  if (filter) {
    if (filter.level) {
      filtered = filtered.filter(entry => entry.level === filter.level);
    }
    if (filter.type) {
      filtered = filtered.filter(entry => entry.type === filter.type);
    }
    if (filter.url) {
      filtered = filtered.filter(entry => entry.url.includes(filter.url!));
    }
    if (filter.requestId) {
      filtered = filtered.filter(entry => entry.requestId === filter.requestId);
    }
    if (filter.limit) {
      filtered = filtered.slice(-filter.limit);
    }
  }

  return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return { ...performanceMetrics };
}

/**
 * Clear all logs and reset metrics
 */
export function clearLogs(): void {
  logEntries = [];
  performanceMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    slowestRequest: { url: '', duration: 0, timestamp: '' },
    fastestRequest: { url: '', duration: Infinity, timestamp: '' },
    errorRate: 0,
    statusCodes: {},
    endpoints: {},
  };

  // Clear localStorage
  try {
    localStorage.removeItem('api_logs');
  } catch {
    // Ignore errors
  }
}

/**
 * Export logs to JSON file
 */
export function exportLogs(): void {
  const logs = getLogEntries();
  const metrics = getPerformanceMetrics();
  
  const exportData = {
    timestamp: new Date().toISOString(),
    config: loggerConfig,
    logs,
    metrics,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `api-logs-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

/**
 * Get logs from localStorage (for persistence across page reloads)
 */
export function loadPersistedLogs(): void {
  try {
    const storageKey = 'api_logs';
    const persistedLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    if (Array.isArray(persistedLogs)) {
      logEntries = persistedLogs.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp).toISOString(),
      }));
    }
  } catch (error) {
    console.warn('Failed to load persisted logs:', error);
  }
}

// Initialize logging on module load
if (typeof window !== 'undefined') {
  loadPersistedLogs();
  setupApiLogging();
}