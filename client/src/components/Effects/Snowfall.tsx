import React, { useMemo } from 'react';

interface Snowflake {
    id: number;
    left: number;
    top: number;
    size: number;
    duration: number;
    delay: number;
    opacity: number;
    drift: number;
}

interface SnowfallProps {
    intensity?: 'light' | 'moderate' | 'heavy';
    theme?: 'christmas' | 'spring';
}

const Snowfall: React.FC<SnowfallProps> = ({ intensity = 'moderate', theme = 'christmas' }) => {
    const count = intensity === 'light' ? 25 : intensity === 'heavy' ? 55 : 38;

    const snowflakes = useMemo<Snowflake[]>(() => {
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * -20,
            size: Math.random() * 6 + 3,
            duration: Math.random() * 8 + 8,
            delay: Math.random() * 10,
            opacity: Math.random() * 0.6 + 0.4,
            drift: Math.random() * 30 - 15,
        }));
    }, [count]);

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
                zIndex: 50,
            }}
        >
            {snowflakes.map((flake) => (
                <Snowflake key={flake.id} {...flake} theme={theme} />
            ))}
        </div>
    );
};

const Snowflake: React.FC<Snowflake & { theme: 'christmas' | 'spring' }> = ({
    left,
    top,
    size,
    duration,
    delay,
    opacity,
    drift,
    theme,
}) => {
    return (
        <div
            style={{
                position: 'absolute',
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                background: theme === 'christmas'
                    ? 'radial-gradient(circle, #ffffff 0%, #e8e8e8 100%)'
                    : 'radial-gradient(circle, #ffffff 0%, #fff8e1 100%)',
                borderRadius: '50%',
                opacity,
                boxShadow: `0 0 ${size / 2}px rgba(255, 255, 255, 0.8)`,
                animation: `snowfall ${duration}s linear ${delay}s infinite`,
                '--drift': `${drift}px`,
            } as React.CSSProperties}
        />
    );
};

export default Snowfall;
