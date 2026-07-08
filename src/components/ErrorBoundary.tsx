import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50dvh',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>😅</div>
            <h2 style={{ marginBottom: '0.5rem', fontFamily: 'Playfair Display, serif' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#8E8E8E', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Please try refreshing the page.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#7B2D8B',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '0.9375rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
