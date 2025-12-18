
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
  tempAccess?: Record<string, string>;
  savedExamProgress?: ExamProgress[];
}

export interface Video {
  id: string;
  title: string;
  filename: string;
  duration: string;
  date?: string;
  type?: 'lecture' | 'dpp' | 'note';
}

export interface Chapter {
  id: string;
  title: string;
  videos: Video[];
}

export interface Subject {
  id: string;
  title: string;
  iconText: string;
  chapters: Chapter[];
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
  subjects: Subject[]; // Core refactor: Course -> Subjects -> Chapters
  createdAt: string;
  isPaid?: boolean;
  accessKey?: string;
  shortenerLink?: string;
  telegramLink?: string;
  exams?: Exam[];
  isNew?: boolean;
  startDate?: string;
  endDate?: string;
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
