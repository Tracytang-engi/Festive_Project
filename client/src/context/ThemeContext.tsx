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
    const [theme, setTheme] = useState<Theme>('christmas');
    const hasInitialized = React.useRef(false);

    // 仅在首次加载用户时应用 themePreference，避免后续 checkAuth 覆盖用户手动切换的主题
    useEffect(() => {
        if (!user) {
            hasInitialized.current = false;
            return;
        }
        if (user.themePreference && !hasInitialized.current) {
            setTheme(user.themePreference as Theme);
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
