import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ResultsErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ResultsErrorBoundaryProps {
  children: React.ReactNode;
}

export class ResultsErrorBoundary extends React.Component<
  ResultsErrorBoundaryProps,
  ResultsErrorBoundaryState
> {
  constructor(props: ResultsErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ResultsErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Results display error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mb-3" />
          <h3 className="font-medium text-sm mb-2">Display Error</h3>
          <p className="text-xs text-muted-foreground mb-3 max-w-md">
            There was an error displaying the results. This might be due to
            unexpected data format.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="text-xs text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
