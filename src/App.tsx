
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
  <div className="bg-blue-50 px-4 py-2 flex items-center justify-between text-[11px] font-bold text-blue-700 border-b border-blue-100">
    <span>Tip: Complete all items to reach 100% progress!</span>
    <X className="w-3 h-3 text-blue-300 cursor-pointer" />
  </div>
);

const XPBadge = ({ xp = 0 }) => (
  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
    <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center text-[9px] font-bold text-blue-600">XP</div>
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
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-50">
      <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-base">S</div>
          <span className="font-bold text-gray-900 tracking-tight text-base">{settings.appName}</span>
      </Link>
      <div className="flex items-center gap-3">
        <XPBadge xp={totalXP} />
        <Link to="/profile" className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
            {currentUser ? <span className="font-bold text-blue-600 text-xs">{currentUser.name.charAt(0)}</span> : <User className="w-4 h-4 text-gray-400" />}
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
    <nav className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-100 flex items-center justify-around z-50 pb-safe">
      {tabs.map(tab => {
        const isActive = location.pathname === tab.path;
        return (
          <Link key={tab.path} to={tab.path} className={`flex flex-col items-center gap-0.5 flex-1 py-1 transition-all ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
            <tab.icon className={`w-5 h-5`} />
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
        setTimeout(() => { if (id) { grantTempAccess(id); setStatus('success'); setTimeout(() => navigate(`/course/${id}`), 1000); } }, 1500);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full text-center">
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    {status === 'verifying' ? <Loader2 className="w-7 h-7 text-blue-600 animate-spin" /> : status === 'success' ? <CheckCircle className="w-7 h-7 text-green-500" /> : <Shield className="w-7 h-7 text-blue-600" />}
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-2">{status === 'verifying' ? 'Checking Link...' : status === 'success' ? 'Access OK!' : '24h Free Access'}</h2>
                <p className="text-gray-500 text-xs mb-8">{status === 'verifying' ? 'Verifying access token...' : status === 'success' ? 'Redirecting to content...' : `Activating temporary access for: ${course?.title || 'this batch'}.`}</p>
                {status === 'idle' && <button onClick={handleVerify} className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl active:scale-95 transition-all shadow-md shadow-blue-200">Claim Access</button>}
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
        const title = prompt('Subject Name:');
        const iconText = prompt('Icon (max 3 chars):') || 'S';
        if (title) setSubjects([...subjects, { id: Date.now().toString(), title, iconText, chapters: [] }]);
    };

    const addChapter = (sId: string) => {
        const title = prompt('Chapter Name:');
        if (title) setSubjects(subjects.map(s => s.id === sId ? { ...s, chapters: [...s.chapters, { id: Date.now().toString(), title, videos: [] }] } : s));
    };

    const addVideo = (sId: string, cId: string) => {
        const title = prompt('Content Title:');
        const url = prompt('Stream Link (Youtube/Vimeo):');
        const dur = prompt('Length (e.g. 30m):') || '10:00';
        const typeInput = prompt('Type (lecture/note/dpp):') || 'lecture';
        const type = (['lecture', 'note', 'dpp'].includes(typeInput) ? typeInput : 'lecture') as 'lecture' | 'note' | 'dpp';
        if (title && url) {
            setSubjects(subjects.map(s => s.id === sId ? { ...s, chapters: s.chapters.map(c => c.id === cId ? { ...c, videos: [...c.videos, { id: Date.now().toString(), title, filename: url, duration: dur, type, date: new Date().toLocaleDateString() }] } : c) } : s));
        }
    };

    const activeSubject = subjects.find(s => s.id === activeSubjectId);
    const activeChapter = activeSubject?.chapters.find(c => c.id === activeChapterId);

    return (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-xl p-6 max-h-[80vh] flex flex-col shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base font-bold text-gray-800">
                      {activeChapter ? activeChapter.title : activeSubject ? activeSubject.title : 'Content Manager'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="flex items-center gap-1.5 mb-4 text-[9px] font-bold text-gray-400 overflow-x-auto whitespace-nowrap uppercase tracking-widest">
                    <button onClick={() => { setActiveSubjectId(null); setActiveChapterId(null); }} className={!activeSubjectId ? 'text-blue-600' : ''}>HOME</button>
                    {activeSubject && (
                      <>
                        <ChevronRight className="w-2 h-2" />
                        <button onClick={() => setActiveChapterId(null)} className={activeSubjectId && !activeChapterId ? 'text-blue-600' : ''}>{activeSubject.title}</button>
                      </>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                    {activeChapterId && activeSubjectId ? (
                        <div className="space-y-2">
                            <button onClick={() => addVideo(activeSubjectId, activeChapterId)} className="w-full py-3 border border-dashed border-gray-200 rounded-lg text-blue-600 text-sm font-bold hover:bg-gray-50">+ Add Content Item</button>
                            {activeChapter?.videos.map(vid => (
                                <div key={vid.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                                    <div className="truncate">
                                        <p className="text-xs font-bold text-gray-800 truncate">{vid.title}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">{vid.type} • {vid.duration}</p>
                                    </div>
                                    <button onClick={() => setSubjects(subjects.map(s => s.id === activeSubjectId ? {...s, chapters: s.chapters.map(c => c.id === activeChapterId ? {...c, videos: c.videos.filter(v => v.id !== vid.id)} : c)} : s))} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    ) : activeSubjectId ? (
                        <div className="space-y-2">
                            <button onClick={() => addChapter(activeSubjectId)} className="w-full py-3 border border-dashed border-gray-200 rounded-lg text-blue-600 text-sm font-bold hover:bg-gray-50">+ Create Folder/Chapter</button>
                            {activeSubject?.chapters.map(chap => (
                                <div key={chap.id} className="p-3 bg-white border border-gray-100 rounded-lg flex justify-between items-center shadow-sm">
                                    <button onClick={() => setActiveChapterId(chap.id)} className="flex-1 text-left text-sm font-bold text-gray-700">{chap.title}</button>
                                    <button onClick={() => setSubjects(subjects.map(s => s.id === activeSubjectId ? {...s, chapters: s.chapters.filter(c => c.id !== chap.id)} : s))} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <button onClick={addSubject} className="w-full py-3 border border-dashed border-gray-200 rounded-lg text-blue-600 text-sm font-bold hover:bg-gray-50">+ New Subject Node</button>
                            {subjects.map(sub => (
                                <div key={sub.id} className="p-3 bg-white border border-gray-100 rounded-lg flex justify-between items-center shadow-sm">
                                    <button onClick={() => setActiveSubjectId(sub.id)} className="flex items-center gap-3 flex-1 text-left">
                                        <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center text-blue-600 font-bold text-[10px]">{sub.iconText}</div>
                                        <span className="text-sm font-bold text-gray-800">{sub.title}</span>
                                    </button>
                                    <button onClick={() => setSubjects(subjects.filter(s => s.id !== sub.id))} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="mt-6 flex gap-2">
                    <button onClick={onClose} className="flex-1 py-3 text-gray-400 font-bold text-sm">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg text-sm active:scale-95 transition-all">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

// --- ADMIN CONTROL PANEL ---

const AdminPanel = () => {
    const { currentUser, courses, settings, addCourse, updateCourse, deleteCourse, duplicateCourse, updateSettings, clearAllData, users, manageUserRole } = useStore();
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

    const autoGenerateSlug = () => {
        const slug = form.title.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        setForm({...form, shortenerLink: slug});
    };

    const copyTempLink = (id: string) => {
        const link = `${window.location.origin}/#/temp-access/${id}`;
        navigator.clipboard.writeText(link);
        alert("24h Link copied to clipboard!");
    };

    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchUser.toLowerCase()) || u.email.toLowerCase().includes(searchUser.toLowerCase()));

    return (
        <div className="pb-24 pt-16 px-4 min-h-screen bg-gray-50">
             <div className="max-w-3xl mx-auto">
                 <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 mb-6 max-w-sm mx-auto">
                    {(['batches', 'users', 'settings'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 font-bold capitalize transition-all rounded-lg text-[11px] ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
                            {t}
                        </button>
                    ))}
                 </div>

                 {tab === 'batches' && (
                     <div className="space-y-3">
                         <button onClick={() => { setEditing(null); setShowModal(true); }} className="w-full py-8 bg-white border-2 border-dashed border-blue-200 rounded-xl text-blue-600 font-bold flex flex-col items-center justify-center gap-2 hover:bg-blue-50 transition-all">
                            <Plus className="w-5 h-5" />
                            <span className="text-sm">Create New Batch Node</span>
                         </button>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             {courses.map(c => (
                                 <div key={c.id} className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
                                     <div className="flex items-center gap-3">
                                         <div className="w-14 h-14 rounded-lg bg-gray-50 overflow-hidden border shrink-0">
                                            <img src={c.image || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                                         </div>
                                         <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-800 truncate text-sm">{c.title}</h3>
                                            <p className="text-[9px] text-blue-500 font-bold uppercase">{c.category}</p>
                                         </div>
                                     </div>
                                     <div className="flex gap-1.5 w-full">
                                        <button onClick={() => setContentTarget(c)} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold text-[10px] uppercase transition-all shadow-sm active:scale-95">Edit Content</button>
                                        <button onClick={() => copyTempLink(c.id)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Temp Access Link"><LinkIcon className="w-4 h-4" /></button>
                                        <button onClick={() => duplicateCourse(c.id)} className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:text-blue-600" title="Duplicate Batch"><Copy className="w-4 h-4" /></button>
                                        <button onClick={() => { setEditing(c); setShowModal(true); }} className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => { if(confirm('Permanently delete batch?')) deleteCourse(c.id); }} className="p-2 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                 {tab === 'users' && (
                    <div className="space-y-3 animate-fade-in">
                        <div className="flex items-center bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                            <Search className="w-4 h-4 text-gray-300 mx-2" />
                            <input value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="Search student roster..." className="w-full bg-transparent text-sm outline-none font-medium" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredUsers.map(u => {
                                const totalXP = (u.examResults || []).reduce((acc, curr) => acc + (curr.score * 50), 0);
                                return (
                                    <div key={u.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm">{u.name.charAt(0)}</div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-gray-800 text-xs truncate">{u.name}</h3>
                                                    <p className="text-[9px] text-gray-400 truncate font-medium">{u.email}</p>
                                                </div>
                                            </div>
                                            <select 
                                                value={u.role} 
                                                onChange={(e) => manageUserRole(u.id, e.target.value as UserRole)}
                                                className="text-[9px] font-bold bg-gray-50 px-2 py-1 rounded border border-gray-100 outline-none text-blue-600 cursor-pointer"
                                            >
                                                <option value={UserRole.USER}>User</option>
                                                <option value={UserRole.EDITOR}>Manager</option>
                                                <option value={UserRole.ADMIN}>Admin</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 bg-gray-50 p-2 rounded-lg">
                                            <span>PROGRESS: {totalXP} XP</span>
                                            <span className="text-blue-500">RANK: {Math.floor(totalXP/200)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                 )}

                 {tab === 'settings' && currentUser.role === UserRole.ADMIN && (
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm space-y-5">
                        <h2 className="text-sm font-bold text-gray-800">System Dashboard</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1 ml-1">Portal Alias</label>
                                <input value={settingsForm.appName} onChange={e => setSettingsForm({...settingsForm, appName: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-lg font-bold text-sm" />
                            </div>
                            <button onClick={() => { updateSettings(settingsForm); alert("Settings updated!"); }} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg text-sm shadow transition-all active:scale-95">Apply Portal Settings</button>
                            <button onClick={clearAllData} className="w-full py-3 bg-red-50 text-red-500 font-bold border border-red-100 rounded-lg hover:bg-red-500 hover:text-white transition-all text-xs">Clear Data Partition</button>
                        </div>
                    </div>
                 )}
             </div>

             {showModal && (
                 <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl max-h-[85vh] overflow-y-auto no-scrollbar border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-base font-bold text-gray-800">{editing ? 'Configure Batch' : 'Initialize Batch'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSaveCourse} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">Cover Image</label>
                                <div className="relative aspect-video rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer group">
                                    {form.image ? <img src={form.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-gray-300" />}
                                    <input type="file" accept="image/*" onChange={onFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white font-bold uppercase transition-opacity">Swap Image</div>
                                </div>
                            </div>
                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-lg font-bold text-sm" placeholder="Batch Title" required />
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-lg text-xs min-h-[60px]" placeholder="Brief batch overview..." required />
                            <div className="grid grid-cols-2 gap-3">
                                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="p-3.5 bg-gray-50 border border-gray-100 rounded-lg text-[11px] font-bold" placeholder="Level / Segment" required />
                                <div className="flex items-center justify-between px-3.5 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer" onClick={() => setForm({...form, isPaid: !form.isPaid})}>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Premium</span>
                                    <div className={`w-7 h-3.5 rounded-full relative transition-all ${form.isPaid ? 'bg-blue-600' : 'bg-gray-300'}`}><div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all ${form.isPaid ? 'left-4' : 'left-0.5'}`} /></div>
                                </div>
                            </div>
                            <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-lg space-y-3">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Access Links</label>
                                <div className="flex gap-2">
                                    <input value={form.shortenerLink} onChange={e => setForm({ ...form, shortenerLink: e.target.value })} className="flex-1 p-2.5 bg-white border border-gray-100 rounded text-[11px] font-bold" placeholder="Custom Slug (e.g. physics-X)" />
                                    <button type="button" onClick={autoGenerateSlug} className="px-2.5 bg-blue-50 text-blue-600 rounded border border-blue-100 transition-colors" title="Sync from Title"><Wand2 className="w-4 h-4" /></button>
                                </div>
                                <input value={form.telegramLink} onChange={e => setForm({ ...form, telegramLink: e.target.value })} className="w-full p-2.5 bg-white border border-gray-100 rounded text-[11px] font-bold" placeholder="Telegram Group URL" />
                            </div>
                            <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-lg shadow-md active:scale-95 transition-all text-xs uppercase tracking-widest">Deploy Batch Node</button>
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
        <div className="pb-20 pt-16 px-4 min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto space-y-4">
                {courses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 opacity-30 text-center">
                        <BookOpen className="w-10 h-10 mb-3" />
                        <p className="font-bold text-[10px] uppercase tracking-[0.3em]">Sector Empty: No active batches</p>
                    </div>
                ) : courses.map(c => (
                    <div key={c.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col animate-slide-up hover:shadow-md transition-all">
                        <div className="aspect-[16/7] bg-gray-100 border-b overflow-hidden">
                            <img src={c.image || 'https://via.placeholder.com/600x250'} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-gray-900 text-base">{c.title}</h3>
                                <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase border border-blue-100">{c.category}</span>
                            </div>
                            <p className="text-gray-500 text-xs line-clamp-2 mb-5 leading-relaxed font-medium">{c.description}</p>
                            <Link to={`/course/${c.id}`} className="block w-full py-3 bg-blue-600 text-white text-center text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all uppercase tracking-widest">Enter Classroom</Link>
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
    const [activeTab, setActiveTab] = useState<'Content' | 'About'>('Content');

    const course = courses.find(c => c.id === id);
    if (!course) return <Navigate to="/" />;

    return (
        <div className="pb-20 pt-0 min-h-screen bg-white">
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
                <div className="flex items-center gap-3 p-4">
                    <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-gray-800" /></button>
                    <h1 className="text-base font-bold text-gray-800 truncate">{course.title}</h1>
                </div>
                <div className="flex px-4 gap-6">
                    {(['Content', 'About'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === tab ? 'text-blue-600 border-blue-600' : 'text-gray-300 border-transparent'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
            
            <Banner />

            <div className="p-5">
                {activeTab === 'Content' && (
                    <div className="space-y-3">
                        {(course.subjects || []).map((sub) => (
                            <div key={sub.id} onClick={() => navigate(`/course/${course.id}/subject/${sub.id}`)} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-blue-500 cursor-pointer transition-colors group">
                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-lg">{sub.iconText}</div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 text-sm">{sub.title}</h3>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{sub.chapters.length} Content Nodes</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-blue-500 transition-colors" />
                            </div>
                        ))}
                        {(!course.subjects || course.subjects.length === 0) && (
                           <div className="text-center py-20 opacity-20 text-[10px] font-bold uppercase tracking-widest">Waiting for admin broadcast</div>
                        )}
                    </div>
                )}
                {activeTab === 'About' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-100">
                             <img src={course.image || 'https://via.placeholder.com/600x400'} className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-xl font-bold text-gray-800">{course.title}</h2>
                            <p className="text-gray-500 leading-relaxed text-sm font-medium">{course.description}</p>
                            <div className="flex flex-wrap gap-2 pt-4">
                                {course.telegramLink && <a href={course.telegramLink} target="_blank" className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase transition-all hover:bg-blue-100"><Send className="w-3 h-3" /> Connect Community</a>}
                                <span className="px-3 py-1.5 bg-gray-50 text-gray-400 rounded-lg text-[10px] font-bold uppercase">{course.category} Cluster</span>
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
        <div className="pb-20 pt-0 min-h-screen bg-white">
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
                <div className="flex items-center gap-3 p-4">
                    <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-gray-800" /></button>
                    <h1 className="text-base font-bold text-gray-800 truncate">{subject.title}</h1>
                </div>
            </div>
            <div className="p-5 space-y-5">
                {subject.chapters.length === 0 ? (
                    <div className="text-center py-40 opacity-20 font-bold uppercase text-[9px] tracking-widest">No chapters found in node</div>
                ) : subject.chapters.map((chap, idx) => (
                    <div key={chap.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-5">
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-blue-600 text-[9px] font-bold uppercase mb-0.5 block tracking-widest">NODE {idx + 1}</span>
                                <h3 className="font-bold text-gray-800 text-base leading-tight">{chap.title}</h3>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            {chap.videos.map(v => (
                                <button key={v.id} onClick={() => navigate(`/watch/${courseId}`)} className="w-full p-3.5 bg-gray-50 rounded-xl flex items-center gap-3.5 hover:bg-blue-600 hover:text-white transition-all text-left group">
                                    <div className="w-9 h-9 bg-white rounded flex items-center justify-center text-blue-600 group-hover:scale-95 transition-transform"><Play className="w-4 h-4" /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold truncate uppercase">{v.title}</p>
                                        <p className="text-[9px] font-bold opacity-50 group-hover:opacity-100 uppercase">{v.duration} • {v.type}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 opacity-10 group-hover:opacity-100" />
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
            <div className="p-3.5 flex items-center gap-3.5 bg-gray-900 border-b border-white/10 shadow-lg">
                <button onClick={() => navigate(-1)} className="p-1.5 bg-white/5 rounded-lg transition-colors hover:bg-white/10"><ArrowLeft className="w-4 h-4" /></button>
                <h1 className="text-sm font-bold truncate">{activeVideo?.title || "Connecting..."}</h1>
            </div>
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                <div className="flex-1 bg-black flex items-center justify-center p-2 relative">
                    {activeVideo ? <VideoPlayer src={activeVideo.filename} title={activeVideo.title} onBack={() => navigate(-1)} className="w-full max-w-5xl" /> : <div className="text-gray-500 text-xs font-bold tracking-widest animate-pulse">SYNCHRONIZING STREAM...</div>}
                </div>
                <div className="w-full lg:w-[320px] bg-gray-900 overflow-y-auto border-l border-white/10 p-5 no-scrollbar">
                    <h3 className="font-bold mb-5 text-gray-600 uppercase text-[10px] tracking-[0.2em] border-b border-white/5 pb-2">Stream Sequence</h3>
                    <div className="space-y-5">
                        {course.subjects.map(sub => (
                            <div key={sub.id} className="space-y-2">
                                <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest opacity-80">{sub.title}</p>
                                {sub.chapters.flatMap(c => c.videos).map(v => (
                                    <button key={v.id} onClick={() => setActiveVideo(v)} className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all text-left border ${activeVideo?.id === v.id ? 'bg-blue-600/10 border-blue-500/30 shadow-inner' : 'hover:bg-white/5 border-transparent'}`}>
                                        <div className={`w-7 h-7 rounded flex items-center justify-center ${activeVideo?.id === v.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'}`}>
                                          <PlayCircle className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[11px] font-bold truncate ${activeVideo?.id === v.id ? 'text-white' : 'text-gray-400'}`}>{v.title}</p>
                                            <p className="text-[8px] text-gray-600 font-bold mt-0.5 uppercase">{v.duration}</p>
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
        <div className="pb-20 pt-20 px-6 min-h-screen bg-gray-50">
            <div className="max-w-sm mx-auto space-y-4">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-2xl -mr-16 -mt-16"></div>
                    <div className="w-20 h-20 rounded-xl bg-blue-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 relative z-10 shadow-lg">
                        {currentUser.name.charAt(0)}
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1 relative z-10">{currentUser.name}</h2>
                    <p className="text-blue-600 font-bold text-[9px] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full inline-block mb-8 relative z-10">{currentUser.role} ACCESS</p>
                    <button onClick={logout} className="w-full py-3 text-red-500 font-bold bg-red-50 rounded-lg text-xs tracking-widest uppercase transition-all active:scale-95 shadow-sm">Terminate Session</button>
                </div>
                {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.EDITOR) && <Link to="/admin" className="block w-full py-5 bg-blue-600 text-white rounded-2xl text-center font-bold shadow-md active:scale-95 transition-all uppercase text-xs tracking-widest">Access Control Panel</Link>}
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
            <div className="bg-white p-8 rounded-2xl w-full max-w-sm shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-100"></div>
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-white text-2xl font-bold shadow-lg">S</div>
                    <h1 className="text-xl font-bold text-gray-800">Study Portal</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sync required</p>
                </div>
                <form onSubmit={e => { e.preventDefault(); if(isS) signup(f.name, f.email, '', f.pass); else if (!login(f.email, f.pass)) alert('Login failed: Neural mismatch'); }} className="space-y-3.5">
                    {isS && <input className="w-full p-3.5 bg-gray-50 rounded-lg outline-none font-bold border border-transparent focus:border-blue-500 transition-all text-sm" placeholder="Full Name" value={f.name} onChange={e => setF({...f, name: e.target.value})} required />}
                    <input className="w-full p-3.5 bg-gray-50 rounded-lg outline-none font-bold border border-transparent focus:border-blue-500 transition-all text-sm uppercase tracking-tight" placeholder="Signal / Email" value={f.email} onChange={e => setF({...f, email: e.target.value})} required />
                    <input className="w-full p-3.5 bg-gray-50 rounded-lg outline-none font-bold border border-transparent focus:border-blue-500 transition-all text-sm" type="password" placeholder="Pass-Sequence" value={f.pass} onChange={e => setF({...f, pass: e.target.value})} required />
                    <button className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all mt-4 text-sm uppercase tracking-widest">Initialize</button>
                </form>
                <button onClick={() => setIsS(!isS)} className="w-full mt-8 text-[9px] text-blue-600 font-bold uppercase text-center tracking-widest">{isS ? '< Back to Login' : 'Construct New Identity >'}</button>
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
      <div className={!isWatch ? "pt-14 pb-14" : ""}>
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
