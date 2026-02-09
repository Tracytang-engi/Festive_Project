import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { MessageCircle, LogOut, UserPlus, Heart, Bell, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getNotifications } from '../../api/notifications';

const Sidebar: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const path = location.pathname;
    const [hasUnread, setHasUnread] = useState(false);

    const isActive = (route: string) => path === route;

    const loadNotifications = React.useCallback(async () => {
        try {
            const list = await getNotifications();
            setHasUnread(list.some(n => !n.isRead && n.type === 'NEW_MESSAGE'));
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [path, loadNotifications]);

    // 定期轮询以检测新消息，修复收到消息后小红点不显示的问题
    useEffect(() => {
        const interval = setInterval(loadNotifications, 15000);
        return () => clearInterval(interval);
    }, [loadNotifications]);

    // 监听通知已读事件，立即刷新小红点
    useEffect(() => {
        const handler = () => loadNotifications();
        window.addEventListener('notifications-updated', handler);
        return () => window.removeEventListener('notifications-updated', handler);
    }, [loadNotifications]);

    return (
        <div className="sidebar ios-glass" style={{
            width: '80px',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px 0',
            boxShadow: '1px 0 0 rgba(0,0,0,0.06)',
            zIndex: 100,
            borderRight: '1px solid rgba(0,0,0,0.2)'
        }}>
            {/* Theme Switchers - iOS 风格 */}
            <div className="theme-switcher">
                <div
                    className={`theme-switcher-item theme-tap ${theme === 'christmas' ? 'active' : ''}`}
                    onClick={() => { toggleTheme('christmas'); navigate('/'); }}
                    style={{
                        opacity: theme === 'christmas' ? 1 : 0.5,
                        transform: theme === 'christmas' ? 'scale(1.1)' : 'scale(1)'
                    }}
                    title="Christmas Theme"
                >
                    <span className="theme-emoji">🎄</span>
                    <span className="theme-label">Christmas</span>
                </div>
                <div
                    className={`theme-switcher-item theme-tap ${theme === 'spring' ? 'active' : ''}`}
                    onClick={() => { toggleTheme('spring'); navigate('/'); }}
                    style={{
                        opacity: theme === 'spring' ? 1 : 0.5,
                        transform: theme === 'spring' ? 'scale(1.1)' : 'scale(1)'
                    }}
                    title="Spring Festival Theme"
                >
                    <span className="theme-emoji">🧧</span>
                    <span className="theme-label">Spring</span>
                </div>
            </div>

            {/* Nav Items - 与主题切换一致：未选中微微虚化(0.5)，选中清晰+放大(1.2)，点击时变清晰并放大 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', flex: 1 }}>
                <div className="sidebar-nav-icon theme-tap icon-responsive" title="Notifications" onClick={() => navigate('/notifications')} style={{ opacity: isActive('/notifications') ? 1 : 0.5, transform: isActive('/notifications') ? 'scale(1.2)' : 'scale(1)', position: 'relative' }}>
                    <Bell size={24} />
                    {hasUnread && <span className="notification-badge" />}
                </div>
                <div className="sidebar-nav-icon theme-tap icon-responsive" title="Discover Friends" onClick={() => navigate('/discover')} style={{ opacity: isActive('/discover') ? 1 : 0.5, transform: isActive('/discover') ? 'scale(1.2)' : 'scale(1)' }}>
                    <UserPlus size={24} />
                </div>
                <div className="sidebar-nav-icon theme-tap icon-responsive" title="My Friends" onClick={() => navigate('/friends')} style={{ opacity: isActive('/friends') ? 1 : 0.5, transform: isActive('/friends') ? 'scale(1.2)' : 'scale(1)' }}>
                    <Heart size={24} />
                </div>
                <div className="sidebar-nav-icon theme-tap icon-responsive" title="Messages" onClick={() => navigate('/messages')} style={{ opacity: isActive('/messages') ? 1 : 0.5, transform: isActive('/messages') ? 'scale(1.2)' : 'scale(1)' }}>
                    <MessageCircle size={24} />
                </div>
                <div className="sidebar-nav-icon theme-tap icon-responsive" title="Settings" onClick={() => navigate('/settings')} style={{ opacity: isActive('/settings') ? 1 : 0.5, transform: isActive('/settings') ? 'scale(1.2)' : 'scale(1)' }}>
                    <Settings size={24} />
                </div>
            </div>

            <div className="sidebar-nav-icon theme-tap icon-responsive" title="Logout" onClick={logout} style={{ opacity: 0.5, transform: 'scale(1)', marginTop: 'auto', marginBottom: '50px' }}>
                <LogOut size={24} />
            </div>
        </div>
    );
};

export default Sidebar;
