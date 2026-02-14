import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { themeConfig } from '../constants/theme';
import { getFriends, getFriendRequests, respondToFriendRequest } from '../api/friends';
import type { User } from '../types';
import PageTransition from '../components/Effects/PageTransition';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../components/Effects/PageTransition';
import TipModal from '../components/TipModal';

const FriendsPage: React.FC = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [friends, setFriends] = useState<User[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [tip, setTip] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [friendsList, requestsList] = await Promise.all([
                getFriends(),
                getFriendRequests()
            ]);
            setFriends(friendsList);
            setRequests(requestsList);
        } catch (err) {
            console.error("Failed to load friends data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (requestId: string, action: 'accept' | 'reject') => {
        try {
            await respondToFriendRequest(requestId, action);
            loadData();
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? (theme === 'spring' ? '操作失败，请重试' : 'Action failed. Please try again.');
            setTip({ show: true, message: typeof msg === 'string' ? msg : '操作失败，请重试 Action failed. Please try again.' });
        }
    };

    const emptyStateConfig = {
        christmas: {
            title: 'My Inner Circle 👥',
            sectionTitle: 'My Inner Circle',
            noFriendsTitle: 'No Friends Yet',
            noFriendsDesc: 'Go to Discover to find friends and spread the holiday cheer!',
            noFriendsIcon: '🎄',
            requestsTitle: 'Friend Requests'
        },
        spring: {
            title: <>我的好友圈 <span className="bilingual-en">My Inner Circle</span> 👥</>,
            sectionTitle: <>我的好友圈 <span className="bilingual-en">My Inner Circle</span></>,
            noFriendsTitle: '还没有好友',
            noFriendsDesc: '去发现页面寻找好友，分享新春祝福吧！',
            noFriendsIcon: '🧧',
            requestsTitle: '好友请求'
        }
    };

    const currentConfig = emptyStateConfig[theme];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflowY: 'auto' }}>
            <Sidebar />
            <div
                style={{
                    flex: 1,
                    minWidth: 0,
                    padding: 'var(--page-padding-y) var(--page-padding-x)',
                    background: themeConfig[theme].mainBg,
                    color: 'white',
                    overflowY: 'auto',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    position: 'relative',
                    zIndex: 60,
                }}
                data-onboarding-target="friends-list-wrap"
            >
                <PageTransition pageKey="friends">
                                <h1 style={{ margin: '0 0 32px', fontSize: '26px', fontWeight: 600, letterSpacing: '-0.3px' }}>{currentConfig.title}</h1>

                {loading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ padding: '40px', textAlign: 'center' }}
                    >
                        <div className="empty-state-icon" style={{ fontSize: '48px', marginBottom: '12px' }}>⏳</div>
                        <p style={{ opacity: 0.8 }}>Loading...</p>
                    </motion.div>
                ) : (
                    <>
                        {requests.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ marginBottom: '36px' }}
                            >
                                <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.95 }}>
                                    🔔 {currentConfig.requestsTitle}
                                </h2>
                                <motion.div
                                    style={styles.grid}
                                    variants={staggerContainer}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {requests.map(req => (
                                        <motion.div
                                            key={req._id}
                                            variants={staggerItem}
                                            style={styles.card}
                                        >
                                            <div className="icon-lg" style={{ marginBottom: '12px', fontSize: '48px', lineHeight: 1 }}>{req.requester?.avatar || '👤'}</div>
                                            <div style={{ width: '100%' }}>
                                                <div style={{ fontSize: '16px', fontWeight: 600, color: '#1d1d1f' }}>{req.requester?.nickname}</div>
                                                {req.requester?.region && (
                                                    <div style={{ fontSize: '13px', color: '#8e8e93', marginTop: '4px' }}>📍 {req.requester.region}</div>
                                                )}
                                            </div>
                                            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                                                <button
                                                    className="ios-btn tap-scale"
                                                    onClick={() => handleRespond(req._id, 'accept')}
                                                    style={styles.acceptBtn}
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    className="ios-btn tap-scale"
                                                    onClick={() => handleRespond(req._id, 'reject')}
                                                    style={styles.rejectBtn}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.div>
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '14px', opacity: 0.95 }}>
                                <>{currentConfig.sectionTitle} ({friends.length})</>
                            </h2>
                            {friends.length === 0 ? (
                                <motion.div
                                    className="ios-card"
                                    style={{
                                        ...styles.card,
                                        padding: '64px 48px',
                                        background: 'rgba(255,255,255,0.95)',
                                    }}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <div className="empty-state-icon" style={{ fontSize: '80px', marginBottom: '16px' }}>
                                        {currentConfig.noFriendsIcon}
                                    </div>
                                    <h3 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 600, color: '#333' }}>
                                        {currentConfig.noFriendsTitle}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '15px', color: '#666', lineHeight: 1.6, maxWidth: '300px' }}>
                                        {currentConfig.noFriendsDesc}
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    style={styles.grid}
                                    variants={staggerContainer}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {friends.map((friend, index) => (
                                        <motion.div
                                            key={friend._id}
                                            variants={staggerItem}
                                            className="tap-scale"
                                            style={{ ...styles.card, cursor: 'pointer' }}
                                            whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }}
                                            onClick={() => navigate(`/friend/${friend._id}/decor`)}
                                            title={theme === 'spring' ? '查看TA的春节页面' : 'View their Spring Festival page'}
                                            data-onboarding-target={index === 0 ? 'friend-card' : undefined}
                                        >
                                            <div className="icon-lg" style={{ marginBottom: '12px', fontSize: '52px', lineHeight: 1 }}>{friend.avatar || '👤'}</div>
                                            <div style={{ width: '100%' }}>
                                                <div style={{ fontSize: '16px', fontWeight: 600, color: '#1d1d1f' }}>{friend.nickname}</div>
                                                {friend.region && (
                                                    <div style={{ fontSize: '13px', color: '#8e8e93', marginTop: '4px' }}>📍 {friend.region}</div>
                                                )}
                                            </div>
                                            <div style={{ marginTop: '12px', fontSize: '14px', color: '#007AFF', fontWeight: 500 }}>
                                                点击进入 <span className="bilingual-en">(Click to visit)</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </motion.div>
                    </>
                )}
                </PageTransition>
            </div>
            <TipModal show={tip.show} message={tip.message} onClose={() => setTip(prev => ({ ...prev, show: false }))} />
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' },
    card: {
        background: 'rgba(255,255,255,0.96)',
        color: '#333',
        padding: '28px 24px',
        borderRadius: '20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
    },
    acceptBtn: { background: '#34C759', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 500, fontSize: '15px', transition: 'opacity 0.2s, transform 0.2s' },
    rejectBtn: { background: '#FF3B30', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 500, fontSize: '15px', transition: 'opacity 0.2s, transform 0.2s' }
};

export default FriendsPage;
