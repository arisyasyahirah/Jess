import { useEffect, useState } from 'react';
import Sidebar, { MobileNav } from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Mail, BookOpen, CalendarCheck, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { NavLink } from 'react-router-dom';
// Storage import removed

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ emails: 0, assignments: 0, tasks: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    // API key is now managed via environment variables

    useEffect(() => {
        if (!user) return;
        const fetchStats = async () => {
            const emails = JSON.parse(localStorage.getItem('jess_emails') || '[]').filter(e => e.user_id === user.id).length;
            const assignments = JSON.parse(localStorage.getItem('jess_assignments') || '[]').filter(e => e.user_id === user.id).length;
            const tasks = JSON.parse(localStorage.getItem('jess_tasks') || '[]').filter(e => e.user_id === user.id && e.completed).length;

            setStats({ emails, assignments, tasks });
            setLoadingStats(false);
        };
        fetchStats();
    }, [user]);

    const statCards = [
        { label: 'Emails Drafted', value: stats.emails, icon: Mail, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
        { label: 'Assignments Scanned', value: stats.assignments, icon: BookOpen, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
        { label: 'Tasks Completed', value: stats.tasks, icon: CalendarCheck, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    ];

    const quickActions = [
        { to: '/email', icon: Mail, label: 'Draft an Email', desc: 'AI-powered email writing', color: '#6366f1' },
        { to: '/assignments', icon: BookOpen, label: 'Scan Assignment', desc: 'Break down any task', color: '#10b981' },
        { to: '/planner', icon: CalendarCheck, label: 'Plan My Day', desc: 'AI-organized schedule', color: '#f59e0b' },
    ];

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header fade-in">
                    <h1>{greeting()}, {user?.email?.split('@')[0]} 👋</h1>
                    <p>Here's your productivity overview for today.</p>
                </div>

                {/* API key is now configured via environment variables */}

                {/* Stats */}
                <div className="grid-3 fade-in" style={{ marginBottom: 32 }}>
                    {statCards.map(({ label, value, icon: Icon, color, bg }) => (
                        <div key={label} className="stat-card">
                            <div className="stat-icon" style={{ background: bg }}>
                                <Icon size={22} color={color} />
                            </div>
                            <div>
                                <div className="stat-value" style={{ color }}>
                                    {loadingStats ? '–' : value}
                                </div>
                                <div className="stat-label">{label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick actions */}
                <div style={{ marginBottom: 12 }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Zap size={18} color="var(--accent)" /> Quick Actions
                    </h2>
                    <div className="grid-3">
                        {quickActions.map(({ to, icon: Icon, label, desc, color }) => (
                            <NavLink
                                key={to} to={to}
                                style={{
                                    display: 'flex', flexDirection: 'column', gap: 12,
                                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius)', padding: 20, textDecoration: 'none',
                                    transition: 'all var(--transition)', cursor: 'pointer',
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = color}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                            >
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={22} color={color} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{label}</div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{desc}</div>
                                </div>
                                <ArrowRight size={16} color="var(--text-muted)" style={{ marginLeft: 'auto', marginTop: 'auto' }} />
                            </NavLink>
                        ))}
                    </div>
                </div>

                {/* Tagline */}
                <div className="card" style={{ marginTop: 32, textAlign: 'center', padding: '32px 24px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))', borderColor: 'rgba(99,102,241,0.2)' }}>
                    <Sparkles size={28} color="var(--accent)" style={{ marginBottom: 12 }} />
                    <h3 style={{ marginBottom: 8 }}>Built for you, not your data.</h3>
                    <p style={{ fontSize: '0.9375rem' }}>Jess runs with your own API key. Nothing is collected. Everything stays yours.</p>
                </div>
            </main>
            <MobileNav />
        </div>
    );
}
