import React, { useEffect, useState, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { 
  Home, BookOpen, User, HelpCircle, Menu, LogOut, 
  Search, PlayCircle, Lock, LayoutDashboard, Users, CreditCard, Settings, Plus, Trash2, Edit, Save, X, ChevronDown, ChevronUp,
  MessageCircle, CloudDownload, CheckCircle, Shield, Upload, FileText, Download, Youtube, Link as LinkIcon, Image as ImageIcon, Globe,
  ClipboardList, Timer, Code, DollarSign, Clock, Eye, Smartphone, MoreVertical, Key, Copy, ExternalLink, Play, Bot, Brain, Wand2, Loader2, List
} from './components/Icons';
import VideoPlayer from './components/VideoPlayer';
import ChatBot from './components/ChatBot';
import ExamMode from './components/ExamMode';
import { Course, Chapter, Video, UserRole, Note, Banner, AppSettings, Exam, Question, VideoProgress, AiGeneratedQuiz } from './types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { GoogleGenAI } from "@google/genai";

declare var process: { env: { API_KEY: string } };

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

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const { login, signup, currentUser, settings } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      const pendingCourse = sessionStorage.getItem('pendingCourseVerification');
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
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand focus:bg-white transition-all text-gray-900 font-medium placeholder:text-gray-400"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              />
              <input 
                type="tel" placeholder="Phone Number" required 
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand focus:bg-white transition-all text-gray-900 font-medium placeholder:text-gray-400"
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </>
          )}
          
          <input 
            type="text" placeholder="Email Address" required 
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand focus:bg-white transition-all text-gray-900 font-medium placeholder:text-gray-400"
            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
          />
          <input 
            type="password" placeholder="Password" required 
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand focus:bg-white transition-all text-gray-900 font-medium placeholder:text-gray-400"
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
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all text-gray-900 placeholder-gray-400 font-medium"
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
  const { currentUser, grantTempAccess } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) { 
        sessionStorage.setItem('pendingCourseVerification', courseId || '');
        navigate('/login'); 
        return; 
    }
    if (courseId) {
        grantTempAccess(courseId);
        sessionStorage.removeItem('pendingCourseVerification');
        alert('Temporary Access Granted (24h)');
        navigate(`/course/${courseId}`);
    }
  }, [courseId, currentUser, navigate, grantTempAccess]);

  return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand w-10 h-10" /></div>;
};

