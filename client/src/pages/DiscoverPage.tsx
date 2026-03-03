import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { getFriends, getSentFriendRequestIds } from '../api/friends';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { themeConfig } from '../constants/theme';
import PageTransition from '../components/Effects/PageTransition';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../components/Effects/PageTransition';

const DiscoverPage: React.FC = () => {
    const { theme } = useTheme();
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState('');
    const hasAppliedQueryParam = useRef(false);

    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const [addingId, setAddingId] = useState<string | null>(null);
    const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
    const [sentRequestIds, setSentRequestIds] = useState<Set<string>>(new Set());
    const [tipModal, setTipModal] = useState<{ show: boolean; message: string; isSuccess?: boolean }>({ show: false, message: '' });

    const loadFriendAndSentIds = () => {
        getFriends().then(friends => setFriendIds(new Set(friends.map(f => f._id)))).catch(() => {});
        getSentFriendRequestIds().then(ids => setSentRequestIds(new Set(ids))).catch(() => {});
    };

    useEffect(() => {
        loadFriendAndSentIds();
    }, []);

    useEffect(() => {
        if (hasAppliedQueryParam.current) return;
        const q = searchParams.get('q')?.trim();
        if (q) {
            hasAppliedQueryParam.current = true;
            setQuery(q);
            handleSearch(q);
        }
    }, [searchParams]);

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
            loadFriendAndSentIds();
        } catch (err: any) {
            setError(err?.response?.data?.message || '搜索失败，请检查网络');
        } finally {
            setLoading(false);
        }
    };

    const sendRequest = async (targetId: string) => {
        if (addingId) return;
        setAddingId(targetId); // 立即反馈：按钮变为「发送中...」
        try {
            const res = await api.post('/friends/request', { targetUserId: targetId });
            const autoAccepted = res?.data?.autoAccepted === true;
            setSentRequestIds(prev => new Set([...prev, targetId]));
            setTipModal({
                show: true,
                message: autoAccepted
                    ? (theme === 'spring' ? '已添加为好友！点击左侧「我的好友」即可看到 TA。' : 'Added as friend! Tap My Friends to see them.')
                    : (theme === 'spring' ? '好友请求已发送！点击左侧「我的好友」返回。' : 'Friend request sent! Tap My Friends to continue.'),
                isSuccess: true
            });
        } catch (err: any) {
            const status = err?.response?.status;
            const data = err?.response?.data;
            const msg = data?.message || data?.error || err?.message;
            if (status === 401) {
                setTipModal({ show: true, message: theme === 'spring' ? '登录已过期，请重新登录后再添加好友 Please log in again.' : 'Please log in again to add friends.' });
            } else if (msg === 'Request already exists or connected') {
                setTipModal({ show: true, message: theme === 'spring' ? '已发送过请求或已是好友。Already sent or already friends.' : 'Already sent or already friends.' });
            } else {
                setTipModal({ show: true, message: (theme === 'spring' ? '发送失败：' : 'Failed: ') + (msg || (theme === 'spring' ? '请重试' : 'Please retry')) });
            }
        } finally {
            setAddingId(null);
        }
    };

    const mainBg = themeConfig[theme].mainBg;

    const emptyStateConfig = {
        christmas: {
            icon: '🔍',
            title: '寻找好友 Find Your Friends',
            description: '输入昵称搜索好友，发送好友请求！ Search by nickname to send friend requests!',
            placeholder: '输入昵称搜索 Enter nickname to search',
            noResults: '未找到用户。换一个昵称试试，或邀请好友注册后搜索添加！ No users found. Try a different nickname or invite your friends!'
        },
        spring: {
            icon: '🔍',
            title: '寻找好友 Discover Friends',
            description: '输入昵称搜索好友，发送好友请求！ Search by nickname and send friend requests.',
            placeholder: '输入昵称搜索 Search by nickname',
            noResults: '未找到用户。尝试其他昵称，或邀请好友注册后搜索添加！ No users found. Try another nickname or invite friends to join.'
        }
    };

    const currentConfig = emptyStateConfig[theme];

    return (
        <div className="layout-with-sidebar" style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: 0, overflowY: 'auto' }}>
            <Sidebar />
            <div className="page-main" style={{
                flex: 1,
                minWidth: 0,
                padding: 'var(--page-padding-y) var(--page-padding-x)',
                overflowY: 'auto',
                background: mainBg,
                color: 'white',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                position: 'relative',
                zIndex: 60,
            }}>
                <PageTransition pageKey="discover">
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
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
                    <div
                        style={{ display: 'inline-flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}
                        data-onboarding-target="discover-search-row"
                    >
                        <input
                            id="discover-search"
                            name="discover-search"
                            type="text"
                            className="ios-input"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder={currentConfig.placeholder}
                            style={{ width: '300px', maxWidth: '100%', padding: '14px 18px', fontSize: '16px' }}
                            aria-label={currentConfig.placeholder}
                        />
                        <button
                            type="button"
                            className="ios-btn ios-btn-primary tap-scale"
                            onClick={() => handleSearch()}
                            disabled={loading || !query.trim()}
                            style={{ background: 'var(--ios-blue)', color: 'white', padding: '14px 28px', fontSize: '15px' }}
                            data-onboarding-target="discover-search-btn"
                        >
                            {loading ? '...' : '🔍'}
                        </button>
                    </div>
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
                            <p style={{ color: 'var(--ios-gray)', margin: 0 }}>搜索中... <span className="bilingual-en">Searching...</span></p>
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
                        results.map((u, index) => {
                            const uid = u._id ?? u.id;
                            const isFriend = uid ? friendIds.has(uid) : false;
                            const isSent = uid ? sentRequestIds.has(uid) : false;
                            const isAdding = addingId === uid;
                            const isGray = isFriend || isSent;
                            const isFirstAddable = index === 0 && !isGray && !!uid;
                            const handleAdd = (e: React.MouseEvent) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (isGray || !uid || isAdding) return;
                                sendRequest(uid);
                            };
                            return (
                                <motion.div
                                    key={uid}
                                    variants={staggerItem}
                                    className="discover-item"
                                    style={{
                                        padding: '20px 24px',
                                        borderBottom: '1px solid rgba(60,60,67,0.08)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'background 0.2s',
                                        ...(isGray ? { background: 'rgba(60,60,67,0.06)', opacity: 0.85 } : {}),
                                    }}
                                    whileHover={isGray ? undefined : { background: 'rgba(0,122,255,0.05)' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                        <span style={{ fontSize: '28px', lineHeight: 1, flexShrink: 0 }}>{u.avatar || '👤'}</span>
                                        <div style={{ minWidth: 0, overflow: 'hidden', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                            <strong style={{ fontSize: '17px', fontWeight: 600, color: isGray ? '#8e8e93' : '#333' }}>{u.nickname || '未设置昵称'}</strong>
                                            <span style={{ fontSize: '14px', color: 'var(--ios-gray)', marginLeft: '10px' }}>
                                                📍 {u.region || '未设置地区'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="ios-btn ios-btn-pill tap-scale"
                                        onClick={handleAdd}
                                        disabled={isAdding || isGray}
                                        data-onboarding-target={isFirstAddable ? 'discover-add-btn' : undefined}
                                        style={{
                                            flexShrink: 0,
                                            background: isGray ? '#e5e5ea' : (isAdding ? '#ccc' : 'var(--ios-blue)'),
                                            color: isGray ? '#8e8e93' : 'white',
                                            padding: '10px 20px',
                                            fontSize: '14px',
                                            cursor: isGray ? 'default' : (isAdding ? 'not-allowed' : 'pointer'),
                                        }}
                                    >
                                        {isFriend
                                            ? (theme === 'spring' ? <>已添加 <span className="bilingual-en">Added</span></> : 'Added')
                                            : isSent
                                                ? (theme === 'spring' ? <>已发送 <span className="bilingual-en">Sent</span></> : 'Sent')
                                                : (isAdding ? <>发送中... <span className="bilingual-en">Sending...</span></> : <>+ 添加 <span className="bilingual-en">Add</span></>)}
                                    </button>
                                </motion.div>
                            );
                        })
                    )}
                </motion.div>
                </PageTransition>
            </div>

            {/* 操作结果弹窗：成功/已发送过/失败等 */}
            {tipModal.show && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.4)',
                        padding: '24px',
                    }}
                    onClick={() => setTipModal(prev => ({ ...prev, show: false }))}
                >
                    <div
                        className="ios-card tap-scale"
                        style={{
                            maxWidth: '340px',
                            width: '100%',
                            padding: '24px',
                            background: 'white',
                            borderRadius: '16px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            color: '#333',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <p style={{ margin: '0 0 20px', fontSize: '16px', lineHeight: 1.5 }}>
                            {tipModal.message}
                        </p>
                        <button
                            type="button"
                            className="ios-btn tap-scale"
                            onClick={() => setTipModal(prev => ({ ...prev, show: false }))}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: tipModal.isSuccess ? 'var(--ios-blue)' : '#8e8e93',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '16px',
                                cursor: 'pointer',
                            }}
                        >
                            {theme === 'spring' ? '知道了' : 'Got it'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiscoverPage;
