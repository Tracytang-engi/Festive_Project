import React, { useState, useEffect } from 'react';
import { sendMessage } from '../../api/messages';
import StickerIcon from '../StickerIcon';
import { getStickersForScene } from '../../constants/stickers';

interface ComposeSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    /** 当前场景，无选择场景步骤 */
    initialSceneId: string;
    /** 收件人 ID（好友页面打开时必传） */
    recipientId: string;
    /** 收件人昵称（用于显示） */
    recipientNickname: string;
    /** 季节 */
    initialSeason?: 'christmas' | 'spring';
}

const ComposeSidebar: React.FC<ComposeSidebarProps> = ({
    isOpen,
    onClose,
    initialSceneId,
    recipientId,
    recipientNickname,
    initialSeason = 'spring',
}) => {
    const [sticker, setSticker] = useState<string>('🧧');
    const [content, setContent] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);

    const stickers = getStickersForScene(initialSeason, initialSceneId);

    useEffect(() => {
        if (isOpen) {
            setContent('');
            const list = getStickersForScene(initialSeason, initialSceneId);
            setSticker(list[0] ?? '🧧');
        }
    }, [isOpen, initialSceneId, initialSeason]);

    const handleSend = async () => {
        if (!content.trim()) return alert(initialSeason === 'spring' ? '请写上祝福语！' : 'Write a message!');

        setLoading(true);
        try {
            await sendMessage({
                recipientId,
                stickerType: sticker,
                content,
                season: initialSeason,
                sceneId: initialSceneId,
                isPrivate,
            });
            alert(initialSeason === 'spring' ? '祝福已发送！' : 'Message sent!');
            onClose();
            setContent('');
        } catch {
            alert(initialSeason === 'spring' ? '发送失败。' : 'Failed to send message.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* 半透明遮罩，可点击关闭 */}
            <div
                role="button"
                tabIndex={0}
                onClick={onClose}
                onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
                style={styles.backdrop}
                aria-label="关闭"
            />
            <div style={styles.sidebar}>
                <div style={styles.header}>
                    <h3 style={styles.title}>
                        {initialSeason === 'spring' ? '发送节日祝福' : 'Send a Festive Greeting'}
                    </h3>
                    <button type="button" onClick={onClose} style={styles.closeBtn}>
                        {initialSeason === 'spring' ? '取消' : 'Cancel'}
                    </button>
                </div>

                <div style={styles.recipient}>
                    {initialSeason === 'spring' ? '发送给 To:' : 'To:'} {recipientNickname}
                </div>

                <label style={styles.label}>{initialSeason === 'spring' ? '选择贴纸' : 'Choose Sticker'}</label>
                <div style={styles.stickersWrap}>
                    <div style={styles.stickers}>
                        {stickers.map(s => (
                            <span
                                key={s}
                                className="tap-scale"
                                style={{
                                    ...styles.sticker,
                                    border: sticker === s ? '2px solid #007AFF' : 'none',
                                    background: sticker === s ? 'rgba(0,122,255,0.08)' : 'transparent',
                                }}
                                onClick={() => setSticker(s)}
                            >
                                <StickerIcon stickerType={s} size={64} />
                            </span>
                        ))}
                    </div>
                </div>

                <label style={styles.label}>
                    <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={e => setIsPrivate(e.target.checked)}
                        style={{ marginRight: '8px' }}
                    />
                    {initialSeason === 'spring'
                        ? '私密消息（仅你和对方可见内容，贴纸对所有人可见）'
                        : 'Private message (content visible only to you and recipient)'}
                </label>

                <label style={styles.label}>{initialSeason === 'spring' ? '祝福语' : 'Message'}</label>
                <textarea
                    placeholder={initialSeason === 'spring' ? '写下你的祝福...' : 'Write your warm wishes...'}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    style={styles.textarea}
                />

                <div style={styles.actions}>
                    <button className="ios-btn tap-scale" onClick={onClose} style={styles.cancelBtn}>
                        {initialSeason === 'spring' ? '取消' : 'Cancel'}
                    </button>
                    <button
                        className="ios-btn tap-scale"
                        onClick={handleSend}
                        disabled={loading}
                        style={styles.sendBtn}
                    >
                        {loading ? (initialSeason === 'spring' ? '发送中...' : 'Sending...') : (initialSeason === 'spring' ? '发送祝福' : 'Send Wishes')}
                    </button>
                </div>
            </div>
        </>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.15)',
        zIndex: 999,
        cursor: 'pointer',
    },
    sidebar: {
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '25%',
        minWidth: '280px',
        maxWidth: '360px',
        backgroundColor: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '20px 16px',
        color: '#333',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        zIndex: 1000,
        overflowY: 'auto',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '4px',
    },
    title: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 600,
    },
    closeBtn: {
        padding: '6px 12px',
        border: 'none',
        background: 'transparent',
        color: '#8e8e93',
        cursor: 'pointer',
        fontSize: '15px',
    },
    recipient: {
        fontSize: '14px',
        color: '#8e8e93',
        marginBottom: '4px',
    },
    label: {
        fontSize: '13px',
        color: '#8e8e93',
        fontWeight: 500,
    },
    stickersWrap: {
        maxHeight: '180px',
        overflowY: 'auto',
        padding: '4px 0',
    },
    stickers: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
    },
    sticker: {
        cursor: 'pointer',
        padding: '6px',
        borderRadius: '12px',
        transition: 'background 0.2s',
        flexShrink: 0,
    },
    textarea: {
        padding: '12px 14px',
        borderRadius: '8px',
        border: '1px solid rgba(60,60,67,0.12)',
        minHeight: '100px',
        fontSize: '15px',
        fontFamily: 'inherit',
        resize: 'vertical',
        boxSizing: 'border-box' as const,
        width: '100%',
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '8px',
    },
    cancelBtn: {
        padding: '10px 18px',
        background: '#f2f2f7',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: 500,
    },
    sendBtn: {
        padding: '10px 18px',
        background: '#FF3B30',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: 500,
        transition: 'opacity 0.2s',
    },
};

export default ComposeSidebar;
