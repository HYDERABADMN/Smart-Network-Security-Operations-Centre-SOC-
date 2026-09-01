import React from 'react';
import { ShieldAlert, RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CRITICAL: Smart SOC Caught Unhandled React Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-lg w-full p-8 rounded-2xl bg-slate-900 border border-red-500/40 shadow-2xl space-y-6 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-400">
              <ShieldAlert className="w-10 h-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-slate-100 tracking-tight">
                Smart Network Security Operations Centre
              </h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950 border border-red-800 text-red-400 text-xs font-mono font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                Application initialization error
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left font-mono text-xs text-rose-300 overflow-x-auto max-h-40 scrollbar-thin">
              {this.state.error?.toString() || 'An unexpected runtime error occurred while rendering the SOC interface.'}
            </div>

            <p className="text-xs text-slate-400">
              The telemetry console encountered an unhandled exception. The error has been logged to the browser developer console.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Attempt Recovery
              </button>
              <button
                onClick={this.handleReload}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Retry / Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
