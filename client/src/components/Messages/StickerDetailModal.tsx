import React, { useState, useEffect } from 'react';
import StickerIcon from '../StickerIcon';
import TipModal from '../TipModal';
import ConfirmModal from '../ConfirmModal';
import { reportMessage } from '../../api/messages';
import type { Message } from '../../types';

type OpenPhase = 'shake' | 'reveal';

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
    const [openPhase, setOpenPhase] = useState<OpenPhase>(isUnlocked ? 'shake' : 'reveal');
    const [showFirework, setShowFirework] = useState(false);
    const [tip, setTip] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // 打开贴纸：先抖两下，再进入内容并播放烟花
    useEffect(() => {
        if (!isUnlocked) {
            setOpenPhase('reveal');
            setShowFirework(false);
            return;
        }
        setOpenPhase('shake');
        setShowFirework(false);
        const t1 = setTimeout(() => {
            setOpenPhase('reveal');
            setShowFirework(true);
        }, 650);
        const t2 = setTimeout(() => setShowFirework(false), 1100);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [message._id, isUnlocked]);

    const handleReport = async () => {
        if (reported || reporting) return;
        setReporting(true);
        try {
            await reportMessage(message._id);
            setReported(true);
        } catch {
            setTip({ show: true, message: '举报失败，请重试 Report failed. Please try again.' });
        } finally {
            setReporting(false);
        }
    };

    const handleDeleteClick = () => {
        if (!onDelete || deleting) return;
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!onDelete || deleting) return;
        setShowDeleteConfirm(false);
        setDeleting(true);
        try {
            await onDelete(message._id);
            onClose();
        } catch {
            setTip({ show: true, message: '删除失败，请重试 Delete failed. Please try again.' });
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
                {onDelete && openPhase === 'reveal' && (
                    <button
                        type="button"
                        onClick={handleDeleteClick}
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
                        {deleting ? <>删除中... <span className="bilingual-en">Deleting...</span></> : <>删除贴纸 <span className="bilingual-en">Delete</span></>}
                    </button>
                )}
                {/* 打开贴纸：先抖两下，再进入内容 + 烟花绽放 */}
                <div style={{ textAlign: 'center', marginBottom: '16px', display: 'flex', justifyContent: 'center', position: 'relative', minHeight: openPhase === 'reveal' && isUnlocked ? '200px' : 'auto' }}>
                    {openPhase === 'reveal' && showFirework && (
                        <div className="sticker-firework-wrap" aria-hidden>
                            <span className="sticker-firework-core" />
                            {Array.from({ length: 24 }, (_, i) => {
                                const angle = (i / 24) * 2 * Math.PI - Math.PI / 2;
                                const r = 72 + (i % 3) * 18;
                                const endX = Math.cos(angle) * r;
                                const endY = Math.sin(angle) * r + 22;
                                const hue = (i * 19 + 12) % 360;
                                const deg = (angle * 180) / Math.PI;
                                return (
                                    <span
                                        key={i}
                                        className="sticker-firework-spark"
                                        style={{
                                            '--fw-x': `${endX}px`,
                                            '--fw-y': `${endY}px`,
                                            '--fw-deg': `${deg}deg`,
                                            '--fw-hue': hue,
                                            animationDelay: `${(i % 8) * 0.015}s`,
                                        } as React.CSSProperties}
                                    />
                                );
                            })}
                        </div>
                    )}
                    {isUnlocked ? (
                        <div className={openPhase === 'shake' ? 'sticker-open-shake' : 'sticker-reveal-content'} style={{ position: 'relative', zIndex: 1 }}>
                            <StickerIcon stickerType={message.stickerType} size={180} />
                        </div>
                    ) : (
                        <span style={{ fontSize: '112px' }}>🔒</span>
                    )}
                </div>
                {(openPhase === 'reveal' || !isUnlocked) && (
                    <>
                <div style={{ marginBottom: '8px', fontSize: '14px', color: '#8e8e93' }}>
                    来自 <span className="bilingual-en">From</span>: <strong style={{ color: '#333' }}>{senderName}</strong>
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
                            {reported ? <>已举报 <span className="bilingual-en">Reported</span></> : reporting ? <>举报中... <span className="bilingual-en">Reporting...</span></> : <>举报 <span className="bilingual-en">Report</span></>}
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
                        关闭 <span className="bilingual-en">Close</span>
                    </button>
                </div>
                    </>
                )}
            </div>
            <TipModal show={tip.show} message={tip.message} onClose={() => setTip(prev => ({ ...prev, show: false }))} />
            <ConfirmModal
                show={showDeleteConfirm}
                message="确定删除这张贴纸？ Delete this sticker?"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    );
};

export default StickerDetailModal;
