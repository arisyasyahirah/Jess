import Sidebar, { MobileNav } from '../components/Sidebar';
import DailyPlanner from '../components/DailyPlanner';

export default function PlannerPage() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header fade-in">
                    <h1>Daily Planner</h1>
                    <p>Plan your day with AI — organize tasks, set priorities, and stay on track.</p>
                </div>
                <DailyPlanner />
            </main>
            <MobileNav />
        </div>
    );
}
