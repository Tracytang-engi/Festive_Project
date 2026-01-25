import React, { useEffect, useState } from 'react';
import { getMessages } from '../api/messages';
import type { Message } from '../types';
import ComposeModal from '../components/Messages/ComposeModal';

const MessagesPage: React.FC = () => {
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

    return (
        <div className="page-container" style={{ padding: '20px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>My Mailbox 📬</h1>
                <button
                    onClick={() => setIsComposeOpen(true)}
                    style={{ padding: '10px 20px', background: '#d42426', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Write a Card ✍️
                </button>
            </header>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <button
                    onClick={() => setSeason('christmas')}
                    style={{ ...styles.tab, borderBottom: season === 'christmas' ? '3px solid #EF233C' : '3px solid transparent' }}
                >
                    Christmas 🎄
                </button>
                <button
                    onClick={() => setSeason('spring')}
                    style={{ ...styles.tab, borderBottom: season === 'spring' ? '3px solid #D90429' : '3px solid transparent' }}
                >
                    Spring Festival 🧧
                </button>
            </div>

            {!isUnlocked && messages.length > 0 && (
                <div style={{ padding: '15px', background: '#fff3cd', color: '#856404', borderRadius: '8px', marginBottom: '20px' }}>
                    🔒 Messages are locked until the festival day! You can see who sent them, but not the content.
                </div>
            )}

            {loading ? <p>Loading...</p> : (
                <div style={styles.grid}>
                    {messages.length === 0 ? <p>No messages yet. Send one to a friend!</p> : (
                        messages.map(msg => (
                            <div key={msg._id} style={styles.card}>
                                <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                                    {isUnlocked ? msg.stickerType : '🔒'}
                                </div>
                                <div style={{ marginBottom: '10px', fontStyle: 'italic' }}>
                                    From: <strong>{typeof msg.sender === 'object' ? msg.sender.nickname : 'Unknown'}</strong>
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
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    tab: { background: 'none', border: 'none', color: 'white', fontSize: '18px', padding: '10px', cursor: 'pointer' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' },
    card: { background: 'white', color: '#333', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' },
    content: { background: '#f8f9fa', padding: '10px', borderRadius: '5px', minHeight: '60px' }
};

export default MessagesPage;
