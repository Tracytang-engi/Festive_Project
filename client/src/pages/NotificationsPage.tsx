import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
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
            flex: 1, padding: '40px', color: 'white', overflowY: 'auto',
            background: theme === 'christmas' ? '#2f3542' : '#2c3e50' // Neutral dark, let alerts pop
        },
        list: { display: 'flex', flexDirection: 'column', gap: '15px' },
        item: {
            padding: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '15px',
            cursor: 'pointer', transition: 'background 0.2s'
        },
        unread: { background: theme === 'christmas' ? '#ff4757' : '#e056fd', color: 'white' },
        read: { background: 'rgba(255,255,255,0.1)', color: '#ccc' },
        icon: { fontSize: '24px' }
    };

    return (
        <div style={styles.container}>
            <Sidebar />
            <div style={styles.main}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h1>🔔 Notifications</h1>
                    {notifications.some(n => !n.isRead) && (
                        <button onClick={handleMarkRead} style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', background: 'white', color: '#333', cursor: 'pointer' }}>
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
                                    style={{ ...styles.item, ...(note.isRead ? styles.read : styles.unread) }}
                                    onClick={() => handleAction(note)}
                                >
                                    <div style={styles.icon}>
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
