
import React, { useEffect, useState, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { 
  Home, BookOpen, User, Search, PlayCircle, Lock, 
  LayoutDashboard, Settings, Plus, Trash2, Edit, X, 
  CheckCircle, ExternalLink, Play, Bot, Brain, Loader2, ArrowLeft, 
  Video as VideoIcon, Sparkles, Send, Smartphone, List, Globe, Bell, 
  ChevronRight, MoreVertical, MessageCircle, FileText, Calendar, MessageSquare, Eye,
  RotateCcw, ImageIcon, Copy, Shield, Upload, Link as LinkIcon, Key, Clock, Download
} from './components/Icons';
import VideoPlayer from './components/VideoPlayer';
import ChatBot from './components/ChatBot';
import ExamMode from './components/ExamMode';
import { GoogleGenAI } from "@google/genai";
import { Course, Chapter, Video, UserRole, Subject, AppSettings } from './types';

// --- HELPER FOR IMAGE UPLOAD ---
const handleImageUpload = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- SHARED UI COMPONENTS ---

const Banner = () => (
  <div className="bg-[#fff9e6] px-5 py-3.5 flex items-center justify-between text-[11px] font-semibold text-gray-700 border-b border-yellow-100">
    <span>Finish lectures to increase your progress!</span>
    <X className="w-3.5 h-3.5 text-gray-400" />
  </div>
);

const XPBadge = ({ xp = 0 }) => (
  <div className="flex items-center gap-1.5 bg-gray-100/80 px-3 py-1.5 rounded-full border border-gray-200">
    <div className="w-5 h-5 bg-[#c5d8f1] rounded-md flex items-center justify-center text-[9px] font-black text-[#4a6da7]">XP</div>
    <span className="text-xs font-extrabold text-gray-700">{xp}</span>
  </div>
);

const STHeader = () => {
  const { currentUser, settings } = useStore();
  const location = useLocation();
  const isNoNav = ['/login', '/watch', '/exam', '/temp-access'].some(p => location.pathname.includes(p));
  
  if (isNoNav) return null;

  const totalXP = (currentUser?.examResults || []).reduce((acc, curr) => acc + (curr.score * 50), 0);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-5 z-50 lg:px-10">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#0056d2] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-200">S</div>
            <span className="font-display font-extrabold text-[#0056d2] tracking-tight text-xl">{settings.appName}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className={`text-sm font-bold transition-colors ${location.pathname === '/' ? 'text-[#0056d2]' : 'text-gray-500 hover:text-gray-800'}`}>Home</Link>
            <Link to="/courses" className={`text-sm font-bold transition-colors ${location.pathname === '/courses' ? 'text-[#0056d2]' : 'text-gray-500 hover:text-gray-800'}`}>Batches</Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <XPBadge xp={totalXP} />
        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-full"><Bell className="w-6 h-6" /></button>
        <Link to="/profile" className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
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
    { label: 'Profile', path: '/profile', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-50 pb-safe shadow-sm md:hidden">
      {tabs.map(tab => {
        const isActive = location.pathname === tab.path;
        return (
          <Link key={tab.path} to={tab.path} className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${isActive ? 'text-[#0056d2]' : 'text-gray-400'}`}>
            <tab.icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''}`} />
            <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-60'}`}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

const TempAccessHandler = () => {
    const { id } = useParams<{id: string}>();
    const { grantTempAccess, courses, currentUser } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success'>('idle');
    const course = courses.find(c => c.id === id);

    useEffect(() => { if (currentUser && id && status === 'idle') handleVerify(); }, [currentUser, id]);

    const handleVerify = () => {
        if (!currentUser) { navigate('/login', { state: { from: location } }); return; }
        setStatus('verifying');
        setTimeout(() => { if (id) { grantTempAccess(id); setStatus('success'); setTimeout(() => navigate(`/course/${id}`), 1500); } }, 2000);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
            <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-gray-100 max-w-sm w-full animate-slide-up text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    {status === 'verifying' ? <Loader2 className="w-10 h-10 text-[#0056d2] animate-spin" /> : status === 'success' ? <CheckCircle className="w-10 h-10 text-green-500" /> : <Shield className="w-10 h-10 text-[#0056d2]" />}
                </div>
                <h2 className="text-2xl font-black text-gray-800 mb-2 tracking-tight">{status === 'verifying' ? 'Verifying Link...' : status === 'success' ? 'Access Granted!' : 'Temporary Access'}</h2>
                <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">{status === 'verifying' ? 'Checking security token for authorization...' : status === 'success' ? 'Redirecting to your course dashboard.' : `You are claiming 24-hour free access to: ${course?.title || 'this batch'}.`}</p>
                {status === 'idle' && <button onClick={handleVerify} className="w-full py-4 bg-[#0056d2] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all">Confirm Activation</button>}
            </div>
        </div>
    );
};

// --- CONTENT MANAGER PANEL ---

const ContentManager = ({ course, onClose }: { course: Course, onClose: () => void }) => {
    const { updateCourse } = useStore();
    const [subjects, setSubjects] = useState<Subject[]>(course.subjects || []);
    const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

    const handleSave = () => { updateCourse({ ...course, subjects }); onClose(); };

    const addSubject = () => {
        const title = prompt('Subject Title (e.g. Science):');
        const iconText = prompt('Short Icon (e.g. Sc):') || 'S';
        if (title) setSubjects([...subjects, { id: Date.now().toString(), title, iconText, chapters: [] }]);
    };

    const addChapter = (sId: string) => {
        const title = prompt('Chapter Title:');
        if (title) setSubjects(subjects.map(s => s.id === sId ? { ...s, chapters: [...s.chapters, { id: Date.now().toString(), title, videos: [] }] } : s));
    };

    const addVideo = (sId: string, cId: string) => {
        const title = prompt('Content Name:');
        const url = prompt('Stream URL (Youtube/Vimeo/Drive):');
        const dur = prompt('Duration (e.g. 1h 20m):') || '10:00';
        const typeInput = prompt('Type (lecture/note/dpp):') || 'lecture';
        const type = (['lecture', 'note', 'dpp'].includes(typeInput) ? typeInput : 'lecture') as 'lecture' | 'note' | 'dpp';
        if (title && url) {
            setSubjects(subjects.map(s => s.id === sId ? { ...s, chapters: s.chapters.map(c => c.id === cId ? { ...c, videos: [...c.videos, { id: Date.now().toString(), title, filename: url, duration: dur, type, date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase() }] } : c) } : s));
        }
    };

    const activeSubject = subjects.find(s => s.id === activeSubjectId);
    const activeChapter = activeSubject?.chapters.find(c => c.id === activeChapterId);

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[32px] p-8 max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                      <VideoIcon className="text-blue-600" /> 
                      {activeChapter ? activeChapter.title : activeSubject ? activeSubject.title : 'Manage Content Hierarchy'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X /></button>
                </div>
                
                <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-gray-400 overflow-x-auto no-scrollbar whitespace-nowrap">
                    <button onClick={() => { setActiveSubjectId(null); setActiveChapterId(null); }} className={!activeSubjectId ? 'text-blue-600' : ''}>ROOT</button>
                    {activeSubject && (
                      <>
                        <ChevronRight className="w-3 h-3" />
                        <button onClick={() => setActiveChapterId(null)} className={activeSubjectId && !activeChapterId ? 'text-blue-600' : ''}>{activeSubject.title.toUpperCase()}</button>
                      </>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
                    {activeChapterId && activeSubjectId ? (
                        <div className="space-y-3">
                            <button onClick={() => addVideo(activeSubjectId, activeChapterId)} className="w-full py-5 border-2 border-dashed border-blue-100 rounded-2xl text-blue-600 font-bold hover:bg-blue-50 transition-all">+ Add Video / Note</button>
                            {activeChapter?.videos.map(vid => (
                                <div key={vid.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center">
                                    <div className="truncate pr-4">
                                        <p className="text-sm font-bold text-gray-800 truncate">{vid.title}</p>
                                        <p className="text-[9px] text-blue-500 font-bold uppercase">{vid.type} • {vid.duration}</p>
                                    </div>
                                    <button onClick={() => setSubjects(subjects.map(s => s.id === activeSubjectId ? {...s, chapters: s.chapters.map(c => c.id === activeChapterId ? {...c, videos: c.videos.filter(v => v.id !== vid.id)} : c)} : s))} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    ) : activeSubjectId ? (
                        <div className="space-y-3">
                            <button onClick={() => addChapter(activeSubjectId)} className="w-full py-5 border-2 border-dashed border-blue-100 rounded-2xl text-blue-600 font-bold hover:bg-blue-50 transition-all">+ Create New Chapter</button>
                            {activeSubject?.chapters.map(chap => (
                                <div key={chap.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm">
                                    <button onClick={() => setActiveChapterId(chap.id)} className="flex-1 text-left font-bold text-gray-700">{chap.title}</button>
                                    <button onClick={() => setSubjects(subjects.map(s => s.id === activeSubjectId ? {...s, chapters: s.chapters.filter(c => c.id !== chap.id)} : s))} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <button onClick={addSubject} className="w-full py-5 border-2 border-dashed border-blue-100 rounded-2xl text-blue-600 font-bold hover:bg-blue-50 transition-all">+ Add New Subject Column</button>
                            {subjects.map(sub => (
                                <div key={sub.id} className="p-5 bg-white border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm group">
                                    <button onClick={() => setActiveSubjectId(sub.id)} className="flex items-center gap-4 flex-1 text-left">
                                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">{sub.iconText}</div>
                                        <span className="font-bold text-gray-800">{sub.title}</span>
                                    </button>
                                    <button onClick={() => setSubjects(subjects.filter(s => s.id !== sub.id))} className="text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="mt-6 pt-6 border-t flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-colors">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-4 bg-[#0056d2] text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95">Commit Changes</button>
                </div>
            </div>
        </div>
    );
};

// --- ADMIN CONTROL PANEL ---

const AdminPanel = () => {
    const { currentUser, courses, settings, addCourse, updateCourse, deleteCourse, updateSettings, clearAllData } = useStore();
    const [tab, setTab] = useState<'batches' | 'access' | 'settings'>('batches');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Course | null>(null);
    const [contentTarget, setContentTarget] = useState<Course | null>(null);
    const [settingsForm, setSettingsForm] = useState<AppSettings>(settings);
    const [form, setForm] = useState({ title: '', description: '', image: '', category: '', price: 0, mrp: 0, isPaid: false, startDate: '', endDate: '' });

    useEffect(() => { setSettingsForm(settings); }, [settings]);
    useEffect(() => { if (editing) setForm({ title: editing.title, description: editing.description, image: editing.image, category: editing.category, price: editing.price, mrp: editing.mrp, isPaid: !!editing.isPaid, startDate: editing.startDate || '', endDate: editing.endDate || '' }); else setForm({ title: '', description: '', image: '', category: '', price: 0, mrp: 0, isPaid: false, startDate: '', endDate: '' }); }, [editing, showModal]);

    if (!currentUser || currentUser.role !== UserRole.ADMIN) return <Navigate to="/" />;
    
    const handleSaveCourse = (e: React.FormEvent) => { e.preventDefault(); const data: Course = { ...(editing || { id: Date.now().toString(), subjects: [], createdAt: new Date().toISOString() }), ...form }; if (editing) updateCourse(data); else addCourse(data); setShowModal(false); };
    
    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const base64 = await handleImageUpload(e.target.files[0]);
            setForm({...form, image: base64});
        }
    };

    const copyTempLink = (id: string) => {
        const link = `${window.location.origin}/#/temp-access/${id}`;
        navigator.clipboard.writeText(link);
        alert("24h Access Link Copied! Send this to your student.");
    };

    const copyProductionData = () => {
        const json = JSON.stringify(courses, null, 2);
        navigator.clipboard.writeText(json);
        alert("Batch Data copied to clipboard! Share this with dev to save permanently.");
    };

    return (
        <div className="pb-24 pt-24 px-4 min-h-screen bg-[#f8fafc]">
             <div className="max-w-6xl mx-auto">
                 <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 mb-8 max-w-lg mx-auto overflow-hidden">
                    {(['batches', 'access', 'settings'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 font-bold capitalize transition-all rounded-xl text-xs ${tab === t ? 'bg-[#0056d2] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>
                            {t}
                        </button>
                    ))}
                 </div>

                 {tab === 'batches' && (
                     <div className="space-y-4">
                         <button onClick={() => { setEditing(null); setShowModal(true); }} className="w-full py-12 bg-white border-2 border-dashed border-blue-100 rounded-[35px] text-[#0056d2] font-black flex flex-col items-center justify-center gap-3 hover:bg-blue-50 transition-all">
                            <Plus className="w-10 h-10" />
                            <span className="uppercase tracking-widest text-sm">Create New Batch Node</span>
                         </button>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                             {courses.map(c => (
                                 <div key={c.id} className="bg-white p-5 rounded-[40px] flex flex-col gap-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                     <div className="flex items-center gap-5">
                                         <div className="w-20 h-20 rounded-3xl bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                                            <img src={c.image || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                                         </div>
                                         <div className="flex-1 min-w-0">
                                            <h3 className="font-black text-gray-800 text-sm truncate uppercase tracking-tighter">{c.title}</h3>
                                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em]">{c.category}</p>
                                         </div>
                                     </div>
                                     <div className="flex gap-3 w-full">
                                        <button onClick={() => setContentTarget(c)} className="flex-1 py-3 bg-[#0056d2] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all">CONTENT</button>
                                        <button onClick={() => { setEditing(c); setShowModal(true); }} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:text-blue-500 transition-colors"><Edit className="w-5 h-5" /></button>
                                        <button onClick={() => deleteCourse(c.id)} className="p-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                 {tab === 'access' && (
                    <div className="bg-white rounded-[50px] p-10 border border-gray-100 shadow-sm animate-fade-in">
                        <h2 className="text-2xl font-black text-gray-800 mb-8 uppercase tracking-tight italic">Temporary Access Generator</h2>
                        <div className="space-y-4">
                            {courses.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-[35px] border border-gray-100">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 font-bold shadow-sm">{c.title.charAt(0)}</div>
                                        <span className="font-bold text-gray-800">{c.title}</span>
                                    </div>
                                    <button onClick={() => copyTempLink(c.id)} className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                                        <Copy className="w-4 h-4" /> Copy Access Link
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                 )}

                 {tab === 'settings' && (
                    <div className="bg-white rounded-[50px] p-10 border border-gray-100 shadow-sm">
                        <h2 className="text-2xl font-black text-gray-800 mb-8 uppercase tracking-tight italic">Master Config</h2>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Portal Name</label>
                                <input value={settingsForm.appName} onChange={e => setSettingsForm({...settingsForm, appName: e.target.value})} className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[25px] font-black text-gray-800" />
                            </div>
                            <button onClick={() => { updateSettings(settingsForm); alert("Branding Updated!"); }} className="w-full py-5 bg-[#0056d2] text-white font-black rounded-3xl shadow-xl shadow-blue-100 uppercase tracking-[0.2em] text-xs">Save Settings</button>
                            
                            <div className="mt-12 pt-8 border-t border-gray-50 space-y-4">
                                <h3 className="text-blue-600 font-black uppercase tracking-widest text-[10px]">Data Migration</h3>
                                <button onClick={copyProductionData} className="w-full flex items-center justify-center gap-3 py-5 bg-blue-50 text-blue-600 border border-blue-100 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                    <Download className="w-5 h-5" /> Copy Data Code for Deployment
                                </button>
                                
                                <h3 className="text-red-600 font-black uppercase tracking-widest text-[10px] pt-4">Emergency</h3>
                                <button onClick={clearAllData} className="w-full flex items-center justify-center gap-3 py-5 bg-red-50 text-red-500 border border-red-100 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                    <RotateCcw className="w-5 h-5" /> Nuclear Reset (Clear All Data)
                                </button>
                            </div>
                        </div>
                    </div>
                 )}
             </div>

             {showModal && (
                 <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white w-full max-w-lg rounded-[60px] p-10 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar border border-white/20 animate-slide-up">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-3xl font-black text-gray-800 tracking-tighter italic uppercase">{editing ? 'Edit Node' : 'Initialize Batch'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-3 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSaveCourse} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Thumbnail Identity</label>
                                <div className="relative group aspect-video rounded-[40px] bg-gray-50 border-4 border-dashed border-gray-100 flex items-center justify-center overflow-hidden">
                                    {form.image ? (
                                        <img src={form.image} className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-12 h-12 text-gray-200" />
                                    )}
                                    <input type="file" accept="image/*" onChange={onFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    <div className="absolute bottom-4 bg-white px-5 py-2 rounded-full text-[10px] font-black uppercase shadow-xl border border-gray-100 group-hover:scale-110 transition-transform">Click to Upload Photo</div>
                                </div>
                            </div>
                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-black italic uppercase" placeholder="Batch Name" required />
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl text-sm font-medium min-h-[100px]" placeholder="Brief batch description..." required />
                            <div className="grid grid-cols-2 gap-4">
                                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="p-5 bg-gray-50 border border-gray-100 rounded-3xl text-xs uppercase font-black" placeholder="Level / Grade" required />
                                <div className="flex items-center justify-between px-5 py-5 bg-gray-50 rounded-3xl border border-gray-100 cursor-pointer" onClick={() => setForm({...form, isPaid: !form.isPaid})}>
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Paid Batch</span>
                                    <div className={`w-10 h-5 rounded-full relative transition-all ${form.isPaid ? 'bg-blue-600' : 'bg-gray-300'}`}><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.isPaid ? 'left-5.5' : 'left-0.5'}`} /></div>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-6 bg-[#0056d2] text-white font-black rounded-[35px] shadow-2xl shadow-blue-100 uppercase tracking-[0.3em] text-sm active:scale-95 transition-all">Initialize Node</button>
                        </form>
                    </div>
                 </div>
             )}
             {contentTarget && <ContentManager course={contentTarget} onClose={() => setContentTarget(null)} />}
        </div>
    );
};

// --- CORE USER INTERFACE ---

const CourseListing = () => {
    const { courses } = useStore();
    return (
        <div className="pb-32 pt-20 px-6 min-h-screen bg-[#f8fafc]">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {courses.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-40 opacity-20">
                        <BookOpen className="w-20 h-20 mb-6" />
                        <p className="uppercase font-black tracking-[0.5em] text-xs">Waiting for admin broadcast</p>
                    </div>
                ) : courses.map(c => (
                    <div key={c.id} className="bg-white rounded-[50px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group animate-slide-up">
                        <div className="p-10 font-black text-gray-800 text-2xl italic tracking-tighter uppercase truncate">{c.title}</div>
                        <div className="px-10 pb-4">
                            <div className="aspect-video bg-gray-50 rounded-[40px] overflow-hidden border border-gray-100 shadow-inner group-hover:scale-[1.02] transition-transform duration-700">
                                <img src={c.image || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644'} className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <div className="p-10 pt-6">
                            <div className="flex items-center gap-3 mb-8 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-5 py-2.5 rounded-full inline-block">
                                <Smartphone className="w-4 h-4" /> {c.category} Node
                            </div>
                            <Link to={`/course/${c.id}`} className="block w-full py-6 bg-[#0056d2] text-white text-center text-sm font-black rounded-[30px] shadow-2xl shadow-blue-100 uppercase tracking-[0.3em] active:scale-95 transition-all">Access Content</Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CourseDetail = () => {
    const { id } = useParams<{id: string}>();
    const { courses } = useStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'Subjects' | 'About'>('Subjects');

    const course = courses.find(c => c.id === id);
    if (!course) return <Navigate to="/" />;

    return (
        <div className="pb-32 pt-0 min-h-screen bg-white">
            <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
                <div className="flex items-center gap-5 p-5 px-8">
                    <button onClick={() => navigate(-1)} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"><ArrowLeft className="w-7 h-7 text-gray-800" /></button>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tighter italic uppercase truncate">{course.title}</h1>
                </div>
                <div className="flex px-8 gap-10">
                    {(['Subjects', 'About'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-5 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === tab ? 'text-[#0056d2] border-[#0056d2]' : 'text-gray-300 border-transparent'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
            
            <Banner />

            <div className="p-8">
                {activeTab === 'Subjects' && (
                    <div className="space-y-6">
                        {(course.subjects || []).map((sub) => (
                            <div key={sub.id} onClick={() => navigate(`/course/${course.id}/subject/${sub.id}`)} className="bg-white border border-gray-100 rounded-[45px] p-8 flex items-center gap-8 shadow-sm active:scale-[0.98] transition-all hover:border-blue-500/20 hover:shadow-lg cursor-pointer group">
                                <div className="w-20 h-20 bg-blue-50 rounded-[28px] flex items-center justify-center text-[#0056d2] font-black text-2xl shadow-inner group-hover:scale-110 transition-transform">{sub.iconText}</div>
                                <div className="flex-1">
                                    <h3 className="font-black text-gray-800 text-xl italic uppercase tracking-tighter mb-3">{sub.title}</h3>
                                    <div className="flex items-center gap-6">
                                        <div className="flex-1 h-3 bg-gray-50 rounded-full overflow-hidden shadow-inner border border-gray-100"><div className="h-full bg-blue-600 w-[0%]"></div></div>
                                        <span className="text-[12px] font-black text-gray-400">0%</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-8 h-8 text-gray-200 group-hover:text-blue-500 transition-colors" />
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'About' && (
                    <div className="space-y-10 animate-fade-in max-w-4xl">
                        <div className="relative aspect-video rounded-[60px] overflow-hidden shadow-2xl shadow-blue-100">
                             <img src={course.image || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644'} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                        </div>
                        <div className="space-y-6">
                            <h2 className="text-4xl font-black text-gray-800 italic uppercase tracking-tighter leading-none">{course.title}</h2>
                            <p className="text-gray-500 text-lg leading-relaxed font-medium">{course.description}</p>
                            <div className="flex gap-4">
                                <div className="px-6 py-3 bg-blue-50 rounded-2xl text-[10px] font-black text-blue-600 uppercase tracking-widest border border-blue-100">Batch ID: {course.id}</div>
                                <div className="px-6 py-3 bg-gray-50 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100">{course.category} Node</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const SubjectDetail = () => {
    const { courseId, subjectId } = useParams<{courseId: string, subjectId: string}>();
    const { courses } = useStore();
    const navigate = useNavigate();
    const course = courses.find(c => c.id === courseId);
    const subject = course?.subjects.find(s => s.id === subjectId);
    if (!subject || !courseId) return <Navigate to="/" />;

    return (
        <div className="pb-32 pt-0 min-h-screen bg-white">
            <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
                <div className="flex items-center gap-6 p-6 px-8">
                    <button onClick={() => navigate(-1)} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"><ArrowLeft className="w-7 h-7 text-gray-800" /></button>
                    <h1 className="text-2xl font-black text-gray-800 italic uppercase tracking-tighter">{subject.title}</h1>
                </div>
            </div>
            <div className="p-8 space-y-8">
                {subject.chapters.length === 0 ? (
                    <div className="text-center py-40 opacity-10 font-black uppercase tracking-[0.4em] text-xs italic">Sequence Empty</div>
                ) : subject.chapters.map((chap, idx) => (
                    <div key={chap.id} className="bg-white border border-gray-100 rounded-[50px] p-10 shadow-sm space-y-8 animate-slide-up">
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-[#0056d2] text-[10px] font-black uppercase tracking-[0.3em] mb-3 block">Sequence Unit {idx + 1}</span>
                                <h3 className="font-black text-gray-800 text-3xl italic tracking-tighter uppercase leading-none">{chap.title}</h3>
                            </div>
                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 font-bold">{idx+1}</div>
                        </div>
                        <div className="grid gap-4">
                            {chap.videos.map(v => (
                                <button key={v.id} onClick={() => navigate(`/watch/${courseId}`)} className="w-full p-6 bg-gray-50 rounded-[35px] flex items-center gap-6 hover:bg-blue-600 hover:text-white transition-all duration-500 text-left group border border-transparent hover:shadow-xl hover:shadow-blue-200">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#0056d2] shadow-sm group-hover:scale-90 transition-transform"><Play className="w-6 h-6" /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black truncate group-hover:text-white uppercase tracking-tight">{v.title}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-70">{v.duration} • {v.type}</p>
                                    </div>
                                    <ChevronRight className="w-6 h-6 opacity-20 group-hover:opacity-100" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const WatchPage = () => {
    const { id } = useParams<{id: string}>();
    const { courses } = useStore();
    const navigate = useNavigate();
    const course = courses.find(c => c.id === id);
    const [activeVideo, setActiveVideo] = useState<Video | null>(null);

    useEffect(() => {
        if (course?.subjects?.[0]?.chapters?.[0]?.videos?.[0]) {
            setActiveVideo(course.subjects[0].chapters[0].videos[0]);
        }
    }, [course]);

    if (!course) return <Navigate to="/" />;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <div className="p-5 flex items-center gap-5 bg-gray-900 border-b border-white/10 z-50">
                <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"><ArrowLeft className="w-6 h-6" /></button>
                <h1 className="text-lg font-black italic uppercase tracking-tighter truncate">{activeVideo?.title || "Broadcasting..."}</h1>
            </div>
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                <div className="flex-1 bg-black flex items-center justify-center p-4">
                    {activeVideo ? <VideoPlayer src={activeVideo.filename} title={activeVideo.title} onBack={() => navigate(-1)} className="w-full max-w-5xl shadow-[0_0_100px_rgba(0,86,210,0.2)]" /> : <div className="text-gray-500 font-black italic">LOADING SIGNAL...</div>}
                </div>
                <div className="w-full lg:w-[400px] bg-gray-900 overflow-y-auto border-l border-white/10 p-8 no-scrollbar">
                    <h3 className="font-black mb-10 text-gray-500 uppercase text-xs tracking-[0.4em] italic">Sequence Playlist</h3>
                    <div className="space-y-10">
                        {course.subjects.map(sub => (
                            <div key={sub.id} className="space-y-4">
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">{sub.title} Node</p>
                                {sub.chapters.flatMap(c => c.videos).map(v => (
                                    <button key={v.id} onClick={() => setActiveVideo(v)} className={`w-full p-5 rounded-3xl flex items-center gap-5 transition-all duration-500 text-left border ${activeVideo?.id === v.id ? 'bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/10' : 'hover:bg-white/5 border-transparent'}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeVideo?.id === v.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-600'}`}>
                                          <PlayCircle className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-black truncate uppercase tracking-tight ${activeVideo?.id === v.id ? 'text-white' : 'text-gray-400'}`}>{v.title}</p>
                                            <p className="text-[9px] text-gray-600 font-black mt-1 uppercase">{v.duration}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Profile = () => {
    const { currentUser, logout } = useStore();
    if (!currentUser) return <Navigate to="/login" />;
    return (
        <div className="pb-32 pt-24 px-8 min-h-screen bg-[#f8fafc]">
            <div className="max-w-2xl mx-auto space-y-10">
                <div className="bg-white rounded-[70px] p-16 shadow-sm border border-gray-100 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full -mr-40 -mt-40 blur-3xl"></div>
                    <div className="w-40 h-40 rounded-[55px] bg-[#0056d2] flex items-center justify-center text-white text-6xl font-black shadow-2xl mx-auto mb-10 border-8 border-white animate-slide-up">{currentUser.name.charAt(0)}</div>
                    <h2 className="text-5xl font-black text-gray-800 uppercase italic tracking-tighter mb-4">{currentUser.name}</h2>
                    <p className="text-[#0056d2] font-black text-xs uppercase tracking-[0.4em] bg-blue-50 px-8 py-3 rounded-full inline-block mb-12 shadow-inner">{currentUser.role} Account</p>
                    <button onClick={logout} className="w-full py-8 text-red-500 font-black bg-red-50 rounded-[40px] shadow-xl shadow-red-100 active:scale-95 transition-all uppercase tracking-[0.4em] text-xs">Disconnect Session</button>
                </div>
                {currentUser.role === UserRole.ADMIN && <Link to="/admin" className="block w-full py-10 bg-gradient-to-r from-[#0056d2] to-[#003ea1] text-white rounded-[60px] text-center font-black shadow-2xl shadow-blue-200 uppercase tracking-[0.4em] text-xl active:scale-95 transition-transform italic">Open Master Control</Link>}
            </div>
        </div>
    );
};

const Login = () => {
    const { login, signup, currentUser } = useStore();
    const navigate = useNavigate();
    const [isS, setIsS] = useState(false);
    const [f, setF] = useState({ name: '', email: '', pass: '' });

    useEffect(() => { if (currentUser) navigate('/'); }, [currentUser, navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0056d2] relative overflow-hidden">
            <div className="absolute inset-0 futuristic-grid opacity-10 pointer-events-none"></div>
            <div className="text-center mb-16 relative z-10">
              <div className="w-28 h-28 bg-white rounded-[50px] flex items-center justify-center mx-auto mb-8 text-[#0056d2] text-5xl font-black shadow-[0_0_50px_rgba(255,255,255,0.3)] animate-bounce">S</div>
              <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase drop-shadow-2xl">Study Portal</h1>
            </div>
            <div className="bg-white p-14 rounded-[80px] w-full max-w-md shadow-[0_40px_100px_rgba(0,0,0,0.2)] animate-fade-in relative z-10 border border-white/20">
                <h2 className="text-3xl font-black text-gray-800 mb-14 text-center uppercase italic tracking-tighter">Initialize Identity</h2>
                <form onSubmit={e => { e.preventDefault(); if(isS) signup(f.name, f.email, '', f.pass); else if (!login(f.email, f.pass)) alert('Identity rejected. Access denied.'); }} className="space-y-6">
                    {isS && <input className="w-full p-6 bg-gray-50 rounded-[30px] outline-none font-black border-2 border-transparent focus:border-blue-500/20 transition-all shadow-inner" placeholder="Full Name" value={f.name} onChange={e => setF({...f, name: e.target.value})} required />}
                    <input className="w-full p-6 bg-gray-50 rounded-[30px] outline-none font-black border-2 border-transparent focus:border-blue-500/20 transition-all shadow-inner uppercase tracking-tight" placeholder="Email Signal" value={f.email} onChange={e => setF({...f, email: e.target.value})} required />
                    <input className="w-full p-6 bg-gray-50 rounded-[30px] outline-none font-black border-2 border-transparent focus:border-blue-500/20 transition-all shadow-inner" type="password" placeholder="Pass Sequence" value={f.pass} onChange={e => setF({...f, pass: e.target.value})} required />
                    <button className="w-full py-7 bg-[#0056d2] text-white font-black rounded-[40px] shadow-2xl shadow-blue-100 uppercase tracking-[0.4em] text-xl active:scale-95 transition-all mt-10">Sync Session</button>
                </form>
                <button onClick={() => setIsS(!isS)} className="w-full mt-14 text-[10px] text-[#0056d2] font-black uppercase text-center tracking-[0.5em]">{isS ? '< Back to Login' : 'Construct New Identity >'}</button>
            </div>
        </div>
    );
};

const MainContent = () => {
  const loc = useLocation();
  const isWatch = loc.pathname.startsWith('/watch') || loc.pathname.startsWith('/exam') || loc.pathname === '/login' || loc.pathname.startsWith('/temp-access');
  return (
    <div className="min-h-screen bg-gray-50">
      {!isWatch && <STHeader />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<CourseListing />} />
        <Route path="/courses" element={<CourseListing />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/course/:courseId/subject/:subjectId" element={<SubjectDetail />} />
        <Route path="/watch/:id" element={<WatchPage />} />
        <Route path="/exam/:id" element={<ExamMode />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/temp-access/:id" element={<TempAccessHandler />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {!isWatch && <STBottomNav />}
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
