
import React, { useEffect, useState, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from '../store';
import { 
  Home, BookOpen, User, HelpCircle, Menu, LogOut, 
  Search, PlayCircle, Lock, LayoutDashboard, Settings, Plus, Trash2, Edit, Save, X, ChevronDown, 
  MessageCircle, CheckCircle, FileText, Download, ClipboardList, Timer, Clock, Key, ExternalLink, Play, Bot, Brain, Loader2, ArrowLeft, Video as VideoIcon, Upload
} from '../components/Icons';
import VideoPlayer from '../components/VideoPlayer';
import ChatBot from '../components/ChatBot';
import ExamMode from '../components/ExamMode';
import { Course, Chapter, Video, UserRole, Banner, AppSettings, Exam, Question, SavedNote, Note } from '../types';
import { GoogleGenAI } from "@google/genai";

declare var process: { env: { API_KEY: string } };

// --- Helper Functions ---
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

const Watch = () => {
    const { courseId } = useParams();
    const { courses, currentUser, saveVideoProgress, saveAiQuiz, saveNote } = useStore();
    const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
    const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
    const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizScore, setQuizScore] = useState<number | null>(null);
    const [userAnswers, setUserAnswers] = useState<number[]>([]);
    const [noteGenerating, setNoteGenerating] = useState(false);
    const [generatedNote, setGeneratedNote] = useState<SavedNote | null>(null);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const navigate = useNavigate();
    const course = courses.find(c => c.id === courseId);
    const allVideos: { video: Video, chapterId: string, chapterTitle: string }[] = [];
    course?.chapters.forEach(chap => {
        chap.videos.forEach(vid => {
            allVideos.push({ video: vid, chapterId: chap.id, chapterTitle: chap.title });
        });
    });
    const [currentVideoIdx, setCurrentVideoIdx] = useState(0);

    // Get notes for current chapter
    const currentChapter = course?.chapters.find(c => c.id === allVideos[currentVideoIdx]?.chapterId);
    const chapterNotes = currentChapter?.notes || [];

    useEffect(() => {
        if(allVideos.length > 0) {
            setCurrentVideo(allVideos[currentVideoIdx].video);
            setCurrentVideoUrl(allVideos[currentVideoIdx].video.filename);
        }
    }, [currentVideoIdx, courses]);

    const handleVideoProgress = (currentTime: number, duration: number) => {
        if (currentVideo) saveVideoProgress(currentVideo.id, currentTime, duration);
    };

    const generateAiQuiz = async () => {
        if (!currentVideo) return;
        setQuizLoading(true);
        setShowQuiz(true);
        setQuizScore(null);
        setUserAnswers([]);
        const existingQuiz = currentUser?.generatedQuizzes?.find(q => q.videoId === currentVideo.id);
        if (existingQuiz) {
            setQuizQuestions(existingQuiz.questions);
            setQuizLoading(false);
            return;
        }
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Create 5 multiple choice questions based on the topic "${currentVideo.title}" from the course "${course?.title}". Format strictly as a JSON array of objects with keys: "id", "question", "options" (array of 4 strings), "correctAnswer" (number index 0-3).`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            const text = response.text;
            if (text) {
                const data = JSON.parse(text);
                setQuizQuestions(data);
                saveAiQuiz({ videoId: currentVideo.id, questions: data, generatedAt: new Date().toISOString() });
            }
        } catch (e) {
            console.error(e);
            alert("Failed to generate AI quiz. Please try again.");
            setShowQuiz(false);
        } finally {
            setQuizLoading(false);
        }
    };

    const handleGenerateNotes = async () => {
        if (!currentVideo || !course) return;
        setNoteGenerating(true);
        setShowNoteModal(true);
        setGeneratedNote(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const textPrompt = `You are an expert CBSE school teacher. Create comprehensive, concise, point-wise study notes for the topic "${currentVideo.title}" from the chapter "${allVideos[currentVideoIdx].chapterTitle}" in the course "${course.title}". STRICTLY follow the latest CBSE 2025-26 syllabus. Exclude irrelevant information. Use bold headings and bullet points. The output must be in Markdown format.`;
            const textResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: textPrompt });
            const markdownContent = textResponse.text || "No content generated.";
            const imagePrompt = `Draw a clear, educational diagram or flowchart explaining the concept of "${currentVideo.title}" suitable for school students. White background, black lines, simple style.`;
            const note: SavedNote = { id: Date.now().toString(), videoId: currentVideo.id, videoTitle: currentVideo.title, courseTitle: course.title, content: markdownContent, generatedAt: new Date().toISOString(), syllabusVersion: 'CBSE 2025-26', imageUrl: undefined };
            try {
                 const imageResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: imagePrompt });
                 for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData) {
                        note.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        break;
                    }
                 }
            } catch (imgErr) { console.warn("Image generation failed or model not available, proceeding with text only", imgErr); }
            setGeneratedNote(note);
        } catch (e) {
            console.error("Note generation failed", e);
            alert("Failed to generate notes. Please try again.");
            setShowNoteModal(false);
        } finally {
            setNoteGenerating(false);
        }
    };

    const handleSaveNote = () => {
        if (generatedNote) { saveNote(generatedNote); alert("Notes saved to your profile!"); setShowNoteModal(false); }
    };

    const handleDownloadNote = () => {
        if (!generatedNote) return;
        const element = document.createElement("a");
        const file = new Blob([generatedNote.content], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `${generatedNote.videoTitle}_Notes.md`;
        document.body.appendChild(element);
        element.click();
        setTimeout(() => window.print(), 500);
    };

    const submitQuiz = () => {
        let score = 0;
        quizQuestions.forEach((q, i) => { if (userAnswers[i] === q.correctAnswer) score++; });
        setQuizScore(score);
    };

    if (!currentUser) return <Navigate to="/login" />;
    if (!course) return <Navigate to="/" />;
    const hasAccess = currentUser.purchasedCourseIds.includes(course.id) || (currentUser.tempAccess?.[course.id] && new Date(currentUser.tempAccess[course.id]) > new Date());
    if (!hasAccess) return <Navigate to={`/course/${courseId}`} />;

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row h-screen overflow-hidden">
            <div className="flex-1 flex flex-col relative bg-black">
                <div className="flex-1 relative flex items-center justify-center">
                    {currentVideo ? (
                        <VideoPlayer 
                            src={currentVideo.filename} 
                            onProgress={handleVideoProgress}
                            onBack={() => navigate(`/course/${courseId}`)}
                            initialTime={currentUser.videoProgress?.[currentVideo.id]?.timestamp || 0}
                        />
                    ) : <div className="text-gray-500">Select a video</div>}
                </div>
                <div className="p-4 bg-gray-900 border-t border-gray-800 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold">{currentVideo?.title}</h1>
                        <p className="text-gray-400 text-sm">{allVideos[currentVideoIdx]?.chapterTitle}</p>
                    </div>
                    <div className="flex gap-2">
                        {currentVideo && (
                            <>
                                <button onClick={generateAiQuiz} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors"><Brain className="w-4 h-4" /> Take AI Quiz</button>
                                <button onClick={handleGenerateNotes} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-green-700 transition-colors"><FileText className="w-4 h-4" /> Generate Notes</button>
                            </>
                        )}
                    </div>
                </div>
                {/* AI Quiz Modal */}
                {showQuiz && (
                    <div className="absolute inset-0 z-50 bg-gray-900/95 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="max-w-2xl mx-auto bg-gray-800 rounded-3xl p-6 border border-gray-700">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2"><Brain className="text-indigo-400"/> Quiz: {currentVideo?.title}</h2>
                                <button onClick={() => setShowQuiz(false)} className="p-2 hover:bg-gray-700 rounded-full"><X className="w-5 h-5"/></button>
                            </div>
                            {quizLoading ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center"><Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4"/><p className="text-gray-400">Generating questions with AI...</p></div>
                            ) : (
                                <div className="space-y-6">
                                    {quizQuestions.map((q, idx) => {
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
                                                        } else if (userAnswers[idx] === oIdx) btnClass = "bg-indigo-600 border-indigo-500";
                                                        return (<button key={oIdx} disabled={showResult} onClick={() => { const newAns = [...userAnswers]; newAns[idx] = oIdx; setUserAnswers(newAns); }} className={`p-3 rounded-lg border text-left text-sm font-medium transition-all ${btnClass}`}>{opt}</button>);
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {quizScore === null ? (
                                        <button onClick={submitQuiz} disabled={userAnswers.filter(a => a !== undefined).length !== quizQuestions.length} className="w-full py-3 bg-indigo-600 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors">Submit Quiz</button>
                                    ) : (
                                        <div className="text-center p-6 bg-gray-800 rounded-xl border border-gray-700"><p className="text-gray-400 text-sm uppercase font-bold mb-1">Your Score</p><p className="text-4xl font-bold text-white mb-4">{quizScore} / {quizQuestions.length}</p><button onClick={() => setShowQuiz(false)} className="px-6 py-2 bg-gray-700 rounded-lg font-bold hover:bg-gray-600">Close</button></div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* AI Notes Modal */}
                {showNoteModal && (
                    <div className="absolute inset-0 z-50 bg-gray-900/95 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="max-w-3xl mx-auto bg-white text-gray-900 rounded-3xl p-8 border border-gray-200 shadow-2xl printable-content">
                            <div className="flex justify-between items-start mb-6 border-b pb-4 no-print">
                                <div><h2 className="text-2xl font-display font-bold flex items-center gap-2 text-gray-900"><FileText className="text-green-600"/> AI Study Notes</h2><p className="text-sm text-gray-500 mt-1">Based on CBSE 2025-26 Syllabus</p></div>
                                <button onClick={() => setShowNoteModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X className="w-6 h-6"/></button>
                            </div>
                            {noteGenerating ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center"><Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4"/><p className="text-gray-500 font-medium">Analyzing video and generating notes...</p><p className="text-xs text-gray-400 mt-2">Generating engaging diagrams...</p></div>
                            ) : generatedNote ? (
                                <div>
                                    <div className="prose max-w-none mb-6">
                                        <h1 className="text-3xl font-bold mb-2">{generatedNote.videoTitle}</h1>
                                        <p className="text-sm text-gray-500 mb-6 uppercase tracking-wider">{generatedNote.courseTitle} • {new Date(generatedNote.generatedAt).toLocaleDateString()}</p>
                                        {generatedNote.imageUrl && (<div className="mb-6 p-2 border rounded-xl bg-gray-50 flex justify-center"><img src={generatedNote.imageUrl} alt="AI Diagram" className="max-h-64 object-contain rounded-lg" /></div>)}
                                        <div className="whitespace-pre-wrap text-sm md:text-base leading-relaxed text-gray-800">{generatedNote.content}</div>
                                    </div>
                                    <div className="flex gap-4 border-t pt-6 no-print">
                                        <button onClick={handleSaveNote} className="flex-1 py-3 bg-brand text-white rounded-xl font-bold shadow-lg shadow-brand/20 hover:bg-brand-dark transition-colors flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Save to Profile</button>
                                        <button onClick={handleDownloadNote} className="flex-1 py-3 bg-gray-100 text-gray-800 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"><Download className="w-5 h-5" /> Print / Download</button>
                                    </div>
                                </div>
                            ) : <div className="text-center py-10 text-gray-500">Failed to load content.</div>}
                        </div>
                    </div>
                )}
            </div>
            <div className="w-full md:w-80 bg-gray-800 border-l border-gray-700 flex flex-col h-[40vh] md:h-full overflow-hidden">
                <div className="p-4 border-b border-gray-700 bg-gray-800"><h2 className="font-bold text-lg">Course Content</h2><p className="text-xs text-gray-400">{allVideos.length} Videos</p></div>
                <div className="flex-1 overflow-y-auto">
                    {course.chapters.map((chap) => {
                        // Check if this chapter is the current one to highlight notes
                        const isCurrentChapter = chap.id === allVideos[currentVideoIdx]?.chapterId;
                        return (
                        <div key={chap.id}>
                            <div className="px-4 py-2 bg-gray-700/50 text-xs font-bold text-gray-300 uppercase sticky top-0 backdrop-blur-sm z-10">{chap.title}</div>
                            {chap.videos.map((vid) => {
                                const idx = allVideos.findIndex(v => v.video.id === vid.id);
                                const isPlaying = idx === currentVideoIdx;
                                const progress = currentUser.videoProgress?.[vid.id];
                                const isCompleted = progress?.completed;
                                return (
                                    <button key={vid.id} onClick={() => setCurrentVideoIdx(idx)} className={`w-full text-left p-3 flex gap-3 hover:bg-gray-700 transition-colors border-b border-gray-700/50 ${isPlaying ? 'bg-gray-700 border-l-4 border-l-brand' : ''}`}>
                                        <div className="mt-1">{isPlaying ? <div className="w-4 h-4 text-brand"><PlayCircle className="w-full h-full" fill="currentColor" /></div> : isCompleted ? <CheckCircle className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border border-gray-500" />}</div>
                                        <div><p className={`text-sm font-medium ${isPlaying ? 'text-white' : 'text-gray-300'}`}>{vid.title}</p><p className="text-xs text-gray-500">{vid.duration}</p></div>
                                    </button>
                                );
                            })}
                            {/* Display Notes in Sidebar if it's the active chapter or just generally list them */}
                            {chap.notes.length > 0 && (
                                <div className="px-3 py-2 space-y-1">
                                    {chap.notes.map(note => (
                                        <a key={note.id} href={note.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 text-xs text-blue-300 hover:text-blue-200 transition-colors">
                                            <FileText className="w-3 h-3 flex-none"/>
                                            <span className="truncate">{note.title}</span>
                                            <ExternalLink className="w-3 h-3 flex-none ml-auto opacity-50"/>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )})}
                </div>
            </div>
        </div>
    );
};

const Profile = () => {
   const { currentUser, updateUser, logout, deleteNote } = useStore();
   const [isEditing, setIsEditing] = useState(false);
   const [data, setData] = useState({ name: currentUser?.name || '', email: currentUser?.email || '', phone: currentUser?.phone || '' });
   const [expandedNote, setExpandedNote] = useState<string | null>(null);

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
         
         <div className="grid md:grid-cols-2 gap-6">
             {/* Exam Results */}
             <div>
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
             </div>

             {/* Saved Notes */}
             <div>
                 <h3 className="font-display font-bold text-xl mb-4 text-gray-900">Saved AI Notes</h3>
                 <div className="space-y-4">
                    {currentUser.savedNotes && currentUser.savedNotes.length > 0 ? currentUser.savedNotes.map((note) => (
                       <div key={note.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                          <div 
                            onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                            className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                      <FileText className="w-5 h-5"/>
                                  </div>
                                  <div>
                                     <p className="font-bold text-gray-900 text-sm">{note.videoTitle}</p>
                                     <p className="text-xs text-gray-500">{new Date(note.generatedAt).toLocaleDateString()} • {note.syllabusVersion}</p>
                                  </div>
                              </div>
                              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedNote === note.id ? 'rotate-180' : ''}`} />
                          </div>
                          
                          {expandedNote === note.id && (
                              <div className="p-5 pt-0 border-t border-gray-100 bg-gray-50/50">
                                  <div className="mt-4 prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                                      {note.content.substring(0, 300)}...
                                  </div>
                                  {note.imageUrl && (
                                      <img src={note.imageUrl} alt="Diagram" className="mt-4 rounded-lg border border-gray-200 h-32 object-cover" />
                                  )}
                                  <div className="mt-4 flex gap-2">
                                      <button 
                                        onClick={() => {
                                            const element = document.createElement("a");
                                            const file = new Blob([note.content], {type: 'text/plain'});
                                            element.href = URL.createObjectURL(file);
                                            element.download = `${note.videoTitle}_Notes.md`;
                                            document.body.appendChild(element);
                                            element.click();
                                        }}
                                        className="text-xs font-bold bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 flex items-center gap-1"
                                      >
                                          <Download className="w-3 h-3"/> Download
                                      </button>
                                      <button 
                                        onClick={() => deleteNote(note.id)}
                                        className="text-xs font-bold bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 flex items-center gap-1 ml-auto"
                                      >
                                          <Trash2 className="w-3 h-3"/> Delete
                                      </button>
                                  </div>
                              </div>
                          )}
                       </div>
                    )) : (
                       <div className="text-center py-10 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                           <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                           <p>No saved notes</p>
                       </div>
                    )}
                 </div>
             </div>
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
    (currentUser.tempAccess && currentUser.tempAccess[c.id] && new Date(currentUser.tempAccess[c.id]) > new Date())
  );

  return (
    <div className="pb-24 pt-24 p-6 min-h-screen bg-gray-50">
       <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">My Batches</h1>
       {myCourses.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
               <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
               <p className="text-gray-500 font-medium">You haven't enrolled in any batches yet.</p>
               <Link to="/courses" className="text-brand font-bold mt-2 inline-block">Browse Batches</Link>
           </div>
       ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               {myCourses.map(course => (
                   <Link to={`/course/${course.id}`} key={course.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex gap-4 p-4 hover:border-brand transition-colors group">
                       <div className="w-24 h-24 rounded-xl overflow-hidden flex-none">
                           <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                       </div>
                       <div className="flex-1 flex flex-col justify-center">
                           <h3 className="font-bold text-gray-900 line-clamp-1">{course.title}</h3>
                           <p className="text-xs text-gray-500 mb-2">{course.chapters.length} Chapters</p>
                           <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                               <div className="bg-brand h-full w-1/3"></div>
                           </div>
                           <p className="text-[10px] text-gray-400 mt-1">30% Completed</p>
                       </div>
                       <div className="flex items-center justify-center">
                           <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                               <PlayCircle className="w-6 h-6" />
                           </div>
                       </div>
                   </Link>
               ))}
           </div>
       )}
    </div>
  );
};

