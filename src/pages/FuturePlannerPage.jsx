import Sidebar, { MobileNav } from '../components/Sidebar';
import FutureCalendar from '../components/FutureCalendar';

export default function FuturePlannerPage() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header fade-in">
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        Plan Your Future
                    </h1>
                    <p>Track upcoming dates, assignments, and recurring events.</p>
                </div>

                <div className="card fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <FutureCalendar />
                </div>
            </main>
            <MobileNav />
        </div>
    );
}
