'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log do erro
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Callback customizado
    this.props.onError?.(error, errorInfo);
    
    // Em produção, enviar para serviço de monitoramento
    if (process.env.NODE_ENV === 'production') {
      // TODO: Enviar para Sentry ou similar
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Fallback customizado
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão
      return (
        <div 
          className="min-h-screen flex items-center justify-center p-6"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full text-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ backgroundColor: 'var(--error-100)' }}
            >
              <AlertTriangle className="w-10 h-10" style={{ color: 'var(--error-500)' }} />
            </motion.div>

            {/* Title */}
            <h1 
              className="text-2xl font-bold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Ops! Algo deu errado
            </h1>

            {/* Description */}
            <p 
              className="mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              Encontramos um erro inesperado. Nossa equipe já foi notificada.
            </p>

            {/* Error details (dev only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div 
                className="mb-6 p-4 rounded-xl text-left overflow-auto max-h-40"
                style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--error-200)' }}
              >
                <p className="text-xs font-mono" style={{ color: 'var(--error-600)' }}>
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-xs font-mono mt-2 whitespace-pre-wrap" style={{ color: 'var(--text-tertiary)' }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors"
                style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Página
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
              >
                <Home className="w-4 h-4" />
                Ir para Home
              </button>
            </div>

            {/* Report bug link */}
            <button
              onClick={() => {
                // TODO: Abrir modal de report ou link para suporte
                console.log('Report bug clicked');
              }}
              className="mt-6 text-sm flex items-center justify-center gap-1 mx-auto"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <Bug className="w-4 h-4" />
              Reportar problema
            </button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para usar em componentes funcionais
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    console.error('Error handled:', error);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw error para ser capturado pelo ErrorBoundary
  if (error) {
    throw error;
  }

  return { handleError, resetError };
}

// Componente wrapper para async errors
interface AsyncBoundaryProps {
  children: ReactNode;
  loading?: ReactNode;
  error?: ReactNode;
}

export function AsyncBoundary({ children, loading, error }: AsyncBoundaryProps) {
  return (
    <ErrorBoundary fallback={error}>
      <React.Suspense fallback={loading || <DefaultLoading />}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
}

function DefaultLoading() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default ErrorBoundary;









