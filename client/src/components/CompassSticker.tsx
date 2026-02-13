import React, { useState, useMemo } from 'react';
import UserGuideModal from './UserGuideModal';

/**
 * 指南针贴纸：浮动、发光效果，上方气泡显示「用户指南」，点击打开用户指南弹窗
 */
const CompassSticker: React.FC = () => {
    const [showGuide, setShowGuide] = useState(false);

    const compassGlowFilter = useMemo(() =>
        'drop-shadow(0 0 6px #f1c40f) drop-shadow(0 0 12px #e67e22) drop-shadow(0 0 4px #f1c40f)',
        []
    );

    return (
        <>
            <div
                onClick={() => setShowGuide(true)}
                className="tap-scale"
                style={{
                    position: 'absolute',
                    top: '22%',
                    left: '20%',
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    zIndex: 999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {/* Thought bubble – 用户指南 */}
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
                        whiteSpace: 'nowrap',
                    }}
                >
                    用户指南 💭
                </div>

                {/* Compass sticker with glowing edge */}
                <div
                    className="animate-float"
                    style={{
                        width: 'clamp(72px, 10vw, 120px)',
                        height: 'clamp(72px, 10vw, 120px)',
                        filter: compassGlowFilter,
                        textShadow: '0 0 20px rgba(241, 196, 15, 0.8), 0 0 30px rgba(230, 126, 34, 0.5)',
                        animationDelay: '0.3s',
                    }}
                    title="用户指南 User Guide"
                >
                    <img
                        src="/compass_sticker.png"
                        alt="用户指南"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                        }}
                    />
                </div>
            </div>

            <UserGuideModal
                isOpen={showGuide}
                onClose={() => setShowGuide(false)}
                contentZh="欢迎使用"
                contentEn="Welcome"
            />
        </>
    );
};

export default CompassSticker;
