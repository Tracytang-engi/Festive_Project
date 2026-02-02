import React, { useState } from 'react';
import api from '../api/client';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { themeConfig } from '../constants/theme';

const DiscoverPage: React.FC = () => {
    const { theme } = useTheme();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (searchQuery?: string) => {
        const q = searchQuery !== undefined ? searchQuery : query;
        const trimmed = q.trim();
        if (!trimmed) return;
        setLoading(true);
        setError('');
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
        try {
            await api.post('/friends/request', { targetUserId: targetId });
            alert("好友请求已发送！");
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.message;
            alert(msg === "Request already exists or connected" ? "已发送过请求或已是好友" : "发送失败：" + (msg || "请重试"));
        }
    };

    const mainBg = themeConfig[theme].mainBg;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflowY: 'auto' }}>
            <Sidebar />
            <div style={{
                flex: 1,
                padding: '32px 40px',
                overflowY: 'auto',
                background: mainBg,
                color: 'white',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
            }}>
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '28px'
                }}>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>
                        👋 Discover Friends
                    </h1>
                </header>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' }}>
                    <input
                        type="text"
                        className="ios-input"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="输入昵称搜索"
                        style={{ width: '300px', maxWidth: '100%' }}
                    />
                    <button
                        className="ios-btn ios-btn-primary tap-scale"
                        onClick={() => handleSearch()}
                        disabled={loading || !query.trim()}
                        style={{ background: 'var(--ios-blue)', color: 'white', padding: '12px 24px' }}
                    >
                        {loading ? '搜索中...' : '搜索'}
                    </button>
                </div>

                {error && (
                    <div className="ios-info-banner" style={{ marginBottom: '24px', background: 'rgba(255,59,48,0.2)', borderColor: 'rgba(255,59,48,0.3)', color: '#fff' }}>
                        {error}
                    </div>
                )}

                <div className="ios-card" style={{
                    background: 'rgba(255,255,255,0.95)',
                    color: '#333',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                }}>
                    {loading && (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ios-gray)' }}>加载中...</div>
                    )}
                    {!loading && results.length === 0 && (
                        <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--ios-gray)', fontSize: '16px', lineHeight: 1.5 }}>
                            暂无其他用户。请寻找已在 Festivities 注册的好友，或邀请好友注册后在此搜索其昵称添加好友。
                        </div>
                    )}
                    {!loading && results.map(u => (
                        <div
                            key={u._id}
                            className="discover-item tap-scale"
                            style={{
                                padding: '18px 24px',
                                borderBottom: '1px solid rgba(60,60,67,0.08)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'background 0.2s'
                            }}
                        >
                            <div>
                                <strong style={{ fontSize: '17px', fontWeight: 600 }}>{u.nickname || '未设置昵称'}</strong>
                                <span style={{ fontSize: '15px', color: 'var(--ios-gray)', marginLeft: '8px' }}>
                                    {u.region || '未设置地区'}
                                </span>
                            </div>
                            <button
                                className="ios-btn ios-btn-pill tap-scale"
                                onClick={() => sendRequest(u._id)}
                                style={{ background: 'var(--ios-blue)', color: 'white', padding: '10px 20px' }}
                            >
                                添加好友
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DiscoverPage;
