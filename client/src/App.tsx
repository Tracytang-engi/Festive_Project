import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ChristmasMessageProvider } from './context/ChristmasMessageContext';
import HomePage from './pages/HomePage';
import AuthForm from './components/Auth/AuthForm';
import SceneSelector from './pages/SceneSelectionPage';
import DiscoverPage from './pages/DiscoverPage';
import MessagesPage from './pages/MessagesPage';
import FriendsPage from './pages/FriendsPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import FestiveDecorPage from './pages/FestiveDecorPage';
import FriendDecorPage from './pages/FriendDecorPage';
import ModeratorPage from './pages/ModeratorPage';
import './index.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('token');
  return (isAuthenticated || token) ? <>{children}</> : <Navigate to="/auth" />;
};

const ModeratorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const token = localStorage.getItem('token');
  if (!(isAuthenticated || token)) return <Navigate to="/auth" />;
  if (user && user.role !== 'moderator') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<AuthForm />} />
      <Route path="/select-scene" element={<ProtectedRoute><SceneSelector /></ProtectedRoute>} />
      <Route path="/festive-decor" element={<ProtectedRoute><FestiveDecorPage /></ProtectedRoute>} />
      <Route path="/friend/:userId/decor" element={<ProtectedRoute><FriendDecorPage /></ProtectedRoute>} />
      <Route path="/discover" element={<ProtectedRoute><DiscoverPage /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
      <Route path="/history" element={<Navigate to="/" replace />} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/moderator" element={<ModeratorRoute><ModeratorPage /></ModeratorRoute>} />
    </Routes>
  );
};

const BANNER_HEIGHT = 48;

/** Christmas 主题时在页面顶部显示「暂未开放，敬请期待」横幅，并为内容留出间距 */
const ChristmasBannerAndLayout: React.FC = () => {
  const { theme } = useTheme();
  const isChristmas = theme === 'christmas';
  return (
    <>
      {isChristmas && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            height: BANNER_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)',
            color: 'white',
            fontSize: '15px',
            fontWeight: 500,
          }}
        >
          暂未开放，敬请期待
        </div>
      )}
      <div style={{ paddingTop: isChristmas ? BANNER_HEIGHT : 0 }}>
        <AppRoutes />
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <ChristmasMessageProvider>
            <ChristmasBannerAndLayout />
          </ChristmasMessageProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
