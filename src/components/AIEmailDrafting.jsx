import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { callAI } from '../utils/aiService';
import { useAuth } from '../hooks/useAuth';
import { Copy, Check, Mail, Wand2 } from 'lucide-react';
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

            // Save to Supabase
            if (user) {
                await supabase.from('jess_emails').insert({
                    user_id: user.id,
                    subject: form.subject,
                    recipient: form.recipient,
                    tone: form.tone,
                    key_points: form.keyPoints,
                    draft_text: text,
                });
                setSaved(true);
            }
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
    );
}
