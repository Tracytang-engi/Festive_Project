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
    color: string;
}

interface SpringSnowProps {
    intensity?: 'light' | 'moderate' | 'heavy';
}

const SpringSnow: React.FC<SpringSnowProps> = ({ intensity = 'moderate' }) => {
    const count = intensity === 'light' ? 28 : intensity === 'heavy' ? 55 : 38;

    const snowflakes = useMemo<Snowflake[]>(() => {
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * -30,
            size: Math.random() * 10 + 5,
            duration: Math.random() * 12 + 10,
            delay: Math.random() * 8,
            opacity: Math.random() * 0.5 + 0.5,
            drift: Math.random() * 40 - 20,
            color: '#ffffff',
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
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                overflow: 'visible',
            }}
        >
            {snowflakes.map((flake) => (
                <SpringSnowflake key={flake.id} {...flake} />
            ))}
        </div>
    );
};

const SpringSnowflake: React.FC<Snowflake> = ({
    left,
    top,
    size,
    duration,
    delay,
    opacity,
    drift,
    color,
}) => {
    return (
        <div
            style={{
                position: 'absolute',
                left: `${left}%`,
                top: `${top}%`,
                width: `${size}px`,
                height: `${size}px`,
                background: color,
                borderRadius: '50%',
                opacity,
                boxShadow: `0 0 ${size * 1.5}px rgba(255,255,255,0.9), 0 0 ${size * 3}px rgba(255,255,255,0.4)`,
                animation: `spring-snowfall ${duration}s linear ${delay}s infinite`,
                '--drift': `${drift}px`,
            } as React.CSSProperties}
        />
    );
};

export default SpringSnow;
