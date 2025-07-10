import axios, { AxiosInstance, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import { LoginData, RegisterData, User, UpdateProfileData, UpdatePasswordData, UserPreferences } from '../types/user';
import { Wordlist, WordlistFilter, WordlistUploadData, Word } from '../types/wordlist';
import { LearningSession, LearningSubmission, LearningStats, StudyReport, ReviewSummary } from '../types/learning';

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000, // 增加超时时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 标记正在刷新token的状态
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];

// 处理等待队列
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理token过期
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 检查是否为401错误且不是登录/注册请求
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('/auth/login') &&
        !originalRequest.url?.includes('/auth/register')) {
      
      // 如果正在刷新token，将请求加入队列
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = Cookies.get('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          { refreshToken },
          { timeout: 10000 }
        );

        const { token, refreshToken: newRefreshToken } = response.data;
        
        // 更新cookies
        Cookies.set('token', token, { expires: 7, secure: false, sameSite: 'strict' });
        Cookies.set('refreshToken', newRefreshToken, { expires: 30, secure: false, sameSite: 'strict' });
        
        // 处理等待队列
        processQueue(null, token);
        
        // 重试原始请求
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);

      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // 清除认证信息
        Cookies.remove('token');
        Cookies.remove('refreshToken');
        
        // 处理等待队列
        processQueue(refreshError, null);
        
        // 通知应用层处理登录过期（避免直接操作window.location）
        const event = new CustomEvent('auth:expired', { 
          detail: { message: '登录已过期，请重新登录' } 
        });
        window.dispatchEvent(event);
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// 认证相关API
export const authApi = {
  login: (data: LoginData): Promise<AxiosResponse<{ user: User; token: string; refreshToken: string; message: string }>> =>
    api.post('/auth/login', data),
  
  register: (data: RegisterData): Promise<AxiosResponse<{ user: User; token: string; refreshToken: string; message: string }>> =>
    api.post('/auth/register', data),
  
  refreshToken: (data: { refreshToken: string }): Promise<AxiosResponse<{ token: string; refreshToken: string; message: string }>> =>
    api.post('/auth/refresh', data),
  
  getProfile: (): Promise<AxiosResponse<{ user: User }>> =>
    api.get('/auth/me'),
  
  updateProfile: (data: UpdateProfileData): Promise<AxiosResponse<{ user: User; message: string }>> =>
    api.put('/auth/profile', data),
  
  updatePassword: (data: UpdatePasswordData): Promise<AxiosResponse<{ message: string }>> =>
    api.put('/auth/password', data),
  
  logout: (): Promise<AxiosResponse<{ message: string }>> =>
    api.post('/auth/logout'),
};

// 单词表相关API
export const wordlistApi = {
  getWordlists: (params?: WordlistFilter): Promise<AxiosResponse<{ wordlists: Wordlist[]; pagination: any }>> =>
    api.get('/wordlist', { params }),
  
  getWordlist: (id: string): Promise<AxiosResponse<Wordlist>> =>
    api.get(`/wordlist/${id}`),
  
  uploadWordlist: (file: File): Promise<AxiosResponse<any>> => {
    const formData = new FormData();
    formData.append('wordlist', file);
    return api.post('/wordlist/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  createWordlist: (data: WordlistUploadData): Promise<AxiosResponse<{ wordlist: Wordlist; wordsCount: number; message: string }>> =>
    api.post('/wordlist/create', data),
  
  getWords: (wordlistId: string, params?: { page?: number; limit?: number; search?: string }): Promise<AxiosResponse<{ words: Word[]; pagination: any; wordlist: any }>> =>
    api.get(`/wordlist/${wordlistId}/words`, { params }),
  
  deleteWordlist: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/wordlist/${id}`),
  
  updateWordlist: (id: string, data: Partial<WordlistUploadData>): Promise<AxiosResponse<{ wordlist: Wordlist; message: string }>> =>
    api.put(`/wordlist/${id}`, data),
  
  getWordlistStats: (id: string): Promise<AxiosResponse<any>> =>
    api.get(`/wordlist/${id}/stats`),
};

// 学习相关API
export const learningApi = {
  startLearning: (wordlistId: string, data: LearningSession): Promise<AxiosResponse<any>> =>
    api.post(`/learning/start/${wordlistId}`, data),
  
  getNextWords: (wordlistId: string, params?: { mode?: string; count?: number }): Promise<AxiosResponse<any>> =>
    api.get(`/learning/next/${wordlistId}`, { params }),
  
  submitAnswer: (wordlistId: string, wordId: string, data: LearningSubmission): Promise<AxiosResponse<any>> =>
    api.post(`/learning/submit/${wordlistId}/${wordId}`, data),
  
  getProgress: (wordlistId: string): Promise<AxiosResponse<{ progress: LearningStats; wordlist: any }>> =>
    api.get(`/learning/progress/${wordlistId}`),
  
  getAllProgress: (params?: { page?: number; limit?: number; status?: string }): Promise<AxiosResponse<any>> =>
    api.get('/learning/progress', { params }),
  
  getTodayReview: (): Promise<AxiosResponse<ReviewSummary>> =>
    api.get('/learning/review/today'),
  
  getStats: (): Promise<AxiosResponse<any>> =>
    api.get('/learning/stats'),
  
  getWordDetail: (wordId: string): Promise<AxiosResponse<{ word: Word; learningStatus: any }>> =>
    api.get(`/learning/word/${wordId}`),
  
  resetProgress: (wordlistId: string): Promise<AxiosResponse<{ message: string }>> =>
    api.post(`/learning/reset/${wordlistId}`),
};

// 用户相关API
export const userApi = {
  updatePreferences: (data: Partial<UserPreferences>): Promise<AxiosResponse<{ preferences: UserPreferences; message: string }>> =>
    api.put('/user/preferences', data),
  
  getPreferences: (): Promise<AxiosResponse<{ preferences: UserPreferences }>> =>
    api.get('/user/preferences'),
  
  getReport: (): Promise<AxiosResponse<StudyReport>> =>
    api.get('/user/report'),
  
  // 管理员API
  getUsers: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/user/admin/users', { params }),
  
  getUserDetail: (userId: string): Promise<AxiosResponse<any>> =>
    api.get(`/user/admin/${userId}`),
  
  updateUserStatus: (userId: string, data: { isActive: boolean; reason?: string }): Promise<AxiosResponse<any>> =>
    api.put(`/user/admin/${userId}/status`, data),
  
  updateUserRole: (userId: string, data: { role: string; reason?: string }): Promise<AxiosResponse<any>> =>
    api.put(`/user/admin/${userId}/role`, data),
  
  getSystemStats: (): Promise<AxiosResponse<any>> =>
    api.get('/user/admin/stats'),
};

export default api; 