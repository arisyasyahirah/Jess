import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

export function useAuth() {
    // Mock user to bypass auth temporarily
    const [user] = useState({ id: 'mock-local-user', email: ADMIN_EMAIL || 'local.dev@jess.app' });
    const [loading] = useState(false);

    const signOut = async () => {
        console.log("Mock sign out - auth is bypassed");
    };

    const isAdmin = true; // Always admin in local bypass mode

    return { user, loading, signOut, isAdmin };
}
