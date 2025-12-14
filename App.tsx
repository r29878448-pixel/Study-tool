import React, { useEffect, useState, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { 
  Home, BookOpen, User, HelpCircle, Menu, LogOut, 
  Search, PlayCircle, Lock, LayoutDashboard, Users, CreditCard, Settings, Plus, Trash2, Edit, Save, X, ChevronDown, ChevronUp,
  MessageCircle, CloudDownload, CheckCircle, Shield, Upload, FileText, Download, Youtube, Link as LinkIcon, Image as ImageIcon, Globe,
  ClipboardList, Timer, Code, DollarSign, Clock, Eye, Smartphone, MoreVertical, Key, Copy, ExternalLink, Play, Bot, Brain, Wand2, Loader2, List, ArrowLeft
} from './components/Icons';
import VideoPlayer from './components/VideoPlayer';
import ChatBot from './components/ChatBot';
import ExamMode from './components/ExamMode';
import { Course, Chapter, Video, UserRole, Note, Banner, AppSettings, Exam, Question, VideoProgress, AiGeneratedQuiz } from './types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { GoogleGenAI } from "@google/genai";

declare var process: { env: { API_KEY: string } };

// --- Helper Functions ---
const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const parseDuration = (duration: string) => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '00:00';
  const hours = (parseInt(match[1] || '0'));
  const minutes = (parseInt(match[2] || '0'));
  const seconds = (parseInt(match[3] || '0'));
  
  let str = '';
  if (hours > 0) {
    str += hours + ':' + minutes.toString().padStart(2, '0') + ':';
  } else {
    str += minutes + ':';
  }
  str += seconds.toString().padStart(2, '0');
  return str;
};

// --- Theme Handler ---
const ThemeHandler = () => {
  const { settings } = useStore();
  
  useEffect(() => {
    const root = document.documentElement;
    const hex = settings.uiColor || '#4F46E5';
    
    // Calculate Dark Variant
    if (!hex.startsWith('#') || hex.length < 7) return;

    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    
    // Darken by 10%
    const rDark = Math.floor(r * 0.9);
    const gDark = Math.floor(g * 0.9);
    const bDark = Math.floor(b * 0.9);
    
    // Light Variant (Tint)
    const rLight = Math.min(255, Math.floor(r + (255 - r) * 0.9));
    const gLight = Math.min(255, Math.floor(g + (255 - g) * 0.9));
    const bLight = Math.min(255, Math.floor(b + (255 - b) * 0.9));

    const hexDark = '#' + [rDark, gDark, bDark].map(c => c.toString(16).padStart(2, '0')).join('');
    const hexLight = '#' + [rLight, gLight, bLight].map(c => c.toString(16).padStart(2, '0')).join('');
    
    root.style.setProperty('--color-brand', hex);
    root.style.setProperty('--color-brand-dark', hexDark);
    root.style.setProperty('--color-brand-light', hexLight);
  }, [settings.uiColor]);

  return null;
};

// --- Components ---

const Logo = ({ dark = false }: { dark?: boolean }) => {
  const { settings } = useStore();
  return (
    <div className={`flex items-center gap-2.5 font-display font-bold text-xl tracking-tight ${dark ? 'text-gray-900' : 'text-white'}`}>
      <div className={`p-2 rounded-xl shadow-lg shadow-brand/20 ${dark ? 'bg-brand text-white' : 'bg-white text-brand'}`}>
        <BookOpen className="w-5 h-5" />
      </div>
      <span>{settings.appName || 'Study Portal'}</span>
    </div>
  );
};

