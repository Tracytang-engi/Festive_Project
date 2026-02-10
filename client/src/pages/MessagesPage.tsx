import React, { useState } from 'react';
import ComposeModal from '../components/Messages/ComposeModal';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { themeConfig } from '../constants/theme';
import Snowfall from '../components/Effects/Snowfall';
import SpringFestivalEffects from '../components/Effects/SpringFestivalEffects';
import PageTransition from '../components/Effects/PageTransition';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../components/Effects/PageTransition';

const MessagesPage: React.FC = () => {
    const { theme } = useTheme();
    useAuth(); // auth context required for layout
    const [season] = useState<'christmas' | 'spring'>('spring');
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    const mainBg = themeConfig[theme].mainBg;

    const boxConfig = {
        icon: '🧧',
        title: '暂无祝福消息 (No Messages Yet)',
        description: '向亲朋好友发送新春祝福，传递温暖与祝福！ (Send festive greetings to your friends!)',
        actionText: '写贺卡 (Write a Card)',
        emoji: '🎉'
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflowY: 'auto' }}>
            <Sidebar />
            {theme === 'christmas' ? (
                <Snowfall intensity="moderate" />
            ) : (
                <SpringFestivalEffects showSnow={true} intensity="moderate" />
            )}
            <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', background: mainBg, color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', position: 'relative', zIndex: 60 }}>
            <PageTransition pageKey={`messages-${season}`}>
            <header style={{ marginBottom: '28px' }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>
                    写贺卡 (Write a Card)
                </h1>
                <p style={{ margin: '8px 0 0', fontSize: '15px', color: 'rgba(255,255,255,0.9)' }}>
                    当前页面：春节贺卡 (Spring Festival cards)
                </p>
            </header>

            <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    style={{ maxWidth: '560px' }}
                >
                    <motion.div
                        variants={staggerItem}
                        className="ios-card"
                        style={{
                            padding: '64px 48px',
                            textAlign: 'center',
                            background: 'rgba(255,255,255,0.95)',
                            borderRadius: '20px',
                        }}
                    >
                        <div className="empty-state-icon" style={{ fontSize: '80px', marginBottom: '16px' }}>
                            {boxConfig.icon}
                        </div>
                        <p style={{ margin: '0 0 24px', fontSize: '18px', color: '#666', maxWidth: '420px', marginInline: 'auto', lineHeight: 1.7 }}>
                            {boxConfig.description}
                        </p>
                        <button
                            className="ios-btn ios-btn-pill tap-scale"
                            onClick={() => setIsComposeOpen(true)}
                            style={{
                                padding: '14px 32px',
                                background: '#c2185b',
                                color: 'white',
                                fontSize: '16px',
                            }}
                        >
                            {boxConfig.emoji} {boxConfig.actionText}
                        </button>
                    </motion.div>
                </motion.div>

            <ComposeModal
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                initialSeason={season}
            />
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
