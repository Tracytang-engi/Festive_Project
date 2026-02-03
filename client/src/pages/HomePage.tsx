import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/Layout/Sidebar';
import api from '../api/client';
import { getMessages } from '../api/messages';
import type { Message } from '../types';
import christmasBg from '../assets/christmas-bg.jpg';
import springCarrierWishingTree from '../assets/spring_carrier_01_wishing_tree.png';

import SantaSticker from '../components/SantaSticker';
import ChineseHorseSticker from '../components/ChineseHorseSticker';
import StickerDetailModal from '../components/Messages/StickerDetailModal';
import StickerIcon from '../components/StickerIcon';
import Snowfall from '../components/Effects/Snowfall';
import SpringFestivalEffects from '../components/Effects/SpringFestivalEffects';
import PageTransition from '../components/Effects/PageTransition';
import { motion } from 'framer-motion';

const HomePage: React.FC = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [ad, setAd] = useState<any>(null);
    const [showAd, setShowAd] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [detailMessage, setDetailMessage] = useState<Message | null>(null);

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

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflowY: 'auto', overflowX: 'hidden' }}>
            <Sidebar />
            {theme === 'christmas' ? (
                <Snowfall intensity="moderate" />
            ) : (
                <SpringFestivalEffects showSnow={true} intensity="moderate" />
            )}

            <div className="page-bg-area" style={{
                flex: 1,
                minHeight: '100vh',
                position: 'relative',
                backgroundImage: `url(${theme === 'christmas' ? christmasBg : springCarrierWishingTree})`,
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
                                background: theme === 'christmas' ? '#c41e3a' : '#c2185b',
                                color: 'white',
                                fontSize: '15px',
                            }}
                        >
                            {currentConfig.ctaText} →
                        </button>
                    </motion.div>
                )}

                {messages.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        style={{
                            position: 'absolute',
                            top: '62%',
                            left: '48%',
                            transform: 'translate(-50%, -50%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            background: 'rgba(0,0,0,0.4)',
                            borderRadius: '12px',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                            maxWidth: '85vw',
                        }}
                    >
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.95)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                            {theme === 'christmas' ? 'Stickers Received' : '收到的贴纸'}
                        </span>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                        }}>
                            {messages.map(msg => (
                                <button
                                    key={msg._id}
                                    type="button"
                                    className="tap-scale sticker-hover"
                                    onClick={() => setDetailMessage(msg)}
                                    style={{
                                        background: 'rgba(255,255,255,0.15)',
                                        border: 'none',
                                        padding: '4px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '24px',
                                        lineHeight: 1,
                                    }}
                                    title={isUnlocked ? 'Click to view' : 'Festival day unlock'}
                                >
                                    {isUnlocked ? <StickerIcon stickerType={msg.stickerType} size={56} /> : <span style={{ fontSize: '56px' }}>🔒</span>}
                                </button>
                            ))}
                        </div>
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
