import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { callAI } from '../utils/aiService';
import { useAuth } from '../hooks/useAuth';
import { Plus, Trash2, Check, CalendarDays, Wand2, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function DailyPlanner() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [date, setDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [weekOffset, setWeekOffset] = useState(0);
    const [schedule, setSchedule] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // Load tasks from LocalStorage for testing
    useEffect(() => {
        if (!user) return;
        const fetchTasks = async () => {
            setLoadingTasks(true);
            const saved = localStorage.getItem('jess_tasks');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    const todaysTasks = parsed.filter(t => t.user_id === user.id && t.task_date === date);
                    setTasks(todaysTasks.sort((a, b) => a.priority - b.priority));
                } catch (e) { }
            }
            setLoadingTasks(false);
        };
        fetchTasks();
    }, [user, date]);

    const saveTasksToLocal = (newTasks) => {
        const saved = JSON.parse(localStorage.getItem('jess_tasks') || '[]');
        // remove old tasks for this date & user
        const otherTasks = saved.filter(t => !(t.user_id === user.id && t.task_date === date));
        localStorage.setItem('jess_tasks', JSON.stringify([...otherTasks, ...newTasks]));
    };

    const addTask = async () => {
        if (!newTask.trim()) return;
        const task = {
            id: Math.random().toString(36).substr(2, 9),
            user_id: user.id,
            task_date: date,
            title: newTask.trim(),
            completed: false,
            priority: tasks.length,
        };
        const newTasks = [...tasks, task];
        setTasks(newTasks);
        saveTasksToLocal(newTasks);
        setNewTask('');
    };

    const toggleTask = async (id, completed) => {
        const newTasks = tasks.map(task => task.id === id ? { ...task, completed: !completed } : task);
        setTasks(newTasks);
        saveTasksToLocal(newTasks);

        // Sync to unified Calendar if newly completed
        if (!completed) {
            const task = tasks.find(t => t.id === id);
            if (task) {
                const events = JSON.parse(localStorage.getItem('jess_events') || '[]');
                events.push({
                    id: Math.random().toString(36).substr(2, 9),
                    user_id: user?.id || 'guest',
                    type: 'completed',
                    date: date, // Same as daily planner date
                    title: task.title,
                    category: 'study', // Default fallback
                    description: 'Marked as completed from Daily Planner.',
                    created_at: new Date().toISOString()
                });
                localStorage.setItem('jess_events', JSON.stringify(events));
            }
        }
    };

    const deleteTask = async (id) => {
        const newTasks = tasks.filter(task => task.id !== id);
        setTasks(newTasks);
        saveTasksToLocal(newTasks);
    };

    const generateSchedule = async () => {
        if (tasks.length === 0) { setError('Add at least one task before generating a schedule.'); return; }
        setError(''); setSchedule(''); setLoading(true);
        try {
            const taskList = tasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n');
            const prompt = `You are a productivity coach for a Malaysian university student or young professional.

Date: ${date}
Tasks for today:
${taskList}

Create a realistic, time-blocked daily schedule. Requirements:
1. Organize tasks by priority (most important/urgent first)
2. Include specific time blocks (e.g., 9:00 AM - 10:30 AM)
3. Add short breaks (5-15 min) between focus sessions
4. Include a lunch break
5. Account for typical Malaysian student schedule (classes, transport, etc.)
6. End by 10 PM

Format your response as:
## 📅 Your AI-Powered Day Plan for ${date}

[Time-blocked schedule with emojis]

## 🎯 Priority Order
[Ranked list with reasoning]

## 💪 Motivational Tip
[One short, specific tip for today]`;

            const text = await callAI(prompt);
            setSchedule(text);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copySchedule = () => {
        navigator.clipboard.writeText(schedule);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const completedCount = tasks.filter(t => t.completed).length;

    const currentDate = new Date();
    const currentDayOfWeek = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1; // 0=Mon, 6=Sun
    const startOfCurrentWeek = new Date(currentDate);
    startOfCurrentWeek.setDate(currentDate.getDate() - currentDayOfWeek);
    startOfCurrentWeek.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(startOfCurrentWeek);
    startOfWeek.setDate(startOfWeek.getDate() + (weekOffset * 7));

    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        return d;
    });

    const isToday = (d) => {
        const today = new Date();
        return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Custom Calendar Strip */}
            <div className="card fade-in" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CalendarDays size={18} color="var(--accent)" />
                        {startOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    {tasks.length > 0 && (
                        <span className="badge badge-accent fade-in">{completedCount}/{tasks.length} tasks done</span>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <button className="btn btn-icon btn-secondary" onClick={() => setWeekOffset(o => o - 1)} style={{ flexShrink: 0 }}>
                        <ChevronLeft size={18} />
                    </button>

                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                        {weekDays.map(d => {
                            const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                            const isSelected = date === dStr;
                            const isCurrDay = isToday(d);

                            return (
                                <button
                                    key={dStr}
                                    onClick={() => setDate(dStr)}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        minWidth: 50, height: 64, borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                        background: isSelected ? 'var(--primary)' : (isCurrDay ? 'var(--bg-secondary)' : 'transparent'),
                                        color: isSelected ? '#fff' : 'var(--text-primary)',
                                        position: 'relative', outline: isCurrDay && !isSelected ? '1px solid var(--border)' : 'none'
                                    }}
                                >
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', opacity: isSelected ? 0.9 : 0.6 }}>
                                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 2 }}>
                                        {d.getDate()}
                                    </span>
                                    {isCurrDay && (
                                        <div style={{ position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#fff' : 'var(--accent)' }} />
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    <button className="btn btn-icon btn-secondary" onClick={() => setWeekOffset(o => o + 1)} style={{ flexShrink: 0 }}>
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Add task */}
            <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Add Task</label>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="text"
                        placeholder="e.g. Finish assignment, Reply emails, Study chapter 5..."
                        value={newTask}
                        onChange={e => setNewTask(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addTask()}
                        style={{ flex: 1 }}
                    />
                    <button className="btn btn-primary" onClick={addTask} disabled={!newTask.trim()}>
                        <Plus size={16} /> Add
                    </button>
                </div>
            </div>

            {/* Task list */}
            <div>
                {loadingTasks ? (
                    <LoadingSpinner size="md" label="Loading tasks..." />
                ) : tasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                        <CalendarDays size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                        <p>No tasks yet. Add your first task above!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {tasks.map(task => (
                            <div key={task.id}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-sm)', padding: '12px 14px',
                                    opacity: task.completed ? 0.6 : 1, transition: 'opacity 0.2s',
                                }}>
                                <button
                                    onClick={() => toggleTask(task.id, task.completed)}
                                    style={{
                                        width: 22, height: 22, borderRadius: 6, border: '2px solid',
                                        borderColor: task.completed ? 'var(--success)' : 'var(--border)',
                                        background: task.completed ? 'var(--success)' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                                    }}
                                >
                                    {task.completed && <Check size={13} color="#fff" />}
                                </button>
                                <span style={{
                                    flex: 1, fontSize: '0.9375rem',
                                    textDecoration: task.completed ? 'line-through' : 'none',
                                    color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                                }}>
                                    {task.title}
                                </span>
                                <button className="btn btn-icon btn-ghost" onClick={() => deleteTask(task.id)} style={{ color: 'var(--text-muted)' }}>
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {/* Generate AI schedule */}
            <button
                className="btn btn-primary"
                onClick={generateSchedule}
                disabled={loading || tasks.length === 0}
                style={{ alignSelf: 'flex-start' }}
            >
                {loading ? <LoadingSpinner size="sm" /> : <><Wand2 size={16} /> Generate AI Schedule</>}
            </button>

            {loading && (
                <div style={{ textAlign: 'center', padding: 32 }}>
                    <LoadingSpinner size="lg" label="Building your optimal schedule..." />
                </div>
            )}

            {/* Schedule output */}
            {schedule && (
                <div className="fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CalendarDays size={18} color="var(--accent)" /> AI Schedule
                        </h3>
                        <button className="btn btn-sm btn-secondary" onClick={copySchedule}>
                            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                        </button>
                    </div>
                    <div className="output-box">{schedule}</div>
                </div>
            )}
        </div>
    );
}
