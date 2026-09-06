import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full card text-center space-y-4 border border-red-200 shadow-md bg-white rounded-xl">
            <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto text-red-600">
              <AlertTriangle className="w-7 h-7 animate-bounce" />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900">Something went wrong</h2>
              <p className="text-xs text-slate-500 mt-1">
                An unexpected error occurred while rendering this page.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono text-left overflow-x-auto max-h-32 shadow-inner">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                onClick={() => window.location.href = '/admin/dashboard'}
                className="btn-primary text-xs flex items-center gap-1.5 shadow-card-glow"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
