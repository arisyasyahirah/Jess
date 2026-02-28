import Sidebar, { MobileNav } from '../components/Sidebar';
import TimetableGenerator from '../components/TimetableGenerator';

export default function TimetablePage() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header fade-in">
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        Timetable Generator
                    </h1>
                    <p>Upload a schedule and let AI organize your classes perfectly.</p>
                </div>

                <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <TimetableGenerator />
                </div>
            </main>
            <MobileNav />
        </div>
    );
}
