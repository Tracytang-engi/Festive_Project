
import React from 'react';
import { useNavigate } from 'react-router-dom';

const SantaSticker: React.FC = () => {
    const navigate = useNavigate();

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
            {/* Thought Bubble */}
            <div className="animate-float" style={{
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
            }}>
                Select the scene 💭
            </div>

            {/* Santa Sticker */}
            <div className="animate-float icon-xxl" style={{
                filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.2))',
                animationDelay: '0.5s' // Slight offset from bubble
            }}>
                🎅
            </div>
        </div>
    );
};

export default SantaSticker;
