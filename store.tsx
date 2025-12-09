
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Course, Banner, Order, AppSettings, UserRole, ExamResult } from './types';

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
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const INITIAL_COURSES: Course[] = [
  {
    id: '1',
    title: 'Class 10 Science (Physics, Chem, Bio)',
    mrp: 1999,
    price: 0,
    description: 'Complete NCERT coverage for Class 10 Science. Includes Physics (Light, Electricity), Chemistry (Reactions, Carbon), and Biology (Life Processes).',
    image: 'https://img.freepik.com/free-vector/science-lab-objects-composition_1284-18158.jpg',
    category: 'Science',
    createdAt: new Date().toISOString(),
    isPaid: false,
    chapters: [
      {
        id: 'c1',
        title: 'Chemical Reactions and Equations',
        videos: [
          { id: 'v1', title: 'Introduction to Chemical Reactions', filename: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '15:00' },
          { id: 'v2', title: 'Balancing Equations', filename: 'https://www.w3schools.com/html/movie.mp4', duration: '20:00' }
        ],
        notes: [
          { id: 'n1', title: 'Chapter 1 Summary Notes', url: '#' }
        ]
      },
      {
        id: 'c2',
        title: 'Light - Reflection and Refraction',
        videos: [
          { id: 'v3', title: 'Laws of Reflection', filename: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '18:00' }
        ],
        notes: []
      }
    ]
  },
  {
    id: '2',
    title: 'Class 10 Mathematics Mastery',
    mrp: 2499,
    price: 499,
    description: 'Master Trigonometry, Algebra, Geometry, and Statistics. Solved examples and previous year questions included.',
    image: 'https://img.freepik.com/free-vector/maths-chalkboard_23-2148178220.jpg',
    category: 'Maths',
    createdAt: new Date().toISOString(),
    isPaid: true,
    verificationLink: 'https://google.com',
    chapters: []
  },
  {
    id: '3',
    title: 'Class 10 English Literature & Grammar',
    mrp: 999,
    price: 0,
    description: 'First Flight and Footprints Without Feet complete explanation with Grammar section.',
    image: 'https://img.freepik.com/free-photo/english-british-flag-language-education-concept_53876-128211.jpg',
    category: 'English',
    createdAt: new Date().toISOString(),
    isPaid: false,
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
    email: 'r29878448@gmail.com',
    phone: '0000000000',
    password: 'Mnbvcxz09@',
    role: UserRole.ADMIN,
    purchasedCourseIds: [],
    examResults: [],
    tempAccess: {}
  },
  {
    id: 'editor',
    name: 'Editor',
    email: 'editor@gmail.com',
    phone: '1111111111',
    password: 'Mnbvcxz09@',
    role: UserRole.EDITOR,
    purchasedCourseIds: [],
    examResults: [],
    tempAccess: {}
  }
];

const INITIAL_SETTINGS: AppSettings = {
  appName: 'Study Portal',
  adminEmail: 'r29878448@gmail.com',
  supportPhone: '+91-9876543210',
  razorpayKey: 'rzp_test_123456',
  razorpaySecret: '',
  linkShortenerApiUrl: '',
  linkShortenerApiKey: '',
  telegramBotToken: '',
  adsCode: ''
};

export const StoreProvider = ({ children }: { children?: React.ReactNode }) => {
  // Initialize state from LocalStorage or Defaults
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sp_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
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

  // Persistence Effects with Error Handling
  useEffect(() => {
    try {
      localStorage.setItem('sp_users', JSON.stringify(users));
    } catch (e) { console.error('Storage full'); }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('sp_currentUser', JSON.stringify(currentUser));
    } catch (e) { console.error('Storage full'); }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('sp_courses', JSON.stringify(courses));
    } catch (e) { console.error('Storage full'); }
  }, [courses]);

  useEffect(() => {
    try {
      localStorage.setItem('sp_banners', JSON.stringify(banners));
    } catch (e) { console.error('Storage full'); }
  }, [banners]);

  useEffect(() => {
    try {
      localStorage.setItem('sp_orders', JSON.stringify(orders));
    } catch (e) { console.error('Storage full'); }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('sp_settings', JSON.stringify(settings));
    } catch (e) { console.error('Storage full'); }
  }, [settings]);

  const login = (email: string, pass: string) => {
    const user = users.find(u => (u.email === email || u.name === email) && u.password === pass);
    if (user) {
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      setUsers(prevUsers => prevUsers.map(u => u.id === user.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      return true;
    }
    return false;
  };

  const signup = (name: string, email: string, phone: string, pass: string) => {
    if (users.some(u => u.email === email)) {
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
    
    // 24 hours from now
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
    setCurrentUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const deleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const addBanner = (banner: Banner) => setBanners([...banners, banner]);
  const deleteBanner = (id: string) => setBanners(banners.filter(b => b.id !== id));
  const updateSettings = (newSettings: AppSettings) => setSettings(newSettings);

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
      saveExamResult
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
