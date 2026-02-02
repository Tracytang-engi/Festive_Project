import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Chinese-style horse sticker with glowing edge and "Select the Scene" thought bubble.
 * Centered like Santa sticker (Christmas scene).
 */
const ChineseHorseSticker: React.FC = () => {
    const navigate = useNavigate();

    const horseGlowFilter = useMemo(() =>
        'drop-shadow(0 0 6px #f1c40f) drop-shadow(0 0 12px #e67e22) drop-shadow(0 0 4px #f1c40f)',
        []
    );

    return (
        <div
            onClick={() => navigate('/select-scene')}
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}
        >
            {/* Thought bubble – above horse, mirroring Santa */}
            <div
                className="animate-float"
                style={{
                    background: 'white',
                    padding: '10px 15px',
                    borderRadius: '20px',
                    borderBottomLeftRadius: '0',
                    marginBottom: '10px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    fontWeight: 'bold',
                    color: '#333',
                    fontSize: '14px',
                    whiteSpace: 'nowrap'
                }}
            >
                Select the scene 💭
            </div>

            {/* Horse sticker with glowing edge – mirroring Santa layout */}
            <div
                className="animate-float icon-xxl"
                style={{
                    lineHeight: 1,
                    filter: horseGlowFilter,
                    textShadow: '0 0 20px rgba(241, 196, 15, 0.8), 0 0 30px rgba(230, 126, 34, 0.5)',
                    animationDelay: '0.5s'
                }}
                title="Select the Scene"
            >
                🐴
            </div>
        </div>
    );
};

export default ChineseHorseSticker;
