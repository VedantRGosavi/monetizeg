'use client';

import React, { Component, ReactNode } from 'react';
import { SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  isAuthError: boolean;
  retryCount: number;
}

export class AuthErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isAuthError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is an authentication-related error
    const isAuthError = 
      error.name === 'AuthenticationError' ||
      error.name === 'AuthorizationError' ||
      error.message.includes('Authentication') ||
      error.message.includes('Unauthorized') ||
      error.message.includes('sign in') ||
      error.message.includes('login');

    return {
      hasError: true,
      error,
      isAuthError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error
    console.error('AuthErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error tracking service (e.g., Sentry)
      // reportError(error, errorInfo);
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isAuthError: false,
      retryCount: 0,
    });
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Authentication error fallback
      if (this.state.isAuthError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Authentication Required
                </CardTitle>
                <CardDescription className="text-gray-600">
                  You need to sign in to access this page. Please sign in to continue.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SignInButton mode="modal">
                  <Button className="w-full">
                    Sign In
                  </Button>
                </SignInButton>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={this.handleRetry}
                    disabled={this.state.retryCount >= this.maxRetries}
                    className="flex-1"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry ({this.maxRetries - this.state.retryCount} left)
                  </Button>
                  
                  <Link href="/" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Home className="mr-2 h-4 w-4" />
                      Home
                    </Button>
                  </Link>
                </div>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4 text-sm text-gray-600">
                    <summary className="cursor-pointer font-medium">
                      Error Details (Development)
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap break-words bg-gray-100 p-2 rounded text-xs">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          </div>
        );
      }

      // General error fallback
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-gray-600">
                An unexpected error occurred. Please try again or contact support if the problem persists.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Button
                  onClick={this.handleRetry}
                  disabled={this.state.retryCount >= this.maxRetries}
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry ({this.maxRetries - this.state.retryCount} left)
                </Button>
                
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Button>
                </Link>
              </div>

              <Button
                variant="ghost"
                onClick={this.handleReset}
                className="w-full text-sm"
              >
                Reset Error State
              </Button>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-sm text-gray-600">
                  <summary className="cursor-pointer font-medium">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words bg-gray-100 p-2 rounded text-xs">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <AuthErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </AuthErrorBoundary>
  );

  WrappedComponent.displayName = `withAuthErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

