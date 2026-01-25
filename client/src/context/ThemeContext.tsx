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

    useEffect(() => {
        if (user?.themePreference) {
            setTheme(user.themePreference as Theme);
        }
    }, [user]);

    const toggleTheme = (t: Theme) => {
        setTheme(t);
        // Persist via AuthContext/API if needed, but sidebar switching might be temporary?
        // Requirement: "Clicking icons switches between two theme scenes". 
        // We can just keep it local state for the session, or auto-save.
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
