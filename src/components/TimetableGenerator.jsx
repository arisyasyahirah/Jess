import { useState, useRef } from 'react';
import { Upload, Calendar as CalendarIcon, FileText, Check, AlertCircle, Edit2, Trash2, Plus, GripHorizontal, ArrowRight, LayoutGrid, List, Download, User, Clock } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import * as pdfjsLib from 'pdfjs-dist';
import { callAI } from '../utils/aiService';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Example of parsed shape:
// { id, courseCode, courseName, timeStart: '10:00', timeEnd: '12:00', day: 'Monday', location: 'Room A', type: 'Lecture' }

export function TimetableGenerator() {
    const fileInputRef = useRef(null);
    const [step, setStep] = useState(3); // 1 = Upload, 2 = Verify, 3 = render Dual View
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // State
    const [rawInput, setRawInput] = useState('');
    const [parsedClasses, setParsedClasses] = useState([
        { id: 'sample1', courseCode: 'CSF3013', courseName: 'STRUKTUR DATA DAN A', timeStart: '08:00', timeEnd: '11:00', day: 'Monday', location: 'MP2', type: 'Lecture', instructor: 'TBD' },
        { id: 'sample2', courseCode: 'CSF3123', courseName: 'PANGKALAN DATA', timeStart: '11:00', timeEnd: '13:00', day: 'Monday', location: 'BK5-02', type: 'Lecture', instructor: 'TBD' },
        { id: 'sample3', courseCode: 'CSF3133', courseName: 'REKA BENTUK ANTARA', timeStart: '08:00', timeEnd: '12:00', day: 'Monday', location: 'DS2/MP1', type: 'Lecture', instructor: 'TBD' }
    ]);
    const [selectedClass, setSelectedClass] = useState(null);

    // View Options
    const [viewMode, setViewMode] = useState('horizontal'); // horizontal, vertical
    const [showWeekends, setShowWeekends] = useState(true);
    const [timeRange, setTimeRange] = useState([8, 20]); // 8 AM to 8 PM

    const HOURS = Array.from({ length: timeRange[1] - timeRange[0] + 1 }).map((_, i) => i + timeRange[0]);
    const DAYS = showWeekends
        ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Specific Color Palette
    const COURSE_COLORS = {
        'CSF3013': '#e6f3ff', // Light blue
        'CSF3123': '#e8f5e9', // Soft green
        'CSF3133': '#f0e6ff'  // Gentle lavender
    };

    const getCourseColor = (courseCode) => {
        if (COURSE_COLORS[courseCode]) return COURSE_COLORS[courseCode];
        const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];
        let hash = 0;
        for (let i = 0; i < courseCode.length; i++) {
            hash = courseCode.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };


    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setError('');
        try {
            let extractedText = '';

            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + ' \n';
                }
                extractedText = fullText;
            } else if (file.type.startsWith('image/')) {
                throw new Error("Image scanning requires OCR. Please supply the raw text schedule or upload a PDF for now.");
            } else {
                const text = await file.text();
                extractedText = text;
            }

            setRawInput(extractedText);
            await extractSchedule(extractedText);

        } catch (err) {
            setError(err.message || 'Failed to parse the file.');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleTextSubmit = async () => {
        if (!rawInput.trim()) {
            setError("Please paste a schedule first.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            await extractSchedule(rawInput);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const extractSchedule = async (text) => {
        const prompt = `
            You are a timetable data extractor. I have provided raw text representing a university or school schedule.
            Extract EVERY class session available. 
            Map each to exactly this JSON Array format (DO NOT WRAP IN BACKTICKS OR MARKDOWN, purely return RAW JSON array):
            [
              {
                "id": "${Math.random().toString(36).substr(2, 9)}",
                "courseCode": "e.g. CS101",
                "courseName": "e.g. Intro to Computer Science",
                "timeStart": "e.g. 10:00 (24h format HH:mm)",
                "timeEnd": "e.g. 12:00 (24h format HH:mm)",
                "day": "e.g. Monday (Full Day name)",
                "location": "e.g. Room 301",
                "type": "e.g. Lecture or Tutorial or Lab",
                "instructor": "e.g. Dr. Jane"
              }
            ]

            If you cannot find a specific field, leave it as an empty string "".
            Raw Schedule Text:
            """
            ${text}
            """
        `;

        const response = await callAI(prompt);
        let cleaned = response.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
        else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();

        try {
            const data = JSON.parse(cleaned);
            const mapped = data.map(d => {
                // Normalize Day
                let normalizedDay = d.day || 'Monday';
                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const matched = days.find(day => normalizedDay.toLowerCase().includes(day.toLowerCase().substring(0, 3)));
                if (matched) normalizedDay = matched;

                return { ...d, day: normalizedDay, id: Math.random().toString(36).substr(2, 9) };
            });
            setParsedClasses(mapped);
            setStep(3); // Go straight to grid so user sees results
        } catch (e) {
            throw new Error("AI failed to extract schedule accurately. Please try editing the text manually.");
        }
    };

    const handleUpdateClass = (id, field, value) => {
        setParsedClasses(parsedClasses.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const handleDeleteClass = (id) => {
        setParsedClasses(parsedClasses.filter(c => c.id !== id));
    };

    const handleAddBlankClass = () => {
        setParsedClasses([{
            id: Math.random().toString(36).substr(2, 9),
            courseCode: '', courseName: 'New Class', timeStart: '08:00', timeEnd: '09:00',
            day: 'Monday', location: '', type: 'Lecture', instructor: ''
        }, ...parsedClasses]);
    };

    const startDualViewMode = () => {
        if (parsedClasses.length === 0) {
            setError("No classes found. Please add a class to proceed.");
            return;
        }
        setStep(3);
    };

    const handleExportCSV = () => {
        const headers = ["Course Code", "Course Name", "Day", "Start", "End", "Location", "Type", "Instructor"];
        const rows = parsedClasses.map(c => [
            c.courseCode, c.courseName, c.day, c.timeStart, c.timeEnd, c.location, c.type, c.instructor
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(r => r.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "jess_timetable.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSyncToPlanner = () => {
        const events = JSON.parse(localStorage.getItem('jess_events') || '[]');
        const dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };

        parsedClasses.forEach(cls => {
            const dayOfWk = dayMap[cls.day] ?? 1;
            let d = new Date();
            d.setDate(d.getDate() + (dayOfWk + 7 - d.getDay()) % 7);

            for (let i = 0; i < 15; i++) {
                const evDate = new Date(d);
                evDate.setDate(evDate.getDate() + (i * 7));

                events.push({
                    id: Math.random().toString(36).substr(2, 9),
                    user_id: 'guest',
                    type: 'future',
                    date: evDate.toISOString().split('T')[0],
                    time: cls.timeStart,
                    title: `${cls.courseCode} - ${cls.type}`,
                    category: 'study',
                    description: `${cls.courseName}\nLocation: ${cls.location}\nInstructor: ${cls.instructor}`,
                    created_at: new Date().toISOString()
                });
            }
        });

        localStorage.setItem('jess_events', JSON.stringify(events));
        alert("Successfully synced all Timetable classes to your Future Planner for the next 15 weeks!");
    };

    const parseTime = (timeStr) => {
        if (!timeStr) return 0;
        // Handle "11:00 am" or "2pm" or "14:00"
        const clean = timeStr.toLowerCase().trim();
        const isPM = clean.includes('pm') && !clean.includes('12');
        const is12PM = clean.includes('12pm');
        const is12AM = clean.includes('12am');

        let [timePart] = clean.split(/[ap]m/);
        let [h, m] = timePart.includes(':') ? timePart.split(':').map(Number) : [Number(timePart), 0];

        if (isPM) h += 12;
        if (is12AM) h = 0;
        if (is12PM) h = 12;

        return h + (m / 60);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
            {error && (
                <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {step === 1 && (
                <div className="card fade-in" style={{ padding: 32, textAlign: 'center' }}>
                    <div style={{ maxWidth: 600, margin: '0 auto' }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: 16, background: 'var(--accent-soft)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                            color: 'var(--accent)'
                        }}>
                            <CalendarIcon size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: 12 }}>Import Schedule</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
                            Upload your timetable PDF or paste the raw schedule text. Jess AI will instantly parse the dates, times, and classes to build your interactive timetable.
                        </p>

                        <input
                            type="file"
                            accept=".pdf,.txt"
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />

                        <div className="form-group" style={{ textAlign: 'left', marginBottom: 20 }}>
                            <label>Drop raw text timetable here:</label>
                            <textarea
                                className="form-input"
                                rows={6}
                                value={rawInput}
                                onChange={(e) => setRawInput(e.target.value)}
                                placeholder="Paste the schedule copy-pasted straight from your student portal..."
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                                <FileText size={18} /> {loading ? 'Processing Document...' : 'Upload PDF / Text File'}
                            </button>
                            <button className="btn btn-primary" onClick={handleTextSubmit} disabled={loading || !rawInput.trim()}>
                                {loading ? <LoadingSpinner size="sm" /> : <><ArrowRight size={18} /> Analyze Text</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="card fade-in" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <h2 style={{ margin: '0 0 8px' }}>Verify Extracted Data</h2>
                            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Review and edit AI-extracted classes before generating your timetable.</p>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary" onClick={() => setStep(1)}>Back to Upload</button>
                            <button className="btn btn-primary" onClick={startDualViewMode}>
                                <Check size={18} /> Confirm & Generate Schedule
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <button className="btn btn-secondary btn-sm" onClick={handleAddBlankClass}>
                            <Plus size={16} /> Add Missing Class
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                                    <th style={{ padding: 12 }}>Code</th>
                                    <th style={{ padding: 12 }}>Course Name</th>
                                    <th style={{ padding: 12 }}>Day</th>
                                    <th style={{ padding: 12 }}>Start Time</th>
                                    <th style={{ padding: 12 }}>End Time</th>
                                    <th style={{ padding: 12 }}>Location</th>
                                    <th style={{ padding: 12 }}>Type</th>
                                    <th style={{ padding: 12, width: 50 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedClasses.map((cls) => (
                                    <tr key={cls.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: 8 }}><input type="text" className="form-input" style={{ padding: 6, width: '100%', minWidth: 60 }} value={cls.courseCode} onChange={e => handleUpdateClass(cls.id, 'courseCode', e.target.value)} /></td>
                                        <td style={{ padding: 8 }}><input type="text" className="form-input" style={{ padding: 6, width: '100%', minWidth: 120 }} value={cls.courseName} onChange={e => handleUpdateClass(cls.id, 'courseName', e.target.value)} /></td>
                                        <td style={{ padding: 8 }}>
                                            <select
                                                className="form-select"
                                                style={{ padding: 6 }}
                                                value={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].find(d => (cls.day || '').toLowerCase().includes(d.toLowerCase().substring(0, 3))) || 'Monday'}
                                                onChange={e => handleUpdateClass(cls.id, 'day', e.target.value)}
                                            >
                                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </td>
                                        <td style={{ padding: 8 }}><input type="time" className="form-input" style={{ padding: 6 }} value={cls.timeStart} onChange={e => handleUpdateClass(cls.id, 'timeStart', e.target.value)} /></td>
                                        <td style={{ padding: 8 }}><input type="time" className="form-input" style={{ padding: 6 }} value={cls.timeEnd} onChange={e => handleUpdateClass(cls.id, 'timeEnd', e.target.value)} /></td>
                                        <td style={{ padding: 8 }}><input type="text" className="form-input" style={{ padding: 6, width: '100%' }} value={cls.location} onChange={e => handleUpdateClass(cls.id, 'location', e.target.value)} /></td>
                                        <td style={{ padding: 8 }}><input type="text" className="form-input" style={{ padding: 6, width: '100%' }} value={cls.type} onChange={e => handleUpdateClass(cls.id, 'type', e.target.value)} /></td>
                                        <td style={{ padding: 8, textAlign: 'center' }}>
                                            <button className="btn btn-icon btn-ghost" onClick={() => handleDeleteClass(cls.id)} style={{ color: 'var(--danger)' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {parsedClasses.length === 0 && (
                            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                                No classes detected. Please add them manually or upload a clearer file.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ display: 'flex', gap: 8, background: 'var(--bg-secondary)', padding: 4, borderRadius: 8 }}>
                            <button className={`btn btn-sm ${viewMode === 'horizontal' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('horizontal')}>
                                <LayoutGrid size={16} /> Horizontal View
                            </button>
                            <button className={`btn btn-sm ${viewMode === 'vertical' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('vertical')}>
                                <List size={16} /> Vertical View
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <select className="form-select btn-sm" value={`${timeRange[0]}-${timeRange[1]}`} onChange={(e) => { const [s, f] = e.target.value.split('-').map(Number); setTimeRange([s, f]); }} style={{ width: 'auto' }}>
                                <option value="8-20">8 AM - 8 PM</option>
                                <option value="7-22">7 AM - 10 PM</option>
                                <option value="9-17">9 AM - 5 PM</option>
                            </select>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={showWeekends} onChange={e => setShowWeekends(e.target.checked)} /> Weekends
                            </label>
                            <button className="btn btn-secondary btn-sm" onClick={() => setStep(2)}>
                                <Edit2 size={16} /> Edit
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
                                <Download size={16} /> CSV
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={handleSyncToPlanner} style={{ background: 'var(--accent)' }}>
                                <CalendarIcon size={16} /> Sync to Planner
                            </button>
                        </div>
                    </div>

                    {viewMode === 'horizontal' && (
                        <div className="card" style={{ padding: 24, overflow: 'auto', background: 'var(--bg-elevated)', maxHeight: '70vh' }}>
                            <div style={{ minWidth: 1000, position: 'relative' }}>
                                <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 100 }}>
                                    <div style={{ width: 100, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'sticky', left: 0, zIndex: 110 }} />
                                    {DAYS.map(d => (
                                        <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', padding: 16, borderLeft: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                                            {d}
                                        </div>
                                    ))}
                                </div>
                                {HOURS.map(hour => (
                                    <div key={hour} style={{ display: 'flex', position: 'relative', height: 120, borderBottom: '1px solid var(--border-light)' }}>
                                        <div style={{ width: 100, flexShrink: 0, padding: 12, fontSize: '0.85rem', color: '#95b5b6', fontWeight: 600, fontFamily: 'monospace', textAlign: 'right', borderRight: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'sticky', left: 0, zIndex: 90, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                                <Clock size={12} /> {`${hour}:00`}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.3, borderTop: '1px dotted var(--border)', paddingTop: 2 }}>{`${hour}:30`}</div>
                                        </div>
                                        {DAYS.map(day => (
                                            <div key={`${day}-${hour}`} className="calendar-day-cell" onClick={() => { const id = Math.random().toString(36).substr(2, 9); setParsedClasses([...parsedClasses, { id, courseCode: '', courseName: 'New Class', timeStart: `${hour < 10 ? '0' + hour : hour}:00`, timeEnd: `${hour + 1 < 10 ? '0' + (hour + 1) : hour + 1}:00`, day, location: '', type: 'Lecture', instructor: '' }]); setStep(2); }} style={{ flex: 1, position: 'relative', borderRight: '1px solid var(--border-light)', cursor: 'cell' }}>
                                                {parsedClasses.filter(c => {
                                                    const cDay = (c.day || '').trim().toLowerCase();
                                                    const dDay = day.trim().toLowerCase();
                                                    // Normalize "Mon" to "monday", etc. if needed, but here we just check if it contains the day name
                                                    if (!cDay.startsWith(dDay.substring(0, 3))) return false;

                                                    const start = parseTime(c.timeStart);
                                                    const end = parseTime(c.timeEnd);
                                                    return start >= hour && start < (hour + 1);
                                                }).map(cls => {
                                                    const startVal = parseTime(cls.timeStart);
                                                    const endVal = parseTime(cls.timeEnd);
                                                    const durationHrs = endVal > startVal ? endVal - startVal : 1;
                                                    const offset = startVal - hour;
                                                    const bg = getCourseColor(cls.courseCode);
                                                    const isSpecial = !!COURSE_COLORS[cls.courseCode];
                                                    return (
                                                        <div key={cls.id} onClick={(e) => { e.stopPropagation(); setSelectedClass(cls); }} style={{ position: 'absolute', top: `${offset * 100}%`, left: 4, right: 4, height: `${durationHrs * 100 - 4}%`, background: isSpecial ? bg : `${bg}15`, borderLeft: `4px solid ${isSpecial ? '#2c3e50' : bg}`, padding: '12px 14px', borderRadius: 8, zIndex: 10, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', flexDirection: 'column', border: '1px solid rgba(0,0,0,0.05)', transition: 'transform 0.2s', transform: 'translateZ(0)' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}>
                                                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#2c3e50', marginBottom: 2 }}>{cls.courseCode}</div>
                                                            <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#34495e', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', marginBottom: 8 }}>{cls.courseName}</div>
                                                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                                <div style={{ fontSize: '0.75rem', color: '#7f8c8d', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                                                                    <Clock size={12} /> {cls.timeStart} – {cls.timeEnd}
                                                                    <span style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{durationHrs}h</span>
                                                                </div>
                                                                <div style={{ fontSize: '0.75rem', color: '#7f8c8d', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>📍 {cls.location || 'TBD'}</span>
                                                                    <span style={{ opacity: 0.3 }}>|</span>
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>📊 {cls.type}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {viewMode === 'vertical' && (
                        <div className="card" style={{ padding: 24, background: 'var(--bg-elevated)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {DAYS.map(day => {
                                    const dayClasses = parsedClasses.filter(c => c.day === day).sort((a, b) => parseTime(a.timeStart) - parseTime(b.timeStart));
                                    if (dayClasses.length === 0) return null;
                                    return (
                                        <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>{day}</h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                                                {dayClasses.map(cls => {
                                                    const bg = getCourseColor(cls.courseCode);
                                                    const isSpecial = !!COURSE_COLORS[cls.courseCode];
                                                    return (
                                                        <div key={cls.id} onClick={() => setSelectedClass(cls)} style={{ display: 'flex', gap: 12, padding: 16, background: isSpecial ? bg : 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)', borderTop: `4px solid ${isSpecial ? '#2c3e50' : bg}`, cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingRight: 12, borderRight: '1px dashed rgba(0,0,0,0.1)', minWidth: 60 }}>
                                                                <span style={{ fontSize: '1.2rem', fontVariantNumeric: 'tabular-nums', fontWeight: 800, color: '#2c3e50' }}>{cls.timeStart.split(':')[0]}</span>
                                                                <span style={{ fontSize: '0.7rem', color: '#34495e', fontWeight: 600 }}>{cls.timeStart.split(':')[1]}</span>
                                                            </div>
                                                            <div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#2c3e50' }}>{cls.courseCode}</span>
                                                                    <span style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 4, fontWeight: 700, color: '#2c3e50' }}>{cls.type}</span>
                                                                </div>
                                                                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#34495e', marginBottom: 4 }}>{cls.courseName}</div>
                                                                <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: '#7f8c8d' }}>
                                                                    <span>📍 {cls.location || 'TBD'}</span>
                                                                    {cls.instructor && <span>👨‍🏫 {cls.instructor}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {selectedClass && (
                        <div className="modal-overlay" onClick={() => setSelectedClass(null)}>
                            <div className="card fade-in" onClick={e => e.stopPropagation()} style={{ width: 450, padding: 32, background: 'var(--bg-elevated)', border: `2px solid ${getCourseColor(selectedClass.courseCode)}`, boxShadow: 'var(--shadow)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedClass.type}</div>
                                        <h1 style={{ margin: '0 0 4px', fontSize: '2rem' }}>{selectedClass.courseCode}</h1>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{selectedClass.courseName}</div>
                                    </div>
                                    <button className="btn btn-icon btn-ghost" onClick={() => setSelectedClass(null)} style={{ fontSize: '1.5rem' }}>&times;</button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, background: 'var(--bg-secondary)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date & Time</div>
                                            <div style={{ fontWeight: 600 }}>{selectedClass.day}, {selectedClass.timeStart} - {selectedClass.timeEnd}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location / Room</div>
                                            <div style={{ fontWeight: 600 }}>{selectedClass.location || 'Not Specified'}</div>
                                        </div>
                                    </div>
                                    {selectedClass.instructor && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Instructor</div>
                                                <div style={{ fontWeight: 600 }}>{selectedClass.instructor}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
                                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setStep(2); setSelectedClass(null); }}>
                                        <Edit2 size={16} /> Edit Data
                                    </button>
                                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setSelectedClass(null)}>Close</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default TimetableGenerator;
