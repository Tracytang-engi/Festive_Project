import React, { useState, useEffect } from 'react';
import { sendMessage } from '../../api/messages';
import StickerIcon from '../StickerIcon';
import { getStickersForScene, getStickersByCategory } from '../../constants/stickers';
import { useOnboarding } from '../../context/OnboardingContext';
import { useSidebar } from '../../context/SidebarContext';

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

/** 春节场景 id → 贴纸分类 id（getStickersByCategory 用） */
const SPRING_SCENE_TO_CATEGORY: Record<string, string> = {
    spring_dinner: 'eve_dinner',
    spring_couplets: 'couplets',
    spring_temple_fair: 'temple_fair',
    spring_firecrackers: 'fireworks',
};

const ComposeSidebar: React.FC<ComposeSidebarProps> = ({
    isOpen,
    onClose,
    initialSceneId,
    recipientId,
    recipientNickname,
    initialSeason = 'spring',
}) => {
    const onboarding = useOnboarding();
    const { isMobile } = useSidebar();
    const [sticker, setSticker] = useState<string>(() => {
        const list = initialSeason === 'spring'
            ? getStickersByCategory(SPRING_SCENE_TO_CATEGORY[initialSceneId] ?? 'eve_dinner')
            : getStickersForScene(initialSeason, initialSceneId);
        return list[0] ?? '';
    });
    const [content, setContent] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);

    const stickers =
        initialSeason === 'spring'
            ? getStickersByCategory(SPRING_SCENE_TO_CATEGORY[initialSceneId] ?? 'eve_dinner')
            : getStickersForScene(initialSeason, initialSceneId);
    const defaultSticker = stickers[0] ?? '';

    useEffect(() => {
        if (isOpen) {
            setContent('');
            setSticker(defaultSticker);
        }
    }, [isOpen, defaultSticker]);

    const handleSend = async () => {
        if (!sticker) return alert(initialSeason === 'spring' ? '请先选择贴纸' : 'Please select a sticker first.');
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
            onboarding?.completeOnboarding();
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
            <div style={{
                ...styles.sidebar,
                ...(isMobile ? { width: '100%', maxWidth: '100%', minWidth: 0, left: 0, right: 0 } : {}),
            }}>
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
                <div style={styles.stickersWrap} data-onboarding-target="compose-sticker-grid">
                    <div style={styles.stickers}>
                        {stickers.map((s, index) => (
                            <span
                                key={s}
                                role="button"
                                tabIndex={0}
                                className="tap-scale"
                                data-onboarding-target={index === 0 ? 'compose-first-sticker' : undefined}
                                style={{
                                    ...styles.sticker,
                                    border: sticker === s ? '2px solid #007AFF' : '1px solid rgba(0,0,0,0.08)',
                                    background: sticker === s ? 'rgba(0,122,255,0.12)' : 'rgba(0,0,0,0.04)',
                                    boxShadow: sticker === s ? '0 0 0 2px rgba(0,122,255,0.3)' : 'none',
                                }}
                                onClick={() => setSticker(s)}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSticker(s); }}
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
                        data-onboarding-target="compose-send-btn"
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
        minHeight: '80px',
        maxHeight: '220px',
        overflowY: 'auto',
        padding: '8px 0',
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
