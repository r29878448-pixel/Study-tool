
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Course, Banner, Order, AppSettings, UserRole, ExamResult, ExamProgress, VideoProgress, AiGeneratedQuiz, SavedNote, OfflineContent, VideoBookmark } from './types';

interface StoreContextType {
  currentUser: User | null;
  users: User[];
  courses: Course[];
  banners: Banner[];
  orders: Order[];
  settings: AppSettings;
  login: (email: string, pass: string) => boolean;
  signup: (name: string, email: string, phone: string, pass: string) => void;
  addUser: (user: User) => void; 
  logout: () => void;
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;
  enrollCourse: (courseId: string) => void;
  addCourseToUser: (userId: string, courseId: string) => void;
  removeCourseFromUser: (userId: string, courseId: string) => void;
  grantTempAccess: (courseId: string) => void;
  addBanner: (banner: Banner) => void;
  deleteBanner: (id: string) => void;
  updateSettings: (settings: AppSettings) => void;
  updateUser: (data: Partial<User>) => void;
  updateUserById: (userId: string, data: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  saveExamResult: (courseId: string, score: number, totalQuestions: number) => void;
  saveExamProgress: (progress: ExamProgress) => void;
  clearExamProgress: (courseId: string) => void;
  saveVideoProgress: (videoId: string, timestamp: number, duration: number) => void;
  saveAiQuiz: (quiz: AiGeneratedQuiz) => void;
  saveNote: (note: SavedNote) => void;
  deleteNote: (noteId: string) => void;
  saveOfflineContent: (content: OfflineContent) => void;
  removeOfflineContent: (contentId: string) => void;
  saveBookmark: (bookmark: VideoBookmark) => void;
  deleteBookmark: (bookmarkId: string) => void;
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
    accessKey: 'MATHS2024',
    shortenerLink: '', 
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
    tempAccess: {},
    videoProgress: {}
  }
];

const INITIAL_SETTINGS: AppSettings = {
  appName: 'Study Portal',
  adminEmail: 'admin@gmail.com',
  supportPhone: '@STUDY_PORTAL_ROBOT',
  razorpayKey: 'rzp_test_123456',
  razorpaySecret: '',
  uiColor: '#0284C7',
  linkShortenerApiUrl: 'https://reel2earn.com/api',
  linkShortenerApiKey: '886b2438df276766a961e805be231bcf791b9433',
  telegramBotToken: '',
  adsCode: '',
  videoApiKey: '4OUPlckDLJWkKNScjReuPV4kklAhSzSCaxWCtFtJWzQ'
};

