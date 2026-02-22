import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: 24, background: 'var(--bg-primary)'
                }}>
                    <div className="card" style={{ maxWidth: 480, textAlign: 'center' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>💥</div>
                        <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
                        <p style={{ marginBottom: 20 }}>An unexpected error occurred. Try refreshing the page.</p>
                        <pre style={{
                            background: 'var(--bg-primary)', padding: 12, borderRadius: 8,
                            fontSize: 12, color: 'var(--danger)', textAlign: 'left', overflow: 'auto', marginBottom: 20
                        }}>
                            {this.state.error?.message}
                        </pre>
                        <button className="btn btn-primary" onClick={() => window.location.reload()}>
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
