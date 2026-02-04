import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Layout/Sidebar';
import api from '../api/client';
import { getMessages, deleteMessage } from '../api/messages';
import type { Message } from '../types';
import christmasBg from '../assets/christmas-bg.jpg';
import { getSpringSceneBackgroundImage, DEFAULT_SPRING_SCENE, SPRING_SCENE_IDS, CHRISTMAS_SCENE_IDS, SCENE_ICONS, getSceneName } from '../constants/scenes';
import { SERVER_ORIGIN } from '../api/client';
import { themeConfig } from '../constants/theme';

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
    const navigate = useNavigate();
    const pageSceneId = user?.selectedScene ?? (theme === 'spring' ? DEFAULT_SPRING_SCENE : 'xmas_1');
    const defaultBg = theme === 'christmas' ? christmasBg : getSpringSceneBackgroundImage(pageSceneId);
    const customBgPath = user?.customBackgrounds?.[pageSceneId];
    const backgroundImage = customBgPath ? `${SERVER_ORIGIN}${customBgPath}` : defaultBg;
    const [ad, setAd] = useState<any>(null);
    const [showAd, setShowAd] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [detailMessage, setDetailMessage] = useState<Message | null>(null);
    const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
    const [stickersPanelCollapsed, setStickersPanelCollapsed] = useState(false);

    useEffect(() => {
        fetchAd();
    }, [theme]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getMessages(theme);
                setMessages(data.messages);
                setIsUnlocked(data.isUnlocked);
            } catch { }
        };
        load();
    }, [theme]);

    const fetchAd = async () => {
        try {
            const res = await api.get('/ads');
            setAd(res.data);
        } catch (err) { }
    };

    const handleDeleteSticker = async (messageId: string) => {
        try {
            await deleteMessage(messageId);
            setMessages(prev => prev.filter(m => m._id !== messageId));
            if (detailMessage?._id === messageId) setDetailMessage(null);
        } catch {
            alert(theme === 'spring' ? '删除失败，请重试' : 'Delete failed. Please try again.');
        }
    };

    const emptyStateConfig = {
        christmas: {
            title: 'Christmas Wonderland',
            subtitle: 'Share the joy of the season!',
            icon: '🎄',
            ctaText: 'Select Scene',
            message: 'No stickers yet. Share your scene with friends!'
        },
        spring: {
            title: '春节庆典',
            subtitle: '分享新春的喜悦与祝福！',
            icon: '🧧',
            ctaText: '选择场景',
            message: '还没有收到祝福，快分享你的场景给好友吧！'
        }
    };

    const currentConfig = emptyStateConfig[theme];

    const sceneIds = theme === 'spring' ? [...SPRING_SCENE_IDS] : [...CHRISTMAS_SCENE_IDS];
    const defaultSceneId = theme === 'spring' ? 'spring_dinner' : 'xmas_1';
    const messagesInScene = selectedSceneId
        ? messages.filter(m => (m.sceneId || defaultSceneId) === selectedSceneId)
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
                                    {theme === 'christmas' ? 'Stickers Received' : '收到的贴纸'}
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
                                    title={theme === 'spring' ? '收起' : 'Collapse'}
                                >
                                    <ChevronLeft size={18} />
                                </button>
                            </div>
                            {selectedSceneId == null ? (
                                <>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 56px)',
                                        gap: '10px',
                                        alignContent: 'flex-start',
                                    }}>
                                        {sceneIds.map(sceneId => {
                                            const count = messages.filter(m => (m.sceneId || defaultSceneId) === sceneId).length;
                                            if (count === 0) return null;
                                            const icon = SCENE_ICONS[sceneId] ?? '📁';
                                            return (
                                                <button
                                                    key={sceneId}
                                                    type="button"
                                                    onClick={() => setSelectedSceneId(sceneId)}
                                                    style={{
                                                        width: '56px',
                                                        height: '56px',
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        background: 'rgba(255,255,255,0.2)',
                                                        cursor: 'pointer',
                                                        fontSize: '28px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        position: 'relative',
                                                        flexShrink: 0,
                                                        boxSizing: 'border-box',
                                                    }}
                                                    title={getSceneName(sceneId)}
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
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedSceneId(null)}
                                        style={{
                                            alignSelf: 'flex-start',
                                            marginBottom: '10px',
                                            padding: '4px 8px',
                                            border: 'none',
                                            background: 'rgba(255,255,255,0.2)',
                                            color: 'rgba(255,255,255,0.95)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                        }}
                                    >
                                        ← {theme === 'spring' ? '返回' : 'Back'}
                                    </button>
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.95)', fontWeight: 600, marginBottom: '10px', flexShrink: 0 }}>
                                        {SCENE_ICONS[selectedSceneId]} {getSceneName(selectedSceneId)}
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
                                                    title={theme === 'spring' ? '删除' : 'Delete'}
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
                            title={theme === 'spring' ? '展开贴纸' : 'Expand stickers'}
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

                {messages.length === 0 && theme === 'spring' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                            padding: '32px 48px',
                            background: 'rgba(255,255,255,0.95)',
                            borderRadius: '20px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                        }}
                    >
                        <div className="empty-state-icon" style={{ fontSize: '72px', marginBottom: '16px' }}>
                            {currentConfig.icon}
                        </div>
                        <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 600, color: '#333' }}>
                            {currentConfig.subtitle}
                        </h2>
                        <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#666' }}>
                            {currentConfig.message}
                        </p>
                        <button
                            className="ios-btn ios-btn-pill tap-scale"
                            onClick={() => navigate('/select-scene')}
                            style={{
                                padding: '12px 28px',
                                background: themeConfig[theme].primary,
                                color: 'white',
                                fontSize: '15px',
                            }}
                        >
                            {currentConfig.ctaText} →
                        </button>
                    </motion.div>
                )}

                {detailMessage && (
                    <StickerDetailModal
                        message={detailMessage}
                        isUnlocked={isUnlocked}
                        onClose={() => setDetailMessage(null)}
                    />
                )}

                {showAd && ad && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="ad-responsive tap-scale"
                        style={{
                            position: 'absolute',
                            bottom: 'var(--ad-gap)',
                            right: 'var(--ad-gap)',
                            background: 'rgba(255,255,255,0.95)',
                            borderRadius: '12px',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                            backdropFilter: 'blur(10px)',
                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                        }}
                    >
                        <button className="tap-scale" onClick={() => setShowAd(false)} style={{ float: 'right', border: 'none', background: 'none', cursor: 'pointer', fontSize: 'clamp(14px, 1.5vw, 18px)', opacity: 0.6, padding: '8px' }}>✕</button>
                        <img src={ad.imageUrl} alt="Ad" style={{ borderRadius: '8px', marginTop: '8px' }} />
                        <p style={{ textAlign: 'center', margin: '12px 0 8px', fontSize: '13px' }}>{ad.linkUrl ? <a href={ad.linkUrl} style={{ color: '#007AFF' }}>Learn More</a> : "Sponsored"}</p>
                    </motion.div>
                )}
                </motion.div>
                </PageTransition>

            </div>
        </div>
    );
};

export default HomePage;
