import React, { useEffect, useState } from 'react';
import { getMessages } from '../api/messages';
import type { Message } from '../types';
import ComposeModal from '../components/Messages/ComposeModal';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { themeConfig } from '../constants/theme';

const MessagesPage: React.FC = () => {
    const { theme } = useTheme();
    const [season, setSeason] = useState<'christmas' | 'spring'>('christmas');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isComposeOpen, setIsComposeOpen] = useState(false);

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
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
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
                            <div key={msg._id} className="ios-card tap-scale" style={styles.card}>
                                <div className="icon-lg" style={{ marginBottom: '12px' }}>{isUnlocked ? msg.stickerType : '🔒'}</div>
                                <div style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--ios-gray)' }}>
                                    From: <strong style={{ color: '#333' }}>{typeof msg.sender === 'object' ? msg.sender.nickname : 'Unknown'}</strong>
                                </div>
                                <div style={styles.content}>
                                    {isUnlocked ? msg.content : "This message is sealed until " + (season === 'christmas' ? "Christmas" : "Spring Festival") + "!"}
                                </div>
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
