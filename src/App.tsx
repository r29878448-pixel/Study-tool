
import React, { useEffect, useState, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { 
  Home, BookOpen, User, HelpCircle, Menu, LogOut, 
  Search, PlayCircle, Lock, Unlock, LayoutDashboard, Settings, Plus, Trash2, Edit, Save, X, ChevronDown, 
  MessageCircle, CheckCircle, FileText, Download, ClipboardList, Timer, Clock, Key, ExternalLink, Play, Bot, Brain, Loader2, ArrowLeft, Video as VideoIcon, Upload, Wand2, Maximize, Minimize, Bookmark, Sparkles, RotateCcw
} from './components/Icons';
import VideoPlayer from './components/VideoPlayer';
import ChatBot from './components/ChatBot';
import ExamMode from './components/ExamMode';
import { Course, Chapter, Video, UserRole, Banner, AppSettings, Exam, Question, SavedNote, Note, VideoBookmark } from './types';
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

const cleanJson = (text: string) => {
  try {
    let cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
    const firstBracket = cleaned.search(/\[|\{/);
    const lastBracket = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
    if (firstBracket !== -1 && lastBracket !== -1) {
       cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error", e);
    try { return JSON.parse(text); } catch (e2) { return []; }
  }
};

// --- Theme Handler ---
const ThemeHandler = () => {
  const { settings } = useStore();
  useEffect(() => {
    const root = document.documentElement;
    const hex = settings.uiColor || '#4F46E5';
    if (!hex.startsWith('#') || hex.length < 7) return;
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    const rDark = Math.floor(r * 0.9);
    const gDark = Math.floor(g * 0.9);
    const bDark = Math.floor(b * 0.9);
    const hexDark = '#' + [rDark, gDark, bDark].map(c => c.toString(16).padStart(2, '0')).join('');
    root.style.setProperty('--color-brand', hex);
    root.style.setProperty('--color-brand-dark', hexDark);
  }, [settings.uiColor]);
  return null;
};

const FuturisticBackground = () => (
  <div className="fixed inset-0 z-[-1] overflow-hidden bg-slate-50">
    <div className="absolute inset-0 futuristic-grid opacity-30 animate-move-grid"></div>
    <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-brand/20 blur-[100px] animate-blob"></div>
    <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-400/20 blur-[100px] animate-blob" style={{ animationDelay: '2s' }}></div>
    <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-blue-300/20 blur-[100px] animate-blob" style={{ animationDelay: '4s' }}></div>
    <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]"></div>
  </div>
);

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
    <div className="w-full my-6 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 overflow-hidden flex flex-col items-center justify-center min-h-[100px] text-center p-2 shadow-sm ring-1 ring-black/5">
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
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [expiryDate]);

  if (!timeLeft) return <span className="text-red-500 font-bold text-xs bg-red-50 px-3 py-1 rounded-lg">Access Expired</span>;

  return (
    <div className="flex gap-2 items-center font-display font-bold text-sm text-brand bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-brand/10 shadow-sm">
      <div className="flex items-center gap-1.5 text-brand-dark">
          <Clock className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Time Left</span>
      </div>
      <div className="flex items-center gap-1 font-mono text-base">
        <span className="bg-brand text-white px-2 py-0.5 rounded-md shadow-sm">{timeLeft.h.toString().padStart(2, '0')}</span>
        <span className="text-brand/50">:</span>
        <span className="bg-brand text-white px-2 py-0.5 rounded-md shadow-sm">{timeLeft.m.toString().padStart(2, '0')}</span>
        <span className="text-brand/50">:</span>
        <span className="bg-brand text-white px-2 py-0.5 rounded-md shadow-sm">{timeLeft.s.toString().padStart(2, '0')}</span>
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
      <header className={`fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100/50 text-gray-900' : 'bg-transparent text-gray-900'}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowMenu(true)} className={`p-2 rounded-xl transition-colors ${scrolled ? 'hover:bg-gray-100' : 'bg-white/60 hover:bg-white backdrop-blur-sm'}`}>
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
      {showMenu && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMenu(false)} />
          <div className="relative w-72 bg-white/95 backdrop-blur-xl h-full shadow-2xl flex flex-col animate-slide-in border-r border-white/50">
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
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 flex items-center justify-around z-40 pb-safe shadow-lg">
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

const Help = () => {
    const { settings } = useStore();
    const botUsername = settings.supportPhone.startsWith('@') ? settings.supportPhone.substring(1) : 'STUDY_PORTAL_ROBOT';
    return (
        <div className="pt-24 px-6 pb-20 min-h-screen flex flex-col items-center justify-center">
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 text-center w-full max-w-md animate-fade-in">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Bot className="w-10 h-10 text-brand" />
                </div>
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Need Help?</h2>
                <p className="text-gray-500 mb-8 text-sm">Facing issues with access, payments, or just want to report a bug? Contact our AI Support Bot or Admin directly on Telegram.</p>
                <a href={`https://t.me/${botUsername}`} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-[#229ED9] text-white rounded-2xl font-bold shadow-lg shadow-blue-400/30 flex items-center justify-center gap-2 hover:bg-[#1A87B9] transition-all transform hover:scale-[1.02]"><MessageCircle className="w-5 h-5" /> Chat on Telegram</a>
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
      const pendingCourse = localStorage.getItem('pendingCourseVerification');
      if (pendingCourse) { navigate(`/verify/${pendingCourse}`); return; }
      if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.EDITOR) navigate('/admin'); else navigate('/');
    }
  }, [currentUser, navigate]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup) signup(formData.name, formData.email, formData.phone, formData.password);
    else if (!login(formData.email, formData.password)) alert('Invalid credentials. Please try again.');
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
      <div className="mb-10 scale-150 z-10"><Logo dark={true} /></div>
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-glow w-full max-w-sm overflow-hidden z-10 border border-white/50">
        <div className="flex p-2 bg-gray-100/50 m-2 rounded-2xl">
          <button className={`flex-1 py-3 text-center font-bold text-sm rounded-xl transition-all ${!isSignup ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`} onClick={() => setIsSignup(false)}>LOGIN</button>
          <button className={`flex-1 py-3 text-center font-bold text-sm rounded-xl transition-all ${isSignup ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`} onClick={() => setIsSignup(true)}>SIGNUP</button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {isSignup && (<><input type="text" placeholder="Full Name" required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand transition-all text-gray-900" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /><input type="tel" placeholder="Phone Number" required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand transition-all text-gray-900" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></>)}
          <input type="text" placeholder="Email Address" required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand transition-all text-gray-900" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <input type="password" placeholder="Password" required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand transition-all text-gray-900" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <button className="w-full bg-gradient-to-r from-brand to-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-brand/30 hover:shadow-brand/40 active:scale-95 transition-all">{isSignup ? 'Start Learning' : 'Login'}</button>
          {!isSignup && (<div className="mt-6 text-center border-t pt-4 border-dashed border-gray-200"><button type="button" onClick={() => { if(confirm('RESET all data?')) { localStorage.clear(); window.location.reload(); } }} className="text-[10px] text-gray-400 hover:text-red-500 font-medium">Reset Application Data</button></div>)}
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
    const interval = setInterval(() => setActiveBanner(curr => (curr + 1) % banners.length), 4000);
    return () => clearInterval(interval);
  }, [banners.length]);
  return (
    <div className="pb-24 pt-20">
      <div className="px-4 mb-6">
        <div className="relative">
            <h1 className="text-2xl font-display font-bold text-gray-900 mb-4">Hello, {currentUser?.name.split(' ')[0] || 'Student'} 👋</h1>
            <input type="text" placeholder="What do you want to learn today?" className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all text-gray-900 placeholder:text-gray-500 font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <Search className="w-5 h-5 text-gray-400 absolute left-4 bottom-4" />
        </div>
      </div>
      {banners.length > 0 && (
        <div className="px-4">
            <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-lg">
            {banners.map((b, i) => (
                <img key={b.id} src={b.image} alt="Banner" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === activeBanner ? 'opacity-100' : 'opacity-0'}`} />
            ))}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 p-1 bg-black/20 backdrop-blur-sm rounded-full">
                {banners.map((_, i) => (<div key={i} className={`h-1.5 rounded-full transition-all ${i === activeBanner ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />))}
            </div>
            </div>
        </div>
      )}
      <div className="px-4"><AdContainer /></div>
      <div className="mt-4 pl-4">
        <div className="flex justify-between items-center mb-4 pr-4"><h2 className="text-lg font-display font-bold text-gray-900">Popular Batches</h2><Link to="/courses" className="text-brand text-xs font-bold bg-brand-light px-3 py-1.5 rounded-full hover:bg-brand/10 transition-colors">View All</Link></div>
        <div className="flex overflow-x-auto space-x-4 pb-8 pr-4 no-scrollbar">
          {courses.slice(0, 5).map(course => (
            <Link to={`/course/${course.id}`} key={course.id} className="flex-none w-72 bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div className="relative h-40 overflow-hidden"><img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /><div className="absolute top-0 inset-x-0 h-full bg-gradient-to-t from-black/60 to-transparent"></div><div className="absolute bottom-3 left-3 text-white"><span className="text-[10px] font-bold bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20 uppercase tracking-wide">{course.category}</span></div>{course.isPaid && (<div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1"><Lock className="w-3 h-3" /> PREMIUM</div>)}</div>
              <div className="p-5"><h3 className="font-bold text-gray-900 line-clamp-1 mb-1 text-lg font-display">{course.title}</h3><p className="text-gray-500 text-xs line-clamp-1 mb-4">{course.description}</p><div className="flex items-center justify-between"><div className="flex flex-col"><span className="text-[10px] text-gray-400 font-bold uppercase">Access</span><span className={`font-bold text-base ${course.isPaid ? 'text-gray-900' : 'text-green-600'}`}>{course.isPaid ? 'Key Locked' : 'Free'}</span></div><div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/30 group-hover:scale-110 transition-transform"><PlayCircle className="w-5 h-5" /></div></div></div>
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
  const filtered = courses.filter(c => filter === 'All' || c.category === filter).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return (
    <div className="pb-24 pt-24 p-4 min-h-screen">
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">{categories.map(cat => (<button key={cat} onClick={() => setFilter(cat)} className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${filter === cat ? 'bg-brand text-white shadow-brand/30' : 'bg-white/80 text-gray-600 hover:bg-gray-100'}`}>{cat}</button>))}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{filtered.length === 0 ? (<div className="col-span-2 text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400"><Search className="w-8 h-8"/></div><p className="text-gray-500 font-medium">No batches found.</p></div>) : filtered.map(course => (
          <Link to={`/course/${course.id}`} key={course.id} className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden flex flex-col group hover:-translate-y-1 transition-all duration-300">
            <div className="relative h-48 overflow-hidden"><img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /><div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div><div className="absolute bottom-3 left-3"><span className="bg-white/90 backdrop-blur text-brand-dark text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">{course.category}</span></div>{course.isPaid && <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-[10px] px-2 py-1 rounded-lg font-bold shadow-sm flex items-center gap-1"><Lock className="w-3 h-3"/> LOCKED</div>}</div>
            <div className="p-5 flex-1 flex flex-col"><h3 className="font-display font-bold text-gray-900 text-xl leading-tight mb-2 flex-1">{course.title}</h3><p className="text-gray-500 text-sm line-clamp-2 mb-4">{course.description}</p><div className="flex items-center justify-between pt-4 border-t border-gray-50"><div className="flex flex-col"><span className="text-[10px] text-gray-400 font-bold uppercase">Status</span><span className={`font-bold ${course.isPaid ? 'text-gray-900' : 'text-green-600'}`}>{course.isPaid ? 'Key Required' : 'Free Access'}</span></div><button className="bg-gray-900 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-brand transition-colors shadow-lg group-hover:shadow-xl">View Batch</button></div></div>
          </Link>
        ))}</div>
    </div>
  );
};