export const StoreProvider = ({ children }: { children?: React.ReactNode }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('sp_users');
      let loadedUsers: User[] = saved ? JSON.parse(saved) : INITIAL_USERS;
      
      const adminExists = loadedUsers.some(u => u.role === UserRole.ADMIN);
      if (!adminExists) {
        if (loadedUsers.length === 0) {
          loadedUsers = INITIAL_USERS;
        } else {
          loadedUsers = [...loadedUsers, INITIAL_USERS[0]];
        }
      }
      return loadedUsers;
    } catch (e) {
      console.error("Storage error", e);
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('sp_currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch(e) { return null; }
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem('sp_courses');
      return saved ? JSON.parse(saved) : INITIAL_COURSES;
    } catch(e) { return INITIAL_COURSES; }
  });

  const [banners, setBanners] = useState<Banner[]>(() => {
    try {
      const saved = localStorage.getItem('sp_banners');
      return saved ? JSON.parse(saved) : INITIAL_BANNERS;
    } catch(e) { return INITIAL_BANNERS; }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('sp_orders');
      return saved ? JSON.parse(saved) : [];
    } catch(e) { return []; }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('sp_settings');
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch(e) { return INITIAL_SETTINGS; }
  });

  // Safe Setters with Try/Catch for Storage Quota
  useEffect(() => { try { localStorage.setItem('sp_users', JSON.stringify(users)); } catch(e) { console.error("Storage full"); } }, [users]);
  useEffect(() => { try { localStorage.setItem('sp_currentUser', JSON.stringify(currentUser)); } catch(e) { console.error("Storage full"); } }, [currentUser]);
  useEffect(() => { try { localStorage.setItem('sp_courses', JSON.stringify(courses)); } catch(e) { console.error("Storage full"); } }, [courses]);
  useEffect(() => { try { localStorage.setItem('sp_banners', JSON.stringify(banners)); } catch(e) { console.error("Storage full"); } }, [banners]);
  useEffect(() => { try { localStorage.setItem('sp_orders', JSON.stringify(orders)); } catch(e) { console.error("Storage full"); } }, [orders]);
  useEffect(() => { try { localStorage.setItem('sp_settings', JSON.stringify(settings)); } catch(e) { console.error("Storage full"); } }, [settings]);

  useEffect(() => {
    const adminUser = users.find(u => u.role === UserRole.ADMIN);
    if (adminUser && adminUser.email !== settings.adminEmail) {
       // Logic to keep them in sync could go here
    }
  }, [settings.adminEmail, users]);

  const login = (email: string, pass: string) => {
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
      tempAccess: {},
      videoProgress: {}
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
  };

  // Allow admins to add users manually (including Editors/Managers)
  const addUser = (user: User) => {
    if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
      alert('User with this email already exists!');
      return;
    }
    setUsers([...users, user]);
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

    // For free access via key, we treat it as 'purchased'
    const updatedUser = {
      ...currentUser,
      purchasedCourseIds: [...currentUser.purchasedCourseIds, courseId]
    };
    
    setCurrentUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const addCourseToUser = (userId: string, courseId: string) => {
    setUsers(prevUsers => prevUsers.map(u => {
        if (u.id === userId && !u.purchasedCourseIds.includes(courseId)) {
            return { ...u, purchasedCourseIds: [...u.purchasedCourseIds, courseId] };
        }
        return u;
    }));
    
    // Also update current user state if the admin is modifying themselves
    if (currentUser && currentUser.id === userId && !currentUser.purchasedCourseIds.includes(courseId)) {
        setCurrentUser({ ...currentUser, purchasedCourseIds: [...currentUser.purchasedCourseIds, courseId] });
    }
  };

  const removeCourseFromUser = (userId: string, courseId: string) => {
    setUsers(prevUsers => prevUsers.map(u => {
        if (u.id === userId) {
            return { ...u, purchasedCourseIds: u.purchasedCourseIds.filter(id => id !== courseId) };
        }
        return u;
    }));

    // Also update current user state if the admin is modifying themselves
    if (currentUser && currentUser.id === userId) {
        setCurrentUser({ ...currentUser, purchasedCourseIds: currentUser.purchasedCourseIds.filter(id => id !== courseId) });
    }
  };

  const grantTempAccess = (courseId: string) => {
    if (!currentUser) return;
    // Set expiry to 24 hours from now
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

  const updateUserById = (userId: string, data: Partial<User>) => {
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id === userId) {
        return { ...u, ...data };
      }
      return u;
    }));
    
    // If we updated the current user, reflect that
    if (currentUser && currentUser.id === userId) {
       setCurrentUser(prev => prev ? ({ ...prev, ...data }) : null);
    }
  };

  const deleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const addBanner = (banner: Banner) => setBanners([...banners, banner]);
  const deleteBanner = (id: string) => setBanners(banners.filter(b => b.id !== id));
  
  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
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

  const saveVideoProgress = (videoId: string, timestamp: number, duration: number) => {
    if (!currentUser) return;

    // Mark as completed if watched > 90%
    const isCompleted = (timestamp / duration) > 0.9;
    
    const newProgress: VideoProgress = {
      timestamp,
      duration,
      completed: isCompleted || (currentUser.videoProgress?.[videoId]?.completed || false),
      lastWatched: new Date().toISOString()
    };

    const updatedUser: User = {
      ...currentUser,
      videoProgress: {
        ...(currentUser.videoProgress || {}),
        [videoId]: newProgress
      }
    };

    setCurrentUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const saveAiQuiz = (quiz: AiGeneratedQuiz) => {
    if (!currentUser) return;
    
    const currentQuizzes = currentUser.generatedQuizzes || [];
    // Remove old quiz for this video if exists
    const otherQuizzes = currentQuizzes.filter(q => q.videoId !== quiz.videoId);
    
    const updatedUser: User = {
      ...currentUser,
      generatedQuizzes: [...otherQuizzes, quiz]
    };

    setCurrentUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const saveNote = (note: SavedNote) => {
    if (!currentUser) return;
    const currentNotes = currentUser.savedNotes || [];
    // Check if note for this video already exists and update it, or add new
    const existingIndex = currentNotes.findIndex(n => n.videoId === note.videoId);
    let updatedNotes;
    
    if (existingIndex >= 0) {
      updatedNotes = [...currentNotes];
      updatedNotes[existingIndex] = note;
    } else {
      updatedNotes = [note, ...currentNotes];
    }

    const updatedUser: User = {
      ...currentUser,
      savedNotes: updatedNotes
    };

    setCurrentUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const deleteNote = (noteId: string) => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      savedNotes: (currentUser.savedNotes || []).filter(n => n.id !== noteId)
    };
    setCurrentUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const saveOfflineContent = (content: OfflineContent) => {
    if (!currentUser) return;
    const currentLibrary = currentUser.offlineLibrary || [];
    // Avoid duplicates
    if (currentLibrary.some(c => c.id === content.id)) return;

    const updatedUser: User = {
      ...currentUser,
      offlineLibrary: [content, ...currentLibrary]
    };
    setCurrentUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const removeOfflineContent = (contentId: string) => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      offlineLibrary: (currentUser.offlineLibrary || []).filter(c => c.id !== contentId)
    };
    setCurrentUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const saveBookmark = (bookmark: VideoBookmark) => {
    if (!currentUser) return;
    const currentBookmarks = currentUser.bookmarks || [];
    const updatedUser = { ...currentUser, bookmarks: [bookmark, ...currentBookmarks] };
    setCurrentUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const deleteBookmark = (bookmarkId: string) => {
    if (!currentUser) return;
    const updatedUser = { 
        ...currentUser, 
        bookmarks: (currentUser.bookmarks || []).filter(b => b.id !== bookmarkId) 
    };
    setCurrentUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  return (
    <StoreContext.Provider value={{
      currentUser, users, courses, banners, orders, settings,
      login, signup, addUser, logout,
      addCourse, updateCourse, deleteCourse,
      enrollCourse, addCourseToUser, removeCourseFromUser, grantTempAccess,
      addBanner, deleteBanner,
      updateSettings,
      updateUser,
      updateUserById,
      deleteUser,
      saveExamResult,
      saveExamProgress,
      clearExamProgress,
      saveVideoProgress,
      saveAiQuiz,
      saveNote,
      deleteNote,
      saveOfflineContent,
      removeOfflineContent,
      saveBookmark,
      deleteBookmark
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
