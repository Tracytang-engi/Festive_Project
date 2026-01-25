import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

interface User {
    _id: string;
    nickname?: string;
    encryptedPhone: string;
    selectedScene?: string;
    themePreference?: 'christmas' | 'spring';
    backgroundImage?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (phone: string, code: string) => Promise<void>; // Simple login via verify
    register: (phone: string, code: string, profile: any) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    updateUserScene: (sceneId: string, theme: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await api.get('/users/me');
            setUser(res.data);
            setIsAuthenticated(true);
        } catch (err) {
            console.error("Auth check failed", err);
            localStorage.removeItem('token');
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const register = async (phoneNumber: string, code: string, profile: any) => {
        // Step 2 of register flow: verify + profile
        const res = await api.post('/auth/verify-code', { phoneNumber, code, ...profile });
        localStorage.setItem('token', res.data.token);
        await checkAuth();
    };

    const login = async (phoneNumber: string, code: string) => {
        // Same endpoint used for login in this flow (verify code gets token)
        const res = await api.post('/auth/verify-code', { phoneNumber, code });
        localStorage.setItem('token', res.data.token);
        await checkAuth();
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUserScene = async (sceneId: string, theme: string) => {
        await api.put('/users/scene', { sceneId, theme });
        await checkAuth(); // Refresh user data
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, checkAuth, updateUserScene }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
