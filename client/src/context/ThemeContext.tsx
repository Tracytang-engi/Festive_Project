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

    // 根据用户已保存的主题偏好同步（春节/圣诞），仅首次加载用户时应用一次
    useEffect(() => {
        if (!user) {
            hasInitialized.current = false;
            return;
        }
        if (!hasInitialized.current && (user.themePreference === 'spring' || user.themePreference === 'christmas')) {
            setTheme(user.themePreference);
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
