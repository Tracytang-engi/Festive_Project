import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const MOBILE_BREAKPOINT = 768;

type SidebarContextValue = {
    isMobile: boolean;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (v: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
    );
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
    );

    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
        const handler = () => setIsMobile(mql.matches);
        handler();
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);

    // 手机端：每次进入新页面时侧边栏默认收起，避免与弹窗等重合
    useEffect(() => {
        if (isMobile) setSidebarCollapsed(true);
    }, [location.pathname, isMobile]);

    const value: SidebarContextValue = { isMobile, sidebarCollapsed, setSidebarCollapsed };
    return (
        <SidebarContext.Provider value={value}>
            {children}
        </SidebarContext.Provider>
    );
};

export function useSidebar(): SidebarContextValue {
    const ctx = useContext(SidebarContext);
    if (!ctx) {
        return {
            isMobile: false,
            sidebarCollapsed: false,
            setSidebarCollapsed: () => {},
        };
    }
    return ctx;
}
