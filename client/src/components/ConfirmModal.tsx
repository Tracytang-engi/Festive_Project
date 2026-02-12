import React from 'react';

interface ConfirmModalProps {
    show: boolean;
    message: string;
    /** 主按钮文案，默认「确定删除」 */
    confirmLabel?: string;
    /** 主按钮英文（小字），默认 "Delete" */
    confirmLabelEn?: string;
    /** 主按钮危险样式（红） */
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/** 与发现页风格一致的确认弹窗：双按钮（取消 / 确定） */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
    show,
    message,
    confirmLabel = '确定删除',
    confirmLabelEn = 'Delete',
    danger = true,
    onConfirm,
    onCancel,
}) => {
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
            onClick={onCancel}
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
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="button"
                        className="ios-btn tap-scale"
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: '#f2f2f7',
                            color: '#333',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '16px',
                            cursor: 'pointer',
                        }}
                    >
                        取消 <span className="bilingual-en">Cancel</span>
                    </button>
                    <button
                        type="button"
                        className="ios-btn tap-scale"
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: danger ? '#FF3B30' : 'var(--ios-blue)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '16px',
                            cursor: 'pointer',
                        }}
                    >
                        {confirmLabel} <span className="bilingual-en">{confirmLabelEn}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
