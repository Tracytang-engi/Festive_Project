import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Layout/Sidebar';
import { getMessages, deleteMessage } from '../api/messages';
import type { Message } from '../types';
import { getSpringSceneBackgroundImage, getChristmasSceneBackgroundImage, DEFAULT_SPRING_SCENE, CHRISTMAS_SCENE_IDS, SCENE_ICONS, getSceneName } from '../constants/scenes';
import { getStickerCategory, hasStickerImage, isChristmasSticker, SPRING_STICKER_CATEGORIES, SPRING_CATEGORY_ICONS } from '../constants/stickers';
import { SERVER_ORIGIN } from '../api/client';

import SantaSticker from '../components/SantaSticker';
import ChineseHorseSticker from '../components/ChineseHorseSticker';
import StickerDetailModal from '../components/Messages/StickerDetailModal';
import StickerIcon from '../components/StickerIcon';
import Snowfall from '../components/Effects/Snowfall';
import SpringFestivalEffects from '../components/Effects/SpringFestivalEffects';
import PageTransition from '../components/Effects/PageTransition';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HomePage: React.FC = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const pageSceneId = user?.selectedScene ?? (theme === 'spring' ? DEFAULT_SPRING_SCENE : 'xmas_1');
    const defaultBg = theme === 'christmas' ? getChristmasSceneBackgroundImage(pageSceneId) : getSpringSceneBackgroundImage(pageSceneId);
    const customBgPath = user?.customBackgrounds?.[pageSceneId];
    const backgroundImage = customBgPath ? `${SERVER_ORIGIN}${customBgPath}` : defaultBg;
    const [messages, setMessages] = useState<Message[]>([]);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [detailMessage, setDetailMessage] = useState<Message | null>(null);
    const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
    const [stickersPanelCollapsed, setStickersPanelCollapsed] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getMessages(theme);
                setMessages(data.messages);
                setIsUnlocked(data.isUnlocked);
            } catch { /* ignore load error */ }
        };
        load();
    }, [theme]);

    const handleDeleteSticker = async (messageId: string) => {
        try {
            await deleteMessage(messageId);
            setMessages(prev => prev.filter(m => m._id !== messageId));
            if (detailMessage?._id === messageId) setDetailMessage(null);
        } catch {
            alert(theme === 'spring' ? '删除失败，请重试' : 'Delete failed. Please try again.');
        }
    };

    const sceneIds = theme === 'spring' ? SPRING_STICKER_CATEGORIES.map(c => c.id) : [...CHRISTMAS_SCENE_IDS];
    const defaultSceneId = theme === 'spring' ? 'spring_dinner' : 'xmas_1';
    const displayable = (m: Message) => hasStickerImage(m.stickerType) || isChristmasSticker(m.stickerType);
    const messagesInScene = selectedSceneId
        ? (theme === 'spring'
            ? messages.filter(m => displayable(m) && getStickerCategory(m.stickerType) === selectedSceneId)
            : messages.filter(m => displayable(m) && (m.sceneId || defaultSceneId) === selectedSceneId))
        : [];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflowY: 'auto', overflowX: 'hidden' }}>
            <Sidebar />
            {messages.length > 0 && (
                <div style={{
                    width: stickersPanelCollapsed ? '28px' : '200px',
                    minWidth: stickersPanelCollapsed ? '28px' : '200px',
                    minHeight: '100vh',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: stickersPanelCollapsed ? 0 : '16px 12px',
                    background: 'rgba(0,0,0,0.35)',
                    backdropFilter: 'blur(10px)',
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    transition: 'width 0.25s ease, min-width 0.25s ease',
                    position: 'relative',
                }}>
                    {!stickersPanelCollapsed && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexShrink: 0 }}>
                                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>
                                    收到的贴纸 (Stickers Received)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setStickersPanelCollapsed(true)}
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
                            {/* 分类网格：单选，点同一框取消选中，无默认选中 */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 56px)',
                                gap: '10px',
                                alignContent: 'flex-start',
                                marginBottom: '12px',
                            }}>
                                {sceneIds.map(sceneId => {
                                    const count = theme === 'spring'
                                        ? messages.filter(m => displayable(m) && getStickerCategory(m.stickerType) === sceneId).length
                                        : messages.filter(m => displayable(m) && (m.sceneId || defaultSceneId) === sceneId).length;
                                    if (count === 0) return null;
                                    const isSelected = selectedSceneId === sceneId;
                                    const icon = theme === 'spring' ? (SPRING_CATEGORY_ICONS[sceneId] ?? '📁') : (SCENE_ICONS[sceneId] ?? '📁');
                                    const title = theme === 'spring' ? (SPRING_STICKER_CATEGORIES.find(c => c.id === sceneId)?.name ?? sceneId) : getSceneName(sceneId);
                                    return (
                                        <button
                                            key={sceneId}
                                            type="button"
                                            onClick={() => setSelectedSceneId(isSelected ? null : sceneId)}
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
                            {/* 选中某分类时，下方显示该分类的贴纸列表 */}
                            {selectedSceneId != null && (
                                <>
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.95)', fontWeight: 600, marginBottom: '10px', flexShrink: 0 }}>
                                        {theme === 'spring' ? (SPRING_CATEGORY_ICONS[selectedSceneId] ?? '') : (SCENE_ICONS[selectedSceneId] ?? '')}{' '}
                                        {theme === 'spring' ? (SPRING_STICKER_CATEGORIES.find(c => c.id === selectedSceneId)?.name ?? selectedSceneId) : getSceneName(selectedSceneId)}
                                    </span>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 56px)',
                                        gap: '8px',
                                        alignContent: 'flex-start',
                                    }}>
                                        {messagesInScene.map(msg => (
                                            <div key={msg._id} style={{
                                                position: 'relative',
                                                width: '56px',
                                                height: '56px',
                                                flexShrink: 0,
                                            }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setDetailMessage(msg)}
                                                    style={{
                                                        width: '56px',
                                                        height: '56px',
                                                        margin: 0,
                                                        padding: 0,
                                                        background: 'rgba(255,255,255,0.15)',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxSizing: 'border-box',
                                                    }}
                                                    title={isUnlocked ? (theme === 'spring' ? '点击查看' : 'Click to view') : (theme === 'spring' ? '节日当天解锁' : 'Festival day unlock')}
                                                >
                                                    {isUnlocked ? <StickerIcon stickerType={msg.stickerType} size={44} /> : <span style={{ fontSize: '28px' }}>🔒</span>}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteSticker(msg._id); }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '2px',
                                                        right: '2px',
                                                        width: '18px',
                                                        height: '18px',
                                                        borderRadius: '50%',
                                                        border: 'none',
                                                        background: 'rgba(200,60,60,0.9)',
                                                        color: 'white',
                                                        fontSize: '12px',
                                                        lineHeight: 1,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: 0,
                                                    }}
                                                    title="删除 (Delete)"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                    {stickersPanelCollapsed && (
                        <button
                            type="button"
                            onClick={() => setStickersPanelCollapsed(false)}
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
                            title="展开贴纸 (Expand stickers)"
                        >
                            <ChevronRight size={18} />
                        </button>
                    )}
                </div>
            )}
            {theme === 'christmas' ? (
                <Snowfall intensity="moderate" />
            ) : (
                <SpringFestivalEffects showSnow={true} intensity="moderate" />
            )}

            <div className="page-bg-area" style={{
                flex: 1,
                minHeight: '100vh',
                position: 'relative',
                zIndex: 60,
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                overflow: 'hidden'
            }}>
                <PageTransition pageKey={`home-${theme}`}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                <h1 style={{
                    color: 'white',
                    textAlign: 'center',
                    marginTop: '20px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                    fontWeight: 600,
                    fontSize: 'clamp(24px, 4vw, 36px)',
                    textShadow: '0 2px 8px rgba(0,0,0,0.4)'
                }}>
                    {theme === 'christmas' ? 'Christmas Wonderland' : 'Spring Festival Celebration'}
                </h1>

                {theme === 'christmas' && <SantaSticker />}
                {theme === 'spring' && <ChineseHorseSticker />}

                {detailMessage && (
                    <StickerDetailModal
                        message={detailMessage}
                        isUnlocked={isUnlocked}
                        onClose={() => setDetailMessage(null)}
                        onDelete={handleDeleteSticker}
                    />
                )}

                </motion.div>
                </PageTransition>

            </div>
        </div>
    );
};

export default HomePage;
