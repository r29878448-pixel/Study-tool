
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
}

export interface Banner {
  id: string;
  image: string;
  link: string;
}

export interface Video {
  id: string;
  title: string;
  filename: string; // URL in this context
  duration: string;
}

export interface Note {
  id: string;
  title: string;
  url: string;
}

export interface Chapter {
  id: string;
  title: string;
  videos: Video[];
  notes: Note[];
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
  verificationLink?: string;
}

export interface Order {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED';
  razorpayOrderId: string;
  date: string;
}

export interface AppSettings {
  appName: string;
  adminEmail: string;
  supportPhone: string;
  uiColor?: string; // Hex code for brand color
  razorpayKey: string;
  razorpaySecret?: string;
  linkShortenerApiUrl?: string;
  linkShortenerApiKey?: string;
  telegramBotToken?: string;
  adsCode?: string; // HTML/JS code for ads
}