import { useState, useEffect } from 'react';
import Sidebar, { MobileNav } from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { Settings as SettingsIcon, Shield, Key, Check, User, LogOut, Globe } from 'lucide-react';

export default function SettingsPage() {
    const { user, signOut } = useAuth();
    const [groqKey, setGroqKey] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setGroqKey(localStorage.getItem('jess_api_key_groq') || '');
        setGeminiKey(localStorage.getItem('jess_api_key_gemini') || '');
    }, []);

    const saveKeys = () => {
        if (groqKey) localStorage.setItem('jess_api_key_groq', groqKey);
        else localStorage.removeItem('jess_api_key_groq');

        if (geminiKey) localStorage.setItem('jess_api_key_gemini', geminiKey);
        else localStorage.removeItem('jess_api_key_gemini');

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header fade-in">
                    <h1>Settings</h1>
                    <p>Manage your account preferences.</p>
                </div>

                {/* Account Profile Section */}
                <div className="card fade-in" style={{ marginBottom: 24, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: '50%',
                            background: `linear-gradient(135deg, var(--accent, #a855f7), var(--base-color, #4285f4))`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff',
                            flexShrink: 0
                        }}>
                            <User size={28} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>{user?.email?.split('@')[0] || 'Jess User'}</h2>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>{user?.email || 'No email provided'}</p>
                        </div>
                    </div>
                    <button
                        className="btn btn-secondary"
                        onClick={async () => { await signOut(); window.location.href = '/auth'; }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
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

                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><SettingsIcon size={14} /> Application Theme</label>
                        <select className="form-select" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} disabled>
                            <option>Dark Mode (Default)</option>
                        </select>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Theme customization coming soon.</p>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Globe size={14} /> Interface Language</label>
                        <select className="form-select" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} defaultValue="en">
                            <option value="en">English</option>
                            <option value="ms">Bahasa Melayu</option>
                            <option value="zh">中文 (Chinese)</option>
                            <option value="ta">தமிழ் (Tamil)</option>
                        </select>
                    </div>
                </div>

                {/* API Keys Settings */}
                <div className="card fade-in" style={{ marginBottom: 24, padding: 24 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: `var(--accent, #a855f7)20`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <Key size={18} color="var(--accent)" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>AI Configuration</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Connect your personal AI models.</p>
                        </div>
                    </div>

                    <div className="alert alert-info" style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <Shield size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <strong>Keys are stored locally.</strong> Your API keys never leave this browser and are only used to communicate directly with the AI providers.
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label>Groq API Key (Recommended)</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="gsk_..."
                            value={groqKey}
                            onChange={(e) => setGroqKey(e.target.value)}
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Used for lightning fast responses.</p>
                    </div>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label>Google Gemini API Key (Alternative)</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="AIzaSy..."
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                        />
                    </div>

                    <button className="btn btn-primary" onClick={saveKeys}>
                        {saved ? <><Check size={16} /> Saved Successfully</> : 'Save API Keys'}
                    </button>
                </div>


            </main>
            <MobileNav />
        </div>
    );
}
