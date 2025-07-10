export interface LearningProgress {
  _id: string;
  userId: string;
  wordlistId: string;
  words: WordProgress[];
  startedAt: Date;
  lastStudied: Date;
  totalStudyTime: number;
  completionRate: number;
  averageScore: number;
  isCompleted: boolean;
  isFirstTime: boolean;
  studyMode: 'normal' | 'review' | 'test';
  createdAt: Date;
  updatedAt: Date;
}

export interface WordProgress {
  wordId: string;
  status: 'new' | 'learning' | 'familiar' | 'mastered';
  familiarity: number;
  lastChoice?: 'know' | 'unknown' | 'vague';
  lastReviewed?: Date;
  nextReview: Date;
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  totalAttempts: number;
  interval: number;
  easeFactor: number;
  history: LearningHistory[];
}

export interface LearningHistory {
  date: Date;
  choice: 'know' | 'unknown' | 'vague';
  reviewTime: number;
}

export interface LearningSession {
  wordlistId: string;
  isFirstTime?: boolean;
  studyMode?: 'normal' | 'review' | 'test';
}

export interface LearningSubmission {
  choice: 'know' | 'unknown' | 'vague';
  reviewTime?: number;
  studyTime?: number;
}

export interface LearningStats {
  totalWords: number;
  newWords: number;
  learningWords: number;
  familiarWords: number;
  masteredWords: number;
  reviewWords: number;
  completionRate: number;
  averageScore: number;
  totalStudyTime: number;
  isCompleted: boolean;
  startedAt: Date;
  lastStudied: Date;
}

export interface LearningResponse {
  message: string;
  words: any[]; // Word类型
  hasMore: boolean;
  mode: string;
  progress: {
    completionRate: number;
    averageScore: number;
    totalWords: number;
  };
}

export interface StudyReport {
  overview: {
    totalWordlists: number;
    completedWordlists: number;
    totalWordsLearned: number;
    totalStudyTime: number;
    currentStreak: number;
    averageScore: number;
  };
  categoryBreakdown: Record<string, {
    wordlists: number;
    totalWords: number;
    masteredWords: number;
    averageScore: number;
  }>;
  difficultyBreakdown: Record<string, {
    wordlists: number;
    totalWords: number;
    masteredWords: number;
    averageScore: number;
  }>;
  recentActivity: {
    wordlist: string;
    category: string;
    lastStudied: Date;
    completionRate: number;
    averageScore: number;
  }[];
  achievements: {
    title: string;
    description: string;
    icon: string;
    achieved: boolean;
  }[];
}

export interface ReviewSummary {
  totalReviewWords: number;
  reviewByWordlist: {
    wordlist: {
      _id: string;
      name: string;
      category: string;
    };
    reviewCount: number;
    urgentCount: number;
  }[];
  message: string;
} 