import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { themeConfig } from '../constants/theme';
import { getNotifications, markAllAsRead } from '../api/notifications';
import type { NotificationItem } from '../api/notifications';
import { useNavigate } from 'react-router-dom';

const NotificationsPage: React.FC = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const list = await getNotifications();
            setNotifications(list);
        } catch (err) {
            console.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async () => {
        try {
            await markAllAsRead();
            // Optimistically update local state
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const handleAction = (note: NotificationItem) => {
        if (note.type === 'FRIEND_REQUEST' || note.type === 'CONNECTION_SUCCESS') {
            navigate('/friends');
        } else if (note.type === 'NEW_MESSAGE') {
            navigate('/messages');
        }
    };

    const styles: { [key: string]: React.CSSProperties } = {
        container: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' },
        main: {
            flex: 1, padding: '32px 40px', color: 'white', overflowY: 'auto',
            background: themeConfig[theme].mainBg,
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
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
            <div style={styles.main}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h1>🔔 Notifications</h1>
                    {notifications.some(n => !n.isRead) && (
                        <button className="ios-btn ios-btn-pill" onClick={handleMarkRead} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.9)', color: '#333' }}>
                            Mark all read
                        </button>
                    )}
                </header>

                {loading ? <p>Loading...</p> : (
                    <div style={styles.list}>
                        {notifications.length === 0 ? <p>No new updates here!</p> : (
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
                                            {note.type === 'FRIEND_REQUEST' ? 'New Friend Request' :
                                                note.type === 'NEW_MESSAGE' ? 'New Festive Message' : 'Friend Request Accepted'}
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
            </div>
        </div>
    );
};

export default NotificationsPage;
