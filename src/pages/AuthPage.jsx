import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, Sparkles, Eye, EyeOff } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { signInMock } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Local mock sign-in bypass for general testing
            const { error } = await signInMock(email);
            if (error) throw error;
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: 24,
            background: 'radial-gradient(ellipse at top left, #1e1b4b 0%, var(--bg-primary) 60%)'
        }}>
            <div style={{ width: '100%', maxWidth: 420 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)'
                    }}>
                        <Sparkles size={26} color="#fff" />
                    </div>
                    <h1 style={{ marginBottom: 8, fontSize: '1.75rem' }}>Welcome to Jess</h1>
                    <p style={{ fontSize: '0.9375rem' }}>Your AI productivity assistant</p>
                </div>

                <div className="card">
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Sign In</h2>
                    </div>

                    {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="form-group">
                            <label htmlFor="auth-email">Email address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    id="auth-email" type="email" required
                                    placeholder="you@example.com"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    style={{ paddingLeft: 38 }}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="auth-password">Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    id="auth-password"
                                    type={showPass ? 'text' : 'password'}
                                    required minLength={6}
                                    placeholder="Min. 6 characters"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    style={{ paddingLeft: 38, paddingRight: 40 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(p => !p)}
                                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-full btn-lg"
                            disabled={loading}
                            style={{ marginTop: 8 }}
                        >
                            {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    🔐 API keys stay on your device. Zero data collection.
                </p>
            </div>
        </div>
    );
}