const CourseDetail = () => {
    const { id } = useParams();
    const { courses, currentUser, enrollCourse, grantTempAccess } = useStore();
    const navigate = useNavigate();
    const course = courses.find(c => c.id === id);
    const [verificationTimeLeft, setVerificationTimeLeft] = useState<number | null>(null);

    if (!course) return <div className="pt-24 text-center">Batch not found</div>;

    const isEnrolled = currentUser && (
        currentUser.purchasedCourseIds.includes(course.id) || 
        (currentUser.tempAccess && currentUser.tempAccess[course.id] && new Date(currentUser.tempAccess[course.id]) > new Date())
    );

    const handleEnroll = () => {
        if (!currentUser) { navigate('/login'); return; }
        if (!course.isPaid) {
            enrollCourse(course.id);
            alert('Enrolled successfully!');
        } else {
            navigate(`/verify/${course.id}`);
        }
    };

    const handleTempAccess = () => {
        if (!currentUser) { navigate('/login'); return; }
        
        // Start 10s countdown
        setVerificationTimeLeft(10);
        
        // Open short link if exists
        if (course.shortenerLink) {
            window.open(course.shortenerLink, '_blank');
        }
    };

    useEffect(() => {
        if (verificationTimeLeft === null) return;

        if (verificationTimeLeft <= 0) {
            grantTempAccess(course.id);
            setVerificationTimeLeft(null);
            alert("Temporary Access Granted! You have 24 hours.");
            return;
        }

        const timer = setTimeout(() => {
            setVerificationTimeLeft(prev => (prev !== null ? prev - 1 : null));
        }, 1000);

        return () => clearTimeout(timer);
    }, [verificationTimeLeft, course.id, grantTempAccess]);

    return (
        <div className="pb-24 pt-0 min-h-screen bg-gray-50">
            <div className="relative h-64 md:h-80">
                <img src={course.image} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <span className="bg-brand text-xs font-bold px-2 py-1 rounded mb-2 inline-block">{course.category}</span>
                    <h1 className="text-3xl font-display font-bold mb-2">{course.title}</h1>
                    <p className="text-gray-300 line-clamp-2 max-w-2xl">{course.description}</p>
                </div>
                <button onClick={() => navigate(-1)} className="absolute top-6 left-4 bg-black/30 p-2 rounded-full text-white backdrop-blur-sm"><ArrowLeft className="w-6 h-6"/></button>
            </div>
            
            <div className="p-6 -mt-6 bg-gray-50 rounded-t-3xl relative z-10">
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 text-sm font-bold uppercase">Price</p>
                            <p className="text-2xl font-bold text-gray-900">{course.isPaid ? `₹${course.price}` : 'Free'}</p>
                        </div>
                        {isEnrolled ? (
                            <button className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-500/30 cursor-default">
                                <CheckCircle className="w-5 h-5" /> Enrolled
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={handleEnroll} className="bg-brand text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand/30 hover:scale-105 transition-transform">
                                    {course.isPaid ? <Lock className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                                    {course.isPaid ? 'Unlock' : 'Start'}
                                </button>
                            </div>
                        )}
                    </div>

                    {!isEnrolled && course.isPaid && (
                        <div className="w-full">
                            {verificationTimeLeft !== null ? (
                                <button disabled className="w-full bg-gray-200 text-gray-600 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-wait">
                                    <Loader2 className="w-5 h-5 animate-spin" /> 
                                    Verifying in {verificationTimeLeft}s...
                                </button>
                            ) : (
                                <button onClick={handleTempAccess} className="w-full bg-white border-2 border-brand text-brand px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand/5 transition-colors">
                                    <Clock className="w-5 h-5" /> Get Free Access (24h)
                                </button>
                            )}
                            <p className="text-[10px] text-gray-400 text-center mt-2">Watch an ad to get temporary access</p>
                        </div>
                    )}
                </div>

                {isEnrolled && course.exams && course.exams.length > 0 && (
                     <div className="mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg">Test Your Knowledge</h3>
                                <p className="text-purple-100 text-sm">Take exams to check your progress</p>
                            </div>
                            <button onClick={() => navigate(`/exam/${course.id}`)} className="bg-white text-purple-600 px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-gray-100 transition-colors">
                                View Exams
                            </button>
                        </div>
                     </div>
                )}

                <h3 className="font-bold text-gray-900 text-lg mb-4">Course Content</h3>
                <div className="space-y-4">
                    {course.chapters.map((chapter, idx) => (
                        <div key={chapter.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="p-4 bg-gray-50/50 border-b border-gray-100 font-bold text-gray-800 flex justify-between items-center">
                                <span>{idx + 1}. {chapter.title}</span>
                                <span className="text-xs text-gray-500 font-medium">{chapter.videos.length} Videos</span>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {chapter.videos.map((video) => (
                                    <div 
                                        key={video.id} 
                                        onClick={() => {
                                            if (isEnrolled) navigate(`/watch/${course.id}`);
                                            else handleEnroll();
                                        }}
                                        className={`p-4 flex items-center gap-3 hover:bg-gray-50 cursor-pointer ${!isEnrolled ? 'opacity-50' : ''}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center flex-none">
                                            {isEnrolled ? <PlayCircle className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{video.title}</p>
                                            <p className="text-xs text-gray-500">{video.duration}</p>
                                        </div>
                                    </div>
                                ))}
                                {/* Render Notes for Student */}
                                {chapter.notes && chapter.notes.length > 0 && (
                                    <div className="bg-blue-50/30 p-2">
                                        <div className="text-[10px] font-bold text-blue-600 uppercase mb-1 px-2">Study Materials</div>
                                        {chapter.notes.map(note => (
                                            <a 
                                                key={note.id} 
                                                href={note.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className={`p-3 flex items-center gap-3 hover:bg-blue-50 transition-colors rounded-lg cursor-pointer group ${!isEnrolled ? 'opacity-50 pointer-events-none' : ''}`}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-none">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{note.title}</p>
                                                    <p className="text-[10px] text-gray-500">Document / Note</p>
                                                </div>
                                                <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                                {chapter.videos.length === 0 && (!chapter.notes || chapter.notes.length === 0) && <div className="p-4 text-center text-gray-400 text-sm">No content uploaded yet</div>}
                            </div>
                        </div>
                    ))}
                    {course.chapters.length === 0 && <div className="text-center py-10 text-gray-400">No chapters added yet</div>}
                </div>
            </div>
        </div>
    );
};

const VerifyAccess = () => {
    const { courseId } = useParams();
    const { courses, enrollCourse, currentUser } = useStore();
    const [key, setKey] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const course = courses.find(c => c.id === courseId);

    if (!course) return <Navigate to="/" />;
    if (!currentUser) {
        localStorage.setItem('pendingCourseVerification', courseId || '');
        return <Navigate to="/login" />;
    }

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        if (key === course.accessKey) {
            enrollCourse(course.id);
            alert('Access Granted! Welcome to the batch.');
            navigate(`/course/${course.id}`);
        } else {
            setError('Invalid Access Key. Please check and try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600">
                    <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-display font-bold text-center text-gray-900 mb-2">Unlock Batch</h2>
                <p className="text-center text-gray-500 mb-6 text-sm">Enter the access key to unlock <strong>{course.title}</strong></p>
                
                <form onSubmit={handleVerify} className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="Enter Access Key" 
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-center font-mono text-lg tracking-widest uppercase focus:outline-none focus:border-brand"
                        value={key}
                        onChange={(e) => { setKey(e.target.value); setError(''); }}
                    />
                    {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}
                    <button className="w-full py-4 bg-brand text-white rounded-xl font-bold shadow-lg shadow-brand/20 hover:bg-brand-dark transition-colors">
                        Unlock Now
                    </button>
                </form>
                
                <div className="mt-6 text-center">
                    <Link to="/help" className="text-brand text-xs font-bold hover:underline">Where to get a key?</Link>
                </div>
                <button onClick={() => navigate(-1)} className="w-full mt-4 text-gray-400 text-xs font-bold hover:text-gray-600">Cancel</button>
            </div>
        </div>
    );
};

const RevealKey = () => {
    const { key } = useParams();
    // This could be a page that automatically copies a key or something
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-4">Access Key Revealed</h1>
                <div className="bg-white/10 p-6 rounded-2xl border border-white/20 backdrop-blur-md">
                    <code className="text-2xl font-mono text-yellow-400 tracking-wider select-all">{key}</code>
                </div>
                <p className="mt-4 text-gray-400">Copy this key and paste it in the verification screen.</p>
                <Link to="/" className="inline-block mt-8 text-brand hover:text-white transition-colors">Go to App</Link>
            </div>
        </div>
    );
};

const ContentManager = ({ course, onClose }: { course: Course, onClose: () => void }) => {
    const { updateCourse } = useStore();
    const [chapters, setChapters] = useState<Chapter[]>(course.chapters);
    const [view, setView] = useState<'list' | 'addChapter' | 'addVideo' | 'addNote'>('list');
    
    // Form States
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const [targetChapterId, setTargetChapterId] = useState<string | null>(null);
    const [videoData, setVideoData] = useState({ title: '', url: '', duration: '' });
    const [noteData, setNoteData] = useState({ title: '', url: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        updateCourse({ ...course, chapters });
        onClose();
    };

    const addChapter = () => {
        if(!newChapterTitle.trim()) return;
        setChapters([...chapters, { id: Date.now().toString(), title: newChapterTitle, videos: [], notes: [] }]);
        setNewChapterTitle('');
        setView('list');
    };

    const deleteChapter = (id: string) => {
        if(confirm('Delete chapter?')) setChapters(chapters.filter(c => c.id !== id));
    };

    const addVideo = () => {
        if (!videoData.title || !videoData.url || !targetChapterId) return;
        
        setChapters(chapters.map(c => {
            if (c.id === targetChapterId) {
                return { 
                    ...c, 
                    videos: [...c.videos, { 
                        id: Date.now().toString(), 
                        title: videoData.title, 
                        filename: videoData.url, 
                        duration: videoData.duration || '00:00' 
                    }] 
                };
            }
            return c;
        }));
        
        setVideoData({ title: '', url: '', duration: '' });
        setTargetChapterId(null);
        setView('list');
    };
    
    const deleteVideo = (chapterId: string, videoId: string) => {
        if(confirm('Delete video?')) {
            setChapters(chapters.map(c => {
                if(c.id === chapterId) {
                    return { ...c, videos: c.videos.filter(v => v.id !== videoId) };
                }
                return c;
            }));
        }
    };

    const addNote = () => {
        if (!noteData.title || !noteData.url || !targetChapterId) return;

        setChapters(chapters.map(c => {
            if (c.id === targetChapterId) {
                return {
                    ...c,
                    notes: [...(c.notes || []), {
                        id: Date.now().toString(),
                        title: noteData.title,
                        url: noteData.url
                    }]
                };
            }
            return c;
        }));

        setNoteData({ title: '', url: '' });
        setTargetChapterId(null);
        setView('list');
    };

    const deleteNote = (chapterId: string, noteId: string) => {
        if(confirm('Delete note?')) {
            setChapters(chapters.map(c => {
                if(c.id === chapterId) {
                    return { ...c, notes: (c.notes || []).filter(n => n.id !== noteId) };
                }
                return c;
            }));
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                // Warning: LocalStorage has limits.
                if(reader.result && typeof reader.result === 'string') {
                    if(reader.result.length > 2000000) { // 2MB limit check approximation
                        alert("File is too large for local storage. Please host it externally (Drive/Dropbox) and paste the link.");
                    }
                    setNoteData(prev => ({...prev, url: reader.result as string, title: prev.title || file.name}));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl p-6 max-h-[85vh] flex flex-col animate-slide-up">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        {view !== 'list' && (
                            <button onClick={() => setView('list')} className="p-1 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-5 h-5"/></button>
                        )}
                        <h2 className="text-xl font-display font-bold text-gray-900">
                            {view === 'list' ? 'Manage Content' : view === 'addChapter' ? 'New Chapter' : view === 'addVideo' ? 'Add Video' : 'Add Note'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
                </div>
                
                {/* LIST VIEW */}
                {view === 'list' && (
                    <div className="flex-1 overflow-y-auto pr-2">
                        <button 
                            onClick={() => setView('addChapter')}
                            className="w-full py-3 mb-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:bg-brand/5 hover:border-brand hover:text-brand transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Add New Chapter
                        </button>

                        <div className="space-y-4">
                            {chapters.map((chapter, idx) => (
                                <div key={chapter.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                    <div className="bg-gray-50 p-4 flex justify-between items-center border-b border-gray-200">
                                        <span className="font-bold text-gray-800">{idx + 1}. {chapter.title}</span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => { setTargetChapterId(chapter.id); setView('addVideo'); }}
                                                className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 font-bold text-gray-700 flex items-center gap-1"
                                                title="Add Video"
                                            >
                                                <Plus className="w-3 h-3" /> Video
                                            </button>
                                            <button 
                                                onClick={() => { setTargetChapterId(chapter.id); setView('addNote'); }}
                                                className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 font-bold text-blue-600 flex items-center gap-1"
                                                title="Add Note/PDF"
                                            >
                                                <Plus className="w-3 h-3" /> Note
                                            </button>
                                            <button onClick={() => deleteChapter(chapter.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        {/* Videos List */}
                                        {chapter.videos.map(video => (
                                            <div key={video.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg group transition-colors">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                        <PlayCircle className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800 truncate">{video.title}</p>
                                                        <p className="text-[10px] text-gray-400">{video.duration || '00:00'}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => deleteVideo(chapter.id, video.id)} className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4"/></button>
                                            </div>
                                        ))}
                                        
                                        {/* Notes List */}
                                        {chapter.notes && chapter.notes.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                                                <p className="text-[10px] uppercase font-bold text-gray-400 px-3 mb-1">Notes & Resources</p>
                                                {chapter.notes.map(note => (
                                                    <div key={note.id} className="flex justify-between items-center p-2 pl-3 hover:bg-blue-50 rounded-lg group transition-colors">
                                                        <div className="flex items-center gap-2 overflow-hidden text-blue-600">
                                                            <FileText className="w-4 h-4 flex-none" />
                                                            <a href={note.url} target="_blank" rel="noreferrer" className="text-xs font-medium truncate hover:underline">{note.title}</a>
                                                        </div>
                                                        <button onClick={() => deleteNote(chapter.id, note.id)} className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {chapter.videos.length === 0 && (!chapter.notes || chapter.notes.length === 0) && <p className="text-center text-gray-400 text-xs py-4 italic">No content in this chapter</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ADD CHAPTER VIEW */}
                {view === 'addChapter' && (
                    <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-4">
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-brand">
                                <BookOpen className="w-8 h-8" />
                            </div>
                            <p className="text-gray-500 text-sm">Organize your videos into chapters.</p>
                        </div>
                        <input 
                            value={newChapterTitle} 
                            onChange={e => setNewChapterTitle(e.target.value)}
                            placeholder="Chapter Title (e.g. Thermodynamics)"
                            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-brand font-medium"
                            autoFocus
                        />
                        <button onClick={addChapter} className="w-full bg-brand text-white py-4 rounded-xl font-bold shadow-lg shadow-brand/20">
                            Create Chapter
                        </button>
                    </div>
                )}

                {/* ADD VIDEO VIEW */}
                {view === 'addVideo' && (
                    <div className="flex-1 overflow-y-auto">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 text-sm text-blue-700 flex items-start gap-3">
                            <Bot className="w-5 h-5 flex-none mt-0.5" />
                            <div>
                                <p className="font-bold mb-1">Supported Formats:</p>
                                <ul className="list-disc list-inside space-y-1 opacity-80 text-xs">
                                    <li>YouTube Links (Standard or Shorts)</li>
                                    <li>Google Drive Links</li>
                                    <li>Vimeo & Loom Links</li>
                                    <li>Direct MP4/WebM Links</li>
                                    <li>Embed Code (<code>&lt;iframe...</code>)</li>
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Video Title</label>
                                <input 
                                    value={videoData.title} 
                                    onChange={e => setVideoData({...videoData, title: e.target.value})}
                                    placeholder="e.g. Introduction to Algebra"
                                    className="w-full p-3 mt-1 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-brand"
                                />
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Video URL or Embed Code</label>
                                <textarea 
                                    value={videoData.url} 
                                    onChange={e => setVideoData({...videoData, url: e.target.value})}
                                    placeholder="Paste URL or <iframe> code here..."
                                    className="w-full p-3 mt-1 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-brand min-h-[100px] resize-y"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Duration (Optional)</label>
                                <input 
                                    value={videoData.duration} 
                                    onChange={e => setVideoData({...videoData, duration: e.target.value})}
                                    placeholder="e.g. 15:30"
                                    className="w-full p-3 mt-1 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-brand"
                                />
                            </div>

                            <button onClick={addVideo} className="w-full bg-brand text-white py-4 rounded-xl font-bold shadow-lg shadow-brand/20 mt-4">
                                Add Video
                            </button>
                        </div>
                    </div>
                )}

                {/* ADD NOTE VIEW */}
                {view === 'addNote' && (
                    <div className="flex-1 flex flex-col justify-start max-w-md mx-auto w-full space-y-6 pt-4">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                                <FileText className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-lg">Add Study Material</h3>
                            <p className="text-gray-500 text-sm">Upload a small file or paste a link to a PDF/Doc.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Title</label>
                                <input 
                                    value={noteData.title} 
                                    onChange={e => setNoteData({...noteData, title: e.target.value})}
                                    placeholder="e.g. Chapter 1 Notes (PDF)"
                                    className="w-full p-3 mt-1 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-brand"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">File or Link</label>
                                <div className="mt-1 flex flex-col gap-2">
                                    <textarea 
                                        value={noteData.url} 
                                        onChange={e => setNoteData({...noteData, url: e.target.value})}
                                        placeholder="Paste Google Drive / Dropbox Link here..."
                                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-brand min-h-[80px]"
                                    />
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-white px-2 text-gray-500">Or Upload Small File</span>
                                        </div>
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl border border-dashed border-gray-300 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Upload className="w-4 h-4"/> Select File (Max 2MB)
                                    </button>
                                    {noteData.url && noteData.url.startsWith('data:') && (
                                        <p className="text-xs text-green-600 font-bold text-center mt-1">File selected and ready to save.</p>
                                    )}
                                </div>
                            </div>

                            <button onClick={addNote} className="w-full bg-brand text-white py-4 rounded-xl font-bold shadow-lg shadow-brand/20 mt-4">
                                Save Note
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer Actions (Only for List View) */}
                {view === 'list' && (
                    <div className="pt-4 border-t border-gray-100 mt-4 flex justify-end gap-3">
                        <button onClick={handleSave} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-colors">
                            Save Changes
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ExamManager = ({ course, onClose }: { course: Course, onClose: () => void }) => {
    const { updateCourse } = useStore();
    const [exams, setExams] = useState<Exam[]>(course.exams || []);
    const [editingExam, setEditingExam] = useState<Exam | null>(null);

    const handleSave = () => {
        updateCourse({ ...course, exams });
    };

    const addExam = () => {
        const title = prompt("Exam Title:");
        if (title) {
            setExams([...exams, { id: Date.now().toString(), title, questions: [] }]);
        }
    };

    const deleteExam = (id: string) => {
        if(confirm("Delete this exam?")) setExams(exams.filter(e => e.id !== id));
    };

    const updateExam = (updated: Exam) => {
        setExams(exams.map(e => e.id === updated.id ? updated : e));
        setEditingExam(null);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-3xl p-6 max-h-[85vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Manage Exams: {course.title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
                </div>

                {editingExam ? (
                    <QuestionEditor exam={editingExam} onSave={updateExam} onCancel={() => setEditingExam(null)} />
                ) : (
                    <div className="flex-1 overflow-y-auto">
                         <button onClick={addExam} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold hover:border-brand hover:text-brand transition-colors mb-4 flex items-center justify-center gap-2">
                             <Plus className="w-5 h-5" /> Create New Exam
                         </button>
                         <div className="space-y-3">
                             {exams.map(exam => (
                                 <div key={exam.id} className="bg-gray-50 p-4 rounded-xl flex justify-between items-center border border-gray-200">
                                     <div>
                                         <h3 className="font-bold text-gray-900">{exam.title}</h3>
                                         <p className="text-xs text-gray-500">{exam.questions.length} Questions</p>
                                     </div>
                                     <div className="flex gap-2">
                                         <button onClick={() => setEditingExam(exam)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold hover:bg-brand hover:text-white hover:border-brand transition-colors">Edit Questions</button>
                                         <button onClick={() => deleteExam(exam.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                                     </div>
                                 </div>
                             ))}
                             {exams.length === 0 && <p className="text-center text-gray-400">No exams yet.</p>}
                         </div>
                    </div>
                )}

                {!editingExam && (
                    <div className="pt-4 border-t border-gray-100 mt-4 flex justify-end gap-3">
                        <button onClick={onClose} className="px-6 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
                        <button onClick={() => { handleSave(); onClose(); }} className="px-6 py-2 bg-brand text-white font-bold rounded-xl shadow-lg shadow-brand/20">Save Changes</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const QuestionEditor = ({ exam, onSave, onCancel }: { exam: Exam, onSave: (e: Exam) => void, onCancel: () => void }) => {
    const [questions, setQuestions] = useState<Question[]>(exam.questions);
    
    // Simple state to add a new question
    const [qText, setQText] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [correct, setCorrect] = useState(0);

    const addQuestion = () => {
        if (!qText || options.some(o => !o)) { alert("Fill all fields"); return; }
        const newQ: Question = {
            id: Date.now().toString(),
            question: qText,
            options: [...options],
            correctAnswer: correct
        };
        setQuestions([...questions, newQ]);
        setQText('');
        setOptions(['', '', '', '']);
        setCorrect(0);
    };

    const deleteQ = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
                <button onClick={onCancel} className="text-gray-500"><ArrowLeft className="w-5 h-5"/></button>
                <h3 className="font-bold text-lg">Editing: {exam.title}</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                 {/* Add New Q Form */}
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                     <h4 className="font-bold text-sm text-gray-700 mb-2">Add New Question</h4>
                     <textarea 
                        value={qText} onChange={e => setQText(e.target.value)}
                        placeholder="Question Text" 
                        className="w-full p-3 rounded-lg border border-gray-300 mb-3 text-sm"
                        rows={2}
                     />
                     <div className="grid grid-cols-2 gap-2 mb-3">
                        {options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <input type="radio" name="correct" checked={correct === i} onChange={() => setCorrect(i)} className="accent-brand" />
                                <input 
                                    value={opt} onChange={e => { const newOpts = [...options]; newOpts[i] = e.target.value; setOptions(newOpts); }}
                                    placeholder={`Option ${i+1}`}
                                    className="flex-1 p-2 rounded border border-gray-300 text-sm"
                                />
                            </div>
                        ))}
                     </div>
                     <button onClick={addQuestion} className="w-full py-2 bg-gray-800 text-white rounded-lg text-sm font-bold">Add Question</button>
                 </div>

                 {/* List */}
                 <div className="space-y-3">
                    {questions.map((q, i) => (
                        <div key={q.id} className="p-3 border rounded-xl relative group">
                            <p className="font-bold text-sm pr-6">{i+1}. {q.question}</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
                                {q.options.map((o, idx) => (
                                    <span key={idx} className={idx === q.correctAnswer ? "text-green-600 font-bold" : ""}>{String.fromCharCode(65+idx)}. {o}</span>
                                ))}
                            </div>
                            <button onClick={() => deleteQ(q.id)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                        </div>
                    ))}
                 </div>
            </div>

            <div className="pt-4 border-t mt-4">
                <button onClick={() => onSave({ ...exam, questions })} className="w-full py-3 bg-brand text-white font-bold rounded-xl shadow-lg shadow-brand/20">Save Exam</button>
            </div>
        </div>
    );
};

const AdminPanel = () => {
    const { currentUser, courses, users, banners, settings, addCourse, updateCourse, deleteCourse, addBanner, deleteBanner, updateSettings, addUser, deleteUser, addCourseToUser } = useStore();
    const [tab, setTab] = useState<'courses' | 'users' | 'banners' | 'settings'>('courses');
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [showExamManager, setShowExamManager] = useState<Course | null>(null);
    const [showContentManager, setShowContentManager] = useState<Course | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const linkInputRef = useRef<HTMLInputElement>(null);
    const [showEnrollModal, setShowEnrollModal] = useState<string | null>(null); 
    
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
        if (editingCourse) updateCourse(courseData); else addCourse(courseData);
        setShowCourseModal(false); setEditingCourse(null);
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
        if(!courseId) { alert("Please save the batch first, then edit it to generate a link."); return; }

        setIsGeneratingLink(true);
        try {
            let baseUrl = settings.linkShortenerApiUrl.trim();
            if(baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

            // Force production URL
            const destinationUrl = `https://study-tool-rosy.vercel.app/#/verify/${courseId}`;
            const encodedDest = encodeURIComponent(destinationUrl);
            const separator = baseUrl.includes('?') ? '&' : '?';
            const fetchUrl = `${baseUrl}${separator}api=${settings.linkShortenerApiKey}&url=${encodedDest}`;
            
            let response;
            try {
                response = await fetch(fetchUrl);
            } catch (err) {
                console.warn("Direct fetch failed, trying proxy", err);
                response = await fetch(`https://corsproxy.io/?${encodeURIComponent(fetchUrl)}`);
            }

            const data = await response.json();
            
            if(data.status === 'success' || data.shortenedUrl || data.shortlink) {
                const shortUrl = data.shortenedUrl || data.shortlink || data.url;
                if(linkInputRef.current) {
                    linkInputRef.current.value = shortUrl;
                }
            } else {
                console.error("API Error Data:", data);
                alert(`Failed to generate link. API Response: ${JSON.stringify(data)}`);
            }
        } catch(e) {
            console.error(e);
            alert("Network error. Please manually shorten this URL: https://study-tool-rosy.vercel.app/#/verify/" + courseId);
        } finally {
            setIsGeneratingLink(false);
        }
    };

    return (
        <div className="pb-24 pt-24 p-6 min-h-screen bg-gray-50">
             <div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-display font-bold text-gray-900">Batch & User Management</h1></div>
             <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
                 {['courses', 'users', 'banners', 'settings'].map(t => (
                     <button key={t} onClick={() => setTab(t as any)} className={`px-5 py-2.5 rounded-xl font-bold capitalize whitespace-nowrap transition-all ${tab === t ? 'bg-brand text-white shadow-lg shadow-brand/30' : 'bg-white text-gray-600 shadow-sm'}`}>{t === 'courses' ? 'Batches' : t}</button>
                 ))}
             </div>
             {tab === 'courses' && (
                 <div className="space-y-4">
                     <button onClick={() => { setEditingCourse(null); setShowCourseModal(true); }} className="w-full py-4 bg-white border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 font-bold flex items-center justify-center gap-2 hover:border-brand hover:text-brand transition-all"><Plus className="w-5 h-5" /> Add New Batch</button>
                     {courses.map(c => (
                         <div key={c.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-start md:items-center">
                             <img src={c.image} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                             <div className="flex-1"><h3 className="font-bold text-gray-900">{c.title}</h3><p className="text-xs text-gray-500">{c.chapters.length} Chapters • {c.isPaid ? `₹${c.price}` : 'Free'}</p></div>
                             <div className="flex gap-2 flex-wrap">
                                 <button onClick={() => setShowContentManager(c)} className="px-3 py-2 text-green-700 bg-green-50 rounded-lg hover:bg-green-100 font-bold text-xs flex items-center gap-1 shadow-sm border border-green-100" title="Manage Content"><VideoIcon className="w-4 h-4" /> Manage Content</button>
                                 <button onClick={() => setShowExamManager(c)} className="p-2 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 border border-purple-100" title="Manage Exams"><ClipboardList className="w-4 h-4" /></button>
                                 <button onClick={() => { setEditingCourse(c); setShowCourseModal(true); }} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 border border-blue-100" title="Edit"><Edit className="w-4 h-4" /></button>
                                 <button onClick={() => { if(confirm('Delete course?')) deleteCourse(c.id); }} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 border border-red-100" title="Delete"><Trash2 className="w-4 h-4" /></button>
                             </div>
                         </div>
                     ))}
                 </div>
             )}
             {tab === 'users' && <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"><div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center"><span className="font-bold text-gray-700">All Users ({users.length})</span><button onClick={() => setShowUserModal(true)} className="text-xs bg-brand text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-brand/20 hover:scale-105 transition-transform flex items-center gap-1"><Plus className="w-3 h-3" /> Create User / Manager</button></div><div className="divide-y divide-gray-100">{users.map(u => (<div key={u.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-gray-50 gap-4"><div><div className="flex items-center gap-2"><p className="font-bold text-sm text-gray-900">{u.name}</p><span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${u.role === UserRole.ADMIN ? 'bg-red-100 text-red-600' : u.role === UserRole.EDITOR ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>{u.role}</span></div><p className="text-xs text-gray-500">{u.email}</p><p className="text-[10px] text-gray-400 mt-1">Enrolled in: {u.purchasedCourseIds.length} Batches</p></div><div className="flex items-center gap-2"><button onClick={() => setShowEnrollModal(u.id)} className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100">Enroll</button>{u.role !== UserRole.ADMIN && (<button onClick={() => { if(confirm('Delete user?')) deleteUser(u.id); }} className="text-gray-400 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>)}</div></div>))}</div></div>}
             {tab === 'banners' && <div className="space-y-4"><div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"><h3 className="font-bold mb-4 text-gray-900">Add Banner</h3><form onSubmit={(e) => { e.preventDefault(); const form = e.currentTarget; addBanner({ id: Date.now().toString(), image: form.image.value, link: form.link.value }); form.reset(); }} className="flex gap-2"><input name="image" placeholder="Image URL" className="flex-1 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-500" required /><input name="link" placeholder="Link (Optional)" className="flex-1 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-500" /><button className="bg-brand text-white px-4 py-2 rounded-xl font-bold text-sm">Add</button></form></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{banners.map(b => (<div key={b.id} className="relative aspect-video rounded-xl overflow-hidden group"><img src={b.image} className="w-full h-full object-cover" /><button onClick={() => deleteBanner(b.id)} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button></div>))}</div></div>}
             {tab === 'settings' && <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"><form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); updateSettings({ ...settings, appName: formData.get('appName') as string, adminEmail: formData.get('adminEmail') as string, supportPhone: formData.get('supportPhone') as string, uiColor: formData.get('uiColor') as string, videoApiKey: formData.get('videoApiKey') as string, linkShortenerApiUrl: formData.get('linkShortenerApiUrl') as string, linkShortenerApiKey: formData.get('linkShortenerApiKey') as string, adsCode: formData.get('adsCode') as string }); alert('Settings Saved!'); }} className="space-y-4"><div><label className="text-xs font-bold text-gray-500 uppercase">App Name</label><input name="appName" defaultValue={settings.appName} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 text-gray-900 placeholder:text-gray-500" /></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase">Brand Color</label><div className="flex gap-2 mt-1"><input type="color" name="uiColor" defaultValue={settings.uiColor} className="h-10 w-10 rounded-lg cursor-pointer" /><input type="text" defaultValue={settings.uiColor} className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-xl uppercase text-gray-900 placeholder:text-gray-500" readOnly /></div></div><div><label className="text-xs font-bold text-gray-500 uppercase">Admin Email</label><input name="adminEmail" defaultValue={settings.adminEmail} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 text-gray-900 placeholder:text-gray-500" /></div></div><div><label className="text-xs font-bold text-gray-500 uppercase">Support Contact (Phone or Telegram)</label><input name="supportPhone" defaultValue={settings.supportPhone} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 text-gray-900 placeholder:text-gray-500" /></div><div className="bg-gray-50 p-4 rounded-xl border border-gray-200"><h4 className="font-bold text-gray-900 mb-3 text-sm">Link Shortener Configuration</h4><div className="grid gap-3"><div><label className="text-xs font-bold text-gray-500 uppercase">API URL (e.g. reel2earn.com/api)</label><input name="linkShortenerApiUrl" defaultValue={settings.linkShortenerApiUrl} placeholder="https://..." className="w-full p-3 bg-white border border-gray-200 rounded-xl mt-1 text-gray-900 placeholder:text-gray-500" /></div><div><label className="text-xs font-bold text-gray-500 uppercase">API Key</label><input name="linkShortenerApiKey" defaultValue={settings.linkShortenerApiKey} className="w-full p-3 bg-white border border-gray-200 rounded-xl mt-1 text-gray-900 placeholder:text-gray-500" /></div></div></div><div><label className="text-xs font-bold text-gray-500 uppercase">Ad Code (HTML)</label><textarea name="adsCode" defaultValue={settings.adsCode} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 font-mono text-xs text-gray-900 placeholder:text-gray-500" rows={3} /></div><button className="w-full bg-brand text-white py-3 rounded-xl font-bold">Save Settings</button></form></div>}
             {showCourseModal && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto"><h2 className="text-xl font-bold mb-4 text-gray-900">{editingCourse ? 'Edit Batch' : 'New Batch'}</h2><form onSubmit={handleSaveCourse} className="space-y-3"><input name="title" defaultValue={editingCourse?.title} placeholder="Batch Title" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" required /><textarea name="description" defaultValue={editingCourse?.description} placeholder="Description" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" rows={2} required /><input name="image" defaultValue={editingCourse?.image} placeholder="Image URL" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" required /><input name="category" defaultValue={editingCourse?.category} placeholder="Category (e.g. Science)" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" required /><div className="grid grid-cols-2 gap-3"><input type="number" name="price" defaultValue={editingCourse?.price} placeholder="Price" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" /><input type="number" name="mrp" defaultValue={editingCourse?.mrp} placeholder="MRP" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" /></div><div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl"><input type="checkbox" name="isPaid" defaultChecked={editingCourse?.isPaid} id="isPaid" className="w-5 h-5 accent-brand" /><label htmlFor="isPaid" className="font-medium text-gray-700">Premium Course (Locked)</label></div><input name="accessKey" defaultValue={editingCourse?.accessKey} placeholder="Access Key (if Premium)" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" /><input name="telegramChannelLink" defaultValue={editingCourse?.telegramChannelLink} placeholder="Telegram Channel Link (Optional)" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" /><div className="flex gap-2"><input name="shortenerLink" ref={linkInputRef} defaultValue={editingCourse?.shortenerLink} placeholder="Temp Access Short Link" className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" />{editingCourse && (<button type="button" onClick={handleGenerateLink} disabled={isGeneratingLink} className="bg-gray-100 text-gray-600 px-3 rounded-xl font-bold text-xs hover:bg-gray-200 disabled:opacity-50">{isGeneratingLink ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Generate'}</button>)}</div><div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowCourseModal(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancel</button><button type="submit" className="flex-1 py-3 bg-brand text-white font-bold rounded-xl shadow-lg shadow-brand/20">Save Batch</button></div></form></div></div>)}
             {showUserModal && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl"><h2 className="text-xl font-bold mb-4 text-gray-900">Add New User</h2><form onSubmit={handleAddUser} className="space-y-3"><input name="name" placeholder="Full Name" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" required /><input name="email" type="email" placeholder="Email Address" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" required /><input name="phone" placeholder="Phone Number" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" /><input name="password" type="password" placeholder="Password" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-500" required /><div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Role</label><select name="role" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 mt-1"><option value={UserRole.USER}>Student (User)</option><option value={UserRole.EDITOR}>Editor (Manager)</option><option value={UserRole.ADMIN}>Admin</option></select></div><div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancel</button><button type="submit" className="flex-1 py-3 bg-brand text-white font-bold rounded-xl shadow-lg shadow-brand/20">Create User</button></div></form></div></div>)}
             {showEnrollModal && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl"><h2 className="text-xl font-bold mb-4 text-gray-900">Enroll User in Batch</h2><div className="space-y-2 max-h-[60vh] overflow-y-auto">{courses.map(c => { const targetUser = users.find(u => u.id === showEnrollModal); const isEnrolled = targetUser?.purchasedCourseIds.includes(c.id); return (<button key={c.id} disabled={isEnrolled} onClick={() => { if(showEnrollModal) { addCourseToUser(showEnrollModal, c.id); setShowEnrollModal(null); } }} className={`w-full text-left p-3 rounded-xl border flex items-center justify-between ${isEnrolled ? 'bg-green-50 border-green-200 cursor-default' : 'bg-white border-gray-200 hover:bg-gray-50'}`}><span className={`text-sm font-bold ${isEnrolled ? 'text-green-700' : 'text-gray-700'}`}>{c.title}</span>{isEnrolled && <CheckCircle className="w-4 h-4 text-green-600"/>}</button>); })}</div><button onClick={() => setShowEnrollModal(null)} className="w-full mt-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancel</button></div></div>)}
             {showExamManager && <ExamManager course={showExamManager} onClose={() => setShowExamManager(null)} />}
             {showContentManager && <ContentManager course={showContentManager} onClose={() => setShowContentManager(null)} />}
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
