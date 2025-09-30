import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You could log error to an external service here
    console.error('UI ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-red-50 p-6">
          <div className="max-w-xl w-full bg-white border border-red-200 rounded-lg shadow p-6 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Bir şeyler ters gitti</h2>
            <p className="text-gray-700 mb-4">Beklenmeyen bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Yenile
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="text-left mt-4 p-3 bg-gray-100 rounded overflow-auto max-h-64 text-xs">
                {String(this.state.error?.message || this.state.error)}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
