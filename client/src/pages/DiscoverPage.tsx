import React, { useState } from 'react';
import api from '../api/client';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { themeConfig } from '../constants/theme';
import PageTransition from '../components/Effects/PageTransition';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../components/Effects/PageTransition';
import Snowfall from '../components/Effects/Snowfall';
import SpringFestivalEffects from '../components/Effects/SpringFestivalEffects';

const DiscoverPage: React.FC = () => {
    const { theme } = useTheme();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);

    const handleSearch = async (searchQuery?: string) => {
        const q = searchQuery !== undefined ? searchQuery : query;
        const trimmed = q.trim();
        if (!trimmed) return;
        setLoading(true);
        setError('');
        setHasSearched(true);
        try {
            const res = await api.get(`/users/search?nickname=${encodeURIComponent(trimmed)}`);
            setResults(res.data);
        } catch (err: any) {
            setError(err?.response?.data?.message || '搜索失败，请检查网络');
        } finally {
            setLoading(false);
        }
    };

    const sendRequest = async (targetId: string) => {
        if (addingId) return;
        setAddingId(targetId);
        try {
            await api.post('/friends/request', { targetUserId: targetId });
            alert(theme === 'spring' ? '好友请求已发送！' : 'Friend request sent!');
        } catch (err: any) {
            const status = err?.response?.status;
            const data = err?.response?.data;
            const msg = data?.message || data?.error || err?.message;
            if (status === 401) {
                alert(theme === 'spring' ? '登录已过期，请重新登录后再添加好友' : 'Please log in again to add friends');
            } else if (msg === 'Request already exists or connected') {
                alert(theme === 'spring' ? '已发送过请求或已是好友' : 'Already sent or already friends');
            } else {
                alert((theme === 'spring' ? '发送失败：' : 'Failed: ') + (msg || (theme === 'spring' ? '请重试' : 'Please retry')));
            }
        } finally {
            setAddingId(null);
        }
    };

    const mainBg = themeConfig[theme].mainBg;

    const emptyStateConfig = {
        christmas: {
            icon: '🔍',
            title: '寻找好友 (Find Your Friends)',
            description: '输入昵称搜索好友，发送好友请求！ (Search by nickname to send friend requests!)',
            placeholder: '输入昵称搜索 (Enter nickname to search)',
            noResults: '未找到用户 (No users found). Try a different nickname or invite your friends!'
        },
        spring: {
            icon: '🔍',
            title: '寻找好友 (Discover Friends)',
            description: '输入昵称搜索好友，发送好友请求！ (Search by nickname and send friend requests)',
            placeholder: '输入昵称搜索 (Search by nickname)',
            noResults: '未找到用户。尝试其他昵称，或邀请好友注册后搜索添加！ (No users found. Try another nickname or invite friends to join.)'
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
                overflowY: 'auto',
                background: mainBg,
                color: 'white',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
            }}>
                <PageTransition pageKey="discover">
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '28px'
                }}>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>
                        👋 {currentConfig.title}
                    </h1>
                </header>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' }}
                >
                    <input
                        type="text"
                        className="ios-input"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder={currentConfig.placeholder}
                        style={{ width: '300px', maxWidth: '100%', padding: '14px 18px', fontSize: '16px' }}
                    />
                    <button
                        className="ios-btn ios-btn-primary tap-scale"
                        onClick={() => handleSearch()}
                        disabled={loading || !query.trim()}
                        style={{ background: 'var(--ios-blue)', color: 'white', padding: '14px 28px', fontSize: '15px' }}
                    >
                        {loading ? '...' : '🔍'}
                    </button>
                </motion.div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="ios-info-banner"
                        style={{ marginBottom: '24px', background: 'rgba(255,59,48,0.2)', borderColor: 'rgba(255,59,48,0.3)', color: '#fff' }}
                    >
                        {error}
                    </motion.div>
                )}

                <motion.div
                    className="ios-card"
                    style={{
                        background: 'rgba(255,255,255,0.95)',
                        color: '#333',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        minHeight: '200px',
                    }}
                    variants={staggerContainer}
                    initial="hidden"
                    animate={loading ? "hidden" : "visible"}
                >
                    {loading ? (
                        <div style={{ padding: '48px', textAlign: 'center' }}>
                            <div className="empty-state-icon" style={{ fontSize: '48px', marginBottom: '12px' }}>⏳</div>
                            <p style={{ color: 'var(--ios-gray)', margin: 0 }}>搜索中... (Searching...)</p>
                        </div>
                    ) : hasSearched && results.length === 0 ? (
                        <motion.div variants={staggerItem} style={{ padding: '48px 24px', textAlign: 'center' }}>
                            <div className="empty-state-icon" style={{ fontSize: '64px', marginBottom: '16px' }}>😕</div>
                            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600, color: '#333' }}>
                                {currentConfig.title}
                            </h3>
                            <p style={{ color: 'var(--ios-gray)', fontSize: '15px', lineHeight: 1.6, margin: 0, maxWidth: '400px', marginInline: 'auto' }}>
                                {currentConfig.noResults}
                            </p>
                        </motion.div>
                    ) : !hasSearched ? (
                        <motion.div variants={staggerItem} style={{ padding: '64px 24px', textAlign: 'center' }}>
                            <div className="empty-state-icon" style={{ fontSize: '80px', marginBottom: '20px' }}>
                                {currentConfig.icon}
                            </div>
                            <h3 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 600, color: '#333' }}>
                                {currentConfig.title}
                            </h3>
                            <p style={{ color: 'var(--ios-gray)', fontSize: '15px', lineHeight: 1.6, margin: 0, maxWidth: '400px', marginInline: 'auto' }}>
                                {currentConfig.description}
                            </p>
                        </motion.div>
                    ) : (
                        results.map(u => (
                            <motion.div
                                key={u._id}
                                variants={staggerItem}
                                className="discover-item tap-scale"
                                style={{
                                    padding: '20px 24px',
                                    borderBottom: '1px solid rgba(60,60,67,0.08)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'background 0.2s',
                                }}
                                whileHover={{ background: 'rgba(0,122,255,0.05)' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '28px', lineHeight: 1 }}>{u.avatar || '👤'}</span>
                                    <div>
                                        <strong style={{ fontSize: '17px', fontWeight: 600, color: '#333' }}>{u.nickname || '未设置昵称'}</strong>
                                        <span style={{ fontSize: '14px', color: 'var(--ios-gray)', marginLeft: '10px' }}>
                                            📍 {u.region || '未设置地区'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    className="ios-btn ios-btn-pill tap-scale"
                                    onClick={() => sendRequest(u._id)}
                                    disabled={addingId === u._id}
                                    style={{
                                        background: addingId === u._id ? '#ccc' : 'var(--ios-blue)',
                                        color: 'white',
                                        padding: '10px 20px',
                                        fontSize: '14px',
                                        cursor: addingId === u._id ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {addingId === u._id ? '发送中... (Sending...)' : '+ 添加 (Add)'}
                                </button>
                            </motion.div>
                        ))
                    )}
                </motion.div>
                </PageTransition>
            </div>
        </div>
    );
};

export default DiscoverPage;
