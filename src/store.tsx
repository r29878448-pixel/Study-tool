
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
  manageUserRole: (userId: string, role: UserRole) => void; // New function
  saveExamResult: (courseId: string, score: number, totalQuestions: number) => void;
  saveExamProgress: (progress: ExamProgress) => void;
  clearExamProgress: (courseId: string) => void;
  toggleTheme: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const INITIAL_COURSES: Course[] = [
  {
    id: 'batch-hope',
    title: 'Hope (Backlog Series)',
    mrp: 0,
    price: 0,
    description: 'Complete backlog cover for Class 10 students.',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800',
    category: 'Class 10',
    createdAt: new Date().toISOString(),
    isPaid: false,
    isNew: true,
    startDate: '07 Jul 2024',
    endDate: '31 Mar 2026',
    subjects: [
      {
        id: 'sub-chem',
        title: 'Chemistry',
        iconText: 'Ch',
        chapters: [
          {
            id: 'ch-01',
            title: 'Chemical Reaction and Equation',
            videos: [
              { id: 'v1', title: 'Lecture 01: Chemical Reaction', filename: 'https://www.youtube.com/watch?v=k3rRrl9J2F4', duration: '50:00', date: '7 JUL', type: 'lecture' },
            ]
          }
        ]
      }
    ]
  }
];

const INITIAL_SETTINGS: AppSettings = {
  appName: 'Study Portal',
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
    const parsed: Course[] = saved ? JSON.parse(saved) : INITIAL_COURSES;
    // Data Integrity Check: Ensure nested arrays exist
    return parsed.map(c => ({
        ...c,
        subjects: (c.subjects || []).map(s => ({
            ...s,
            chapters: (s.chapters || []).map(chap => ({
                ...chap,
                videos: chap.videos || []
            }))
        }))
    }));
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

  const manageUserRole = (userId: string, role: UserRole) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
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
      updateSettings, updateUser, manageUserRole, saveExamResult, saveExamProgress, clearExamProgress, toggleTheme
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
