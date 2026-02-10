import React from 'react';

interface PrivateMessagePlaceholderModalProps {
    onClose: () => void;
}

/** 其他人点击私密消息贴纸时显示，不展示内容 */
const PrivateMessagePlaceholderModal: React.FC<PrivateMessagePlaceholderModalProps> = ({ onClose }) => {
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
            }}
            onClick={onClose}
        >
            <div
                className="ios-card tap-scale"
                style={{
                    background: 'white',
                    padding: '24px',
                    borderRadius: '16px',
                    maxWidth: '400px',
                    width: '90%',
                    color: '#333',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ textAlign: 'center', marginBottom: '16px', fontSize: '80px' }}>
                    🤫
                </div>
                <div style={{
                    textAlign: 'center',
                    fontSize: '16px',
                    lineHeight: 1.5,
                    marginBottom: '20px',
                    color: '#333',
                }}>
                    看起来这是一条私密消息
                </div>
                <button
                    className="ios-btn tap-scale"
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: '#007AFF',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '16px',
                    }}
                >
                    知道了
                </button>
            </div>
        </div>
    );
};

export default PrivateMessagePlaceholderModal;
