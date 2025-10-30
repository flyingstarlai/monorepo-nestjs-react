/**
 * API Configuration management
 * Centralizes all API-related configuration and environment variables
 */

// API Configuration interface
export interface ApiConfig {
  // Base configuration
  baseUrl: string;
  defaultTimeout: number;
  maxRetries: number;
  enableRetry: boolean;

  // Logging configuration
  loggingEnabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logRequestBody: boolean;
  logResponseBody: boolean;
  logMaxEntries: number;

  // Feature flags
  enableTokenRefresh: boolean;
  enableRequestDeduplication: boolean;
  enableCache: boolean;

  // Application info
  appVersion: string;
  appName: string;

  // Development/Production flags
  isDevelopment: boolean;
  isProduction: boolean;
  enableDevtools: boolean;
  enableMonitoring: boolean;
  enablePerformanceTracking: boolean;
}

// Default configuration
const defaultConfig: ApiConfig = {
  baseUrl: 'http://localhost:3000',
  defaultTimeout: 30000,
  maxRetries: 3,
  enableRetry: true,

  loggingEnabled: false,
  logLevel: 'info',
  logRequestBody: false,
  logResponseBody: false,
  logMaxEntries: 1000,

  enableTokenRefresh: true,
  enableRequestDeduplication: true,
  enableCache: false,

  appVersion: '1.0.0',
  appName: 'TC Studio',

  isDevelopment: false,
  isProduction: false,
  enableDevtools: false,
  enableMonitoring: false,
  enablePerformanceTracking: false,
};

/**
 * Get configuration from environment variables
 */
function getEnvConfig(): Partial<ApiConfig> {
  return {
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    defaultTimeout: import.meta.env.VITE_API_DEFAULT_TIMEOUT
      ? parseInt(import.meta.env.VITE_API_DEFAULT_TIMEOUT, 10)
      : undefined,
    maxRetries: import.meta.env.VITE_API_MAX_RETRIES
      ? parseInt(import.meta.env.VITE_API_MAX_RETRIES, 10)
      : undefined,
    enableRetry: import.meta.env.VITE_API_ENABLE_RETRY !== 'false',

    loggingEnabled: import.meta.env.VITE_API_LOGGING_ENABLED === 'true',
    logLevel:
      (import.meta.env.VITE_API_LOG_LEVEL as ApiConfig['logLevel']) ||
      undefined,
    logRequestBody: import.meta.env.VITE_API_LOG_REQUEST_BODY === 'true',
    logResponseBody: import.meta.env.VITE_API_LOG_RESPONSE_BODY === 'true',
    logMaxEntries: import.meta.env.VITE_API_LOG_MAX_ENTRIES
      ? parseInt(import.meta.env.VITE_API_LOG_MAX_ENTRIES, 10)
      : undefined,

    enableTokenRefresh:
      import.meta.env.VITE_API_ENABLE_TOKEN_REFRESH !== 'false',
    enableRequestDeduplication:
      import.meta.env.VITE_API_ENABLE_REQUEST_DEDUPPLICATION !== 'false',
    enableCache: import.meta.env.VITE_API_ENABLE_CACHE === 'true',

    appVersion: import.meta.env.VITE_APP_VERSION,
    appName: import.meta.env.VITE_APP_NAME,

    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    enableDevtools: import.meta.env.VITE_ENABLE_DEVTOOLS === 'true',
    enableMonitoring: import.meta.env.VITE_ENABLE_API_MONITORING === 'true',
    enablePerformanceTracking:
      import.meta.env.VITE_ENABLE_PERFORMANCE_TRACKING === 'true',
  };
}

/**
 * Merge configuration with defaults
 */
function mergeConfig(base: ApiConfig, override: Partial<ApiConfig>): ApiConfig {
  const merged = { ...base };

  for (const key in override) {
    const value = override[key as keyof ApiConfig];
    if (value !== undefined) {
      (merged as any)[key] = value;
    }
  }

  return merged;
}

/**
 * Current API configuration
 */
let currentConfig: ApiConfig = mergeConfig(defaultConfig, getEnvConfig());

/**
 * Get current API configuration
 */
export function getApiConfig(): ApiConfig {
  return { ...currentConfig };
}

/**
 * Update API configuration
 */
