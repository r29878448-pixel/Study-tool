
import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { 
  Home, BookOpen, User, Search, PlayCircle, Lock, 
  LayoutDashboard, Settings, Plus, Trash2, Edit, X, 
  CheckCircle, ExternalLink, Play, Bot, Brain, Loader2, ArrowLeft, 
  Video as VideoIcon, Sparkles, Send, Smartphone, List, Globe, Bell, 
  ChevronRight, MoreVertical, MessageCircle, FileText, Calendar, MessageSquare, Eye,
  RotateCcw, ImageIcon, Key, Clock, Shield, LogOut, Download, Save, Timer as TimerIcon, AlertCircle, Link as LinkIcon
} from './components/Icons';
import VideoPlayer from './components/VideoPlayer';
import ChatBot from './components/ChatBot';
import ExamMode from './components/ExamMode';
import { GoogleGenAI } from "@google/genai";
import { Course, Chapter, Video, UserRole, Subject, GeneratedNote, AppSettings } from './types';

declare var process: { env: { API_KEY: string } };

// --- SHARED UI COMPONENTS ---

const Banner = () => (
  <div className="bg-[#fff9e6] px-5 py-3.5 flex items-center justify-between text-[11px] font-semibold text-gray-700 border-b border-yellow-100">
    <span>Completion % depends on lecture and DPP progress!</span>
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
  const isTabbedView = location.pathname.startsWith('/course/') || location.pathname.startsWith('/subject/');

  if (isNoNav) return null;

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Batches', path: '/courses' },
    { label: 'My Study', path: '/my-courses' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-5 z-50 lg:px-10">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#0056d2] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-200">S</div>
            <span className="font-display font-extrabold text-[#0056d2] tracking-tight text-xl">{settings.appName}</span>
        </Link>
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
                <Link 
                    key={link.path} 
                    to={link.path} 
                    className={`text-sm font-bold transition-colors ${location.pathname === link.path ? 'text-[#0056d2]' : 'text-gray-500 hover:text-gray-800'}`}
                >
                    {link.label}
                </Link>
            ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-400 relative transition-colors hover:bg-gray-50 rounded-full"><Bell className="w-6 h-6" /></button>
        <Link to="/profile" className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center transition-transform active:scale-90 hover:shadow-md">
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
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-50 pb-safe shadow-sm md:hidden">
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

const TempAccessHandler = () => {
    const { id } = useParams<{id: string}>();
    const { grantTempAccess, courses, currentUser } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success'>('idle');
    
    // Find course name for better UX
    const courseName = courses.find(c => c.id === id)?.title || "Premium Batch";

    const handleVerify = () => {
        if (!currentUser) {
            navigate('/login', { state: { from: location } });
            return;
        }

        setStatus('verifying');
        setTimeout(() => {
            if (id) {
                grantTempAccess(id);
                setStatus('success');
                setTimeout(() => {
                    navigate(`/course/${id}`);
                }, 1500);
            }
        }, 2000);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 text-center">
            <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-gray-100 max-w-sm w-full animate-slide-up">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    {status === 'verifying' ? (
                        <Loader2 className="w-10 h-10 text-[#0056d2] animate-spin" />
                    ) : status === 'success' ? (
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    ) : (
                        <Shield className="w-10 h-10 text-[#0056d2]" />
                    )}
                </div>

                <h2 className="text-2xl font-black text-gray-800 mb-2">
                    {status === 'verifying' ? 'Verifying Link...' : status === 'success' ? 'Access Granted!' : 'Security Check'}
                </h2>
                
                <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">
                    {status === 'verifying' 
                        ? 'Validating your temporary access token. Please wait.' 
                        : status === 'success' 
                        ? 'Redirecting you to the batch content.'
                        : `You are about to access "${courseName}" for 24 hours.`}
                </p>

                {status === 'idle' && (
                    <button 
                        onClick={handleVerify}
                        className="w-full py-4 bg-[#0056d2] text-white font-bold rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-[#004bb5]"
                    >
                        Verify & Unlock
                    </button>
                )}
            </div>
            <p className="mt-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secured by Study Portal</p>
        </div>
    );
};

// --- SUBJECT & CHAPTER CONTENT MANAGER ---