const ExamManager = ({ course, onClose }: { course: Course; onClose: () => void }) => {
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

const ContentManager = ({ course, onClose }: { course: Course; onClose: () => void }) => {
    const { updateCourse } = useStore();
    const [chapters, setChapters] = useState<Chapter[]>(course.chapters || []);
    const [showImport, setShowImport] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    
    const handleSave = () => {
        updateCourse({ ...course, chapters });
        onClose();
    };

    const addChapter = () => {
        setChapters([...chapters, { id: Date.now().toString(), title: "New Subject", videos: [], notes: [] }]);
    };

    const updateChapterTitle = (idx: number, title: string) => {
        const newChapters = [...chapters];
        newChapters[idx].title = title;
        setChapters(newChapters);
    };

    const addVideo = (chapterIdx: number) => {
        const newChapters = [...chapters];
        newChapters[chapterIdx].videos.push({ id: Date.now().toString(), title: "New Video", filename: "", duration: "00:00" });
        setChapters(newChapters);
    };

    // Helper to simulate video import by getting file metadata and creating object URL
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, cIdx: number, vIdx: number) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const videoUrl = URL.createObjectURL(file);
            const videoTitle = file.name.replace(/\.[^/.]+$/, "");

            setChapters(prev => prev.map((ch, i) => {
                if (i !== cIdx) return ch;
                const newVideos = ch.videos.map((v, j) => {
                    if (j !== vIdx) return v;
                    return { ...v, title: videoTitle, filename: videoUrl, duration: 'Unknown' };
                });
                return { ...ch, videos: newVideos };
            }));
            
            alert("File selected! Note: This creates a local preview link only reachable on this device. For permanent access, please upload to a cloud service and use the public URL.");
        }
    };

    const updateVideo = (cIdx: number, vIdx: number, field: string, val: string) => {
        const newChapters = [...chapters];
        newChapters[cIdx].videos[vIdx] = { ...newChapters[cIdx].videos[vIdx], [field]: val };
        setChapters(newChapters);
    };
    
    const deleteVideo = (cIdx: number, vIdx: number) => {
        const newChapters = [...chapters];
        newChapters[cIdx].videos.splice(vIdx, 1);
        setChapters(newChapters);
    };
    
    const deleteChapter = (idx: number) => {
        const newChapters = [...chapters];
        newChapters.splice(idx, 1);
        setChapters(newChapters);
    };

    const handleBulkImport = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            if (Array.isArray(parsed)) {
                // Validate minimal structure
                const valid = parsed.every(c => c.title && Array.isArray(c.videos));
                if (valid) {
                    setChapters([...chapters, ...parsed]);
                    setShowImport(false);
                    setJsonInput('');
                    alert("Import Successful!");
                } else {
                    alert("Invalid JSON format. Expected array of objects with 'title' and 'videos' array.");
                }
            }
        } catch (e) {
            alert("Invalid JSON syntax.");
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold font-display text-gray-900">Manage Subjects: {course.title}</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setShowImport(!showImport)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors">
                            {showImport ? 'Cancel Import' : 'Bulk Import JSON'}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6"/></button>
                    </div>
                </div>

                {showImport && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                        <p className="text-xs text-gray-500 mb-2 font-bold uppercase">Paste JSON Array (Subjects & Videos)</p>
                        <textarea 
                            className="w-full h-32 p-3 text-xs font-mono bg-white border border-gray-200 rounded-xl mb-3 focus:outline-none focus:border-brand text-gray-900"
                            placeholder='[{"title": "Physics", "videos": [{"title": "Intro", "filename": "https://..."}]}]'
                            value={jsonInput}
                            onChange={e => setJsonInput(e.target.value)}
                        />
                        <button onClick={handleBulkImport} className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-black">Import Data</button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                    {chapters.length === 0 && !showImport && (
                        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl">
                            <p className="text-gray-400 font-bold">No subjects added yet.</p>
                            <button onClick={addChapter} className="mt-4 text-brand font-bold hover:underline">Add First Subject</button>
                        </div>
                    )}

                    {chapters.map((chapter, cIdx) => (
                        <div key={chapter.id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm relative group">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-3">
                                <div className="flex items-center gap-3 flex-1">
                                    <span className="bg-brand/10 text-brand text-xs font-bold px-2 py-1 rounded">Subject {cIdx + 1}</span>
                                    <input 
                                        className="bg-transparent text-lg font-bold text-gray-800 w-full focus:outline-none placeholder-gray-300" 
                                        value={chapter.title} 
                                        onChange={e => updateChapterTitle(cIdx, e.target.value)} 
                                        placeholder="Subject Name (e.g. Mathematics)" 
                                    />
                                </div>
                                <button onClick={() => deleteChapter(cIdx)} className="text-gray-300 hover:text-red-500 p-2 transition-colors"><Trash2 className="w-5 h-5"/></button>
                            </div>
                            
                            <div className="space-y-3">
                                {chapter.videos.map((video, vIdx) => (
                                    <div key={video.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex flex-col gap-3 group/video">
                                        <div className="flex gap-2">
                                            <input 
                                                className="flex-1 p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand/20 outline-none text-gray-900" 
                                                placeholder="Video Title" 
                                                value={video.title} 
                                                onChange={e => updateVideo(cIdx, vIdx, 'title', e.target.value)} 
                                            />
                                            <input 
                                                className="w-24 p-2.5 bg-white border border-gray-200 rounded-xl text-sm text-center text-gray-900" 
                                                placeholder="Duration" 
                                                value={video.duration} 
                                                onChange={e => updateVideo(cIdx, vIdx, 'duration', e.target.value)} 
                                            />
                                            <button onClick={() => deleteVideo(cIdx, vIdx)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <input 
                                                className="flex-1 p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-mono text-gray-600 focus:ring-2 focus:ring-brand/20 outline-none" 
                                                placeholder="Paste Video URL (YouTube, MP4 Link)" 
                                                value={video.filename} 
                                                onChange={e => updateVideo(cIdx, vIdx, 'filename', e.target.value)} 
                                            />
                                            <div className="relative">
                                                <input 
                                                    type="file" 
                                                    accept="video/*"
                                                    id={`file-${cIdx}-${vIdx}`}
                                                    className="hidden" 
                                                    onChange={(e) => handleFileSelect(e, cIdx, vIdx)}
                                                />
                                                <label 
                                                    htmlFor={`file-${cIdx}-${vIdx}`}
                                                    className="cursor-pointer px-3 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-xl text-xs font-bold text-gray-700 whitespace-nowrap flex items-center gap-1 transition-colors"
                                                    title="Select local file to auto-fill title (Preview Only)"
                                                >
                                                    <Upload className="w-3 h-3" /> Select File
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => addVideo(cIdx)} className="w-full py-3 border-2 border-dashed border-indigo-100 bg-indigo-50/50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2">
                                    <Plus className="w-4 h-4"/> Add Video Lesson
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    <button onClick={addChapter} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-lg shadow-gray-900/20 hover:bg-black transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5"/> Create New Subject
                    </button>
                </div>
                <div className="mt-6 pt-4 border-t flex justify-end bg-white">
                    <button onClick={handleSave} className="bg-brand text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-dark transition-colors shadow-lg shadow-brand/30">Save Changes</button>
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
  const [isShortening, setIsShortening] = useState(false);
  const [shortenerError, setShortenerError] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [localSettings, setLocalSettings] = useState(settings);
  const [adminCreds, setAdminCreds] = useState({ email: currentUser?.email || '', password: currentUser?.password || '' });
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
     if(!newUser.name || !newUser.email || !newUser.password) { alert("Please fill all fields"); return; }
     addUser({ id: Date.now().toString(), name: newUser.name, email: newUser.email, password: newUser.password, role: newUser.role as UserRole, purchasedCourseIds: [], phone: '0000000000' });
     setNewUser({ name: '', email: '', password: '', role: 'USER' });
     alert("User created successfully");
  };
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try { const base64 = await convertToBase64(e.target.files[0]); setNewBannerImage(base64); } catch (err) { console.error(err); }
    }
  };
  const handleCourseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editingCourse) {
      try { const base64 = await convertToBase64(e.target.files[0]); setEditingCourse({ ...editingCourse, image: base64 }); } catch (err) { console.error(err); }
    }
  };
  const handleSaveCourse = () => {
    if (!editingCourse) return;
    const exists = courses.some(c => c.id === editingCourse.id);
    if (exists) updateCourse(editingCourse); else addCourse(editingCourse);
    setEditingCourse(null);
  };
  const deleteCourseSafe = (id: string) => deleteCourse(id);
  const deleteUserSafe = (id: string) => deleteUser(id);
  
  const handleAutoShortenLink = async () => {
    if (!editingCourse) return;
    setShortenerError('');
    if (!settings.linkShortenerApiKey) { alert("Please configure Link Shortener API Key in Settings first."); return; }
    
    setIsShortening(true);
    const courseId = editingCourse.id || Date.now().toString();
    if(editingCourse.id !== courseId) setEditingCourse(prev => prev ? {...prev, id: courseId} : null);
    
    // Fallback logic for non-http environments (like local file preview/blob)
    let baseUrl = window.location.href.split('#')[0];
    if (!baseUrl.startsWith('http')) {
        baseUrl = 'https://studyportal.app'; // Default placeholder domain for link generation
        // alert("Warning: Running in non-HTTP environment. Using placeholder domain for short link.");
    }
    if(baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    
    const verifyUrl = `${baseUrl}/#/verify/${courseId}`;
    
    const shortenerUrl = settings.linkShortenerApiUrl || 'https://reel2earn.com/api';
    const finalApiUrl = `${shortenerUrl}?api=${settings.linkShortenerApiKey}&url=${encodeURIComponent(verifyUrl)}`;

    try {
        const response = await fetch(finalApiUrl);
        const data = await response.json();
        
        if (data.status === 'success' || data.shortenedUrl) {
            const shortLink = data.shortenedUrl;
            setEditingCourse(prev => prev ? { ...prev, shortenerLink: shortLink } : null);
        } else { 
            throw new Error(data.message || 'Unknown error');
        }
    } catch (e: any) { 
        console.error("Shortener Error:", e);
        setShortenerError(finalApiUrl); 
        alert(`Shortener failed: ${e.message || e}. \n\nA manual link has been generated below.`);
    } finally { 
        setIsShortening(false); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-20">
      <div className="bg-white shadow-sm border-b sticky top-16 z-10 overflow-x-auto">
        <div className="flex p-2 min-w-max gap-2 justify-center">
          {['dashboard', 'courses', 'users', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-xl font-bold capitalize transition-all ${activeTab === tab ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>{tab}</button>
          ))}
        </div>
      </div>
      <div className="p-6 max-w-7xl mx-auto">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow-card border border-gray-100"><h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Users</h3><p className="text-5xl font-display font-bold text-gray-900 mt-4">{users.length}</p></div>
            <div className="bg-white p-8 rounded-3xl shadow-card border border-gray-100"><h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Active Batches</h3><p className="text-5xl font-display font-bold text-green-600 mt-4">{courses.length}</p></div>
            <div className="col-span-1 md:col-span-2 bg-white p-8 rounded-3xl shadow-card border border-gray-100 h-80"><h3 className="text-gray-900 font-bold mb-6 font-display text-xl">User Growth</h3><ResponsiveContainer width="100%" height="100%"><BarChart data={users.map((u, i) => ({ name: `Day ${i+1}`, users: i+1 }))}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" /><XAxis dataKey="name" hide /><YAxis axisLine={false} tickLine={false} /><Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} /><Bar dataKey="users" fill={settings.uiColor || '#4F46E5'} radius={[4, 4, 0, 0]} barSize={40} /></BarChart></ResponsiveContainer></div>
          </div>
        )}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
               <h2 className="font-display font-bold text-xl text-gray-900 pl-2">Manage Courses</h2>
               <button onClick={() => { setEditingCourse({ id: Date.now().toString(), title: 'New Course', description: 'Description...', price: 0, mrp: 1000, image: 'https://via.placeholder.com/300', category: 'General', createdAt: new Date().toISOString(), chapters: [], isPaid: false }); }} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-brand transition-colors shadow-lg shadow-gray-900/20"><Plus className="w-5 h-5" /> Add New Batch</button>
            </div>
            {courses.map(course => (
              <div key={course.id} className="bg-white p-5 rounded-3xl shadow-card border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto"><img src={course.image} className="w-20 h-20 rounded-2xl object-cover shadow-sm" /><div><h3 className="font-bold text-lg text-gray-900">{course.title}</h3><div className="flex gap-2 mt-2"><span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${course.isPaid ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{course.isPaid ? 'LOCKED' : 'FREE'}</span><span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">{course.category}</span></div></div></div>
                <div className="flex gap-2 w-full md:w-auto justify-end"><button onClick={() => setManagingContentCourse(course)} className="px-4 py-2 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-100 flex items-center gap-2 transition-colors"><PlayCircle className="w-4 h-4" /> Content</button><button onClick={() => setManagingExamsCourse(course)} className="px-4 py-2 bg-purple-50 text-purple-600 font-bold text-xs rounded-xl hover:bg-purple-100 flex items-center gap-2 transition-colors"><ClipboardList className="w-4 h-4" /> Exams</button><button onClick={() => setEditingCourse(course)} className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"><Edit className="w-5 h-5" /></button><button onClick={() => deleteCourseSafe(course.id)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button></div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'users' && (
           <div className="space-y-6">
             <div className="bg-white p-6 rounded-3xl shadow-card border border-gray-100"><h3 className="font-bold text-gray-900 mb-4 font-display text-lg">Create New User / Manager</h3><div className="grid grid-cols-1 md:grid-cols-5 gap-3"><input className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900" placeholder="Name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} /><input className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} /><input className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900" placeholder="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} /><select className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}><option value="USER">Student</option><option value="EDITOR">Manager/Editor</option><option value="ADMIN">Admin</option></select><button onClick={handleAddUser} className="bg-brand text-white font-bold rounded-xl hover:bg-brand-dark shadow-lg shadow-brand/20">Create</button></div></div>
             <div className="space-y-3"><h3 className="font-bold text-gray-500 uppercase tracking-widest text-xs ml-2">Existing Users</h3>{users.map(u => (<div key={u.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center"><div><p className="font-bold text-gray-900">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p><span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block ${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : u.role === 'EDITOR' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span></div>{u.role !== UserRole.ADMIN && (<button onClick={() => deleteUserSafe(u.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>)}</div>))}</div>
           </div>
        )}
        {activeTab === 'settings' && (
          <div className="bg-white p-8 rounded-3xl shadow-card border border-gray-100 space-y-8">
            <div className="border-b border-gray-100 pb-8"><h2 className="font-display font-bold text-xl mb-6 text-brand">Branding</h2><div className="space-y-4"><div><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Website Name</label><input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900" value={localSettings.appName} onChange={e => setLocalSettings({...localSettings, appName: e.target.value})} /></div><div><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">UI Color Theme</label><div className="flex gap-4 items-center"><input type="color" className="h-12 w-24 p-1 border rounded-xl cursor-pointer" value={localSettings.uiColor || '#4F46E5'} onChange={e => setLocalSettings({...localSettings, uiColor: e.target.value})} /><div className="text-sm text-gray-500">Select your brand's primary color</div></div></div></div></div>
            <div className="border-b border-gray-100 pb-8"><h2 className="font-display font-bold text-xl mb-6 text-brand">App Banners</h2><div className="mb-6"><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Upload New Banner</label><div className="flex gap-3"><input type="file" accept="image/*" className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500" onChange={handleBannerUpload} /><button onClick={() => { if(newBannerImage) { addBanner({ id: Date.now().toString(), image: newBannerImage, link: '#' }); setNewBannerImage(''); alert('Banner added!'); } }} className="bg-gray-900 text-white px-6 py-2 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-black transition-colors" disabled={!newBannerImage}>Add</button></div></div><div className="grid grid-cols-2 gap-4">{banners.map(b => (<div key={b.id} className="relative group rounded-xl overflow-hidden shadow-sm"><img src={b.image} className="w-full h-24 object-cover" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><button onClick={() => deleteBanner(b.id)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"><Trash2 className="w-4 h-4" /></button></div></div>))}</div></div>
            <div className="border-b border-gray-100 pb-8"><h2 className="font-display font-bold text-xl mb-6 text-brand">Admin Credentials</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Admin Email</label><input type="email" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900" value={adminCreds.email} onChange={e => { setAdminCreds({...adminCreds, email: e.target.value}); setLocalSettings({...localSettings, adminEmail: e.target.value}); }} /></div><div><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Admin Password</label><input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900" value={adminCreds.password} onChange={e => setAdminCreds({...adminCreds, password: e.target.value})} /></div></div></div>
            <div className="border-b border-gray-100 pb-8"><h2 className="font-display font-bold text-xl mb-6 text-brand">Integrations</h2><div className="space-y-6"><div><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Link Shortener API URL (Reel2Earn)</label><input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-900" value={localSettings.linkShortenerApiUrl || ''} onChange={e => setLocalSettings({...localSettings, linkShortenerApiUrl: e.target.value})} /></div><div><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Link Shortener API Key</label><input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-900" value={localSettings.linkShortenerApiKey || ''} onChange={e => setLocalSettings({...localSettings, linkShortenerApiKey: e.target.value})} /></div><div><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ads Code (HTML/Script)</label><textarea className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl h-24 font-mono text-xs text-gray-900" value={localSettings.adsCode || ''} onChange={e => setLocalSettings({...localSettings, adsCode: e.target.value})} placeholder="<script>...</script>" /></div></div></div>
            <button onClick={handleSaveSettings} className="w-full bg-brand text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand/30 hover:bg-brand-dark transition-all transform hover:scale-[1.01]">Save All Changes</button>
          </div>
        )}
      </div>
      {editingCourse && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-display font-bold mb-6 text-gray-900">{courses.some(c => c.id === editingCourse.id) ? 'Edit Batch' : 'Create New Batch'}</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Batch Title" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-medium focus:ring-2 focus:ring-brand/50 outline-none text-gray-900" value={editingCourse.title} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} />
              <textarea placeholder="Description" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl h-32 focus:ring-2 focus:ring-brand/50 outline-none resize-none text-gray-900" value={editingCourse.description} onChange={e => setEditingCourse({...editingCourse, description: e.target.value})} />
              <div className="grid grid-cols-2 gap-4"><div className="flex items-center gap-3 border border-gray-200 p-4 rounded-2xl cursor-pointer hover:bg-gray-50" onClick={() => setEditingCourse({...editingCourse, isPaid: !editingCourse.isPaid})}><input type="checkbox" checked={editingCourse.isPaid || false} onChange={() => {}} className="w-5 h-5 text-brand rounded focus:ring-brand" /><span className="font-bold text-sm text-gray-700">Is Locked?</span></div><input type="text" placeholder="ACCESS KEY" className="w-full p-4 border border-gray-200 rounded-2xl font-bold uppercase text-center tracking-widest text-gray-900" value={editingCourse.accessKey || ''} onChange={e => setEditingCourse({...editingCourse, accessKey: e.target.value.toUpperCase()})} /></div>
              <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl"><label className="block text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">Verification Link (24h Access)</label><div className="flex gap-2 mb-2"><input type="text" placeholder="Short link will appear here..." className="flex-1 p-3 bg-white border border-indigo-200 rounded-xl text-sm text-gray-900" value={editingCourse.shortenerLink || ''} onChange={e => setEditingCourse({...editingCourse, shortenerLink: e.target.value})} /><button onClick={handleAutoShortenLink} disabled={isShortening} className="px-4 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center gap-1 hover:bg-indigo-700 disabled:opacity-50 transition-colors" title="Auto-create link using Reel2Earn API">{isShortening ? <Loader2 className="w-4 h-4 animate-spin"/> : <Wand2 className="w-4 h-4" />} Auto</button></div><p className="text-[10px] text-indigo-400">Use 'Auto' to generate a short link using your API Key, or paste manually.</p>{shortenerError && <div className="mt-2 p-2 bg-red-100 text-red-700 text-xs rounded border border-red-200"><strong>Auto-shorten failed (Browser Blocked).</strong> <a href={shortenerError} target="_blank" rel="noopener noreferrer" className="underline font-bold">Click here to open shortener manually</a></div>}</div>
              <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Thumbnail</label><div className="flex items-center gap-3 mb-3"><img src={editingCourse.image || 'https://via.placeholder.com/100'} className="w-20 h-20 rounded-2xl object-cover border border-gray-200" /><label className="flex-1 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-200 border-dashed rounded-2xl h-20 flex flex-col items-center justify-center text-gray-500 transition-colors"><Upload className="w-5 h-5 mb-1"/><span className="text-xs font-bold">Upload Image</span><input type="file" accept="image/*" onChange={handleCourseImageUpload} className="hidden" /></label></div><input type="text" placeholder="Or enter Image URL" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900" value={editingCourse.image} onChange={e => setEditingCourse({...editingCourse, image: e.target.value})} /></div>
              <input type="text" placeholder="Category (e.g. Science, Maths)" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-medium text-gray-900" value={editingCourse.category} onChange={e => setEditingCourse({...editingCourse, category: e.target.value})} />
            </div>
            <div className="flex gap-4 mt-8"><button onClick={() => setEditingCourse(null)} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-colors">Cancel</button><button onClick={handleSaveCourse} className="flex-1 py-4 bg-brand text-white font-bold rounded-2xl shadow-lg shadow-brand/30 hover:bg-brand-dark transition-all">Save Changes</button></div>
          </div>
        </div>
      )}
      {managingExamsCourse && (<ExamManager course={managingExamsCourse} onClose={() => setManagingExamsCourse(null)} />)}
      {managingContentCourse && (<ContentManager course={managingContentCourse} onClose={() => setManagingContentCourse(null)} />)}
    </div>
  );
};

