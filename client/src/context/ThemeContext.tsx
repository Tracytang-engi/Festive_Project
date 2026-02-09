import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

type Theme = 'christmas' | 'spring';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [theme, setTheme] = useState<Theme>('spring');
    const hasInitialized = React.useRef(false);

    // 默认界面为春节；仅当用户已保存的偏好为春节时才应用，不把圣诞偏好带进来
    useEffect(() => {
        if (!user) {
            hasInitialized.current = false;
            return;
        }
        if (!hasInitialized.current && user.themePreference === 'spring') {
            setTheme('spring');
            hasInitialized.current = true;
        }
    }, [user]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = (t: Theme) => {
        setTheme(t);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within ThemeProvider");
    return context;
};
