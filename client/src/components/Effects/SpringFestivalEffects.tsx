import React from 'react';
import SpringSnow from './SpringSnow';

interface SpringFestivalEffectsProps {
    showSnow?: boolean;
    intensity?: 'light' | 'moderate' | 'heavy';
}

const SpringFestivalEffects: React.FC<SpringFestivalEffectsProps> = ({
    showSnow = true,
    intensity = 'moderate',
}) => (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 40 }}>
        {showSnow && <SpringSnow intensity={intensity} />}
    </div>
);

export default SpringFestivalEffects;
