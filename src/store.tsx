
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
  updateSettings: (settings: AppSettings) => void;
  updateUser: (data: Partial<User>) => void;
  manageUserRole: (userId: string, role: UserRole) => void; 
  saveExamResult: (courseId: string, score: number, totalQuestions: number) => void;
  saveExamProgress: (progress: ExamProgress) => void;
  clearExamProgress: (courseId: string) => void;
  saveGeneratedNote: (note: GeneratedNote) => void;
  deleteGeneratedNote: (id: string) => void;
  toggleTheme: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const INITIAL_COURSES: Course[] = [
  {
    id: 'batch-project45',
    title: 'Project 45 10th',
    mrp: 4999,
    price: 0,
    description: 'The Ultimate Class 10 Batch by Project 45. Comprehensive coverage of Science, Mathematics, and Social Science with video lectures, notes, and DPPs.',
    image: 'https://images.unsplash.com/photo-1633516362506-6f7f6311802e?q=80&w=2070&auto=format&fit=crop', 
    category: 'Class 10',
    createdAt: new Date().toISOString(),
    isPaid: false,
    isNew: true,
    startDate: '01 Apr 2024',
    endDate: '31 Mar 2025',
    subjects: [
      {
        id: 'sub-sci',
        title: 'Science',
        iconText: 'Sc',
        chapters: [
          {
            id: 'ch-sci-01',
            title: 'Chemical Reactions and Equations',
            videos: [
              { id: 'v-sci-01', title: 'Lecture 1: Introduction & Balancing', filename: 'https://www.youtube.com/embed/k3rRrl9J2F4', duration: '45:00', date: 'TODAY', type: 'lecture' },
              { id: 'n-sci-01', title: 'Chapter Notes', filename: '#', duration: 'PDF', date: 'TODAY', type: 'note' }
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
      // Defensive: Ensure all required array/object fields exist (migration for legacy data)
      const secureUser = {
          ...user,
          purchasedCourseIds: user.purchasedCourseIds || [],
          tempAccess: user.tempAccess || {},
          generatedNotes: user.generatedNotes || [],
          examResults: user.examResults || [],
          savedExamProgress: user.savedExamProgress || [],
          lastLogin: new Date().toISOString()
      };
      setCurrentUser(secureUser);
      // Update global user list with migrated data
      setUsers(prev => prev.map(u => u.id === user.id ? secureUser : u));
      return true;
    }
    return false;
  };

  const signup = (name: string, email: string, phone: string, pass: string) => {
    const newUser: User = { 
        id: Date.now().toString(), 
        name, 
        email, 
        phone, 
        password: pass, 
        role: UserRole.USER, 
        purchasedCourseIds: [], 
        lastLogin: new Date().toISOString(), 
        tempAccess: {},
        generatedNotes: [],
        examResults: [],
        savedExamProgress: []
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
  };

  const createUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const logout = () => setCurrentUser(null);
  
  const addCourse = (c: Course) => setCourses(prev => [...prev, c]);
  
  const updateCourse = (uc: Course) => setCourses(prev => prev.map(c => c.id === uc.id ? uc : c));
  
  const deleteCourse = (id: string) => setCourses(prev => prev.filter(c => c.id !== id));

  const enrollCourse = (courseId: string) => {
    if (!currentUser) return;
    const currentPurchased = currentUser.purchasedCourseIds || [];
    const updated = { ...currentUser, purchasedCourseIds: [...new Set([...currentPurchased, courseId])] };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  const grantTempAccess = (courseId: string) => {
    if (!currentUser) return;
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const currentTemp = currentUser.tempAccess || {};
    const updated = { ...currentUser, tempAccess: { ...currentTemp, [courseId]: expiry } };
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
    const currentResults = currentUser.examResults || [];
    const res: ExamResult = { courseId: cId, score, totalQuestions: total, date: new Date().toISOString() };
    const updated = { ...currentUser, examResults: [...currentResults, res] };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  const saveExamProgress = (p: ExamProgress) => {
    if (!currentUser) return;
    const currentProgress = currentUser.savedExamProgress || [];
    const filtered = currentProgress.filter(item => item.courseId !== p.courseId);
    const updated = { ...currentUser, savedExamProgress: [...filtered, p] };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  const clearExamProgress = (cId: string) => {
    if (!currentUser) return;
    const currentProgress = currentUser.savedExamProgress || [];
    const updated = { ...currentUser, savedExamProgress: currentProgress.filter(p => p.courseId !== cId) };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  const saveGeneratedNote = (note: GeneratedNote) => {
    if (!currentUser) return;
    const currentNotes = currentUser.generatedNotes || [];
    const updated = { ...currentUser, generatedNotes: [...currentNotes, note] };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  const deleteGeneratedNote = (id: string) => {
    if (!currentUser) return;
    const currentNotes = currentUser.generatedNotes || [];
    const updated = { ...currentUser, generatedNotes: currentNotes.filter(n => n.id !== id) };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  return (
    <StoreContext.Provider value={{
      currentUser, users, courses, settings, login, signup, createUser, logout,
      addCourse, updateCourse, deleteCourse, enrollCourse, grantTempAccess,
      updateSettings, updateUser, manageUserRole, saveExamResult, saveExamProgress, clearExamProgress, 
      saveGeneratedNote, deleteGeneratedNote, toggleTheme
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
