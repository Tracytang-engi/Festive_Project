import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Home, MessageCircle, Clock, LogOut, UserPlus, Heart, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Sidebar: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const { logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div style={{
            width: '80px',
            height: '100vh',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px 0',
            boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
            zIndex: 100
        }}>
            {/* Theme Switchers */}
            <div className="theme-icons" style={{ marginBottom: '40px' }}>
                <div
                    onClick={() => { toggleTheme('christmas'); navigate('/'); }}
                    style={{
                        cursor: 'pointer',
                        opacity: theme === 'christmas' ? 1 : 0.5,
                        marginBottom: '20px',
                        transform: theme === 'christmas' ? 'scale(1.2)' : 'scale(1)',
                        transition: 'all 0.3s',
                        fontSize: '24px'
                    }}
                    title="Christmas Theme"
                >
                    🎄
                </div>
                <div
                    onClick={() => toggleTheme('spring')}
                    style={{
                        cursor: 'pointer',
                        opacity: theme === 'spring' ? 1 : 0.5,
                        transform: theme === 'spring' ? 'scale(1.2)' : 'scale(1)',
                        transition: 'all 0.3s',
                        fontSize: '24px'
                    }}
                    title="Spring Festival Theme"
                >
                    🧨
                </div>
            </div>

            {/* Nav Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', flex: 1 }}>
                <div title="Home" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <Home size={24} />
                </div>
                <div title="Notifications" onClick={() => navigate('/notifications')} style={{ cursor: 'pointer' }}>
                    <Bell size={24} />
                </div>
                <div title="Discover Friends" onClick={() => navigate('/discover')} style={{ cursor: 'pointer' }}>
                    <UserPlus size={24} />
                </div>
                <div title="My Friends" onClick={() => navigate('/friends')} style={{ cursor: 'pointer' }}>
                    <Heart size={24} />
                </div>
                <div title="Messages" onClick={() => navigate('/messages')} style={{ cursor: 'pointer' }}>
                    <MessageCircle size={24} />
                </div>
                <div title="History" onClick={() => navigate('/history')} style={{ cursor: 'pointer' }}>
                    <Clock size={24} />
                </div>
            </div>

            <div title="Logout" onClick={logout} style={{ cursor: 'pointer', marginTop: 'auto' }}>
                <LogOut size={24} />
            </div>
        </div>
    );
};

export default Sidebar;
