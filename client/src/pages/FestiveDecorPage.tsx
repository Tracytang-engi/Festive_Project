import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getMessages, deleteMessage } from '../api/messages';
import { saveSceneLayout } from '../api/scene';
import { getSceneName, getSpringSceneBackgroundImage, getChristmasSceneBackgroundImage, DEFAULT_SPRING_SCENE, CHRISTMAS_SCENE_IDS, SCENE_ICONS } from '../constants/scenes';
import { getStickerCategory, SPRING_STICKER_CATEGORIES, SPRING_CATEGORY_ICONS } from '../constants/stickers';
import { SERVER_ORIGIN } from '../api/client';
import ChineseHorseSticker from '../components/ChineseHorseSticker';
import SantaSticker from '../components/SantaSticker';
import WelcomeSticker, { WELCOME_STICKER_ID } from '../components/WelcomeSticker';
import DraggableSticker from '../components/DraggableSticker';
import StickerDetailModal from '../components/Messages/StickerDetailModal';
import type { Message } from '../types';
import Snowfall from '../components/Effects/Snowfall';
import SpringFestivalEffects from '../components/Effects/SpringFestivalEffects';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    const { user, checkAuth } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [introVisible, setIntroVisible] = useState(true);
    const [horseInCorner, setHorseInCorner] = useState(false);
    const [detailMessage, setDetailMessage] = useState<Message | null>(null);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [stickerPositions, setStickerPositions] = useState<Record<string, { left: number; top: number }>>({});
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    /** Left sidebar: 额外选中的分类（单选，仅一个框亮），无默认。当前主题场景始终显示。 */
    const [selectedSidebarSceneId, setSelectedSidebarSceneId] = useState<string | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [welcomeStickerHidden, setWelcomeStickerHidden] = useState(false);
    const defaultSceneId = theme === 'spring' ? DEFAULT_SPRING_SCENE : 'xmas_1';
    const sceneIds = theme === 'spring' ? SPRING_STICKER_CATEGORIES.map(c => c.id) : [...CHRISTMAS_SCENE_IDS];
    const pageScene = user?.selectedScene ?? defaultSceneId;
    const defaultSpringBg = getSpringSceneBackgroundImage(user?.selectedScene || DEFAULT_SPRING_SCENE);
    const customBgPath = user?.customBackgrounds?.[pageScene];
    const backgroundImage = customBgPath ? `${SERVER_ORIGIN}${customBgPath}` : (theme === 'christmas' ? getChristmasSceneBackgroundImage(pageScene) : defaultSpringBg);
    const sceneTitle = getSceneName(pageScene);
    /** 页面上显示：圣诞 = 当前场景 + 侧栏选中场景的贴纸；春节 = 仅侧栏选中的分类的贴纸（不按背景自动显示，未选分类则不显示任何贴纸）。 */
    const visibleMessages = messages.filter(m => {
        if (theme === 'spring') {
            if (!selectedSidebarSceneId) return false;
            return getStickerCategory(m.stickerType) === selectedSidebarSceneId;
        }
        const scene = m.sceneId || defaultSceneId;
        if (scene === pageScene) return true;
        if (selectedSidebarSceneId && scene === selectedSidebarSceneId) return true;
        return false;
    });

    const toggleSidebarScene = useCallback((sid: string) => {
        setSelectedSidebarSceneId(prev => prev === sid ? null : sid);
    }, []);

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

    useEffect(() => {
        setWelcomeStickerHidden(localStorage.getItem('welcomeStickerHidden_' + theme) === 'true');
    }, [theme]);

    // 用已保存的布置 + 默认位置初始化贴纸位置（含官方欢迎贴纸）
    useEffect(() => {
        const saved = (user?.sceneLayout && user.sceneLayout[theme]) ? user.sceneLayout[theme] : {};
        const next: Record<string, { left: number; top: number }> = {};
        messages.forEach((msg, i) => {
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
            alert(theme === 'spring' ? '删除失败，请重试' : 'Delete failed. Please try again.');
        }
    }, [theme, detailMessage?._id]);

    const handleDeleteWelcomeSticker = useCallback(() => {
        setWelcomeStickerHidden(true);
        localStorage.setItem('welcomeStickerHidden_' + theme, 'true');
        setStickerPositions(prev => {
            const next = { ...prev };
            delete next[WELCOME_STICKER_ID];
            return next;
        });
    }, [theme]);

    const handleSaveLayout = useCallback(async () => {
        setSaving(true);
        setSaveSuccess(false);
        try {
            await saveSceneLayout(theme, stickerPositions);
            await checkAuth();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }, [theme, stickerPositions, checkAuth]);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflowY: 'auto', overflowX: 'hidden' }}>
            <Sidebar />
            {/* Left category sidebar: switch which scene's stickers are shown on canvas; collapsible */}
            <div style={{
                width: sidebarCollapsed ? '28px' : '200px',
                minWidth: sidebarCollapsed ? '28px' : '200px',
                minHeight: '100vh',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                padding: sidebarCollapsed ? 0 : '16px 12px',
                background: 'rgba(0,0,0,0.35)',
                backdropFilter: 'blur(10px)',
                borderRight: '1px solid rgba(255,255,255,0.1)',
                boxSizing: 'border-box',
                overflow: 'hidden',
                transition: 'width 0.25s ease, min-width 0.25s ease',
                position: 'relative',
            }}>
                {!sidebarCollapsed && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexShrink: 0 }}>
                            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>
                                分类 (Category)
                            </span>
                            <button
                                type="button"
                                onClick={() => setSidebarCollapsed(true)}
                                style={{
                                    padding: '4px',
                                    border: 'none',
                                    background: 'rgba(255,255,255,0.2)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    color: 'rgba(255,255,255,0.9)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                title="收起 (Collapse)"
                            >
                                <ChevronLeft size={18} />
                            </button>
                        </div>
                        {/* 分类网格：单选，点同一框取消选中，无默认选中；仅一个框亮 */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 56px)',
                            gap: '10px',
                            alignContent: 'flex-start',
                        }}>
                            {sceneIds.map(sid => {
                                const count = theme === 'spring'
                                    ? messages.filter(m => getStickerCategory(m.stickerType) === sid).length
                                    : messages.filter(m => (m.sceneId || defaultSceneId) === sid).length;
                                const isSelected = selectedSidebarSceneId === sid;
                                const title = theme === 'spring' ? (SPRING_STICKER_CATEGORIES.find(c => c.id === sid)?.name ?? sid) : getSceneName(sid);
                                const icon = theme === 'spring' ? (SPRING_CATEGORY_ICONS[sid] ?? '📁') : (SCENE_ICONS[sid] ?? '📁');
                                return (
                                    <button
                                        key={sid}
                                        type="button"
                                        onClick={() => toggleSidebarScene(sid)}
                                        style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '12px',
                                            border: 'none',
                                            background: isSelected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
                                            boxShadow: isSelected ? '0 0 0 2px rgba(255,255,255,0.8)' : 'none',
                                            cursor: 'pointer',
                                            fontSize: '28px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative',
                                            flexShrink: 0,
                                            boxSizing: 'border-box',
                                        }}
                                        title={title}
                                    >
                                        {icon}
                                        <span style={{
                                            position: 'absolute',
                                            bottom: '2px',
                                            right: '4px',
                                            fontSize: '10px',
                                            color: 'rgba(255,255,255,0.9)',
                                        }}>{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
                {sidebarCollapsed && (
                    <button
                        type="button"
                        onClick={() => setSidebarCollapsed(false)}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '28px',
                            height: '56px',
                            border: 'none',
                            borderTopRightRadius: '8px',
                            borderBottomRightRadius: '8px',
                            background: 'rgba(0,0,0,0.4)',
                            color: 'rgba(255,255,255,0.9)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                        }}
                        title="展开分类 (Expand)"
                    >
                        <ChevronRight size={18} />
                    </button>
                )}
            </div>
            {theme === 'christmas' ? (
                <Snowfall intensity="moderate" />
            ) : (
                <SpringFestivalEffects showSnow={true} intensity="moderate" />
            )}
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

                {/* 保存布置按钮：有贴纸或欢迎贴纸未删除时显示 */}
                {!loading && (visibleMessages.length > 0 || !welcomeStickerHidden) && (
                    <div style={{
                        position: 'absolute',
                        bottom: '24px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 80,
                    }}>
                        <button
                            type="button"
                            onClick={handleSaveLayout}
                            disabled={saving}
                            style={{
                                padding: '12px 28px',
                                borderRadius: '12px',
                                border: 'none',
                                background: saving ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.95)',
                                color: theme === 'christmas' ? '#c41e3a' : '#c2185b',
                                fontSize: '16px',
                                fontWeight: 600,
                                cursor: saving ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                            }}
                        >
                            {saving ? '保存中... (Saving...)' : '保存布置 (Save Layout)'}
                        </button>
                        {saveSuccess && (
                            <span style={{ marginLeft: '12px', color: 'rgba(255,255,255,0.95)', fontSize: '14px' }}>
                                已保存 (Saved!)
                            </span>
                        )}
                    </div>
                )}

                {!loading && messages.length === 0 && !introVisible && (
                    <p style={{ fontSize: '1rem', opacity: 0.9 }}>
                        No stickers yet. Share your scene with friends!
                    </p>
                )}
                {!loading && messages.length > 0 && visibleMessages.length === 0 && !introVisible && (
                    <p style={{ fontSize: '1rem', opacity: 0.9 }}>
                        请从左侧选择分类查看贴纸 (Select a category on the left to view stickers)
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
