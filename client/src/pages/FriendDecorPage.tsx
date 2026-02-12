import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Layout/Sidebar';
import { getFriendDecor, type FriendDecor, type FriendDecorMessage } from '../api/friends';
import { updateMessagePosition, deleteMessage } from '../api/messages';
import { getSceneName, getSpringSceneBackgroundImage, DEFAULT_SPRING_SCENE, SPRING_SCENE_IDS, SCENE_ICONS } from '../constants/scenes';
import { hasStickerImage, SPRING_STICKER_CATEGORIES } from '../constants/stickers';
import { SERVER_ORIGIN } from '../api/client';
import StickerIcon from '../components/StickerIcon';
import StickerDetailModal from '../components/Messages/StickerDetailModal';
import PrivateMessagePlaceholderModal from '../components/Messages/PrivateMessagePlaceholderModal';
import ComposeSidebar from '../components/Messages/ComposeSidebar';
import ComposeModal from '../components/Messages/ComposeModal';
import { themeConfig } from '../constants/theme';
import { ArrowLeft, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import type { Message } from '../types';

const FriendDecorPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user: currentUser } = useAuth();
    const sceneContainerRef = useRef<HTMLDivElement>(null);
    /** Sender dragging their sticker to reposition on owner's scene */
    const [draggingSticker, setDraggingSticker] = useState<{ messageId: string; left: number; top: number } | null>(null);
    const [decor, setDecor] = useState<FriendDecor | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    /** 春节分类 id → 场景 id（与 ComposeModal 一致），用于 URL ?scene= 解析 */
    const categoryToSceneId: Record<string, string> = {
        eve_dinner: 'spring_dinner',
        couplets: 'spring_couplets',
        temple_fair: 'spring_temple_fair',
        fireworks: 'spring_firecrackers',
    };
    const resolveSceneFromUrl = (scene: string | null): string | null => {
        if (!scene) return null;
        if (SPRING_SCENE_IDS.includes(scene)) return scene;
        if (SPRING_STICKER_CATEGORIES.some(c => c.id === scene)) return categoryToSceneId[scene] ?? DEFAULT_SPRING_SCENE;
        return null;
    };
    /** 当前要查看的场景；null 表示在选场景步骤（从好友圈点进来先显示此页）。有 URL ?scene= 时进入对应场景。 */
    const [viewingSceneId, setViewingSceneId] = useState<string | null>(() => resolveSceneFromUrl(new URLSearchParams(window.location.search).get('scene')) ?? null);
    /** 场景名称弹窗是否显示，进入场景后 1s 渐变消失 */
    const [sceneCardVisible, setSceneCardVisible] = useState(true);
    /** 点击贴纸：私密占位弹窗 或 公开消息详情 */
    const [showPrivatePlaceholder, setShowPrivatePlaceholder] = useState(false);
    const [detailMessage, setDetailMessage] = useState<Message | null>(null);
    /** 是否展开具体场景列表（年夜饭/庙会/贴对联/放鞭炮） */
    const [showSceneList, setShowSceneList] = useState(false);
    /** 发祝福：选择贴纸 + 写留言（选择场景步骤用 ComposeModal） */
    const [showComposeModal, setShowComposeModal] = useState(false);
    /** 发祝福侧边栏（场景视图内用 ComposeSidebar） */
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    useEffect(() => {
        if (!userId) {
            setError('Invalid friend');
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        const fetchDecor = async () => {
            try {
                const data = await getFriendDecor(userId);
                if (!cancelled) {
                    setDecor(data);
                    setError(null);
                }
            } catch (err: any) {
                if (!cancelled) {
                    const status = err?.response?.status;
                    const data = err?.response?.data;
                    const msg = data?.error === 'NOT_FRIENDS'
                        ? '仅可查看好友的装饰'
                        : data?.error === 'USER_NOT_FOUND'
                        ? '该用户不存在'
                        : status === 404
                        ? '接口暂时不可用(404)，请稍后或检查网络'
                        : (data?.message || err.message || '加载失败');
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

    // Sync URL ?scene= & ?compose=1 into state (go to owner's scene and open sticker+words sidebar)
    useEffect(() => {
        const scene = searchParams.get('scene');
        const compose = searchParams.get('compose');
        const resolved = resolveSceneFromUrl(scene);
        if (resolved) setViewingSceneId(resolved);
        if (compose === '1') setIsComposeOpen(true);
    }, [searchParams]);

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
    // 消息可能是场景 id（spring_dinner）或历史存的分类 id（eve_dinner），都算属于当前场景
    const messageBelongsToScene = (msgSceneId: string | undefined) =>
        (msgSceneId || defaultSceneId) === pageScene || categoryToSceneId[msgSceneId as string] === pageScene;
    const messagesInThisScene = friendMessages
        .filter(m => hasStickerImage(m.stickerType))
        .filter(m => messageBelongsToScene(m.sceneId));
    // 无 sceneLayout 位置时用默认位置兜底，避免历史贴纸或漏写位置的不显示
    const stickersInScene = messagesInThisScene
        .map((m, i) => {
            const pos = springLayout[m._id];
            const hasPos = pos && typeof pos.left === 'number' && typeof pos.top === 'number';
            if (hasPos) return { message: m, pos: pos as { left: number; top: number } };
            const defaultLeft = 15 + (i % 4) * 26;
            const defaultTop = 20 + Math.floor(i / 4) * 22;
            return { message: m, pos: { left: Math.min(defaultLeft, 85), top: Math.min(defaultTop, 75) } };
        });

    const justDraggedRef = useRef(false);
    const dragPositionRef = useRef({ left: 0, top: 0 });

    const refetchDecor = useCallback(() => {
        if (userId) getFriendDecor(userId, { bustCache: true }).then(setDecor).catch(() => {});
    }, [userId]);

    useEffect(() => {
        if (!draggingSticker || !sceneContainerRef.current) return;
        const messageId = draggingSticker.messageId;
        dragPositionRef.current = { left: draggingSticker.left, top: draggingSticker.top };
        const el = sceneContainerRef.current;
        const onMove = (e: MouseEvent) => {
            const rect = el.getBoundingClientRect();
            const left = Math.min(95, Math.max(5, ((e.clientX - rect.left) / rect.width) * 100));
            const top = Math.min(95, Math.max(5, ((e.clientY - rect.top) / rect.height) * 100));
            dragPositionRef.current = { left, top };
            setDraggingSticker(prev => prev ? { ...prev, left, top } : null);
        };
        const onUp = async () => {
            setDraggingSticker(null);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            const { left, top } = dragPositionRef.current;
            justDraggedRef.current = true;
            try {
                await updateMessagePosition(messageId, left, top);
                refetchDecor();
            } catch {
                refetchDecor();
            }
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        return () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
    }, [draggingSticker?.messageId, refetchDecor]);

    const handleStickerClick = (message: FriendDecorMessage) => {
        const isSender = currentUser?._id && message.sender?._id && message.sender._id === currentUser._id;
        if (message.isPrivate && !isSender) {
            setShowPrivatePlaceholder(true);
        } else if (message.content !== undefined || (message.isPrivate && isSender)) {
            setDetailMessage(message as Message);
        }
    };

    const isOwner = !!(currentUser?._id && userId && currentUser._id === userId);
    const handleDeleteSticker = useCallback(async (messageId: string) => {
        try {
            await deleteMessage(messageId);
            setDetailMessage(null);
            if (userId) getFriendDecor(userId).then(setDecor).catch(() => {});
        } catch {
            if (userId) getFriendDecor(userId).then(setDecor).catch(() => {});
        }
    }, [userId]);

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
                <Sidebar />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f2f7' }}>
                    <p style={{ fontSize: '16px', color: '#666' }}>加载中... <span className="bilingual-en">Loading...</span></p>
                </div>
            </div>
        );
    }

    if (error || !decor) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
                <Sidebar />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f2f2f7', padding: '24px' }}>
                    <p style={{ fontSize: '16px', color: '#c41e3a', marginBottom: '16px' }}>{error || <>加载失败 <span className="bilingual-en">Load failed</span></>}</p>
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
                        返回好友 <span className="bilingual-en">Back to friends</span>
                    </button>
                </div>
            </div>
        );
    }

    // 步骤一：选择要查看的场景（iOS 风格）
    if (viewingSceneId === null) {
        const springScenes = SPRING_SCENE_IDS.map(id => ({ id, name: getSceneName(id), icon: SCENE_ICONS[id] ?? '📁' }));
        return (
            <>
            <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflowY: 'auto' }}>
                <Sidebar />
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
                            title="返回好友 Back to friends"
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
                            选择场景 <span className="bilingual-en">Select scene</span>
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
                        先选择一个场景，再进入对方页面 <span className="bilingual-en">First choose a scene, then view their page</span>
                    </p>

                    {/* 先显示一个「选择场景查看」按钮，点击后再展开四个具体场景 */}
                    {!showSceneList ? (
                        <button
                            type="button"
                            onClick={() => setShowSceneList(true)}
                            className="tap-scale"
                            style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: '560px',
                                padding: '16px 24px',
                                borderRadius: 'var(--ios-radius-lg)',
                                border: 'none',
                                background: 'var(--ios-glass)',
                                backdropFilter: 'saturate(180%) blur(20px)',
                                WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(255,255,255,0.3)',
                                color: '#1d1d1f',
                                fontSize: '17px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            <span style={{ display: 'block', width: '100%', textAlign: 'center' }}>选择场景查看 <span className="bilingual-en">Select scene to view</span></span>
                            <span style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: 'var(--ios-gray)' }}>→</span>
                        </button>
                    ) : (
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
                    )}

                    {showSceneList && (
                        <button
                            type="button"
                            onClick={() => setShowSceneList(false)}
                            className="tap-scale"
                            style={{
                                marginTop: '12px',
                                width: '100%',
                                maxWidth: '560px',
                                padding: '10px 20px',
                                fontSize: '15px',
                                fontWeight: 500,
                                color: 'rgba(255,255,255,0.9)',
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.5)',
                                borderRadius: 'var(--ios-radius-lg)',
                                cursor: 'pointer',
                            }}
                        >
                            收起
                        </button>
                    )}

                    {/* 给 TA 发祝福：选贴纸 + 写留言 */}
                    <button
                        type="button"
                        onClick={() => setShowComposeModal(true)}
                        className="tap-scale"
                        style={{
                            marginTop: '28px',
                            width: '100%',
                            maxWidth: '560px',
                            padding: '16px 24px',
                            fontSize: '17px',
                            fontWeight: 600,
                            color: 'white',
                            background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                            border: 'none',
                            borderRadius: 'var(--ios-radius-lg)',
                            cursor: 'pointer',
                            boxShadow: '0 4px 16px rgba(247,147,30,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                        }}
                    >
                        ✉️ 给 TA 发祝福 <span className="bilingual-en">Send a wish</span>
                    </button>
                </div>
            </div>
            <ComposeModal
                isOpen={showComposeModal}
                onClose={() => {
                    setShowComposeModal(false);
                    if (searchParams.get('compose') === '1') navigate(`/friend/${userId}/decor`, { replace: true });
                }}
                initialSeason="spring"
                preselectedFriendId={userId ?? undefined}
                hideFriendSelect={true}
                fixedSceneId={searchParams.get('compose') === '1' ? (searchParams.get('scene') ?? undefined) : undefined}
                onSceneChosen={searchParams.get('compose') !== '1' ? (sceneId) => { navigate(`/friend/${userId}/decor?scene=${sceneId}&compose=1`); setShowComposeModal(false); } : undefined}
                onSentSuccess={userId ? (sceneId) => { getFriendDecor(userId, { bustCache: true }).then(setDecor).then(() => { if (sceneId) setViewingSceneId(sceneId); }).catch(() => {}); } : undefined}
            />
        </>
        );
    }

    // 步骤二：查看该场景和对方的布置
    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflow: 'hidden' }}>
            <Sidebar />
            <div
                ref={sceneContainerRef}
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
                {/* 顶部：返回选择场景 + 标题 + 发祝福 */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '16px 24px',
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
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
                                flexShrink: 0,
                            }}
                            title="返回选择场景"
                        >
                            <ArrowLeft size={22} />
                        </button>
                        <h1 style={{ margin: 0, fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {decor.nickname} 的春节页面 · {sceneTitle}
                        </h1>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsComposeOpen(true)}
                        className="tap-scale"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 18px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'rgba(255,255,255,0.95)',
                            color: '#333',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            fontSize: '15px',
                            fontWeight: 600,
                            flexShrink: 0,
                        }}
                        title="发送节日祝福 Send a Festive Greeting"
                    >
                        <Mail size={18} />
                        发祝福
                    </button>
                </div>

                {/* 该场景布置：过年之前发送方与房主可拖；过年之后仅房主可拖；点击查看详情 */}
                {stickersInScene.map(({ message, pos }) => {
                    const senderId = typeof message.sender === 'object' && message.sender && '_id' in message.sender
                        ? (message.sender as { _id?: string })._id
                        : (message as { sender?: string }).sender;
                    const isMySticker = !!(currentUser?._id && senderId && String(currentUser._id) === String(senderId));
                    const afterFestival = !!decor?.isUnlocked;
                    const canDrag = isOwner || (isMySticker && !afterFestival);
                    const displayPos = draggingSticker?.messageId === message._id
                        ? { left: draggingSticker.left, top: draggingSticker.top }
                        : pos;
                    return (
                        <div
                            key={message._id}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                                if (justDraggedRef.current) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    justDraggedRef.current = false;
                                    return;
                                }
                                handleStickerClick(message);
                            }}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleStickerClick(message); }}
                            onMouseDown={canDrag ? (e) => { e.preventDefault(); setDraggingSticker({ messageId: message._id, left: pos.left, top: pos.top }); } : undefined}
                            style={{
                                position: 'absolute',
                                left: `${displayPos.left}%`,
                                top: `${displayPos.top}%`,
                                transform: 'translate(-50%, -50%)',
                                width: 'clamp(96px, 14vw, 160px)',
                                height: 'clamp(96px, 14vw, 160px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: canDrag ? (draggingSticker?.messageId === message._id ? 'grabbing' : 'grab') : 'pointer',
                                zIndex: draggingSticker?.messageId === message._id ? 20 : 10,
                                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))',
                                userSelect: 'none',
                            }}
                        >
                            <StickerIcon stickerType={message.stickerType} size={144} />
                        </div>
                    );
                })}

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

                <ComposeSidebar
                    isOpen={isComposeOpen}
                    onClose={() => {
                        setIsComposeOpen(false);
                        refetchDecor();
                    }}
                    initialSceneId={pageScene}
                    recipientId={userId!}
                    recipientNickname={decor.nickname}
                    initialSeason="spring"
                />

                {showPrivatePlaceholder && (
                    <PrivateMessagePlaceholderModal onClose={() => setShowPrivatePlaceholder(false)} />
                )}
                {detailMessage && (
                    <StickerDetailModal
                        message={detailMessage}
                        isUnlocked={(decor?.isUnlocked ?? false) || !!(currentUser?._id && (detailMessage as FriendDecorMessage).sender?._id === currentUser._id)}
                        onClose={() => setDetailMessage(null)}
                        showReportButton={false}
                        onDelete={isOwner ? handleDeleteSticker : undefined}
                    />
                )}
            </div>
        </div>
    );
};

export default FriendDecorPage;
