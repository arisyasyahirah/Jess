import { useState, useEffect } from 'react';

export function useAuth() {
    // Basic mock session allowing general website testing
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('jess_mock_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                // Ignore parse errors from stale data
            }
        }
        setLoading(false);
    }, []);

    const signInMock = async (email) => {
        const mockUser = { id: 'mock-local-user', email };
        localStorage.setItem('jess_mock_user', JSON.stringify(mockUser));
        setUser(mockUser);
        return { error: null };
    };

    const signOut = async () => {
        localStorage.removeItem('jess_mock_user');
        window.location.href = '/auth';
    };

    const isAdmin = false; // Regular testing usage

    return { user, loading, signOut, isAdmin, signInMock };
}
