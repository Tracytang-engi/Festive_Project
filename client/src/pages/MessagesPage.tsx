import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMessages } from '../api/messages';
import type { Message } from '../types';
import ComposeModal from '../components/Messages/ComposeModal';
import StickerDetailModal from '../components/Messages/StickerDetailModal';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { themeConfig } from '../constants/theme';

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

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflowY: 'auto' }}>
            <Sidebar />
            <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', background: mainBg, color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>My Mailbox 📬</h1>
                <button
                    className="ios-btn ios-btn-pill tap-scale"
                    onClick={() => setIsComposeOpen(true)}
                    style={{ padding: '12px 24px', background: '#FF3B30', color: 'white' }}
                >
                    Write a Card ✍️
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
                <div style={{ padding: '40px', textAlign: 'center', opacity: 0.9 }}>Loading...</div>
            ) : (
                <div style={styles.grid}>
                    {messages.length === 0 ? (
                        <div className="ios-card" style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center', color: 'var(--ios-gray)', fontSize: '17px' }}>
                            No messages yet. Send one to a friend!
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div
                                key={msg._id}
                                className="ios-card tap-scale"
                                style={{ ...styles.card, cursor: 'pointer', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '140px' }}
                                onClick={() => setDetailMessage(msg)}
                            >
                                <div className="icon-xxl" style={{ marginBottom: '8px', fontSize: '56px' }}>
                                    {isUnlocked ? msg.stickerType : '🔒'}
                                </div>
                                <span style={{ fontSize: '13px', color: 'var(--ios-gray)' }}>
                                    From: {typeof msg.sender === 'object' ? msg.sender.nickname : 'Unknown'}
                                </span>
                                <span style={{ fontSize: '12px', color: 'var(--ios-gray)', marginTop: '4px' }}>
                                    {isUnlocked ? 'Tap to view' : 'Sealed'}
                                </span>
                            </div>
                        ))
                    )}
                </div>
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
