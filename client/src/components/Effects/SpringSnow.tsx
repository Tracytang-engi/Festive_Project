import React, { useEffect, useState, useMemo } from 'react';

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
    const count = intensity === 'light' ? 20 : intensity === 'heavy' ? 50 : 32;

    const snowflakes = useMemo<Snowflake[]>(() => {
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * -20,
            size: Math.random() * 8 + 4,
            duration: Math.random() * 10 + 10,
            delay: Math.random() * 12,
            opacity: Math.random() * 0.7 + 0.3,
            drift: Math.random() * 40 - 20,
            color: '#ffffff', // 白色雪花
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
                zIndex: 40,
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
    const [resetKey, setResetKey] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setResetKey((prev) => prev + 1);
        }, duration * 1000);
        return () => clearInterval(interval);
    }, [duration]);

    return (
        <div
            key={resetKey}
            style={{
                position: 'absolute',
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                background: color,
                borderRadius: '50%',
                opacity,
                boxShadow: `0 0 ${size}px rgba(255,255,255,0.8)`,
                animation: `spring-snowfall ${duration}s linear ${delay}s infinite`,
                '--drift': `${drift}px`,
            } as React.CSSProperties}
        />
    );
};

export default SpringSnow;
