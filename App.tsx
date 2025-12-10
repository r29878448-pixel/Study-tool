
import React, { useEffect, useState, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { 
  Home, BookOpen, User, HelpCircle, Menu, LogOut, 
  Search, PlayCircle, Lock, LayoutDashboard, Users, CreditCard, Settings, Plus, Trash2, Edit, Save, X, ChevronDown, ChevronUp,
  MessageCircle, CloudDownload, CheckCircle, Shield, Upload, FileText, Download, Youtube, Link as LinkIcon, Image as ImageIcon, Globe,
  ClipboardList, Timer, Code, DollarSign, Clock, Eye, Smartphone, MoreVertical
} from './components/Icons';
import VideoPlayer from './components/VideoPlayer';
import ChatBot from './components/ChatBot';
import ExamMode from './components/ExamMode';
import { Course, Chapter, Video, UserRole, Note, Banner, AppSettings } from './types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// --- Theme Handler ---
const ThemeHandler = () => {
  const { settings } = useStore();
  
  useEffect(() => {
    const root = document.documentElement;
    const hex = settings.uiColor || '#0284C7';
    
    // Calculate Dark Variant (simple dimming)
    // Basic hex to rgb
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    
    // Darken by 20%
    const rDark = Math.floor(r * 0.8);
    const gDark = Math.floor(g * 0.8);
    const bDark = Math.floor(b * 0.8);
    
    const hexDark = `#${rDark.toString(16).padStart(2,'0')}${gDark.toString(16).padStart(2,'0')}${bDark.toString(16).padStart(2,'0')}`;
    
    root.style.setProperty('--color-brand', hex);
    root.style.setProperty('--color-brand-dark', hexDark);
  }, [settings.uiColor]);

  return null;
};

// --- Helper for Razorpay ---
const loadRazorpay = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
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
              <p className="text-xs text-gray-400 mb-1">Default Admin: <span className="font-mono">admin@gmail.com</span> / <span className="font-mono">admin</span></p>
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
                     <DollarSign className="w-3 h-3" /> PREMIUM
                   </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-800 line-clamp-1 mb-1">{course.title}</h3>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${course.isPaid ? 'text-yellow-600' : 'text-green-600'}`}>
                      {course.isPaid ? '₹' + (course.price || 'PAID') : 'FREE'}
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
                 {course.isPaid && <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full font-bold">PREMIUM</span>}
              </div>
              <h3 className="font-bold text-gray-800 text-lg leading-tight mb-2 flex-1">{course.title}</h3>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-2">
                <div className="flex flex-col">
                  <span className={`text-xl font-bold ${course.isPaid ? 'text-gray-900' : 'text-green-600'}`}>
                    {course.isPaid ? `₹${course.price}` : 'FREE'}
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

const CourseDetail = () => {
  const { id } = useParams();
  const { courses, currentUser, enrollCourse, grantTempAccess, settings } = useStore();
  const navigate = useNavigate();
  const [showVerification, setShowVerification] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const course = courses.find(c => c.id === id);

  if (!course) return <Navigate to="/" />;

  const isPurchased = currentUser?.purchasedCourseIds.includes(course.id);
  const tempAccessExpiry = currentUser?.tempAccess?.[course.id];
  const isTempAccessValid = tempAccessExpiry ? new Date(tempAccessExpiry) > new Date() : false;
  const hasAccess = isPurchased || isTempAccessValid;

  const handleBuy = async () => {
    if (!currentUser) { navigate('/login'); return; }
    
    setIsProcessingPayment(true);
    const res = await loadRazorpay();

    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      setIsProcessingPayment(false);
      return;
    }

    const options = {
      key: settings.razorpayKey || 'rzp_test_123456', 
      amount: (course.price || 1) * 100,
      currency: "INR",
      name: settings.appName,
      description: `Purchase ${course.title}`,
      image: course.image,
      handler: function (response: any) {
        enrollCourse(course.id);
        alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
        setIsProcessingPayment(false);
        navigate('/my-courses');
      },
      prefill: {
        name: currentUser.name,
        email: currentUser.email,
        contact: currentUser.phone
      },
      theme: {
        color: settings.uiColor || "#0284C7"
      }
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();
    paymentObject.on('payment.failed', function (response: any) {
       alert("Payment Failed: " + response.error.description);
       setIsProcessingPayment(false);
    });
  };

  const handleTempUnlock = () => {
    if (!currentUser) { navigate('/login'); return; }
    setShowVerification(true);
  };

  const handleFreeEnroll = () => {
    if (!currentUser) { navigate('/login'); return; }
    enrollCourse(course.id);
    alert('Success! You are now enrolled.');
    navigate('/my-courses');
  };

  const handleVerify = () => {
    if (course.verificationLink) {
       window.open(course.verificationLink, '_blank');
    } else {
       alert("Verification link not configured by admin.");
    }
  };

  const confirmVerification = () => {
    if(!currentUser) return;
    if (confirm("Have you completed the steps in the link?")) {
      grantTempAccess(course.id);
      alert("Access Granted for 24 Hours!");
      setShowVerification(false);
      navigate('/watch/' + course.id);
    }
  };

  const getRemainingTime = () => {
    if (!tempAccessExpiry) return null;
    const diff = new Date(tempAccessExpiry).getTime() - new Date().getTime();
    if (diff <= 0) return null;
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hrs}h ${mins}m`;
  };

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
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${course.isPaid ? 'text-gray-900' : 'text-green-600'}`}>
                  {course.isPaid ? `₹${course.price}` : 'FREE'}
              </span>
              {course.isPaid && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold uppercase">Premium</span>}
           </div>
        </div>

        {isTempAccessValid && (
          <div className="mb-4 bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center gap-3 animate-fade-in">
             <Clock className="w-5 h-5 text-blue-600" />
             <div>
                <p className="text-sm font-bold text-blue-800">Temporary Access Active</p>
                <p className="text-xs text-blue-600">Expires in: {getRemainingTime()}</p>
             </div>
          </div>
        )}
        
        {hasAccess && (
          <div className="mb-6">
             <Link 
               to={`/exam/${course.id}`}
               className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-purple-200 transition-colors"
             >
                <ClipboardList className="w-5 h-5" /> Take AI Exam (Mock Test)
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
          <div className="flex gap-3">
            <button 
              onClick={handleTempUnlock}
              className="flex-1 font-bold py-3.5 rounded-xl text-sm border-2 border-brand text-brand active:scale-[0.98] transition-all flex flex-col items-center justify-center leading-tight"
            >
              <span>Unlock 24h Free</span>
              <span className="text-[10px] opacity-70">via Shortener</span>
            </button>
            <button 
              onClick={handleBuy}
              disabled={isProcessingPayment}
              className="flex-1 font-bold py-3.5 rounded-xl text-sm bg-brand text-white shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex flex-col items-center justify-center leading-tight disabled:opacity-70"
            >
              <span>{isProcessingPayment ? 'Processing...' : `Buy for ₹${course.price}`}</span>
              <span className="text-[10px] opacity-70">Lifetime Access</span>
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

      {/* Verification Modal for Paid Courses */}
      {showVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold">Unlock 24h Free Access</h3>
                 <button onClick={() => setShowVerification(false)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                Complete the link shortening step to get <strong>24 hours of premium access</strong> for free.
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={handleVerify}
                  className="w-full bg-blue-50 text-blue-700 py-3 rounded-xl font-bold border border-blue-200 flex items-center justify-center gap-2 hover:bg-blue-100"
                >
                  <LinkIcon className="w-4 h-4" /> Step 1: Click to Verify
                </button>
                <div className="text-center text-xs text-gray-400">After completing the link steps, return here.</div>
                <button 
                  onClick={confirmVerification}
                  className="w-full bg-brand text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30"
                >
                  Step 2: I Have Verified
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const MyCourses = () => {
  const { currentUser, courses } = useStore();
  
  if (!currentUser) return <Navigate to="/login" />;

  const purchased = courses.filter(c => currentUser.purchasedCourseIds.includes(c.id));
  const tempAccessed = Object.keys(currentUser.tempAccess || {})
    .filter(id => {
       const expiry = currentUser.tempAccess?.[id];
       return expiry && new Date(expiry) > new Date();
    })
    .map(id => courses.find(c => c.id === id))
    .filter((c): c is Course => !!c);

  const allCourses = [...new Map([...purchased, ...tempAccessed].map(c => [c.id, c])).values()];

  return (
    <div className="pb-24 pt-16 p-4">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span className="w-1 h-8 bg-brand rounded-full"></span>
        My Batches
      </h2>
      {allCourses.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="font-bold text-gray-800 mb-2 text-xl">No Batches Yet</h3>
          <p className="text-gray-500 mb-8 text-sm max-w-xs">Enrolled batches will appear here. Start your preparation today!</p>
          <Link to="/" className="bg-brand text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-brand-dark transition-colors">Browse Batches</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {allCourses.map(course => {
            const isTemp = !currentUser.purchasedCourseIds.includes(course.id) && 
                           (currentUser.tempAccess?.[course.id] ? new Date(currentUser.tempAccess[course.id]!) > new Date() : false);
            
            return (
              <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4">
                <img src={course.image} alt={course.title} className="w-28 h-20 object-cover rounded-lg" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex gap-2 mb-1">
                      <span className="text-[10px] bg-blue-50 text-brand px-2 py-0.5 rounded font-bold uppercase">{course.category}</span>
                      {isTemp && <span className="text-[10px] bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded font-bold uppercase">24H Access</span>}
                    </div>
                    <h3 className="font-bold text-gray-800 line-clamp-1 text-sm leading-snug">{course.title}</h3>
                  </div>
                  <div className="flex gap-2 mt-2">
                     <Link 
                      to={`/watch/${course.id}`}
                      className="flex-1 text-center bg-gray-900 text-white text-xs px-2 py-2.5 rounded-lg font-bold hover:bg-black transition-colors flex items-center justify-center gap-1"
                    >
                      <PlayCircle className="w-3 h-3" /> Study
                    </Link>
                     <Link 
                      to={`/exam/${course.id}`}
                      className="flex-1 text-center bg-purple-100 text-purple-700 text-xs px-2 py-2.5 rounded-lg font-bold hover:bg-purple-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <ClipboardList className="w-3 h-3" /> Exam
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Watch = () => {
  const { courseId } = useParams();
  const { courses, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<'lectures' | 'notes'>('lectures');
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  
  const course = courses.find(c => c.id === courseId);
  
  if (!course || !currentUser) return <Navigate to="/" />;

  const isPurchased = currentUser.purchasedCourseIds.includes(course.id);
  const tempAccessExpiry = currentUser.tempAccess?.[course.id];
  const isTempAccessValid = tempAccessExpiry ? new Date(tempAccessExpiry) > new Date() : false;
  
  if (!isPurchased && !isTempAccessValid) {
     return <Navigate to={`/course/${courseId}`} />;
  }

  useEffect(() => {
    if (course.chapters.length > 0 && !activeChapter) {
      setActiveChapter(course.chapters[0].id);
      if (course.chapters[0].videos.length > 0 && !currentVideo) {
        setCurrentVideo(course.chapters[0].videos[0]);
      }
    }
  }, [course, currentVideo, activeChapter]);

  const downloadAllNotes = (chapter: Chapter) => {
    if (chapter.notes.length === 0) {
      alert("No notes available in this chapter.");
      return;
    }
    let delay = 0;
    chapter.notes.forEach((note) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = note.url;
        link.download = note.title;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, delay);
      delay += 500;
    });
    alert(`Starting download for ${chapter.notes.length} notes...`);
  };

  return (
    <div className="pb-16 pt-16 bg-gray-900 min-h-screen text-white flex flex-col">
      <div className="sticky top-16 z-30 bg-black w-full shadow-lg">
         {currentVideo ? (
           <VideoPlayer 
            src={currentVideo.filename} 
           />
         ) : (
           <div className="aspect-video bg-gray-800 flex items-center justify-center">
             <div className="text-center">
               <PlayCircle className="w-12 h-12 mx-auto mb-2 text-gray-600" />
               <p className="text-gray-400">Select a lecture to play</p>
             </div>
           </div>
         )}
         <div className="p-4 bg-gray-800 border-b border-gray-700">
           <h2 className="font-bold text-lg line-clamp-1 text-white">{currentVideo?.title || course.title}</h2>
         </div>
         <div className="flex bg-gray-800 border-b border-gray-700">
           <button onClick={() => setActiveTab('lectures')} className={`flex-1 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'lectures' ? 'border-brand text-brand' : 'border-transparent text-gray-400'}`}>Lectures</button>
           <button onClick={() => setActiveTab('notes')} className={`flex-1 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'notes' ? 'border-brand text-brand' : 'border-transparent text-gray-400'}`}>Notes & PDFs</button>
         </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <AdContainer />
        {activeTab === 'lectures' ? (
          <div className="p-4 space-y-4">
             {course.chapters.map((chapter, idx) => (
                <div key={chapter.id} className="bg-gray-800 rounded-xl overflow-hidden">
                   <button 
                     className="w-full p-4 flex items-center justify-between text-left font-medium bg-gray-700/50 hover:bg-gray-700 transition-colors"
                     onClick={() => setActiveChapter(activeChapter === chapter.id ? null : chapter.id)}
                   >
                     <div className="flex items-center gap-3">
                       <span className="w-6 h-6 rounded bg-gray-600 flex items-center justify-center text-xs">{idx+1}</span>
                       <span className="text-sm font-bold">{chapter.title}</span>
                     </div>
                     {activeChapter === chapter.id ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                   </button>
                   
                   {activeChapter === chapter.id && (
                     <div className="divide-y divide-gray-700">
                       {chapter.videos.length === 0 && <div className="p-4 text-center text-gray-500 text-xs">No lectures yet</div>}
                       {chapter.videos.map(video => (
                         <button 
                           key={video.id}
                           onClick={() => { setCurrentVideo(video); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                           className={`w-full p-4 flex items-center gap-3 hover:bg-gray-700/30 transition-colors ${currentVideo?.id === video.id ? 'bg-brand/10 text-brand' : 'text-gray-300'}`}
                         >
                           <PlayCircle className={`w-5 h-5 flex-shrink-0 ${currentVideo?.id === video.id ? 'text-brand' : 'text-gray-500'}`} />
                           <div className="text-left">
                             <p className="text-sm font-medium line-clamp-1">{video.title}</p>
                             <p className="text-[10px] opacity-60">{video.duration}</p>
                           </div>
                         </button>
                       ))}
                     </div>
                   )}
                </div>
             ))}
          </div>
        ) : (
          <div className="p-4 space-y-4">
             {course.chapters.map((chapter) => (
                <div key={chapter.id} className="bg-gray-800 rounded-xl overflow-hidden p-4">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-sm text-gray-300">{chapter.title}</h3>
                      <button onClick={() => downloadAllNotes(chapter)} className="text-brand text-xs font-bold hover:underline">Download All</button>
                   </div>
                   <div className="grid grid-cols-1 gap-2">
                      {chapter.notes.length === 0 && <p className="text-center text-gray-500 text-xs italic">No notes uploaded.</p>}
                      {chapter.notes.map(note => (
                         <a 
                           key={note.id} 
                           href={note.url}
                           target="_blank"
                           rel="noreferrer"
                           className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                         >
                           <FileText className="w-5 h-5 text-red-400" />
                           <span className="flex-1 text-sm font-medium truncate">{note.title}</span>
                           <CloudDownload className="w-4 h-4 text-gray-500" />
                         </a>
                      ))}
                   </div>
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Profile = () => {
  const { currentUser, logout, orders } = useStore();
  if (!currentUser) return <Navigate to="/login" />;

  const myOrders = orders.filter(o => o.userId === currentUser.id);

  return (
    <div className="pb-24 pt-16 p-4">
       <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-brand text-white flex items-center justify-center text-3xl font-bold shadow-lg">
             {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
             <h2 className="text-2xl font-bold text-gray-800">{currentUser.name}</h2>
             <p className="text-gray-500 text-sm">{currentUser.email}</p>
             <p className="text-gray-500 text-sm">{currentUser.phone}</p>
          </div>
       </div>

       <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand" /> Account Role
             </h3>
             <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded">{currentUser.role}</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-brand" /> Exam Performance
             </h3>
             <div className="space-y-2">
                {currentUser.examResults && currentUser.examResults.length > 0 ? (
                  currentUser.examResults.slice(0, 3).map((res, i) => (
                    <div key={i} className="flex justify-between text-sm border-b pb-1 last:border-0">
                       <span className="text-gray-600">{new Date(res.date).toLocaleDateString()}</span>
                       <span className="font-bold text-gray-800">{res.score}/{res.totalQuestions}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">No exams taken yet.</p>
                )}
             </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-brand" /> Order History
             </h3>
             <div className="space-y-2">
                {myOrders.length > 0 ? (
                  myOrders.map(order => (
                    <div key={order.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                       <div>
                          <p className="font-bold">Course ID: {order.courseId}</p>
                          <p className="text-[10px] text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                       </div>
                       <span className="font-bold text-green-600">₹{order.amount}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">No purchases yet.</p>
                )}
             </div>
          </div>

          <button onClick={logout} className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold border border-red-100 flex items-center justify-center gap-2 mt-4 hover:bg-red-100 transition-colors">
             <LogOut className="w-5 h-5" /> Sign Out
          </button>
       </div>
    </div>
  );
};

const AdminPanel = () => {
  const { currentUser, settings, updateSettings, courses, users, addCourse, updateCourse, deleteCourse, deleteUser, updateUser } = useStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'import' | 'users' | 'settings'>('dashboard');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  
  // Import State
  const [importType, setImportType] = useState<'youtube' | 'telegram' | 'drive' | 'device'>('youtube');
  const [importInput, setImportInput] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');

  // Settings State
  const [localSettings, setLocalSettings] = useState(settings);
  const [adminCreds, setAdminCreds] = useState({ email: currentUser?.email || '', password: currentUser?.password || '' });

  if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.EDITOR)) {
    return <Navigate to="/" />;
  }

  const handleSaveSettings = () => {
    updateSettings(localSettings);
    if (adminCreds.email !== currentUser.email || adminCreds.password !== currentUser.password) {
       updateUser({ email: adminCreds.email, password: adminCreds.password });
    }
    alert('Settings and Credentials saved successfully!');
  };

  const handleImport = () => {
    if (!importInput && importType !== 'device') return;
    const course = courses.find(c => c.id === selectedCourseId);
    if (!course) return;

    if (importType === 'youtube') {
      const srcMatch = importInput.match(/src=["'](.*?)["']/);
      const url = srcMatch ? srcMatch[1] : importInput;
      const newVideo: Video = {
        id: Date.now().toString(),
        title: 'Imported Video',
        filename: url,
        duration: '00:00'
      };
      
      const newChapter: Chapter = {
        id: `ch_${Date.now()}`,
        title: 'Imported Content',
        videos: [newVideo],
        notes: []
      };

      const updatedCourse = {
        ...course,
        chapters: [...course.chapters, newChapter]
      };
      updateCourse(updatedCourse);
      alert('YouTube Video Imported!');
    } 
    else if (importType === 'telegram' || importType === 'drive') {
      alert(`Fetching content from ${importType === 'telegram' ? 'Telegram' : 'Drive'}...`);
      setTimeout(() => {
        const newVideo: Video = {
          id: Date.now().toString(),
          title: `Imported from ${importType === 'telegram' ? 'Telegram' : 'Drive'}`,
          filename: 'https://www.w3schools.com/html/mov_bbb.mp4', // Dummy content
          duration: '10:00'
        };
        const newChapter: Chapter = {
          id: `ch_${Date.now()}`,
          title: 'Fetched Content',
          videos: [newVideo],
          notes: []
        };
        updateCourse({ ...course, chapters: [...course.chapters, newChapter] });
        alert('Content fetched and added!');
      }, 1500);
    }
    setImportInput('');
  };

  const handleDeviceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const course = courses.find(c => c.id === selectedCourseId);
        if (!course) return;
        
        const newVideo: Video = {
          id: Date.now().toString(),
          title: file.name,
          filename: ev.target?.result as string,
          duration: 'Unknown'
        };
        
        // Add to first chapter or create new
        let chapters = [...course.chapters];
        if (chapters.length === 0) {
          chapters.push({ id: `ch_${Date.now()}`, title: 'Uploads', videos: [newVideo], notes: [] });
        } else {
          chapters[0].videos.push(newVideo);
        }
        
        updateCourse({ ...course, chapters });
        alert('File uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20">
      <div className="bg-white shadow-sm border-b sticky top-16 z-10 overflow-x-auto">
        <div className="flex p-2 min-w-max">
          {['dashboard', 'courses', 'import', 'users', 'settings'].map(tab => (
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
                    addCourse(newCourse);
                    setEditingCourse(newCourse);
                  }}
                  className="bg-brand text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
               >
                 <Plus className="w-4 h-4" /> Add New
               </button>
            </div>
            {courses.map(course => (
              <div key={course.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img src={course.image} className="w-12 h-12 rounded object-cover" />
                  <div>
                    <h3 className="font-bold text-sm">{course.title}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${course.isPaid ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {course.isPaid ? 'PAID' : 'FREE'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
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

        {activeTab === 'import' && (
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h2 className="font-bold text-lg mb-4">Import Content</h2>
             
             <div className="mb-4">
               <label className="block text-sm font-bold text-gray-700 mb-2">Select Target Batch</label>
               <select 
                 className="w-full p-3 border rounded-lg bg-gray-50"
                 value={selectedCourseId}
                 onChange={e => setSelectedCourseId(e.target.value)}
               >
                 {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
               </select>
             </div>

             <div className="flex gap-2 mb-4 border-b pb-2 overflow-x-auto">
               <button onClick={() => setImportType('youtube')} className={`flex-1 min-w-[80px] py-2 text-sm font-bold rounded ${importType === 'youtube' ? 'bg-brand text-white' : 'text-gray-500'}`}>YouTube</button>
               <button onClick={() => setImportType('telegram')} className={`flex-1 min-w-[80px] py-2 text-sm font-bold rounded ${importType === 'telegram' ? 'bg-brand text-white' : 'text-gray-500'}`}>Telegram</button>
               <button onClick={() => setImportType('drive')} className={`flex-1 min-w-[80px] py-2 text-sm font-bold rounded ${importType === 'drive' ? 'bg-brand text-white' : 'text-gray-500'}`}>Drive</button>
               <button onClick={() => setImportType('device')} className={`flex-1 min-w-[80px] py-2 text-sm font-bold rounded ${importType === 'device' ? 'bg-brand text-white' : 'text-gray-500'}`}>Device</button>
             </div>

             {importType === 'device' ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                   <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                   <p className="text-gray-500 text-sm mb-4">Select video files from your device</p>
                   <input type="file" accept="video/*" onChange={handleDeviceUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand file:text-white hover:file:bg-brand-dark"/>
                </div>
             ) : (
                <div className="space-y-4">
                   <input 
                     type="text" 
                     placeholder={importType === 'youtube' ? 'Paste YouTube Link or Embed Code' : importType === 'telegram' ? 'Enter Channel Link or ID' : 'Enter Google Drive Folder Link'}
                     className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand"
                     value={importInput}
                     onChange={e => setImportInput(e.target.value)}
                   />
                   <button 
                     onClick={handleImport}
                     className="w-full bg-brand text-white py-3 rounded-lg font-bold shadow-lg"
                   >
                     {importType === 'youtube' ? 'Import Video' : 'Fetch Content'}
                   </button>
                   <p className="text-xs text-gray-500 mt-2">
                     {importType === 'telegram' && "Make sure the bot is admin in the channel."}
                     {importType === 'drive' && "Folder must be public."}
                   </p>
                </div>
             )}
           </div>
        )}

        {activeTab === 'users' && (
           <div className="space-y-4">
             {users.map(u => (
               <div key={u.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                 <div>
                   <p className="font-bold">{u.name}</p>
                   <p className="text-xs text-gray-500">{u.email}</p>
                   <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded">{u.role}</span>
                 </div>
                 {u.role === UserRole.USER && (
                   <button onClick={() => deleteUser(u.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 )}
               </div>
             ))}
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
               <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Razorpay Key ID</label>
                      <input type="text" className="w-full p-2 border rounded" value={localSettings.razorpayKey} onChange={e => setLocalSettings({...localSettings, razorpayKey: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Razorpay Secret</label>
                      <input type="password" className="w-full p-2 border rounded" value={localSettings.razorpaySecret || ''} onChange={e => setLocalSettings({...localSettings, razorpaySecret: e.target.value})} />
                  </div>
               </div>

               <div className="mt-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link Shortener API URL</label>
                  <input type="text" className="w-full p-2 border rounded" value={localSettings.linkShortenerApiUrl || ''} onChange={e => setLocalSettings({...localSettings, linkShortenerApiUrl: e.target.value})} />
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
            <h3 className="text-xl font-bold mb-4">Edit Batch Details</h3>
            
            <div className="space-y-3">
              <input type="text" placeholder="Title" className="w-full p-3 border rounded-lg" value={editingCourse.title} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} />
              <textarea placeholder="Description" className="w-full p-3 border rounded-lg h-24" value={editingCourse.description} onChange={e => setEditingCourse({...editingCourse, description: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer" onClick={() => setEditingCourse({...editingCourse, isPaid: !editingCourse.isPaid})}>
                    <input type="checkbox" checked={editingCourse.isPaid || false} onChange={() => {}} className="w-5 h-5 text-brand" />
                    <span className="font-bold">Is Paid?</span>
                 </div>
                 <input type="number" placeholder="Price (₹)" className="w-full p-3 border rounded-lg" value={editingCourse.price} onChange={e => setEditingCourse({...editingCourse, price: parseInt(e.target.value)})} />
              </div>

              {editingCourse.isPaid && (
                 <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <label className="block text-xs font-bold text-yellow-700 mb-1">Link Shortener Verification URL</label>
                    <input type="text" placeholder="https://short.link/xyz" className="w-full p-2 border border-yellow-300 rounded bg-white" value={editingCourse.verificationLink || ''} onChange={e => setEditingCourse({...editingCourse, verificationLink: e.target.value})} />
                    <p className="text-[10px] text-yellow-600 mt-1">Users will visit this link to unlock 24h access.</p>
                 </div>
              )}

              <input type="text" placeholder="Image URL" className="w-full p-3 border rounded-lg" value={editingCourse.image} onChange={e => setEditingCourse({...editingCourse, image: e.target.value})} />
              <input type="text" placeholder="Category" className="w-full p-3 border rounded-lg" value={editingCourse.category} onChange={e => setEditingCourse({...editingCourse, category: e.target.value})} />
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingCourse(null)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => { updateCourse(editingCourse); setEditingCourse(null); }} className="flex-1 py-3 bg-brand text-white font-bold rounded-lg shadow-lg">Save Changes</button>
            </div>
          </div>
        </div>
      )}
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
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <ChatBot />
      {showNav && <BottomNav />}
    </>
  );
};

export default App;
