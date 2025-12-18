
import React, { useEffect, useState, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { 
  Home, BookOpen, User, HelpCircle, Menu, LogOut, Search, PlayCircle, Lock, Unlock, 
  LayoutDashboard, Settings, Plus, Trash2, Edit, Save, X, ChevronDown, CheckCircle, 
  Timer, Clock, ExternalLink, Play, Bot, Brain, Loader2, ArrowLeft, Video as VideoIcon, 
  Sparkles, Send, RotateCcw, Smartphone, List, Wand2, Globe, Bell
} from './components/Icons';
import VideoPlayer from './components/VideoPlayer';
import ChatBot from './components/ChatBot';
import ExamMode from './components/ExamMode';
import { Course, Chapter, Video, UserRole, AppSettings } from './types';

// --- Study Tool UI Components ---

const STHeader = () => {
  const { currentUser, settings } = useStore();
  const location = useLocation();
  const isNoNav = ['/login', '/watch', '/exam', '/temp-access'].some(p => location.pathname.includes(p));

  if (isNoNav) return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-5 z-50">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#0056d2] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-200">S</div>
            <span className="font-display font-extrabold text-[#0056d2] tracking-tight text-xl">{settings.appName}</span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-full relative transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <Link to="/profile" className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden transition-transform active:scale-90">
            {currentUser ? <span className="font-bold text-[#0056d2]">{currentUser.name.charAt(0)}</span> : <User className="w-5 h-5 text-gray-400" />}
        </Link>
      </div>
    </header>
  );
};

