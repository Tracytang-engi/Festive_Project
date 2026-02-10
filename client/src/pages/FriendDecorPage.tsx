import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Layout/Sidebar';
import { getFriendDecor, type FriendDecor, type FriendDecorMessage } from '../api/friends';
import { getSceneName, getSpringSceneBackgroundImage, DEFAULT_SPRING_SCENE, SPRING_SCENE_IDS, SCENE_ICONS } from '../constants/scenes';
import { SERVER_ORIGIN } from '../api/client';
import StickerIcon from '../components/StickerIcon';
import StickerDetailModal from '../components/Messages/StickerDetailModal';
import PrivateMessagePlaceholderModal from '../components/Messages/PrivateMessagePlaceholderModal';
import { themeConfig } from '../constants/theme';
import SpringFestivalEffects from '../components/Effects/SpringFestivalEffects';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Message } from '../types';

const FriendDecorPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [decor, setDecor] = useState<FriendDecor | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    /** 当前要查看的场景；null 表示在选场景步骤 */
    const [viewingSceneId, setViewingSceneId] = useState<string | null>(null);
    /** 场景名称弹窗是否显示，进入场景后 1s 渐变消失 */
    const [sceneCardVisible, setSceneCardVisible] = useState(true);
    /** 点击贴纸：私密占位弹窗 或 公开消息详情 */
    const [showPrivatePlaceholder, setShowPrivatePlaceholder] = useState(false);
    const [detailMessage, setDetailMessage] = useState<Message | null>(null);

    useEffect(() => {
        if (!userId) {
            setError('Invalid friend');
            setLoading(false);
            return;
        }
        let cancelled = false;
        const fetchDecor = async () => {
            try {
                const data = await getFriendDecor(userId);
                if (!cancelled) {
                    setDecor(data);
                    setError(null);
                }
            } catch (err: any) {
                if (!cancelled) {
                    const msg = err.response?.data?.error === 'NOT_FRIENDS'
                        ? '仅可查看好友的装饰'
                        : (err.response?.data?.message || err.message || '加载失败');
                    setError(msg);
                    setDecor(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchDecor();
        return () => { cancelled = true; };
    }, [userId]);

    useEffect(() => {
        if (viewingSceneId === null) return;
        setSceneCardVisible(true);
        const t = setTimeout(() => setSceneCardVisible(false), 1000);
        return () => clearTimeout(t);
    }, [viewingSceneId]);

    const pageScene = viewingSceneId ?? DEFAULT_SPRING_SCENE;
    const customBgPath = decor?.customBackgrounds?.[pageScene];
    const defaultSpringBg = getSpringSceneBackgroundImage(pageScene);
    const backgroundImage = customBgPath ? `${SERVER_ORIGIN}${customBgPath}` : defaultSpringBg;
    const sceneTitle = getSceneName(pageScene);
    const springLayout = decor?.sceneLayout?.spring ?? {};
    const friendMessages = decor?.messages ?? [];
    const defaultSceneId = DEFAULT_SPRING_SCENE;
    const stickersInScene = friendMessages
        .filter(m => (m.sceneId || defaultSceneId) === pageScene)
        .map(m => ({ message: m, pos: springLayout[m._id] }))
        .filter(({ pos }) => pos && typeof pos.left === 'number' && typeof pos.top === 'number');

    const handleStickerClick = (message: FriendDecorMessage) => {
        if (message.isPrivate) {
            setShowPrivatePlaceholder(true);
        } else if (message.content !== undefined && message.sender) {
            setDetailMessage(message as Message);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
                <Sidebar />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f2f7' }}>
                    <p style={{ fontSize: '16px', color: '#666' }}>加载中...</p>
                </div>
            </div>
        );
    }

    if (error || !decor) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
                <Sidebar />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f2f2f7', padding: '24px' }}>
                    <p style={{ fontSize: '16px', color: '#c41e3a', marginBottom: '16px' }}>{error || '加载失败'}</p>
                    <button
                        type="button"
                        onClick={() => navigate('/friends')}
                        style={{
                            padding: '10px 20px',
                            background: '#007AFF',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '15px',
                        }}
                    >
                        返回好友
                    </button>
                </div>
            </div>
        );
    }

    // 步骤一：选择要查看的场景（iOS 风格）
    if (viewingSceneId === null) {
        const springScenes = SPRING_SCENE_IDS.map(id => ({ id, name: getSceneName(id), icon: SCENE_ICONS[id] ?? '📁' }));
        return (
            <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflowY: 'auto' }}>
                <Sidebar />
                <SpringFestivalEffects showSnow={true} intensity="light" />
                <div style={{
                    flex: 1,
                    padding: '24px 20px 48px',
                    background: themeConfig.spring.mainBg,
                    color: 'white',
                    overflowY: 'auto',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}>
                    {/* 顶部导航栏 - iOS 大标题 + 返回 */}
                    <div style={{
                        width: '100%',
                        maxWidth: '560px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '8px',
                    }}>
                        <button
                            type="button"
                            onClick={() => navigate('/friends')}
                            className="tap-scale"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'var(--ios-glass)',
                                backdropFilter: 'saturate(180%) blur(20px)',
                                WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                                color: 'var(--ios-blue)',
                                cursor: 'pointer',
                                boxShadow: 'var(--ios-shadow)',
                            }}
                            title="返回好友"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </button>
                        <h1 style={{
                            margin: 0,
                            fontSize: '28px',
                            fontWeight: 700,
                            letterSpacing: '-0.5px',
                            color: 'white',
                            textShadow: '0 2px 8px rgba(0,0,0,0.25)',
                        }}>
                            选择场景
                        </h1>
                    </div>
                    <p style={{
                        margin: '0 0 24px',
                        width: '100%',
                        maxWidth: '560px',
                        fontSize: '15px',
                        fontWeight: 400,
                        color: 'rgba(255,255,255,0.88)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    }}>
                        查看 {decor.nickname} 的哪个春节场景
                    </p>

                    {/* 场景列表 - iOS 分组卡片 */}
                    <div style={{
                        width: '100%',
                        maxWidth: '560px',
                        borderRadius: 'var(--ios-radius-lg)',
                        overflow: 'hidden',
                        background: 'var(--ios-glass)',
                        backdropFilter: 'saturate(180%) blur(20px)',
                        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(255,255,255,0.3)',
                    }}>
                        {springScenes.map((scene, index) => (
                            <motion.button
                                key={scene.id}
                                type="button"
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setViewingSceneId(scene.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    width: '100%',
                                    padding: '18px 20px',
                                    border: 'none',
                                    borderBottom: index < springScenes.length - 1 ? '1px solid var(--ios-divider)' : 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontFamily: 'inherit',
                                }}
                                className="tap-scale"
                            >
                                <span style={{
                                    width: '52px',
                                    height: '52px',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.9)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '28px',
                                    flexShrink: 0,
                                    boxShadow: 'var(--ios-shadow)',
                                }}>
                                    {scene.icon}
                                </span>
                                <span style={{
                                    flex: 1,
                                    fontSize: '17px',
                                    fontWeight: 600,
                                    color: '#1d1d1f',
                                    letterSpacing: '-0.2px',
                                }}>
                                    {scene.name}
                                </span>
                                <span style={{
                                    fontSize: '15px',
                                    color: 'var(--ios-gray)',
                                    fontWeight: 500,
                                }}>
                                    →
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 步骤二：查看该场景和对方的布置
    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflow: 'hidden' }}>
            <Sidebar />
            <SpringFestivalEffects showSnow={true} intensity="moderate" />
            <div
                className="page-bg-area"
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
                {/* 顶部：返回选择场景 + 标题 */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px 24px',
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setViewingSceneId(null)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(255,255,255,0.9)',
                            color: '#333',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                        title="返回选择场景"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 600 }}>
                        {decor.nickname} 的春节页面 · {sceneTitle}
                    </h1>
                </div>

                {/* 对方在该场景的布置：按 sceneLayout 位置显示具体贴纸，可点击 */}
                {stickersInScene.map(({ message, pos }) => (
                    <div
                        key={message._id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleStickerClick(message)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleStickerClick(message); }}
                        style={{
                            position: 'absolute',
                            left: `${pos.left}%`,
                            top: `${pos.top}%`,
                            transform: 'translate(-50%, -50%)',
                            width: 'clamp(48px, 7vw, 80px)',
                            height: 'clamp(48px, 7vw, 80px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 10,
                            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))',
                        }}
                    >
                        <StickerIcon stickerType={message.stickerType} size={72} />
                    </div>
                ))}

                {/* 场景名称卡片：1s 后渐变消失 */}
                <div
                    style={{
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(12px)',
                        padding: '20px 32px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
                        textAlign: 'center',
                        opacity: sceneCardVisible ? 1 : 0,
                        transition: 'opacity 0.6s ease-out',
                        pointerEvents: sceneCardVisible ? 'auto' : 'none',
                    }}
                >
                    <h2 style={{ fontSize: '1.75rem', margin: '0 0 8px', color: 'white' }}>{sceneTitle}</h2>
                    <p style={{ fontSize: '1rem', margin: 0, color: 'rgba(255,255,255,0.9)' }}>
                        TA的春节场景与布置
                    </p>
                </div>

                {showPrivatePlaceholder && (
                    <PrivateMessagePlaceholderModal onClose={() => setShowPrivatePlaceholder(false)} />
                )}
                {detailMessage && (
                    <StickerDetailModal
                        message={detailMessage}
                        isUnlocked={true}
                        onClose={() => setDetailMessage(null)}
                        showReportButton={false}
                    />
                )}
            </div>
        </div>
    );
};

export default FriendDecorPage;
