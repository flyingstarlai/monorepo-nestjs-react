import React, { Component, ReactNode, ComponentType } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  WifiOff, 
  Shield, 
  Clock,
  Bug,
  Home
} from 'lucide-react';
import { ApiError, AuthError, NetworkError, ValidationError } from '@/lib/api-errors';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ComponentType<{ error: Error; retry: () => void; errorInfo: any }>;
  onError?: (error: Error, errorInfo: any) => void;
  showToast?: boolean;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  retryCount: number;
  isRetrying: boolean;
}

export class ApiErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Show toast notification if enabled
    if (this.props.showToast) {
      this.showErrorToast(error);
    }

    // Log error for debugging
    console.error('API Error Boundary caught an error:', error, errorInfo);
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private showErrorToast(error: Error) {
    const title = this.getErrorTitle(error);
    const description = this.getErrorMessage(error);
    
    toast.error(title, {
      description,
      action: {
        label: 'Retry',
        onClick: () => this.handleRetry(),
      },
    });
  }

  private getErrorTitle(error: Error): string {
    if (error instanceof AuthError) return 'Authentication Error';
    if (error instanceof NetworkError) return 'Network Error';
    if (error instanceof ValidationError) return 'Validation Error';
    if (error instanceof ApiError) return 'API Error';
    return 'Application Error';
  }

  private getErrorMessage(error: Error): string {
    if (error instanceof AuthError) {
      return 'Please log in again to continue.';
    }
    if (error instanceof NetworkError) {
      return 'Please check your internet connection and try again.';
    }
    if (error instanceof ValidationError) {
      return error.message || 'Please check your input and try again.';
    }
    if (error instanceof ApiError) {
      return error.message || 'Something went wrong. Please try again.';
    }
    return 'An unexpected error occurred. Please try again.';
  }

  private getErrorIcon(error: Error | null) {
    if (!error) return AlertTriangle;
    
    if (error instanceof AuthError) return Shield;
    if (error instanceof NetworkError) return WifiOff;
    if (error instanceof ValidationError) return Bug;
    if (error instanceof ApiError) {
      if (error.statusCode === 500) return AlertTriangle;
      if (error.statusCode === 408) return Clock;
      return AlertTriangle;
    }
    
    return AlertTriangle;
  }

  private getErrorSeverity(error: Error | null): 'default' | 'destructive' | 'warning' {
    if (!error) return 'default';
    
    if (error instanceof AuthError) return 'destructive';
    if (error instanceof NetworkError) return 'warning';
    if (error instanceof ValidationError) return 'warning';
    if (error instanceof ApiError) {
      if (error.statusCode && error.statusCode >= 500) return 'destructive';
      if (error.statusCode === 408) return 'warning';
    }
    
    return 'default';
  }

  private canRetry(error: Error | null): boolean {
    if (!error) return true;
    
    const maxRetries = this.props.maxRetries ?? 3;
    if (this.state.retryCount >= maxRetries) return false;
    
    // Don't retry authentication errors
    if (error instanceof AuthError) return false;
    
    // Don't retry validation errors
    if (error instanceof ValidationError) return false;
    
    // Don't retry client errors (4xx) except 408 (timeout)
    if (error instanceof ApiError) {
      if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        return error.statusCode === 408; // Only retry timeouts
      }
    }
    
    return true;
  }

  private handleRetry = () => {
    if (!this.canRetry(this.state.error)) return;
    
    this.setState({ isRetrying: true });
    
    // Add a small delay before retrying
    const timeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
      }));
    }, 1000);
    
    this.retryTimeouts.push(timeout);
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private getErrorDetails(error: Error | null): ReactNode {
    if (!error) return null;
    
    const details = [];
    
    if (error instanceof ApiError) {
      if (error.statusCode) {
        details.push(
          <div key="status" className="flex items-center gap-2">
            <span className="font-medium">Status:</span>
            <Badge variant={this.getErrorSeverity(error) === 'destructive' ? 'destructive' : 'secondary'}>
              {error.statusCode}
            </Badge>
          </div>
        );
      }
      
      if (error.code) {
        details.push(
          <div key="code" className="flex items-center gap-2">
            <span className="font-medium">Code:</span>
            <Badge variant="outline">{error.code}</Badge>
          </div>
        );
      }
    }
    
    if (error.message) {
      details.push(
        <div key="message" className="mt-2">
          <span className="font-medium">Message:</span>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
      );
    }
    
    return details.length > 0 ? <div className="space-y-2">{details}</div> : null;
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback: Fallback } = this.props;
      
      if (Fallback) {
        return (
          <Fallback 
            error={this.state.error} 
            retry={this.handleRetry}
            errorInfo={this.state.errorInfo}
          />
        );
      }
      
      const ErrorIcon = this.getErrorIcon(this.state.error);
      const severity = this.getErrorSeverity(this.state.error);
      const canRetry = this.canRetry(this.state.error);
      
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <ErrorIcon className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-xl">
                {this.getErrorTitle(this.state.error)}
              </CardTitle>
              <CardDescription>
                {this.getErrorMessage(this.state.error)}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {this.getErrorDetails(this.state.error)}
              
              {this.state.retryCount > 0 && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Retry Attempt {this.state.retryCount}</AlertTitle>
                  <AlertDescription>
                    {this.canRetry(this.state.error) 
                      ? `Still trying to resolve the issue... (${this.props.maxRetries ?? 3} max attempts)`
                      : 'Maximum retry attempts reached.'
                    }
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex flex-col gap-2">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry} 
                    disabled={this.state.isRetrying}
                    className="w-full"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                    {this.state.isRetrying ? 'Retrying...' : 'Try Again'}
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={this.handleReset}
                  className="w-full"
                >
                  Reset
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={this.handleGoHome}
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with API error boundary
export function withApiErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ApiErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ApiErrorBoundary>
  );
  
  WrappedComponent.displayName = `withApiErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for handling API errors in functional components
export function useApiErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
    
    const title = error instanceof ApiError ? error.message : 'An error occurred';
    const description = error instanceof ApiError 
      ? `Status: ${error.statusCode}${error.code ? ` | Code: ${error.code}` : ''}`
      : error.message;
    
    toast.error(title, {
      description,
      action: error instanceof AuthError ? {
        label: 'Login',
        onClick: () => {
          window.location.href = '/login';
        },
      } : undefined,
    });
  };
  
  return { handleError };
}