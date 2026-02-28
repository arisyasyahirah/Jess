import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { callAI } from '../utils/aiService';
import { useAuth } from '../hooks/useAuth';
import { Plus, Trash2, Check, CalendarDays, Wand2, Copy } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function DailyPlanner() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Date + progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '0 0 auto' }}>
                    <label htmlFor="plan-date">Date</label>
                    <input id="plan-date" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 'auto' }} />
                </div>
                {tasks.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                        <span className="badge badge-accent">{completedCount}/{tasks.length} done</span>
                    </div>
                )}
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
