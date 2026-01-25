import React, { useState, useEffect } from 'react';
import { getFriends } from '../../api/friends';
import { sendMessage } from '../../api/messages';
import type { User } from '../../types';

interface ComposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialSeason?: 'christmas' | 'spring';
}

const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, initialSeason = 'christmas' }) => {
    const [friends, setFriends] = useState<User[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<string>('');
    const [season, setSeason] = useState<'christmas' | 'spring'>(initialSeason);
    const [sticker, setSticker] = useState<string>('🎄');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadFriends();
        }
    }, [isOpen]);

    const loadFriends = async () => {
        try {
            const list = await getFriends();
            setFriends(list);
            if (list.length > 0) setSelectedFriend(list[0]._id);
        } catch (err) {
            console.error("Failed to load friends", err);
        }
    };

    const handleSend = async () => {
        if (!selectedFriend) return alert("Select a friend first!");
        if (!content.trim()) return alert("Write a message!");

        setLoading(true);
        try {
            await sendMessage({
                recipientId: selectedFriend,
                stickerType: sticker,
                content,
                season
            });
            alert("Message sent!");
            onClose();
            setContent('');
        } catch (err) {
            alert("Failed to send message.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const stickers = season === 'christmas'
        ? ['🎄', '🎅', '❄️', '🎁', '⛄']
        : ['🧧', '🏮', '🐉', '🥟', '🎇'];

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3>Send a Festive Greeting</h3>

                <label>To:</label>
                <select value={selectedFriend} onChange={e => setSelectedFriend(e.target.value)} style={styles.input}>
                    {friends.map(f => (
                        <option key={f._id} value={f._id}>{f.nickname} ({f.region})</option>
                    ))}
                </select>

                <label>Season:</label>
                <div style={styles.toggles}>
                    <button style={season === 'christmas' ? styles.activeTab : styles.tab} onClick={() => setSeason('christmas')}>Christmas</button>
                    <button style={season === 'spring' ? styles.activeTab : styles.tab} onClick={() => setSeason('spring')}>Spring Festival</button>
                </div>

                <label>Choose a Sticker:</label>
                <div style={styles.stickers}>
                    {stickers.map(s => (
                        <span
                            key={s}
                            style={{ ...styles.sticker, border: sticker === s ? '2px solid gold' : 'none' }}
                            onClick={() => setSticker(s)}
                        >
                            {s}
                        </span>
                    ))}
                </div>

                <textarea
                    placeholder="Write your warm wishes..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    style={styles.textarea}
                />

                <div style={styles.actions}>
                    <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
                    <button onClick={handleSend} disabled={loading} style={styles.sendBtn}>
                        {loading ? 'Sending...' : 'Send Wishes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    },
    modal: {
        backgroundColor: 'white', padding: '20px', borderRadius: '15px', width: '90%', maxWidth: '500px',
        display: 'flex', flexDirection: 'column', gap: '10px', color: '#333'
    },
    input: { padding: '8px', borderRadius: '5px', border: '1px solid #ccc' },
    toggles: { display: 'flex', gap: '10px' },
    tab: { padding: '5px 10px', border: '1px solid #ccc', background: '#eee', borderRadius: '5px', cursor: 'pointer' },
    activeTab: { padding: '5px 10px', border: '1px solid #2f5a28', background: '#2f5a28', color: 'white', borderRadius: '5px', cursor: 'pointer' },
    stickers: { display: 'flex', gap: '10px', fontSize: '24px', padding: '10px 0' },
    sticker: { cursor: 'pointer', padding: '5px', borderRadius: '5px' },
    textarea: { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', minHeight: '100px' },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' },
    cancelBtn: { padding: '8px 15px', background: 'transparent', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer' },
    sendBtn: { padding: '8px 15px', background: '#d42426', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default ComposeModal;
