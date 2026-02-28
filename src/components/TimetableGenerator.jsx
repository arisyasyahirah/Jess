import { useState, useRef } from 'react';
import { Upload, Calendar as CalendarIcon, FileText, Check, AlertCircle, Edit2, Trash2, Plus, GripHorizontal, ArrowRight, LayoutGrid, List, Download } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import * as pdfjsLib from 'pdfjs-dist';
import { callAI } from '../utils/aiService';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Example of parsed shape:
// { id, courseCode, courseName, timeStart: '10:00', timeEnd: '12:00', day: 'Monday', location: 'Room A', type: 'Lecture' }

export default function TimetableGenerator() {
    const fileInputRef = useRef(null);
    const [step, setStep] = useState(1); // 1 = Upload, 2 = Verify, 3 = render Dual View
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // State
    const [rawInput, setRawInput] = useState('');
    const [parsedClasses, setParsedClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);

    // View Options
    const [viewMode, setViewMode] = useState('horizontal'); // horizontal, vertical
    const [showWeekends, setShowWeekends] = useState(true);
    const [timeRange, setTimeRange] = useState([8, 20]); // 8 AM to 8 PM

    const HOURS = Array.from({ length: timeRange[1] - timeRange[0] + 1 }).map((_, i) => i + timeRange[0]);
    const DAYS = showWeekends
        ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Auto-generate consistent colors for distinct courses
    const getCourseColor = (courseCode) => {
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
                // OCR placeholder - basic text parsing alert since real robust OCR requires Tesseract.js (heavy). 
                // Recommend raw text input for images fallback.
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
                "id": "random_uuid() string",
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
            // Assign real random IDs
            const mapped = data.map(d => ({ ...d, id: Math.random().toString(36).substr(2, 9) }));
            setParsedClasses(mapped);
            setStep(2); // Move to Verification Table
        } catch (e) {
            throw new Error("AI failed to extract schedule accurately. Please try editing the text manually.");
        }
    };

    // Verification Table actions
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
        // Validation check
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

        // We will generate fake recurring dates starting from this week for the next 15 weeks (typical semester)
        const dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };

        parsedClasses.forEach(cls => {
            const dayOfWk = dayMap[cls.day] ?? 1;

            // Start from today, find the next matching day
            let d = new Date();
            d.setDate(d.getDate() + (dayOfWk + 7 - d.getDay()) % 7);

            for (let i = 0; i < 15; i++) { // 15 week semester
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

    // Convert '10:30' to numeric hours e.g. 10.5
    const parseTime = (timeStr) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <div>
                            <h2 style={{ margin: '0 0 8px' }}>Verify Extracted Data</h2>
                            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Review and edit AI-extracted classes before generating your timetable.</p>
                        </div>
                        <button className="btn btn-primary" onClick={startDualViewMode}>
                            <Check size={18} /> Confirm & Generate Schedule
                        </button>
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
                                            <select className="form-select" style={{ padding: 6 }} value={cls.day} onChange={e => handleUpdateClass(cls.id, 'day', e.target.value)}>
                                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d}>{d}</option>)}
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
                    {/* Toolbar */}
                    <div className="card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ display: 'flex', gap: 8, background: 'var(--bg-secondary)', padding: 4, borderRadius: 8 }}>
                            <button
                                className={`btn btn-sm ${viewMode === 'horizontal' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setViewMode('horizontal')}
                            >
                                <LayoutGrid size={16} /> Horizontal View
                            </button>
                            <button
                                className={`btn btn-sm ${viewMode === 'vertical' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setViewMode('vertical')}
                            >
                                <List size={16} /> Vertical View
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <select
                                className="form-select btn-sm"
                                value={`${timeRange[0]}-${timeRange[1]}`}
                                onChange={(e) => {
                                    const [s, f] = e.target.value.split('-').map(Number);
                                    setTimeRange([s, f]);
                                }}
                                style={{ width: 'auto' }}
                            >
                                <option value="8-20">8 AM - 8 PM</option>
                                <option value="7-22">7 AM - 10 PM</option>
                                <option value="9-17">9 AM - 5 PM</option>
                            </select>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={showWeekends} onChange={e => setShowWeekends(e.target.checked)} />
                                Weekends
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

                    {/* Horizontal Timetable Views */}
                    {viewMode === 'horizontal' && (
                        <div className="card" style={{ padding: 24, overflowX: 'auto', background: 'var(--bg-elevated)' }}>
                            <div style={{ minWidth: 800 }}>
                                {/* Header Row */}
                                <div style={{ display: 'flex', borderBottom: '2px solid var(--border)' }}>
                                    <div style={{ width: 80, flexShrink: 0 }} /> {/* empty corner */}
                                    {DAYS.map(d => (
                                        <div key={d} style={{ flex: 1, textAlign: 'center', fontWeight: 600, padding: 12, borderLeft: '1px solid var(--border)' }}>
                                            {d}
                                        </div>
                                    ))}
                                </div>
                                {/* Grid Rows per hour */}
                                {HOURS.map(hour => (
                                    <div key={hour} style={{ display: 'flex', position: 'relative', height: 60, borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ width: 80, flexShrink: 0, padding: 8, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right', borderRight: '1px solid var(--border)' }}>
                                            {`${hour}:00`}
                                        </div>
                                        {DAYS.map(day => (
                                            <div key={`${day}-${hour}`} style={{ flex: 1, position: 'relative', borderRight: '1px solid var(--border)' }}>
                                                {parsedClasses.filter(c => c.day === day && parseTime(c.timeStart) >= hour && parseTime(c.timeStart) < (hour + 1)).map(cls => {
                                                    const startVal = parseTime(cls.timeStart);
                                                    const endVal = parseTime(cls.timeEnd);
                                                    const duration = endVal > startVal ? endVal - startVal : 1;
                                                    const offset = startVal - hour;

                                                    const bg = getCourseColor(cls.courseCode);
                                                    return (
                                                        <div
                                                            key={cls.id}
                                                            onClick={() => setSelectedClass(cls)}
                                                            style={{
                                                                position: 'absolute', top: `${offset * 100}%`, left: 2, right: 2, height: `${duration * 100}%`,
                                                                background: `${bg}20`, borderLeft: `3px solid ${bg}`, padding: 6, borderRadius: 4,
                                                                zIndex: 10, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                                cursor: 'pointer'
                                                            }}>
                                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{cls.courseCode}</div>
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{cls.timeStart} - {cls.timeEnd}</div>
                                                            <div style={{ fontSize: '0.65rem' }}>{cls.location}</div>
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

                    {/* Vertical Timetable View */}
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
                                                    return (
                                                        <div
                                                            key={cls.id}
                                                            onClick={() => setSelectedClass(cls)}
                                                            style={{
                                                                display: 'flex', gap: 12, padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)', borderTop: `3px solid ${bg}`,
                                                                cursor: 'pointer'
                                                            }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingRight: 12, borderRight: '1px dashed var(--border)', minWidth: 60 }}>
                                                                <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{cls.timeStart.split(':')[0]}</span>
                                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{cls.timeStart.split(':')[1]}</span>
                                                            </div>
                                                            <div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{cls.courseCode}</span>
                                                                    <span style={{ fontSize: '0.65rem', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 10 }}>{cls.type}</span>
                                                                </div>
                                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: 4 }}>{cls.courseName}</div>
                                                                <div style={{ display: 'flex', gap: 12, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
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

                    {/* Class Detail Modal Overlay */}
                    {selectedClass && (
                        <div className="modal-overlay" onClick={() => setSelectedClass(null)}>
                            <div className="card fade-in" onClick={e => e.stopPropagation()} style={{ width: 400, padding: 24, background: 'var(--bg-elevated)', border: `1px solid ${getCourseColor(selectedClass.courseCode)}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>{selectedClass.type}</div>
                                        <h2 style={{ margin: 0 }}>{selectedClass.courseCode}</h2>
                                        <div style={{ color: 'var(--text-muted)' }}>{selectedClass.courseName}</div>
                                    </div>
                                    <button className="btn btn-icon btn-ghost" onClick={() => setSelectedClass(null)}>&times;</button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Clock size={16} color="var(--text-muted)" />
                                        <span>{selectedClass.day}, {selectedClass.timeStart} - {selectedClass.timeEnd}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <CalendarIcon size={16} color="var(--text-muted)" />
                                        <span>Room: {selectedClass.location || 'N/A'}</span>
                                    </div>
                                    {selectedClass.instructor && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <User size={16} color="var(--text-muted)" />
                                            <span>Instructor: {selectedClass.instructor}</span>
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
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
