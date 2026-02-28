import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { callAI } from '../utils/aiService';
import { useAuth } from '../hooks/useAuth';
import { Copy, Check, BookOpen, ScanText, UploadCloud, FileText } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth/mammoth.browser';

// Set up PDF.js worker via CDN to avoid Vite/Vercel build issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const SUBJECTS = ['Mathematics', 'Computer Science', 'Business', 'Engineering', 'Science', 'Humanities', 'Law', 'Medicine', 'Other'];
const URGENCIES = [
    { value: 'low', label: '🟢 Low – 1+ week', color: '#10b981' },
    { value: 'medium', label: '🟡 Medium – 3-5 days', color: '#f59e0b' },
    { value: 'high', label: '🔴 High – 1-2 days', color: '#ef4444' },
];

export default function AssignmentScanner() {
    const { user } = useAuth();
    const [form, setForm] = useState({ title: '', subject: 'Computer Science', urgency: 'medium', rawText: '' });
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError('');

        try {
            let extractedText = '';

            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    extractedText += pageText + '\n\n';
                }
            } else if (file.name.endsWith('.docx')) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                extractedText = result.value;
            } else if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.csv')) {
                extractedText = await file.text();
            } else {
                throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
            }

            setForm(f => ({
                ...f,
                rawText: extractedText.trim(),
                title: f.title || file.name.replace(/\.[^/.]+$/, "")
            }));

        } catch (err) {
            setError('Error reading file: ' + err.message);
        } finally {
            setLoading(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleAnalyze = async (e) => {
        e.preventDefault();
        setError(''); setAnalysis('');
        if (form.rawText.trim().length < 20) { setError('Please paste your assignment text (at least 20 characters).'); return; }
        setLoading(true);
        try {
            const prompt = `You are an academic productivity assistant for Malaysian university students.

Analyze the following assignment and provide a structured breakdown:

Assignment Title: ${form.title || 'Untitled'}
Subject: ${form.subject}
Urgency: ${form.urgency} priority
Assignment Text:
"""
${form.rawText}
"""

Provide your analysis in this EXACT format:

## 📋 Assignment Summary
[2-3 sentence summary of what's required]

## ✅ Task Breakdown
[Numbered list of specific tasks to complete]

## ⏰ Suggested Timeline
[Day-by-day study plan based on urgency level]

## 📚 Key Topics to Study
[Bullet list of concepts/topics to review]

## 💡 Tips for Success
[2-3 specific study or writing tips]

## ⚠️ Watch Out For
[Common mistakes or tricky parts]`;

            const text = await callAI(prompt);
            setAnalysis(text);

            if (user) {
                const saved = JSON.parse(localStorage.getItem('jess_assignments') || '[]');
                saved.push({
                    id: Math.random().toString(36).substr(2, 9),
                    user_id: user.id,
                    title: form.title,
                    subject: form.subject,
                    urgency: form.urgency,
                    raw_text: form.rawText,
                    analysis: text,
                    created_at: new Date().toISOString()
                });
                localStorage.setItem('jess_assignments', JSON.stringify(saved));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(analysis);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="grid-2">
                    <div className="form-group">
                        <label htmlFor="assign-title">Assignment Title</label>
                        <input id="assign-title" type="text" placeholder="e.g. Data Structures Lab Report" value={form.title} onChange={e => handleChange('title', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="assign-subject">Subject</label>
                        <select id="assign-subject" value={form.subject} onChange={e => handleChange('subject', e.target.value)}>
                            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label>Urgency Level</label>
                    <div className="chip-group">
                        {URGENCIES.map(({ value, label, color }) => (
                            <button key={value} type="button" className={`chip${form.urgency === value ? ' active' : ''}`}
                                onClick={() => handleChange('urgency', value)}
                                style={form.urgency === value ? { borderColor: color, color } : {}}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label htmlFor="assign-text" style={{ margin: 0 }}>Paste or Upload Instructions <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <div>
                            <input
                                type="file"
                                id="file-upload"
                                accept=".txt,.md,.csv,.pdf,.docx"
                                style={{ display: 'none' }}
                                onChange={handleFileUpload}
                            />
                            <label
                                htmlFor="file-upload"
                                className="btn btn-sm btn-secondary"
                                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                                <UploadCloud size={14} /> Upload File
                            </label>
                        </div>
                    </div>
                    <textarea
                        id="assign-text"
                        rows={6}
                        placeholder="Paste your full assignment question here, or upload a document (.pdf, .docx, .txt)..."
                        value={form.rawText}
                        onChange={e => handleChange('rawText', e.target.value)}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {form.rawText.length} characters • Supported files: PDF, Word, TXT
                    </span>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
                    {loading ? <LoadingSpinner size="sm" /> : <><ScanText size={16} /> Analyze Assignment</>}
                </button>
            </form>

            {loading && (
                <div style={{ textAlign: 'center', padding: 32 }}>
                    <LoadingSpinner size="lg" label="Analyzing your assignment..." />
                </div>
            )}

            {analysis && (
                <div className="fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <BookOpen size={18} color="var(--accent)" /> Analysis Result
                            <span className="badge badge-success">Saved</span>
                        </h3>
                        <button className="btn btn-sm btn-secondary" onClick={copyToClipboard}>
                            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                        </button>
                    </div>
                    <div className="output-box" style={{ whiteSpace: 'pre-wrap' }}>{analysis}</div>
                </div>
            )}
        </div>
    );
}
