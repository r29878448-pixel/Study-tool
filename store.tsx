
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Course, Banner, Order, AppSettings, UserRole, ExamResult, ExamProgress } from './types';

interface StoreContextType {
  currentUser: User | null;
  users: User[];
  courses: Course[];
  banners: Banner[];
  orders: Order[];
  settings: AppSettings;
  login: (email: string, pass: string) => boolean;
  signup: (name: string, email: string, phone: string, pass: string) => void;
  logout: () => void;
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;
  enrollCourse: (courseId: string) => void;
  grantTempAccess: (courseId: string) => void;
  addBanner: (banner: Banner) => void;
  deleteBanner: (id: string) => void;
  updateSettings: (settings: AppSettings) => void;
  updateUser: (data: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  saveExamResult: (courseId: string, score: number, totalQuestions: number) => void;
  saveExamProgress: (progress: ExamProgress) => void;
  clearExamProgress: (courseId: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const INITIAL_COURSES: Course[] = [
  {
    id: '1',
    title: 'Science Masterclass',
    mrp: 1999,
    price: 0,
    description: 'Complete coverage of Physics, Chemistry, and Biology. Includes interactive video lectures and detailed notes.',
    image: 'https://img.freepik.com/free-vector/science-lab-objects-composition_1284-18158.jpg',
    category: 'Science',
    createdAt: new Date().toISOString(),
    isPaid: false,
    chapters: [
      {
        id: 'c1',
        title: 'Chemical Reactions',
        videos: [
          { id: 'v1', title: 'Introduction', filename: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '15:00' },
          { id: 'v2', title: 'Balancing Equations', filename: 'https://www.w3schools.com/html/movie.mp4', duration: '20:00' }
        ],
        notes: [
          { id: 'n1', title: 'Chapter Summary', url: '#' }
        ]
      }
    ]
  },
  {
    id: '2',
    title: 'Advanced Mathematics',
    mrp: 2499,
    price: 499,
    description: 'Master Trigonometry, Algebra, and Geometry with solved examples and previous year questions.',
    image: 'https://img.freepik.com/free-vector/maths-chalkboard_23-2148178220.jpg',
    category: 'Maths',
    createdAt: new Date().toISOString(),
    isPaid: true,
    verificationLink: 'https://google.com',
    chapters: []
  }
];

const INITIAL_BANNERS: Banner[] = [
  { id: '1', image: 'https://img.freepik.com/free-vector/online-tutorials-concept_52683-37480.jpg', link: '#' },
  { id: '2', image: 'https://img.freepik.com/free-vector/mathematics-education-background_23-2148057283.jpg', link: '#' }
];

const INITIAL_USERS: User[] = [
  {
    id: 'admin',
    name: 'Admin User',
    email: 'admin@gmail.com',
    phone: '0000000000',
    password: 'admin',
    role: UserRole.ADMIN,
    purchasedCourseIds: [],
    examResults: [],
    tempAccess: {}
  }
];

const INITIAL_SETTINGS: AppSettings = {
  appName: 'Study Portal',
  adminEmail: 'admin@gmail.com',
  supportPhone: '+91-9876543210',
  razorpayKey: 'rzp_test_123456',
  razorpaySecret: '',
  uiColor: '#0284C7',
  linkShortenerApiUrl: '',
  linkShortenerApiKey: '',
  telegramBotToken: '',
  adsCode: ''
};

export const StoreProvider = ({ children }: { children?: React.ReactNode }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sp_users');
    let loadedUsers: User[] = saved ? JSON.parse(saved) : INITIAL_USERS;
    
    // Robustness: Ensure Admin Exists
    const adminExists = loadedUsers.some(u => u.role === UserRole.ADMIN);
    if (!adminExists) {
      console.warn("No admin found in storage. Restoring default admin.");
      // If we have users but no admin, append default admin.
      // If loadedUsers is just empty, use INITIAL_USERS
      if (loadedUsers.length === 0) {
        loadedUsers = INITIAL_USERS;
      } else {
        loadedUsers = [...loadedUsers, INITIAL_USERS[0]];
      }
    }
    return loadedUsers;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sp_currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('sp_courses');
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  const [banners, setBanners] = useState<Banner[]>(() => {
    const saved = localStorage.getItem('sp_banners');
    return saved ? JSON.parse(saved) : INITIAL_BANNERS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('sp_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('sp_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  useEffect(() => { localStorage.setItem('sp_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('sp_currentUser', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('sp_courses', JSON.stringify(courses)); }, [courses]);
  useEffect(() => { localStorage.setItem('sp_banners', JSON.stringify(banners)); }, [banners]);
  useEffect(() => { localStorage.setItem('sp_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('sp_settings', JSON.stringify(settings)); }, [settings]);

  // Sync settings email with admin user if needed
  useEffect(() => {
    const adminUser = users.find(u => u.role === UserRole.ADMIN);
    if (adminUser && adminUser.email !== settings.adminEmail) {
       // Logic to keep them in sync could go here, but strictly we usually update user first.
    }
  }, [settings.adminEmail, users]);

  const login = (email: string, pass: string) => {
    // Check for email OR phone match
    const user = users.find(u => 
      (u.email.toLowerCase() === email.toLowerCase() || u.phone === email || u.name === email) && 
      u.password === pass
    );
    
    if (user) {
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      setUsers(prevUsers => prevUsers.map(u => u.id === user.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      return true;
    }
    return false;
  };

  const signup = (name: string, email: string, phone: string, pass: string) => {
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      alert('Email already exists!');
      return;
    }
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      password: pass,
      role: UserRole.USER,
      purchasedCourseIds: [],
      lastLogin: new Date().toISOString(),
      examResults: [],
      tempAccess: {}
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sp_currentUser');
  };

  const addCourse = (course: Course) => setCourses([...courses, course]);
  
  const updateCourse = (updatedCourse: Course) => {
    setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
  };

  const deleteCourse = (id: string) => setCourses(courses.filter(c => c.id !== id));

  const enrollCourse = (courseId: string) => {
    if (!currentUser) return;
    if (currentUser.purchasedCourseIds.includes(courseId)) return;

    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const newOrder: Order = {
      id: Date.now().toString(),
      userId: currentUser.id,
      courseId,
      amount: course.price || 0,
      status: 'SUCCESS',
      razorpayOrderId: `ord_${Date.now()}`,
      date: new Date().toISOString()
    };

    setOrders(prev => [...prev, newOrder]);
    
    const updatedUser = {
      ...currentUser,
      purchasedCourseIds: [...currentUser.purchasedCourseIds, courseId]
    };
    
    setCurrentUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const grantTempAccess = (courseId: string) => {
    if (!currentUser) return;
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const updatedUser: User = {
      ...currentUser,
      tempAccess: {
        ...(currentUser.tempAccess || {}),
        [courseId]: expiry
      }
    };
    setCurrentUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const updateUser = (data: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...data };
    
    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    
    setUsers(updatedUsers);
    setCurrentUser(updatedUser);
  };

  const deleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const addBanner = (banner: Banner) => setBanners([...banners, banner]);
  const deleteBanner = (id: string) => setBanners(banners.filter(b => b.id !== id));
  
  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    // Also update Admin user email if it was changed in settings
    const adminUser = users.find(u => u.role === UserRole.ADMIN);
    if (adminUser && adminUser.email !== newSettings.adminEmail) {
      setUsers(users.map(u => u.role === UserRole.ADMIN ? { ...u, email: newSettings.adminEmail } : u));
      if (currentUser?.role === UserRole.ADMIN) {
        setCurrentUser({ ...currentUser, email: newSettings.adminEmail });
      }
    }
  };

  const saveExamResult = (courseId: string, score: number, totalQuestions: number) => {
    if (!currentUser) return;
    const newResult: ExamResult = {
      courseId,
      score,
      totalQuestions,
      date: new Date().toISOString()
    };
    
    const updatedUser: User = {
      ...currentUser,
      examResults: [...(currentUser.examResults || []), newResult]
    };

    setCurrentUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const saveExamProgress = (progress: ExamProgress) => {
    if (!currentUser) return;
    
    const currentProgress = currentUser.savedExamProgress || [];
    const otherProgress = currentProgress.filter(p => p.courseId !== progress.courseId);
    
    const updatedUser: User = {
      ...currentUser,
      savedExamProgress: [...otherProgress, progress]
    };

    setCurrentUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const clearExamProgress = (courseId: string) => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      savedExamProgress: (currentUser.savedExamProgress || []).filter(p => p.courseId !== courseId)
    };
    setCurrentUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  return (
    <StoreContext.Provider value={{
      currentUser, users, courses, banners, orders, settings,
      login, signup, logout,
      addCourse, updateCourse, deleteCourse,
      enrollCourse, grantTempAccess,
      addBanner, deleteBanner,
      updateSettings,
      updateUser,
      deleteUser,
      saveExamResult,
      saveExamProgress,
      clearExamProgress
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};