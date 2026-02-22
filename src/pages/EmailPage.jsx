import Sidebar, { MobileNav } from '../components/Sidebar';
import AIEmailDrafting from '../components/AIEmailDrafting';

export default function EmailPage() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header fade-in">
                    <h1>Email Drafting</h1>
                    <p>Let Jess write professional emails for you in seconds.</p>
                </div>
                <AIEmailDrafting />
            </main>
            <MobileNav />
        </div>
    );
}
