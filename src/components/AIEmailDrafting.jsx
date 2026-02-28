import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { callAI } from '../utils/aiService';
import { useAuth } from '../hooks/useAuth';
import { Copy, Check, Mail, Wand2, History, RotateCcw, Trash2, Send } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const TONES = ['Professional', 'Formal', 'Friendly', 'Casual', 'Apologetic', 'Persuasive'];

export default function AIEmailDrafting() {
    const { user } = useAuth();
    const [form, setForm] = useState({ recipient: '', subject: '', tone: 'Professional', keyPoints: '' });
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState('compose');
    const [history, setHistory] = useState([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = () => {
        const savedData = JSON.parse(localStorage.getItem('jess_emails') || '[]');
        savedData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setHistory(savedData);
    };

    const handleRestore = (item) => {
        setForm({
            recipient: item.recipient || '',
            subject: item.subject || '',
            tone: item.tone || 'Professional',
            keyPoints: item.key_points || ''
        });
        setDraft(item.draft_text || '');
        setActiveTab('compose');
    };

    const handleMarkSent = (id) => {
        const savedData = JSON.parse(localStorage.getItem('jess_emails') || '[]');
        const updated = savedData.map(item => item.id === id ? { ...item, status: 'Sent' } : item);
        localStorage.setItem('jess_emails', JSON.stringify(updated));
        loadHistory();
    };

    const handleDelete = (id) => {
        const savedData = JSON.parse(localStorage.getItem('jess_emails') || '[]');
        const updated = savedData.filter(item => item.id !== id);
        localStorage.setItem('jess_emails', JSON.stringify(updated));
        loadHistory();
    };

    const handleChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleDraft = async (e) => {
        e.preventDefault();
        setError(''); setDraft(''); setSaved(false);
        if (!form.keyPoints.trim()) { setError('Please enter key points for the email.'); return; }
        setLoading(true);
        try {
            const prompt = `You are an expert email writer optimized for Malaysian university students and young professionals.

Write a ${form.tone.toLowerCase()} email with the following details:
- To: ${form.recipient || 'the recipient'}
- Subject: ${form.subject || 'as appropriate'}
- Key points to cover: ${form.keyPoints}

Requirements:
1. Write a complete, ready-to-send email (include greeting, body, closing, signature placeholder)
2. Tone: ${form.tone}
3. Keep it concise but complete
4. Use clear, professional Malaysian English
5. No extra commentary — just the email content.`;

            const text = await callAI(prompt);
            setDraft(text);

            // Save to LocalStorage
            const newDraft = {
                id: Math.random().toString(36).substr(2, 9),
                user_id: user?.id || 'guest',
                subject: form.subject,
                recipient: form.recipient,
                tone: form.tone,
                key_points: form.keyPoints,
                draft_text: text,
                status: 'Draft',
                created_at: new Date().toISOString()
            };
            const savedData = JSON.parse(localStorage.getItem('jess_emails') || '[]');
            savedData.push(newDraft);
            localStorage.setItem('jess_emails', JSON.stringify(savedData));
            setSaved(true);
            loadHistory();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(draft);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
                <button
                    className={`btn ${activeTab === 'compose' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('compose')}
                    style={activeTab === 'compose' ? {} : { border: 'none', background: 'transparent' }}
                >
                    <Mail size={16} /> Compose
                </button>
                <button
                    className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('history')}
                    style={activeTab === 'history' ? {} : { border: 'none', background: 'transparent' }}
                >
                    <History size={16} /> Draft History
                </button>
            </div>

            {activeTab === 'compose' && (
                <div className="fade-in">
                    <form onSubmit={handleDraft} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="grid-2">
                            <div className="form-group">
                                <label htmlFor="email-recipient">Recipient / To</label>
                                <input id="email-recipient" type="text" placeholder="Prof. Ahmad, HR Team, Client..." value={form.recipient} onChange={e => handleChange('recipient', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email-subject">Subject</label>
                                <input id="email-subject" type="text" placeholder="Leave application, Project update..." value={form.subject} onChange={e => handleChange('subject', e.target.value)} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Tone</label>
                            <div className="chip-group">
                                {TONES.map(t => (
                                    <button key={t} type="button" className={`chip${form.tone === t ? ' active' : ''}`} onClick={() => handleChange('tone', t)}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email-keypoints">Key Points <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <textarea
                                id="email-keypoints"
                                rows={4}
                                placeholder="e.g. Apply for 3 days medical leave next week, have MC from clinic, project will be covered by colleague Ali..."
                                value={form.keyPoints}
                                onChange={e => handleChange('keyPoints', e.target.value)}
                            />
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}

                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
                            {loading ? <LoadingSpinner size="sm" /> : <><Wand2 size={16} /> Draft Email</>}
                        </button>
                    </form>

                    {/* Output */}
                    {draft && (
                        <div className="fade-in">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Mail size={18} color="var(--accent)" /> Generated Draft
                                    {saved && <span className="badge badge-success" style={{ marginLeft: 8 }}>Saved</span>}
                                </h3>
                                <button className="btn btn-sm btn-secondary" onClick={copyToClipboard}>
                                    {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                                </button>
                            </div>
                            <div className="output-box">{draft}</div>
                        </div>
                    )}

                    {loading && (
                        <div style={{ textAlign: 'center', padding: 32 }}>
                            <LoadingSpinner size="lg" label="Drafting your email..." />
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="fade-in">
                    {history.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                            <History size={48} opacity={0.2} style={{ marginBottom: 16 }} />
                            <p>No email drafts yet. Start composing to save history!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {history.map(item => (
                                <div key={item.id} className="card" style={{ padding: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{item.subject || 'No Subject'}</h4>
                                            <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                <span>To: {item.recipient || 'N/A'}</span>
                                                <span>•</span>
                                                <span>{new Date(item.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <span className={`badge ${item.status === 'Sent' ? 'badge-success' : 'badge-primary'}`}>
                                            {item.status || 'Draft'}
                                        </span>
                                    </div>
                                    <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8, fontSize: '0.85rem', marginBottom: 16, maxHeight: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.draft_text}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-sm btn-primary" onClick={() => handleRestore(item)}>
                                            <RotateCcw size={14} /> Restore
                                        </button>
                                        {item.status !== 'Sent' && (
                                            <button className="btn btn-sm btn-secondary" onClick={() => handleMarkSent(item.id)}>
                                                <Send size={14} /> Mark Sent
                                            </button>
                                        )}
                                        <button className="btn btn-sm btn-secondary" onClick={() => handleDelete(item.id)} style={{ color: 'var(--danger)', marginLeft: 'auto' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
