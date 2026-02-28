import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import EmailPage from './pages/EmailPage';
import AssignmentsPage from './pages/AssignmentsPage';
import PlannerPage from './pages/PlannerPage';
import FuturePlannerPage from './pages/FuturePlannerPage';
import SettingsPage from './pages/SettingsPage';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

function ProtectedRoute({ children }) {
    const { user, loading, isAdmin } = useAuth();
    // Admin/owner always gets through
    if (isAdmin) return children;
    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><LoadingSpinner size="lg" /></div>;
    if (!user) return <Navigate to="/auth" replace />;
    return children;
}

export default function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path="/email" element={<ProtectedRoute><EmailPage /></ProtectedRoute>} />
                    <Route path="/assignments" element={<ProtectedRoute><AssignmentsPage /></ProtectedRoute>} />
                    <Route path="/planner" element={<ProtectedRoute><PlannerPage /></ProtectedRoute>} />
                    <Route path="/future-planner" element={<ProtectedRoute><FuturePlannerPage /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
}
