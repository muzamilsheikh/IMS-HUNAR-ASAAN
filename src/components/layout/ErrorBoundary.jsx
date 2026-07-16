import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-red-50 p-8 rounded-3xl border border-red-100 max-w-xl">
            <h1 className="text-3xl font-black text-red-600 mb-4">Something went wrong.</h1>
            <p className="text-red-500 font-bold mb-6">The application encountered an unexpected error.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl font-black transition-all"
            >
              Refresh Application
            </button>
            <pre className="mt-8 text-left bg-white/50 p-4 rounded-xl text-xs overflow-auto text-red-800">
              {this.state.error && this.state.error.toString()}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
