import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getMessages, deleteMessage } from '../api/messages';
import { getSceneName, getSpringSceneBackgroundImage, getChristmasSceneBackgroundImage, DEFAULT_SPRING_SCENE } from '../constants/scenes';
import { getStickerCategory, hasStickerImage, isChristmasSticker } from '../constants/stickers';
import { SERVER_ORIGIN } from '../api/client';
import ChineseHorseSticker from '../components/ChineseHorseSticker';
import SantaSticker from '../components/SantaSticker';
import WelcomeSticker, { WELCOME_STICKER_ID } from '../components/WelcomeSticker';
import DraggableSticker from '../components/DraggableSticker';
import StickerDetailModal from '../components/Messages/StickerDetailModal';
import type { Message } from '../types';

// Generate random position near center (25%-75% horizontal, 20%-70% vertical)
const getRandomPosition = (seed: number) => {
    const s = (seed * 9301 + 49297) % 233280;
    const r1 = s / 233280;
    const s2 = (s * 9301 + 49297) % 233280;
    const r2 = s2 / 233280;
    return {
        left: 25 + r1 * 50,
        top: 20 + r2 * 50,
    };
};

const FestiveDecorPage: React.FC = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [introVisible, setIntroVisible] = useState(true);
    const [horseInCorner, setHorseInCorner] = useState(false);
    const [detailMessage, setDetailMessage] = useState<Message | null>(null);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [stickerPositions, setStickerPositions] = useState<Record<string, { left: number; top: number }>>({});
    const [welcomeStickerHidden, setWelcomeStickerHidden] = useState(false);
    const defaultSceneId = theme === 'spring' ? DEFAULT_SPRING_SCENE : 'xmas_1';
    const pageScene = user?.selectedScene ?? defaultSceneId;
    const defaultSpringBg = getSpringSceneBackgroundImage(user?.selectedScene || DEFAULT_SPRING_SCENE);
    const customBgPath = user?.customBackgrounds?.[pageScene];
    const backgroundImage = customBgPath ? `${SERVER_ORIGIN}${customBgPath}` : (theme === 'christmas' ? getChristmasSceneBackgroundImage(pageScene) : defaultSpringBg);
    const sceneTitle = getSceneName(pageScene);
    /** 后端 sceneId（spring_dinner 等）→ 贴纸分类 id（eve_dinner 等），用于春节贴纸过滤 */
    const springSceneToCategory: Record<string, string> = {
        spring_dinner: 'eve_dinner',
        spring_couplets: 'couplets',
        spring_temple_fair: 'temple_fair',
        spring_firecrackers: 'fireworks',
    };
    /** 当前装饰页展示：仅显示属于当前场景（pageScene）的贴纸。 */
    const displayable = (m: Message) => hasStickerImage(m.stickerType) || isChristmasSticker(m.stickerType);
    const visibleMessages = messages.filter(m => {
        if (!displayable(m)) return false;
        if (theme === 'spring') {
            const category = getStickerCategory(m.stickerType);
            const expectedCategory = springSceneToCategory[pageScene] ?? pageScene;
            return category === expectedCategory || (m.sceneId || defaultSceneId) === pageScene;
        }
        const scene = m.sceneId || defaultSceneId;
        return scene === pageScene;
    });

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const data = await getMessages(theme);
                setMessages(data.messages);
                setIsUnlocked(data.isUnlocked);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [theme]);

    // 按「用户 + 主题」存，新账号不会继承其他账号的隐藏状态
    useEffect(() => {
        const key = 'welcomeStickerHidden_' + (user?._id || '') + '_' + theme;
        setWelcomeStickerHidden(localStorage.getItem(key) === 'true');
    }, [theme, user?._id]);

    // 用已保存的布置 + 默认位置初始化贴纸位置（含官方欢迎贴纸）；只对有图贴纸分配位置，旧贴纸类型不显示
    useEffect(() => {
        const saved = (user?.sceneLayout && user.sceneLayout[theme]) ? user.sceneLayout[theme] : {};
        const next: Record<string, { left: number; top: number }> = {};
        messages.filter(m => displayable(m)).forEach((msg, i) => {
            if (saved[msg._id] && typeof saved[msg._id].left === 'number' && typeof saved[msg._id].top === 'number') {
                next[msg._id] = { left: saved[msg._id].left, top: saved[msg._id].top };
            } else {
                const hash = msg._id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + i * 7;
                next[msg._id] = getRandomPosition(hash);
            }
        });
        if (!welcomeStickerHidden) {
            next[WELCOME_STICKER_ID] = (saved[WELCOME_STICKER_ID] && typeof saved[WELCOME_STICKER_ID].left === 'number')
                ? saved[WELCOME_STICKER_ID]
                : { left: 50, top: 50 };
        }
        setStickerPositions(next);
    }, [messages, theme, user?.sceneLayout, welcomeStickerHidden]);

    // Intro 文字：2秒后淡出
    useEffect(() => {
        const t = setTimeout(() => setIntroVisible(false), 2000);
        return () => clearTimeout(t);
    }, []);

    // 马/Santa：切换背景后停留 1s，再以 iOS 风格动画移至右下角
    useEffect(() => {
        setHorseInCorner(false);
        const t = setTimeout(() => setHorseInCorner(true), 1000);
        return () => clearTimeout(t);
    }, [backgroundImage]);

    const handlePositionChange = useCallback((messageId: string, left: number, top: number) => {
        setStickerPositions(prev => ({ ...prev, [messageId]: { left, top } }));
    }, []);

    const handleDeleteSticker = useCallback(async (messageId: string) => {
        try {
            await deleteMessage(messageId);
            setMessages(prev => prev.filter(m => m._id !== messageId));
            if (detailMessage?._id === messageId) setDetailMessage(null);
        } catch {
            // 错误由 StickerDetailModal 内 TipModal 展示
        }
    }, [theme, detailMessage?._id]);

    const handleDeleteWelcomeSticker = useCallback(() => {
        setWelcomeStickerHidden(true);
        const key = 'welcomeStickerHidden_' + (user?._id || '') + '_' + theme;
        localStorage.setItem(key, 'true');
        setStickerPositions(prev => {
            const next = { ...prev };
            delete next[WELCOME_STICKER_ID];
            return next;
        });
    }, [theme, user?._id]);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflowY: 'auto', overflowX: 'hidden' }}>
            <Sidebar />
            <div className="page-bg-area"
                style={{
                    flex: 1,
                    minHeight: '100vh',
                    position: 'relative',
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                    overflow: 'hidden',
                }}
            >
                {/* 官方欢迎贴纸：与普通贴纸一致，可拖动、可删除、不可举报 */}
                {!welcomeStickerHidden && stickerPositions[WELCOME_STICKER_ID] && (
                    <WelcomeSticker
                        initialLeft={stickerPositions[WELCOME_STICKER_ID].left}
                        initialTop={stickerPositions[WELCOME_STICKER_ID].top}
                        onPositionChange={(left, top) => handlePositionChange(WELCOME_STICKER_ID, left, top)}
                        onDelete={handleDeleteWelcomeSticker}
                    />
                )}

                {/* Horse/Santa: 停留 1s 后以 iOS 风格动画移至右下角 */}
                <div
                    style={{
                        position: 'absolute',
                        top: horseInCorner ? '85%' : '50%',
                        left: horseInCorner ? '90%' : '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 100,
                        pointerEvents: 'auto',
                        transition: 'top 0.9s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                >
                    {theme === 'spring' && <ChineseHorseSticker />}
                    {theme === 'christmas' && <SantaSticker />}
                </div>

                {/* Intro 文字：iOS 风格背景阴影，2秒后淡出 */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '15%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        opacity: introVisible ? 1 : 0,
                        transition: 'opacity 1s ease-out',
                        pointerEvents: introVisible ? 'auto' : 'none',
                        zIndex: 50,
                    }}
                >
                    <div
                        style={{
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            padding: '16px 24px',
                            borderRadius: '16px',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
                            textAlign: 'center',
                        }}
                    >
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', marginTop: 0, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                            {sceneTitle}
                        </h1>
                        <p style={{ fontSize: '1.1rem', maxWidth: '560px', margin: 0, color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                            This is your selected holiday scene. Check the stickers that others gave you below.
                        </p>
                    </div>
                </div>

                {/* Stickers from others: floating, draggable, click to view */}
                {!loading && visibleMessages.length > 0 && (
                    <>
                        {visibleMessages.map(msg => (
                            <DraggableSticker
                                key={msg._id}
                                message={msg}
                                initialLeft={stickerPositions[msg._id]?.left ?? 50}
                                initialTop={stickerPositions[msg._id]?.top ?? 50}
                                onShowDetail={() => setDetailMessage(msg)}
                                onPositionChange={(left, top) => handlePositionChange(msg._id, left, top)}
                            />
                        ))}
                    </>
                )}

                {!loading && messages.length === 0 && !introVisible && (
                    <p style={{ fontSize: '1rem', opacity: 0.9 }}>
                        No stickers yet. Share your scene with friends!
                    </p>
                )}
                {!loading && messages.length > 0 && visibleMessages.length === 0 && !introVisible && (
                    <p style={{ fontSize: '1rem', opacity: 0.9 }}>
                        该场景下暂无贴纸 <span className="bilingual-en">No stickers in this scene yet</span>
                    </p>
                )}
            </div>

            {detailMessage && (
                <StickerDetailModal
                    message={detailMessage}
                    isUnlocked={isUnlocked}
                    onClose={() => setDetailMessage(null)}
                    onDelete={handleDeleteSticker}
                />
            )}

        </div>
    );
};

export default FestiveDecorPage;
