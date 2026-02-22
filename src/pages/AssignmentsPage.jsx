import Sidebar, { MobileNav } from '../components/Sidebar';
import AssignmentScanner from '../components/AssignmentScanner';

export default function AssignmentsPage() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header fade-in">
                    <h1>Assignment Scanner</h1>
                    <p>Paste any assignment or task — Jess will break it down and give you a clear action plan.</p>
                </div>
                <AssignmentScanner />
            </main>
            <MobileNav />
        </div>
    );
}