const Watch = () => {
    const { courseId } = useParams();
    const { courses, currentUser, saveVideoProgress, saveAiQuiz, saveNote } = useStore();
    const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizLoading, setQuizLoading] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const navigate = useNavigate();
    const course = courses.find(c => c.id === courseId);
    const allVideos: { video: Video, chapterId: string, chapterTitle: string }[] = [];
    course?.chapters.forEach(chap => chap.videos.forEach(vid => allVideos.push({ video: vid, chapterId: chap.id, chapterTitle: chap.title })));
    const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
    useEffect(() => { if(allVideos.length > 0) setCurrentVideo(allVideos[currentVideoIdx].video); }, [currentVideoIdx, courses]);
    const handleVideoProgress = (currentTime: number, duration: number) => { if (currentVideo) saveVideoProgress(currentVideo.id, currentTime, duration); };
    if (!currentUser) return <Navigate to="/login" />;
    if (!course) return <Navigate to="/" />;
    const hasAccess = currentUser.purchasedCourseIds.includes(course.id) || (currentUser.tempAccess?.[course.id] && new Date(currentUser.tempAccess[course.id]) > new Date());
    if (!hasAccess) return <Navigate to={`/course/${courseId}`} />;
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row h-screen overflow-hidden">
            <div className="flex-1 flex flex-col relative bg-black">
                <div className="flex-1 relative flex items-center justify-center">{currentVideo ? (<VideoPlayer src={currentVideo.filename} onProgress={handleVideoProgress} onBack={() => navigate(`/course/${courseId}`)} initialTime={currentUser.videoProgress?.[currentVideo.id]?.timestamp || 0} />) : <div className="text-gray-500">Select a video</div>}</div>
                <div className="p-4 bg-gray-900 border-t border-gray-800 flex justify-between items-center"><div><h1 className="text-xl font-bold">{currentVideo?.title}</h1><p className="text-gray-400 text-sm">{allVideos[currentVideoIdx]?.chapterTitle}</p></div></div>
            </div>
            <div className="w-full md:w-80 bg-gray-800 border-l border-gray-700 flex flex-col h-[40vh] md:h-full overflow-hidden">
                <div className="p-4 border-b border-gray-700"><h2 className="font-bold text-lg">Course Content</h2></div>
                <div className="flex-1 overflow-y-auto">{course.chapters.map((chap) => (<div key={chap.id}><div className="px-4 py-2 bg-gray-700/50 text-xs font-bold text-gray-300 uppercase">{chap.title}</div>{chap.videos.map((vid) => { const idx = allVideos.findIndex(v => v.video.id === vid.id); const isPlaying = idx === currentVideoIdx; return (<button key={vid.id} onClick={() => setCurrentVideoIdx(idx)} className={`w-full text-left p-3 flex gap-3 hover:bg-gray-700 border-b border-gray-700/50 ${isPlaying ? 'bg-gray-700 border-l-4 border-l-brand' : ''}`}><div className="mt-1">{isPlaying ? <PlayCircle className="w-4 h-4 text-brand" /> : <div className="w-4 h-4 rounded-full border border-gray-500" />}</div><div><p className={`text-sm font-medium ${isPlaying ? 'text-white' : 'text-gray-300'}`}>{vid.title}</p><p className="text-xs text-gray-500">{vid.duration}</p></div></button>); })}</div>))}</div>
            </div>
        </div>
    );
};