const AdContainer = () => {
  const { settings } = useStore();
  if (!settings.adsCode) return null;
  return (
    <div className="w-full my-6 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col items-center justify-center min-h-[100px] text-center p-2 shadow-sm">
      <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-1 font-bold">Sponsored Advertisement</div>
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

  if (!timeLeft) return <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded-lg">Expired</span>;

  return (
    <div className="flex gap-1 items-center font-mono font-bold text-sm text-brand bg-brand-light px-3 py-1.5 rounded-xl border border-brand/10 shadow-sm">
      <Timer className="w-4 h-4 mr-1" />
      <div className="flex items-center gap-0.5">
        <span className="bg-white px-1.5 rounded text-gray-800 shadow-sm">{timeLeft.h.toString().padStart(2, '0')}</span>
        <span className="text-brand/50">:</span>
        <span className="bg-white px-1.5 rounded text-gray-800 shadow-sm">{timeLeft.m.toString().padStart(2, '0')}</span>
        <span className="text-brand/50">:</span>
        <span className="bg-white px-1.5 rounded text-gray-800 shadow-sm">{timeLeft.s.toString().padStart(2, '0')}</span>
      </div>
    </div>
  );
};

const Header = () => {
  const { settings, currentUser, logout } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <>
      <header className={`fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 text-gray-900' : 'bg-transparent text-gray-900'}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowMenu(true)} className={`p-2 rounded-xl transition-colors ${scrolled ? 'hover:bg-gray-100' : 'bg-white/50 hover:bg-white'}`}>
            <Menu className="w-6 h-6" />
          </button>
          <div className={!scrolled && location.pathname === '/' ? 'opacity-0' : 'opacity-100 transition-opacity'}>
             <Logo dark={true} />
          </div>
        </div>
        
        <Link to="/profile">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-purple-600 p-[2px] shadow-lg shadow-brand/20">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-brand font-bold overflow-hidden text-sm">
                {currentUser ? currentUser.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
            </div>
          </div>
        </Link>
      </header>

      {/* Sidebar Drawer */}
      {showMenu && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMenu(false)} />
          <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col animate-slide-in">
            <div className="h-48 bg-gradient-to-br from-brand to-purple-700 flex flex-col justify-end p-6 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10"></div>
               <div className="w-16 h-16 rounded-full bg-white text-brand flex items-center justify-center mb-4 text-2xl font-bold shadow-lg shadow-black/10">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User />}
               </div>
               <p className="font-bold truncate text-lg font-display">{currentUser?.name || 'Guest'}</p>
               <p className="text-sm opacity-80 truncate">{currentUser?.email || 'Please login'}</p>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              <Link to="/" onClick={() => setShowMenu(false)} className="flex items-center px-4 py-3.5 text-gray-700 hover:bg-gray-50 rounded-xl transition-all font-medium">
                <Home className="w-5 h-5 mr-3 text-brand" /> Home
              </Link>
              <Link to="/my-courses" onClick={() => setShowMenu(false)} className="flex items-center px-4 py-3.5 text-gray-700 hover:bg-gray-50 rounded-xl transition-all font-medium">
                <BookOpen className="w-5 h-5 mr-3 text-brand" /> My Batches
              </Link>
              <Link to="/profile" onClick={() => setShowMenu(false)} className="flex items-center px-4 py-3.5 text-gray-700 hover:bg-gray-50 rounded-xl transition-all font-medium">
                <User className="w-5 h-5 mr-3 text-brand" /> Profile
              </Link>
              <Link to="/help" onClick={() => setShowMenu(false)} className="flex items-center px-4 py-3.5 text-gray-700 hover:bg-gray-50 rounded-xl transition-all font-medium">
                <HelpCircle className="w-5 h-5 mr-3 text-brand" /> Help & Support
              </Link>
              {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.EDITOR) && (
                <Link to="/admin" onClick={() => setShowMenu(false)} className="flex items-center px-4 py-3.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold mt-4 transition-all">
                  <LayoutDashboard className="w-5 h-5 mr-3" /> {currentUser.role === UserRole.EDITOR ? 'Editor Panel' : 'Admin Panel'}
                </Link>
              )}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <button onClick={() => { logout(); setShowMenu(false); }} className="flex items-center justify-center text-red-600 w-full px-4 py-3 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm">
                <LogOut className="w-4 h-4 mr-2" /> Logout
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
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-t border-gray-200 flex items-center justify-around z-40 pb-safe shadow-lg">
      <Link to="/" className={`flex flex-col items-center transition-colors ${isActive('/')}`}>
        <Home className="w-6 h-6" />
        <span className="text-[10px] mt-1 font-bold">Home</span>
      </Link>
      <Link to="/my-courses" className={`flex flex-col items-center transition-colors ${isActive('/my-courses')}`}>
        <BookOpen className="w-6 h-6" />
        <span className="text-[10px] mt-1 font-bold">Batches</span>
      </Link>
      <Link to="/help" className={`flex flex-col items-center transition-colors ${isActive('/help')}`}>
        <HelpCircle className="w-6 h-6" />
        <span className="text-[10px] mt-1 font-bold">Help</span>
      </Link>
      <Link to="/profile" className={`flex flex-col items-center transition-colors ${isActive('/profile')}`}>
        <User className="w-6 h-6" />
        <span className="text-[10px] mt-1 font-bold">Profile</span>
      </Link>
    </div>
  );
};

// --- Pages ---

const Help = () => {
    const { settings } = useStore();
    const botUsername = settings.supportPhone.startsWith('@') ? settings.supportPhone.substring(1) : 'STUDY_PORTAL_ROBOT';
    
    return (
        <div className="pt-24 px-6 pb-20 min-h-screen bg-gray-50 flex flex-col items-center justify-center">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center w-full max-w-md animate-fade-in">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Bot className="w-10 h-10 text-brand" />
                </div>
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Need Help?</h2>
                <p className="text-gray-500 mb-8 text-sm">
                    Facing issues with access, payments, or just want to report a bug? Contact our AI Support Bot or Admin directly on Telegram.
                </p>
                <a 
                    href={`https://t.me/${botUsername}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-[#229ED9] text-white rounded-2xl font-bold shadow-lg shadow-blue-400/30 flex items-center justify-center gap-2 hover:bg-[#1A87B9] transition-all transform hover:scale-[1.02]"
                >
                    <MessageCircle className="w-5 h-5" /> Chat on Telegram
                </a>
            </div>
        </div>
    );
};

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const { login, signup, currentUser, settings } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      // Check local storage instead of session storage for better persistence
      const pendingCourse = localStorage.getItem('pendingCourseVerification');
      if (pendingCourse) {
         navigate(`/verify/${pendingCourse}`);
         return;
      }
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="mb-10 scale-150 z-10">
         <Logo dark={true} />
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-glow w-full max-w-sm overflow-hidden z-10 border border-white/50">
        <div className="flex p-2 bg-gray-100/50 m-2 rounded-2xl">
          <button 
            className={`flex-1 py-3 text-center font-bold text-sm rounded-xl transition-all ${!isSignup ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setIsSignup(false)}
          >
            LOGIN
          </button>
          <button 
            className={`flex-1 py-3 text-center font-bold text-sm rounded-xl transition-all ${isSignup ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setIsSignup(true)}
          >
            SIGNUP
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-display font-bold text-gray-900">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {isSignup ? `Start learning with ${settings.appName}` : 'Continue your progress'}
            </p>
          </div>
          
          {isSignup && (
            <>
              <input 
                type="text" placeholder="Full Name" required 
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand focus:bg-white transition-all text-gray-900 font-medium placeholder:text-gray-500"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              />
              <input 
                type="tel" placeholder="Phone Number" required 
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand focus:bg-white transition-all text-gray-900 font-medium placeholder:text-gray-500"
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </>
          )}
          
          <input 
            type="text" placeholder="Email Address" required 
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand focus:bg-white transition-all text-gray-900 font-medium placeholder:text-gray-500"
            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
          />
          <input 
            type="password" placeholder="Password" required 
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand focus:bg-white transition-all text-gray-900 font-medium placeholder:text-gray-500"
            value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
          />
          
          <button className="w-full bg-gradient-to-r from-brand to-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-brand/30 active:scale-[0.98] transition-all hover:shadow-brand/40">
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
                className="text-[10px] text-gray-400 hover:text-red-500 transition-colors font-medium"
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
  const { banners, courses, currentUser } = useStore();
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
    <div className="pb-24 pt-20">
      {/* Search Bar */}
      <div className="px-4 mb-6">
        <div className="relative">
            <h1 className="text-2xl font-display font-bold text-gray-900 mb-4">Hello, {currentUser?.name.split(' ')[0] || 'Student'} 👋</h1>
            <input 
                type="text" 
                placeholder="What do you want to learn today?" 
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all text-gray-900 placeholder:text-gray-500 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-4 bottom-4" />
        </div>
      </div>

      {/* Banners */}
      {banners.length > 0 ? (
        <div className="px-4">
            <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-lg">
            {banners.map((b, i) => (
                <img 
                key={b.id} 
                src={b.image} 
                alt="Banner" 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === activeBanner ? 'opacity-100' : 'opacity-0'}`}
                />
            ))}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 p-1 bg-black/20 backdrop-blur-sm rounded-full">
                {banners.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === activeBanner ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
                ))}
            </div>
            </div>
        </div>
      ) : null}
      
      <div className="px-4">
         <AdContainer />
      </div>

      {/* Popular Batches */}
      <div className="mt-4 pl-4">
        <div className="flex justify-between items-center mb-4 pr-4">
          <h2 className="text-lg font-display font-bold text-gray-900">Popular Batches</h2>
          <Link to="/courses" className="text-brand text-xs font-bold bg-brand-light px-3 py-1.5 rounded-full hover:bg-brand/10 transition-colors">View All</Link>
        </div>
        
        <div className="flex overflow-x-auto space-x-4 pb-8 pr-4 no-scrollbar">
          {courses.slice(0, 5).map(course => (
            <Link to={`/course/${course.id}`} key={course.id} className="flex-none w-72 bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div className="relative h-40 overflow-hidden">
                <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-3 left-3 text-white">
                     <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20 uppercase tracking-wide">{course.category}</span>
                </div>
                {course.isPaid && (
                   <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                     <Lock className="w-3 h-3" /> PREMIUM
                   </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-900 line-clamp-1 mb-1 text-lg font-display">{course.title}</h3>
                <p className="text-gray-500 text-xs line-clamp-1 mb-4">{course.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Access</span>
                    <span className={`font-bold text-base ${course.isPaid ? 'text-gray-900' : 'text-green-600'}`}>
                      {course.isPaid ? 'Key Locked' : 'Free'}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/30 group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-5 h-5" />
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
    <div className="pb-24 pt-24 p-4 min-h-screen bg-gray-50">
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
         {categories.map(cat => (
             <button 
                key={cat} 
                onClick={() => setFilter(cat)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${filter === cat ? 'bg-brand text-white shadow-brand/30' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
             >
                {cat}
             </button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <Search className="w-8 h-8"/>
              </div>
              <p className="text-gray-500 font-medium">No batches found for this category.</p>
          </div>
        ) : filtered.map(course => (
          <Link to={`/course/${course.id}`} key={course.id} className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden flex flex-col group hover:-translate-y-1 transition-all duration-300">
            <div className="relative h-48 overflow-hidden">
                 <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                 <div className="absolute bottom-3 left-3">
                    <span className="bg-white/90 backdrop-blur text-brand-dark text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">{course.category}</span>
                 </div>
                 {course.isPaid && <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-[10px] px-2 py-1 rounded-lg font-bold shadow-sm flex items-center gap-1"><Lock className="w-3 h-3"/> LOCKED</div>}
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-display font-bold text-gray-900 text-xl leading-tight mb-2 flex-1">{course.title}</h3>
              <p className="text-gray-500 text-sm line-clamp-2 mb-4">{course.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex flex-col">
                   <span className="text-[10px] text-gray-400 font-bold uppercase">Status</span>
                   <span className={`font-bold ${course.isPaid ? 'text-gray-900' : 'text-green-600'}`}>
                    {course.isPaid ? 'Key Required' : 'Free Access'}
                   </span>
                </div>
                <button className="bg-gray-900 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-brand transition-colors shadow-lg group-hover:shadow-xl">
                    View Batch
                </button>
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
  const { courses, enrollCourse, currentUser } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    const course = courses.find(c => c.accessKey === key);
    if (course) {
      enrollCourse(course.id);
      alert(`Access Granted: ${course.title}`);
      navigate(`/course/${course.id}`);
    } else {
      alert('Invalid Key');
      navigate('/');
    }
  }, [key, courses, currentUser, navigate, enrollCourse]);

  return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand w-10 h-10" /></div>;
};

const VerifyAccess = () => {
  const { courseId } = useParams();
  const { currentUser, grantTempAccess, courses } = useStore();
  const navigate = useNavigate();
  const course = courses.find(c => c.id === courseId);
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    if (!currentUser) { 
        // Use LocalStorage instead of SessionStorage to persist across tab/browser restarts (important for mobile redirects)
        localStorage.setItem('pendingCourseVerification', courseId || '');
        navigate('/login'); 
        return; 
    }
    
    if (courseId) {
        setStatus('verifying');
        // Simple delay to show the animation and allow state to settle
        const timer = setTimeout(() => {
            try {
                grantTempAccess(courseId);
                // Clear the pending flag
                localStorage.removeItem('pendingCourseVerification');
                setStatus('success');
                setTimeout(() => navigate(`/course/${courseId}`), 1500);
            } catch (e) {
                console.error("Verification error", e);
                setStatus('error');
            }
        }, 2000);
        return () => clearTimeout(timer);
    }
  }, [courseId, currentUser, navigate, grantTempAccess]);

  const handleManualVerify = () => {
      if(courseId) {
          grantTempAccess(courseId);
          localStorage.removeItem('pendingCourseVerification');
          navigate(`/course/${courseId}`);
      }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full animate-fade-in">
            {status === 'verifying' && (
                <>
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Access</h2>
                    <p className="text-gray-500 text-sm">Please wait while we unlock {course?.title || 'Batch'}...</p>
                    <div className="mt-6 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 animate-[width_2s_ease-out_forwards] w-full" style={{width: '0%'}}></div>
                    </div>
                    
                    {/* Fallback button for stuck redirects */}
                    <button 
                        onClick={handleManualVerify}
                        className="mt-6 text-xs text-blue-600 font-bold underline hover:text-blue-800"
                    >
                        Stuck? Click here to continue
                    </button>
                </>
            )}
            
            {status === 'success' && (
                <>
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Access Granted!</h2>
                    <p className="text-gray-500 text-sm">Redirecting to your course...</p>
                </>
            )}
        </div>
    </div>
  );
};

const ExamManager = ({ course, onClose }: { course: Course; onClose: () => void }) => {
    // ... (Existing ExamManager code unchanged)
    const { updateCourse } = useStore();
    const [exams, setExams] = useState<Exam[]>(course.exams || []);
    const [editingExamId, setEditingExamId] = useState<string | null>(null);

    const handleSave = () => {
        updateCourse({ ...course, exams });
        onClose();
    };

    const addExam = () => {
        const newExam: Exam = { id: Date.now().toString(), title: "New Exam", questions: [] };
        setExams([...exams, newExam]);
        setEditingExamId(newExam.id);
    };

    const updateExamTitle = (id: string, title: string) => {
        setExams(exams.map(e => e.id === id ? { ...e, title } : e));
    };
    
    const deleteExam = (id: string) => {
        setExams(exams.filter(e => e.id !== id));
    };

    const activeExam = exams.find(e => e.id === editingExamId);

    const addQuestion = (examId: string) => {
        const q: Question = { id: Date.now().toString(), question: "New Question", options: ["Option A", "Option B", "Option C", "Option D"], correctAnswer: 0 };
        setExams(exams.map(e => e.id === examId ? { ...e, questions: [...e.questions, q] } : e));
    };

    const updateQuestion = (examId: string, qIndex: number, field: string, val: any) => {
         setExams(exams.map(e => {
             if(e.id !== examId) return e;
             const qs = [...e.questions];
             qs[qIndex] = { ...qs[qIndex], [field]: val };
             return { ...e, questions: qs };
         }));
    };

    const updateOption = (examId: string, qIndex: number, optIndex: number, val: string) => {
         setExams(exams.map(e => {
             if(e.id !== examId) return e;
             const qs = [...e.questions];
             const opts = [...qs[qIndex].options];
             opts[optIndex] = val;
             qs[qIndex] = { ...qs[qIndex], options: opts };
             return { ...e, questions: qs };
         }));
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold font-display text-gray-900">Manage Exams: {course.title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6"/></button>
                </div>
                
                <div className="flex-1 flex gap-6 overflow-hidden">
                    <div className="w-1/3 border-r border-gray-100 pr-4 overflow-y-auto">
                        <button onClick={addExam} className="w-full py-3 mb-4 bg-brand text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand/20"><Plus className="w-4 h-4"/> New Exam</button>
                        <div className="space-y-2">
                            {exams.map(exam => (
                                <div key={exam.id} onClick={() => setEditingExamId(exam.id)} className={`p-4 rounded-xl cursor-pointer border transition-all ${editingExamId === exam.id ? 'bg-indigo-50 border-brand' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}>
                                    <input value={exam.title} onChange={(e) => updateExamTitle(exam.id, e.target.value)} className="bg-transparent font-bold text-gray-900 w-full focus:outline-none" onClick={e => e.stopPropagation()} />
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-gray-500">{exam.questions.length} Questions</span>
                                        <button onClick={(e) => { e.stopPropagation(); deleteExam(exam.id); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto pl-2">
                        {activeExam ? (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-gray-900">Questions for {activeExam.title}</h3>
                                    <button onClick={() => addQuestion(activeExam.id)} className="text-brand text-sm font-bold bg-brand-light px-3 py-1.5 rounded-lg">+ Add Question</button>
                                </div>
                                {activeExam.questions.map((q, qIdx) => (
                                    <div key={q.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex gap-2 mb-2">
                                            <span className="font-bold text-gray-400">Q{qIdx+1}</span>
                                            <input className="flex-1 bg-white border border-gray-200 p-2 rounded-lg text-sm font-medium text-gray-900" value={q.question} onChange={e => updateQuestion(activeExam.id, qIdx, 'question', e.target.value)} placeholder="Question Text" />
                                            <button onClick={() => {
                                                const qs = [...activeExam.questions]; qs.splice(qIdx, 1);
                                                setExams(exams.map(e => e.id === activeExam.id ? { ...e, questions: qs } : e));
                                            }} className="text-red-400 p-2"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pl-6">
                                            {q.options.map((opt, oIdx) => (
                                                <div key={oIdx} className="flex items-center gap-2">
                                                    <input type="radio" checked={q.correctAnswer === oIdx} onChange={() => updateQuestion(activeExam.id, qIdx, 'correctAnswer', oIdx)} name={`q-${q.id}`} className="text-brand focus:ring-brand" />
                                                    <input className="flex-1 bg-white border border-gray-200 p-2 rounded-lg text-xs text-gray-900" value={opt} onChange={e => updateOption(activeExam.id, qIdx, oIdx, e.target.value)} placeholder={`Option ${oIdx+1}`} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">Select an exam to edit</div>
                        )}
                    </div>
                </div>
                <div className="mt-6 pt-4 border-t flex justify-end">
                    <button onClick={handleSave} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors shadow-lg">Save All Changes</button>
                </div>
            </div>
        </div>
    );
};

const Watch = () => {
    const { courseId } = useParams();
    const { courses, currentUser, saveAiQuiz, saveVideoProgress } = useStore();
    const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
    const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
    const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizScore, setQuizScore] = useState<number | null>(null);
    const [userAnswers, setUserAnswers] = useState<number[]>([]);
    const navigate = useNavigate();

    const course = courses.find(c => c.id === courseId);
    
    useEffect(() => {
        if(course?.chapters[0]?.videos[0]) {
            setCurrentVideoUrl(course.chapters[0].videos[0].filename);
            setCurrentVideo(course.chapters[0].videos[0]);
        }
    }, [course]);

    const generateAiQuiz = async () => {
        if (!currentVideo) return;
        setQuizLoading(true);
        setShowQuiz(true);
        setQuizScore(null);
        setUserAnswers([]);

        // Check if quiz already exists
        const existingQuiz = currentUser?.generatedQuizzes?.find(q => q.videoId === currentVideo.id);
        if (existingQuiz) {
            setQuizQuestions(existingQuiz.questions);
            setQuizLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Create 5 multiple choice questions based on the topic "${currentVideo.title}" from the course "${course?.title}". 
            Format strictly as a JSON array of objects with keys: "id", "question", "options" (array of 4 strings), "correctAnswer" (number index 0-3).`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });

            const text = response.text;
            if (text) {
                const data = JSON.parse(text);
                setQuizQuestions(data);
                // Save to store
                saveAiQuiz({
                    videoId: currentVideo.id,
                    questions: data,
                    generatedAt: new Date().toISOString()
                });
            }
        } catch (e) {
            console.error(e);
            alert("Failed to generate AI quiz. Please try again.");
            setShowQuiz(false);
        } finally {
            setQuizLoading(false);
        }
    };

    const submitQuiz = () => {
        let score = 0;
        quizQuestions.forEach((q, i) => {
            if (userAnswers[i] === q.correctAnswer) score++;
        });
        setQuizScore(score);
    };

    if (!course) return <Navigate to="/" />;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
            <div className="flex-1 flex flex-col relative">
                <div className="w-full aspect-video bg-black">
                     {currentVideoUrl ? (
                        <VideoPlayer 
                            src={currentVideoUrl} 
                            onBack={() => navigate(`/course/${courseId}`)}
                            initialTime={currentUser?.videoProgress?.[currentVideo?.id || '']?.timestamp || 0}
                            onProgress={(time, duration) => {
                                if(currentVideo) saveVideoProgress(currentVideo.id, time, duration);
                            }}
                        />
                     ) : (
                        <div className="h-full flex items-center justify-center">Select a video</div>
                     )}
                </div>
                <div className="p-4 flex justify-between items-center bg-gray-900 border-b border-gray-800">
                    <div>
                        <h1 className="text-xl font-bold">{currentVideo?.title || course.title}</h1>
                        <p className="text-sm text-gray-400">{course.title}</p>
                    </div>
                    {currentVideo && (
                        <button 
                            onClick={generateAiQuiz}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                        >
                            <Brain className="w-4 h-4" /> Take AI Quiz
                        </button>
                    )}
                </div>

                {/* AI Quiz Modal Overlay */}
                {showQuiz && (
                    <div className="absolute inset-0 z-50 bg-gray-900/95 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="max-w-2xl mx-auto bg-gray-800 rounded-3xl p-6 border border-gray-700">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Brain className="text-indigo-400"/> 
                                    Quiz: {currentVideo?.title}
                                </h2>
                                <button onClick={() => setShowQuiz(false)} className="p-2 hover:bg-gray-700 rounded-full">
                                    <X className="w-5 h-5"/>
                                </button>
                            </div>

                            {quizLoading ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center">
                                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4"/>
                                    <p className="text-gray-400">Generating questions with AI...</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {quizQuestions.map((q, idx) => {
                                        const isAnswered = userAnswers[idx] !== undefined;
                                        const isCorrect = userAnswers[idx] === q.correctAnswer;
                                        const showResult = quizScore !== null;

                                        return (
                                            <div key={idx} className="bg-gray-700/50 p-4 rounded-xl border border-gray-700">
                                                <p className="font-bold mb-3">{idx + 1}. {q.question}</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {q.options.map((opt, oIdx) => {
                                                        let btnClass = "bg-gray-800 border-gray-600 hover:bg-gray-700";
                                                        if (showResult) {
                                                            if (oIdx === q.correctAnswer) btnClass = "bg-green-900/50 border-green-500 text-green-200";
                                                            else if (userAnswers[idx] === oIdx) btnClass = "bg-red-900/50 border-red-500 text-red-200";
                                                            else btnClass = "bg-gray-800 border-gray-700 opacity-50";
                                                        } else if (userAnswers[idx] === oIdx) {
                                                            btnClass = "bg-indigo-600 border-indigo-500";
                                                        }

                                                        return (
                                                            <button 
                                                                key={oIdx}
                                                                disabled={showResult}
                                                                onClick={() => {
                                                                    const newAns = [...userAnswers];
                                                                    newAns[idx] = oIdx;
                                                                    setUserAnswers(newAns);
                                                                }}
                                                                className={`p-3 rounded-lg border text-left text-sm font-medium transition-all ${btnClass}`}
                                                            >
                                                                {opt}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {quizScore === null ? (
                                        <button 
                                            onClick={submitQuiz}
                                            disabled={userAnswers.filter(a => a !== undefined).length !== quizQuestions.length}
                                            className="w-full py-3 bg-indigo-600 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                                        >
                                            Submit Quiz
                                        </button>
                                    ) : (
                                        <div className="text-center p-6 bg-gray-800 rounded-xl border border-gray-700">
                                            <p className="text-gray-400 text-sm uppercase font-bold mb-1">Your Score</p>
                                            <p className="text-4xl font-bold text-white mb-4">{quizScore} / {quizQuestions.length}</p>
                                            <button onClick={() => setShowQuiz(false)} className="px-6 py-2 bg-gray-700 rounded-lg font-bold hover:bg-gray-600">Close</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="w-full md:w-80 bg-gray-900 overflow-y-auto h-[50vh] md:h-screen border-l border-gray-800">
                <div className="p-4 font-bold border-b border-gray-800 bg-gray-900 sticky top-0 z-10">Course Content</div>
                {course.chapters.map(chap => (
                    <div key={chap.id}>
                        <div className="bg-gray-800/50 px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-14">{chap.title}</div>
                        {chap.videos.map(v => (
                            <button key={v.id} onClick={() => { setCurrentVideoUrl(v.filename); setCurrentVideo(v); }} className={`w-full text-left px-4 py-3 hover:bg-gray-800 flex gap-3 items-center border-b border-gray-800/50 transition-colors ${currentVideoUrl === v.filename ? 'bg-gray-800 text-indigo-400 border-l-4 border-l-indigo-500' : 'text-gray-300'}`}>
                                <PlayCircle className={`w-4 h-4 flex-none ${currentVideoUrl === v.filename ? 'fill-current' : ''}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{v.title}</p>
                                    <p className="text-[10px] text-gray-500">{v.duration}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

const CourseDetail = () => {
    const { id } = useParams();
    const { courses, currentUser, enrollCourse, settings, grantTempAccess } = useStore();
    const navigate = useNavigate();
    const course = courses.find(c => c.id === id);
    const [keyInput, setKeyInput] = useState('');
    
    // Constant for the storage key
    const PENDING_ACCESS_KEY = `pending_access_${id}`;

    if (!course) return <Navigate to="/" />;
    
    const hasAccess = currentUser?.purchasedCourseIds.includes(course.id) || 
                      (currentUser?.tempAccess?.[course.id] && new Date(currentUser.tempAccess[course.id]) > new Date());
    
    const handleKeyUnlock = () => {
        if (!currentUser) { navigate('/login'); return; }
        if (keyInput.trim().toUpperCase() === course.accessKey) {
            enrollCourse(course.id);
            alert("Success! Permanent access granted.");
        } else {
            alert("Invalid Key. Please check and try again.");
        }
    };

    const handleTempAccess = () => {
        if (!currentUser) { navigate('/login'); return; }
        
        // 1. Mark that the user attempted access with current timestamp
        localStorage.setItem(PENDING_ACCESS_KEY, Date.now().toString());

        // 2. Open Link
        if (course.shortenerLink) {
            window.open(course.shortenerLink, '_blank');
        } else {
            alert("Temporary access link not configured for this batch.");
        }
    };

    // 3. Fallback: Automatically grant access if user returns after >10 seconds
    // Using setInterval to aggressively check if time has passed, ensuring it works even if visibility change event is missed
    useEffect(() => {
        const interval = setInterval(() => {
            const pending = localStorage.getItem(PENDING_ACCESS_KEY);
            if (pending) {
                const elapsed = Date.now() - parseInt(pending);
                // If more than 10 seconds have passed since they clicked the link
                if (elapsed > 10000) { 
                    grantTempAccess(course.id);
                    localStorage.removeItem(PENDING_ACCESS_KEY);
                    clearInterval(interval);
                    alert("Verification successful! Temporary access granted.");
                }
            }
        }, 1000); // Check every second

        return () => clearInterval(interval);
    }, [course.id, grantTempAccess, PENDING_ACCESS_KEY]);

    const getContactLink = () => {
        const contact = settings.supportPhone || '';
        if (contact.startsWith('@')) {
            return `https://t.me/${contact.substring(1)}`;
        }
        return `https://wa.me/${contact.replace(/[^0-9]/g, '')}?text=I want to buy key for ${course.title}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="relative h-64 md:h-80">
                <img src={course.image} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 text-white">
                    <span className="bg-brand text-xs font-bold px-2 py-1 rounded mb-2 inline-block">{course.category}</span>
                    <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
                    <p className="opacity-90 max-w-xl text-sm">{course.description}</p>
                </div>
            </div>
            <div className="p-4 max-w-4xl mx-auto -mt-8 relative z-10">
                <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
                     <div className="flex justify-between items-center mb-6">
                         <div>
                             <p className="text-sm text-gray-500">Price</p>
                             <div className="text-2xl font-bold text-gray-900">{course.price === 0 ? 'FREE' : `₹${course.price}`} <span className="text-sm text-gray-400 line-through font-normal">₹{course.mrp}</span></div>
                         </div>
                         {hasAccess && (
                            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" /> Enrolled
                            </div>
                         )}
                     </div>

                     {!hasAccess && (
                        <div className="space-y-4">
                            {/* Temporary Access Section */}
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500"/> Temporary Access</h3>
                                <p className="text-xs text-gray-500 mb-3">Get 24 hours of free access by visiting a sponsor link.</p>
                                <button 
                                    onClick={handleTempAccess}
                                    className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    Get Free Access (24h)
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="h-px bg-gray-200 flex-1"></div>
                                <span className="text-xs text-gray-400 font-bold uppercase">OR</span>
                                <div className="h-px bg-gray-200 flex-1"></div>
                            </div>

                            {/* Permanent Access Section */}
                            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                                <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><Key className="w-4 h-4 text-indigo-600"/> Permanent Access</h3>
                                <div className="flex gap-2 mb-3">
                                    <input 
                                        type="text" 
                                        placeholder="Enter Premium Key" 
                                        className="flex-1 p-3 rounded-xl border border-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono text-gray-900"
                                        value={keyInput}
                                        onChange={(e) => setKeyInput(e.target.value)}
                                    />
                                    <button 
                                        onClick={handleKeyUnlock}
                                        className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                    >
                                        Unlock
                                    </button>
                                </div>
                                <a 
                                    href={getContactLink()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                                >
                                    Don't have a key? Buy from Admin <ExternalLink className="w-3 h-3"/>
                                </a>
                            </div>
                        </div>
                     )}
                </div>
                
                {/* Telegram Channel Link - Visible to all */}
                {course.telegramChannelLink && (
                    <a 
                        href={course.telegramChannelLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-4 mb-6 bg-blue-50 text-blue-600 font-bold rounded-2xl border border-blue-100 flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors shadow-sm"
                    >
                        <MessageCircle className="w-5 h-5" /> Join Batch Telegram Channel
                    </a>
                )}

                {hasAccess && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                         <Link to={`/watch/${course.id}`} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center flex-col gap-2 hover:border-brand transition-colors">
                            <PlayCircle className="w-8 h-8 text-brand" />
                            <span className="font-bold text-gray-800">Start Watching</span>
                         </Link>
                         <Link to={`/exam/${course.id}`} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center flex-col gap-2 hover:border-brand transition-colors">
                            <ClipboardList className="w-8 h-8 text-purple-600" />
                            <span className="font-bold text-gray-800">Take Exam</span>
                         </Link>
                    </div>
                )}

                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-gray-900">Course Content</h3>
                    {course.chapters.map((chap, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                             <div className="p-4 bg-gray-50 font-bold text-gray-800 flex justify-between items-center">
                                 <span>{chap.title}</span>
                                 <span className="text-xs text-gray-500">{chap.videos.length} Videos</span>
                             </div>
                             {hasAccess ? (
                                <div className="divide-y divide-gray-100">
                                    {chap.videos.map((vid, j) => (
                                        <Link 
                                            to={`/watch/${course.id}`} 
                                            key={j} 
                                            className="p-4 flex gap-3 items-center hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            <PlayCircle className="w-5 h-5 text-gray-400" />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-gray-800">{vid.title}</p>
                                                <p className="text-xs text-gray-400">{vid.duration}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                             ) : (
                                <div className="p-6 text-center text-gray-400 text-sm flex flex-col items-center">
                                    <Lock className="w-6 h-6 mb-2 opacity-50" />
                                    <span>Content Locked</span>
                                </div>
                             )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

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
      <div className="pb-24 pt-20 p-6 bg-gray-50 min-h-screen">
         <div className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden mb-6 relative">
            <div className="h-32 bg-gradient-to-r from-brand to-indigo-600"></div>
            <div className="px-8 pb-8">
                <div className="flex justify-between items-end -mt-12 mb-4">
                    <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-lg">
                        <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-brand text-3xl font-display font-bold">
                            {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="text-brand font-bold text-sm bg-brand-light px-4 py-2 rounded-xl hover:bg-brand/10 transition-colors">
                        {isEditing ? 'Save Details' : 'Edit Profile'}
                    </button>
                </div>
               
               {!isEditing ? (
                   <div>
                        <h2 className="text-2xl font-display font-bold text-gray-900">{currentUser.name}</h2>
                        <p className="text-gray-500 font-medium">{currentUser.email}</p>
                        <p className="text-gray-400 text-sm mt-1">{currentUser.phone}</p>
                   </div>
               ) : (
                  <div className="space-y-4 mt-2">
                     <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-500" value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="Name" />
                     <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-500" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} placeholder="Phone" />
                  </div>
               )}
            </div>
         </div>
         
         <h3 className="font-display font-bold text-xl mb-4 text-gray-900">Exam Results</h3>
         <div className="space-y-4">
            {currentUser.examResults && currentUser.examResults.length > 0 ? currentUser.examResults.map((res, i) => (
               <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <div>
                     <p className="font-bold text-gray-900">Exam Score</p>
                     <p className="text-xs text-gray-500 font-medium">{new Date(res.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-2xl font-display font-bold text-brand">{res.score}<span className="text-gray-400 text-base">/{res.totalQuestions}</span></div>
               </div>
            )) : (
               <div className="text-center py-10 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                   <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
                   <p>No exams taken yet</p>
               </div>
            )}
         </div>

         <button onClick={logout} className="w-full mt-8 py-4 text-red-600 font-bold bg-white border-2 border-red-50 rounded-2xl hover:bg-red-50 transition-colors shadow-sm flex items-center justify-center gap-2">
            <LogOut className="w-5 h-5" /> Logout
         </button>
      </div>
   );
};

const MyCourses = () => {
  const { currentUser, courses } = useStore();
  
  if (!currentUser) return <Navigate to="/login" />;

  const myCourses = courses.filter(c => 
    currentUser.purchasedCourseIds.includes(c.id) || 
    (currentUser.tempAccess?.[c.id] && new Date(currentUser.tempAccess[c.id]) > new Date())
  );

  return (
    <div className="pb-24 pt-24 p-6 min-h-screen bg-gray-50">
      <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">My Batches</h2>
      {myCourses.length === 0 ? (
         <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
             <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4"/>
             <p className="text-gray-500 font-medium">You haven't enrolled in any batches yet.</p>
             <Link to="/courses" className="mt-4 inline-block text-brand font-bold hover:underline">Browse Batches</Link>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {myCourses.map(course => {
               const isTemp = !currentUser.purchasedCourseIds.includes(course.id) && currentUser.tempAccess?.[course.id];
               const expiry = isTemp ? currentUser.tempAccess?.[course.id] : null;

               return (
               <Link to={`/course/${course.id}`} key={course.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex gap-4 hover:border-brand transition-colors group relative overflow-hidden">
                  <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden flex-none">
                     <img src={course.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{course.category}</span>
                     <h3 className="font-bold text-gray-900 leading-tight mb-2">{course.title}</h3>
                     <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded w-fit">
                            <CheckCircle className="w-3 h-3" /> Active
                        </div>
                        {expiry && (
                            <div className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded">
                                Exp: {new Date(expiry).toLocaleDateString()}
                            </div>
                        )}
                     </div>
                  </div>
               </Link>
            )})}
         </div>
      )}
    </div>
  );
};

const AdminPanel = () => {
    const { currentUser, courses, users, banners, settings, addCourse, updateCourse, deleteCourse, addBanner, deleteBanner, updateSettings, addUser, deleteUser } = useStore();
    const [tab, setTab] = useState<'courses' | 'users' | 'banners' | 'settings'>('courses');
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [showExamManager, setShowExamManager] = useState<Course | null>(null);
    
    // User Management State
    const [showUserModal, setShowUserModal] = useState(false);
    
    // Link Generation State
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const linkInputRef = useRef<HTMLInputElement>(null);
    
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.EDITOR)) return <Navigate to="/" />;

    const handleSaveCourse = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const courseData: any = {
            id: editingCourse?.id || Date.now().toString(),
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            image: formData.get('image') as string,
            category: formData.get('category') as string,
            price: Number(formData.get('price')),
            mrp: Number(formData.get('mrp')),
            isPaid: formData.get('isPaid') === 'on',
            accessKey: formData.get('accessKey') as string,
            telegramChannelLink: formData.get('telegramChannelLink') as string,
            shortenerLink: formData.get('shortenerLink') as string,
            chapters: editingCourse?.chapters || [],
            exams: editingCourse?.exams || [],
            createdAt: editingCourse?.createdAt || new Date().toISOString()
        };

        if (editingCourse) updateCourse(courseData);
        else addCourse(courseData);
        
        setShowCourseModal(false);
        setEditingCourse(null);
    };

    const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        addUser({
            id: Date.now().toString(),
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            phone: formData.get('phone') as string,
            role: formData.get('role') as UserRole,
            purchasedCourseIds: [],
            examResults: []
        });
        setShowUserModal(false);
    };

    const handleGenerateLink = async () => {
        if(!settings.linkShortenerApiKey || !settings.linkShortenerApiUrl) {
            alert("Please configure Link Shortener in Settings first!");
            return;
        }

        const courseId = editingCourse?.id;
        if(!courseId) {
             alert("Please save the batch first, then edit it to generate a link.");
             return;
        }

        setIsGeneratingLink(true);
        try {
            // Robust URL Construction
            let baseUrl = settings.linkShortenerApiUrl.trim();
            // Remove trailing slash if present to avoid //
            if(baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

            const destinationUrl = `${window.location.origin}/#/verify/${courseId}`;
            const encodedDest = encodeURIComponent(destinationUrl);
            
            // Determine correct separator
            const separator = baseUrl.includes('?') ? '&' : '?';
            
            // Build final URL: baseUrl?api=KEY&url=DEST
            const fetchUrl = `${baseUrl}${separator}api=${settings.linkShortenerApiKey}&url=${encodedDest}`;
            
            // Try fetching
            const response = await fetch(fetchUrl);
            const data = await response.json();
            
            if(data.status === 'success' || data.shortenedUrl || data.shortlink) {
                const shortUrl = data.shortenedUrl || data.shortlink || data.url;
                if(linkInputRef.current) {
                    linkInputRef.current.value = shortUrl;
                }
            } else {
                console.error("API Error Data:", data);
                // JSON.stringify the error so the user sees exactly what the API returned
                alert(`Failed to generate link. API Response: ${JSON.stringify(data)}`);
            }
        } catch(e) {
            console.error(e);
            alert("Network error or CORS issue. Please manually shorten this URL: " + window.location.href.split('#')[0] + "#/verify/" + courseId);
        } finally {
            setIsGeneratingLink(false);
        }
    };

    return (
        <div className="pb-24 pt-24 p-6 min-h-screen bg-gray-50">
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-display font-bold text-gray-900">Admin Panel</h1>
             </div>

             <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
                 {['courses', 'users', 'banners', 'settings'].map(t => (
                     <button key={t} onClick={() => setTab(t as any)} className={`px-5 py-2.5 rounded-xl font-bold capitalize whitespace-nowrap transition-all ${tab === t ? 'bg-brand text-white shadow-lg shadow-brand/30' : 'bg-white text-gray-600 shadow-sm'}`}>
                         {t}
                     </button>
                 ))}
             </div>
             
             {tab === 'courses' && (
                 <div className="space-y-4">
                     <button onClick={() => { setEditingCourse(null); setShowCourseModal(true); }} className="w-full py-4 bg-white border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 font-bold flex items-center justify-center gap-2 hover:border-brand hover:text-brand transition-all">
                        <Plus className="w-5 h-5" /> Add New Batch
                     </button>
                     {courses.map(c => (
                         <div key={c.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-start md:items-center">
                             <img src={c.image} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                             <div className="flex-1">
                                 <h3 className="font-bold text-gray-900">{c.title}</h3>
                                 <p className="text-xs text-gray-500">{c.chapters.length} Chapters • {c.isPaid ? `₹${c.price}` : 'Free'}</p>
                             </div>
                             <div className="flex gap-2">
                                 <button onClick={() => setShowExamManager(c)} className="p-2 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100" title="Manage Exams"><ClipboardList className="w-4 h-4" /></button>
                                 <button onClick={() => { setEditingCourse(c); setShowCourseModal(true); }} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100" title="Edit"><Edit className="w-4 h-4" /></button>
                                 <button onClick={() => { if(confirm('Delete course?')) deleteCourse(c.id); }} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100" title="Delete"><Trash2 className="w-4 h-4" /></button>
                             </div>
                         </div>
                     ))}
                 </div>
             )}

             {tab === 'users' && (
                 <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                     <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                         <span className="font-bold text-gray-700">All Users ({users.length})</span>
                         {/* MANAGER MAKER FUNCTION */}
                         <button onClick={() => setShowUserModal(true)} className="text-xs bg-brand text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-brand/20 hover:scale-105 transition-transform flex items-center gap-1">
                             <Plus className="w-3 h-3" /> Create User / Manager
                         </button>
                     </div>
                     <div className="divide-y divide-gray-100">
                         {users.map(u => (
                             <div key={u.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                 <div>
                                     <div className="flex items-center gap-2">
                                         <p className="font-bold text-sm text-gray-900">{u.name}</p>
                                         <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${u.role === UserRole.ADMIN ? 'bg-red-100 text-red-600' : u.role === UserRole.EDITOR ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                                             {u.role}
                                         </span>
                                     </div>
                                     <p className="text-xs text-gray-500">{u.email}</p>
                                 </div>
                                 {u.role !== UserRole.ADMIN && (
                                     <button onClick={() => { if(confirm('Delete user?')) deleteUser(u.id); }} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                 )}
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {tab === 'banners' && (
                 <div className="space-y-4">
                     <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                         <h3 className="font-bold mb-4 text-gray-900">Add Banner</h3>
                         <form onSubmit={(e) => {
                             e.preventDefault();
                             const form = e.currentTarget;
                             addBanner({ id: Date.now().toString(), image: form.image.value, link: form.link.value });
                             form.reset();
                         }} className="flex gap-2">
                             <input name="image" placeholder="Image URL" className="flex-1 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-500" required />
                             <input name="link" placeholder="Link (Optional)" className="flex-1 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-500" />
                             <button className="bg-brand text-white px-4 py-2 rounded-xl font-bold text-sm">Add</button>
                         </form>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {banners.map(b => (
                             <div key={b.id} className="relative aspect-video rounded-xl overflow-hidden group">
                                 <img src={b.image} className="w-full h-full object-cover" />
                                 <button onClick={() => deleteBanner(b.id)} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {tab === 'settings' && (
                 <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                     <form onSubmit={(e) => {
                         e.preventDefault();
                         const formData = new FormData(e.currentTarget);
                         updateSettings({
                             ...settings,
                             appName: formData.get('appName') as string,
                             adminEmail: formData.get('adminEmail') as string,
                             supportPhone: formData.get('supportPhone') as string,
                             uiColor: formData.get('uiColor') as string,
                             videoApiKey: formData.get('videoApiKey') as string,
                             linkShortenerApiUrl: formData.get('linkShortenerApiUrl') as string,
                             linkShortenerApiKey: formData.get('linkShortenerApiKey') as string,
                             adsCode: formData.get('adsCode') as string
                         });
                         alert('Settings Saved!');
                     }} className="space-y-4">
                         <div>
                             <label className="text-xs font-bold text-gray-500 uppercase">App Name</label>
                             <input name="appName" defaultValue={settings.appName} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 text-gray-900 placeholder:text-gray-500" />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Brand Color</label>
                                <div className="flex gap-2 mt-1">
                                    <input type="color" name="uiColor" defaultValue={settings.uiColor} className="h-10 w-10 rounded-lg cursor-pointer" />
                                    <input type="text" defaultValue={settings.uiColor} className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-xl uppercase text-gray-900 placeholder:text-gray-500" readOnly />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Admin Email</label>
                                <input name="adminEmail" defaultValue={settings.adminEmail} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 text-gray-900 placeholder:text-gray-500" />
                            </div>
                         </div>
                         <div>
                             <label className="text-xs font-bold text-gray-500 uppercase">Support Contact (Phone or Telegram)</label>
                             <input name="supportPhone" defaultValue={settings.supportPhone} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 text-gray-900 placeholder:text-gray-500" />
                         </div>
                         <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                             <h4 className="font-bold text-gray-900 mb-3 text-sm">Link Shortener Configuration</h4>
                             <div className="grid gap-3">
                                 <div>
                                     <label className="text-xs font-bold text-gray-500 uppercase">API URL (e.g. reel2earn.com/api)</label>
                                     <input name="linkShortenerApiUrl" defaultValue={settings.linkShortenerApiUrl} placeholder="https://..." className="w-full p-3 bg-white border border-gray-200 rounded-xl mt-1 text-gray-900 placeholder:text-gray-500" />
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-gray-500 uppercase">API Key</label>
                                     <input name="linkShortenerApiKey" defaultValue={settings.linkShortenerApiKey} className="w-full p-3 bg-white border border-gray-200 rounded-xl mt-1 text-gray-900 placeholder:text-gray-500" />
                                 </div>
                             </div>
                         </div>
                         <div>
                             <label className="text-xs font-bold text-gray-500 uppercase">Ad Code (HTML)</label>
                             <textarea name="adsCode" defaultValue={settings.adsCode} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 font-mono text-xs text-gray-900 placeholder:text-gray-500" rows={3} />
                         </div>
                         <button className="w-full bg-brand text-white py-3 rounded-xl font-bold">Save Settings</button>
                     </form>
                 </div>
             )}

             {/* Course Modal */}
             {showCourseModal && (
                 <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                     <div className="bg-white w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
                         <h2 className="text-xl font-bold mb-4 text-gray-900">{editingCourse ? 'Edit Batch' : 'New Batch'}</h2>
                         <form onSubmit={handleSaveCourse} className="space-y-3">
                             <input name="title" defaultValue={editingCourse?.title} placeholder="Batch Title" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" required />
                             <textarea name="description" defaultValue={editingCourse?.description} placeholder="Description" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" rows={2} required />
                             <input name="image" defaultValue={editingCourse?.image} placeholder="Image URL" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" required />
                             <input name="category" defaultValue={editingCourse?.category} placeholder="Category (e.g. Science)" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" required />
                             <div className="grid grid-cols-2 gap-3">
                                 <input type="number" name="price" defaultValue={editingCourse?.price} placeholder="Price" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" />
                                 <input type="number" name="mrp" defaultValue={editingCourse?.mrp} placeholder="MRP" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" />
                             </div>
                             <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                                 <input type="checkbox" name="isPaid" defaultChecked={editingCourse?.isPaid} id="isPaid" className="w-5 h-5 accent-brand" />
                                 <label htmlFor="isPaid" className="font-medium text-gray-700">Premium Course (Locked)</label>
                             </div>
                             <input name="accessKey" defaultValue={editingCourse?.accessKey} placeholder="Access Key (if Premium)" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" />
                             <input name="telegramChannelLink" defaultValue={editingCourse?.telegramChannelLink} placeholder="Telegram Channel Link (Optional)" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" />
                             
                             <div className="flex gap-2">
                                <input 
                                    name="shortenerLink" 
                                    ref={linkInputRef}
                                    defaultValue={editingCourse?.shortenerLink} 
                                    placeholder="Temp Access Short Link" 
                                    className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" 
                                />
                                {editingCourse && (
                                    <button 
                                        type="button" 
                                        onClick={handleGenerateLink}
                                        disabled={isGeneratingLink}
                                        className="bg-gray-100 text-gray-600 px-3 rounded-xl font-bold text-xs hover:bg-gray-200 disabled:opacity-50"
                                    >
                                        {isGeneratingLink ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Generate'}
                                    </button>
                                )}
                             </div>
                             
                             <div className="flex gap-3 pt-4">
                                 <button type="button" onClick={() => setShowCourseModal(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
                                 <button type="submit" className="flex-1 py-3 bg-brand text-white font-bold rounded-xl shadow-lg shadow-brand/20">Save Batch</button>
                             </div>
                         </form>
                     </div>
                 </div>
             )}

             {/* Add User Modal (Manager Maker) */}
             {showUserModal && (
                 <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                     <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                         <h2 className="text-xl font-bold mb-4 text-gray-900">Add New User</h2>
                         <form onSubmit={handleAddUser} className="space-y-3">
                             <input name="name" placeholder="Full Name" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" required />
                             <input name="email" type="email" placeholder="Email Address" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" required />
                             <input name="phone" placeholder="Phone Number" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" />
                             <input name="password" type="password" placeholder="Password" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" required />
                             
                             <div>
                                 <label className="text-xs font-bold text-gray-500 uppercase ml-1">Role</label>
                                 <select name="role" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 mt-1">
                                     <option value={UserRole.USER}>Student (User)</option>
                                     <option value={UserRole.EDITOR}>Editor (Manager)</option>
                                     <option value={UserRole.ADMIN}>Admin</option>
                                 </select>
                             </div>

                             <div className="flex gap-3 pt-4">
                                 <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
                                 <button type="submit" className="flex-1 py-3 bg-brand text-white font-bold rounded-xl shadow-lg shadow-brand/20">Create User</button>
                             </div>
                         </form>
                     </div>
                 </div>
             )}

             {/* Exam Manager Modal Reuse */}
             {showExamManager && (
                 <ExamManager course={showExamManager} onClose={() => setShowExamManager(null)} />
             )}
        </div>
    );
};

const MainContent = () => {
  const location = useLocation();
  const isFullScreen = location.pathname.startsWith('/watch') || location.pathname.startsWith('/exam') || location.pathname === '/login';

  return (
    <>
      {!isFullScreen && <Header />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CourseListing />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/watch/:courseId" element={<Watch />} />
        <Route path="/exam/:id" element={<ExamMode />} />
        <Route path="/my-courses" element={<MyCourses />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/verify/:courseId" element={<VerifyAccess />} />
        <Route path="/reveal/:key" element={<RevealKey />} />
        <Route path="/help" element={<Help />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {!isFullScreen && <BottomNav />}
      <ChatBot />
    </>
  );
};

export const App = () => {
  return (
    <Router>
      <StoreProvider>
        <ThemeHandler />
        <MainContent />
      </StoreProvider>
    </Router>
  );
};