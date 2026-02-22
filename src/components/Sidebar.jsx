import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Mail, BookOpen, CalendarDays,
    Settings, LogOut, Sparkles
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/email', icon: Mail, label: 'Email Drafting' },
    { to: '/assignments', icon: BookOpen, label: 'Assignments' },
    { to: '/planner', icon: CalendarDays, label: 'Daily Planner' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
    const { user, signOut, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/auth');
    };

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, padding: '0 4px' }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <Sparkles size={18} color="#fff" />
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' }}>Jess</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: -2 }}>AI Assistant</div>
                </div>
            </div>

            {/* Nav links */}
            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                    >
                        <Icon size={18} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User + logout */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
                <div style={{ padding: '0 4px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Signed in as</div>
                        {isAdmin && (
                            <span style={{
                                fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.05em',
                                background: 'var(--accent-soft)', color: 'var(--accent)',
                                padding: '1px 6px', borderRadius: 999, textTransform: 'uppercase'
                            }}>Owner</span>
                        )}
                    </div>
                    <div style={{
                        fontSize: '0.8125rem', color: 'var(--text-secondary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                        {user?.email}
                    </div>
                </div>
                <button className="nav-item btn-ghost" onClick={handleSignOut} style={{ width: '100%', border: 'none', cursor: 'pointer' }}>
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}

/* Mobile bottom nav */
export function MobileNav() {
    const { signOut } = useAuth();
    const navigate = useNavigate();

    const mobileItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
        { to: '/email', icon: Mail, label: 'Email' },
        { to: '/assignments', icon: BookOpen, label: 'Assign' },
        { to: '/planner', icon: CalendarDays, label: 'Planner' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="mobile-nav">
            <div className="nav-row">
                {mobileItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}
                    >
                        <Icon size={22} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </div>
        </div>
    );
}
