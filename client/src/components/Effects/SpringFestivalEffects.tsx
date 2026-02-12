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
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
        {showSnow && <SpringSnow intensity={intensity} />}
    </div>
);

export default SpringFestivalEffects;