const Profile = () => {
   const { currentUser, updateUser, logout, deleteNote } = useStore();
   const [isEditing, setIsEditing] = useState(false);
   const [data, setData] = useState({ name: currentUser?.name || '', email: currentUser?.email || '', phone: currentUser?.phone || '' });
   if (!currentUser) return <Navigate to="/login" />;
   return (
      <div className="pb-24 pt-20 p-6 bg-gray-50 min-h-screen">
         <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-card border border-gray-100 overflow-hidden mb-6 relative">
            <div className="h-32 bg-gradient-to-r from-brand to-indigo-600"></div>
            <div className="px-8 pb-8">
                <div className="flex justify-between items-end -mt-12 mb-4"><div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-lg"><div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-brand text-3xl font-display font-bold">{currentUser.name.charAt(0).toUpperCase()}</div></div><button onClick={() => isEditing ? (updateUser(data), setIsEditing(false)) : setIsEditing(true)} className="text-brand font-bold text-sm bg-brand-light px-4 py-2 rounded-xl hover:bg-brand/10 transition-colors">{isEditing ? 'Save' : 'Edit'}</button></div>
               {!isEditing ? (<div><h2 className="text-2xl font-display font-bold text-gray-900">{currentUser.name}</h2><p className="text-gray-500 font-medium">{currentUser.email}</p></div>) : (<div className="space-y-4 mt-2"><input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={data.name} onChange={e => setData({...data, name: e.target.value})} /><input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} /></div>)}
            </div>
         </div>
         <button onClick={logout} className="w-full mt-8 py-4 text-red-600 font-bold bg-white/80 backdrop-blur border-2 border-red-50 rounded-2xl hover:bg-red-50 transition-colors shadow-sm flex items-center justify-center gap-2"><LogOut className="w-5 h-5" /> Logout</button>
      </div>
   );
};