const STBottomNav = () => {
  const location = useLocation();
  const isNoNav = ['/login', '/watch', '/exam', '/temp-access'].some(p => location.pathname.includes(p));
  if (isNoNav) return null;

  const tabs = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Batches', path: '/courses', icon: LayoutDashboard },
    { label: 'My Study', path: '/my-courses', icon: BookOpen },
    { label: 'Profile', path: '/profile', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-50 pb-safe">
      {tabs.map(tab => {
        const isActive = location.pathname === tab.path;
        return (
          <Link key={tab.path} to={tab.path} className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${isActive ? 'text-[#0056d2]' : 'text-gray-400'}`}>
            <tab.icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
            <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-60'}`}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

// --- RESTORED CONTENT MANAGER ---

const ContentManager = ({ course, onClose }: { course: Course, onClose: () => void }) => {
    const { updateCourse } = useStore();
    const [chapters, setChapters] = useState<Chapter[]>(course.chapters || []);
    const [newTitle, setNewTitle] = useState('');

    const handleSave = () => {
        updateCourse({ ...course, chapters });
        onClose();
    };

    const addChapter = () => {
        if (!newTitle.trim()) return;
        setChapters([...chapters, { id: Date.now().toString(), title: newTitle, videos: [] }]);
        setNewTitle('');
    };

    const addVideo = (cId: string) => {
        const title = prompt('Sequence Title:');
        const url = prompt('Stream Link (URL):');
        const dur = prompt('Duration (HH:MM):') || '10:00';
        if (title && url) {
            setChapters(chapters.map(c => c.id === cId ? { ...c, videos: [...c.videos, { id: Date.now().toString(), title, filename: url, duration: dur }] } : c));
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[32px] p-6 md:p-8 max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800"><VideoIcon className="text-blue-600" /> Course Architecture</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X /></button>
                </div>
                
                <div className="flex gap-2 mb-6">
                    <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="flex-1 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-blue-500 font-medium" placeholder="New Chapter Identifier..." />
                    <button onClick={addChapter} className="bg-[#0056d2] text-white px-6 rounded-2xl font-bold transition-transform active:scale-95 shadow-md shadow-blue-100">ADD</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
                    {chapters.length === 0 && <div className="text-center py-10 text-gray-400 italic font-medium">No sequence added yet. Start constructing above.</div>}
                    {chapters.map((chap, idx) => (
                        <div key={chap.id} className="border border-gray-100 rounded-3xl bg-gray-50/50 overflow-hidden">
                            <div className="p-4 bg-white flex justify-between items-center border-b border-gray-100">
                                <span className="font-bold text-gray-700 text-sm">{idx+1}. {chap.title}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => addVideo(chap.id)} className="text-[10px] bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl font-bold hover:bg-blue-200 transition-colors">+ NODE</button>
                                    <button onClick={() => setChapters(chapters.filter(c => c.id !== chap.id))} className="text-red-500 p-1.5 hover:bg-red-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="p-3 space-y-2">
                                {chap.videos.map(vid => (
                                    <div key={vid.id} className="p-3.5 bg-white rounded-2xl flex justify-between items-center border border-gray-50 shadow-sm">
                                        <div className="flex-1 truncate pr-4 text-sm font-semibold text-gray-600">
                                            <p className="truncate">{vid.title}</p>
                                            <p className="text-[10px] text-blue-400 font-mono mt-1 opacity-70 truncate">{vid.filename}</p>
                                        </div>
                                        <button onClick={() => setChapters(chapters.map(c => c.id === chap.id ? {...c, videos: c.videos.filter(v => v.id !== vid.id)} : c))} className="text-gray-400 hover:text-red-500 p-1"><X className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-6 border-t flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3.5 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-colors">Discard</button>
                    <button onClick={handleSave} className="flex-1 py-3.5 bg-[#0056d2] text-white font-bold rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition-all">Commit Batch Grid</button>
                </div>
            </div>
        </div>
    );
};

// --- RESTORED ADMIN PANEL ---

const AdminPanel = () => {
    const { currentUser, courses, settings, addCourse, updateCourse, deleteCourse, updateSettings, users } = useStore();
    const [tab, setTab] = useState<'batches' | 'users' | 'settings'>('batches');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Course | null>(null);
    const [contentTarget, setContentTarget] = useState<Course | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [form, setForm] = useState({ title: '', description: '', image: '', category: '', price: 0, mrp: 0, isPaid: false, accessKey: '', shortenerLink: '' });

    useEffect(() => {
        if (editing) setForm({ ...editing, isPaid: !!editing.isPaid });
        else setForm({ title: '', description: '', image: '', category: '', price: 0, mrp: 0, isPaid: false, accessKey: '', shortenerLink: '' });
    }, [editing, showModal]);

    if (!currentUser || currentUser.role !== UserRole.ADMIN) return <Navigate to="/" />;

    const handleSaveCourse = (e: React.FormEvent) => {
        e.preventDefault();
        const data = { ...(editing || { id: Date.now().toString(), chapters: [], createdAt: new Date().toISOString() }), ...form };
        if (editing) updateCourse(data); else addCourse(data);
        setShowModal(false);
    };

    const handleGenerateLink = async () => {
        if (!settings.linkShortenerApiKey || !settings.linkShortenerApiUrl) { 
            const courseId = editing?.id || 'manual_sync';
            setForm({ ...form, shortenerLink: `${window.location.origin}/#/temp-access/${courseId}` });
            alert("No Link Shortener API set. Direct neural link generated.");
            return; 
        }
        setIsGenerating(true);
        try {
            const courseId = editing?.id || 'temp';
            const dest = `${window.location.origin}/#/temp-access/${courseId}`;
            const api = `${settings.linkShortenerApiUrl}?api=${settings.linkShortenerApiKey}&url=${encodeURIComponent(dest)}`;
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(api)}`);
            const json = await res.json();
            const data = JSON.parse(json.contents);
            if (data.shortenedUrl || data.shortlink) {
                setForm({ ...form, shortenerLink: data.shortenedUrl || data.shortlink });
            } else throw new Error();
        } catch {
            const courseId = editing?.id || 'temp';
            setForm({ ...form, shortenerLink: `${window.location.origin}/#/temp-access/${courseId}` });
        } finally { setIsGenerating(false); }
    };

    return (
        <div className="pb-24 pt-20 px-4 min-h-screen bg-[#f8fafc]">
             <div className="max-w-4xl mx-auto">
                 <div className="flex bg-white p-1.5 rounded-[24px] shadow-sm border border-gray-100 mb-8 overflow-hidden">
                    {['batches', 'users', 'settings'].map(t => (
                        <button key={t} onClick={() => setTab(t as any)} className={`flex-1 py-3 font-bold capitalize transition-all rounded-[18px] text-sm ${tab === t ? 'bg-[#0056d2] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>
                            {t}
                        </button>
                    ))}
                 </div>

                 {tab === 'batches' && (
                     <div className="space-y-4">
                         <button onClick={() => { setEditing(null); setShowModal(true); }} className="w-full py-12 bg-white border-2 border-dashed border-blue-200 rounded-[32px] text-[#0056d2] font-bold flex flex-col items-center justify-center gap-2 hover:bg-blue-50 transition-all group">
                            <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                            <span>INITIALIZE NEW BATCH</span>
                         </button>
                         <div className="grid gap-3">
                             {courses.map(c => (
                                 <div key={c.id} className="bg-white p-4 rounded-[28px] flex items-center gap-4 border border-gray-100 shadow-sm transition-all hover:shadow-md group">
                                     <img src={c.image} className="w-16 h-16 rounded-2xl object-cover" />
                                     <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-800 truncate">{c.title}</h3>
                                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{c.category} • {c.isPaid ? 'Premium' : 'Public'}</p>
                                     </div>
                                     <div className="flex flex-col gap-2">
                                         <button onClick={() => setContentTarget(c)} className="px-4 py-2 bg-[#0056d2] text-white rounded-xl font-bold text-[10px] active:scale-95 transition-transform uppercase tracking-widest">CONTENT</button>
                                         <div className="flex gap-2 justify-end">
                                            <button onClick={() => { setEditing(c); setShowModal(true); }} className="p-2 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition-colors"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => { if(confirm('Erase sequence?')) deleteCourse(c.id); }} className="p-2 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                 {tab === 'users' && (
                     <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Neural Identity Registry</div>
                        <div className="divide-y divide-gray-50">
                        {users.map(u => (
                            <div key={u.id} className="p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-2xl bg-blue-100 text-[#0056d2] flex items-center justify-center font-bold text-lg">{u.name.charAt(0)}</div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-800">{u.name}</p>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${u.role === UserRole.ADMIN ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{u.role}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-400 font-medium">{u.email}</p>
                                    </div>
                                </div>
                                <button className="text-[10px] font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl transition-colors hover:bg-blue-100">DETAILS</button>
                            </div>
                        ))}
                        </div>
                     </div>
                 )}

                 {tab === 'settings' && (
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-8 tracking-tight">Portal Configuration</h2>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">App Identifier</label>
                                <input value={settings.appName} onChange={e => updateSettings({ ...settings, appName: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-gray-100 focus:border-blue-500 font-medium" />
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Bridge API Endpoint</label>
                                    <input value={settings.linkShortenerApiUrl || ''} onChange={e => updateSettings({ ...settings, linkShortenerApiUrl: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-gray-100 focus:border-blue-500 font-mono text-xs" placeholder="https://domain.com/api" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Bridge API Key</label>
                                    <input value={settings.linkShortenerApiKey || ''} onChange={e => updateSettings({ ...settings, linkShortenerApiKey: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-gray-100 focus:border-blue-500 font-mono text-xs" type="password" />
                                </div>
                            </div>
                            <button onClick={() => alert("Memory Synced.")} className="w-full py-4 bg-[#0056d2] text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:scale-[1.01] transition-transform mt-4 uppercase tracking-[0.2em] text-xs">SYNC NEURAL GLOBALS</button>
                        </div>
                    </div>
                 )}
             </div>

             {/* Add/Edit Modal */}
             {showModal && (
                 <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar border border-gray-100 animate-slide-up">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{editing ? 'Configure Node' : 'Initialize Batch'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X /></button>
                        </div>
                        <form onSubmit={handleSaveCourse} className="space-y-6">
                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold" placeholder="Batch Name (e.g. Full-Stack 2025)" required />
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 text-sm leading-relaxed" placeholder="Batch Description..." rows={3} />
                            <div className="grid grid-cols-2 gap-4">
                                <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-mono" placeholder="Image URL" />
                                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs uppercase font-bold" placeholder="Category" />
                            </div>
                            <div className="p-5 bg-gray-50 rounded-[24px] flex items-center justify-between cursor-pointer border border-gray-100 hover:bg-gray-100 transition-colors" onClick={() => setForm({ ...form, isPaid: !form.isPaid })}>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Premium Enrolment Node</span>
                                <div className={`w-11 h-6 rounded-full relative transition-all duration-300 ${form.isPaid ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${form.isPaid ? 'left-6' : 'left-1'}`} />
                                </div>
                            </div>
                            {form.isPaid && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-blue-600 uppercase ml-1 tracking-widest">Master Key Signature</label>
                                        <input value={form.accessKey} onChange={e => setForm({ ...form, accessKey: e.target.value })} className="w-full p-5 bg-blue-50 border-2 border-blue-600 text-blue-800 rounded-2xl text-center font-mono text-2xl tracking-[0.3em] outline-none" placeholder="KEY_123" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-blue-600 uppercase ml-1 tracking-widest">Shortener Bridge Link</label>
                                        <div className="flex gap-2">
                                            <input value={form.shortenerLink} onChange={e => setForm({ ...form, shortenerLink: e.target.value })} className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-mono" placeholder="External Bridge URL" />
                                            <button type="button" onClick={handleGenerateLink} disabled={isGenerating} className="px-5 bg-blue-600 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-100">
                                                {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <Globe className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="pt-6 flex flex-col gap-4">
                                <button type="submit" className="w-full py-5 bg-[#0056d2] text-white font-bold rounded-[22px] shadow-xl shadow-blue-100 hover:scale-[1.01] active:scale-95 transition-all uppercase tracking-[0.2em] text-sm">Commit Batch</button>
                                <button type="button" onClick={() => setShowModal(false)} className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors uppercase text-[10px] tracking-widest">Abort Protocol</button>
                            </div>
                        </form>
                    </div>
                 </div>
             )}

             {contentTarget && <ContentManager course={contentTarget} onClose={() => setContentTarget(null)} />}
        </div>
    );
};

// --- CORE USER VIEWS ---

const CourseListing = () => {
    const { courses } = useStore();
    return (
        <div className="pb-24 pt-20 px-4 min-h-screen bg-[#f8fafc]">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-800 tracking-tight">Active Batches</h1>
                        <div className="w-16 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                    </div>
                    <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <Search className="w-6 h-6 text-gray-400" />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(c => (
                        <Link key={c.id} to={`/course/${c.id}`} className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col group">
                            <div className="relative h-56 overflow-hidden">
                                <img src={c.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-black text-[#0056d2] uppercase shadow-md tracking-widest">
                                    {c.category}
                                </div>
                            </div>
                            <div className="p-7 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 leading-tight mb-3 group-hover:text-blue-600 transition-colors">{c.title}</h3>
                                    <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed font-medium">{c.description}</p>
                                </div>
                                <div className="mt-8 flex items-center justify-between border-t border-gray-50 pt-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Enrollment Status</span>
                                        <span className={`text-sm font-black ${c.isPaid ? 'text-gray-800' : 'text-emerald-500'} uppercase`}>{c.isPaid ? 'Premium Node' : 'Public Domain'}</span>
                                    </div>
                                    <div className="w-12 h-12 rounded-[18px] bg-blue-50 flex items-center justify-center text-[#0056d2] group-hover:bg-[#0056d2] group-hover:text-white transition-all shadow-lg shadow-blue-50">
                                        <PlayCircle className="w-7 h-7" />
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

const CourseDetail = () => {
    const { id } = useParams();
    const { courses, currentUser, enrollCourse } = useStore();
    const navigate = useNavigate();
    const course = courses.find(c => c.id === id);
    if (!course) return null;

    const expiryDate = currentUser?.tempAccess?.[course.id];
    const isTempValid = expiryDate && new Date(expiryDate) > new Date();
    const isEnrolled = currentUser?.purchasedCourseIds.includes(course.id) || isTempValid;

    return (
        <div className="pb-24 pt-0 min-h-screen bg-[#f8fafc]">
            <div className="relative h-[40vh] w-full">
                <img src={course.image} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-8">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white/10 backdrop-blur-md rounded-[18px] text-white w-fit border border-white/20 transition-all hover:bg-white/20"><ArrowLeft /></button>
                    <div>
                        <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] mb-4 inline-block shadow-lg shadow-blue-500/20">{course.category}</span>
                        <h1 className="text-4xl font-black text-white leading-tight tracking-tight">{course.title}</h1>
                    </div>
                </div>
            </div>

            <div className="px-6 -mt-10 relative z-10 max-w-4xl mx-auto">
                <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Batch Pricing Protocol</p>
                        <p className="text-3xl font-black text-gray-800">{course.isPaid ? `₹${course.price}` : 'FREE ENROLLMENT'}</p>
                    </div>
                    <div className="flex-1 w-full md:w-auto">
                    {isEnrolled ? (
                        <div className="flex flex-col gap-2">
                             <button onClick={() => navigate(`/watch/${course.id}`)} className="w-full bg-[#0056d2] text-white py-5 rounded-[22px] font-black flex items-center justify-center gap-4 shadow-xl shadow-blue-100 active:scale-95 transition-all text-lg tracking-widest uppercase">
                                <PlayCircle className="w-8 h-8" /> START STREAMING
                             </button>
                             {isTempValid && <p className="text-center text-[10px] text-amber-500 font-black animate-pulse uppercase tracking-[0.2em]">Temporal Link Active (24H)</p>}
                        </div>
                    ) : (
                        <div className="flex gap-4">
                            {course.isPaid && course.shortenerLink && (
                                <a href={course.shortenerLink} target="_blank" rel="noopener noreferrer" className="p-5 bg-white border-2 border-blue-600 text-[#0056d2] rounded-[22px] flex items-center justify-center shadow-lg shadow-blue-50 hover:scale-105 transition-transform"><ExternalLink className="w-7 h-7" /></a>
                            )}
                            <button onClick={() => course.isPaid ? navigate(`/verify/${course.id}`) : enrollCourse(course.id)} className="flex-1 bg-[#0056d2] text-white py-5 rounded-[22px] font-black text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all tracking-[0.2em] uppercase">
                                {course.isPaid ? 'UNLOCK NODE' : 'ENROLL NOW'}
                            </button>
                        </div>
                    )}
                    </div>
                </div>

                <div className="mt-12">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-[18px] flex items-center justify-center shadow-sm">
                            <List className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-800 tracking-tight">Syllabus Grid</h3>
                    </div>
                    
                    <div className="space-y-4">
                        {course.chapters && course.chapters.length > 0 ? course.chapters.map((chap, idx) => (
                            <div key={chap.id} className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm transition-all hover:border-blue-100">
                                <div className="p-6 bg-gray-50/50 flex justify-between items-center border-b border-gray-50">
                                    <span className="font-black text-gray-700 text-sm uppercase tracking-tighter">{idx + 1}. {chap.title}</span>
                                    <span className="text-[10px] text-blue-600 font-black bg-blue-100 px-4 py-1.5 rounded-full shadow-inner">{chap.videos?.length || 0} UNITS</span>
                                </div>
                                <div className="p-3 space-y-2">
                                    {chap.videos?.map(vid => (
                                        <div key={vid.id} onClick={() => isEnrolled && navigate(`/watch/${course.id}`)} className={`p-5 flex items-center gap-5 rounded-[22px] cursor-pointer transition-all ${isEnrolled ? 'hover:bg-blue-50/50 hover:scale-[1.01]' : 'opacity-40 group-hover:scale-95'}`}>
                                            <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center shadow-sm ${isEnrolled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                {isEnrolled ? <PlayCircle className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-base text-gray-700 truncate tracking-tight">{vid.title}</p>
                                                <p className="text-[10px] text-gray-400 font-black mt-1 uppercase tracking-widest">{vid.duration} SEQUENCE</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
                                <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-sm italic">Neural Data Sequenced Incomplete</p>
                            </div>
                        )}
                    </div>
                    <button onClick={() => navigate(`/exam/${course.id}`)} className="w-full mt-10 py-6 bg-white border-2 border-blue-600 text-[#0056d2] rounded-[32px] font-black flex items-center justify-center gap-4 active:scale-95 transition-all text-lg shadow-xl shadow-blue-50 uppercase tracking-[0.2em]">
                        <Brain className="w-8 h-8" /> COMMENCE EVALUATION
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- AUTH & FLOW COMPONENTS ---

const VerifyNode = () => {
    const { id } = useParams();
    const { courses, enrollCourse } = useStore();
    const navigate = useNavigate();
    const [key, setKey] = useState('');
    const course = courses.find(c => c.id === id);

    const handleVerify = () => {
        if (key === course?.accessKey) {
            enrollCourse(course.id);
            alert("Master Key Accepted. Identity Synced.");
            navigate(`/course/${course.id}`);
        } else alert("Invalid Authentication Signature.");
    };

    return (
        <div className="min-h-screen pt-24 px-6 flex items-center justify-center bg-[#f8fafc]">
            <div className="bg-white p-10 rounded-[50px] max-w-md w-full shadow-2xl border border-gray-100 animate-slide-up">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-[28px] flex items-center justify-center mb-8 mx-auto shadow-lg shadow-blue-100"><Lock className="w-10 h-10" /></div>
                <h2 className="text-3xl font-black text-gray-800 mb-2 text-center tracking-tight">Access Verification</h2>
                <p className="text-gray-400 text-sm mb-12 text-center font-medium">Input unique Master Key for <span className="text-blue-600 font-bold">{course?.title}</span>.</p>
                <input value={key} onChange={e => setKey(e.target.value)} className="w-full p-6 bg-gray-50 border-2 border-blue-100 rounded-[24px] mb-8 text-center text-3xl font-mono text-blue-800 outline-none focus:border-blue-600 transition-all shadow-inner" placeholder="000-000" />
                <button onClick={handleVerify} className="w-full py-6 bg-[#0056d2] text-white font-black rounded-[24px] shadow-2xl shadow-blue-100 active:scale-95 transition-all text-xl uppercase tracking-[0.2em]">DECRYPT NODE</button>
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
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) { 
                    clearInterval(interval); 
                    grantTempAccess(courseId!); 
                    setTimeout(() => navigate(`/course/${courseId}`), 300);
                    return 100; 
                }
                return p + 1.5;
            });
        }, 30);
        return () => clearInterval(interval);
    }, [courseId, grantTempAccess, navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-12 text-center bg-white">
            <div className="w-24 h-24 bg-blue-50 text-[#0056d2] rounded-[32px] flex items-center justify-center mb-10 shadow-2xl animate-pulse border border-blue-100"><Globe className="w-12 h-12" /></div>
            <h2 className="text-3xl font-black text-gray-800 mb-3 uppercase tracking-tighter">Bypassing Link Firewall</h2>
            <p className="text-sm font-bold text-gray-400 mb-12 uppercase tracking-[0.3em]">Neural Bridge Synchronization: {Math.floor(progress)}%</p>
            <div className="w-full max-w-sm h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-[#0056d2] transition-all duration-100 shadow-glow" style={{width: `${progress}%`}}></div>
            </div>
        </div>
    );
};

const Watch = () => {
    const { courseId } = useParams();
    const { courses, currentUser } = useStore();
    const navigate = useNavigate();
    const course = courses.find(c => c.id === courseId);
    const [idx, setIdx] = useState(0);

    const allVideos: any[] = [];
    course?.chapters?.forEach(c => c.videos?.forEach(v => allVideos.push({ ...v, chap: c.title })));

    if (!currentUser) return <Navigate to="/login" />;
    if (!course || allVideos.length === 0) return <Navigate to="/" />;

    const isEnrolled = currentUser.purchasedCourseIds.includes(course.id) || 
                      (currentUser.tempAccess?.[course.id] && new Date(currentUser.tempAccess[course.id]) > new Date());
    
    if (!isEnrolled) return <Navigate to={`/course/${course.id}`} />;

    return (
      <div className="min-h-screen bg-black flex flex-col h-screen overflow-hidden">
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="flex-1 flex flex-col bg-black relative">
            <VideoPlayer src={allVideos[idx].filename} onBack={() => navigate(`/course/${courseId}`)} title={allVideos[idx].title} />
            <div className="p-8 bg-white border-t border-gray-100">
              <h1 className="text-2xl font-black text-gray-800 leading-tight tracking-tight uppercase">{allVideos[idx].title}</h1>
              <p className="text-[#0056d2] font-black text-[11px] uppercase tracking-[0.4em] mt-2 opacity-60">{allVideos[idx].chap} Module</p>
            </div>
          </div>
          <div className="w-full md:w-[450px] bg-white border-l border-gray-100 flex flex-col overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-black text-gray-800 uppercase tracking-tighter text-xl">Module Stream</h2>
              <span className="text-[11px] font-black text-[#0056d2] bg-blue-100 px-4 py-1.5 rounded-full">{allVideos.length} NODES</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {allVideos.map((v, i) => (
                <button key={v.id} onClick={() => setIdx(i)} className={`w-full text-left p-6 rounded-[28px] flex items-center gap-5 transition-all ${idx === i ? 'bg-[#0056d2] text-white shadow-2xl scale-[1.02]' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center transition-all ${idx === i ? 'bg-white/20' : 'bg-white text-[#0056d2] shadow-sm'}`}>
                    {idx === i ? <Play className="w-7 h-7" fill="white" /> : <PlayCircle className="w-7 h-7" />}
                  </div>
                  <div className="flex-1 truncate">
                    <p className={`font-black text-base truncate uppercase tracking-tighter ${idx === i ? 'text-white' : 'text-gray-700'}`}>{v.title}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${idx === i ? 'opacity-70' : 'opacity-40'}`}>{v.duration} Sequence</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
};

const Profile = () => {
    const { currentUser, logout, settings } = useStore();
    if (!currentUser) return <Navigate to="/login" />;
    return (
        <div className="pb-24 pt-24 px-6 min-h-screen bg-[#f8fafc]">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white rounded-[50px] p-12 shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-full -mr-24 -mt-24 blur-3xl opacity-50"></div>
                    <div className="flex items-center gap-8 mb-12 relative z-10">
                        <div className="w-24 h-24 rounded-[32px] bg-[#0056d2] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-100">
                            {currentUser.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">{currentUser.name}</h2>
                            <p className="text-[#0056d2] font-black text-[11px] uppercase tracking-[0.4em] bg-blue-50 px-4 py-1 rounded-full inline-block mt-3 shadow-inner">{currentUser.role} IDENTITY</p>
                        </div>
                    </div>
                    <div className="space-y-4 relative z-10">
                        <div className="p-6 bg-gray-50 rounded-[28px] flex items-center gap-6 border border-gray-100/50">
                            <Send className="w-6 h-6 text-blue-600" />
                            <span className="text-base font-bold text-gray-500">{currentUser.email}</span>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-[28px] flex items-center gap-6 border border-gray-100/50">
                            <Smartphone className="w-6 h-6 text-blue-600" />
                            <span className="text-base font-bold text-gray-500">{currentUser.phone || 'Terminal Unlinked'}</span>
                        </div>
                    </div>
                    <button onClick={logout} className="mt-12 w-full py-5 text-red-500 font-black bg-red-50 rounded-[24px] active:scale-95 transition-all text-xs uppercase tracking-[0.5em] shadow-lg shadow-red-50">DISCONNECT IDENTITY</button>
                </div>
                {(currentUser.role === UserRole.ADMIN) && (
                    <Link to="/admin" className="block w-full py-7 bg-gradient-to-r from-[#0056d2] to-blue-800 text-white rounded-[40px] text-center font-black shadow-2xl shadow-blue-200 text-xl active:scale-95 transition-transform uppercase tracking-[0.2em]">ADMIN COMMAND GRID</Link>
                )}
            </div>
        </div>
    );
};

const Login = () => {
  const [isSign, setIsSign] = useState(false);
  const [f, setF] = useState({ name: '', email: '', phone: '', pass: '' });
  const { login, signup, currentUser } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) navigate(currentUser.role === UserRole.ADMIN ? '/admin' : '/');
  }, [currentUser, navigate]);

  const sub = (e: any) => {
    e.preventDefault();
    if (isSign) signup(f.name, f.email, f.phone, f.pass);
    else if (!login(f.email, f.pass)) alert('Neural match failed. Signal rejected.');
  };

  return (
    <div className="min-h-screen items-center justify-center p-6 bg-[#0056d2] flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none futuristic-grid"></div>
      <div className="mb-14 text-center relative z-10">
          <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-900 text-[#0056d2] font-black text-5xl">ST</div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic drop-shadow-lg">Study Tool Hub</h1>
      </div>
      <div className="bg-white p-12 rounded-[60px] w-full max-w-md shadow-2xl animate-fade-in border border-blue-400/20 relative z-10">
        <h2 className="text-4xl font-black text-gray-800 mb-12 text-center uppercase tracking-tighter">Authentication</h2>
        <form onSubmit={sub} className="space-y-5">
          {isSign && <input className="w-full p-5 bg-gray-50 rounded-[24px] outline-none border border-gray-100 focus:border-blue-500 font-bold" placeholder="Full Identity Name" value={f.name} onChange={e => setF({...f, name: e.target.value})} required />}
          <input className="w-full p-5 bg-gray-50 rounded-[24px] outline-none border border-gray-100 focus:border-blue-500 font-bold" placeholder="Terminal ID / Email" value={f.email} onChange={e => setF({...f, email: e.target.value})} required />
          {isSign && <input className="w-full p-5 bg-gray-50 rounded-[24px] outline-none border border-gray-100 focus:border-blue-500 font-bold" placeholder="Phone Link" value={f.phone} onChange={e => setF({...f, phone: e.target.value})} required />}
          <input className="w-full p-5 bg-gray-50 rounded-[24px] outline-none border border-gray-100 focus:border-blue-500 font-bold" type="password" placeholder="Pass-Sequence" value={f.pass} onChange={e => setF({...f, pass: e.target.value})} required />
          <button className="w-full py-6 bg-[#0056d2] text-white font-black rounded-[24px] shadow-2xl shadow-blue-100 uppercase tracking-[0.3em] active:scale-95 transition-all text-xl mt-6">INITIALIZE</button>
        </form>
        <button className="w-full mt-12 text-[10px] text-blue-600 font-black uppercase tracking-[0.5em] text-center block" onClick={() => setIsSign(!isSign)}>{isSign ? '< Revert to Login' : 'Construct New Identity Node >'}</button>
      </div>
    </div>
  );
};

const MainContent = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <STHeader />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<CourseListing />} />
        <Route path="/courses" element={<CourseListing />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/temp-access/:courseId" element={<TempAccess />} />
        <Route path="/verify/:id" element={<VerifyNode />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/watch/:courseId" element={<Watch />} />
        <Route path="/exam/:id" element={<ExamMode />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <STBottomNav />
      <ChatBot />
    </div>
  );
};

export const App = () => (
    <Router>
      <StoreProvider>
        <MainContent />
      </StoreProvider>
    </Router>
);
