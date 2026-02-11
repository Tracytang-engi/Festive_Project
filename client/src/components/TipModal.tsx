import React from 'react';

interface TipModalProps {
    show: boolean;
    message: string;
    /** 为 true 时按钮用蓝色（成功），否则灰色 */
    isSuccess?: boolean;
    onClose: () => void;
}

/** 与发现页/发祝福一致的提示弹窗：单条文案 +「知道了」 */
const TipModal: React.FC<TipModalProps> = ({ show, message, isSuccess = false, onClose }) => {
    if (!show) return null;
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.4)',
                padding: '24px',
            }}
            onClick={onClose}
        >
            <div
                className="ios-card tap-scale"
                style={{
                    maxWidth: '340px',
                    width: '100%',
                    padding: '24px',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    color: '#333',
                }}
                onClick={e => e.stopPropagation()}
            >
                <p style={{ margin: '0 0 20px', fontSize: '16px', lineHeight: 1.5 }}>
                    {message}
                </p>
                <button
                    type="button"
                    className="ios-btn tap-scale"
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: isSuccess ? 'var(--ios-blue)' : '#8e8e93',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '16px',
                        cursor: 'pointer',
                    }}
                >
                    知道了 <span className="bilingual-en">Got it</span>
                </button>
            </div>
        </div>
    );
};

export default TipModal;