const MyCourses = () => {
  const { currentUser, courses } = useStore();
  if (!currentUser) return <Navigate to="/login" />;
  const myCourses = courses.filter(c => currentUser.purchasedCourseIds.includes(c.id) || (currentUser.tempAccess?.[c.id] && new Date(currentUser.tempAccess[c.id]) > new Date()));
  return (
    <div className="pb-24 pt-24 p-6 min-h-screen">
       <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">My Batches</h1>
       {myCourses.length === 0 ? (<div className="text-center py-20 bg-white/80 rounded-3xl border border-dashed border-gray-200"><BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" /><p>No batches found.</p></div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-5">{myCourses.map(course => (<Link to={`/course/${course.id}`} key={course.id} className="bg-white/80 backdrop-blur rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex gap-4 p-4 hover:border-brand transition-colors group"><div className="w-24 h-24 rounded-xl overflow-hidden flex-none"><img src={course.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /></div><div className="flex-1 flex flex-col justify-center"><h3 className="font-bold text-gray-900 line-clamp-1">{course.title}</h3><p className="text-xs text-gray-500">{course.chapters.length} Chapters</p></div><div className="flex items-center justify-center"><div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center"><PlayCircle className="w-6 h-6" /></div></div></Link>))}</div>)}
    </div>
  );
};

const CourseDetail = () => {
    const { id } = useParams();
    const { courses, currentUser, enrollCourse } = useStore();
    const navigate = useNavigate();
    const course = courses.find(c => c.id === id);
    if (!course) return <div className="pt-24 text-center">Batch not found</div>;
    const expiryDate = currentUser?.tempAccess?.[course.id];
    const isTempAccessValid = expiryDate && new Date(expiryDate) > new Date();
    const isEnrolled = currentUser && (currentUser.purchasedCourseIds.includes(course.id) || isTempAccessValid);
    const handleEnroll = () => {
        if (!currentUser) { navigate('/login'); return; }
        if (!course.isPaid) { enrollCourse(course.id); alert('Enrolled!'); } else navigate(`/verify/${course.id}`);
    };
    return (
        <div className="pb-24 pt-0 min-h-screen">
            <div className="relative h-64 md:h-80"><img src={course.image} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div><div className="absolute bottom-0 left-0 right-0 p-6 text-white"><span className="bg-brand text-xs font-bold px-2 py-1 rounded mb-2 inline-block">{course.category}</span><h1 className="text-3xl font-display font-bold mb-2">{course.title}</h1></div><button onClick={() => navigate(-1)} className="absolute top-6 left-4 bg-black/30 p-2 rounded-full text-white backdrop-blur-sm"><ArrowLeft className="w-6 h-6"/></button></div>
            <div className="p-6 -mt-6 bg-gray-50 rounded-t-3xl relative z-10">
                {isTempAccessValid && <div className="mb-6 flex justify-center"><CountdownTimer expiryDate={expiryDate} /></div>}
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <div><p className="text-gray-500 text-sm font-bold uppercase">Price</p><p className="text-2xl font-bold text-gray-900">{course.isPaid ? `₹${course.price}` : 'Free'}</p></div>
                    {isEnrolled ? (<button className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"><CheckCircle className="w-5 h-5" /> {isTempAccessValid ? 'Access Active' : 'Enrolled'}</button>) : (
                        <div className="flex gap-2">
                            {course.isPaid && course.shortenerLink && (<a href={course.shortenerLink} target="_blank" rel="noopener noreferrer" className="bg-purple-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/30 hover:scale-105 transition-transform text-sm"><Unlock className="w-4 h-4" /> 24h Free Access</a>)}
                            <button onClick={handleEnroll} className="bg-brand text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-transform text-sm">{course.isPaid ? <Lock className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}{course.isPaid ? 'Unlock' : 'Start'}</button>
                        </div>
                    )}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-4">Course Content</h3>
                <div className="space-y-4">{course.chapters.map((chapter, idx) => (<div key={chapter.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden"><div className="p-4 bg-gray-50/50 border-b font-bold text-gray-800 flex justify-between"><span>{idx + 1}. {chapter.title}</span><span className="text-xs text-gray-500">{chapter.videos.length} Videos</span></div><div className="divide-y">{chapter.videos.map((video) => (<div key={video.id} onClick={() => isEnrolled ? navigate(`/watch/${course.id}`) : handleEnroll()} className={`p-4 flex items-center gap-3 hover:bg-gray-50 cursor-pointer ${!isEnrolled ? 'opacity-50' : ''}`}><div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center">{isEnrolled ? <PlayCircle className="w-5 h-5" /> : <Lock className="w-4 h-4" />}</div><div className="flex-1"><p className="text-sm font-medium text-gray-900">{video.title}</p></div></div>))}</div></div>))}</div>
            </div>
        </div>
    );
};

const VerifyAccess = () => {
    const { courseId } = useParams();
    const { courses, enrollCourse, currentUser } = useStore();
    const [key, setKey] = useState('');
    const navigate = useNavigate();
    const course = courses.find(c => c.id === courseId);
    if (!course) return <Navigate to="/" />;
    if (!currentUser) { localStorage.setItem('pendingCourseVerification', courseId || ''); return <Navigate to="/login" />; }
    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        if (key === course.accessKey) { enrollCourse(course.id); alert('Unlocked!'); navigate(`/course/${course.id}`); }
        else alert('Invalid Key');
    };
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl max-w-md w-full border">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600"><Lock className="w-8 h-8" /></div>
                <h2 className="text-2xl font-display font-bold text-center text-gray-900 mb-6">Unlock Batch</h2>
                <form onSubmit={handleVerify} className="space-y-4"><input type="text" placeholder="Enter Access Key" className="w-full p-4 bg-gray-50 border rounded-xl text-center font-mono text-lg uppercase" value={key} onChange={(e) => setKey(e.target.value)} /><button className="w-full py-4 bg-brand text-white rounded-xl font-bold shadow-lg">Unlock Now</button></form>
                <button onClick={() => navigate(-1)} className="w-full mt-4 text-gray-400 text-xs font-bold">Cancel</button>
            </div>
        </div>
    );
};

const TempAccess = () => {
    const { courseId } = useParams();
    const { grantTempAccess } = useStore();
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        if (courseId) {
            const timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(timer);
                        grantTempAccess(courseId);
                        setTimeout(() => navigate(`/course/${courseId}`), 500);
                        return 100;
                    }
                    return prev + 1; // 1% every 100ms = 10 seconds total
                });
            }, 100);
            return () => clearInterval(timer);
        }
    }, [courseId, grantTempAccess, navigate]);
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl max-w-sm w-full flex flex-col items-center border">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 relative"><Unlock className="w-10 h-10 text-green-600 relative z-10" /><svg className="absolute inset-0 w-full h-full -rotate-90"><circle cx="40" cy="40" r="36" stroke="#f0fdf4" strokeWidth="4" fill="none" /><circle cx="40" cy="40" r="36" stroke="#16a34a" strokeWidth="4" fill="none" strokeDasharray="226" strokeDashoffset={226 - (226 * progress) / 100} className="transition-all duration-300" /></svg></div>
                <h2 className="text-xl font-display font-bold text-gray-900 mb-2">Unlocking Access</h2>
                <p className="text-gray-500 text-sm mb-6">Verifying completion... please wait 10 seconds.</p>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden"><div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div></div>
                <p className="text-xs text-gray-400 font-bold">{progress}% Verified</p>
            </div>
        </div>
    );
};

