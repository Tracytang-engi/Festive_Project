import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getMessages } from '../api/messages';
import { getSceneName } from '../constants/scenes';
import christmasBg from '../assets/christmas-bg.jpg';
import springCarrierWishingTree from '../assets/spring_carrier_01_wishing_tree.png';
import springCarrierPlumBranch from '../assets/spring_carrier_02_plum_branch.png';
import springCarrierFuDoor from '../assets/spring_carrier_03_fu_door.png';
import ChineseHorseSticker from '../components/ChineseHorseSticker';
import SantaSticker from '../components/SantaSticker';
import DraggableSticker from '../components/DraggableSticker';
import StickerDetailModal from '../components/Messages/StickerDetailModal';
import type { Message } from '../types';
import Snowfall from '../components/Effects/Snowfall';
import SpringFestivalEffects from '../components/Effects/SpringFestivalEffects';

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
    const springSceneBg =
        user?.selectedScene === 'spring_fireworks' ? springCarrierWishingTree
            : user?.selectedScene === 'spring_reunion' ? springCarrierPlumBranch
                : user?.selectedScene === 'spring_temple_fair' ? springCarrierFuDoor
                    : springCarrierWishingTree;
    const backgroundImage = theme === 'christmas' ? christmasBg : springSceneBg;
    const sceneTitle = getSceneName(user?.selectedScene);

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

    const stickerPositions = useMemo(() => {
        const map: Record<string, { left: number; top: number }> = {};
        messages.forEach((msg, i) => {
            const hash = msg._id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + i * 7;
            map[msg._id] = getRandomPosition(hash);
        });
        return map;
    }, [messages]);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflowY: 'auto', overflowX: 'hidden' }}>
            <Sidebar />
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
                {!loading && messages.length > 0 && (
                    <>
                        {messages.map(msg => (
                            <DraggableSticker
                                key={msg._id}
                                message={msg}
                                initialLeft={stickerPositions[msg._id]?.left ?? 50}
                                initialTop={stickerPositions[msg._id]?.top ?? 50}
                                onShowDetail={() => setDetailMessage(msg)}
                            />
                        ))}
                    </>
                )}

                {!loading && messages.length === 0 && !introVisible && (
                    <p style={{ fontSize: '1rem', opacity: 0.9 }}>
                        No stickers yet. Share your scene with friends!
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
