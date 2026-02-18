import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ChristmasMessageProvider } from './context/ChristmasMessageContext';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';
import OnboardingOverlay from './components/Onboarding/OnboardingOverlay';
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
import GlobalSnowOverlay from './components/Effects/GlobalSnowOverlay';
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
  if (token && user === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f2f2f7', fontFamily: '-apple-system, sans-serif' }}>
        加载中... <span className="bilingual-en">Loading...</span>
      </div>
    );
  }
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

/** 手机端：新手教程进行中保持侧栏展开，完成后才在进入新页面时折叠 */
const SidebarCollapseSync: React.FC = () => {
  const location = useLocation();
  const { isMobile, setSidebarCollapsed } = useSidebar();
  const onboarding = useOnboarding();
  const isOnboardingActive = onboarding?.isActive ?? false;

  useEffect(() => {
    if (!isMobile) return;
    if (isOnboardingActive) {
      setSidebarCollapsed(false);
    } else {
      setSidebarCollapsed(true);
    }
  }, [isMobile, isOnboardingActive, location.pathname, setSidebarCollapsed]);

  return null;
};

const BANNER_HEIGHT = 48;

/** Christmas 主题时在页面顶部显示「暂未开放，敬请期待」横幅，并为内容留出间距 */
const ChristmasBannerAndLayout: React.FC = () => {
  const { theme } = useTheme();
  const isChristmas = theme === 'christmas';
  return (
    <>
      <GlobalSnowOverlay />
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
            <SidebarProvider>
              <OnboardingProvider>
                <SidebarCollapseSync />
                <ChristmasBannerAndLayout />
                <OnboardingOverlay />
              </OnboardingProvider>
            </SidebarProvider>
          </ChristmasMessageProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
