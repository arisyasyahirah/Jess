import Sidebar, { MobileNav } from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { Settings as SettingsIcon, Shield } from 'lucide-react';

export default function SettingsPage() {
    const { user, signOut } = useAuth();

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header fade-in">
                    <h1>Settings</h1>
                    <p>Manage your account preferences.</p>
                </div>

                {/* General Settings */}
                <div className="card fade-in" style={{ marginBottom: 24, padding: 24 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: `var(--base-color, #4285f4)20`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <SettingsIcon size={18} color="var(--text-primary)" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>General Settings</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Basic application preferences.</p>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Application Theme</label>
                        <select className="form-select" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} disabled>
                            <option>Dark Mode (Default)</option>
                        </select>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Theme customization coming soon.</p>
                    </div>
                </div>

                {/* API Info notice */}
                <div className="alert alert-info fade-in" style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Shield size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                        <strong>API Keys are managed securely.</strong> Your AI service keys are now securely configured via the application's environment configuration file (`.env`), ensuring they are not exposed in the browser.
                    </div>
                </div>

                {/* Account section */}
                <div className="card fade-in" style={{ marginTop: 24 }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>Account</h2>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 2 }}>Signed in as</div>
                            <div style={{ fontWeight: 500 }}>{user?.email}</div>
                        </div>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={async () => { await signOut(); window.location.href = '/auth'; }}
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </main>
            <MobileNav />
        </div>
    );
}
