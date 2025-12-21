
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Course, AppSettings, UserRole, ExamResult, ExamProgress, GeneratedNote } from './types';

interface StoreContextType {
  currentUser: User | null;
  users: User[];
  courses: Course[];
  settings: AppSettings;
  login: (email: string, pass: string) => boolean;
  signup: (name: string, email: string, phone: string, pass: string) => void;
  createUser: (user: User) => void;
  logout: () => void;
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;
  enrollCourse: (courseId: string) => void;
  grantTempAccess: (courseId: string) => void;
  adminEnrollUser: (userId: string, courseId: string) => void;
  adminRevokeUser: (userId: string, courseId: string) => void;
  updateSettings: (settings: AppSettings) => void;
  updateUser: (data: Partial<User>) => void;
  manageUserRole: (userId: string, role: UserRole) => void; 
  saveExamResult: (courseId: string, score: number, totalQuestions: number) => void;
  saveExamProgress: (progress: ExamProgress) => void;
  clearExamProgress: (courseId: string) => void;
  saveGeneratedNote: (note: GeneratedNote) => void;
  deleteGeneratedNote: (id: string) => void;
  toggleTheme: () => void;
  clearAllData: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const CURRENT_STORAGE_VERSION = '6.0'; 

const INITIAL_COURSES: Course[] = []; // No demo data as requested

const INITIAL_SETTINGS: AppSettings = {
  appName: 'Study Portal',
  adminEmail: 'admin@studytool.com',
  supportPhone: '+91 00000 00000',
  razorpayKey: 'rzp_test_study',
  theme: 'light',
  uiColor: '#0056d2',
  botUrl: '',
  linkShortenerApiUrl: '',
  linkShortenerApiKey: ''
};

const DEFAULT_ADMIN: User = { 
  id: 'admin', 
  name: 'Master Admin', 
  email: 'admin@gmail.com', 
  phone: '0000000000', 
  password: 'admin', 
  role: UserRole.ADMIN, 
  purchasedCourseIds: [], 
  tempAccess: {},
  generatedNotes: [],
  examResults: [],
  savedExamProgress: []
};

export const StoreProvider = ({ children }: { children?: React.ReactNode }) => {
  useEffect(() => {
    const savedVersion = localStorage.getItem('st_version');
    if (savedVersion !== CURRENT_STORAGE_VERSION) {
      localStorage.clear();
      localStorage.setItem('st_version', CURRENT_STORAGE_VERSION);
      window.location.reload(); 
    }
  }, []);

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('st_users');
    return saved ? JSON.parse(saved) : [DEFAULT_ADMIN];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('st_currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('st_courses');
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('st_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  useEffect(() => { localStorage.setItem('st_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('st_currentUser', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('st_courses', JSON.stringify(courses)); }, [courses]);
  useEffect(() => { localStorage.setItem('st_settings', JSON.stringify(settings)); }, [settings]);

  const clearAllData = () => {
    if (confirm("Reset will delete all your data permanently. Proceed?")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  const login = (email: string, pass: string) => {
    const user = users.find(u => (u.email.toLowerCase() === email.toLowerCase() || u.phone === email) && u.password === pass);
    if (user) {
      const secureUser = { ...user, lastLogin: new Date().toISOString() };
      setCurrentUser(secureUser);
      return true;
    }
    return false;
  };

  const signup = (name: string, email: string, phone: string, pass: string) => {
    const newUser: User = { 
        id: Date.now().toString(), name, email, phone, password: pass, 
        role: UserRole.USER, purchasedCourseIds: [], lastLogin: new Date().toISOString(), 
        tempAccess: {}, generatedNotes: [], examResults: [], savedExamProgress: []
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
  };

  const createUser = (user: User) => setUsers(prev => [...prev, user]);
  const logout = () => setCurrentUser(null);
  const addCourse = (c: Course) => setCourses(prev => [...prev, c]);
  const updateCourse = (uc: Course) => setCourses(prev => prev.map(c => c.id === uc.id ? uc : c));
  const deleteCourse = (id: string) => setCourses(prev => prev.filter(c => c.id !== id));

  const enrollCourse = (courseId: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, purchasedCourseIds: [...new Set([...(currentUser.purchasedCourseIds || []), courseId])] };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  const adminEnrollUser = (userId: string, courseId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, purchasedCourseIds: [...new Set([...(u.purchasedCourseIds || []), courseId])] } : u));
  };

  const adminRevokeUser = (userId: string, courseId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, purchasedCourseIds: (u.purchasedCourseIds || []).filter(id => id !== courseId) } : u));
  };

  const grantTempAccess = (courseId: string) => {
    if (!currentUser) return;
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const updated = { ...currentUser, tempAccess: { ...(currentUser.tempAccess || {}), [courseId]: expiry } };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  const updateSettings = (s: AppSettings) => setSettings(s);
  const toggleTheme = () => setSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));

  const updateUser = (data: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  const manageUserRole = (userId: string, role: UserRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  };

  const saveExamResult = (cId: string, score: number, total: number) => {
    if (!currentUser) return;
    const res: ExamResult = { courseId: cId, score, totalQuestions: total, date: new Date().toISOString() };
    const updated = { ...currentUser, examResults: [...(currentUser.examResults || []), res] };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  const saveExamProgress = (p: ExamProgress) => {
    if (!currentUser) return;
    const filtered = (currentUser.savedExamProgress || []).filter(item => item.courseId !== p.courseId);
    const updated = { ...currentUser, savedExamProgress: [...filtered, p] };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  const clearExamProgress = (cId: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, savedExamProgress: (currentUser.savedExamProgress || []).filter(p => p.courseId !== cId) };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  const saveGeneratedNote = (note: GeneratedNote) => {
    if (!currentUser) return;
    const updated = { ...currentUser, generatedNotes: [...(currentUser.generatedNotes || []), note] };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  const deleteGeneratedNote = (id: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, generatedNotes: (currentUser.generatedNotes || []).filter(n => n.id !== id) };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  return (
    <StoreContext.Provider value={{
      currentUser, users, courses, settings, login, signup, createUser, logout,
      addCourse, updateCourse, deleteCourse, enrollCourse, grantTempAccess, adminEnrollUser, adminRevokeUser,
      updateSettings, updateUser, manageUserRole, saveExamResult, saveExamProgress, clearExamProgress, 
      saveGeneratedNote, deleteGeneratedNote, toggleTheme, clearAllData
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore error');
  return context;
};
