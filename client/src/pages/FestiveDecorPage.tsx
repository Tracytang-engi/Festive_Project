import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getMessages } from '../api/messages';
import { saveSceneLayout } from '../api/scene';
import { getSceneName, getSpringSceneBackgroundImage, DEFAULT_SPRING_SCENE, SPRING_SCENE_IDS, CHRISTMAS_SCENE_IDS, SCENE_ICONS } from '../constants/scenes';
import { SERVER_ORIGIN } from '../api/client';
import christmasBg from '../assets/christmas-bg.jpg';
import ChineseHorseSticker from '../components/ChineseHorseSticker';
import SantaSticker from '../components/SantaSticker';
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
    /** Left sidebar: 额外选中的分类（可多选），再点一次取消高亮并隐藏该分类贴纸。当前主题场景始终显示。 */
    const [sidebarSceneIds, setSidebarSceneIds] = useState<string[]>([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const defaultSceneId = theme === 'spring' ? DEFAULT_SPRING_SCENE : 'xmas_1';
    const sceneIds = theme === 'spring' ? [...SPRING_SCENE_IDS] : [...CHRISTMAS_SCENE_IDS];
    const pageScene = user?.selectedScene ?? defaultSceneId;
    const defaultSpringBg = getSpringSceneBackgroundImage(user?.selectedScene || DEFAULT_SPRING_SCENE);
    const customBgPath = user?.customBackgrounds?.[pageScene];
    const backgroundImage = customBgPath ? `${SERVER_ORIGIN}${customBgPath}` : (theme === 'christmas' ? christmasBg : defaultSpringBg);
    const sceneTitle = getSceneName(pageScene);
    /** 页面上显示：当前主题场景 + 左侧栏已选中的分类（多选）；点击分类为切换选中，再点一次取消。 */
    const visibleMessages = messages.filter(m => {
        const scene = m.sceneId || defaultSceneId;
        if (scene === pageScene) return true;
        if (sidebarSceneIds.includes(scene)) return true;
        return false;
    });

    const toggleSidebarScene = useCallback((sid: string) => {
        if (sid === pageScene) return; // 当前主题场景始终显示，不参与切换
        setSidebarSceneIds(prev => prev.includes(sid) ? prev.filter(id => id !== sid) : [...prev, sid]);
    }, [pageScene]);

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

    // 用已保存的布置 + 默认位置初始化贴纸位置
    useEffect(() => {
        if (messages.length === 0) {
            setStickerPositions({});
            return;
        }
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
        setStickerPositions(next);
    }, [messages, theme, user?.sceneLayout]);

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
                                {theme === 'spring' ? '场景分类' : 'By Scene'}
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
                                title={theme === 'spring' ? '收起' : 'Collapse'}
                            >
                                <ChevronLeft size={18} />
                            </button>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 56px)',
                            gap: '10px',
                            alignContent: 'flex-start',
                        }}>
                            {sceneIds.map(sid => {
                                const count = messages.filter(m => (m.sceneId || defaultSceneId) === sid).length;
                                const active = sid === pageScene || sidebarSceneIds.includes(sid);
                                return (
                                    <button
                                        key={sid}
                                        type="button"
                                        onClick={() => toggleSidebarScene(sid)}
                                        style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '12px',
                                            border: active ? '2px solid rgba(255,255,255,0.9)' : 'none',
                                            background: active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.2)',
                                            cursor: 'pointer',
                                            fontSize: '28px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative',
                                            flexShrink: 0,
                                            boxSizing: 'border-box',
                                        }}
                                        title={getSceneName(sid)}
                                    >
                                        {SCENE_ICONS[sid] ?? '📁'}
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
                        title={theme === 'spring' ? '展开分类' : 'Expand'}
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

                {/* 保存布置按钮 */}
                {!loading && visibleMessages.length > 0 && (
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
                            {saving ? (theme === 'spring' ? '保存中...' : 'Saving...') : (theme === 'spring' ? '保存布置' : 'Save Layout')}
                        </button>
                        {saveSuccess && (
                            <span style={{ marginLeft: '12px', color: 'rgba(255,255,255,0.95)', fontSize: '14px' }}>
                                {theme === 'spring' ? '已保存' : 'Saved!'}
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
                        {theme === 'spring' ? '该场景下暂无贴纸' : 'No stickers in this scene.'}
                    </p>
                )}
            </div>

            {detailMessage && (
                <StickerDetailModal
                    message={detailMessage}
                    isUnlocked={isUnlocked}
                    onClose={() => setDetailMessage(null)}
                />
            )}

        </div>
    );
};

export default FestiveDecorPage;
