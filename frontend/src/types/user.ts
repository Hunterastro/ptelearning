export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  profile: {
    nickname?: string;
    avatar?: string;
    bio?: string;
  };
  learningStats: {
    totalWordsLearned: number;
    totalStudyTime: number;
    consecutiveDays: number;
    lastStudyDate?: Date;
    currentStreak: number;
  };
  preferences: {
    dailyGoal: number;
    reviewInterval: number;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  isActive: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginData {
  login: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateProfileData {
  nickname?: string;
  bio?: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UserPreferences {
  dailyGoal: number;
  reviewInterval: number;
  difficulty: 'easy' | 'medium' | 'hard';
  studyReminder?: boolean;
  reviewReminder?: boolean;
  studyReportEmail?: boolean;
  reminderTime?: string;
  preferredCategories?: string[];
  autoPlay?: boolean;
  studyMode?: 'normal' | 'challenge' | 'relaxed';
} 