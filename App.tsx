import React, { useEffect, useState, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { 
  Home, BookOpen, User, HelpCircle, Menu, LogOut, 
  Search, PlayCircle, Lock, LayoutDashboard, Users, CreditCard, Settings, Plus, Trash2, Edit, Save, X, ChevronDown, ChevronUp,
  MessageCircle, CloudDownload, CheckCircle, Shield, Upload, FileText, Download, Youtube, Link as LinkIcon, Image as ImageIcon, Globe,
  ClipboardList, Timer, Code, DollarSign, Clock, Eye, Smartphone, MoreVertical, Key, Copy, ExternalLink, Play
} from './components/Icons';
import VideoPlayer from './components/VideoPlayer';
import ChatBot from './components/ChatBot';
import ExamMode from './components/ExamMode';
import { Course, Chapter, Video, UserRole, Note, Banner, AppSettings, Exam, Question, VideoProgress } from './types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// --- Theme Handler ---
const ThemeHandler = () => {
  const { settings } = useStore();
  
  useEffect(() => {
    const root = document.documentElement;
    const hex = settings.uiColor || '#0284C7';
    
    // Calculate Dark Variant
    if (!hex.startsWith('#') || hex.length < 7) return;

    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    
    // Darken by 20%
    const rDark = Math.floor(r * 0.8);
    const gDark = Math.floor(g * 0.8);
    const bDark = Math.floor(b * 0.8);

    const hexDark = '#' + [rDark, gDark, bDark].map(c => c.toString(16).padStart(2, '0')).join('');
    
    root.style.setProperty('--color-brand', hex);
    root.style.setProperty('--color-brand-dark', hexDark);
  }, [settings.uiColor]);

  return null;
};

// --- Helper Functions ---
const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// --- Components ---

const Logo = ({ dark = false }: { dark?: boolean }) => {
  const { settings } = useStore();
  return (
    <div className={`flex items-center gap-2 font-bold text-xl tracking-tight ${dark ? 'text-gray-900' : 'text-white'}`}>
      <div className={`${dark ? 'bg-brand text-white' : 'bg-white text-brand'} p-1.5 rounded-lg shadow-sm`}>
        <BookOpen className="w-6 h-6" />
      </div>
      <span>{settings.appName || 'Study Portal'}</span>
    </div>
  );
};

const AdContainer = () => {
  const { settings } = useStore();
  if (!settings.adsCode) return null;
  return (
    <div className="w-full my-4 bg-gray-50 border-y border-gray-200 overflow-hidden flex flex-col items-center justify-center min-h-[100px] text-center p-2">
      <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Sponsored</div>
      <div dangerouslySetInnerHTML={{ __html: settings.adsCode }} />
    </div>
  );
};

const CountdownTimer = ({ expiryDate }: { expiryDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number} | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(expiryDate) - +new Date();
      if (difference > 0) {
        return {
          h: Math.floor((difference / (1000 * 60 * 60))),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60),
        };
      }
      return null;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryDate]);

  if (!timeLeft) return <span className="text-red-500 font-bold">Expired</span>;

  return (
    <div className="flex gap-1 items-center font-mono font-bold text-lg text-brand bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
      <Timer className="w-5 h-5 mr-1" />
      <span>{timeLeft.h.toString().padStart(2, '0')}</span>:
      <span>{timeLeft.m.toString().padStart(2, '0')}</span>:
      <span>{timeLeft.s.toString().padStart(2, '0')}</span>
    </div>
  );
};

const Header = () => {
  const { settings, currentUser, logout } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  
  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-brand text-white flex items-center justify-between px-4 z-50 shadow-md transition-colors duration-300">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowMenu(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <Logo />
        </div>
        
        <Link to="/profile">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-sm font-bold">
            {currentUser ? currentUser.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
          </div>
        </Link>
      </header>

      {/* Sidebar Drawer */}
      {showMenu && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMenu(false)} />
          <div className="relative w-64 bg-white h-full shadow-xl flex flex-col animate-slide-in">
            <div className="h-40 bg-brand flex flex-col justify-center px-6 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-10 -translate-y-10"></div>
               <div className="w-14 h-14 rounded-full bg-white text-brand flex items-center justify-center mb-3 text-2xl font-bold shadow-md">
                {currentUser?.name.charAt(0).toUpperCase()}
               </div>
               <p className="font-bold truncate text-lg">{currentUser?.name}</p>
               <p className="text-sm opacity-80 truncate">{currentUser?.email}</p>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
              <Link to="/" onClick={() => setShowMenu(false)} className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 border-l-4 border-transparent hover:border-brand transition-all">
                <Home className="w-5 h-5 mr-3 text-brand" /> Home
              </Link>
              <Link to="/my-courses" onClick={() => setShowMenu(false)} className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 border-l-4 border-transparent hover:border-brand transition-all">
                <BookOpen className="w-5 h-5 mr-3 text-brand" /> My Batches
              </Link>
              <Link to="/profile" onClick={() => setShowMenu(false)} className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 border-l-4 border-transparent hover:border-brand transition-all">
                <User className="w-5 h-5 mr-3 text-brand" /> Profile
              </Link>
              <Link to="/help" onClick={() => setShowMenu(false)} className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 border-l-4 border-transparent hover:border-brand transition-all">
                <HelpCircle className="w-5 h-5 mr-3 text-brand" /> Help & Support
              </Link>
              {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.EDITOR) && (
                <Link to="/admin" onClick={() => setShowMenu(false)} className="flex items-center px-6 py-3 text-red-600 font-medium hover:bg-red-50 mt-4 border-t border-red-100">
                  <LayoutDashboard className="w-5 h-5 mr-3" /> {currentUser.role === UserRole.EDITOR ? 'Editor Panel' : 'Admin Panel'}
                </Link>
              )}
            </nav>
            <div className="p-4 border-t">
              <button onClick={() => { logout(); setShowMenu(false); }} className="flex items-center text-red-600 w-full px-4 py-3 hover:bg-red-50 rounded-lg transition-colors font-medium">
                <LogOut className="w-5 h-5 mr-3" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const BottomNav = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'text-brand' : 'text-gray-400';

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <Link to="/" className={`flex flex-col items-center ${isActive('/')}`}>
        <Home className="w-6 h-6" />
        <span className="text-[10px] mt-1 font-medium">Home</span>
      </Link>
      <Link to="/my-courses" className={`flex flex-col items-center ${isActive('/my-courses')}`}>
        <BookOpen className="w-6 h-6" />
        <span className="text-[10px] mt-1 font-medium">Batches</span>
      </Link>
      <Link to="/help" className={`flex flex-col items-center ${isActive('/help')}`}>
        <HelpCircle className="w-6 h-6" />
        <span className="text-[10px] mt-1 font-medium">Help</span>
      </Link>
      <Link to="/profile" className={`flex flex-col items-center ${isActive('/profile')}`}>
        <User className="w-6 h-6" />
        <span className="text-[10px] mt-1 font-medium">Profile</span>
      </Link>
    </div>
  );
};

