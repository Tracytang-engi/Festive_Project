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
import Snowfall from '../components/Effects/Snowfall';
import SpringFestivalEffects from '../components/Effects/SpringFestivalEffects';

const FriendsPage: React.FC = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [friends, setFriends] = useState<User[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

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
        } catch (err) {
            alert("Action failed.");
        }
    };

    const emptyStateConfig = {
        christmas: {
            title: 'My Inner Circle 👥',
            noFriendsTitle: 'No Friends Yet',
            noFriendsDesc: 'Go to Discover to find friends and spread the holiday cheer!',
            noFriendsIcon: '🎄',
            requestsTitle: 'Friend Requests'
        },
        spring: {
            title: '我的好友圈 👥',
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
            {theme === 'christmas' ? (
                <Snowfall intensity="light" />
            ) : (
                <SpringFestivalEffects showSnow={true} intensity="light" />
            )}
            <div style={{
                flex: 1,
                padding: '32px 40px',
                background: themeConfig[theme].mainBg,
                color: 'white',
                overflowY: 'auto',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
            }}>
                <PageTransition pageKey="friends">
                <h1 style={{ margin: '0 0 28px', fontSize: '28px', fontWeight: 700 }}>{currentConfig.title}</h1>

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
                                style={{ marginBottom: '40px' }}
                            >
                                <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                            <div className="icon-lg" style={{ marginBottom: '10px', fontSize: '48px' }}>{req.requester?.avatar || '👤'}</div>
                                            <div>
                                                <strong style={{ fontSize: '16px' }}>{req.requester.nickname}</strong>
                                                <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '4px' }}>📍 {req.requester.region}</div>
                                            </div>
                                            <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
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
                            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
                                {currentConfig.title.replace('👥', '')} ({friends.length})
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
                                    {friends.map(friend => (
                                        <motion.div
                                            key={friend._id}
                                            variants={staggerItem}
                                            className="tap-scale"
                                            style={{ ...styles.card, cursor: 'pointer' }}
                                            whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            onClick={() => navigate(`/friend/${friend._id}/decor`)}
                                            title={theme === 'spring' ? '查看TA的春节页面' : 'View their Spring Festival page'}
                                        >
                                            <div className="icon-lg" style={{ marginBottom: '10px', fontSize: '56px' }}>{friend.avatar || '👤'}</div>
                                            <div>
                                                <strong style={{ fontSize: '16px', color: '#333' }}>{friend.nickname}</strong>
                                                <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '4px' }}>📍 {friend.region}</div>
                                            </div>
                                            <div style={{ fontSize: '12px', marginTop: '8px', color: '#007AFF' }}>
                                                {theme === 'spring' ? '查看春节页' : 'View Spring page'}
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
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' },
    card: { background: 'rgba(255,255,255,0.95)', color: '#333', padding: '24px 20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'box-shadow 0.2s ease' },
    acceptBtn: { background: '#34C759', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 500, fontSize: '16px', transition: 'opacity 0.2s, transform 0.2s' },
    rejectBtn: { background: '#FF3B30', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 500, fontSize: '16px', transition: 'opacity 0.2s, transform 0.2s' }
};

export default FriendsPage;