const RevealKey = () => {
    const { key } = useParams();
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
            <div className="text-center"><h1 className="text-3xl font-bold mb-4">Access Key Revealed</h1><div className="bg-white/10 p-6 rounded-2xl border backdrop-blur-md"><code className="text-2xl font-mono text-yellow-400 tracking-wider select-all">{key}</code></div><Link to="/" className="inline-block mt-8 text-brand">Go to App</Link></div>
        </div>
    );
};

const ContentManager = ({ course, onClose }: { course: Course, onClose: () => void }) => {
    const { updateCourse } = useStore();
    const [chapters, setChapters] = useState<Chapter[]>(course.chapters);
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const handleSave = () => updateCourse({ ...course, chapters });
    const addChapter = () => { if(!newChapterTitle) return; setChapters([...chapters, { id: Date.now().toString(), title: newChapterTitle, videos: [], notes: [] }]); setNewChapterTitle(''); };
    const addVideo = (chapterId: string) => {
        const title = prompt('Video Title:');
        const url = prompt('Video URL:');
        if (title && url) setChapters(chapters.map(c => c.id === chapterId ? { ...c, videos: [...c.videos, { id: Date.now().toString(), title, filename: url, duration: '10:00' }] } : c));
    };
    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white w-full max-w-2xl rounded-3xl p-6 max-h-[85vh] flex flex-col"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Manage Content: {course.title}</h2><button onClick={onClose}><X className="w-5 h-5"/></button></div><div className="flex-1 overflow-y-auto pr-2"><div className="flex gap-2 mb-6"><input value={newChapterTitle} onChange={e => setNewChapterTitle(e.target.value)} placeholder="New Chapter" className="flex-1 p-3 bg-gray-50 rounded-xl border" /><button onClick={addChapter} className="bg-brand text-white px-4 rounded-xl font-bold">Add</button></div><div className="space-y-4">{chapters.map((chapter, idx) => (<div key={chapter.id} className="border rounded-xl overflow-hidden"><div className="bg-gray-50 p-4 flex justify-between items-center border-b"><span>{idx + 1}. {chapter.title}</span><div className="flex gap-2"><button onClick={() => addVideo(chapter.id)} className="text-xs bg-white border px-2 py-1 rounded font-bold">+ Video</button><button onClick={() => setChapters(chapters.filter(c => c.id !== chapter.id))} className="text-red-500"><Trash2 className="w-4 h-4"/></button></div></div><div className="p-2 space-y-1">{chapter.videos.map(video => (<div key={video.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg group"><span className="text-sm truncate">{video.title}</span><button onClick={() => setChapters(chapters.map(c => c.id === chapter.id ? { ...c, videos: c.videos.filter(v => v.id !== video.id) } : c))} className="text-gray-400 group-hover:text-red-500"><X className="w-4 h-4"/></button></div>))}</div></div>))}</div></div><div className="pt-4 border-t mt-4 flex justify-end gap-3"><button onClick={onClose} className="px-6 py-2 text-gray-500 font-bold">Cancel</button><button onClick={() => { handleSave(); onClose(); }} className="px-6 py-2 bg-brand text-white font-bold rounded-xl shadow-lg shadow-brand/20">Save Changes</button></div></div></div>
    );
};