// --- Pages ---

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const { login, signup, currentUser, settings } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.EDITOR) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [currentUser, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup) {
      signup(formData.name, formData.email, formData.phone, formData.password);
    } else {
      const success = login(formData.email, formData.password);
      if (!success) alert('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-brand flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-black opacity-10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

      <div className="mb-8 scale-125">
         <Logo />
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden z-10">
        <div className="flex">
          <button 
            className={`flex-1 py-4 text-center font-bold text-sm tracking-wide transition-colors ${!isSignup ? 'bg-white text-brand border-b-2 border-brand' : 'bg-gray-50 text-gray-500 border-b-2 border-transparent'}`}
            onClick={() => setIsSignup(false)}
          >
            LOGIN
          </button>
          <button 
            className={`flex-1 py-4 text-center font-bold text-sm tracking-wide transition-colors ${isSignup ? 'bg-white text-brand border-b-2 border-brand' : 'bg-gray-50 text-gray-500 border-b-2 border-transparent'}`}
            onClick={() => setIsSignup(true)}
          >
            SIGNUP
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {isSignup ? 'Create Account' : 'Welcome'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isSignup ? `Join ${settings.appName}` : 'Continue your learning journey'}
            </p>
          </div>
          
          {isSignup && (
            <>
              <input 
                type="text" placeholder="Full Name" required 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-colors text-gray-900"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              />
              <input 
                type="tel" placeholder="Phone Number" required 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-colors text-gray-900"
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </>
          )}
          
          <input 
            type="text" placeholder="Email Address" required 
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-colors text-gray-900"
            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
          />
          <input 
            type="password" placeholder="Password" required 
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-colors text-gray-900"
            value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
          />
          
          <button className="w-full bg-brand text-white py-3.5 rounded-lg font-bold shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all">
            {isSignup ? 'Start Learning' : 'Login'}
          </button>

          {!isSignup && (
            <div className="mt-6 text-center border-t pt-4 border-dashed border-gray-200">
              <button 
                type="button"
                onClick={() => {
                  if(confirm('This will RESET all app data (users, courses, settings) to default state. Are you sure?')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="text-[10px] text-red-400 hover:underline hover:text-red-600 transition-colors"
              >
                Reset Application Data
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

const HomePage = () => {
  const { banners, courses } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setActiveBanner(curr => (curr + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="pb-24 pt-16">
      <div className="p-4 bg-white shadow-sm sticky top-16 z-20">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search for subjects, topics..." 
            className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all text-gray-900 placeholder-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
        </div>
      </div>

      {banners.length > 0 ? (
        <div className="relative w-full aspect-[21/9] overflow-hidden mt-2 bg-gray-200">
          {banners.map((b, i) => (
            <img 
              key={b.id} 
              src={b.image} 
              alt="Banner" 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === activeBanner ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          <div className="absolute bottom-4 right-4 flex gap-1.5">
            {banners.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === activeBanner ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full aspect-[21/9] bg-gray-200 mt-2 flex items-center justify-center text-gray-400">
          No banners available
        </div>
      )}
      
      <AdContainer />

      <div className="p-4 mt-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-6 bg-brand rounded-full"></span>
            Popular Batches
          </h2>
          <Link to="/courses" className="text-brand text-sm font-bold hover:bg-blue-50 px-2 py-1 rounded transition-colors">View All</Link>
        </div>
        
        <div className="flex overflow-x-auto space-x-4 pb-4 no-scrollbar">
          {courses.slice(0, 5).map(course => (
            <Link to={`/course/${course.id}`} key={course.id} className="flex-none w-72 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
              <div className="relative overflow-hidden">
                <img src={course.image} alt={course.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                  {course.category}
                </div>
                {course.isPaid && (
                   <div className="absolute top-2 right-2 bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                     <Lock className="w-3 h-3" /> LOCKED
                   </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-800 line-clamp-1 mb-1">{course.title}</h3>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${course.isPaid ? 'text-yellow-600' : 'text-green-600'}`}>
                      {course.isPaid ? 'Key Access' : 'FREE'}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-brand">
                    <PlayCircle className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const CourseListing = () => {
  const { courses } = useStore();
  const [filter, setFilter] = useState('All');
  
  const categories = ['All', ...new Set(courses.map(c => c.category))];

  const filtered = courses.filter(c => filter === 'All' || c.category === filter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="pb-24 pt-16 p-4">
      <div className="flex gap-2 mb-6 sticky top-20 z-10">
        <select className="flex-1 p-3 bg-white shadow-sm border-0 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-brand" onChange={e => setFilter(e.target.value)}>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center py-10 text-gray-400 font-medium">No batches found</div>
        ) : filtered.map(course => (
          <Link to={`/course/${course.id}`} key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <img src={course.image} alt={course.title} className="w-full h-44 object-cover" />
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                 <span className="bg-blue-50 text-brand text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">{course.category}</span>
                 {course.isPaid && <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full font-bold">LOCKED</span>}
              </div>
              <h3 className="font-bold text-gray-800 text-lg leading-tight mb-2 flex-1">{course.title}</h3>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-2">
                <div className="flex flex-col">
                  <span className={`text-xl font-bold ${course.isPaid ? 'text-gray-900' : 'text-green-600'}`}>
                    {course.isPaid ? 'Requires Key' : 'FREE'}
                  </span>
                </div>
                <button className="bg-brand text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-brand-dark transition-colors">Start Learning</button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const RevealKey = () => {
  const { key } = useParams();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if(key) {
      navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-brand flex flex-col items-center justify-center p-6 text-white text-center">
      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 w-full max-w-sm shadow-2xl">
         <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg text-brand animate-fade-in">
           <Key className="w-8 h-8" />
         </div>
         <h1 className="text-2xl font-bold mb-2">Access Key Revealed!</h1>
         <p className="text-white/80 text-sm mb-6">Use this key to unlock your course.</p>
         
         <div className="bg-black/20 p-4 rounded-xl font-mono text-xl font-bold mb-6 flex items-center justify-between gap-4 border border-white/10">
            <span className="truncate">{key}</span>
            <button onClick={handleCopy} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
               {copied ? <CheckCircle className="w-5 h-5 text-green-400"/> : <Copy className="w-5 h-5"/>}
            </button>
         </div>

         <Link to="/" className="block w-full bg-white text-brand font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors">
           Go to App & Unlock
         </Link>
      </div>
    </div>
  );
};

// Route to handle automatic verification after returning from shortener
const VerifyAccess = () => {
  const { courseId } = useParams();
  const { grantTempAccess, courses } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (courseId) {
      const course = courses.find(c => c.id === courseId);
      if(course) {
        grantTempAccess(courseId);
        navigate('/course/' + courseId, { replace: true });
        // Optional: Show a toast here if a toast library existed
        alert("Verification Successful! 24 Hours Access Granted.");
      } else {
        navigate('/');
      }
    }
  }, [courseId, courses, grantTempAccess, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
       <div className="text-center">
         <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
         <h2 className="text-xl font-bold text-gray-800">Verifying Access...</h2>
       </div>
    </div>
  );
};

const CourseDetail = () => {
  const { id } = useParams();
  const { courses, currentUser, enrollCourse, settings } = useStore();
  const navigate = useNavigate();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [isLoadingShortLink, setIsLoadingShortLink] = useState(false);
  
  const course = courses.find(c => c.id === id);

  if (!course) return <Navigate to="/" />;

  const isPurchased = currentUser?.purchasedCourseIds.includes(course.id);
  
  // Check temp access validity
  let tempAccessExpiry: string | null = null;
  if (currentUser?.tempAccess && currentUser.tempAccess[course.id]) {
     const expiry = new Date(currentUser.tempAccess[course.id]);
     if (expiry > new Date()) {
        tempAccessExpiry = currentUser.tempAccess[course.id];
     }
  }

  const hasAccess = isPurchased || tempAccessExpiry !== null || !course.isPaid;

  const handleKeySubmit = () => {
    if (!currentUser) { navigate('/login'); return; }
    
    if (inputKey.trim() === course.accessKey) {
       enrollCourse(course.id);
       alert("Access Granted Successfully!");
       setShowUnlockModal(false);
       navigate('/watch/' + course.id);
    } else {
       alert("Invalid Access Key. Please try again.");
    }
  };

  const handleFreeEnroll = () => {
    if (!currentUser) { navigate('/login'); return; }
    enrollCourse(course.id);
    alert('Success! You are now enrolled.');
    navigate('/my-courses');
  };

  const handleGenerateTempAccess = () => {
    if (!course.shortenerLink) {
       alert("No shortener link configured for this course.");
       return;
    }
    // Open the shortener link. The shortener link should redirect back to /#/verify-access/<courseId>
    window.open(course.shortenerLink, '_blank');
  };

  const handleGetFreeKey = async () => {
     if (!course.accessKey) {
        alert("This course does not have an access key configured.");
        return;
     }

     setIsLoadingShortLink(true);
     // Use the base URL including hash, but we need to ensure the redirect works correctly
     // Reel2Earn usually redirects to a URL. 
     // We construct a URL that points to our /reveal/:key page
     const baseUrl = window.location.href.split('#')[0];
     const revealUrl = `${baseUrl}#/reveal/${course.accessKey}`;
     
     // Reel2Earn API call
     // Use settings.linkShortenerApiUrl if available, else default to known endpoint or just allow config
     const shortenerUrl = settings.linkShortenerApiUrl || 'https://reel2earn.com/api';
     const apiUrl = `${shortenerUrl}?api=${settings.linkShortenerApiKey}&url=${encodeURIComponent(revealUrl)}`;

     try {
       const res = await fetch(apiUrl);
       const data = await res.json();
       
       if (data.status === 'success' && data.shortenedUrl) {
          window.open(data.shortenedUrl, '_blank');
       } else {
          // If API returns plain text link or fails silently
          console.warn('API Response:', data);
          // Fallback mechanism: direct open if API key is invalid or quota exceeded (for demo)
          alert("Link shortener service unavailable. Opening direct verification for demo.");
          window.open(revealUrl, '_blank');
       }
     } catch (e) {
       console.error(e);
       alert("Network error connecting to shortener. Opening reveal page directly for demo.");
       window.open(revealUrl, '_blank');
     } finally {
       setIsLoadingShortLink(false);
     }
  };

  const openTelegramAdmin = () => {
     window.open('http://t.me/STUDY_PORTAL_ROBOT', '_blank');
  };

  // Calculate Progress if enrolled
  let progress = 0;
  if (isPurchased && currentUser?.videoProgress) {
      const allVideos = course.chapters.flatMap(c => c.videos);
      const totalVideos = allVideos.length;
      if (totalVideos > 0) {
        const completedCount = allVideos.filter(v => currentUser.videoProgress?.[v.id]?.completed).length;
        progress = Math.round((completedCount / totalVideos) * 100);
      }
  }

  return (
    <div className="pb-24 pt-16 bg-white min-h-screen relative">
      <div className="w-full aspect-video bg-gray-200 sticky top-16 z-10">
        <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
          <div>
            <span className="inline-block bg-brand text-white text-[10px] font-bold px-2 py-1 rounded mb-2 uppercase">{course.category}</span>
            <h1 className="text-2xl font-bold text-white shadow-sm leading-tight">{course.title}</h1>
          </div>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${course.isPaid ? 'text-gray-900' : 'text-green-600'}`}>
                  {course.isPaid ? 'Requires Access Key' : 'FREE'}
              </span>
              {course.isPaid && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold uppercase">Locked</span>}
           </div>
           
           {/* Countdown Timer Display */}
           {tempAccessExpiry && (
              <CountdownTimer expiryDate={tempAccessExpiry} />
           )}
        </div>

        {hasAccess && (
          <div className="mb-6 space-y-3">
             <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                   <span>Course Progress</span>
                   <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                   <div className="bg-brand h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
             </div>

             <Link 
               to={`/exam/${course.id}`}
               className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-purple-200 transition-colors"
             >
                <ClipboardList className="w-5 h-5" /> Take Exam
             </Link>
          </div>
        )}

        <h3 className="font-bold text-lg mb-2">Overview</h3>
        <div className="text-gray-600 leading-relaxed mb-8 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
          {course.description}
        </div>

        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand" />
          Batch Content
        </h3>
        <div className="space-y-3 mb-20">
          {course.chapters.length === 0 && <p className="text-gray-500 italic p-6 text-center bg-gray-50 rounded-lg border border-dashed">Content is being uploaded...</p>}
          {course.chapters.map((chapter, idx) => (
             <div key={chapter.id} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-white p-4 font-medium flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold">
                      {idx + 1}
                    </div>
                    <span className="text-gray-800">{chapter.title}</span>
                  </div>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">{chapter.videos.length} Lectures</span>
                </div>
             </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
        {hasAccess ? (
          <Link 
            to={`/watch/${course.id}`}
            className="w-full font-bold py-4 rounded-xl text-lg bg-green-600 text-white shadow-lg shadow-green-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-5 h-5"/> Resume Learning
          </Link>
        ) : course.isPaid ? (
          <div className="flex flex-col gap-2">
            {course.shortenerLink && (
              <button 
                onClick={handleGenerateTempAccess}
                className="w-full font-bold py-4 rounded-xl text-lg bg-blue-600 text-white shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Clock className="w-5 h-5"/> Get 24h Access (Watch Ad)
              </button>
            )}
            <button 
              onClick={() => {
                if(!currentUser) navigate('/login');
                else setShowUnlockModal(true);
              }}
              className={`w-full font-bold py-4 rounded-xl text-lg ${course.shortenerLink ? 'bg-white text-gray-700 border border-gray-300' : 'bg-brand text-white shadow-lg shadow-blue-500/30'} active:scale-[0.98] transition-all flex items-center justify-center gap-2`}
            >
              <Lock className="w-5 h-5"/> Unlock Permanently
            </button>
          </div>
        ) : (
          <button 
            onClick={handleFreeEnroll}
            className="w-full font-bold py-4 rounded-xl text-lg bg-brand text-white shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5"/> Start Learning (Free)
          </button>
        )}
      </div>

      {/* Access Key Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold">Unlock Batch</h3>
                 <button onClick={() => setShowUnlockModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Enter Access Key</label>
                    <input 
                      type="text" 
                      placeholder="e.g. SCIENCE2024" 
                      className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold text-center uppercase focus:border-brand focus:outline-none"
                      value={inputKey}
                      onChange={e => setInputKey(e.target.value.toUpperCase())}
                    />
                 </div>
                 
                 <button 
                   onClick={handleKeySubmit}
                   disabled={!inputKey}
                   className="w-full bg-brand text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 disabled:opacity-50"
                 >
                   Unlock Now
                 </button>

                 <div className="relative py-2">
                   <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                   <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400 font-bold">Don't have a key?</span></div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                   <button 
                      onClick={handleGetFreeKey}
                      disabled={isLoadingShortLink}
                      className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                   >
                      <LinkIcon className="w-5 h-5 text-blue-500 mb-1" />
                      <span className="text-xs font-bold text-gray-700">{isLoadingShortLink ? 'Loading...' : 'Get Key Free'}</span>
                      <span className="text-[9px] text-gray-400">Complete Task</span>
                   </button>
                   
                   <button 
                      onClick={openTelegramAdmin}
                      className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                   >
                      <MessageCircle className="w-5 h-5 text-blue-500 mb-1" />
                      <span className="text-xs font-bold text-gray-700">Buy Key</span>
                      <span className="text-[9px] text-gray-400">Contact Admin</span>
                   </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const MyCourses = () => {
  const { courses, currentUser } = useStore();
  
  if (!currentUser) return <Navigate to="/login" />;

  const myCourseIds = currentUser.purchasedCourseIds;
  const myCourses = courses.filter(c => 
    myCourseIds.includes(c.id) || 
    (currentUser.tempAccess && currentUser.tempAccess[c.id] && new Date(currentUser.tempAccess[c.id]) > new Date())
  );

  const getProgress = (course: Course) => {
    const allVideos = course.chapters.flatMap(c => c.videos);
    const totalVideos = allVideos.length;
    if (totalVideos === 0) return 0;
    const completedCount = allVideos.filter(v => currentUser.videoProgress?.[v.id]?.completed).length;
    return Math.round((completedCount / totalVideos) * 100);
  };

  return (
    <div className="pb-24 pt-16 p-4">
      <h2 className="text-xl font-bold mb-6">My Batches</h2>
      <div className="space-y-4">
        {myCourses.length === 0 ? (
           <div className="text-center py-10 text-gray-400">You haven't enrolled in any batches yet.</div>
        ) : myCourses.map(course => {
           const progress = getProgress(course);
           return (
             <Link to={`/watch/${course.id}`} key={course.id} className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex gap-4 p-3 items-center">
                <img src={course.image} className="w-20 h-20 rounded-lg object-cover" />
                <div className="flex-1">
                   <h3 className="font-bold text-gray-800 line-clamp-1">{course.title}</h3>
                   <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-brand h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                   </div>
                   <p className="text-[10px] text-gray-400 mt-1">{progress}% Completed</p>
                </div>
                <div className="bg-brand/10 p-2 rounded-full text-brand">
                  <PlayCircle className="w-6 h-6" />
                </div>
             </Link>
           );
        })}
      </div>
    </div>
  );
};

const Watch = () => {
  const { courseId } = useParams();
  const { courses, currentUser, saveVideoProgress } = useStore();
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  
  const course = courses.find(c => c.id === courseId);
  
  const hasAccess = currentUser && (
     currentUser.purchasedCourseIds.includes(courseId!) || 
     (currentUser.tempAccess?.[courseId!] && new Date(currentUser.tempAccess[courseId!]) > new Date()) ||
     (!course?.isPaid)
  );

  if (!course) return <Navigate to="/" />;
  if (!hasAccess && course.isPaid) return <Navigate to={`/course/${courseId}`} />;
  
  useEffect(() => {
    // Determine last watched or first
    if (!activeVideo && course.chapters.length > 0) {
      // Find last watched video
      let lastWatchedId: string | null = null;
      let latestTime = 0;
      
      if (currentUser?.videoProgress) {
         Object.entries(currentUser.videoProgress).forEach(([vidId, prog]) => {
            const videoProgress = prog as VideoProgress;
            const vidExists = course.chapters.some(ch => ch.videos.some(v => v.id === vidId));
            if (vidExists && new Date(videoProgress.lastWatched).getTime() > latestTime) {
               latestTime = new Date(videoProgress.lastWatched).getTime();
               lastWatchedId = vidId;
            }
         });
      }

      if (lastWatchedId) {
         const found = course.chapters.flatMap(c => c.videos).find(v => v.id === lastWatchedId);
         if (found) setActiveVideo(found);
      } else if (course.chapters[0].videos.length > 0) {
         setActiveVideo(course.chapters[0].videos[0]);
      }
    }
  }, [course]);

  const handleProgress = (time: number, duration: number) => {
    if (activeVideo) {
      saveVideoProgress(activeVideo.id, time, duration);
    }
  };

  const getInitialTime = () => {
    if (activeVideo && currentUser?.videoProgress?.[activeVideo.id]) {
      return currentUser.videoProgress[activeVideo.id].timestamp;
    }
    return 0;
  };

  return (
     <div className="pb-24 pt-16 lg:h-screen lg:pb-0 lg:overflow-hidden flex flex-col lg:flex-row">
        {/* Video Area */}
        <div className="w-full lg:flex-1 bg-black sticky top-16 lg:static z-20">
           {activeVideo ? (
             <VideoPlayer 
               key={activeVideo.id} // Re-mount on change
               src={activeVideo.filename} 
               onProgress={handleProgress}
               initialTime={getInitialTime()}
             />
           ) : (
             <div className="aspect-video bg-gray-900 flex items-center justify-center text-gray-500">
                Select a lecture to play
             </div>
           )}
           <div className="p-4 bg-white border-b lg:border-b-0">
              <h1 className="font-bold text-lg text-gray-800">{activeVideo?.title || course.title}</h1>
           </div>
        </div>
        
        {/* Playlist */}
        <div className="w-full lg:w-96 bg-gray-50 h-full overflow-y-auto border-l">
           <div className="p-4 border-b bg-white font-bold text-gray-700">Course Content</div>
           <div className="p-2 space-y-2">
              {course.chapters.map((chapter, cIdx) => (
                 <div key={chapter.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-3 bg-gray-50 font-bold text-sm text-gray-600 border-b flex justify-between">
                       <span>{cIdx + 1}. {chapter.title}</span>
                       <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded">{chapter.videos.length} videos</span>
                    </div>
                    <div>
                       {chapter.videos.map((video, vIdx) => {
                          const isCompleted = currentUser?.videoProgress?.[video.id]?.completed;
                          return (
                            <button 
                              key={video.id}
                              onClick={() => setActiveVideo(video)}
                              className={`w-full text-left p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b last:border-0 ${activeVideo?.id === video.id ? 'bg-blue-50' : ''}`}
                            >
                               <div className="mt-1 relative">
                                  {activeVideo?.id === video.id ? (
                                    <PlayCircle className="w-4 h-4 text-brand" />
                                  ) : isCompleted ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                  )}
                               </div>
                               <div>
                                  <p className={`text-sm font-medium ${activeVideo?.id === video.id ? 'text-brand' : 'text-gray-700'}`}>{video.title}</p>
                                  <p className="text-[10px] text-gray-400 mt-1">{video.duration}</p>
                               </div>
                            </button>
                          );
                       })}
                       {chapter.notes.map(note => (
                          <a 
                            href={note.url} 
                            target="_blank"
                            key={note.id}
                            className="w-full text-left p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b last:border-0 bg-red-50/30"
                          >
                             <FileText className="w-4 h-4 text-red-500 mt-1" />
                             <div>
                                <p className="text-sm font-medium text-gray-700">{note.title}</p>
                                <p className="text-[10px] text-gray-400 mt-1">PDF Note</p>
                             </div>
                          </a>
                       ))}
                    </div>
                 </div>
              ))}
           </div>
        </div>
     </div>
  );
};

// ... Content Manager Component ...
const ContentManager = ({ course, onClose }: { course: Course, onClose: () => void }) => {
  const { updateCourse } = useStore();
  const [chapters, setChapters] = useState<Chapter[]>(course.chapters);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [activeChapterId, setActiveChapterId] = useState<string | null>(chapters[0]?.id || null);
  
  // Adding Video/Note State
  const [addType, setAddType] = useState<'video' | 'note' | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('');

  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) return;
    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: newChapterTitle,
      videos: [],
      notes: []
    };
    const updatedChapters = [...chapters, newChapter];
    setChapters(updatedChapters);
    updateCourse({ ...course, chapters: updatedChapters });
    setNewChapterTitle('');
    setActiveChapterId(newChapter.id);
  };

  const handleAddItem = () => {
    if (!newItemTitle.trim() || !newItemUrl.trim() || !activeChapterId) return;

    const updatedChapters = chapters.map(ch => {
      if (ch.id === activeChapterId) {
        if (addType === 'video') {
           const vid: Video = { id: Date.now().toString(), title: newItemTitle, filename: newItemUrl, duration: 'Unknown' };
           return { ...ch, videos: [...ch.videos, vid] };
        } else {
           const note: Note = { id: Date.now().toString(), title: newItemTitle, url: newItemUrl };
           return { ...ch, notes: [...ch.notes, note] };
        }
      }
      return ch;
    });

    setChapters(updatedChapters);
    updateCourse({ ...course, chapters: updatedChapters });
    setAddType(null);
    setNewItemTitle('');
    setNewItemUrl('');
  };

  const handleDeleteItem = (chapterId: string, itemId: string, type: 'video' | 'note') => {
     if(!confirm('Delete item?')) return;
     const updatedChapters = chapters.map(ch => {
        if(ch.id === chapterId) {
           if(type === 'video') return { ...ch, videos: ch.videos.filter(v => v.id !== itemId) };
           else return { ...ch, notes: ch.notes.filter(n => n.id !== itemId) };
        }
        return ch;
     });
     setChapters(updatedChapters);
     updateCourse({ ...course, chapters: updatedChapters });
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
       <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-fade-in">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
             <h2 className="text-xl font-bold">Content: {course.title}</h2>
             <button onClick={onClose}><X className="w-6 h-6" /></button>
          </div>

          <div className="flex-1 flex overflow-hidden">
             {/* Chapter Sidebar */}
             <div className="w-1/3 border-r bg-gray-50 flex flex-col">
                <div className="p-4 border-b">
                   <div className="flex gap-2">
                      <input 
                        className="flex-1 p-2 border rounded text-sm" 
                        placeholder="Chapter Name" 
                        value={newChapterTitle}
                        onChange={e => setNewChapterTitle(e.target.value)}
                      />
                      <button onClick={handleAddChapter} className="bg-brand text-white p-2 rounded"><Plus className="w-4 h-4"/></button>
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                   {chapters.map(ch => (
                      <button 
                        key={ch.id}
                        onClick={() => setActiveChapterId(ch.id)}
                        className={`w-full text-left p-3 rounded-lg font-bold text-sm flex justify-between items-center ${activeChapterId === ch.id ? 'bg-white shadow-sm border border-gray-200 text-brand' : 'hover:bg-gray-100 text-gray-600'}`}
                      >
                         {ch.title}
                         <span className="text-[10px] bg-gray-200 px-1.5 rounded text-gray-500">{ch.videos.length}</span>
                      </button>
                   ))}
                </div>
             </div>

             {/* Content Area */}
             <div className="flex-1 bg-white flex flex-col">
                {activeChapterId ? (
                   <>
                      <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                         <h3 className="font-bold text-gray-700">
                            {chapters.find(c => c.id === activeChapterId)?.title} Content
                         </h3>
                         <div className="flex gap-2">
                            <button onClick={() => setAddType('video')} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-xs font-bold flex items-center gap-1 hover:bg-blue-200"><PlayCircle className="w-3 h-3"/> Add Video</button>
                            <button onClick={() => setAddType('note')} className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-bold flex items-center gap-1 hover:bg-red-200"><FileText className="w-3 h-3"/> Add Note</button>
                         </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                         {addType && (
                            <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 mb-4 animate-fade-in">
                               <h4 className="font-bold text-sm mb-2">Add {addType === 'video' ? 'Video' : 'Note'}</h4>
                               <input className="w-full p-2 border rounded mb-2 text-sm" placeholder="Title" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} />
                               <input className="w-full p-2 border rounded mb-2 text-sm" placeholder={addType === 'video' ? "Video URL (MP4/YouTube)" : "PDF URL"} value={newItemUrl} onChange={e => setNewItemUrl(e.target.value)} />
                               
                               {addType === 'video' && (
                                  <div className="mb-2">
                                     <label className="text-xs text-gray-500 font-bold">OR Upload File</label>
                                     <input type="file" accept="video/*" className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand file:text-white hover:file:bg-brand-dark mt-1" 
                                        onChange={(e) => {
                                           if (e.target.files?.[0]) {
                                              const reader = new FileReader();
                                              reader.onload = (ev) => setNewItemUrl(ev.target?.result as string);
                                              reader.readAsDataURL(e.target.files[0]);
                                              setNewItemTitle(e.target.files[0].name);
                                           }
                                        }}
                                     />
                                  </div>
                               )}

                               <div className="flex justify-end gap-2">
                                  <button onClick={() => setAddType(null)} className="px-3 py-1 text-gray-500 text-sm font-bold">Cancel</button>
                                  <button onClick={handleAddItem} className="px-3 py-1 bg-brand text-white rounded text-sm font-bold">Add</button>
                               </div>
                            </div>
                         )}

                         {chapters.find(c => c.id === activeChapterId)?.videos.map(v => (
                            <div key={v.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 group">
                               <div className="flex items-center gap-3">
                                  <PlayCircle className="w-5 h-5 text-gray-400" />
                                  <span className="text-sm font-medium">{v.title}</span>
                               </div>
                               <button onClick={() => handleDeleteItem(activeChapterId, v.id, 'video')} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                            </div>
                         ))}
                         {chapters.find(c => c.id === activeChapterId)?.notes.map(n => (
                            <div key={n.id} className="flex justify-between items-center p-3 border rounded-lg bg-red-50/30 hover:bg-red-50 group">
                               <div className="flex items-center gap-3">
                                  <FileText className="w-5 h-5 text-red-400" />
                                  <span className="text-sm font-medium">{n.title}</span>
                               </div>
                               <button onClick={() => handleDeleteItem(activeChapterId, n.id, 'note')} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                            </div>
                         ))}
                      </div>
                   </>
                ) : (
                   <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Select a chapter to manage content</div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};

const ExamManager = ({ course, onClose }: { course: Course, onClose: () => void }) => {
  const { updateCourse } = useStore();
  const [exams, setExams] = useState<Exam[]>(course.exams || []);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  
  // Question State
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState(0);

  const handleAddExam = () => {
    const title = prompt("Enter Exam Title:");
    if (!title) return;
    const newExam: Exam = { id: Date.now().toString(), title, questions: [] };
    const updated = [...exams, newExam];
    setExams(updated);
    updateCourse({ ...course, exams: updated });
  };

  const handleDeleteExam = (examId: string) => {
    if (!confirm("Delete this exam?")) return;
    const updated = exams.filter(e => e.id !== examId);
    setExams(updated);
    updateCourse({ ...course, exams: updated });
    if (activeExam?.id === examId) setActiveExam(null);
  };

  const handleAddQuestion = () => {
    if (!activeExam || !qText) return;
    const newQ: Question = {
      id: Date.now().toString(),
      question: qText,
      options: qOptions,
      correctAnswer: qCorrect
    };
    const updatedQuestions = [...activeExam.questions, newQ];
    const updatedExam = { ...activeExam, questions: updatedQuestions };
    
    // Update local state
    setActiveExam(updatedExam);
    
    // Update list and global store
    const updatedExams = exams.map(e => e.id === activeExam.id ? updatedExam : e);
    setExams(updatedExams);
    updateCourse({ ...course, exams: updatedExams });

    // Reset form
    setQText('');
    setQOptions(['', '', '', '']);
    setQCorrect(0);
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!activeExam) return;
    const updatedQuestions = activeExam.questions.filter(q => q.id !== qId);
    const updatedExam = { ...activeExam, questions: updatedQuestions };
    
    setActiveExam(updatedExam);
    const updatedExams = exams.map(e => e.id === activeExam.id ? updatedExam : e);
    setExams(updatedExams);
    updateCourse({ ...course, exams: updatedExams });
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
           <h2 className="text-xl font-bold">Exams: {course.title}</h2>
           <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar List of Exams */}
          <div className="w-1/3 border-r bg-gray-50 flex flex-col p-4">
             <button onClick={handleAddExam} className="w-full bg-brand text-white py-2 rounded-lg font-bold mb-4 flex items-center justify-center gap-2">
               <Plus className="w-4 h-4" /> New Exam
             </button>
             <div className="space-y-2 overflow-y-auto flex-1">
               {exams.map(exam => (
                 <div key={exam.id} className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center ${activeExam?.id === exam.id ? 'bg-white border-brand shadow-sm' : 'hover:bg-gray-100 border-transparent'}`} onClick={() => setActiveExam(exam)}>
                    <span className="font-bold text-sm truncate">{exam.title}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteExam(exam.id); }} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                 </div>
               ))}
               {exams.length === 0 && <p className="text-gray-400 text-center text-xs italic">No exams created.</p>}
             </div>
          </div>

          {/* Exam Editor Area */}
          <div className="flex-1 flex flex-col bg-white">
             {activeExam ? (
               <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-bold text-lg mb-4">Add Question</h3>
                    <div className="space-y-3">
                      <input className="w-full p-2 border rounded text-sm" placeholder="Question Text" value={qText} onChange={e => setQText(e.target.value)} />
                      <div className="grid grid-cols-2 gap-2">
                        {qOptions.map((opt, i) => (
                          <div key={i} className="flex items-center gap-1">
                             <input type="radio" name="correct" checked={qCorrect === i} onChange={() => setQCorrect(i)} />
                             <input className="flex-1 p-2 border rounded text-xs" placeholder={`Option ${i+1}`} value={opt} onChange={e => {
                               const newOpts = [...qOptions];
                               newOpts[i] = e.target.value;
                               setQOptions(newOpts);
                             }} />
                          </div>
                        ))}
                      </div>
                      <button onClick={handleAddQuestion} className="w-full bg-gray-800 text-white py-2 rounded font-bold text-sm">Add Question</button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {activeExam.questions.map((q, i) => (
                      <div key={q.id} className="p-3 border rounded-lg bg-gray-50 relative group">
                        <div className="pr-8">
                           <p className="font-bold text-sm mb-1">{i+1}. {q.question}</p>
                           <ul className="text-xs text-gray-600 pl-4 list-disc">
                             {q.options.map((o, idx) => (
                               <li key={idx} className={idx === q.correctAnswer ? 'text-green-600 font-bold' : ''}>{o}</li>
                             ))}
                           </ul>
                        </div>
                        <button onClick={() => handleDeleteQuestion(q.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {activeExam.questions.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">No questions added yet.</p>}
                  </div>
               </div>
             ) : (
               <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Select an exam to edit</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const { currentUser, settings, updateSettings, courses, users, addCourse, updateCourse, deleteCourse, deleteUser, updateUser, addBanner, deleteBanner, addUser, banners } = useStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'users' | 'settings'>('dashboard');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [managingExamsCourse, setManagingExamsCourse] = useState<Course | null>(null);
  const [managingContentCourse, setManagingContentCourse] = useState<Course | null>(null);
  
  // User Management State
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'USER' });

  // Settings State
  const [localSettings, setLocalSettings] = useState(settings);
  const [adminCreds, setAdminCreds] = useState({ email: currentUser?.email || '', password: currentUser?.password || '' });
  
  // Banner State
  const [newBannerImage, setNewBannerImage] = useState<string>('');

  if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.EDITOR)) {
    return <Navigate to="/" />;
  }

  const handleSaveSettings = () => {
    if (!currentUser) return;
    updateSettings(localSettings);
    if (adminCreds.email !== currentUser.email || adminCreds.password !== currentUser.password) {
       updateUser({ email: adminCreds.email, password: adminCreds.password });
    }
    alert('Settings and Credentials saved successfully!');
  };

  const handleAddUser = () => {
    if(!newUser.name || !newUser.email || !newUser.password) {
      alert("Please fill all fields");
      return;
    }
    addUser({
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role as UserRole,
      purchasedCourseIds: [],
      phone: '0000000000'
    });
    setNewUser({ name: '', email: '', password: '', role: 'USER' });
    alert("User created successfully");
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await convertToBase64(e.target.files[0]);
        setNewBannerImage(base64);
      } catch (err) {
        console.error("Error converting image", err);
      }
    }
  };

  const handleCourseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editingCourse) {
      try {
        const base64 = await convertToBase64(e.target.files[0]);
        setEditingCourse({ ...editingCourse, image: base64 });
      } catch (err) {
        console.error("Error converting image", err);
      }
    }
  };

  // Logic to handle saving a course (create new or update existing)
  const handleSaveCourse = () => {
    if (!editingCourse) return;
    
    // Check if course already exists in the list
    const exists = courses.some(c => c.id === editingCourse.id);
    
    if (exists) {
      updateCourse(editingCourse);
    } else {
      addCourse(editingCourse);
    }
    setEditingCourse(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20">
      <div className="bg-white shadow-sm border-b sticky top-16 z-10 overflow-x-auto">
        <div className="flex p-2 min-w-max">
          {['dashboard', 'courses', 'users', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg font-bold capitalize mr-2 transition-colors ${activeTab === tab ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-bold uppercase">Total Users</h3>
              <p className="text-3xl font-bold text-brand mt-2">{users.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-bold uppercase">Active Courses</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{courses.length}</p>
            </div>
            <div className="col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-64">
              <h3 className="text-gray-800 font-bold mb-4">User Growth</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={users.map((u, i) => ({ name: `Day ${i+1}`, users: i+1 }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill={settings.uiColor || '#0284C7'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <h2 className="font-bold text-lg">Manage Courses</h2>
               <button 
                  onClick={() => {
                    const newCourse: Course = {
                      id: Date.now().toString(),
                      title: 'New Course',
                      description: 'Description...',
                      price: 0,
                      mrp: 1000,
                      image: 'https://via.placeholder.com/300',
                      category: 'General',
                      createdAt: new Date().toISOString(),
                      chapters: [],
                      isPaid: false
                    };
                    setEditingCourse(newCourse); // Just open modal, don't add yet
                  }}
                  className="bg-brand text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
               >
                 <Plus className="w-4 h-4" /> Add New
               </button>
            </div>
            {courses.map(course => (
              <div key={course.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <img src={course.image} className="w-12 h-12 rounded object-cover" />
                  <div>
                    <h3 className="font-bold text-sm">{course.title}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${course.isPaid ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {course.isPaid ? 'LOCKED' : 'FREE'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto justify-end">
                  <button onClick={() => setManagingContentCourse(course)} className="px-3 py-2 bg-blue-50 text-blue-600 font-bold text-xs rounded hover:bg-blue-100 flex items-center gap-1">
                     <PlayCircle className="w-4 h-4" /> Content
                  </button>
                  <button onClick={() => setManagingExamsCourse(course)} className="px-3 py-2 bg-purple-50 text-purple-600 font-bold text-xs rounded hover:bg-purple-100 flex items-center gap-1">
                     <ClipboardList className="w-4 h-4" /> Exams
                  </button>
                  <button onClick={() => setEditingCourse(course)} className="p-2 text-gray-500 hover:bg-gray-100 rounded">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => deleteCourse(course.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'users' && (
           <div className="space-y-6">
             {/* Create User/Manager Section */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
               <h3 className="font-bold text-gray-800 mb-3">Create New User / Manager</h3>
               <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                 <input className="p-2 border rounded" placeholder="Name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                 <input className="p-2 border rounded" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                 <input className="p-2 border rounded" placeholder="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                 <select className="p-2 border rounded bg-white" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                   <option value="USER">Student</option>
                   <option value="EDITOR">Manager/Editor</option>
                   <option value="ADMIN">Admin</option>
                 </select>
                 <button onClick={handleAddUser} className="bg-brand text-white font-bold rounded hover:bg-brand-dark">Create</button>
               </div>
             </div>

             <div className="space-y-3">
               <h3 className="font-bold text-gray-800">Existing Users</h3>
               {users.map(u => (
                 <div key={u.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                   <div>
                     <p className="font-bold">{u.name}</p>
                     <p className="text-xs text-gray-500">{u.email}</p>
                     <span className={`text-[10px] px-2 py-0.5 rounded ${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : u.role === 'EDITOR' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'}`}>
                        {u.role}
                     </span>
                   </div>
                   {u.role !== UserRole.ADMIN && (
                     <button onClick={() => deleteUser(u.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                       <Trash2 className="w-4 h-4" />
                     </button>
                   )}
                 </div>
               ))}
             </div>
           </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
            <div className="border-b pb-6">
               <h2 className="font-bold text-lg mb-4 text-brand">Branding</h2>
               <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Website Name</label>
                    <input type="text" className="w-full p-2 border rounded" value={localSettings.appName} onChange={e => setLocalSettings({...localSettings, appName: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">UI Color Theme</label>
                    <div className="flex gap-2">
                      <input type="color" className="h-10 w-20 p-1 border rounded" value={localSettings.uiColor || '#0284C7'} onChange={e => setLocalSettings({...localSettings, uiColor: e.target.value})} />
                      <div className="text-xs text-gray-400 flex items-center">Pick a brand color</div>
                    </div>
                 </div>
               </div>
            </div>
            
            <div className="border-b pb-6">
              <h2 className="font-bold text-lg mb-4 text-brand">App Banners</h2>
              <div className="mb-4">
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Upload New Banner</label>
                 <div className="flex gap-2">
                    <input type="file" accept="image/*" className="flex-1 text-sm text-gray-500" onChange={handleBannerUpload} />
                    <button 
                      onClick={() => {
                         if(newBannerImage) {
                           addBanner({ id: Date.now().toString(), image: newBannerImage, link: '#' });
                           setNewBannerImage('');
                           alert('Banner added!');
                         }
                      }}
                      className="bg-brand text-white px-4 py-2 rounded text-xs font-bold disabled:opacity-50"
                      disabled={!newBannerImage}
                    >
                      Add
                    </button>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 {banners.map(b => (
                    <div key={b.id} className="relative group">
                       <img src={b.image} className="w-full h-24 object-cover rounded-lg" />
                       <button onClick={() => deleteBanner(b.id)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                 ))}
              </div>
            </div>

            <div className="border-b pb-6">
               <h2 className="font-bold text-lg mb-4 text-brand">Admin Credentials</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Admin Email</label>
                    <input type="email" className="w-full p-2 border rounded" value={adminCreds.email} onChange={e => { setAdminCreds({...adminCreds, email: e.target.value}); setLocalSettings({...localSettings, adminEmail: e.target.value}); }} />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Admin Password</label>
                    <input type="text" className="w-full p-2 border rounded" value={adminCreds.password} onChange={e => setAdminCreds({...adminCreds, password: e.target.value})} />
                 </div>
               </div>
            </div>

            <div className="border-b pb-6">
               <h2 className="font-bold text-lg mb-4 text-brand">Integrations</h2>
               <div className="mt-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link Shortener API URL (Reel2Earn)</label>
                  <input type="text" className="w-full p-2 border rounded" value={localSettings.linkShortenerApiUrl || ''} onChange={e => setLocalSettings({...localSettings, linkShortenerApiUrl: e.target.value})} />
               </div>

               <div className="mt-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link Shortener API Key</label>
                  <input type="text" className="w-full p-2 border rounded" value={localSettings.linkShortenerApiKey || ''} onChange={e => setLocalSettings({...localSettings, linkShortenerApiKey: e.target.value})} />
               </div>

               <div className="mt-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ads Code (HTML/Script)</label>
                  <textarea className="w-full p-2 border rounded h-24 font-mono text-xs" value={localSettings.adsCode || ''} onChange={e => setLocalSettings({...localSettings, adsCode: e.target.value})} placeholder="<script>...</script>" />
               </div>
            </div>

            <button onClick={handleSaveSettings} className="w-full bg-brand text-white py-4 rounded-xl font-bold shadow-lg hover:bg-brand-dark transition-colors">Save All Changes</button>
          </div>
        )}
      </div>

      {/* Edit Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{courses.some(c => c.id === editingCourse.id) ? 'Edit Batch' : 'Create New Batch'}</h3>
            
            <div className="space-y-3">
              <input type="text" placeholder="Title" className="w-full p-3 border rounded-lg" value={editingCourse.title} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} />
              <textarea placeholder="Description" className="w-full p-3 border rounded-lg h-24" value={editingCourse.description} onChange={e => setEditingCourse({...editingCourse, description: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer" onClick={() => setEditingCourse({...editingCourse, isPaid: !editingCourse.isPaid})}>
                    <input type="checkbox" checked={editingCourse.isPaid || false} onChange={() => {}} className="w-5 h-5 text-brand" />
                    <span className="font-bold">Is Locked?</span>
                 </div>
                 <input type="text" placeholder="Access Key (Required)" className="w-full p-3 border rounded-lg font-bold uppercase" value={editingCourse.accessKey || ''} onChange={e => setEditingCourse({...editingCourse, accessKey: e.target.value.toUpperCase()})} />
              </div>

              {/* Shortener Link Section */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                 <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Shortener Link (For 24h Access)</label>
                 <input 
                   type="text" 
                   placeholder="e.g. https://gplinks.co/..." 
                   className="w-full p-2 border rounded text-sm mb-2" 
                   value={editingCourse.shortenerLink || ''} 
                   onChange={e => setEditingCourse({...editingCourse, shortenerLink: e.target.value})} 
                 />
                 <p className="text-[10px] text-gray-500">
                    <strong>Instructions:</strong> Create a link in your shortener that redirects to: <br/>
                    <code className="bg-gray-200 px-1 rounded select-all">{window.location.origin}/#/verify/{editingCourse.id || 'COURSE_ID'}</code>
                 </p>
              </div>

              {/* Image Upload for Course */}
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Thumbnail Image</label>
                 <div className="flex items-center gap-2 mb-2">
                    <img src={editingCourse.image || 'https://via.placeholder.com/100'} className="w-16 h-16 rounded object-cover border" />
                    <input type="file" accept="image/*" onChange={handleCourseImageUpload} className="text-sm text-gray-500" />
                 </div>
                 <input type="text" placeholder="Or enter Image URL" className="w-full p-3 border rounded-lg text-sm" value={editingCourse.image} onChange={e => setEditingCourse({...editingCourse, image: e.target.value})} />
              </div>
              
              <input type="text" placeholder="Category" className="w-full p-3 border rounded-lg" value={editingCourse.category} onChange={e => setEditingCourse({...editingCourse, category: e.target.value})} />
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingCourse(null)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleSaveCourse} className="flex-1 py-3 bg-brand text-white font-bold rounded-lg shadow-lg">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Manager Modal */}
      {managingExamsCourse && (
         <ExamManager 
            course={managingExamsCourse} 
            onClose={() => setManagingExamsCourse(null)} 
         />
      )}

      {/* Content Manager Modal */}
      {managingContentCourse && (
         <ContentManager
            course={managingContentCourse}
            onClose={() => setManagingContentCourse(null)}
         />
      )}
    </div>
  );
};

// ... Profile (same) ...
const Profile = () => {
   const { currentUser, updateUser, logout } = useStore();
   const [isEditing, setIsEditing] = useState(false);
   const [data, setData] = useState({ name: currentUser?.name || '', email: currentUser?.email || '', phone: currentUser?.phone || '' });

   if (!currentUser) return <Navigate to="/login" />;
   
   const handleSave = () => {
      updateUser(data);
      setIsEditing(false);
   };

   return (
      <div className="pb-24 pt-16 p-4 bg-gray-50 min-h-screen">
         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="h-24 bg-brand relative">
               <div className="absolute -bottom-10 left-6 w-20 h-20 rounded-full bg-white p-1 shadow-md">
                  <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold">
                     {currentUser.name.charAt(0).toUpperCase()}
                  </div>
               </div>
            </div>
            <div className="pt-12 pb-6 px-6">
               <div className="flex justify-between items-start">
                  <div>
                     <h2 className="text-xl font-bold">{currentUser.name}</h2>
                     <p className="text-gray-500 text-sm">{currentUser.email}</p>
                  </div>
                  <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="text-brand font-bold text-sm">
                     {isEditing ? 'Save' : 'Edit'}
                  </button>
               </div>
               
               {isEditing && (
                  <div className="mt-4 space-y-3">
                     <input className="w-full p-2 border rounded" value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="Name" />
                     <input className="w-full p-2 border rounded" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} placeholder="Phone" />
                  </div>
               )}
            </div>
         </div>
         
         <h3 className="font-bold text-lg mb-3">Exam Results</h3>
         <div className="space-y-3">
            {currentUser.examResults && currentUser.examResults.length > 0 ? currentUser.examResults.map((res, i) => (
               <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <div>
                     <p className="font-bold text-gray-800">Exam Score</p>
                     <p className="text-xs text-gray-500">{new Date(res.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-xl font-bold text-brand">{res.score}/{res.totalQuestions}</div>
               </div>
            )) : (
               <div className="text-center py-6 text-gray-400 bg-white rounded-xl border border-dashed">No exams taken yet</div>
            )}
         </div>

         <button onClick={logout} className="w-full mt-8 py-3 text-red-600 font-bold bg-white border border-red-100 rounded-xl hover:bg-red-50">
            Log Out
         </button>
      </div>
   );
};

const App = () => {
  return (
    <StoreProvider>
      <Router>
        <ThemeHandler />
        <AppRoutes />
      </Router>
    </StoreProvider>
  );
};

const AppRoutes = () => {
  const { currentUser } = useStore();
  const location = useLocation();
  const showNav = ['/', '/my-courses', '/profile', '/help'].includes(location.pathname);

  return (
    <>
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CourseListing />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/my-courses" element={<MyCourses />} />
        <Route path="/watch/:courseId" element={<Watch />} />
        <Route path="/exam/:id" element={<ExamMode course={{id:'demo', title:'Demo', description:'Demo', price:0, mrp:0, image:'', category:'', createdAt:'', chapters:[]}} /* Placeholder, loaded inside */ />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/reveal/:key" element={<RevealKey />} />
        <Route path="/verify/:courseId" element={<VerifyAccess />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <ChatBot />
      {showNav && <BottomNav />}
    </>
  );
};

export { App };