const ContentManager = ({ course, onClose }: { course: Course, onClose: () => void }) => {
    const { updateCourse } = useStore();
    const [subjects, setSubjects] = useState<Subject[]>(course.subjects || []);
    const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
    const [editingVideo, setEditingVideo] = useState<{chapId: string, vid: Video} | null>(null);

    const handleSave = () => { updateCourse({ ...course, subjects }); onClose(); };
    const addSubject = () => { const title = prompt('Subject Title:'); const iconText = prompt('Icon:') || 'Su'; if (title) setSubjects([...subjects, { id: Date.now().toString(), title, iconText, chapters: [] }]); };
    const addChapter = (sId: string) => { const title = prompt('Chapter Title:'); if (title) setSubjects(subjects.map(s => s.id === sId ? { ...s, chapters: [...s.chapters, { id: Date.now().toString(), title, videos: [] }] } : s)); };
    const addVideo = (sId: string, cId: string) => { const title = prompt('Content Title:'); const url = prompt('Stream Link:'); const dur = prompt('Duration:') || '10:00'; const typeInput = prompt('Type (lecture/note/dpp):') || 'lecture'; const type = (['lecture', 'note', 'dpp'].includes(typeInput) ? typeInput : 'lecture') as any; if (title && url) setSubjects(subjects.map(s => s.id === sId ? { ...s, chapters: s.chapters.map(c => c.id === cId ? { ...c, videos: [...c.videos, { id: Date.now().toString(), title, filename: url, duration: dur, type, date: 'TODAY' }] } : c) } : s)); };
    const updateVideoData = () => { if (!editingVideo || !activeSubjectId) return; const { chapId, vid } = editingVideo; setSubjects(subjects.map(s => s.id === activeSubjectId ? { ...s, chapters: s.chapters.map(c => c.id === chapId ? { ...c, videos: c.videos.map(v => v.id === vid.id ? vid : v) } : c) } : s)); setEditingVideo(null); };
    const activeSubject = subjects.find(s => s.id === activeSubjectId);
    const activeChapter = activeSubject?.chapters.find(c => c.id === activeChapterId);

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl p-6 max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800"><VideoIcon className="text-blue-600" /> Content Manager</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X /></button>
                </div>
                <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-400 overflow-x-auto no-scrollbar"><button onClick={() => { setActiveSubjectId(null); setActiveChapterId(null); }} className={!activeSubjectId ? 'text-blue-600' : ''}>ROOT</button>{activeSubject && <><ChevronRight className="w-3 h-3" /><button onClick={() => setActiveChapterId(null)} className={activeSubjectId && !activeChapterId ? 'text-blue-600' : ''}>{activeSubject.title.toUpperCase()}</button></>}{activeChapter && <><ChevronRight className="w-3 h-3" /><span className="text-blue-600">{activeChapter.title.toUpperCase()}</span></>}</div>
                <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
                    {editingVideo ? (
                        <div className="space-y-4 bg-gray-50 p-6 rounded-xl animate-fade-in">
                            <h3 className="font-bold text-gray-700">Edit Node Data</h3>
                            <input value={editingVideo.vid.title} onChange={e => setEditingVideo({...editingVideo, vid: {...editingVideo.vid, title: e.target.value}})} className="w-full p-3 border rounded-lg" placeholder="Title" />
                            <input value={editingVideo.vid.filename} onChange={e => setEditingVideo({...editingVideo, vid: {...editingVideo.vid, filename: e.target.value}})} className="w-full p-3 border rounded-lg" placeholder="URL" />
                            <input value={editingVideo.vid.duration} onChange={e => setEditingVideo({...editingVideo, vid: {...editingVideo.vid, duration: e.target.value}})} className="w-full p-3 border rounded-lg" placeholder="Duration" />
                            <div className="flex gap-2"><button onClick={() => setEditingVideo(null)} className="flex-1 py-2 text-gray-500 font-bold bg-white border rounded-lg">Cancel</button><button onClick={updateVideoData} className="flex-1 py-2 bg-[#0056d2] text-white font-bold rounded-lg">Save</button></div>
                        </div>
                    ) : activeChapterId && activeSubjectId ? (
                        <div className="space-y-3"><button onClick={() => addVideo(activeSubjectId, activeChapterId)} className="w-full py-4 border-2 border-dashed border-blue-100 rounded-xl text-blue-600 font-bold hover:bg-blue-50">+ Add Content</button>{activeChapter?.videos.map(vid => (<div key={vid.id} className="p-4 bg-white border border-gray-200 rounded-xl flex justify-between items-center shadow-sm"><div className="truncate pr-4"><p className="text-sm font-bold text-gray-800 truncate">{vid.title}</p></div><div className="flex gap-1"><button onClick={() => setEditingVideo({chapId: activeChapterId, vid})} className="p-2 text-gray-400 hover:text-blue-500"><Edit className="w-4 h-4" /></button><button onClick={() => setSubjects(subjects.map(s => s.id === activeSubjectId ? {...s, chapters: s.chapters.map(c => c.id === activeChapterId ? {...c, videos: c.videos.filter(v => v.id !== vid.id)} : c)} : s))} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button></div></div>))}</div>
                    ) : activeSubjectId ? (
                        <div className="space-y-3"><button onClick={() => addChapter(activeSubjectId)} className="w-full py-4 border-2 border-dashed border-blue-100 rounded-xl text-blue-600 font-bold hover:bg-blue-50">+ Add Chapter</button>{activeSubject?.chapters.map(chap => (<div key={chap.id} className="p-4 bg-white border border-gray-200 rounded-xl flex justify-between items-center shadow-sm"><button onClick={() => setActiveChapterId(chap.id)} className="flex-1 text-left font-bold text-gray-700">{chap.title}</button><button onClick={() => setSubjects(subjects.map(s => s.id === activeSubjectId ? {...s, chapters: s.chapters.filter(c => c.id !== chap.id)} : s))} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button></div>))}</div>
                    ) : (
                        <div className="space-y-3"><button onClick={addSubject} className="w-full py-4 border-2 border-dashed border-blue-100 rounded-xl text-blue-600 font-bold hover:bg-blue-50">+ Add Subject</button>{subjects.map(sub => (<div key={sub.id} className="p-4 bg-white border border-gray-200 rounded-xl flex justify-between items-center shadow-sm group"><button onClick={() => setActiveSubjectId(sub.id)} className="flex items-center gap-4 flex-1 text-left"><div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">{sub.iconText}</div><span className="font-bold text-gray-800">{sub.title}</span></button><button onClick={() => setSubjects(subjects.filter(s => s.id !== sub.id))} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button></div>))}</div>
                    )}
                </div>
                <div className="mt-6 pt-6 border-t flex gap-3"><button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">Discard</button><button onClick={handleSave} className="flex-1 py-3 bg-[#0056d2] text-white font-bold rounded-xl shadow-lg">Commit</button></div>
            </div>
        </div>
    );
};

// --- ADMIN PANEL ---

const AdminPanel = () => {
    const { currentUser, courses, settings, addCourse, updateCourse, deleteCourse, users, manageUserRole, createUser, updateSettings, adminEnrollUser, adminRevokeUser } = useStore();
    const [tab, setTab] = useState<'batches' | 'users' | 'settings'>('batches');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Course | null>(null);
    const [contentTarget, setContentTarget] = useState<Course | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: UserRole.USER });
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [settingsForm, setSettingsForm] = useState<AppSettings>(settings);
    const [courseToAddId, setCourseToAddId] = useState('');
    const [form, setForm] = useState({ title: '', description: '', image: '', category: '', price: 0, mrp: 0, isPaid: false, accessKey: '', shortenerLink: '', telegramLink: '', startDate: '', endDate: '', isNew: true });
    const [generatingLink, setGeneratingLink] = useState(false);

    useEffect(() => { setSettingsForm(settings); }, [settings]);
    useEffect(() => { if (editing) { setForm({ title: editing.title, description: editing.description, image: editing.image, category: editing.category, price: editing.price, mrp: editing.mrp, isPaid: !!editing.isPaid, accessKey: editing.accessKey || '', shortenerLink: editing.shortenerLink || '', telegramLink: editing.telegramLink || '', startDate: editing.startDate || '', endDate: editing.endDate || '', isNew: editing.isNew ?? true }); } else setForm({ title: '', description: '', image: '', category: '', price: 0, mrp: 0, isPaid: false, accessKey: '', shortenerLink: '', telegramLink: '', startDate: '', endDate: '', isNew: true }); }, [editing, showModal]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setForm(prev => ({ ...prev, image: reader.result as string })); reader.readAsDataURL(file); } };
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.EDITOR)) return <Navigate to="/" />;
    const handleSaveCourse = (e: React.FormEvent) => { e.preventDefault(); const data: Course = { ...(editing || { id: Date.now().toString(), subjects: [], createdAt: new Date().toISOString() }), ...form }; if (editing) updateCourse(data); else addCourse(data); setShowModal(false); };
    const handleCreateUser = (e: React.FormEvent) => { e.preventDefault(); if (users.some(u => u.email.toLowerCase() === userForm.email.toLowerCase())) { alert("User exists."); return; } createUser({ id: Date.now().toString(), name: userForm.name, email: userForm.email, phone: '', password: userForm.password, role: userForm.role, purchasedCourseIds: [], lastLogin: new Date().toISOString(), tempAccess: {} }); setShowUserModal(false); setUserForm({ name: '', email: '', password: '', role: UserRole.USER }); };
    const handleSaveSettings = (e: React.FormEvent) => { e.preventDefault(); updateSettings(settingsForm); alert("System configurations updated."); };
    
    // Updated Link Generation for BrowserRouter (no hash)
    const generateShortLink = async () => { 
        if(!editing) { alert("Save batch first."); return; } 
        setGeneratingLink(true); 
        const targetId = editing.id; 
        // Changed URL structure to match BrowserRouter (removed /#)
        const longUrl = `${window.location.origin}/temp-access/${targetId}`; 
        const apiBase = settings.linkShortenerApiUrl || 'https://vplink.in/api'; 
        const apiKey = settings.linkShortenerApiKey || '320f263d298979dc11826b8e2574610ba0cc5d6b'; 
        const apiUrl = `${apiBase}?api=${apiKey}&url=${encodeURIComponent(longUrl)}`; 
        try { 
            const res = await fetch(apiUrl); 
            const text = await res.text(); 
            let shortUrl = text; 
            try { 
                const json = JSON.parse(text); 
                if(json.shortenedUrl) shortUrl = json.shortenedUrl; 
                else if(json.link) shortUrl = json.link; 
            } catch(e) {} 
            if (shortUrl && shortUrl.startsWith('http')) { 
                setForm(prev => ({ ...prev, shortenerLink: shortUrl })); 
            } else { 
                setForm(prev => ({ ...prev, shortenerLink: longUrl })); 
                alert("Shortener failed. Using long URL."); 
            } 
        } catch (e) { 
            setForm(prev => ({ ...prev, shortenerLink: longUrl })); 
            alert("Network error."); 
        } finally { 
            setGeneratingLink(false); 
        } 
    };

    const availableTabs = currentUser.role === UserRole.ADMIN ? ['batches', 'users', 'settings'] as const : ['batches'] as const;
    const getUserCourses = (u: any) => { const permanent = u.purchasedCourseIds || []; const allIds = [...new Set(permanent)]; return courses.filter(c => allIds.includes(c.id)); };
    const getExamStats = (u: any) => { const results = u.examResults || []; const totalExams = results.length; const avgScore = totalExams > 0 ? Math.round(results.reduce((acc: number, curr: any) => acc + (curr.score / curr.totalQuestions * 100), 0) / totalExams) : 0; return { totalExams, avgScore, results }; };
    const handleAddCourseToUser = () => { if(selectedUser && courseToAddId) { adminEnrollUser(selectedUser.id, courseToAddId); const updatedUser = users.find(u => u.id === selectedUser.id); if(updatedUser) setSelectedUser({...updatedUser, purchasedCourseIds: [...(updatedUser.purchasedCourseIds || []), courseToAddId]}); setCourseToAddId(''); } };
    const handleRemoveCourseFromUser = (cId: string) => { if(selectedUser && confirm('Revoke access?')) { adminRevokeUser(selectedUser.id, cId); const updatedPurchases = (selectedUser.purchasedCourseIds || []).filter((id: string) => id !== cId); setSelectedUser({...selectedUser, purchasedCourseIds: updatedPurchases}); } };

    return (
        <div className="pb-24 pt-24 px-4 min-h-screen bg-[#f8fafc]">
             <div className="max-w-6xl mx-auto">
                 {currentUser.isDemo && <div className="bg-amber-100 border border-amber-200 text-amber-800 p-4 rounded-[20px] mb-6 flex items-center gap-3 shadow-sm animate-pulse"><AlertCircle className="w-6 h-6" /><div><p className="font-bold text-sm">Demo Mode Active</p><p className="text-xs opacity-80">You have full admin access, but changes will NOT be saved to the database.</p></div></div>}
                 <div className="flex bg-white p-1.5 rounded-[24px] shadow-sm border border-gray-100 mb-8 overflow-hidden max-w-md">
                    {availableTabs.map(t => (<button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 font-bold capitalize transition-all rounded-[18px] text-sm ${tab === t ? 'bg-[#0056d2] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>{t}</button>))}
                 </div>
                 {tab === 'batches' && (
                     <div className="space-y-4">
                         <button onClick={() => { setEditing(null); setShowModal(true); }} className="w-full py-10 bg-white border-2 border-dashed border-blue-200 rounded-[32px] text-[#0056d2] font-bold flex flex-col items-center justify-center gap-2 hover:bg-blue-50 transition-all"><Plus className="w-8 h-8" /><span>INITIALIZE NEW BATCH</span></button>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {courses.map(c => (
                                 <div key={c.id} className="bg-white p-4 rounded-[28px] flex flex-col gap-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                     <div className="flex items-center gap-4">
                                         <img src={c.image} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                                         <div className="flex-1 min-w-0"><h3 className="font-bold text-gray-800 text-sm truncate">{c.title}</h3><p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{c.category} • {c.isPaid ? 'Paid' : 'Free'}</p></div>
                                     </div>
                                     <div className="flex gap-2 w-full"><button onClick={() => setContentTarget(c)} className="flex-1 py-2 bg-[#0056d2] text-white rounded-xl font-bold text-[10px] active:scale-95 transition-all">CONTENT</button><button onClick={() => { setEditing(c); setShowModal(true); }} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>{currentUser.role === UserRole.ADMIN && <button onClick={() => { if(confirm('Delete batch sequence?')) deleteCourse(c.id); }} className="p-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>}</div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}
                {/* Users and Settings tabs content ... (Keeping logic same, just structure) */}
                {tab === 'users' && currentUser.role === UserRole.ADMIN && (
                    <div className="space-y-4"><button onClick={() => setShowUserModal(true)} className="w-full py-4 bg-white border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-brand hover:text-brand flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Create New User</button><div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-y md:divide-y-0 md:gap-4 md:bg-transparent md:border-0">{users.map(u => (<div key={u.id} className="p-4 flex justify-between items-center hover:bg-gray-50 bg-white md:rounded-2xl md:border md:border-gray-200 md:shadow-sm"><div className="flex-1 min-w-0 pr-4"><div className="flex items-center gap-2"><p className="font-bold text-gray-800 truncate">{u.name}</p>{u.role === UserRole.ADMIN && <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded">ADMIN</span>}{u.role === UserRole.EDITOR && <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-600 rounded">MANAGER</span>}</div><p className="text-xs text-gray-500 truncate">{u.email}</p></div><div className="flex items-center gap-2"><button onClick={() => setSelectedUser(u)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="View Progress"><Eye className="w-4 h-4" /></button><select value={u.role} onChange={(e) => manageUserRole(u.id, e.target.value as UserRole)} disabled={u.id === currentUser.id} className="text-xs font-bold px-3 py-2 bg-gray-100 rounded-lg border-none outline-none cursor-pointer hover:bg-gray-200"><option value={UserRole.USER}>User</option><option value={UserRole.EDITOR}>Manager</option><option value={UserRole.ADMIN}>Admin</option></select></div></div>))}</div></div>
                )}
                {tab === 'settings' && currentUser.role === UserRole.ADMIN && (
                    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 animate-fade-in"><div className="flex items-center gap-3 mb-8"><div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0056d2]"><Settings className="w-6 h-6" /></div><div><h2 className="text-xl font-bold text-gray-800">System Configurations</h2><p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Global API & Access Controls</p></div></div><form onSubmit={handleSaveSettings} className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Application Name</label><input value={settingsForm.appName} onChange={e => setSettingsForm({...settingsForm, appName: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm" /></div><div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Admin Email</label><input value={settingsForm.adminEmail} onChange={e => setSettingsForm({...settingsForm, adminEmail: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm" /></div></div><div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Payment Bot URL (Telegram)</label><input value={settingsForm.botUrl || ''} onChange={e => setSettingsForm({...settingsForm, botUrl: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-mono text-xs" placeholder="https://t.me/your_bot" /><p className="text-[10px] text-gray-400 ml-2">Users are redirected here to buy permanent access keys.</p></div><div className="p-6 bg-blue-50 rounded-[28px] space-y-4 border border-blue-100"><h3 className="text-sm font-bold text-blue-800 flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Link Shortener Service</h3><div className="space-y-2"><label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">API Endpoint URL</label><input value={settingsForm.linkShortenerApiUrl || ''} onChange={e => setSettingsForm({...settingsForm, linkShortenerApiUrl: e.target.value})} className="w-full p-4 bg-white border border-blue-100 rounded-2xl font-mono text-xs text-blue-600" placeholder="https://vplink.in/api" /></div><div className="space-y-2"><label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">API Key</label><input value={settingsForm.linkShortenerApiKey || ''} onChange={e => setSettingsForm({...settingsForm, linkShortenerApiKey: e.target.value})} type="password" className="w-full p-4 bg-white border border-blue-100 rounded-2xl font-mono text-xs text-blue-600" /></div></div><button type="submit" className="w-full py-5 bg-[#0056d2] text-white font-black rounded-3xl shadow-xl shadow-blue-100 active:scale-95 transition-all uppercase tracking-[0.2em] text-sm">Save Configuration</button></form></div>
                )}
             </div>
             {/* Modals ... (Using existing modal code structure) */}
             {selectedUser && (
                <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white w-full max-w-2xl rounded-[40px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar animate-slide-up"><div className="flex justify-between items-start mb-8"><div className="flex items-center gap-4"><div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-200">{selectedUser.name.charAt(0)}</div><div><h2 className="text-2xl font-bold text-gray-800">{selectedUser.name}</h2><p className="text-gray-500 text-sm font-medium">{selectedUser.email}</p><div className="flex gap-2 mt-2"><span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-600 uppercase tracking-wider">{selectedUser.role}</span>{selectedUser.lastLogin && <span className="px-3 py-1 bg-green-50 rounded-full text-[10px] font-bold text-green-600 uppercase tracking-wider">Active: {new Date(selectedUser.lastLogin).toLocaleDateString()}</span>}</div></div></div><button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400" /></button></div><div className="space-y-6"><div><div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-500" /> Active Enrollments</h3><div className="flex gap-2"><select value={courseToAddId} onChange={(e) => setCourseToAddId(e.target.value)} className="text-xs p-2 border rounded-lg bg-gray-50 outline-none max-w-[150px]"><option value="">Select Batch...</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select><button onClick={handleAddCourseToUser} disabled={!courseToAddId} className="px-3 py-2 bg-[#0056d2] text-white rounded-lg text-xs font-bold disabled:opacity-50">Add</button></div></div><div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">{getUserCourses(selectedUser).length > 0 ? (getUserCourses(selectedUser).map(c => (<div key={c.id} className="p-4 border-b last:border-0 border-gray-100 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-sm font-bold text-gray-700">{c.title}</span></div><button onClick={() => handleRemoveCourseFromUser(c.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></div>))) : (<div className="p-6 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No Active Enrollments</div>)}</div></div><div><h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Bot className="w-4 h-4 text-blue-500" /> Recent Performance</h3><div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">{getExamStats(selectedUser).results.length > 0 ? (getExamStats(selectedUser).results.slice().reverse().map((res: any, idx: number) => { const courseTitle = courses.find(c => c.id === res.courseId)?.title || 'Unknown Course'; const percentage = Math.round((res.score / res.totalQuestions) * 100); return (<div key={idx} className="p-4 border-b last:border-0 border-gray-100 flex items-center justify-between"><div><div className="text-xs font-bold text-gray-800">{courseTitle}</div><div className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{new Date(res.date).toLocaleDateString()}</div></div><div className="flex items-center gap-3"><div className="text-right"><div className="text-sm font-black text-gray-800">{res.score}/{res.totalQuestions}</div><div className={`text-[9px] font-bold ${percentage >= 70 ? 'text-green-500' : 'text-orange-500'}`}>{percentage}% Score</div></div><div className="w-10 h-10 rounded-full border-4 border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400 relative"><div className="absolute inset-0 rounded-full border-4 border-blue-500" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${percentage}%, 0 ${percentage}%)` }}></div>{percentage}</div></div></div>); })) : (<div className="p-6 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No Exam Data Available</div>)}</div></div></div></div></div>
             )}
             {/* Add/Edit Modal - RESTORED ORIGINAL UI */}
             {showModal && (
                 <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar border border-gray-100 animate-slide-up">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{editing ? 'Edit Batch Configuration' : 'Initialize New Batch Node'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X /></button>
                        </div>
                        <form onSubmit={handleSaveCourse} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Identity Thumbnail</label>
                                <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center group shadow-inner">
                                    {form.image ? (
                                        <>
                                            <img src={form.image} className="w-full h-full object-cover" alt="Preview" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button type="button" onClick={() => setForm({...form, image: ''})} className="bg-white text-red-500 p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-6">
                                            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2 opacity-50" />
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inject Thumbnail URL</p>
                                            <label className="mt-3 px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-200">
                                                Upload
                                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                            </label>
                                        </div>
                                    )}
                                </div>
                                <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl font-mono text-[10px] shadow-sm" placeholder="https://domain.com/thumbnail.jpg" />
                            </div>

                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold shadow-sm" placeholder="Course Title" required />
                            
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-500 font-medium text-xs shadow-sm min-h-[100px]" placeholder="Description" required />

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">24h Access Link (Temporary)</label>
                                <div className="flex gap-2">
                                    <input value={form.shortenerLink} onChange={e => setForm({...form, shortenerLink: e.target.value})} className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-mono shadow-sm" placeholder="Generate link ->" />
                                    <button type="button" onClick={generateShortLink} disabled={generatingLink} className="px-4 bg-brand/10 text-brand font-bold rounded-xl text-[10px] hover:bg-brand/20 disabled:opacity-50 uppercase tracking-wider">{generatingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Auto Generate'}</button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Enrollment Key (Permanent Access)</label>
                                <input value={form.accessKey} onChange={e => setForm({ ...form, accessKey: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono shadow-sm" placeholder="Required for Bot Purchase (e.g. BATCH2025)" />
                                <p className="text-[9px] text-gray-400 ml-1">Users will receive this key from the bot after payment.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs uppercase font-bold shadow-sm" placeholder="Category" required />
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm cursor-pointer" onClick={() => setForm({...form, isPaid: !form.isPaid})}>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Paid</span>
                                    <div className={`w-10 h-5 rounded-full relative transition-all ${form.isPaid ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.isPaid ? 'left-5.5' : 'left-0.5'}`} />
                                    </div>
                                </div>
                            </div>

                            {form.isPaid && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Price</label>
                                        <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs shadow-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">MRP</label>
                                        <input type="number" value={form.mrp} onChange={e => setForm({ ...form, mrp: Number(e.target.value) })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs shadow-sm" />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Node Active</label>
                                    <input value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs shadow-sm" placeholder="Start Date" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Node Expiry</label>
                                    <input value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs shadow-sm" placeholder="End Date" />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="w-full py-5 bg-[#0056d2] text-white font-black rounded-3xl shadow-xl shadow-blue-100 active:scale-95 transition-all uppercase tracking-[0.2em] text-sm">Commit Sequence</button>
                            </div>
                        </form>
                    </div>
                 </div>
             )}
             {showUserModal && (
                 <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"><div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-800">Create New User</h2><button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button></div><form onSubmit={handleCreateUser} className="space-y-4"><div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Full Name</label><input value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className="w-full p-3 border rounded-lg bg-gray-50" required /></div><div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Email</label><input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="w-full p-3 border rounded-lg bg-gray-50" required /></div><div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Password</label><input type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className="w-full p-3 border rounded-lg bg-gray-50" required /></div><div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Role</label><select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value as UserRole })} className="w-full p-3 border rounded-lg bg-gray-50"><option value={UserRole.USER}>User</option><option value={UserRole.EDITOR}>Manager</option><option value={UserRole.ADMIN}>Admin</option></select></div><button type="submit" className="w-full py-3 bg-brand text-white font-bold rounded-lg hover:bg-brand-dark shadow-md mt-4">Create User</button></form></div></div>
             )}
             {contentTarget && <ContentManager course={contentTarget} onClose={() => setContentTarget(null)} />}
        </div>
    );
};

const CourseListing = () => {
    const { courses, currentUser } = useStore();

    if (!currentUser) return <Navigate to="/login" />;

    return (
        <div className="pb-24 pt-20 px-5 min-h-screen bg-[#f8fafc]">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {courses.length === 0 ? (
                        <div className="col-span-full text-center py-20 animate-fade-in">
                            <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No active nodes in this sector</p>
                        </div>
                    ) : courses.map(c => (
                        <div key={c.id} className="bg-white rounded-[40px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 animate-slide-up flex flex-col">
                            <div className="p-7 flex justify-between items-center">
                                <div className="flex items-center gap-2.5">
                                    <h3 className="text-lg font-black text-gray-800 tracking-tight truncate max-w-[200px]">{c.title}</h3>
                                    {c.isNew && <span className="bg-[#fff9e6] text-[#eab308] text-[9px] font-black px-2.5 py-1 rounded-lg border border-yellow-200 uppercase tracking-tighter shadow-sm">New</span>}
                                </div>
                            </div>
                            <div className="px-7 relative group">
                                <img src={c.image} className="w-full aspect-[16/9] object-cover rounded-[30px] group-hover:scale-[1.02] transition-transform duration-700" alt={c.title} />
                                {!c.isPaid && <div className="absolute top-4 left-11 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-[10px] font-black text-gray-800 shadow-xl ring-1 ring-black/5 uppercase tracking-widest">Free Node</div>}
                            </div>
                            <div className="p-7 pt-5 space-y-6 flex-1 flex flex-col justify-between">
                                <div className="flex items-center gap-5 text-[11px] font-bold text-gray-400">
                                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-brand/50" /><span>Starts {c.startDate}</span></div>
                                    <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
                                    <div className="flex items-center gap-2"><span>Ends {c.endDate}</span></div>
                                </div>
                                <div className="flex gap-4">
                                    <Link to={`/course/${c.id}`} className="flex-1 py-4 bg-[#0056d2] text-white text-center text-sm font-black rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all uppercase tracking-widest">Let's Study</Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const CourseDetail = () => {
    const { id } = useParams<{id: string}>();
    const { courses, currentUser, enrollCourse, settings } = useStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'Subjects' | 'Description'>('Subjects');
    const [accessKeyInput, setAccessKeyInput] = useState('');
    const [showKeyInput, setShowKeyInput] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    const course = courses.find(c => c.id === id);
    if (!course) return <Navigate to="/" />;

    // --- ACCESS LOGIC ---
    // Safe access to array using fallback
    const isOwner = currentUser && (
        currentUser.role === UserRole.ADMIN || 
        currentUser.role === UserRole.EDITOR || // Allow Managers to view content
        (currentUser.purchasedCourseIds || []).includes(course.id)
    );
    
    // Check temp access validity
    let hasTempAccess = false;
    let tempExpiry = null;
    
    if (currentUser?.tempAccess?.[course.id]) {
        const expiryDate = new Date(currentUser.tempAccess[course.id]);
        if (expiryDate > new Date()) {
            hasTempAccess = true;
            tempExpiry = expiryDate;
        }
    }

    const hasAccess = !course.isPaid || isOwner || hasTempAccess;

    // --- COUNTDOWN TIMER ---
    useEffect(() => {
        if (!hasTempAccess || !tempExpiry) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = tempExpiry.getTime() - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft('EXPIRED');
                // Force re-render to lock content
                navigate(0); 
            } else {
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [hasTempAccess, tempExpiry, navigate]);


    const handleKeySubmit = () => {
        if(course.accessKey && accessKeyInput === course.accessKey) {
            enrollCourse(course.id);
            alert("✅ Access Granted Successfully!");
        } else {
            alert("❌ Invalid Access Key");
        }
    };

    const handleExternalLink = () => {
        if (course.shortenerLink) {
            // CRITICAL FIX: Redirect to shortener link instead of internal path
            window.location.href = course.shortenerLink;
        } else {
            alert("Verification link not yet generated by Admin. Please contact support.");
        }
    };

    return (
        <div className="pb-24 pt-0 min-h-screen bg-white">
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex items-center justify-between p-4 px-6 max-w-7xl mx-auto">
                    <div className="flex items-center gap-5">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-gray-800" /></button>
                        <h1 className="text-xl font-black text-gray-800 truncate max-w-[180px] md:max-w-lg tracking-tight">{course.title}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Countdown Timer Display */}
                        {hasTempAccess && timeLeft && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg animate-pulse">
                                <TimerIcon className="w-4 h-4 text-red-500" />
                                <span className="text-xs font-bold text-red-600 font-mono">{timeLeft}</span>
                            </div>
                        )}
                        <XPBadge />
                        <Bell className="w-6 h-6 text-gray-600" />
                        <MoreVertical className="w-6 h-6 text-gray-600" />
                    </div>
                </div>
                
                <div className="max-w-7xl mx-auto">
                    <div className="flex px-6 gap-8 overflow-x-auto no-scrollbar">
                        {(['Subjects', 'Description'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-black whitespace-nowrap transition-all border-b-4 ${activeTab === tab ? 'text-[#0056d2] border-[#0056d2]' : 'text-gray-400 border-transparent'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <Banner />
            <div className="p-6 relative max-w-7xl mx-auto">
                {!hasAccess && activeTab === 'Subjects' && (
                    <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
                        <Lock className="w-16 h-16 text-gray-300 mb-4 animate-bounce" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Content Locked</h3>
                        <p className="text-gray-500 mb-8 max-w-xs text-sm">Access this premium batch using one of the options below.</p>
                        
                        <div className="flex flex-col gap-4 w-full max-w-xs animate-slide-up">
                             {/* Option 1: Temporary Access with Shortener Verification */}
                             <button 
                                onClick={handleExternalLink}
                                className="w-full py-4 bg-[#0056d2] text-white font-bold rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 group hover:bg-[#004bb5]"
                             >
                                <Clock className="w-5 h-5 group-hover:animate-pulse" />
                                Get 24h Free Access
                             </button>

                             {/* Option 2: Enrollment Key */}
                             {!showKeyInput ? (
                                <button 
                                    onClick={() => setShowKeyInput(true)} 
                                    className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <Key className="w-5 h-5 text-gray-400" />
                                    Have an Enrollment Key?
                                </button>
                             ) : (
                                <div className="bg-white p-2 rounded-2xl border-2 border-[#0056d2] shadow-sm animate-fade-in flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Enter Key..." 
                                            className="flex-1 p-2 text-sm font-bold text-gray-700 outline-none bg-transparent"
                                            value={accessKeyInput}
                                            onChange={e => setAccessKeyInput(e.target.value)}
                                            autoFocus
                                        />
                                        <button 
                                            onClick={handleKeySubmit}
                                            className="bg-[#0056d2] text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#003ea1] shadow-md"
                                        >
                                            Unlock
                                        </button>
                                    </div>
                                    <button onClick={() => setShowKeyInput(false)} className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hover:text-red-500 self-center pb-1">Cancel</button>
                                </div>
                             )}

                             {/* Option 3: Buy Key */}
                             {course.price > 0 && (
                                <div className="text-center mt-4">
                                    <div className="flex items-center gap-3 my-3">
                                        <div className="h-px bg-gray-200 flex-1"></div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Premium Access</span>
                                        <div className="h-px bg-gray-200 flex-1"></div>
                                    </div>
                                    <button 
                                        onClick={() => window.open(settings.botUrl || 'https://t.me/rk_payment_bot', '_blank')}
                                        className="w-full py-4 bg-[#229ED9] text-white font-bold rounded-2xl shadow-lg hover:bg-[#1e8dbf] transition-all flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        <Send className="w-5 h-5 -rotate-45 mb-1" />
                                        Buy Enrollment Key
                                    </button>
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                        Click above to buy key via Telegram bot, then enter it above.
                                    </p>
                                </div>
                             )}
                        </div>
                    </div>
                )}
                {activeTab === 'Subjects' && (
                    <div className={`space-y-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${!hasAccess ? 'blur-md select-none pointer-events-none opacity-50' : ''}`}>
                        {(course.subjects || []).map((sub) => (
                            <div key={sub.id} onClick={() => hasAccess && navigate(`/course/${course.id}/subject/${sub.id}`)} className="bg-white border border-gray-100 rounded-[35px] p-6 flex items-center gap-6 shadow-sm active:scale-[0.98] transition-all hover:border-blue-200 hover:shadow-md cursor-pointer h-full">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0056d2] font-black text-xl border border-blue-100 shadow-inner shrink-0">{sub.iconText}</div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-gray-800 text-lg leading-tight mb-2 truncate">{sub.title}</h3>
                                    <div className="flex items-center gap-5 mt-3">
                                        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-[#0056d2] w-[0%]"></div></div>
                                        <span className="text-[12px] font-black text-gray-400">0%</span>
                                    </div>
                                </div>
                                {hasAccess ? <ChevronRight className="w-6 h-6 text-gray-300" /> : <Lock className="w-5 h-5 text-gray-400" />}
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'Description' && (
                    <div className="space-y-8 animate-fade-in md:flex md:gap-8 md:space-y-0">
                        <div className="relative group md:w-1/3">
                             <img src={course.image} className="w-full h-56 md:h-80 object-cover rounded-[50px] shadow-2xl" alt="" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-[50px]"></div>
                        </div>
                        <div className="md:w-2/3">
                            <h2 className="text-3xl font-black text-gray-800 mb-4 tracking-tight">{course.title}</h2>
                            <p className="text-gray-500 text-base leading-relaxed font-medium">{course.description}</p>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex justify-center pb-safe z-40">
                {hasAccess ? (
                    <Link to={`/exam/${course.id}`} className="flex items-center gap-2 px-6 py-3 bg-[#0056d2] text-white font-bold rounded-full shadow-lg hover:bg-[#003ea1] transition-transform active:scale-95">
                        <Bot className="w-5 h-5" /> Take AI Assessment
                    </Link>
                ) : (
                    <div className="text-xs font-bold text-gray-500 flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Assessment Locked
                    </div>
                )}
            </div>
        </div>
    );
};

// ... (SubjectDetail, WatchPage, Profile, Login, MainContent, App same as before) ...
// Ensure SubjectDetail access check also respects temp access expiry
const SubjectDetail = () => {
    // ... (No changes to SubjectDetail Logic)
    const { courseId, subjectId } = useParams<{courseId: string, subjectId: string}>();
    const { courses, saveGeneratedNote, currentUser } = useStore();
    const navigate = useNavigate();
    const [tab, setTab] = useState<'Chapters' | 'Notes'>('Chapters');
    const [filter, setFilter] = useState('All');
    const [generatingNotes, setGeneratingNotes] = useState(false);
    
    const course = courses.find(c => c.id === courseId);
    const subject = course?.subjects.find(s => s.id === subjectId);
    if (!subject || !courseId) return <Navigate to="/" />;

    let hasTempAccess = false;
    if (currentUser?.tempAccess?.[courseId]) {
        if (new Date(currentUser.tempAccess[courseId]) > new Date()) {
            hasTempAccess = true;
        }
    }

    const hasAccess = !course?.isPaid || 
    (currentUser && (
      currentUser.role === UserRole.ADMIN || 
      currentUser.role === UserRole.EDITOR || // Allow Managers to view content
      currentUser.purchasedCourseIds.includes(courseId) || 
      hasTempAccess
    ));

    if (!hasAccess) return <Navigate to={`/course/${courseId}`} />;

    const handleGenerateNotes = async () => {
        setGeneratingNotes(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Generate highly concise educational summary (notes) for "${subject.title}" based on these chapter topics: ${subject.chapters.map(c => c.title).join(', ')}. Use professional teaching tone. Structure with clear headings using Markdown.`;
            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            const text = response.text || "No content generated.";
            
            const note: GeneratedNote = {
                id: Date.now().toString(),
                videoId: 'subject-summary',
                videoTitle: `${subject.title} Summary`,
                subjectName: subject.title,
                content: text,
                createdAt: new Date().toISOString(),
                syllabusYear: '2025'
            };
            saveGeneratedNote(note);
            alert("Notes generated and saved to your Profile!");
        } catch (e) { 
            console.error(e);
            alert("AI generation failed."); 
        } finally { 
            setGeneratingNotes(false); 
        }
    };

    return (
        <div className="pb-24 pt-0 min-h-screen bg-white">
            {/* ... Header and Tabs ... */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex items-center justify-between p-4 px-6 max-w-7xl mx-auto">
                    <div className="flex items-center gap-5">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-gray-800" /></button>
                        <h1 className="text-xl font-black text-gray-800 tracking-tight">{subject.title}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleGenerateNotes} disabled={generatingNotes} className="text-[#0056d2] p-2.5 rounded-2xl hover:bg-blue-50 border border-blue-100 transition-all active:scale-90">
                          {generatingNotes ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                        </button>
                        <XPBadge />
                    </div>
                </div>
                <div className="max-w-7xl mx-auto">
                    <div className="flex px-6 gap-10">
                        {(['Chapters', 'Study Material'] as const).map(t => (
                            <button key={t} onClick={() => setTab(t === 'Chapters' ? 'Chapters' : 'Notes')} className={`pb-4 text-sm font-black border-b-4 transition-all ${tab === (t === 'Chapters' ? 'Chapters' : 'Notes') ? 'text-[#0056d2] border-[#0056d2]' : 'text-gray-400 border-transparent'}`}>{t}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-8 pb-32 max-w-7xl mx-auto">
                {tab === 'Chapters' ? (
                  subject.chapters.length === 0 ? (
                    <div className="text-center py-32 opacity-30 italic font-black uppercase text-[10px] tracking-widest">No data sequences discovered</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {subject.chapters.map((chap, idx) => (
                        <div key={chap.id} className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-sm active:scale-[0.98] transition-all hover:border-blue-200 group h-full">
                            <span className="inline-block bg-blue-50 text-[#0056d2] text-[10px] font-black px-3 py-1.5 rounded-xl mb-3 border border-blue-100 uppercase tracking-[0.2em] shadow-sm">UNIT - {String(idx+1).padStart(2, '0')}</span>
                            <h3 className="font-black text-gray-800 text-xl mb-2 tracking-tight leading-tight">{chap.title}</h3>
                            <div className="space-y-4 mt-6">
                                {chap.videos.map(video => (
                                    <div key={video.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => navigate(`/watch/${courseId}?video=${video.id}`)}>
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0056d2] shadow-sm"><PlayCircle className="w-6 h-6" /></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-gray-800 line-clamp-1">{video.title}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase">{video.type} • {video.duration}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    </div>
                  )
                ) : (
                  <div className="space-y-6">
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                      {(['All', 'Lectures', 'Notes', 'DPPs'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-6 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all uppercase tracking-widest border-2 ${filter === f ? 'bg-[#333] border-[#333] text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}>{f}</button>
                      ))}
                    </div>
                    <div className="space-y-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {subject.chapters.flatMap(c => c.videos).filter(v => filter === 'All' || (filter === 'Lectures' && v.type === 'lecture') || (filter === 'Notes' && v.type === 'note') || (filter === 'DPPs' && v.type === 'dpp')).map(v => (
                      <div key={v.id} className="bg-white border border-gray-100 rounded-[35px] p-5 shadow-sm flex gap-5 animate-slide-up group">
                        <div className="w-28 aspect-video bg-gray-50 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center border border-gray-100 shadow-inner group-hover:border-brand/30 transition-colors">
                          <PlayCircle className="w-8 h-8 text-brand/20 group-hover:text-brand transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1.5">{v.type?.toUpperCase()} • {v.date}</p>
                          <h4 className="text-sm font-black text-gray-800 line-clamp-2 leading-tight tracking-tight mb-3 group-hover:text-brand transition-colors">{v.title}</h4>
                          <button onClick={() => navigate(`/watch/${courseId}?video=${v.id}`)} className="flex items-center gap-2 px-4 py-2 bg-brand/5 text-brand rounded-xl text-[10px] font-black hover:bg-brand hover:text-white transition-all shadow-sm active:scale-95 uppercase tracking-widest border border-brand/5">
                            <PlayCircle className="w-4 h-4" /> Initialize
                          </button>
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                )}
            </div>
        </div>
    );
};

const WatchPage = () => {
    // ... (No changes)
    const { id } = useParams<{id: string}>(); // courseId
    const location = useLocation();
    const videoId = new URLSearchParams(location.search).get('video');
    const { courses } = useStore();
    const navigate = useNavigate();
    
    const course = courses.find(c => c.id === id);
    const allVideos = course?.subjects.flatMap(s => s.chapters.flatMap(c => c.videos)) || [];
    const video = allVideos.find(v => v.id === videoId);

    if (!course || !video) return <Navigate to={`/course/${id}`} />;

    return (
        <div className="bg-black min-h-screen w-full flex flex-col items-center justify-center fixed inset-0 z-[100]">
             <VideoPlayer 
                src={video.filename} 
                onBack={() => navigate(-1)} 
                className="w-full h-full object-contain"
            />
        </div>
    );
};

// ... Profile, Login, MainContent, App ...

const Profile = () => {
    // ... (No changes to Profile logic, just className adjustment for width)
    const { currentUser, logout, deleteGeneratedNote, manageUserRole, updateUser } = useStore();
    const [viewNote, setViewNote] = useState<GeneratedNote | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', password: '' });

    useEffect(() => {
        if (currentUser) {
            setEditForm({
                name: currentUser.name || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                password: currentUser.password || ''
            });
        }
    }, [currentUser]);

    if (!currentUser) return <Navigate to="/login" />;

    const downloadNote = (note: GeneratedNote) => {
        const formattedContent = note.content
            .replace(/\n/g, '<br/>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/> \*\*\[DIAGRAM: (.*?)\]\*\*/g, '<div style="border:2px dashed #0056d2; background:#f0f7ff; padding:20px; margin:20px 0; border-radius:12px; text-align:center; color:#0056d2; font-weight:bold;">🖼️ DIAGRAM: $1</div>')
            .replace(/### (.*?)(<br\/>|$)/g, '<h3 style="color:#444; font-size:18px; margin-top:15px; font-weight:bold;">$1</h3>')
            .replace(/## (.*?)(<br\/>|$)/g, '<h2 style="color:#0056d2; font-size:22px; margin-top:25px; border-bottom:2px solid #eee; padding-bottom:8px;">$1</h2>')
            .replace(/# (.*?)(<br\/>|$)/g, '<h1 style="color:#0056d2; font-size:28px; margin-top:20px; text-align:center;">$1</h1>');

        const html = `
            <html>
            <head>
                <title>${note.videoTitle}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 50px; max-width: 900px; margin: 0 auto; line-height: 1.7; color: #333; background-color: #fff; }
                    h1, h2, h3 { color: #0056d2; }
                    strong { color: #222; }
                    .header { text-align: center; margin-bottom: 50px; border-bottom: 3px solid #0056d2; padding-bottom: 30px; background-color: #f8fafc; padding: 30px; border-radius: 12px; }
                    .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${note.videoTitle}</h1>
                    <p style="margin:0; font-size:16px; color:#666;">Subject: ${note.subjectName}</p>
                </div>
                ${formattedContent}
                <div class="footer">
                    &copy; Study Portal AI Notes
                </div>
            </body>
            </html>
        `;

        const blob = new Blob([html], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.videoTitle.replace(/[^a-z0-9]/gi, '_')}.html`;
        a.click();
    };

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        updateUser(editForm);
        setIsEditing(false);
        alert("Profile Updated Successfully!");
    };

    return (
        <div className="pb-24 pt-20 px-4 min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center relative overflow-hidden">
                    <div className="w-20 h-20 bg-brand rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                        {currentUser.name.charAt(0)}
                    </div>
                    
                    {isEditing ? (
                        <form onSubmit={handleUpdateProfile} className="space-y-3 text-left">
                            <div><label className="text-xs font-bold text-gray-400">Name</label><input className="w-full p-2 border rounded-lg" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required /></div>
                            <div><label className="text-xs font-bold text-gray-400">Email</label><input className="w-full p-2 border rounded-lg" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required /></div>
                            <div><label className="text-xs font-bold text-gray-400">Phone</label><input className="w-full p-2 border rounded-lg" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="Phone number" /></div>
                            <div><label className="text-xs font-bold text-gray-400">Password</label><input className="w-full p-2 border rounded-lg" type="text" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} placeholder="New Password" /></div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2 bg-gray-100 font-bold rounded-lg text-sm">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-brand text-white font-bold rounded-lg text-sm">Save</button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold text-gray-800">{currentUser.name}</h2>
                            <p className="text-gray-500 text-sm mb-6">{currentUser.email}</p>
                            <div className="inline-block px-4 py-1.5 bg-gray-100 rounded-full text-xs font-bold text-gray-600 uppercase mb-8">{currentUser.role}</div>
                            
                            <button onClick={() => setIsEditing(true)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-brand"><Edit className="w-5 h-5" /></button>

                            <div className="flex gap-3">
                                <button onClick={logout} className="flex-1 py-3 text-red-500 font-bold bg-red-50 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2">
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </button>
                                {currentUser.role !== UserRole.ADMIN && (
                                    <button onClick={() => manageUserRole(currentUser.id, UserRole.ADMIN)} className="flex-1 py-3 text-brand font-bold bg-blue-50 rounded-xl hover:bg-blue-100 flex items-center justify-center gap-2 text-xs">
                                        <Shield className="w-4 h-4" /> Demo: Switch to Admin
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand" /> My AI Notes
                    </div>
                    <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                        {(!currentUser.generatedNotes || currentUser.generatedNotes.length === 0) ? (
                            <div className="p-8 text-center text-gray-400 text-sm">No notes generated yet.</div>
                        ) : (
                            currentUser.generatedNotes.map(note => (
                                <div key={note.id} className="p-4 hover:bg-gray-50 flex items-center justify-between group">
                                    <div className="cursor-pointer flex-1" onClick={() => setViewNote(note)}>
                                        <h4 className="font-bold text-gray-800 text-sm truncate pr-2">{note.videoTitle}</h4>
                                        <p className="text-xs text-gray-500">{note.subjectName} • {new Date(note.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex gap-1">
                                         <button onClick={() => downloadNote(note)} className="p-2 text-gray-400 hover:text-brand" title="Download"><Download className="w-4 h-4" /></button>
                                         <button onClick={() => { if(confirm('Delete note?')) deleteGeneratedNote(note.id); }} className="p-2 text-gray-400 hover:text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {currentUser.role === UserRole.ADMIN && (
                    <Link to="/admin" className="block w-full py-4 bg-gray-800 text-white rounded-xl text-center font-bold shadow-lg hover:bg-black transition-colors">
                        <Shield className="w-4 h-4 inline mr-2" /> Admin Dashboard
                    </Link>
                )}
            </div>

            {viewNote && (
                <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewNote(null)}>
                    <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl flex flex-col shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                             <div>
                                <h2 className="font-bold text-gray-800">{viewNote.videoTitle}</h2>
                                <p className="text-xs text-gray-500">{viewNote.subjectName} • Generated {new Date(viewNote.createdAt).toLocaleDateString()}</p>
                             </div>
                             <button onClick={() => setViewNote(null)} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5 text-gray-600" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap font-medium">{viewNote.content}</div>
                        </div>
                        <div className="p-4 border-t bg-gray-50">
                            <button onClick={() => downloadNote(viewNote)} className="w-full py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-dark flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Download Note</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Login = () => {
    const { login, signup, currentUser, loginAsDemo } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSignup, setIsSignup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', pass: '' });

    // Use location state to redirect back to where user came from, or home
    const from = location.state?.from?.pathname || "/";

    useEffect(() => { 
        if (currentUser) {
            navigate(from, { replace: true });
        }
    }, [currentUser, navigate, from]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate network delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (isSignup) {
            if (!form.name || !form.email || !form.pass) {
                alert("Please fill in all fields.");
                setLoading(false);
                return;
            }
            signup(form.name, form.email, '', form.pass);
        } else {
            if (!login(form.email, form.pass)) {
                alert('Invalid credentials');
            }
        }
        setLoading(false);
    };

    const handleDemoLogin = () => {
        setLoading(true);
        setTimeout(() => {
            loginAsDemo();
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg shadow-blue-200">S</div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-500 text-sm mt-2">Sign in to continue your learning journey.</p>
                </div>
                
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignup && <input className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-brand focus:ring-0 outline-none transition-colors" placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />}
                        <input className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-brand focus:ring-0 outline-none transition-colors" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                        <input className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-brand focus:ring-0 outline-none transition-colors" type="password" placeholder="Password" value={form.pass} onChange={e => setForm({...form, pass: e.target.value})} required />
                        <button type="submit" disabled={loading} className="w-full py-4 bg-brand text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-brand-dark transition-all mt-2 flex items-center justify-center gap-2">
                            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                            {isSignup ? 'Create Account' : 'Sign In'}
                        </button>
                    </form>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <button onClick={handleDemoLogin} type="button" className="w-full py-4 bg-amber-100 text-amber-800 font-bold rounded-xl hover:bg-amber-200 transition-colors flex items-center justify-center gap-2">
                            <Shield className="w-5 h-5" />
                            Login as Demo Admin
                        </button>
                        <p className="text-[10px] text-center text-gray-400 mt-2">Explore features without affecting live data.</p>
                    </div>

                    <div className="mt-6 text-center">
                        <button type="button" onClick={() => setIsSignup(!isSignup)} className="text-sm font-bold text-brand hover:underline">{isSignup ? 'Already have an account? Sign In' : 'Create new account'}</button>
                    </div>
                </div>
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
        <Route path="/my-courses" element={<CourseListing />} />
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
