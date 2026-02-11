import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { themeConfig } from '../constants/theme';
import { getNotifications, markAllAsRead } from '../api/notifications';
import type { NotificationItem } from '../api/notifications';
import { useNavigate } from 'react-router-dom';
import Snowfall from '../components/Effects/Snowfall';
import SpringFestivalEffects from '../components/Effects/SpringFestivalEffects';
import StickerDetailModal from '../components/Messages/StickerDetailModal';
import TipModal from '../components/TipModal';
import { getMessageDetail } from '../api/messages';
import type { Message } from '../types';

const NotificationsPage: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState<{ message: Message; isUnlocked: boolean } | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [tip, setTip] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

    useEffect(() => {
        const init = async () => {
            try {
                await markAllAsRead();
                window.dispatchEvent(new CustomEvent('notifications-updated'));
            } catch {
                // ignore
            }
            await loadData();
        };
        init();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const list = await getNotifications();
            setNotifications(list);
        } catch {
            console.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async () => {
        try {
            await markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            window.dispatchEvent(new CustomEvent('notifications-updated'));
        } catch (err) {
            console.error(err);
        }
    };

    const openMessageDetail = async (messageId: string) => {
        try {
            setDetailLoading(true);
            const data = await getMessageDetail(messageId);
            setSelectedDetail({ message: data.message, isUnlocked: data.isUnlocked });
        } catch (err) {
            console.error(err);
            setTip({ show: true, message: '无法加载贺卡详情，请稍后再试 Failed to load card. Please try again.' });
        } finally {
            setDetailLoading(false);
        }
    };

    const handleAction = (note: NotificationItem) => {
        if (note.type === 'FRIEND_REQUEST' || note.type === 'CONNECTION_SUCCESS') {
            navigate('/friends');
        } else if (note.type === 'NEW_MESSAGE') {
            const season = note.season || 'christmas';
            toggleTheme(season);  // 切换到 sticker 对应的主题
            if (note.relatedEntityId) {
                openMessageDetail(note.relatedEntityId);
            } else {
                // 兼容旧通知：无 messageId 时退回到原来的行为，打开收件箱
                navigate(`/messages?season=${season}`);
            }
        }
    };

    const styles: { [key: string]: React.CSSProperties } = {
        container: { display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflowY: 'auto' },
        main: {
            flex: 1, minWidth: 0, padding: 'var(--page-padding-y) var(--page-padding-x)', color: 'white', overflowY: 'auto',
            background: themeConfig[theme].mainBg,
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            position: 'relative' as const,
            zIndex: 60,
        },
        list: { display: 'flex', flexDirection: 'column', gap: '12px' },
        item: {
            padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px',
            cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        },
        unread: { background: theme === 'christmas' ? '#FF3B30' : '#AF52DE', color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
        read: { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' },
        icon: {}
    };

    return (
        <div style={styles.container}>
            <Sidebar />
            {theme === 'christmas' ? (
                <Snowfall intensity="light" />
            ) : (
                <SpringFestivalEffects showSnow={true} intensity="light" />
            )}
            <div style={styles.main}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h1>🔔 通知 <span className="bilingual-en">Notifications</span></h1>
                    {notifications.some(n => !n.isRead) && (
                        <button className="ios-btn ios-btn-pill" onClick={handleMarkRead} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.9)', color: '#333' }}>
                            全部已读 <span className="bilingual-en">Mark all read</span>
                        </button>
                    )}
                </header>

                {loading ? <p>加载中... <span className="bilingual-en">Loading...</span></p> : (
                    <div style={styles.list}>
                        {notifications.length === 0 ? <p>暂无新通知 <span className="bilingual-en">No new updates here!</span></p> : (
                            notifications.map(note => (
                                <div
                                    key={note._id}
                                    className="tap-scale"
                                    style={{ ...styles.item, ...(note.isRead ? styles.read : styles.unread) }}
                                    onClick={() => handleAction(note)}
                                >
                                    <div className="icon-responsive" style={styles.icon}>
                                        {note.type === 'FRIEND_REQUEST' ? '👋' :
                                            note.type === 'NEW_MESSAGE' ? '✉️' : '🤝'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>
                                            {note.type === 'FRIEND_REQUEST' ? <>新好友请求 <span className="bilingual-en">New Friend Request</span></> :
                                                note.type === 'NEW_MESSAGE' ? <>新祝福消息 <span className="bilingual-en">New Festive Message</span></> : <>已添加好友 <span className="bilingual-en">Friend Request Accepted</span></>}
                                        </div>
                                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                                            {note.type === 'FRIEND_REQUEST' ? `${note.relatedUser?.nickname} wants to be friends!` :
                                                note.type === 'NEW_MESSAGE' ? `${note.relatedUser?.nickname} sent you a card!` :
                                                    `You and ${note.relatedUser?.nickname} are now connected!`}
                                        </div>
                                    </div>
                                    <div style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.7 }}>
                                        {new Date(note.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
                {selectedDetail && !selectedDetail.isUnlocked && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2000,
                        }}
                        onClick={() => setSelectedDetail(null)}
                    >
                        <div
                            className="ios-card tap-scale"
                            style={{
                                position: 'relative',
                                background: 'linear-gradient(145deg, #fff9e6 0%, #fff3cc 100%)',
                                padding: '32px 28px',
                                borderRadius: '20px',
                                maxWidth: '360px',
                                width: '90%',
                                color: '#333',
                                boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                                textAlign: 'center',
                                border: '2px solid rgba(255,193,7,0.4)',
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ fontSize: '56px', marginBottom: '16px', lineHeight: 1 }}>🧧</div>
                            <h2 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 700, color: '#b8860b' }}>
                                祝福已封存 <span className="bilingual-en">Blessing sealed</span>
                            </h2>
                            <p style={{ margin: '0 0 24px', fontSize: '16px', lineHeight: 1.6, color: '#5c4a00' }}>
                                这份心意要留到新年再拆开哦～ 届时再来打开，惊喜加倍！
                            </p>
                            <p style={{ margin: '0 0 24px', fontSize: '15px', lineHeight: 1.5, color: '#7a6a00' }}>
                                This card will unlock at the New Year. Come back then for a little surprise!
                            </p>
                            <button
                                className="ios-btn tap-scale"
                                onClick={() => setSelectedDetail(null)}
                                style={{
                                    padding: '14px 32px',
                                    background: 'linear-gradient(180deg, #c2185b 0%, #ad1457 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                }}
                            >
                                返回 <span className="bilingual-en">Return</span>
                            </button>
                        </div>
                    </div>
                )}
                {selectedDetail && selectedDetail.isUnlocked && (
                    <StickerDetailModal
                        message={selectedDetail.message}
                        isUnlocked={selectedDetail.isUnlocked}
                        onClose={() => setSelectedDetail(null)}
                    />
                )}
                {detailLoading && !selectedDetail && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.25)',
                        zIndex: 1500,
                        fontSize: '16px'
                    }}>
                        正在打开贺卡... <span className="bilingual-en">Opening card...</span>
                    </div>
                )}
            </div>
            <TipModal show={tip.show} message={tip.message} onClose={() => setTip(prev => ({ ...prev, show: false }))} />
        </div>
    );
};

export default NotificationsPage;