const QuestionEditor = ({ exam, onSave, onCancel }: { exam: Exam, onSave: (e: Exam) => void, onCancel: () => void }) => {
    const [questions, setQuestions] = useState<Question[]>(exam.questions);
    const [qText, setQText] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [correct, setCorrect] = useState(0);
    const addQuestion = () => {
        if (!qText || options.some(o => !o)) return;
        setQuestions([...questions, { id: Date.now().toString(), question: qText, options: [...options], correctAnswer: correct }]);
        setQText(''); setOptions(['', '', '', '']); setCorrect(0);
    };
    return (
        <div className="flex flex-col h-full"><div className="flex items-center gap-2 mb-4"><button onClick={onCancel} className="text-gray-500"><ArrowLeft className="w-5 h-5"/></button><h3 className="font-bold text-lg">Editing: {exam.title}</h3></div><div className="flex-1 overflow-y-auto space-y-6"><div className="bg-gray-50 p-4 rounded-xl border"><textarea value={qText} onChange={e => setQText(e.target.value)} placeholder="Question" className="w-full p-3 rounded-lg border mb-3" /><div className="grid grid-cols-2 gap-2 mb-3">{options.map((opt, i) => (<div key={i} className="flex items-center gap-2"><input type="radio" checked={correct === i} onChange={() => setCorrect(i)} /><input value={opt} onChange={e => { const newOpts = [...options]; newOpts[i] = e.target.value; setOptions(newOpts); }} placeholder={`Option ${i+1}`} className="flex-1 p-2 rounded border" /></div>))}</div><button onClick={addQuestion} className="w-full py-2 bg-gray-800 text-white rounded-lg font-bold">Add Question</button></div><div className="space-y-3">{questions.map((q, i) => (<div key={q.id} className="p-3 border rounded-xl relative group"><p className="font-bold text-sm">{i+1}. {q.question}</p><button onClick={() => setQuestions(questions.filter(qu => qu.id !== q.id))} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></div>))}</div></div><div className="pt-4 border-t mt-4"><button onClick={() => onSave({ ...exam, questions })} className="w-full py-3 bg-brand text-white font-bold rounded-xl shadow-lg">Save Exam</button></div></div>
    );
};

