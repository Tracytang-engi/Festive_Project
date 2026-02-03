import React, { useState, useEffect } from 'react';
import { getFriends } from '../../api/friends';
import { sendMessage } from '../../api/messages';
import StickerIcon from '../StickerIcon';
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
            setSeason(initialSeason);
            setSticker(initialSeason === 'spring' ? '🧧' : '🎄');
        }
    }, [isOpen, initialSeason]);

    const loadFriends = async () => {
        try {
            const list = await getFriends();
            setFriends(list);
            setSelectedFriend(list.length > 0 ? list[0]._id : '');
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
        : ['🧧', '🏮', '🐴', '🥟', '🎇', 'peach', 'couplets', 'paper_cutting', 'clouds', 'coin', 'chinese_knotting', 'painting', 'loong'];

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3 style={styles.title}>Send a Festive Greeting</h3>

                <label style={styles.label}>To</label>
                <select value={selectedFriend} onChange={e => setSelectedFriend(e.target.value)} className="ios-input" style={styles.input}>
                    {friends.map(f => (
                        <option key={f._id} value={f._id}>{f.nickname} ({f.region ?? '未设置地区'})</option>
                    ))}
                </select>

                <label style={styles.label}>Season</label>
                <div className="ios-segmented" style={styles.toggles}>
                    <button className={season === 'christmas' ? 'active' : ''} onClick={() => setSeason('christmas')}>Christmas</button>
                    <button className={season === 'spring' ? 'active' : ''} onClick={() => setSeason('spring')}>Spring Festival</button>
                </div>

                <label style={styles.label}>Choose a Sticker</label>
                <div style={styles.stickersWrap}>
                    <div style={styles.stickers}>
                        {stickers.map(s => (
                            <span
                                key={s}
                                className="tap-scale"
                                style={{ ...styles.sticker, border: sticker === s ? '2px solid #007AFF' : 'none', background: sticker === s ? 'rgba(0,122,255,0.08)' : 'transparent' }}
                                onClick={() => setSticker(s)}
                            >
                                <StickerIcon stickerType={s} size={84} />
                            </span>
                        ))}
                    </div>
                </div>

                <label style={styles.label}>Message</label>
                <textarea
                    placeholder="Write your warm wishes..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    style={styles.textarea}
                />

                <div style={styles.actions}>
                    <button className="ios-btn tap-scale" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
                    <button className="ios-btn tap-scale" onClick={handleSend} disabled={loading} style={styles.sendBtn}>
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
        backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    },
    modal: {
        backgroundColor: 'white', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '540px',
        display: 'flex', flexDirection: 'column', gap: '16px', color: '#333',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    },
    title: { margin: 0, fontSize: '20px', fontWeight: 600 },
    label: { fontSize: '13px', color: '#8e8e93', fontWeight: 500 },
    input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(60,60,67,0.12)', fontSize: '16px', width: '100%', boxSizing: 'border-box' as const },
    toggles: { display: 'flex', gap: '8px' },
    stickersWrap: { maxHeight: '200px', overflowY: 'auto', padding: '4px 0' },
    stickers: { display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '8px 0' },
    sticker: { cursor: 'pointer', padding: '8px', borderRadius: '12px', transition: 'background 0.2s', flexShrink: 0 },
    textarea: { padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(60,60,67,0.12)', minHeight: '100px', fontSize: '16px', fontFamily: 'inherit' },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' },
    cancelBtn: { padding: '10px 18px', background: '#f2f2f7', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 500 },
    sendBtn: { padding: '10px 18px', background: '#FF3B30', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 500, transition: 'opacity 0.2s' }
};

export default ComposeModal;
