
import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { 
  Home, BookOpen, User, Search, PlayCircle, Lock, 
  LayoutDashboard, Settings, Plus, Trash2, Edit, X, 
  CheckCircle, ExternalLink, Play, Bot, Brain, Loader2, ArrowLeft, 
  Video as VideoIcon, Sparkles, Send, Smartphone, List, Globe, Bell, 
  ChevronRight, MoreVertical, MessageCircle, FileText, Calendar, MessageSquare, Eye,
  RotateCcw, ImageIcon, Key, Clock, Shield, LogOut, Download, Save, Timer as TimerIcon, AlertCircle, Link as LinkIcon,
  Upload
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
                    {status === 'verifying' ? 'Validating your temporary access token. Please wait.' : status === 'success' ? 'Redirecting you to the batch content.' : `You are about to access "${courseName}" for 24 hours.`}
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
    
    const updateVideoData = () => { 
        if (!editingVideo || !activeSubjectId) return; 
        const { chapId, vid } = editingVideo; 
        setSubjects(subjects.map(s => s.id === activeSubjectId ? { ...s, chapters: s.chapters.map(c => c.id === chapId ? { ...c, videos: c.videos.map(v => v.id === vid.id ? vid : v) } : c) } : s)); 
        setEditingVideo(null); 
    };
    
    const handleNodeThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && editingVideo) {
            const reader = new FileReader();
            reader.onloadend = () => setEditingVideo({ ...editingVideo, vid: { ...editingVideo.vid, thumbnail: reader.result as string } });
            reader.readAsDataURL(file);
        }
    };

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
                            <h3 className="font-bold text-gray-700 border-b pb-2 mb-2">Edit Node Metadata</h3>
                            <div className="flex flex-col gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Specific Node Thumbnail</label>
                                    <div className="relative aspect-video rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center group shadow-sm">
                                        {editingVideo.vid.thumbnail ? (
                                            <>
                                                <img src={editingVideo.vid.thumbnail} className="w-full h-full object-cover" alt="Preview" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button type="button" onClick={() => setEditingVideo({ ...editingVideo, vid: { ...editingVideo.vid, thumbnail: '' } })} className="bg-white text-red-500 p-2 rounded-full shadow-lg hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-1 opacity-50" />
                                                <label className="px-3 py-1.5 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-600 cursor-pointer hover:bg-gray-200 flex items-center gap-1.5">
                                                    <Upload className="w-3 h-3" /> Select Image
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleNodeThumbnailUpload} />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <input value={editingVideo.vid.title} onChange={e => setEditingVideo({...editingVideo, vid: {...editingVideo.vid, title: e.target.value}})} className="w-full p-3 border border-gray-200 rounded-lg text-sm" placeholder="Node Title" />
                                    <input value={editingVideo.vid.filename} onChange={e => setEditingVideo({...editingVideo, vid: {...editingVideo.vid, filename: e.target.value}})} className="w-full p-3 border border-gray-200 rounded-lg text-xs font-mono" placeholder="Stream / Resource Link" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input value={editingVideo.vid.duration} onChange={e => setEditingVideo({...editingVideo, vid: {...editingVideo.vid, duration: e.target.value}})} className="w-full p-3 border border-gray-200 rounded-lg text-sm" placeholder="Duration (e.g. 1:12:00)" />
                                        <select value={editingVideo.vid.type} onChange={e => setEditingVideo({...editingVideo, vid: {...editingVideo.vid, type: e.target.value as any}})} className="p-3 border border-gray-200 rounded-lg text-sm bg-white">
                                            <option value="lecture">Lecture</option>
                                            <option value="note">Notes</option>
                                            <option value="dpp">DPP</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2"><button onClick={() => setEditingVideo(null)} className="flex-1 py-3 text-gray-500 font-bold bg-white border border-gray-200 rounded-lg">Cancel</button><button onClick={updateVideoData} className="flex-1 py-3 bg-[#0056d2] text-white font-bold rounded-lg shadow-md">Commit Node</button></div>
                        </div>
                    ) : activeChapterId && activeSubjectId ? (
                        <div className="space-y-3"><button onClick={() => addVideo(activeSubjectId, activeChapterId)} className="w-full py-4 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 font-bold hover:bg-blue-50 transition-colors">+ Add New Node</button>{activeChapter?.videos.map(vid => (<div key={vid.id} className="p-4 bg-white border border-gray-200 rounded-xl flex justify-between items-center shadow-sm"><div className="truncate pr-4 flex items-center gap-3">{vid.thumbnail ? <img src={vid.thumbnail} className="w-8 h-8 rounded object-cover border" alt="" /> : <VideoIcon className="w-4 h-4 text-gray-400" />}<div><p className="text-sm font-bold text-gray-800 truncate">{vid.title}</p><p className="text-[10px] text-blue-500 font-bold uppercase">{vid.type} • {vid.duration}</p></div></div><div className="flex gap-1"><button onClick={() => setEditingVideo({chapId: activeChapterId, vid})} className="p-2 text-gray-400 hover:text-blue-500 transition-colors"><Edit className="w-4 h-4" /></button><button onClick={() => setSubjects(subjects.map(s => s.id === activeSubjectId ? {...s, chapters: s.chapters.map(c => c.id === activeChapterId ? {...c, videos: c.videos.filter(v => v.id !== vid.id)} : c)} : s))} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></div>))}</div>
                    ) : activeSubjectId ? (
                        <div className="space-y-3"><button onClick={() => addChapter(activeSubjectId)} className="w-full py-4 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 font-bold hover:bg-blue-50 transition-colors">+ Create New Chapter</button>{activeSubject?.chapters.map(chap => (<div key={chap.id} className="p-4 bg-white border border-gray-200 rounded-xl flex justify-between items-center shadow-sm hover:border-blue-100 transition-colors"><button onClick={() => setActiveChapterId(chap.id)} className="flex-1 text-left font-bold text-gray-700">{chap.title}</button><button onClick={() => setSubjects(subjects.map(s => s.id === activeSubjectId ? {...s, chapters: s.chapters.filter(c => c.id !== chap.id)} : s))} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div>))}</div>
                    ) : (
                        <div className="space-y-3"><button onClick={addSubject} className="w-full py-4 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 font-bold hover:bg-blue-50 transition-colors">+ Initialize Subject Node</button>{subjects.map(sub => (<div key={sub.id} className="p-4 bg-white border border-gray-200 rounded-xl flex justify-between items-center shadow-sm group hover:border-blue-100 transition-colors"><button onClick={() => setActiveSubjectId(sub.id)} className="flex items-center gap-4 flex-1 text-left"><div className="w-9 h-9 bg-blue-50 rounded flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-100">{sub.iconText}</div><span className="font-bold text-gray-800">{sub.title}</span></button><button onClick={() => setSubjects(subjects.filter(s => s.id !== sub.id))} className="text-red-500 p-2 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button></div>))}</div>
                    )}
                </div>
                <div className="mt-6 pt-6 border-t flex gap-3"><button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 border border-gray-200 rounded-xl">Close Editor</button><button onClick={handleSave} className="flex-1 py-3 bg-[#0056d2] text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all">Commit Structure</button></div>
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setForm(prev => ({ ...prev, image: reader.result as string }));
            reader.readAsDataURL(file);
        }
    };

    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.EDITOR)) return <Navigate to="/" />;
    
    const handleSaveCourse = (e: React.FormEvent) => { e.preventDefault(); const data: Course = { ...(editing || { id: Date.now().toString(), subjects: [], createdAt: new Date().toISOString() }), ...form }; if (editing) updateCourse(data); else addCourse(data); setShowModal(false); };
    const handleCreateUser = (e: React.FormEvent) => { e.preventDefault(); if (users.some(u => u.email.toLowerCase() === userForm.email.toLowerCase())) { alert("User exists."); return; } createUser({ id: Date.now().toString(), name: userForm.name, email: userForm.email, phone: '', password: userForm.password, role: userForm.role, purchasedCourseIds: [], lastLogin: new Date().toISOString(), tempAccess: {} }); setShowUserModal(false); setUserForm({ name: '', email: '', password: '', role: UserRole.USER }); };
    const handleSaveSettings = (e: React.FormEvent) => { e.preventDefault(); updateSettings(settingsForm); alert("System configurations updated."); };
    
    const generateShortLink = async () => { 
        if(!editing) { alert("Save batch first."); return; } 
        setGeneratingLink(true); 
        const longUrl = `${window.location.origin}/temp-access/${editing.id}`; 
        const apiBase = settings.linkShortenerApiUrl || 'https://vplink.in/api'; 
        const apiKey = settings.linkShortenerApiKey || '320f263d298979dc11826b8e2574610ba0cc5d6b'; 
        const apiUrl = `${apiBase}?api=${apiKey}&url=${encodeURIComponent(longUrl)}`; 
        try { 
            const res = await fetch(apiUrl); 
            const text = await res.text(); 
            let shortUrl = text; 
            try { const json = JSON.parse(text); if(json.shortenedUrl) shortUrl = json.shortenedUrl; else if(json.link) shortUrl = json.link; } catch(e) {} 
            if (shortUrl && shortUrl.startsWith('http')) setForm(prev => ({ ...prev, shortenerLink: shortUrl })); 
            else { setForm(prev => ({ ...prev, shortenerLink: longUrl })); alert("Shortener failed. Using long URL."); } 
        } catch (e) { setForm(prev => ({ ...prev, shortenerLink: longUrl })); alert("Network error."); } finally { setGeneratingLink(false); } 
    };

    const availableTabs = currentUser.role === UserRole.ADMIN ? ['batches', 'users', 'settings'] as const : ['batches'] as const;
    const getUserCourses = (u: any) => courses.filter(c => (u.purchasedCourseIds || []).includes(c.id));
    const handleAddCourseToUser = () => { if(selectedUser && courseToAddId) { adminEnrollUser(selectedUser.id, courseToAddId); setCourseToAddId(''); setSelectedUser({...selectedUser, purchasedCourseIds: [...(selectedUser.purchasedCourseIds || []), courseToAddId]}); } };

    return (
        <div className="pb-24 pt-24 px-4 min-h-screen bg-[#f8fafc]">
             <div className="max-w-6xl mx-auto">
                 {currentUser.isDemo && <div className="bg-amber-100 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 flex items-center gap-3 shadow-sm animate-pulse"><AlertCircle className="w-6 h-6" /><div><p className="font-bold text-sm">Demo Mode Active</p><p className="text-xs opacity-80">You are in inspection mode. Changes will not be saved to server.</p></div></div>}
                 <div className="flex bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden max-w-md">
                    {availableTabs.map(t => (<button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 font-bold capitalize transition-all rounded-lg text-xs ${tab === t ? 'bg-[#0056d2] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>{t}</button>))}
                 </div>

                 {tab === 'batches' && (
                     <div className="space-y-4">
                         <button onClick={() => { setEditing(null); setShowModal(true); }} className="w-full py-10 bg-white border-2 border-dashed border-blue-200 rounded-2xl text-[#0056d2] font-bold flex flex-col items-center justify-center gap-2 hover:bg-blue-50 transition-all"><Plus className="w-8 h-8" /><span>INITIALIZE NEW BATCH Node</span></button>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {courses.map(c => (
                                 <div key={c.id} className="bg-white p-4 rounded-2xl flex flex-col gap-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                     <div className="flex items-center gap-4">
                                         <img src={c.image} className="w-16 h-16 rounded-xl object-cover border border-gray-100" alt="" />
                                         <div className="flex-1 min-w-0"><h3 className="font-bold text-gray-800 text-sm truncate">{c.title}</h3><p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{c.category} • {c.isPaid ? 'Paid' : 'Free'}</p></div>
                                     </div>
                                     <div className="flex gap-2 w-full"><button onClick={() => setContentTarget(c)} className="flex-1 py-2 bg-[#0056d2] text-white rounded-lg font-bold text-[10px] active:scale-95 transition-all">EDIT CONTENT</button><button onClick={() => { setEditing(c); setShowModal(true); }} className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>{currentUser.role === UserRole.ADMIN && <button onClick={() => { if(confirm('Erase batch data?')) deleteCourse(c.id); }} className="p-2 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>}</div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                 {tab === 'users' && currentUser.role === UserRole.ADMIN && (
                    <div className="space-y-4"><button onClick={() => setShowUserModal(true)} className="w-full py-4 bg-white border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-blue-500 hover:text-blue-500 flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Create New User</button><div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-50">{users.map(u => (<div key={u.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"><div className="flex-1 min-w-0 pr-4"><div className="flex items-center gap-2"><p className="font-bold text-gray-800 truncate">{u.name}</p>{u.role === UserRole.ADMIN && <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded">ADMIN</span>}</div><p className="text-xs text-gray-500 truncate">{u.email}</p></div><div className="flex items-center gap-2"><button onClick={() => setSelectedUser(u)} className="p-2 bg-blue-50 text-blue-600 rounded-lg" title="View Progress"><Eye className="w-4 h-4" /></button><select value={u.role} onChange={(e) => manageUserRole(u.id, e.target.value as UserRole)} disabled={u.id === currentUser.id} className="text-xs font-bold px-3 py-2 bg-gray-100 rounded-lg border-none outline-none cursor-pointer hover:bg-gray-200"><option value={UserRole.USER}>User</option><option value={UserRole.EDITOR}>Manager</option><option value={UserRole.ADMIN}>Admin</option></select></div></div>))}</div></div>
                 )}

                 {tab === 'settings' && currentUser.role === UserRole.ADMIN && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-fade-in"><div className="flex items-center gap-3 mb-8"><div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#0056d2]"><Settings className="w-6 h-6" /></div><div><h2 className="text-xl font-bold text-gray-800">Global Portal Configuration</h2><p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Core Settings & API Handlers</p></div></div><form onSubmit={handleSaveSettings} className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Application Name</label><input value={settingsForm.appName} onChange={e => setSettingsForm({...settingsForm, appName: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" /></div><div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Admin Contact</label><input value={settingsForm.adminEmail} onChange={e => setSettingsForm({...settingsForm, adminEmail: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" /></div></div><button type="submit" className="w-full py-4 bg-[#0056d2] text-white font-black rounded-xl shadow-lg active:scale-95 transition-all text-sm tracking-widest uppercase">Commit System Changes</button></form></div>
                 )}
             </div>

             {/* Batch Edit Modal - Restored Classic UI with Upload */}
             {showModal && (
                 <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar border border-gray-100 animate-slide-up">
                        <div className="flex justify-between items-center mb-8 border-b pb-4">
                            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{editing ? 'Configure Batch' : 'Initialize New Batch'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X /></button>
                        </div>
                        <form onSubmit={handleSaveCourse} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Batch Thumbnail (Device Upload Supported)</label>
                                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center group shadow-inner">
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
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inject Thumbnail</p>
                                            <label className="mt-3 px-4 py-2 bg-gray-100 rounded-lg text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-200 inline-flex items-center gap-2 border border-gray-200">
                                                <Upload className="w-4 h-4" /> Upload Device
                                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                            </label>
                                        </div>
                                    )}
                                </div>
                                <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl font-mono text-[10px] shadow-sm" placeholder="Or Paste URL: https://domain.com/image.jpg" />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold shadow-sm" placeholder="Course / Batch Title" required />
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-500 font-medium text-xs shadow-sm min-h-[80px]" placeholder="Brief Content Description..." required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs uppercase font-bold shadow-sm" placeholder="Category Name" required />
                                <div className="flex items-center justify-between px-4 py-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm cursor-pointer" onClick={() => setForm({...form, isPaid: !form.isPaid})}>
                                    <span className="text-xs font-bold text-gray-500 uppercase">Paid Batch</span>
                                    <div className={`w-10 h-5 rounded-full relative transition-all ${form.isPaid ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.isPaid ? 'left-5.5' : 'left-0.5'}`} />
                                    </div>
                                </div>
                            </div>

                            {form.isPaid && (
                                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Selling Price</label>
                                        <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Striked MRP</label>
                                        <input type="number" value={form.mrp} onChange={e => setForm({ ...form, mrp: Number(e.target.value) })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold" />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Start Date</label>
                                    <input value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs" placeholder="e.g. 01 Apr 2025" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Expiry Date</label>
                                    <input value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs" placeholder="e.g. 31 Mar 2026" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Verification Shortlink (24h Access)</label>
                                <div className="flex gap-2">
                                    <input value={form.shortenerLink} onChange={e => setForm({...form, shortenerLink: e.target.value})} className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-mono" placeholder="Internal Redirect URL..." />
                                    <button type="button" onClick={generateShortLink} disabled={generatingLink} className="px-4 bg-blue-100 text-blue-700 font-bold rounded-xl text-[10px] hover:bg-blue-200 transition-colors">{generatingLink ? '...' : 'Generate'}</button>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="w-full py-5 bg-[#0056d2] text-white font-black rounded-xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm">Save Batch Node</button>
                            </div>
                        </form>
                    </div>
                 </div>
             )}

             {selectedUser && (
                <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white w-full max-w-2xl rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar animate-slide-up"><div className="flex justify-between items-start mb-8"><div className="flex items-center gap-4"><div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-200">{selectedUser.name.charAt(0)}</div><div><h2 className="text-2xl font-bold text-gray-800">{selectedUser.name}</h2><p className="text-gray-500 text-sm font-medium">{selectedUser.email}</p></div></div><button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400" /></button></div><div className="space-y-6"><div><div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-500" /> Active Access Nodes</h3><div className="flex gap-2"><select value={courseToAddId} onChange={(e) => setCourseToAddId(e.target.value)} className="text-xs p-2 border rounded-lg bg-gray-50 outline-none max-w-[150px]"><option value="">Add Batch...</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select><button onClick={handleAddCourseToUser} disabled={!courseToAddId} className="px-3 py-2 bg-[#0056d2] text-white rounded-lg text-xs font-bold disabled:opacity-50">Grant</button></div></div><div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">{getUserCourses(selectedUser).length > 0 ? (getUserCourses(selectedUser).map(c => (<div key={c.id} className="p-4 border-b last:border-0 border-gray-100 flex items-center justify-between"><span className="text-sm font-bold text-gray-700">{c.title}</span><button onClick={() => { adminRevokeUser(selectedUser.id, c.id); setSelectedUser({...selectedUser, purchasedCourseIds: (selectedUser.purchasedCourseIds || []).filter((id: string) => id !== c.id)}); }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></div>))) : (<div className="p-6 text-center text-xs font-bold text-gray-400 uppercase tracking-widest italic">No Nodes Granted</div>)}</div></div></div></div></div>
             )}

             {contentTarget && <ContentManager course={contentTarget} onClose={() => setContentTarget(null)} />}
        </div>
    );
};

// ... Remaining CourseListing, CourseDetail, SubjectDetail, etc. from provided context ...

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
    const isOwner = currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.EDITOR || (currentUser.purchasedCourseIds || []).includes(course.id));
    let hasTempAccess = false;
    let tempExpiry = null;
    if (currentUser?.tempAccess?.[course.id]) {
        const expiryDate = new Date(currentUser.tempAccess[course.id]);
        if (expiryDate > new Date()) { hasTempAccess = true; tempExpiry = expiryDate; }
    }
    const hasAccess = !course.isPaid || isOwner || hasTempAccess;
    useEffect(() => {
        if (!hasTempAccess || !tempExpiry) return;
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = tempExpiry.getTime() - now;
            if (distance < 0) { clearInterval(interval); setTimeLeft('EXPIRED'); navigate(0); } else {
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [hasTempAccess, tempExpiry, navigate]);
    const handleKeySubmit = () => { if(course.accessKey && accessKeyInput === course.accessKey) { enrollCourse(course.id); alert("✅ Access Granted Successfully!"); } else alert("❌ Invalid Access Key"); };
    const handleExternalLink = () => { if (course.shortenerLink) window.location.href = course.shortenerLink; else alert("Verification link not generated."); };

    return (
        <div className="pb-24 pt-0 min-h-screen bg-white">
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex items-center justify-between p-4 px-6 max-w-7xl mx-auto">
                    <div className="flex items-center gap-5">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-gray-800" /></button>
                        <h1 className="text-xl font-black text-gray-800 truncate max-w-[180px] md:max-w-lg tracking-tight">{course.title}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {hasTempAccess && timeLeft && (<div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg animate-pulse"><TimerIcon className="w-4 h-4 text-red-500" /><span className="text-xs font-bold text-red-600 font-mono">{timeLeft}</span></div>)}
                        <XPBadge /><Bell className="w-6 h-6 text-gray-600" /><MoreVertical className="w-6 h-6 text-gray-600" />
                    </div>
                </div>
                <div className="max-w-7xl mx-auto"><div className="flex px-6 gap-8 overflow-x-auto no-scrollbar">{(['Subjects', 'Description'] as const).map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-black whitespace-nowrap transition-all border-b-4 ${activeTab === tab ? 'text-[#0056d2] border-[#0056d2]' : 'text-gray-400 border-transparent'}`}>{tab}</button>))}</div></div>
            </div>
            <Banner />
            <div className="p-6 relative max-w-7xl mx-auto">
                {!hasAccess && activeTab === 'Subjects' && (
                    <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
                        <Lock className="w-16 h-16 text-gray-300 mb-4 animate-bounce" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Node Sequence Locked</h3>
                        <p className="text-gray-500 mb-8 max-w-xs text-sm">Synchronize your identity with this batch using verification protocols.</p>
                        <div className="flex flex-col gap-4 w-full max-w-xs animate-slide-up">
                             <button onClick={handleExternalLink} className="w-full py-4 bg-[#0056d2] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 group hover:bg-[#004bb5]"><Clock className="w-5 h-5 group-hover:animate-pulse" /> Initialize 24h Sync</button>
                             {!showKeyInput ? (<button onClick={() => setShowKeyInput(true)} className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2"><Key className="w-5 h-5 text-gray-400" /> Use Enrollment Key</button>) : (<div className="bg-white p-2 rounded-2xl border-2 border-[#0056d2] shadow-sm animate-fade-in flex flex-col gap-2"><div className="flex gap-2"><input type="text" placeholder="Access Key..." className="flex-1 p-2 text-sm font-bold text-gray-700 outline-none bg-transparent" value={accessKeyInput} onChange={e => setAccessKeyInput(e.target.value)} autoFocus /><button onClick={handleKeySubmit} className="bg-[#0056d2] text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#003ea1] shadow-md">Unlock</button></div><button onClick={() => setShowKeyInput(false)} className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hover:text-red-500 self-center pb-1">Cancel</button></div>)}
                        </div>
                    </div>
                )}
                {activeTab === 'Subjects' && (
                    <div className={`space-y-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${!hasAccess ? 'blur-md select-none pointer-events-none opacity-50' : ''}`}>
                        {(course.subjects || []).map((sub) => (
                            <div key={sub.id} onClick={() => hasAccess && navigate(`/course/${course.id}/subject/${sub.id}`)} className="bg-white border border-gray-100 rounded-[35px] p-6 flex items-center gap-6 shadow-sm active:scale-[0.98] transition-all hover:border-blue-200 hover:shadow-md cursor-pointer h-full">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0056d2] font-black text-xl border border-blue-100 shadow-inner shrink-0">{sub.iconText}</div>
                                <div className="flex-1 min-w-0"><h3 className="font-black text-gray-800 text-lg leading-tight mb-2 truncate">{sub.title}</h3><div className="flex items-center gap-5 mt-3"><div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-[#0056d2] w-[0%]"></div></div><span className="text-[12px] font-black text-gray-400">0%</span></div></div>
                                {hasAccess ? <ChevronRight className="w-6 h-6 text-gray-300" /> : <Lock className="w-5 h-5 text-gray-400" />}
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'Description' && (
                    <div className="space-y-8 animate-fade-in md:flex md:gap-8 md:space-y-0">
                        <div className="relative group md:w-1/3"><img src={course.image} className="w-full h-56 md:h-80 object-cover rounded-[50px] shadow-2xl" alt="" /><div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-[50px]"></div></div>
                        <div className="md:w-2/3"><h2 className="text-3xl font-black text-gray-800 mb-4 tracking-tight">{course.title}</h2><p className="text-gray-500 text-base leading-relaxed font-medium">{course.description}</p></div>
                    </div>
                )}
            </div>
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex justify-center pb-safe z-40">
                {hasAccess ? (<Link to={`/exam/${course.id}`} className="flex items-center gap-2 px-6 py-3 bg-[#0056d2] text-white font-bold rounded-full shadow-lg hover:bg-[#003ea1] transition-transform active:scale-95"><Bot className="w-5 h-5" /> AI Diagnostic Assessment</Link>) : (<div className="text-xs font-bold text-gray-500 flex items-center gap-2"><Lock className="w-4 h-4" /> Assessment Node Locked</div>)}
            </div>
        </div>
    );
};

const SubjectDetail = () => {
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
    if (currentUser?.tempAccess?.[courseId]) if (new Date(currentUser.tempAccess[courseId]) > new Date()) hasTempAccess = true;
    const hasAccess = !course?.isPaid || (currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.EDITOR || (currentUser.purchasedCourseIds || []).includes(courseId) || hasTempAccess));
    if (!hasAccess) return <Navigate to={`/course/${courseId}`} />;

    return (
        <div className="pb-24 pt-0 min-h-screen bg-white">
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex items-center justify-between p-4 px-6 max-w-7xl mx-auto">
                    <div className="flex items-center gap-5"><button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-gray-800" /></button><h1 className="text-xl font-black text-gray-800 tracking-tight">{subject.title}</h1></div>
                    <div className="flex items-center gap-4"><button className="text-[#0056d2] p-2.5 rounded-2xl hover:bg-blue-50 border border-blue-100 transition-all active:scale-90"><Sparkles className="w-6 h-6" /></button><XPBadge /></div>
                </div>
                <div className="max-w-7xl mx-auto"><div className="flex px-6 gap-10">{(['Chapters', 'Study Material'] as const).map(t => (<button key={t} onClick={() => setTab(t === 'Chapters' ? 'Chapters' : 'Notes')} className={`pb-4 text-sm font-black border-b-4 transition-all ${tab === (t === 'Chapters' ? 'Chapters' : 'Notes') ? 'text-[#0056d2] border-[#0056d2]' : 'text-gray-400 border-transparent'}`}>{t}</button>))}</div></div>
            </div>
            <div className="p-6 space-y-8 pb-32 max-w-7xl mx-auto">
                {tab === 'Chapters' ? (subject.chapters.length === 0 ? (<div className="text-center py-32 opacity-30 italic font-black uppercase text-[10px] tracking-widest">No data sequences discovered</div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">{subject.chapters.map((chap, idx) => (<div key={chap.id} className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-sm active:scale-[0.98] transition-all hover:border-blue-200 group h-full"><span className="inline-block bg-blue-50 text-[#0056d2] text-[10px] font-black px-3 py-1.5 rounded-xl mb-3 border border-blue-100 uppercase tracking-[0.2em] shadow-sm">UNIT - {String(idx+1).padStart(2, '0')}</span><h3 className="font-black text-gray-800 text-xl mb-2 tracking-tight leading-tight">{chap.title}</h3><div className="space-y-4 mt-6">{chap.videos.map(video => (<div key={video.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => navigate(`/watch/${courseId}?video=${video.id}`)}><div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0056d2] shadow-sm"><PlayCircle className="w-6 h-6" /></div><div className="flex-1 min-w-0"><div className="text-xs font-bold text-gray-800 line-clamp-1">{video.title}</div><div className="text-[10px] text-gray-400 font-bold uppercase">{video.type} • {video.duration}</div></div></div>))}</div></div>))}</div>)) : (
                  <div className="space-y-6"><div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">{(['All', 'Lectures', 'Notes', 'DPPs'] as const).map(f => (<button key={f} onClick={() => setFilter(f)} className={`px-6 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all uppercase tracking-widest border-2 ${filter === f ? 'bg-[#333] border-[#333] text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}>{f}</button>))}</div><div className="space-y-4 grid grid-cols-1 lg:grid-cols-2 gap-4">{subject.chapters.flatMap(c => c.videos).filter(v => filter === 'All' || (filter === 'Lectures' && v.type === 'lecture') || (filter === 'Notes' && v.type === 'note') || (filter === 'DPPs' && v.type === 'dpp')).map(v => (<div key={v.id} className="bg-white border border-gray-100 rounded-[35px] p-5 shadow-sm flex gap-5 animate-slide-up group"><div className="w-28 aspect-video bg-gray-50 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center border border-gray-100 shadow-inner group-hover:border-brand/30 transition-colors">{v.thumbnail ? <img src={v.thumbnail} className="w-full h-full object-cover" /> : <PlayCircle className="w-8 h-8 text-brand/20 group-hover:text-brand transition-colors" />}</div><div className="flex-1 min-w-0"><p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1.5">{v.type?.toUpperCase()} • {v.date}</p><h4 className="text-sm font-black text-gray-800 line-clamp-2 leading-tight tracking-tight mb-3 group-hover:text-brand transition-colors">{v.title}</h4><button onClick={() => navigate(`/watch/${courseId}?video=${v.id}`)} className="flex items-center gap-2 px-4 py-2 bg-brand/5 text-brand rounded-xl text-[10px] font-black hover:bg-brand hover:text-white transition-all shadow-sm active:scale-95 uppercase tracking-widest border border-brand/5"><PlayCircle className="w-4 h-4" /> Initialize</button></div></div>))}</div></div>
                )}
            </div>
        </div>
    );
};

const WatchPage = () => {
    const { id } = useParams<{id: string}>();
    const location = useLocation();
    const videoId = new URLSearchParams(location.search).get('video');
    const { courses } = useStore();
    const navigate = useNavigate();
    const course = courses.find(c => c.id === id);
    const allVideos = course?.subjects.flatMap(s => s.chapters.flatMap(c => c.videos)) || [];
    const video = allVideos.find(v => v.id === videoId);
    if (!course || !video) return <Navigate to={`/course/${id}`} />;
    return (<div className="bg-black min-h-screen w-full flex flex-col items-center justify-center fixed inset-0 z-[100]"><VideoPlayer src={video.filename} onBack={() => navigate(-1)} className="w-full h-full object-contain" /></div>);
};

const Profile = () => {
    const { currentUser, logout, deleteGeneratedNote, manageUserRole, updateUser } = useStore();
    const [viewNote, setViewNote] = useState<GeneratedNote | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', password: '' });
    useEffect(() => { if (currentUser) setEditForm({ name: currentUser.name || '', email: currentUser.email || '', phone: currentUser.phone || '', password: currentUser.password || '' }); }, [currentUser]);
    if (!currentUser) return <Navigate to="/login" />;
    
    const handleUpdateProfile = (e: React.FormEvent) => { e.preventDefault(); updateUser(editForm); setIsEditing(false); alert("Neural identity updated."); };

    return (
        <div className="pb-24 pt-20 px-4 min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center relative overflow-hidden"><div className="w-20 h-20 bg-brand rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg shadow-blue-200">{currentUser.name.charAt(0)}</div>{isEditing ? (<form onSubmit={handleUpdateProfile} className="space-y-3 text-left"><div><label className="text-xs font-bold text-gray-400 uppercase">Identity Marker</label><input className="w-full p-3 border rounded-xl bg-gray-50 text-sm" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required /></div><div><label className="text-xs font-bold text-gray-400 uppercase">Comm Channel</label><input className="w-full p-3 border rounded-xl bg-gray-50 text-sm" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required /></div><div className="flex gap-2 pt-2"><button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-xs uppercase tracking-widest">Cancel</button><button type="submit" className="flex-1 py-3 bg-[#0056d2] text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-md">Confirm</button></div></form>) : (<><h2 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-1">{currentUser.name}</h2><p className="text-gray-400 text-xs font-bold mb-6 tracking-widest">{currentUser.email}</p><div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-blue-100">{currentUser.role} SIGNAL</div><button onClick={() => setIsEditing(true)} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-blue-500 transition-colors"><Edit className="w-5 h-5" /></button><div className="flex gap-3"><button onClick={logout} className="flex-1 py-3 text-red-500 font-bold bg-red-50 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"><LogOut className="w-4 h-4" /> Sign Out</button>{currentUser.role === UserRole.ADMIN && (<Link to="/admin" className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-lg"><Shield className="w-4 h-4" /> Admin Grid</Link>)}</div></>)}</div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"><div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-500 uppercase text-[10px] tracking-widest flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /> Stored Progress Sequences</div><div className="p-10 text-center text-xs font-bold text-gray-400 uppercase tracking-widest italic">No sequences active</div></div>
            </div>
        </div>
    );
};

const Login = () => {
    const { login, signup, currentUser } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSignup, setIsSignup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', pass: '' });
    const from = location.state?.from?.pathname || "/";
    useEffect(() => { if (currentUser) navigate(from, { replace: true }); }, [currentUser, navigate, from]);
    const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); await new Promise(resolve => setTimeout(resolve, 800)); if (isSignup) { if (!form.name || !form.email || !form.pass) { alert("Data units missing."); setLoading(false); return; } signup(form.name, form.email, '', form.pass); } else if (!login(form.email, form.pass)) alert('Identity mismatch.'); setLoading(false); };
    return (<div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50"><div className="w-full max-w-sm"><div className="text-center mb-8"><div className="w-16 h-16 bg-[#0056d2] rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-xl shadow-blue-200">S</div><h1 className="text-2xl font-bold text-gray-900 tracking-tight">Access Learning Grid</h1><p className="text-gray-400 text-sm mt-1">Initialize your learning identity</p></div><div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100"><form onSubmit={handleSubmit} className="space-y-4">{isSignup && <input className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition-all font-bold text-sm" placeholder="Identity Marker" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /> }<input className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition-all font-bold text-sm" placeholder="Comm Signal (Email)" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /><input className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition-all font-bold text-sm" type="password" placeholder="Pass-Sequence" value={form.pass} onChange={e => setForm({...form, pass: e.target.value})} required /><button type="submit" disabled={loading} className="w-full py-4 bg-[#0056d2] text-white font-black rounded-xl shadow-lg active:scale-95 transition-all mt-2 flex items-center justify-center gap-2 uppercase tracking-widest text-sm">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignup ? 'Initialize Identity' : 'Establish Link')}</button></form><div className="mt-6 text-center"><button type="button" onClick={() => setIsSignup(!isSignup)} className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-widest">{isSignup ? 'Existing Identity? Establish Link' : 'New User? Construct Identity'}</button></div></div></div></div>);
};

const MainContent = () => {
  const loc = useLocation();
  const isWatch = loc.pathname.startsWith('/watch') || loc.pathname.startsWith('/exam') || loc.pathname === '/login' || loc.pathname.startsWith('/temp-access');
  return (<div className="min-h-screen bg-gray-50">{!isWatch && <STHeader />}<Routes><Route path="/login" element={<Login />} /><Route path="/" element={<CourseListing />} /><Route path="/courses" element={<CourseListing />} /><Route path="/my-courses" element={<CourseListing />} /><Route path="/course/:id" element={<CourseDetail />} /><Route path="/course/:courseId/subject/:subjectId" element={<SubjectDetail />} /><Route path="/watch/:id" element={<WatchPage />} /><Route path="/exam/:id" element={<ExamMode />} /><Route path="/profile" element={<Profile />} /><Route path="/admin" element={<AdminPanel />} /><Route path="/temp-access/:id" element={<TempAccessHandler />} /><Route path="*" element={<Navigate to="/" />} /></Routes>{!isWatch && <STBottomNav />}<ChatBot /></div>);
};

export const App = () => (<Router><StoreProvider><MainContent /></StoreProvider></Router>);