export function updateApiConfig(updates: Partial<ApiConfig>): void {
  currentConfig = mergeConfig(currentConfig, updates);

  // Update API client configuration
  if (typeof window !== 'undefined') {
    // Import dynamically to avoid circular dependencies
    import('./api-client').then(({ apiClient }) => {
      if (updates.baseUrl) {
        apiClient.config.setBaseUrl(updates.baseUrl);
      }
      if (updates.defaultTimeout) {
        apiClient.config.setDefaultTimeout(updates.defaultTimeout);
      }
    });
  }
}

/**
 * Reset API configuration to defaults
 */
export function resetApiConfig(): void {
  currentConfig = mergeConfig(defaultConfig, getEnvConfig());
}

/**
 * Validate API configuration
 */
export function validateApiConfig(config: ApiConfig): string[] {
  const errors: string[] = [];

  if (!config.baseUrl) {
    errors.push('API base URL is required');
  } else {
    try {
      new URL(config.baseUrl);
    } catch {
      errors.push('API base URL is not a valid URL');
    }
  }

  if (config.defaultTimeout < 1000) {
    errors.push('Default timeout must be at least 1000ms');
  }

  if (config.maxRetries < 0 || config.maxRetries > 10) {
    errors.push('Max retries must be between 0 and 10');
  }

  if (config.logMaxEntries < 10 || config.logMaxEntries > 10000) {
    errors.push('Log max entries must be between 10 and 10000');
  }

  const validLogLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLogLevels.includes(config.logLevel)) {
    errors.push(`Log level must be one of: ${validLogLevels.join(', ')}`);
  }

  return errors;
}

/**
 * Get configuration for specific environment
 */
export function getEnvironmentConfig(
  env: 'development' | 'staging' | 'production'
): Partial<ApiConfig> {
  const configs: Record<string, Partial<ApiConfig>> = {
    development: {
      loggingEnabled: true,
      logLevel: 'debug',
      logRequestBody: true,
      logResponseBody: true,
      enableDevtools: true,
      enableMonitoring: true,
      enablePerformanceTracking: true,
    },
    staging: {
      loggingEnabled: true,
      logLevel: 'info',
      logRequestBody: false,
      logResponseBody: false,
      enableDevtools: true,
      enableMonitoring: true,
      enablePerformanceTracking: true,
    },
    production: {
      loggingEnabled: false,
      logLevel: 'error',
      logRequestBody: false,
      logResponseBody: false,
      enableDevtools: false,
      enableMonitoring: false,
      enablePerformanceTracking: false,
    },
  };

  return configs[env] || {};
}

/**
 * Initialize API configuration based on current environment
 */
export function initializeApiConfig(): void {
  const envConfig = getEnvConfig();
  const merged = mergeConfig(defaultConfig, envConfig);

  // Validate configuration
  const errors = validateApiConfig(merged);
  if (errors.length > 0) {
    console.error('API Configuration errors:', errors);
    if (merged.isDevelopment) {
      throw new Error(`Invalid API configuration: ${errors.join(', ')}`);
    }
  }

  currentConfig = merged;

  // Log configuration in development
  if (merged.isDevelopment) {
    console.group('🔧 API Configuration');
    console.log(
      'Environment:',
      merged.isDevelopment ? 'development' : 'production'
    );
    console.log('Base URL:', merged.baseUrl);
    console.log('Timeout:', merged.defaultTimeout);
    console.log('Max Retries:', merged.maxRetries);
    console.log('Logging Enabled:', merged.loggingEnabled);
    console.log('Token Refresh:', merged.enableTokenRefresh);
    console.groupEnd();
  }
}

/**
 * Export configuration as JSON for debugging
 */
export function exportApiConfig(): string {
  return JSON.stringify(currentConfig, null, 2);
}

/**
 * Import configuration from JSON (for testing/debugging)
 */
export function importApiConfig(configJson: string): void {
  try {
    const config = JSON.parse(configJson);
    const errors = validateApiConfig(config);

    if (errors.length > 0) {
      throw new Error(`Invalid configuration: ${errors.join(', ')}`);
    }

    updateApiConfig(config);
  } catch (error) {
    throw new Error(
      `Failed to import configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Auto-initialize configuration
if (typeof window !== 'undefined') {
  initializeApiConfig();
}
