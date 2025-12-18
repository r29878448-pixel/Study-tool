
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Course, AppSettings, UserRole, ExamResult, ExamProgress } from './types';

interface StoreContextType {
  currentUser: User | null;
  users: User[];
  courses: Course[];
  settings: AppSettings;
  login: (email: string, pass: string) => boolean;
  signup: (name: string, email: string, phone: string, pass: string) => void;
  logout: () => void;
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;
  enrollCourse: (courseId: string) => void;
  grantTempAccess: (courseId: string) => void;
  updateSettings: (settings: AppSettings) => void;
  updateUser: (data: Partial<User>) => void;
  saveExamResult: (courseId: string, score: number, totalQuestions: number) => void;
  saveExamProgress: (progress: ExamProgress) => void;
  clearExamProgress: (courseId: string) => void;
  toggleTheme: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const INITIAL_COURSES: Course[] = [
  {
    id: 'batch-001',
    title: 'Complete Full-Stack Roadmap 2025',
    mrp: 3999,
    price: 0,
    description: 'Learn everything from HTML/CSS to Advanced React and System Design. Includes 5 Major Projects.',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800',
    category: 'Development',
    createdAt: new Date().toISOString(),
    isPaid: false,
    chapters: [
      {
        id: 'c1',
        title: 'Introduction to Web',
        videos: [
          { id: 'v1', title: 'How the internet works', filename: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '15:00' }
        ]
      }
    ]
  },
  {
    id: 'batch-002',
    title: 'Python for Data Science',
    mrp: 4999,
    price: 1499,
    description: 'Master Python, Pandas, Numpy and Scikit-learn to build predictive models.',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800',
    category: 'Data Science',
    createdAt: new Date().toISOString(),
    isPaid: true,
    accessKey: 'PY_2025',
    chapters: []
  }
];

const INITIAL_SETTINGS: AppSettings = {
  appName: 'Study Tool',
  adminEmail: 'admin@studytool.com',
  supportPhone: '+91 00000 00000',
  razorpayKey: 'rzp_test_study',
  theme: 'light',
  uiColor: '#0056d2'
};

export const StoreProvider = ({ children }: { children?: React.ReactNode }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('st_users');
    return saved ? JSON.parse(saved) : [{ id: 'admin', name: 'Master Admin', email: 'admin@gmail.com', phone: '0000000000', password: 'admin', role: UserRole.ADMIN, purchasedCourseIds: [], tempAccess: {} }];
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

  const login = (email: string, pass: string) => {
    const user = users.find(u => (u.email.toLowerCase() === email.toLowerCase() || u.phone === email) && u.password === pass);
    if (user) {
      setCurrentUser({ ...user, lastLogin: new Date().toISOString() });
      return true;
    }
    return false;
  };

  const signup = (name: string, email: string, phone: string, pass: string) => {
    const newUser: User = { id: Date.now().toString(), name, email, phone, password: pass, role: UserRole.USER, purchasedCourseIds: [], lastLogin: new Date().toISOString(), tempAccess: {} };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
  };

  const logout = () => setCurrentUser(null);
  const addCourse = (c: Course) => setCourses([...courses, c]);
  const updateCourse = (uc: Course) => setCourses(courses.map(c => c.id === uc.id ? uc : c));
  const deleteCourse = (id: string) => setCourses(courses.filter(c => c.id !== id));

  const enrollCourse = (courseId: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, purchasedCourseIds: [...new Set([...currentUser.purchasedCourseIds, courseId])] };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === currentUser.id ? updated : u));
  };

  const grantTempAccess = (courseId: string) => {
    if (!currentUser) return;
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const updated = { ...currentUser, tempAccess: { ...(currentUser.tempAccess || {}), [courseId]: expiry } };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === currentUser.id ? updated : u));
  };

  const updateSettings = (s: AppSettings) => setSettings(s);
  const toggleTheme = () => setSettings({ ...settings, theme: settings.theme === 'dark' ? 'light' : 'dark' });

  const updateUser = (data: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === currentUser.id ? updated : u));
  };

  const saveExamResult = (cId: string, score: number, total: number) => {
    if (!currentUser) return;
    const res: ExamResult = { courseId: cId, score, totalQuestions: total, date: new Date().toISOString() };
    const updated = { ...currentUser, examResults: [...(currentUser.examResults || []), res] };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === currentUser.id ? updated : u));
  };

  const saveExamProgress = (p: ExamProgress) => {
    if (!currentUser) return;
    const filtered = (currentUser.savedExamProgress || []).filter(item => item.courseId !== p.courseId);
    const updated = { ...currentUser, savedExamProgress: [...filtered, p] };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === currentUser.id ? updated : u));
  };

  const clearExamProgress = (cId: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, savedExamProgress: (currentUser.savedExamProgress || []).filter(p => p.courseId !== cId) };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === currentUser.id ? updated : u));
  };

  return (
    <StoreContext.Provider value={{
      currentUser, users, courses, settings, login, signup, logout,
      addCourse, updateCourse, deleteCourse, enrollCourse, grantTempAccess,
      updateSettings, updateUser, saveExamResult, saveExamProgress, clearExamProgress, toggleTheme
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
