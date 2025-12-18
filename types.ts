
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR'
}

export interface ExamResult {
  courseId: string;
  score: number;
  totalQuestions: number;
  date: string;
}

export interface ExamProgress {
  courseId: string;
  questions: Question[];
  answers: number[];
  timeLeft: number;
  lastSaved: string;
  isAiGenerated: boolean;
}

export interface VideoProgress {
  timestamp: number;
  duration: number;
  completed: boolean;
  lastWatched: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  purchasedCourseIds: string[];
  lastLogin?: string;
  examResults?: ExamResult[];
  tempAccess?: Record<string, string>; // courseId -> ISO Expiry Date
  savedExamProgress?: ExamProgress[];
  videoProgress?: Record<string, VideoProgress>;
}

export interface Video {
  id: string;
  title: string;
  filename: string;
  duration: string;
}

export interface Chapter {
  id: string;
  title: string;
  videos: Video[];
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Exam {
  id: string;
  title: string;
  questions: Question[];
}

export interface Course {
  id: string;
  title: string;
  mrp: number;
  price: number;
  description: string;
  image: string;
  category: string;
  chapters: Chapter[];
  createdAt: string;
  isPaid?: boolean;
  accessKey?: string;
  shortenerLink?: string;
  telegramLink?: string;
  exams?: Exam[];
}

export interface AppSettings {
  appName: string;
  adminEmail: string;
  supportPhone: string;
  uiColor?: string;
  theme: 'dark' | 'light';
  razorpayKey: string;
  linkShortenerApiUrl?: string;
  linkShortenerApiKey?: string;
}
