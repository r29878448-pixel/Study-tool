
import React, { useEffect, useState, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { 
  Home, BookOpen, User, Search, PlayCircle, Lock, 
  LayoutDashboard, Settings, Plus, Trash2, Edit, X, 
  CheckCircle, ExternalLink, Play, Bot, Brain, Loader2, ArrowLeft, 
  Video as VideoIcon, Sparkles, Send, Smartphone, List, Globe, Bell, 
  ChevronRight, MoreVertical, MessageCircle, FileText, Calendar, MessageSquare, Eye,
  RotateCcw, ImageIcon, Copy, Shield, Upload, Link as LinkIcon, Key, Clock, Download, Users, TrendingUp, Wand2
} from './components/Icons';
import VideoPlayer from './components/VideoPlayer';
import ChatBot from './components/ChatBot';
import ExamMode from './components/ExamMode';
import { GoogleGenAI } from "@google/genai";
import { Course, Chapter, Video, UserRole, Subject, AppSettings, User as UserType } from './types';

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
  <div className="bg-blue-50 px-5 py-3 flex items-center justify-between text-[11px] font-bold text-blue-700 border-b border-blue-100">
    <span>Tip: Finish all lectures to get full progress!</span>
    <X className="w-3.5 h-3.5 text-blue-300" />
  </div>
);

const XPBadge = ({ xp = 0 }) => (
  <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
    <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center text-[10px] font-bold text-blue-700">XP</div>
    <span className="text-xs font-bold text-gray-700">{xp}</span>
  </div>
);

