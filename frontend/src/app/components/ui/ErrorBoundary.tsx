"use client";
import { Component, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { Button } from "./Button";
import { LucideRefreshCw, LucideAlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LucideAlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-red-800">Oops! Algo deu errado</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                Encontramos um erro inesperado. Tente recarregar a página.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <LucideRefreshCw className="w-4 h-4 mr-2" />
                Recarregar Página
              </Button>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left bg-gray-100 p-4 rounded-lg text-sm">
                  <summary className="cursor-pointer font-medium">
                    Detalhes do erro (desenvolvimento)
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-red-600">
                    {this.state.error.stack}
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

export default ErrorBoundary;