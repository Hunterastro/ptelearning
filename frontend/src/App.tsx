import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WordlistBrowser from './pages/WordlistBrowser';
import LearningPage from './pages/LearningPage';
import ProgressPage from './pages/ProgressPage';
import AdminPanel from './pages/AdminPanel';
import UserProfile from './pages/UserProfile';
import Loading from './components/Loading';
import './App.css';

// 创建React Query客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5分钟
      cacheTime: 10 * 60 * 1000, // 10分钟
    },
  },
});

// 认证过期监听组件
const AuthExpiredListener: React.FC = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleAuthExpired = (event: CustomEvent) => {
      if (isAuthenticated) {
        message.warning(event.detail?.message || '登录已过期，请重新登录');
        logout();
        navigate('/login', { replace: true });
      }
    };

    window.addEventListener('auth:expired', handleAuthExpired as EventListener);
    
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired as EventListener);
    };
  }, [navigate, logout, isAuthenticated]);

  return null;
};

// 私有路由组件
const PrivateRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ 
  children, 
  adminOnly = false 
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) {
    return <Loading />;
  }
  
  if (!user || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// 公共路由组件（只有未登录用户可以访问）
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) {
    return <Loading />;
  }
  
  if (user && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// 主应用路由
const AppRoutes: React.FC = () => {
  return (
    <>
      <AuthExpiredListener />
      <Routes>
        {/* 公共路由 */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        
        {/* 私有路由 */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="wordlists" element={<WordlistBrowser />} />
          <Route path="learning/:wordlistId" element={<LearningPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="profile" element={<UserProfile />} />
          
          {/* 管理员路由 */}
          <Route path="admin/*" element={
            <PrivateRoute adminOnly>
              <AdminPanel />
            </PrivateRoute>
          } />
        </Route>
        
        {/* 404页面 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider 
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 8,
            fontSize: 14,
          },
        }}
      >
        <AuthProvider>
          <Router>
            <div className="App">
              <AppRoutes />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#fff',
                    color: '#333',
                    border: '1px solid #d9d9d9',
                    borderRadius: '8px',
                    fontSize: '14px',
                  },
                  success: {
                    iconTheme: {
                      primary: '#52c41a',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ff4d4f',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App; 