const STHeader = () => {
  const { currentUser, settings } = useStore();
  const location = useLocation();
  const isNoNav = ['/login', '/watch', '/exam', '/temp-access'].some(p => location.pathname.includes(p));
  
  if (isNoNav) return null;

  const totalXP = (currentUser?.examResults || []).reduce((acc, curr) => acc + (curr.score * 50), 0);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-5 z-50">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">S</div>
            <span className="font-bold text-gray-900 tracking-tight text-lg">{settings.appName}</span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <XPBadge xp={totalXP} />
        <Link to="/profile" className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
            {currentUser ? <span className="font-bold text-blue-600">{currentUser.name.charAt(0)}</span> : <User className="w-5 h-5 text-gray-400" />}
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
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center justify-around z-50 pb-safe">
      {tabs.map(tab => {
        const isActive = location.pathname === tab.path;
        return (
          <Link key={tab.path} to={tab.path} className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
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
            <div className="bg-white p-10 rounded-3xl shadow-lg border border-gray-100 max-w-sm w-full text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    {status === 'verifying' ? <Loader2 className="w-8 h-8 text-blue-600 animate-spin" /> : status === 'success' ? <CheckCircle className="w-8 h-8 text-green-500" /> : <Shield className="w-8 h-8 text-blue-600" />}
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">{status === 'verifying' ? 'Verifying Link...' : status === 'success' ? 'Access Granted!' : 'Temporary Access'}</h2>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed">{status === 'verifying' ? 'Checking security token...' : status === 'success' ? 'Redirecting to your course.' : `Claim 24h free access to ${course?.title || 'this batch'}.`}</p>
                {status === 'idle' && <button onClick={handleVerify} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow active:scale-95 transition-all">Confirm Access</button>}
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
        const title = prompt('Subject Title:');
        const iconText = prompt('Icon (2-3 chars):') || 'S';
        if (title) setSubjects([...subjects, { id: Date.now().toString(), title, iconText, chapters: [] }]);
    };

    const addChapter = (sId: string) => {
        const title = prompt('Chapter Title:');
        if (title) setSubjects(subjects.map(s => s.id === sId ? { ...s, chapters: [...s.chapters, { id: Date.now().toString(), title, videos: [] }] } : s));
    };

    const addVideo = (sId: string, cId: string) => {
        const title = prompt('Content Name:');
        const url = prompt('Video URL:');
        const dur = prompt('Duration (e.g. 1h 20m):') || '10:00';
        const typeInput = prompt('Type (lecture/note/dpp):') || 'lecture';
        const type = (['lecture', 'note', 'dpp'].includes(typeInput) ? typeInput : 'lecture') as 'lecture' | 'note' | 'dpp';
        if (title && url) {
            setSubjects(subjects.map(s => s.id === sId ? { ...s, chapters: s.chapters.map(c => c.id === cId ? { ...c, videos: [...c.videos, { id: Date.now().toString(), title, filename: url, duration: dur, type, date: new Date().toLocaleDateString() }] } : c) } : s));
        }
    };

    const activeSubject = subjects.find(s => s.id === activeSubjectId);
    const activeChapter = activeSubject?.chapters.find(c => c.id === activeChapterId);

    return (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xl rounded-2xl p-6 max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-800">
                      {activeChapter ? activeChapter.title : activeSubject ? activeSubject.title : 'Manage Content'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
                </div>
                
                <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-gray-400 overflow-x-auto">
                    <button onClick={() => { setActiveSubjectId(null); setActiveChapterId(null); }} className={!activeSubjectId ? 'text-blue-600' : ''}>ROOT</button>
                    {activeSubject && (
                      <>
                        <ChevronRight className="w-3 h-3" />
                        <button onClick={() => setActiveChapterId(null)} className={activeSubjectId && !activeChapterId ? 'text-blue-600' : ''}>{activeSubject.title}</button>
                      </>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                    {activeChapterId && activeSubjectId ? (
                        <div className="space-y-3">
                            <button onClick={() => addVideo(activeSubjectId, activeChapterId)} className="w-full py-4 border-2 border-dashed border-gray-100 rounded-xl text-blue-600 font-bold hover:bg-blue-50">+ Add Item</button>
                            {activeChapter?.videos.map(vid => (
                                <div key={vid.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-center">
                                    <div className="truncate pr-4">
                                        <p className="text-sm font-bold text-gray-800 truncate">{vid.title}</p>
                                        <p className="text-[10px] text-blue-500 font-bold uppercase">{vid.type} • {vid.duration}</p>
                                    </div>
                                    <button onClick={() => setSubjects(subjects.map(s => s.id === activeSubjectId ? {...s, chapters: s.chapters.map(c => c.id === activeChapterId ? {...c, videos: c.videos.filter(v => v.id !== vid.id)} : c)} : s))} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    ) : activeSubjectId ? (
                        <div className="space-y-3">
                            <button onClick={() => addChapter(activeSubjectId)} className="w-full py-4 border-2 border-dashed border-gray-100 rounded-xl text-blue-600 font-bold hover:bg-blue-50">+ Add Chapter</button>
                            {activeSubject?.chapters.map(chap => (
                                <div key={chap.id} className="p-4 bg-white border border-gray-100 rounded-xl flex justify-between items-center shadow-sm">
                                    <button onClick={() => setActiveChapterId(chap.id)} className="flex-1 text-left font-bold text-gray-700">{chap.title}</button>
                                    <button onClick={() => setSubjects(subjects.map(s => s.id === activeSubjectId ? {...s, chapters: s.chapters.filter(c => c.id !== chap.id)} : s))} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <button onClick={addSubject} className="w-full py-4 border-2 border-dashed border-gray-100 rounded-xl text-blue-600 font-bold hover:bg-blue-50">+ Add Subject</button>
                            {subjects.map(sub => (
                                <div key={sub.id} className="p-4 bg-white border border-gray-100 rounded-xl flex justify-between items-center shadow-sm">
                                    <button onClick={() => setActiveSubjectId(sub.id)} className="flex items-center gap-4 flex-1 text-left">
                                        <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center text-blue-600 font-bold text-xs">{sub.iconText}</div>
                                        <span className="font-bold text-gray-800">{sub.title}</span>
                                    </button>
                                    <button onClick={() => setSubjects(subjects.filter(s => s.id !== sub.id))} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="mt-6 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow active:scale-95 transition-all">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

// --- ADMIN CONTROL PANEL ---

const AdminPanel = () => {
    const { currentUser, courses, settings, addCourse, updateCourse, deleteCourse, updateSettings, clearAllData, users, manageUserRole } = useStore();
    const [tab, setTab] = useState<'batches' | 'users' | 'settings'>('batches');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Course | null>(null);
    const [contentTarget, setContentTarget] = useState<Course | null>(null);
    const [settingsForm, setSettingsForm] = useState<AppSettings>(settings);
    const [form, setForm] = useState({ title: '', description: '', image: '', category: '', price: 0, mrp: 0, isPaid: false, startDate: '', endDate: '', telegramLink: '', shortenerLink: '' });
    const [searchUser, setSearchUser] = useState('');

    useEffect(() => { setSettingsForm(settings); }, [settings]);
    useEffect(() => { 
        if (editing) setForm({ title: editing.title, description: editing.description, image: editing.image, category: editing.category, price: editing.price, mrp: editing.mrp, isPaid: !!editing.isPaid, startDate: editing.startDate || '', endDate: editing.endDate || '', telegramLink: editing.telegramLink || '', shortenerLink: editing.shortenerLink || '' }); 
        else setForm({ title: '', description: '', image: '', category: '', price: 0, mrp: 0, isPaid: false, startDate: '', endDate: '', telegramLink: '', shortenerLink: '' }); 
    }, [editing, showModal]);

    const isAllowed = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.EDITOR;
    if (!currentUser || !isAllowed) return <Navigate to="/" />;
    
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
        alert("24h Access Link Copied!");
    };

    const autoGenerateSlug = () => {
        const slug = form.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        setForm({...form, shortenerLink: slug});
    };

    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchUser.toLowerCase()) || u.email.toLowerCase().includes(searchUser.toLowerCase()));

    return (
        <div className="pb-24 pt-20 px-4 min-h-screen bg-gray-50">
             <div className="max-w-4xl mx-auto">
                 <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 mb-8 max-w-md mx-auto">
                    {(['batches', 'users', 'settings'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 font-bold capitalize transition-all rounded-xl text-xs ${tab === t ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:bg-gray-50'}`}>
                            {t}
                        </button>
                    ))}
                 </div>

                 {tab === 'batches' && (
                     <div className="space-y-4">
                         <button onClick={() => { setEditing(null); setShowModal(true); }} className="w-full py-10 bg-white border-2 border-dashed border-blue-200 rounded-3xl text-blue-600 font-bold flex flex-col items-center justify-center gap-2 hover:bg-blue-50">
                            <Plus className="w-8 h-8" />
                            <span>Create New Batch</span>
                         </button>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {courses.map(c => (
                                 <div key={c.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                                     <div className="flex items-center gap-4">
                                         <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden border shrink-0">
                                            <img src={c.image || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                                         </div>
                                         <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-800 truncate text-sm">{c.title}</h3>
                                            <p className="text-[10px] text-blue-600 font-bold uppercase">{c.category}</p>
                                         </div>
                                     </div>
                                     <div className="flex gap-2 w-full">
                                        <button onClick={() => setContentTarget(c)} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase shadow active:scale-95 transition-all">Content</button>
                                        <button onClick={() => copyTempLink(c.id)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all" title="Temp Access"><LinkIcon className="w-4 h-4" /></button>
                                        <button onClick={() => { setEditing(c); setShowModal(true); }} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => { if(confirm('Delete Batch?')) deleteCourse(c.id); }} className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                 {tab === 'users' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                            <Search className="w-4 h-4 text-gray-400 mx-3" />
                            <input value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="Search students..." className="w-full bg-transparent text-sm font-bold outline-none" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredUsers.map(u => {
                                const totalXP = (u.examResults || []).reduce((acc, curr) => acc + (curr.score * 50), 0);
                                return (
                                    <div key={u.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold">{u.name.charAt(0)}</div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-gray-800 text-sm truncate">{u.name}</h3>
                                                    <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                                                </div>
                                            </div>
                                            <select 
                                                value={u.role} 
                                                onChange={(e) => manageUserRole(u.id, e.target.value as UserRole)}
                                                className="text-[10px] font-bold bg-gray-50 px-2 py-1 rounded-lg border outline-none text-blue-600"
                                            >
                                                <option value={UserRole.USER}>Student</option>
                                                <option value={UserRole.EDITOR}>Manager</option>
                                                <option value={UserRole.ADMIN}>Admin</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 bg-gray-50 p-2 rounded-lg">
                                            <span>Progress: {totalXP} XP</span>
                                            <span>Rank: {Math.floor(totalXP/200)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                 )}

                 {tab === 'settings' && currentUser.role === UserRole.ADMIN && (
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Portal Config</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">App Name</label>
                                <input value={settingsForm.appName} onChange={e => setSettingsForm({...settingsForm, appName: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl font-bold" />
                            </div>
                            <button onClick={() => { updateSettings(settingsForm); alert("Updated!"); }} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow active:scale-95 transition-all">Save Portal Settings</button>
                            <button onClick={clearAllData} className="w-full py-4 bg-red-50 text-red-500 font-bold border border-red-100 rounded-xl hover:bg-red-500 hover:text-white transition-all">Clear All App Data</button>
                        </div>
                    </div>
                 )}
             </div>

             {showModal && (
                 <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar border border-gray-100 animate-slide-up">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold text-gray-800">{editing ? 'Edit Batch' : 'Add New Batch'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
                        </div>
                        <form onSubmit={handleSaveCourse} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Thumbnail</label>
                                <div className="relative aspect-video rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                                    {form.image ? <img src={form.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-gray-300" />}
                                    <input type="file" accept="image/*" onChange={onFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>
                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl font-bold" placeholder="Batch Title" required />
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm min-h-[80px]" placeholder="Description" required />
                            <div className="grid grid-cols-2 gap-4">
                                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold" placeholder="Grade / Category" required />
                                <div className="flex items-center justify-between px-4 py-4 bg-gray-50 rounded-xl border border-gray-100" onClick={() => setForm({...form, isPaid: !form.isPaid})}>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Paid?</span>
                                    <div className={`w-8 h-4 rounded-full relative ${form.isPaid ? 'bg-blue-600' : 'bg-gray-300'}`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${form.isPaid ? 'left-4.5' : 'left-0.5'}`} /></div>
                                </div>
                            </div>
                            <div className="space-y-2 border-t pt-4">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Marketing Links</label>
                                <input value={form.telegramLink} onChange={e => setForm({ ...form, telegramLink: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold" placeholder="Telegram Group Link" />
                                <div className="flex gap-2">
                                    <input value={form.shortenerLink} onChange={e => setForm({ ...form, shortenerLink: e.target.value })} className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold" placeholder="Short Path / Slug" />
                                    <button type="button" onClick={autoGenerateSlug} className="px-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 transition-colors" title="Auto-Gen Slug"><Wand2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-5 bg-blue-600 text-white font-bold rounded-2xl shadow active:scale-95 transition-all uppercase text-xs tracking-widest">Commit Changes</button>
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
        <div className="pb-24 pt-20 px-5 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-40 opacity-30">
                        <BookOpen className="w-12 h-12 mb-4" />
                        <p className="font-bold text-xs uppercase tracking-widest">No active batches</p>
                    </div>
                ) : courses.map(c => (
                    <div key={c.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all animate-slide-up">
                        <div className="aspect-video bg-gray-50 border-b overflow-hidden">
                            <img src={c.image || 'https://via.placeholder.com/600x400'} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-gray-900 text-lg leading-tight">{c.title}</h3>
                                <span className="text-[9px] bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold uppercase">{c.category}</span>
                            </div>
                            <p className="text-gray-500 text-sm line-clamp-2 mb-6 leading-relaxed">{c.description}</p>
                            <Link to={`/course/${c.id}`} className="block w-full py-4 bg-blue-600 text-white text-center text-xs font-bold rounded-2xl shadow active:scale-95 transition-all uppercase tracking-widest">Enroll Now</Link>
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
    const [activeTab, setActiveTab] = useState<'Content' | 'Info'>('Content');

    const course = courses.find(c => c.id === id);
    if (!course) return <Navigate to="/" />;

    return (
        <div className="pb-24 pt-0 min-h-screen bg-white">
            <div className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
                <div className="flex items-center gap-4 p-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-6 h-6 text-gray-800" /></button>
                    <h1 className="text-lg font-bold text-gray-800 truncate">{course.title}</h1>
                </div>
                <div className="flex px-4 gap-6">
                    {(['Content', 'Info'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === tab ? 'text-blue-600 border-blue-600' : 'text-gray-300 border-transparent'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
            
            <Banner />

            <div className="p-6">
                {activeTab === 'Content' && (
                    <div className="space-y-4">
                        {(course.subjects || []).map((sub) => (
                            <div key={sub.id} onClick={() => navigate(`/course/${course.id}/subject/${sub.id}`)} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-6 shadow-sm hover:border-blue-500 cursor-pointer transition-colors group">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold text-xl">{sub.iconText}</div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 text-base">{sub.title}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{sub.chapters.length} Chapters Found</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'Info' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="aspect-video rounded-3xl overflow-hidden shadow-lg border border-gray-100">
                             <img src={course.image || 'https://via.placeholder.com/600x400'} className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-800">{course.title}</h2>
                            <p className="text-gray-500 leading-relaxed text-sm">{course.description}</p>
                            <div className="flex flex-wrap gap-2 pt-4">
                                {course.telegramLink && <a href={course.telegramLink} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold uppercase"><Send className="w-4 h-4" /> Join Telegram</a>}
                                <span className="px-4 py-2 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-bold uppercase">{course.category} Level</span>
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
        <div className="pb-24 pt-0 min-h-screen bg-white">
            <div className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
                <div className="flex items-center gap-4 p-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-6 h-6 text-gray-800" /></button>
                    <h1 className="text-lg font-bold text-gray-800 truncate">{subject.title}</h1>
                </div>
            </div>
            <div className="p-6 space-y-6">
                {subject.chapters.length === 0 ? (
                    <div className="text-center py-40 opacity-30 font-bold uppercase text-[10px]">Empty Section</div>
                ) : subject.chapters.map((chap, idx) => (
                    <div key={chap.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-blue-600 text-[10px] font-bold uppercase mb-1 block">Chapter {idx + 1}</span>
                                <h3 className="font-bold text-gray-800 text-lg leading-tight">{chap.title}</h3>
                            </div>
                        </div>
                        <div className="grid gap-3">
                            {chap.videos.map(v => (
                                <button key={v.id} onClick={() => navigate(`/watch/${courseId}`)} className="w-full p-4 bg-gray-50 rounded-xl flex items-center gap-4 hover:bg-blue-600 hover:text-white transition-all text-left group">
                                    <div className="w-10 h-10 bg-white rounded flex items-center justify-center text-blue-600 group-hover:scale-95 transition-transform"><Play className="w-5 h-5" /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate uppercase">{v.title}</p>
                                        <p className="text-[10px] font-bold opacity-50 group-hover:opacity-100">{v.duration} • {v.type}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 opacity-20 group-hover:opacity-100" />
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
            <div className="p-4 flex items-center gap-4 bg-gray-900 border-b border-white/10">
                <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
                <h1 className="text-base font-bold truncate">{activeVideo?.title || "Loading..."}</h1>
            </div>
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                <div className="flex-1 bg-black flex items-center justify-center p-2">
                    {activeVideo ? <VideoPlayer src={activeVideo.filename} title={activeVideo.title} onBack={() => navigate(-1)} className="w-full max-w-5xl" /> : <div className="text-gray-500 font-bold">LOADING...</div>}
                </div>
                <div className="w-full lg:w-[350px] bg-gray-900 overflow-y-auto border-l border-white/10 p-6 no-scrollbar">
                    <h3 className="font-bold mb-6 text-gray-500 uppercase text-xs">Playlist</h3>
                    <div className="space-y-6">
                        {course.subjects.map(sub => (
                            <div key={sub.id} className="space-y-3">
                                <p className="text-[10px] font-bold text-blue-500 uppercase">{sub.title}</p>
                                {sub.chapters.flatMap(c => c.videos).map(v => (
                                    <button key={v.id} onClick={() => setActiveVideo(v)} className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all text-left ${activeVideo?.id === v.id ? 'bg-blue-600/20 border border-blue-500/50' : 'hover:bg-white/5 border border-transparent'}`}>
                                        <div className={`w-8 h-8 rounded flex items-center justify-center ${activeVideo?.id === v.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-600'}`}>
                                          <PlayCircle className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-bold truncate ${activeVideo?.id === v.id ? 'text-white' : 'text-gray-400'}`}>{v.title}</p>
                                            <p className="text-[9px] text-gray-600 font-bold mt-1 uppercase">{v.duration}</p>
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
        <div className="pb-24 pt-20 px-6 min-h-screen bg-gray-50">
            <div className="max-w-md mx-auto space-y-6">
                <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 text-center">
                    <div className="w-24 h-24 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6">
                        {currentUser.name.charAt(0)}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentUser.name}</h2>
                    <p className="text-blue-600 font-bold text-[10px] uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-full inline-block mb-10">{currentUser.role} Account</p>
                    <button onClick={logout} className="w-full py-4 text-red-500 font-bold bg-red-50 rounded-xl transition-all uppercase text-xs tracking-widest">Logout</button>
                </div>
                {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.EDITOR) && <Link to="/admin" className="block w-full py-6 bg-blue-600 text-white rounded-3xl text-center font-bold shadow active:scale-95 transition-all uppercase text-sm tracking-widest">Master Panel</Link>}
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
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-blue-600">
            <div className="bg-white p-10 rounded-3xl w-full max-w-md shadow-xl">
                <div className="text-center mb-10">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-3xl font-bold shadow-lg">S</div>
                    <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
                </div>
                <form onSubmit={e => { e.preventDefault(); if(isS) signup(f.name, f.email, '', f.pass); else if (!login(f.email, f.pass)) alert('Login Failed.'); }} className="space-y-4">
                    {isS && <input className="w-full p-4 bg-gray-50 rounded-xl outline-none font-bold border border-transparent focus:border-blue-500 transition-all" placeholder="Full Name" value={f.name} onChange={e => setF({...f, name: e.target.value})} required />}
                    <input className="w-full p-4 bg-gray-50 rounded-xl outline-none font-bold border border-transparent focus:border-blue-500 transition-all" placeholder="Email" value={f.email} onChange={e => setF({...f, email: e.target.value})} required />
                    <input className="w-full p-4 bg-gray-50 rounded-xl outline-none font-bold border border-transparent focus:border-blue-500 transition-all" type="password" placeholder="Password" value={f.pass} onChange={e => setF({...f, pass: e.target.value})} required />
                    <button className="w-full py-5 bg-blue-600 text-white font-bold rounded-xl shadow active:scale-95 transition-all mt-4">Continue</button>
                </form>
                <button onClick={() => setIsS(!isS)} className="w-full mt-10 text-[10px] text-blue-600 font-bold uppercase text-center tracking-widest">{isS ? '< Back to Login' : 'Create Account >'}</button>
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
      <div className={!isWatch ? "pt-16 pb-20" : ""}>
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
      </div>
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
