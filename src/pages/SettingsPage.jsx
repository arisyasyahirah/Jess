import { useState } from 'react';
import Sidebar, { MobileNav } from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { saveApiKey, getApiKey, clearApiKey } from '../utils/storage';
import { Key, Trash2, Check, AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';

const PROVIDERS = [
    {
        id: 'gemini',
        name: 'Google Gemini',
        label: 'Gemini API Key',
        placeholder: 'AIza...',
        docsUrl: 'https://aistudio.google.com/app/apikey',
        hint: 'Free tier available — 1,500 requests/day.',
        color: '#4285f4',
    },
    {
        id: 'groq',
        name: 'Groq',
        label: 'Groq API Key',
        placeholder: 'gsk_...',
        docsUrl: 'https://console.groq.com/keys',
        hint: 'Extremely fast inference. Free tier: 14,400 requests/day.',
        color: '#f55036',
    },
];

function ProviderCard({ provider }) {
    const [value, setValue] = useState(getApiKey(provider.id));
    const [saved, setSaved] = useState(!!getApiKey(provider.id));
    const [show, setShow] = useState(false);
    const [flash, setFlash] = useState(null); // 'saved' | 'cleared'

    const handleSave = () => {
        if (!value.trim()) return;
        saveApiKey(provider.id, value.trim());
        setSaved(true);
        setFlash('saved');
        setTimeout(() => setFlash(null), 2000);
    };

    const handleClear = () => {
        clearApiKey(provider.id);
        setValue('');
        setSaved(false);
        setFlash('cleared');
        setTimeout(() => setFlash(null), 2000);
    };

    return (
        <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${provider.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <Key size={18} color={provider.color} />
                </div>
                <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{provider.name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{provider.hint}</div>
                </div>
                {saved && (
                    <span className="badge badge-success" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                        <Check size={12} style={{ marginRight: 4 }} /> Active
                    </span>
                )}
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
                <label htmlFor={`key-${provider.id}`}>{provider.label}</label>
                <div style={{ position: 'relative' }}>
                    <input
                        id={`key-${provider.id}`}
                        type={show ? 'text' : 'password'}
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        placeholder={provider.placeholder}
                        style={{ paddingRight: 44 }}
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                    />
                    <button
                        type="button"
                        className="btn btn-icon btn-ghost"
                        onClick={() => setShow(s => !s)}
                        style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', padding: 6 }}
                        title={show ? 'Hide key' : 'Show key'}
                    >
                        {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!value.trim()}>
                    <Check size={14} /> Save Key
                </button>
                {saved && (
                    <button className="btn btn-danger btn-sm" onClick={handleClear}>
                        <Trash2 size={14} /> Clear
                    </button>
                )}
                <a
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ marginLeft: 'auto' }}
                >
                    Get API Key →
                </a>
            </div>

            {flash === 'saved' && (
                <div className="alert alert-success" style={{ marginTop: 12 }}>
                    ✅ API key saved to browser storage.
                </div>
            )}
            {flash === 'cleared' && (
                <div className="alert alert-warning" style={{ marginTop: 12 }}>
                    🗑️ API key cleared.
                </div>
            )}
        </div>
    );
}

export default function SettingsPage() {
    const { user, signOut } = useAuth();

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header fade-in">
                    <h1>Settings</h1>
                    <p>Manage your API keys and account preferences.</p>
                </div>

                {/* Privacy notice */}
                <div className="alert alert-info fade-in" style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Shield size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                        <strong>Your keys never leave your browser.</strong> API keys are stored only in your browser's localStorage and are sent directly to the AI provider — Jess never sees them.
                    </div>
                </div>

                {/* Provider cards */}
                <div className="fade-in">
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>AI Provider Keys</h2>
                    {PROVIDERS.map(p => <ProviderCard key={p.id} provider={p} />)}
                </div>

                {/* How to use note */}
                <div className="card fade-in" style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <AlertCircle size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>Which provider to use?</div>
                            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.8, paddingLeft: 16 }}>
                                <li><strong>Gemini</strong> — Best for detailed, nuanced outputs. Get a key free at Google AI Studio.</li>
                                <li><strong>Groq</strong> — Blazing fast responses. Great for quick tasks and planning. Free tier is generous.</li>
                                <li>Jess will use whichever key is saved. Gemini takes priority if both are present.</li>
                            </ul>
                        </div>
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
