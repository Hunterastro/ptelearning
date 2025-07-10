export interface Wordlist {
  _id: string;
  name: string;
  description?: string;
  category: 'PTE' | 'IELTS' | 'TOEFL' | 'Business' | 'Academic' | 'General' | 'Other';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  createdBy: {
    _id: string;
    username: string;
    profile?: {
      nickname?: string;
    };
  };
  fileName: string;
  filePath: string;
  fileSize: number;
  wordCount: number;
  isActive: boolean;
  isPublic: boolean;
  tags: string[];
  statistics: {
    totalUsers: number;
    completionRate: number;
    averageScore: number;
  };
  uploadDate: Date;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Word {
  _id: string;
  wordlistId: string;
  phrase: string;
  meaning: string;
  example: string;
  translation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  audioUrl?: string;
  pronunciation?: string;
  statistics: {
    totalViews: number;
    correctCount: number;
    incorrectCount: number;
    difficultyRating: number;
  };
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WordlistUploadData {
  name: string;
  description?: string;
  category: Wordlist['category'];
  difficulty: Wordlist['difficulty'];
  tempFile: string;
  hasHeader: boolean;
  isPublic?: boolean;
  tags?: string[];
}

export interface WordlistFilter {
  page?: number;
  limit?: number;
  category?: string;
  difficulty?: string;
  search?: string;
}

export interface WordlistPreview {
  rowNumber: number;
  phrase: string;
  meaning: string;
  example: string;
  translation: string;
}

export interface UploadPreviewResponse {
  message: string;
  preview: WordlistPreview[];
  hasHeader: boolean;
  totalRows: number;
  fileName: string;
  tempFile: string;
} 