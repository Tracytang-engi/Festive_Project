import React, { useState } from 'react';
import StickerIcon from '../StickerIcon';
import { reportMessage } from '../../api/messages';
import type { Message } from '../../types';

interface StickerDetailModalProps {
    message: Message;
    isUnlocked: boolean;
    onClose: () => void;
    /** 是否显示举报按钮（仅发送方或接收方可举报） */
    showReportButton?: boolean;
    /** 提供则显示右上角红叉，点击后删除该贴纸并关闭弹窗 */
    onDelete?: (messageId: string) => void | Promise<void>;
}

const StickerDetailModal: React.FC<StickerDetailModalProps> = ({ message, isUnlocked, onClose, showReportButton = true, onDelete }) => {
    const [reporting, setReporting] = useState(false);
    const [reported, setReported] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleReport = async () => {
        if (reported || reporting) return;
        setReporting(true);
        try {
            await reportMessage(message._id);
            setReported(true);
        } catch {
            alert('举报失败，请重试');
        } finally {
            setReporting(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete || deleting) return;
        if (!window.confirm('确定删除这张贴纸？')) return;
        setDeleting(true);
        try {
            await onDelete(message._id);
            onClose();
        } catch {
            alert('删除失败，请重试');
        } finally {
            setDeleting(false);
        }
    };
    const senderName = typeof message.sender === 'object' ? message.sender?.nickname : 'Unknown';
    const content = isUnlocked ? message.content : `This message is sealed until the festival day!`;
    const timeStr = message.createdAt ? new Date(message.createdAt).toLocaleString() : '';

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
                    position: 'relative',
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
                {onDelete && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="tap-scale"
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: 'none',
                            background: '#FF3B30',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: deleting ? 'not-allowed' : 'pointer',
                            opacity: deleting ? 0.7 : 1,
                        }}
                    >
                        {deleting ? '删除中... (Deleting...)' : '删除贴纸 (Delete)'}
                    </button>
                )}
                <div style={{ textAlign: 'center', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                    {isUnlocked ? <StickerIcon stickerType={message.stickerType} size={180} /> : <span style={{ fontSize: '112px' }}>🔒</span>}
                </div>
                <div style={{ marginBottom: '8px', fontSize: '14px', color: '#8e8e93' }}>
                    来自 (From): <strong style={{ color: '#333' }}>{senderName}</strong>
                </div>
                <div style={{
                    background: '#f2f2f7',
                    padding: '14px',
                    borderRadius: '10px',
                    minHeight: '60px',
                    fontSize: '15px',
                    lineHeight: 1.5,
                    marginBottom: '12px',
                }}>
                    {content}
                </div>
                {timeStr && (
                    <div style={{ fontSize: '13px', color: '#8e8e93' }}>{timeStr}</div>
                )}
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    {showReportButton && (
                        <button
                            className="ios-btn tap-scale"
                            onClick={handleReport}
                            disabled={reporting || reported}
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: reported ? '#34C759' : '#f2f2f7',
                                color: reported ? 'white' : '#666',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: reported ? 'default' : 'pointer',
                                fontSize: '15px',
                            }}
                        >
                            {reported ? '已举报 (Reported)' : reporting ? '举报中... (Reporting...)' : '举报 (Report)'}
                        </button>
                    )}
                    <button
                        className="ios-btn tap-scale"
                        onClick={onClose}
                        style={{
                            flex: showReportButton ? 1 : 1,
                            padding: '12px',
                            background: '#007AFF',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '16px',
                        }}
                    >
                        关闭 (Close)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StickerDetailModal;
