import React, { useEffect, useState, useCallback, useRef } from 'react';

interface Firework {
    id: number;
    x: number;
    y: number;
    color: string;
    particles: Particle[];
}

interface Particle {
    id: number;
    angle: number;
    velocity: number;
    opacity: number;
    size: number;
}

interface FireworksProps {
    trigger?: number;
}

const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#c44569', '#f8b500'];

const Fireworks: React.FC<FireworksProps> = ({ trigger = 0 }) => {
    const [fireworks, setFireworks] = useState<Firework[]>([]);
    const [key, setKey] = useState(0);
    const triggerRef = useRef(trigger);

    useEffect(() => {
        if (trigger > triggerRef.current) {
            triggerRef.current = trigger;
            setKey(prev => prev + 1);
        }
    }, [trigger]);

    const createFirework = useCallback(() => {
        const id = Date.now() + Math.random();
        const x = Math.random() * 60 + 20;
        const y = Math.random() * 40 + 20;
        const color = colors[Math.floor(Math.random() * colors.length)];

        const particles: Particle[] = Array.from({ length: 40 }, (_, i) => ({
            id: i,
            angle: (i / 40) * 360,
            velocity: Math.random() * 80 + 50,
            opacity: 1,
            size: Math.random() * 4 + 2,
        }));

        setFireworks((prev) => [...prev, { id, x, y, color, particles }]);

        setTimeout(() => {
            setFireworks((prev) => prev.filter((fw) => fw.id !== id));
        }, 1500);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.3) {
                createFirework();
            }
        }, 600);

        return () => clearInterval(interval);
    }, [createFirework]);

    useEffect(() => {
        if (key > 0) {
            createFirework();
        }
    }, [key, createFirework]);

    return (
        <div
            key={key}
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
            {fireworks.map((fw) => (
                <div
                    key={fw.id}
                    style={{
                        position: 'absolute',
                        left: `${fw.x}%`,
                        top: `${fw.y}%`,
                    }}
                >
                    {fw.particles.map((particle) => (
                        <div
                            key={particle.id}
                            style={{
                                position: 'absolute',
                                width: particle.size,
                                height: particle.size,
                                background: fw.color,
                                borderRadius: '50%',
                                opacity: particle.opacity,
                                animation: `firework-particle 1.2s ease-out forwards`,
                                '--angle': `${particle.angle}deg`,
                                '--velocity': `${particle.velocity}%`,
                            } as React.CSSProperties}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default Fireworks;
