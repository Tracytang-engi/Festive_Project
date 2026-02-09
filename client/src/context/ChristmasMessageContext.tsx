import React, { createContext, useContext, useState, useCallback } from 'react';

interface ChristmasMessageContextType {
    showChristmasUnavailable: () => void;
}

const ChristmasMessageContext = createContext<ChristmasMessageContextType | undefined>(undefined);

export const ChristmasMessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [visible, setVisible] = useState(false);

    const showChristmasUnavailable = useCallback(() => setVisible(true), []);

    return (
        <ChristmasMessageContext.Provider value={{ showChristmasUnavailable }}>
            {children}
            {visible && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 10000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(6px)',
                    }}
                    onClick={(e) => e.target === e.currentTarget && setVisible(false)}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '32px 40px',
                            maxWidth: '90%',
                            width: '340px',
                            textAlign: 'center',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: 600, color: '#333' }}>
                            暂未开放，敬请期待
                        </p>
                        <button
                            type="button"
                            onClick={() => setVisible(false)}
                            style={{
                                padding: '12px 24px',
                                background: '#007AFF',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '16px',
                                cursor: 'pointer',
                                fontWeight: 500,
                            }}
                        >
                            知道了
                        </button>
                    </div>
                </div>
            )}
        </ChristmasMessageContext.Provider>
    );
};

export const useChristmasMessage = () => {
    const ctx = useContext(ChristmasMessageContext);
    if (!ctx) throw new Error('useChristmasMessage must be used within ChristmasMessageProvider');
    return ctx;
};
