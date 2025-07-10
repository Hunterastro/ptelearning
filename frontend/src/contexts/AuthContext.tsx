import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import { authApi } from '../services/api';
import Cookies from 'js-cookie';
import { message } from 'antd';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
  connectionError: boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  // 清除认证状态
  const clearAuth = () => {
    setUser(null);
    setIsAuthenticated(false);
    Cookies.remove('token');
    Cookies.remove('refreshToken');
  };

  // 检查是否为网络连接错误
  const isNetworkError = (error: any) => {
    return (
      error.code === 'ERR_NETWORK' ||
      error.code === 'NETWORK_ERROR' ||
      error.message?.includes('Network Error') ||
      error.message?.includes('CORS') ||
      !navigator.onLine
    );
  };

  // 监听认证过期事件
  useEffect(() => {
    const handleAuthExpired = (event: CustomEvent) => {
      console.log('认证已过期:', event.detail);
      clearAuth();
      message.warning(event.detail.message || '登录已过期，请重新登录');
    };

    // 监听网络状态变化
    const handleOnline = () => {
      setConnectionError(false);
      console.log('网络连接已恢复');
    };

    const handleOffline = () => {
      setConnectionError(true);
      console.log('网络连接已断开');
      message.warning('网络连接已断开，请检查网络连接');
    };

    window.addEventListener('auth:expired' as any, handleAuthExpired);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 检查初始网络状态
    setConnectionError(!navigator.onLine);

    return () => {
      window.removeEventListener('auth:expired' as any, handleAuthExpired);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get('token');
      if (token) {
        try {
          const response = await authApi.getProfile();
          const userData = response.data.user;
          setUser(userData);
          setIsAuthenticated(true);
          setConnectionError(false);
        } catch (error: any) {
          console.error('初始化认证失败:', error);
          
          // 如果是网络错误，不清除认证状态，只设置连接错误标志
          if (isNetworkError(error)) {
            setConnectionError(true);
            message.warning('网络连接失败，请检查网络连接');
          } else {
            // 只有在非网络错误时才清除认证状态
            clearAuth();
            if (error.response?.status !== 401) {
              message.error('认证状态验证失败，请重新登录');
            }
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (loginInput: string, password: string) => {
    try {
      setIsLoading(true);
      setConnectionError(false);
      
      const response = await authApi.login({ login: loginInput, password });
      const { user: userData, token, refreshToken } = response.data;
      
      // 保存token到cookie
      Cookies.set('token', token, { expires: 7, secure: false, sameSite: 'strict' });
      Cookies.set('refreshToken', refreshToken, { expires: 30, secure: false, sameSite: 'strict' });
      
      setUser(userData);
      setIsAuthenticated(true);
      message.success('登录成功');
    } catch (error: any) {
      console.error('登录失败:', error);
      
      // 检查是否为网络错误
      if (isNetworkError(error)) {
        setConnectionError(true);
        throw new Error('网络连接失败，请检查网络连接和CORS配置');
      } else {
        clearAuth();
        throw new Error(error.response?.data?.message || '登录失败');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      setConnectionError(false);
      
      const response = await authApi.register(userData);
      const { user: newUser, token, refreshToken } = response.data;
      
      // 保存token到cookie
      Cookies.set('token', token, { expires: 7, secure: false, sameSite: 'strict' });
      Cookies.set('refreshToken', refreshToken, { expires: 30, secure: false, sameSite: 'strict' });
      
      setUser(newUser);
      setIsAuthenticated(true);
      message.success('注册成功');
    } catch (error: any) {
      console.error('注册失败:', error);
      
      // 检查是否为网络错误
      if (isNetworkError(error)) {
        setConnectionError(true);
        throw new Error('网络连接失败，请检查网络连接');
      } else {
        clearAuth();
        throw new Error(error.response?.data?.message || '注册失败');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // 调用后端登出API
      await authApi.logout();
    } catch (error: any) {
      console.error('登出API调用失败:', error);
      // 如果是网络错误，仍然允许本地登出
      if (!isNetworkError(error)) {
        console.warn('登出时发生非网络错误:', error);
      }
    } finally {
      // 无论API是否成功，都清除本地状态
      clearAuth();
      setConnectionError(false);
      message.success('已退出登录');
    }
  };

  const refreshToken = async () => {
    try {
      const currentRefreshToken = Cookies.get('refreshToken');
      if (!currentRefreshToken) {
        throw new Error('No refresh token');
      }

      const response = await authApi.refreshToken({ refreshToken: currentRefreshToken });
      const { token, refreshToken: newRefreshToken } = response.data;
      
      Cookies.set('token', token, { expires: 7, secure: false, sameSite: 'strict' });
      Cookies.set('refreshToken', newRefreshToken, { expires: 30, secure: false, sameSite: 'strict' });
      
      setConnectionError(false);
    } catch (error: any) {
      console.error('刷新token失败:', error);
      
      // 如果是网络错误，不清除认证状态
      if (isNetworkError(error)) {
        setConnectionError(true);
        message.warning('网络连接失败，请检查网络连接');
      } else {
        // 刷新失败，清除认证状态
        clearAuth();
        message.warning('登录已过期，请重新登录');
      }
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    refreshToken,
    isAuthenticated,
    connectionError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 