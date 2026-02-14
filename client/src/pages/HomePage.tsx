import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Layout/Sidebar';
import { getMessages, deleteMessage } from '../api/messages';
import type { Message } from '../types';
import { getSpringMainPageBackgroundImage, getChristmasSceneBackgroundImage, DEFAULT_SPRING_SCENE } from '../constants/scenes';
import { SERVER_ORIGIN } from '../api/client';

import SantaSticker from '../components/SantaSticker';
import ChineseHorseSticker from '../components/ChineseHorseSticker';
import CompassSticker from '../components/CompassSticker';
import ShareCardButton from '../components/ShareCardButton';
import StickerDetailModal from '../components/Messages/StickerDetailModal';
import PageTransition from '../components/Effects/PageTransition';
import { motion } from 'framer-motion';

const HomePage: React.FC = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const pageSceneId = user?.selectedScene ?? (theme === 'spring' ? DEFAULT_SPRING_SCENE : 'xmas_1');
    const defaultBg = theme === 'christmas' ? getChristmasSceneBackgroundImage(pageSceneId) : getSpringMainPageBackgroundImage();
    const customBgPath = theme === 'christmas' ? user?.customBackgrounds?.[pageSceneId] : undefined;
    const backgroundImage = customBgPath ? `${SERVER_ORIGIN}${customBgPath}` : defaultBg;
    const [, setMessages] = useState<Message[]>([]);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [detailMessage, setDetailMessage] = useState<Message | null>(null);

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
            // 错误由 StickerDetailModal 内 TipModal 展示
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflowY: 'auto', overflowX: 'hidden' }}>
            <Sidebar />
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
                {theme === 'spring' && user && <ShareCardButton user={user} />}
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
                    {theme === 'christmas' ? 'Christmas Wonderland' : '春节欢庆 (Spring Festival Celebration)'}
                </h1>

                {theme === 'christmas' && <SantaSticker />}
                {theme === 'spring' && (
                    <>
                        <ChineseHorseSticker />
                        <CompassSticker />
                    </>
                )}

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