const ExamManager = ({ course, onClose }: { course: Course, onClose: () => void }) => {
    const { updateCourse } = useStore();
    const [exams, setExams] = useState<Exam[]>(course.exams || []);
    const [editingExam, setEditingExam] = useState<Exam | null>(null);
    const handleSave = () => updateCourse({ ...course, exams });
    const addExam = () => { const title = prompt("Exam Title:"); if (title) setExams([...exams, { id: Date.now().toString(), title, questions: [] }]); };
    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white w-full max-w-3xl rounded-3xl p-6 max-h-[85vh] flex flex-col"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Manage Exams</h2><button onClick={onClose}><X className="w-5 h-5"/></button></div>{editingExam ? (<QuestionEditor exam={editingExam} onSave={(updated) => { setExams(exams.map(e => e.id === updated.id ? updated : e)); setEditingExam(null); }} onCancel={() => setEditingExam(null)} />) : (<div className="flex-1 overflow-y-auto"><button onClick={addExam} className="w-full py-3 border-2 border-dashed rounded-xl text-gray-400 font-bold hover:border-brand transition-colors mb-4 flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> New Exam</button><div className="space-y-3">{exams.map(exam => (<div key={exam.id} className="bg-gray-50 p-4 rounded-xl flex justify-between border"><div><h3 className="font-bold">{exam.title}</h3><p className="text-xs">{exam.questions.length} Questions</p></div><div className="flex gap-2"><button onClick={() => setEditingExam(exam)} className="px-3 py-1 bg-white border text-xs font-bold rounded hover:bg-brand hover:text-white transition-colors">Edit</button><button onClick={() => setExams(exams.filter(e => e.id !== exam.id))} className="text-red-500"><Trash2 className="w-4 h-4"/></button></div></div>))}</div></div>)}{!editingExam && (<div className="pt-4 border-t mt-4 flex justify-end gap-3"><button onClick={onClose} className="px-6 py-2 text-gray-500 font-bold">Cancel</button><button onClick={() => { handleSave(); onClose(); }} className="px-6 py-2 bg-brand text-white font-bold rounded-xl shadow-lg">Save Changes</button></div>)}</div></div>
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
    const [showEnrollModal, setShowEnrollModal] = useState<string | null>(null); 
    const linkInputRef = useRef<HTMLInputElement>(null);
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.EDITOR)) return <Navigate to="/" />;
    const handleSaveCourse = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data: any = { id: editingCourse?.id || Date.now().toString(), title: fd.get('title'), description: fd.get('description'), image: fd.get('image'), category: fd.get('category'), price: Number(fd.get('price')), mrp: Number(fd.get('mrp')), isPaid: fd.get('isPaid') === 'on', accessKey: fd.get('accessKey'), telegramChannelLink: fd.get('telegramChannelLink'), shortenerLink: linkInputRef.current?.value || editingCourse?.shortenerLink || '', chapters: editingCourse?.chapters || [], exams: editingCourse?.exams || [], createdAt: editingCourse?.createdAt || new Date().toISOString() };
        if (editingCourse) updateCourse(data); else addCourse(data);
        setShowCourseModal(false); setEditingCourse(null);
    };
    const handleGenerateLink = async () => {
        if(!settings.linkShortenerApiKey || !settings.linkShortenerApiUrl) { alert("Configure Link Shortener first!"); return; }
        const courseId = editingCourse?.id;
        if(!courseId) { alert("Save batch first!"); return; }
        setIsGeneratingLink(true);
        try {
            let baseUrl = settings.linkShortenerApiUrl.trim();
            if (!baseUrl.endsWith('/api') && !baseUrl.includes('/api?')) baseUrl = baseUrl.replace(/\/$/, '') + '/api';
            const destinationUrl = `${window.location.origin}/#/temp-access/${courseId}`;
            const encodedDest = encodeURIComponent(destinationUrl);
            const separator = baseUrl.includes('?') ? '&' : '?';
            const fetchUrl = `${baseUrl}${separator}api=${settings.linkShortenerApiKey}&url=${encodedDest}`;
            let response;
            try {
                response = await fetch(fetchUrl);
            } catch (corsErr) {
                // Common CORS issue: use a proxy
                response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(fetchUrl)}`);
                const proxyData = await response.json();
                const actualData = JSON.parse(proxyData.contents);
                if (actualData.status === 'success' || actualData.shortenedUrl) {
                   const shortUrl = actualData.shortenedUrl || actualData.shortlink || actualData.url;
                   if (linkInputRef.current) linkInputRef.current.value = shortUrl;
                   return;
                }
                throw new Error("Shortening failed");
            }
            const data = await response.json();
            if(data.status === 'success' || data.shortenedUrl || data.shortlink) {
                const shortUrl = data.shortenedUrl || data.shortlink || data.url;
                if(linkInputRef.current) linkInputRef.current.value = shortUrl;
            } else throw new Error(data.message || "Unknown error");
        } catch(e) {
            alert(`Manual shortening needed. URL: ${window.location.origin}/#/temp-access/${courseId}`);
        } finally { setIsGeneratingLink(false); }
    };
    return (
        <div className="pb-24 pt-24 p-6 min-h-screen">
             <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
                 {['courses', 'users', 'banners', 'settings'].map(t => (<button key={t} onClick={() => setTab(t as any)} className={`px-5 py-2 rounded-xl font-bold capitalize transition-all ${tab === t ? 'bg-brand text-white shadow-lg shadow-brand/30' : 'bg-white/80 text-gray-600 shadow-sm'}`}>{t}</button>))}
             </div>
             {tab === 'courses' && (
                 <div className="space-y-4">
                     <button onClick={() => { setEditingCourse(null); setShowCourseModal(true); }} className="w-full py-4 bg-white/70 border-2 border-dashed rounded-2xl text-gray-400 font-bold flex items-center justify-center gap-2 hover:border-brand hover:text-brand transition-all"><Plus className="w-5 h-5" /> New Batch</button>
                     {courses.map(c => (
                         <div key={c.id} className="bg-white/80 p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                             <img src={c.image} className="w-16 h-16 rounded-lg object-cover" />
                             <div className="flex-1"><h3 className="font-bold text-gray-900">{c.title}</h3><p className="text-xs text-gray-500">{c.chapters.length} Chapters • {c.isPaid ? `₹${c.price}` : 'Free'}</p></div>
                             <div className="flex gap-2">
                                 <button onClick={() => setShowContentManager(c)} className="px-3 py-2 text-green-700 bg-green-50 rounded-lg hover:bg-green-100 font-bold text-xs">Content</button>
                                 <button onClick={() => setShowExamManager(c)} className="p-2 text-purple-600 bg-purple-50 rounded-lg"><ClipboardList className="w-4 h-4" /></button>
                                 <button onClick={() => { setEditingCourse(c); setShowCourseModal(true); }} className="p-2 text-blue-600 bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                                 <button onClick={() => { if(confirm('Delete?')) deleteCourse(c.id); }} className="p-2 text-red-600 bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                             </div>
                         </div>
                     ))}
                 </div>
             )}
             {tab === 'users' && <div className="bg-white/80 rounded-3xl border overflow-hidden">{users.map(u => (<div key={u.id} className="p-4 flex justify-between items-center border-b"><div><div className="flex items-center gap-2"><p className="font-bold text-sm">{u.name}</p><span className="text-[10px] bg-gray-100 px-1 rounded uppercase">{u.role}</span></div><p className="text-xs text-gray-500">{u.email}</p></div><button onClick={() => setShowEnrollModal(u.id)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded">Enroll</button></div>))}</div>}
             {tab === 'settings' && <div className="bg-white/80 p-6 rounded-3xl border"><form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); updateSettings({ ...settings, appName: fd.get('appName') as string, adminEmail: fd.get('adminEmail') as string, supportPhone: fd.get('supportPhone') as string, uiColor: fd.get('uiColor') as string, linkShortenerApiUrl: fd.get('linkShortenerApiUrl') as string, linkShortenerApiKey: fd.get('linkShortenerApiKey') as string, adsCode: fd.get('adsCode') as string }); alert('Saved!'); }} className="space-y-4"><div><label className="text-xs font-bold text-gray-500">App Name</label><input name="appName" defaultValue={settings.appName} className="w-full p-3 bg-gray-50 border rounded-xl" /></div><div><label className="text-xs font-bold text-gray-500">Color</label><input type="color" name="uiColor" defaultValue={settings.uiColor} className="w-full h-10 rounded-lg" /></div><div className="p-4 bg-gray-50 rounded-xl border"><h4>Link Shortener</h4><input name="linkShortenerApiUrl" defaultValue={settings.linkShortenerApiUrl} placeholder="URL" className="w-full p-3 border rounded-xl mb-2" /><input name="linkShortenerApiKey" defaultValue={settings.linkShortenerApiKey} placeholder="API Key" className="w-full p-3 border rounded-xl" /></div><div><label className="text-xs font-bold text-gray-500">Ads HTML</label><textarea name="adsCode" defaultValue={settings.adsCode} className="w-full p-3 border rounded-xl" rows={3} /></div><button className="w-full bg-brand text-white py-3 rounded-xl font-bold">Save</button></form></div>}
             {showCourseModal && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white w-full max-w-lg rounded-3xl p-6 overflow-y-auto"><h2 className="text-xl font-bold mb-4">{editingCourse ? 'Edit Batch' : 'New Batch'}</h2><form onSubmit={handleSaveCourse} className="space-y-3"><input name="title" defaultValue={editingCourse?.title} placeholder="Title" className="w-full p-3 bg-gray-50 rounded-xl border" required /><textarea name="description" defaultValue={editingCourse?.description} placeholder="Description" className="w-full p-3 bg-gray-50 rounded-xl border" rows={2} /><input name="image" defaultValue={editingCourse?.image} placeholder="Image URL" className="w-full p-3 bg-gray-50 rounded-xl border" /><input name="category" defaultValue={editingCourse?.category} placeholder="Category" className="w-full p-3 bg-gray-50 rounded-xl border" /><div className="grid grid-cols-2 gap-3"><input type="number" name="price" defaultValue={editingCourse?.price} placeholder="Price" className="w-full p-3 bg-gray-50 border rounded-xl" /><input type="number" name="mrp" defaultValue={editingCourse?.mrp} placeholder="MRP" className="w-full p-3 bg-gray-50 border rounded-xl" /></div><div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl"><input type="checkbox" name="isPaid" defaultChecked={editingCourse?.isPaid} id="isPaid" /><label htmlFor="isPaid">Premium Course</label></div><input name="accessKey" defaultValue={editingCourse?.accessKey} placeholder="Key" className="w-full p-3 bg-gray-50 rounded-xl border" /><div className="flex gap-2"><input name="shortenerLink" ref={linkInputRef} defaultValue={editingCourse?.shortenerLink} placeholder="Short Link" className="flex-1 p-3 bg-gray-50 rounded-xl border" />{editingCourse && (<button type="button" onClick={handleGenerateLink} disabled={isGeneratingLink} className="bg-gray-100 text-gray-600 px-3 rounded-xl font-bold text-xs">{isGeneratingLink ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Generate'}</button>)}</div><div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowCourseModal(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100">Cancel</button><button type="submit" className="flex-1 py-3 bg-brand text-white font-bold rounded-xl">Save</button></div></form></div></div>)}
             {showEnrollModal && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl"><h2 className="text-xl font-bold mb-4">Enroll User</h2><div className="space-y-2 max-h-[60vh] overflow-y-auto">{courses.map(c => (<button key={c.id} onClick={() => { addCourseToUser(showEnrollModal, c.id); setShowEnrollModal(null); }} className="w-full text-left p-3 rounded-xl border hover:bg-gray-50 text-sm font-bold text-gray-700">{c.title}</button>))}</div><button onClick={() => setShowEnrollModal(null)} className="w-full mt-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl">Cancel</button></div></div>)}
             {showExamManager && <ExamManager course={showExamManager} onClose={() => setShowExamManager(null)} />}
             {showContentManager && <ContentManager course={showContentManager} onClose={() => setShowContentManager(null)} />}
        </div>
    );
};

const MainContent = () => {
  const location = useLocation();
  const isFullScreen = location.pathname.startsWith('/watch') || location.pathname.startsWith('/exam') || location.pathname === '/login' || location.pathname.startsWith('/temp-access');
  return (
    <>
      <FuturisticBackground />
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
        <Route path="/temp-access/:courseId" element={<TempAccess />} />
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
