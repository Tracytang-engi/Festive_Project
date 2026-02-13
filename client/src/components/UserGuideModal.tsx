import React from 'react';

interface UserGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** 中文内容（上半部分） */
    contentZh: string;
    /** 英文内容（下半部分） */
    contentEn: string;
}

/**
 * 用户指南弹窗：中英对照，上方中文、分割线、下方英文
 */
const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose, contentZh, contentEn }) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1100,
            }}
            onClick={onClose}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px 28px',
                    maxWidth: '90vw',
                    width: '420px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                }}
            >
                <h3 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 600, color: '#1d1d1f' }}>
                    用户指南 <span style={{ fontSize: '14px', fontWeight: 500, color: '#8e8e93' }}>User Guide</span>
                </h3>

                <div style={{ fontSize: '16px', lineHeight: 1.6, color: '#333', whiteSpace: 'pre-wrap' }}>
                    {contentZh}
                </div>

                <div style={{
                    margin: '16px 0',
                    height: '1px',
                    background: 'rgba(60,60,67,0.2)',
                }} />

                <div style={{ fontSize: '15px', lineHeight: 1.6, color: '#666', whiteSpace: 'pre-wrap' }}>
                    {contentEn}
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        marginTop: '20px',
                        padding: '10px 24px',
                        background: '#007AFF',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: 500,
                        cursor: 'pointer',
                    }}
                >
                    知道了 Got it
                </button>
            </div>
        </div>
    );
};

export default UserGuideModal;
