
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

export interface AiGeneratedQuiz {
  videoId: string;
  questions: Question[];
  generatedAt: string;
}

export interface SavedNote {
  id: string;
  videoId: string;
  videoTitle: string;
  courseTitle: string;
  content: string; // Markdown content
  imageUrl?: string; // Base64 string
  generatedAt: string;
  syllabusVersion: string; // e.g., "CBSE 2025-26"
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
  savedExamProgress?: ExamProgress[]; // Array of unfinished exams
  videoProgress?: Record<string, VideoProgress>; // videoId -> Progress Data
  generatedQuizzes?: AiGeneratedQuiz[]; // Cache for AI quizzes per video
  savedNotes?: SavedNote[]; // User's library of AI notes
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
  verificationLink?: string;
  exams?: Exam[];
  accessKey?: string; // Key to unlock the course
  shortenerLink?: string; // External link to generate temp access
  telegramChannelLink?: string; // Link to specific telegram channel for this batch
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
  videoApiKey?: string; // Key for Video Metadata API (e.g., YouTube)
}