const MyCourses = () => {
    const { courses, currentUser } = useStore();
    if(!currentUser) return <Navigate to="/login" />;
    const myCourses = courses.filter(c => currentUser.purchasedCourseIds.includes(c.id));
    const tempAccessCourses = courses.filter(c => {
         const expiry = currentUser.tempAccess?.[c.id];
         return expiry && new Date(expiry) > new Date();
    });
    const allCourses = Array.from(new Set([...myCourses, ...tempAccessCourses]));
    return (
        <div className="min-h-screen bg-gray-50 p-6 pt-24 pb-24">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">My Batches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {allCourses.length === 0 ? (
                    <div className="col-span-2 text-center py-20 text-gray-400">No courses yet.</div>
                ) : allCourses.map(course => (
                    <Link to={`/course/${course.id}`} key={course.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-all">
                        <img src={course.image} className="w-24 h-24 rounded-2xl object-cover bg-gray-100" />
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">{course.title}</h3>
                            <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden"><div className="bg-brand h-full w-0" /></div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 block">Start Learning</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

const Watch = () => {
    const { courseId } = useParams();
    const { courses, currentUser, saveAiQuiz } = useStore();
    const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
    const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
    const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizScore, setQuizScore] = useState<number | null>(null);
    const [userAnswers, setUserAnswers] = useState<number[]>([]);

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
                     {currentVideoUrl ? <VideoPlayer src={currentVideoUrl} /> : <div className="h-full flex items-center justify-center">Select a video</div>}
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
    const { courses, currentUser, enrollCourse } = useStore();
    const navigate = useNavigate();
    const course = courses.find(c => c.id === id);
    
    if (!course) return <Navigate to="/" />;
    
    const hasAccess = currentUser?.purchasedCourseIds.includes(course.id) || 
                      (currentUser?.tempAccess?.[course.id] && new Date(currentUser.tempAccess[course.id]) > new Date());
    
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
                <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                     <div>
                         <p className="text-sm text-gray-500">Total Price</p>
                         <div className="text-2xl font-bold text-gray-900">{course.price === 0 ? 'FREE' : `₹${course.price}`} <span className="text-sm text-gray-400 line-through font-normal">₹{course.mrp}</span></div>
                     </div>
                     {!hasAccess ? (
                        <button onClick={() => { if(course.isPaid) alert("Please contact admin for access key."); else enrollCourse(course.id); }} className="bg-brand text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-dark shadow-lg shadow-brand/30 w-full md:w-auto">
                            {course.isPaid ? 'Unlock Now' : 'Join for Free'}
                        </button>
                     ) : (
                        <button className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold cursor-default shadow-lg shadow-green-600/30 w-full md:w-auto flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5" /> Enrolled
                        </button>
                     )}
                </div>
                
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
                                        <div key={j} className="p-4 flex gap-3 items-center hover:bg-gray-50 transition-colors">
                                            <PlayCircle className="w-5 h-5 text-gray-400" />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-gray-800">{vid.title}</p>
                                                <p className="text-xs text-gray-400">{vid.duration}</p>
                                            </div>
                                        </div>
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
                     <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900" value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="Name" />
                     <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} placeholder="Phone" />
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
        <Route path="/help" element={<div className="pt-24 px-6 text-center text-gray-500 font-bold">Help Center Coming Soon</div>} />
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
