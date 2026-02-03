import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMessages } from '../api/messages';
import type { Message } from '../types';
import ComposeModal from '../components/Messages/ComposeModal';
import StickerDetailModal from '../components/Messages/StickerDetailModal';
import StickerIcon from '../components/StickerIcon';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { themeConfig } from '../constants/theme';
import Snowfall from '../components/Effects/Snowfall';
import SpringFestivalEffects from '../components/Effects/SpringFestivalEffects';
import PageTransition from '../components/Effects/PageTransition';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../components/Effects/PageTransition';

const MessagesPage: React.FC = () => {
    const { theme } = useTheme();
    const [searchParams] = useSearchParams();
    const urlSeason = searchParams.get('season');
    const initialSeason = (urlSeason === 'spring' || urlSeason === 'christmas') ? urlSeason : 'christmas';
    const [season, setSeason] = useState<'christmas' | 'spring'>(initialSeason);

    useEffect(() => {
        setSeason(initialSeason);
    }, [initialSeason]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [detailMessage, setDetailMessage] = useState<Message | null>(null);

    useEffect(() => {
        fetchMessages();
    }, [season]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const data = await getMessages(season);
            setMessages(data.messages);
            setIsUnlocked(data.isUnlocked);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const mainBg = themeConfig[theme].mainBg;

    const emptyStateConfig = {
        christmas: {
            icon: '🎄',
            title: 'No Messages Yet',
            description: 'Send festive greetings to your friends and spread the holiday cheer!',
            actionText: 'Write a Card',
            emoji: '✉️'
        },
        spring: {
            icon: '🧧',
            title: '暂无祝福消息',
            description: '向亲朋好友发送新春祝福，传递温暖与祝福！',
            actionText: '写贺卡',
            emoji: '🎉'
        }
    };

    const currentEmptyConfig = emptyStateConfig[theme];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflowY: 'auto' }}>
            <Sidebar />
            {theme === 'christmas' ? (
                <Snowfall intensity="moderate" />
            ) : (
                <SpringFestivalEffects showSnow={true} intensity="moderate" />
            )}
            <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', background: mainBg, color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
            <PageTransition pageKey={`messages-${season}`}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>
                    {theme === 'christmas' ? 'My Mailbox 📬' : '我的邮箱 📬'}
                </h1>
                <button
                    className="ios-btn ios-btn-pill tap-scale"
                    onClick={() => setIsComposeOpen(true)}
                    style={{ padding: '12px 24px', background: '#FF3B30', color: 'white' }}
                >
                    {currentEmptyConfig.actionText} ✍️
                </button>
            </header>

            <div className="ios-segmented" style={{ marginBottom: '24px' }}>
                <button className={season === 'christmas' ? 'active' : ''} onClick={() => setSeason('christmas')}>
                    Christmas 🎄
                </button>
                <button className={season === 'spring' ? 'active' : ''} onClick={() => setSeason('spring')}>
                    Spring Festival 🧧
                </button>
            </div>

            {!isUnlocked && messages.length > 0 && (
                <div className="ios-info-banner" style={{ marginBottom: '24px' }}>
                    🔒 Messages are locked until the festival day! You can see who sent them, but not the content.
                </div>
            )}

            {loading ? (
                <div style={{ padding: '40px' }}>
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}
                    >
                        {[1, 2, 3, 4].map((i) => (
                            <motion.div
                                key={i}
                                variants={staggerItem}
                                className="skeleton-card"
                                style={{ minHeight: '140px' }}
                            >
                                <div className="skeleton skeleton-avatar" style={{ margin: '0 auto 8px', width: '64px', height: '64px' }} />
                                <div className="skeleton skeleton-text" style={{ width: '70%', margin: '0 auto' }} />
                                <div className="skeleton skeleton-text" style={{ width: '50%', margin: '0 auto' }} />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            ) : (
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    style={styles.grid}
                >
                    {messages.length === 0 ? (
                        <motion.div
                            variants={staggerItem}
                            className="ios-card"
                            style={{
                                gridColumn: '1 / -1',
                                padding: '64px 48px',
                                textAlign: 'center',
                                background: 'rgba(255,255,255,0.95)',
                                borderRadius: '20px',
                            }}
                        >
                            <div className="empty-state-icon" style={{ fontSize: '80px', marginBottom: '16px' }}>
                                {currentEmptyConfig.icon}
                            </div>
                            <h2 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: 600, color: '#333' }}>
                                {currentEmptyConfig.title}
                            </h2>
                            <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#666', maxWidth: '400px', marginInline: 'auto', lineHeight: 1.6 }}>
                                {currentEmptyConfig.description}
                            </p>
                            <button
                                className="ios-btn ios-btn-pill tap-scale"
                                onClick={() => setIsComposeOpen(true)}
                                style={{
                                    padding: '14px 32px',
                                    background: theme === 'christmas' ? '#c41e3a' : '#c2185b',
                                    color: 'white',
                                    fontSize: '16px',
                                }}
                            >
                                {currentEmptyConfig.emoji} {currentEmptyConfig.actionText}
                            </button>
                        </motion.div>
                    ) : (
                        messages.map(msg => (
                            <motion.div
                                key={msg._id}
                                variants={staggerItem}
                                className="ios-card tap-scale"
                                style={{ ...styles.card, cursor: 'pointer', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px' }}
                                onClick={() => setDetailMessage(msg)}
                                whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="icon-xxl" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                                    {isUnlocked ? <StickerIcon stickerType={msg.stickerType} size={140} /> : <span style={{ fontSize: '140px' }}>🔒</span>}
                                </div>
                                <span style={{ fontSize: '14px', color: 'var(--ios-gray)' }}>
                                    From: {typeof msg.sender === 'object' ? msg.sender.nickname : 'Unknown'}
                                </span>
                                <span style={{ fontSize: '13px', color: 'var(--ios-gray)', marginTop: '6px' }}>
                                    {isUnlocked ? 'Tap to view' : 'Sealed'}
                                </span>
                            </motion.div>
                        ))
                    )}
                </motion.div>
            )}

            <ComposeModal
                isOpen={isComposeOpen}
                onClose={() => { setIsComposeOpen(false); fetchMessages(); }}
                initialSeason={season}
            />

            {detailMessage && (
                <StickerDetailModal
                    message={detailMessage}
                    isUnlocked={isUnlocked}
                    onClose={() => setDetailMessage(null)}
                />
            )}
            </PageTransition>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' },
    card: { background: 'rgba(255,255,255,0.95)', color: '#333', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', textAlign: 'center', transition: 'box-shadow 0.2s ease' },
    content: { background: '#f2f2f7', padding: '14px', borderRadius: '10px', minHeight: '64px', fontSize: '15px', lineHeight: 1.45, color: '#333' }
};

export default MessagesPage;
