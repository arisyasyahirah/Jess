import { useState, useEffect } from 'react';
import {
    CalendarPlus, Trash2, Edit2, Search, Filter,
    Download, Calendar as CalendarIcon, Clock, Tag,
    BookOpen, Briefcase, User, Bell
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const CATEGORIES = [
    { value: 'study', label: 'Study/Academic', icon: BookOpen, color: '#3b82f6' },
    { value: 'work', label: 'Work/Career', icon: Briefcase, color: '#f59e0b' },
    { value: 'personal', label: 'Personal', icon: User, color: '#10b981' },
    { value: 'other', label: 'Other', icon: Tag, color: '#6b7280' },
];

export default function FutureCalendar() {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, future, assignment, completed
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [draggedEvent, setDraggedEvent] = useState(null);
    const [calendarView, setCalendarView] = useState('month'); // '2week', 'month'

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        category: 'study',
        description: '',
        isRecurring: false,
        reminder: false
    });

    useEffect(() => {
        loadEvents();
        // Setup initial structure if missing
        if (!localStorage.getItem('jess_events')) localStorage.setItem('jess_events', '[]');
    }, []);

    const loadEvents = () => {
        const data = JSON.parse(localStorage.getItem('jess_events') || '[]');
        setEvents(data);
    };

    const saveEvents = (newEvents) => {
        localStorage.setItem('jess_events', JSON.stringify(newEvents));
        setEvents(newEvents);
    };

    // Form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.date) return;

        let updatedEvents = [...events];

        if (editingId) {
            updatedEvents = updatedEvents.map(ev =>
                ev.id === editingId ? { ...ev, ...formData } : ev
            );
        } else {
            const newEvent = {
                id: Math.random().toString(36).substr(2, 9),
                user_id: user?.id || 'guest',
                type: 'future',
                created_at: new Date().toISOString(),
                ...formData
            };
            updatedEvents.push(newEvent);

            // Handle basic recurring logic (adds 4 weeks out if true)
            if (formData.isRecurring) {
                for (let i = 1; i <= 4; i++) {
                    const nextDate = new Date(formData.date);
                    nextDate.setDate(nextDate.getDate() + (7 * i));
                    updatedEvents.push({
                        ...newEvent,
                        id: Math.random().toString(36).substr(2, 9),
                        date: nextDate.toISOString().split('T')[0],
                        has_parent_recurring: newEvent.id
                    });
                }
            }
        }

        saveEvents(updatedEvents);
        resetForm();
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({
            title: '',
            date: selectedDate,
            time: '',
            category: 'study',
            description: '',
            isRecurring: false,
            reminder: false
        });
    };

    const handleEdit = (ev) => {
        setFormData({
            title: ev.title || '',
            date: ev.date || '',
            time: ev.time || '',
            category: ev.category || 'study',
            description: ev.description || '',
            isRecurring: ev.isRecurring || false,
            reminder: ev.reminder || false
        });
        setEditingId(ev.id);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this event?")) {
            saveEvents(events.filter(e => e.id !== id));
        }
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events, null, 2));
        const anchor = document.createElement('a');
        anchor.href = dataStr;
        anchor.download = `jess_events_export_${new Date().toISOString().split('T')[0]}.json`;
        anchor.click();
    };

    // Drag and Drop Logic
    const handleDragStart = (e, eventItem) => {
        setDraggedEvent(eventItem);
        // Required for Firefox
        e.dataTransfer.setData('text/plain', eventItem.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, dropDate) => {
        e.preventDefault();
        if (draggedEvent && draggedEvent.date !== dropDate) {
            const updatedEvents = events.map(ev =>
                ev.id === draggedEvent.id ? { ...ev, date: dropDate } : ev
            );
            saveEvents(updatedEvents);
        }
        setDraggedEvent(null);
    };

    // Filter Logic
    const filteredEvents = events.filter(ev => {
        if (filterType !== 'all' && ev.type !== filterType) return false;
        if (searchQuery && !ev.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calendar Days Generation
    let calendarDays = [];
    if (calendarView === 'month') {
        const [year, month] = selectedDate.split('-').map(Number);
        const firstDayOfMonth = new Date(year, month - 1, 1);
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start at Sunday
        calendarDays = Array.from({ length: 42 }).map((_, i) => {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            return d.toISOString().split('T')[0];
        });
    } else {
        const viewStartDate = new Date(selectedDate);
        viewStartDate.setDate(viewStartDate.getDate() - viewStartDate.getDay()); // Start at Sunday
        calendarDays = Array.from({ length: 14 }).map((_, i) => {
            const d = new Date(viewStartDate);
            d.setDate(d.getDate() + i);
            return d.toISOString().split('T')[0];
        });
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 250 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: 34, width: '100%' }}
                        />
                    </div>
                    <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ width: 140 }}>
                        <option value="all">All Events</option>
                        <option value="future">Future Plans</option>
                        <option value="assignment">Assignments</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: 4, borderRadius: 8 }}>
                        <button className={`btn btn-sm ${calendarView === '2week' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCalendarView('2week')}>2 Weeks</button>
                        <button className={`btn btn-sm ${calendarView === 'month' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCalendarView('month')}>Month</button>
                    </div>
                    <button className="btn btn-secondary" onClick={handleExport}>
                        <Download size={16} /> Export
                    </button>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                        <CalendarPlus size={16} /> Add Plan
                    </button>
                </div>
            </div>

            {/* Event Form */}
            {showForm && (
                <div className="card fade-in" style={{ padding: 20, background: 'var(--bg-elevated)', border: '1px solid var(--accent)' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>{editingId ? 'Edit Event' : 'Create Future Plan'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Event Title *</label>
                                <input required type="text" className="form-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Final Exam / Project Due" />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select className="form-select" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label>Date *</label>
                                <input required type="date" className="form-input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Time (Optional)</label>
                                <input type="time" className="form-input" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Description (Optional)</label>
                            <textarea className="form-input" rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Extra details..."></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: 20 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input type="checkbox" checked={formData.isRecurring} onChange={e => setFormData({ ...formData, isRecurring: e.target.checked })} />
                                <span style={{ fontSize: '0.9rem' }}>Repeat Weekly (1 month)</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input type="checkbox" checked={formData.reminder} onChange={e => setFormData({ ...formData, reminder: e.target.checked })} />
                                <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Bell size={14} color="var(--accent)" /> Enable Notification
                                </span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                            <button type="submit" className="btn btn-primary">Save Event</button>
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Calendar Drag & Drop View */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                gap: 12, userSelect: 'none'
            }}>
                {calendarDays.map((dateStr) => {
                    const d = new Date(dateStr);
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    const isSelected = dateStr === selectedDate;
                    const isCurrentMonth = calendarView !== 'month' || d.getMonth() + 1 === parseInt(selectedDate.split('-')[1], 10);

                    const dayEvents = filteredEvents.filter(ev => ev.date === dateStr);

                    return (
                        <div
                            key={dateStr}
                            onClick={() => setSelectedDate(dateStr)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, dateStr)}
                            style={{
                                background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-secondary)',
                                border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                                borderRadius: 12, padding: 12, minHeight: calendarView === 'month' ? 140 : 120,
                                opacity: isCurrentMonth ? 1 : 0.4,
                                cursor: 'pointer', transition: 'all 0.2s',
                                position: 'relative'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isToday ? 'var(--accent)' : 'var(--text-muted)' }}>
                                    {d.toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div style={{
                                    fontSize: '1.2rem', fontWeight: 700,
                                    color: isToday ? '#fff' : 'var(--text-primary)',
                                    background: isToday ? 'var(--accent)' : 'transparent',
                                    width: 28, height: 28, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {d.getDate()}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {dayEvents.slice(0, calendarView === 'month' ? 3 : 10).map(ev => {
                                    const cat = CATEGORIES.find(c => c.value === ev.category);
                                    let badgeColor = cat ? cat.color : '#888';
                                    if (ev.type === 'assignment') badgeColor = '#ef4444';
                                    if (ev.type === 'completed') badgeColor = '#6b7280';

                                    return (
                                        <div
                                            key={ev.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, ev)}
                                            style={{
                                                background: `${badgeColor}20`,
                                                borderLeft: `3px solid ${badgeColor}`,
                                                padding: '6px 8px', borderRadius: '0 6px 6px 0',
                                                fontSize: '0.75rem', fontWeight: 500,
                                                color: 'var(--text-primary)', textDecoration: ev.type === 'completed' ? 'line-through' : 'none',
                                                cursor: 'grab', display: 'flex', flexDirection: 'column', gap: 2
                                            }}
                                            onClick={(e) => { e.stopPropagation(); handleEdit(ev); }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {ev.title}
                                                </span>
                                                {ev.reminder && <Bell size={10} color={badgeColor} style={{ flexShrink: 0 }} />}
                                            </div>
                                            {ev.time && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{ev.time}</span>}
                                        </div>
                                    )
                                })}
                                {calendarView === 'month' && dayEvents.length > 3 && (
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
                                        + {dayEvents.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Selected Day Details list */}
            <div className="card fade-in" style={{ marginTop: 12, padding: 24 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalendarIcon size={18} /> Schedule for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>

                {filteredEvents.filter(e => e.date === selectedDate).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No events mapped for this date. Try dragging an event here or adding a new plan.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {filteredEvents.filter(e => e.date === selectedDate).map(ev => {
                            const isCompleted = ev.type === 'completed';
                            return (
                                <div key={ev.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: 12, background: 'var(--bg-secondary)', borderRadius: 8,
                                    border: '1px solid var(--border)',
                                    opacity: isCompleted ? 0.6 : 1
                                }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 4px', textDecoration: isCompleted ? 'line-through' : 'none' }}>{ev.title}</h4>
                                        <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {ev.time && <span><Clock size={12} /> {ev.time}</span>}
                                            <span style={{ textTransform: 'capitalize' }}>Type: {ev.type}</span>
                                            {ev.category && <span style={{ textTransform: 'capitalize' }}>Cat: {ev.category}</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-sm btn-icon btn-secondary" onClick={() => handleEdit(ev)}><Edit2 size={16} /></button>
                                        <button className="btn btn-sm btn-icon btn-secondary" onClick={() => handleDelete(ev.id)} style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

        </div>
    );
}
