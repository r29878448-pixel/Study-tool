
import React, { useEffect, useState, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { 
  Home, BookOpen, User, Search, PlayCircle, Lock, 
  LayoutDashboard, Settings, Plus, Trash2, Edit, X, 
  CheckCircle, ExternalLink, Play, Bot, Brain, Loader2, ArrowLeft, 
  Video as VideoIcon, Sparkles, Send, Smartphone, List, Globe, Bell, 
  ChevronRight, MoreVertical, MessageCircle, FileText, Calendar, MessageSquare, Eye,
  RotateCcw, ImageIcon, Key, Clock, Shield, LogOut, Download, Save, Timer as TimerIcon, AlertCircle, Link as LinkIcon,
  Upload, Folder, CreditCard, Copy
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
    <span>Complete video lectures to earn XP!</span>
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
    const courseName = courses.find(c => c.id === id)?.title || "Batch";

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
                <h2 className="text-2xl font-black text-gray-800 mb-2">{status === 'verifying' ? 'Verifying Access...' : status === 'success' ? 'Access Granted!' : 'Security Check'}</h2>
                <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">{status === 'verifying' ? 'Validating your temporary access token...' : status === 'success' ? 'Redirecting you to the batch content.' : `Claiming 24h access to: ${courseName}`}</p>
                {status === 'idle' && <button onClick={handleVerify} className="w-full py-4 bg-[#0056d2] text-white font-bold rounded-2xl shadow-lg">Confirm Access</button>}
            </div>
        </div>
    );
};

const ContentManager = ({ course, onClose }: { course: Course, onClose: () => void }) => {
    const { updateCourse } = useStore();
    const [subjects, setSubjects] = useState<Subject[]>(course.subjects || []);
    const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
    const [editingVideo, setEditingVideo] = useState<{chapId: string, vid: Video} | null>(null);

    const handleSave = () => { updateCourse({ ...course, subjects }); onClose(); };

    const addSubject = () => {
        const title = prompt('Subject Name:');
        const iconText = prompt('Icon Letter (e.g. A):') || 'Su';
        if (title) setSubjects([...subjects, { id: Date.now().toString(), title, iconText, chapters: [] }]);
    };

    const addChapter = (sId: string) => {
        const title = prompt('Chapter Name:');
        if (title) setSubjects(subjects.map(s => s.id === sId ? { ...s, chapters: [...s.chapters, { id: Date.now().toString(), title, videos: [] }] } : s));
    };

    const addVideo = (sId: string, cId: string) => {
        const title = prompt('Content Title:');
        const url = prompt('Stream Link:');
        const dur = prompt('Duration (e.g. 10:00):') || '10:00';
        const typeInput = prompt('Type (lecture/note/dpp):') || 'lecture';
        const type = (['lecture', 'note', 'dpp'].includes(typeInput) ? typeInput : 'lecture') as 'lecture' | 'note' | 'dpp';
        if (title && url) setSubjects(subjects.map(s => s.id === sId ? { ...s, chapters: s.chapters.map(c => c.id === cId ? { ...c, videos: [...c.videos, { id: Date.now().toString(), title, filename: url, duration: dur, type, date: 'TODAY' }] } : c) } : s));
    };

    const activeSubject = subjects.find(s => s.id === activeSubjectId);
    const activeChapter = activeSubject?.chapters.find(c => c.id === activeChapterId);

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[32px] p-8 max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                      <VideoIcon className="text-blue-600" /> 
                      {activeChapter ? activeChapter.title : activeSubject ? activeSubject.title : 'Manage Subjects'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X /></button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
                    {activeChapterId && activeSubjectId ? (
                        <div className="space-y-3">
                            <button onClick={() => addVideo(activeSubjectId, activeChapterId)} className="w-full py-4 border-2 border-dashed border-blue-100 rounded-2xl text-blue-600 font-bold hover:bg-blue-50 transition-all">+ Add Content</button>
                            {activeChapter?.videos.map(vid => (
                                <div key={vid.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center">
                                    <div className="truncate pr-4"><p className="text-sm font-bold text-gray-800 truncate">{vid.title}</p></div>
                                    <button onClick={() => setSubjects(subjects.map(s => s.id === activeSubjectId ? {...s, chapters: s.chapters.map(c => c.id === activeChapterId ? {...c, videos: c.videos.filter(v => v.id !== vid.id)} : c)} : s))} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    ) : activeSubjectId ? (
                        <div className="space-y-3">
                            <button onClick={() => addChapter(activeSubjectId)} className="w-full py-4 border-2 border-dashed border-blue-100 rounded-2xl text-blue-600 font-bold hover:bg-blue-50 transition-all">+ Add Chapter</button>
                            {activeSubject?.chapters.map(chap => (
                                <div key={chap.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm">
                                    <button onClick={() => setActiveChapterId(chap.id)} className="flex-1 text-left font-bold text-gray-700">{chap.title}</button>
                                    <button onClick={() => setSubjects(subjects.map(s => s.id === activeSubjectId ? {...s, chapters: s.chapters.filter(c => c.id !== chap.id)} : s))} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <button onClick={addSubject} className="w-full py-4 border-2 border-dashed border-blue-100 rounded-2xl text-blue-600 font-bold hover:bg-blue-50 transition-all">+ Add Subject</button>
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
                    <button onClick={onClose} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-colors">Close</button>
                    <button onClick={handleSave} className="flex-1 py-4 bg-[#0056d2] text-white font-bold rounded-2xl shadow-lg transition-all">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const AdminPanel = () => {
    const { currentUser, courses, settings, addCourse, updateCourse, deleteCourse, updateSettings, clearAllData } = useStore();
    const [tab, setTab] = useState<'batches' | 'settings'>('batches');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Course | null>(null);
    const [contentTarget, setContentTarget] = useState<Course | null>(null);
    const [settingsForm, setSettingsForm] = useState<AppSettings>(settings);
    const [form, setForm] = useState({ title: '', description: '', image: '', category: '', price: 0, mrp: 0, isPaid: false, startDate: '', endDate: '' });

    useEffect(() => { setSettingsForm(settings); }, [settings]);
    useEffect(() => { if (editing) setForm({ title: editing.title, description: editing.description, image: editing.image, category: editing.category, price: editing.price, mrp: editing.mrp, isPaid: !!editing.isPaid, startDate: editing.startDate || '', endDate: editing.endDate || '' }); else setForm({ title: '', description: '', image: '', category: '', price: 0, mrp: 0, isPaid: false, startDate: '', endDate: '' }); }, [editing, showModal]);

    if (!currentUser || currentUser.role !== UserRole.ADMIN) return <Navigate to="/" />;
    
    const handleSaveCourse = (e: React.FormEvent) => { e.preventDefault(); const data: Course = { ...(editing || { id: Date.now().toString(), subjects: [], createdAt: new Date().toISOString() }), ...form }; if (editing) updateCourse(data); else addCourse(data); setShowModal(false); };
    const handleSaveSettings = (e: React.FormEvent) => { e.preventDefault(); updateSettings(settingsForm); alert("Settings updated locally."); };
    
    const copyBatchCode = () => {
        const json = JSON.stringify(courses, null, 2);
        navigator.clipboard.writeText(json);
        alert("Batch Data copied to clipboard! Send this to developer to make it permanent for all users.");
    };

    return (
        <div className="pb-24 pt-24 px-4 min-h-screen bg-[#f8fafc]">
             <div className="max-w-6xl mx-auto">
                 <div className="flex bg-white p-1.5 rounded-lg shadow-sm border border-gray-200 mb-8 max-w-md">
                    {(['batches', 'settings'] as const).map(t => (<button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 font-bold capitalize transition-all rounded-md text-xs ${tab === t ? 'bg-[#0056d2] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>{t}</button>))}
                 </div>

                 {tab === 'batches' && (
                     <div className="space-y-4">
                         <button onClick={() => { setEditing(null); setShowModal(true); }} className="w-full py-10 bg-white border-2 border-dashed border-blue-200 rounded-xl text-[#0056d2] font-bold flex flex-col items-center justify-center gap-2 hover:bg-blue-50 transition-all"><Plus className="w-8 h-8" /><span>ADD NEW BATCH</span></button>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {courses.map(c => (
                                 <div key={c.id} className="bg-white p-4 rounded-lg flex flex-col gap-4 border border-gray-200 shadow-sm">
                                     <div className="flex items-center gap-4">
                                         <img src={c.image} className="w-16 h-16 rounded-lg object-cover border border-gray-100" />
                                         <div className="flex-1 min-w-0"><h3 className="font-bold text-gray-800 text-sm truncate">{c.title}</h3><p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{c.category}</p></div>
                                     </div>
                                     <div className="flex gap-2 w-full"><button onClick={() => setContentTarget(c)} className="flex-1 py-2 bg-[#0056d2] text-white rounded-md font-bold text-[10px]">CONTENT</button><button onClick={() => { setEditing(c); setShowModal(true); }} className="p-2 bg-gray-50 text-gray-500 rounded-md"><Edit className="w-4 h-4" /></button><button onClick={() => deleteCourse(c.id)} className="p-2 bg-red-50 text-red-400 rounded-md"><Trash2 className="w-4 h-4" /></button></div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                 {tab === 'settings' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Portal Config</h2>
                        <form onSubmit={handleSaveSettings} className="space-y-6">
                            <div className="space-y-2"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Portal Name</label><input value={settingsForm.appName} onChange={e => setSettingsForm({...settingsForm, appName: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md font-bold text-sm" /></div>
                            <button type="submit" className="w-full py-3 bg-[#0056d2] text-white font-black rounded-md shadow-md text-sm uppercase">Save Name</button>
                        </form>
                        <div className="mt-12 pt-8 border-t border-gray-100 space-y-4">
                            <h3 className="text-blue-600 font-bold">Production Tools</h3>
                            <button onClick={copyBatchCode} className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl font-bold text-sm hover:bg-blue-600 hover:text-white transition-all w-full justify-center">
                                <Copy className="w-4 h-4" /> Copy All Batch Data for Production
                            </button>
                            <h3 className="text-red-600 font-bold">System Reset</h3>
                            <button onClick={clearAllData} className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-600 hover:text-white transition-all w-full justify-center">
                                <RotateCcw className="w-4 h-4" /> Force Factory Reset (Clear Demo Data)
                            </button>
                        </div>
                    </div>
                 )}
             </div>

             {showModal && (
                 <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">{editing ? 'Edit Batch' : 'Add Batch'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleSaveCourse} className="space-y-4">
                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md font-bold" placeholder="Batch Name" required />
                            <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md text-xs" placeholder="Image URL" />
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md text-xs min-h-[80px]" placeholder="Description" required />
                            <div className="grid grid-cols-2 gap-4">
                                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="p-3 bg-gray-50 border border-gray-200 rounded-md text-xs uppercase font-bold" placeholder="Category" required />
                                <div className="flex items-center justify-between px-3 py-3 bg-gray-50 rounded-md border border-gray-200 cursor-pointer" onClick={() => setForm({...form, isPaid: !form.isPaid})}>
                                    <span className="text-xs font-bold text-gray-500">Paid</span>
                                    <div className={`w-9 h-5 rounded-full relative transition-all ${form.isPaid ? 'bg-blue-600' : 'bg-gray-300'}`}><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.isPaid ? 'left-4.5' : 'left-0.5'}`} /></div>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3 bg-[#0056d2] text-white font-bold rounded-md shadow-md text-sm uppercase">Save Batch</button>
                        </form>
                    </div>
                 </div>
             )}
             {contentTarget && <ContentManager course={contentTarget} onClose={() => setContentTarget(null)} />}
        </div>
    );
};

const CourseListing = () => {
    const { courses } = useStore();
    return (
        <div className="pb-24 pt-20 px-5 min-h-screen bg-[#f8fafc]">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-32 text-gray-400">
                        <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                        <p className="uppercase font-black tracking-widest text-xs">Waiting for admin to upload content.</p>
                    </div>
                ) : courses.map(c => (
                    <div key={c.id} className="bg-white rounded-[40px] overflow-hidden border border-gray-100 shadow-sm flex flex-col hover:shadow-lg transition-all">
                        <div className="p-7 font-black text-gray-800 text-lg truncate">{c.title}</div>
                        <div className="px-7"><img src={c.image} className="w-full aspect-video object-cover rounded-[30px]" alt={c.title} /></div>
                        <div className="p-7 flex-1 flex flex-col justify-end"><Link to={`/course/${c.id}`} className="w-full py-4 bg-[#0056d2] text-white text-center text-sm font-black rounded-2xl shadow-xl shadow-blue-200 uppercase tracking-widest">Let's Study</Link></div>
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
    const [activeTab, setActiveTab] = useState<'Subjects' | 'Description'>('Subjects');

    const course = courses.find(c => c.id === id);
    if (!course) return <Navigate to="/" />;

    return (
        <div className="pb-24 pt-0 min-h-screen bg-white">
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex items-center justify-between p-4 px-6">
                    <div className="flex items-center gap-5">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-gray-800" /></button>
                        <h1 className="text-xl font-black text-gray-800 truncate tracking-tight">{course.title}</h1>
                    </div>
                </div>
                <div className="flex px-6 gap-8 overflow-x-auto no-scrollbar">
                    {(['Subjects', 'Description'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-black transition-all border-b-4 ${activeTab === tab ? 'text-[#0056d2] border-[#0056d2]' : 'text-gray-400 border-transparent'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
            <div className="p-6">
                {activeTab === 'Subjects' && (
                    <div className="space-y-5">
                        {(course.subjects || []).map((sub) => (
                            <div key={sub.id} onClick={() => navigate(`/course/${course.id}/subject/${sub.id}`)} className="bg-white border border-gray-100 rounded-[35px] p-6 flex items-center gap-6 shadow-sm active:scale-[0.98] transition-all hover:border-[#0056d2]/30 cursor-pointer">
                                <div className="w-16 h-16 bg-[#0056d2]/5 rounded-2xl flex items-center justify-center text-[#0056d2] font-black text-xl">{sub.iconText}</div>
                                <div className="flex-1">
                                    <h3 className="font-black text-gray-800 text-lg leading-tight">{sub.title}</h3>
                                    <div className="flex items-center gap-5 mt-3">
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#0056d2] w-[0%]"></div></div>
                                        <span className="text-[12px] font-black text-gray-400">0%</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-6 h-6 text-gray-300" />
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'Description' && (
                    <div className="space-y-8">
                        <img src={course.image} className="w-full h-56 object-cover rounded-[50px] shadow-2xl" alt="" />
                        <p className="text-gray-500 text-base leading-relaxed font-medium">{course.description}</p>
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
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex items-center gap-5 p-4 px-6">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-gray-800" /></button>
                    <h1 className="text-xl font-black text-gray-800">{subject.title}</h1>
                </div>
            </div>
            <div className="p-6 space-y-4">
                {subject.chapters.map((chap, idx) => (
                    <div key={chap.id} className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-[#0056d2] text-[10px] font-black uppercase tracking-widest">Chapter {idx + 1}</span>
                                <h3 className="font-black text-gray-800 text-xl">{chap.title}</h3>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {chap.videos.map(v => (
                                <button key={v.id} onClick={() => navigate(`/watch/${courseId}`)} className="w-full p-4 bg-gray-50 rounded-2xl flex items-center gap-4 hover:bg-[#0056d2]/5 transition-all text-left">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#0056d2] shadow-sm"><Play className="w-4 h-4" /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-800 truncate">{v.title}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{v.duration}</p>
                                    </div>
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
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ArrowLeft className="w-6 h-6" /></button>
                <h1 className="text-lg font-bold truncate">{activeVideo?.title || "Watching"}</h1>
            </div>
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                <div className="flex-1 bg-black flex items-center justify-center p-4">
                    {activeVideo ? <VideoPlayer src={activeVideo.filename} title={activeVideo.title} onBack={() => navigate(-1)} className="w-full max-w-5xl shadow-2xl" /> : <div className="text-gray-500">Video error.</div>}
                </div>
                <div className="w-full lg:w-96 bg-gray-900 overflow-y-auto border-l border-white/10 p-6">
                    <h3 className="font-bold mb-6 text-gray-400 uppercase text-xs tracking-widest">Course Menu</h3>
                    <div className="space-y-6">
                        {course.subjects.map(sub => (
                            <div key={sub.id} className="space-y-2">
                                <p className="text-[10px] font-black text-[#0056d2] uppercase">{sub.title}</p>
                                {sub.chapters.flatMap(c => c.videos).map(v => (
                                    <button key={v.id} onClick={() => setActiveVideo(v)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${activeVideo?.id === v.id ? 'bg-[#0056d2]/20 border border-[#0056d2]/30' : 'hover:bg-white/5 border border-transparent'}`}>
                                        <PlayCircle className={`w-5 h-5 ${activeVideo?.id === v.id ? 'text-[#0056d2]' : 'text-gray-600'}`} />
                                        <p className={`text-xs font-bold truncate ${activeVideo?.id === v.id ? 'text-white' : 'text-gray-400'}`}>{v.title}</p>
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
        <div className="pb-24 pt-24 px-6 min-h-screen bg-[#f8fafc]">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="bg-white rounded-[60px] p-12 shadow-sm border border-gray-100 text-center">
                    <div className="w-32 h-32 rounded-[45px] bg-[#0056d2] flex items-center justify-center text-white text-5xl font-black shadow-2xl mx-auto mb-8">{currentUser.name.charAt(0)}</div>
                    <h2 className="text-4xl font-black text-gray-800 uppercase mb-2">{currentUser.name}</h2>
                    <p className="text-[#0056d2] font-black text-xs uppercase tracking-[0.4em] bg-blue-50 px-6 py-2 rounded-full inline-block mb-10">{currentUser.role} Account</p>
                    <button onClick={logout} className="w-full py-6 text-red-500 font-black bg-red-50 rounded-[30px] shadow-xl shadow-red-100 active:scale-95 transition-all uppercase tracking-[0.4em] text-xs">Disconnect Session</button>
                </div>
                {currentUser.role === UserRole.ADMIN && <Link to="/admin" className="block w-full py-8 bg-gradient-to-r from-[#0056d2] to-[#003ea1] text-white rounded-[50px] text-center font-black shadow-2xl uppercase tracking-[0.3em] text-xl active:scale-95 transition-transform">Control Grid</Link>}
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
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0056d2]">
            <div className="text-center mb-14">
              <div className="w-24 h-24 bg-white rounded-[40px] flex items-center justify-center mx-auto mb-6 text-[#0056d2] text-4xl font-black shadow-2xl">S</div>
              <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">Study Portal</h1>
            </div>
            <div className="bg-white p-12 rounded-[70px] w-full max-w-md shadow-2xl">
                <h2 className="text-2xl font-black text-gray-800 mb-12 text-center uppercase">Identity</h2>
                <form onSubmit={e => { e.preventDefault(); if(isS) signup(f.name, f.email, '', f.pass); else if (!login(f.email, f.pass)) alert('Login failed.'); }} className="space-y-5">
                    {isS && <input className="w-full p-6 bg-gray-50 rounded-3xl outline-none font-bold" placeholder="Full Name" value={f.name} onChange={e => setF({...f, name: e.target.value})} required />}
                    <input className="w-full p-6 bg-gray-50 rounded-3xl outline-none font-bold" placeholder="Email" value={f.email} onChange={e => setF({...f, email: e.target.value})} required />
                    <input className="w-full p-6 bg-gray-50 rounded-3xl outline-none font-bold" type="password" placeholder="Password" value={f.pass} onChange={e => setF({...f, pass: e.target.value})} required />
                    <button className="w-full py-6 bg-[#0056d2] text-white font-black rounded-[35px] shadow-2xl shadow-blue-200 uppercase tracking-widest mt-8">Initialize</button>
                </form>
                <button onClick={() => setIsS(!isS)} className="w-full mt-12 text-[10px] text-[#0056d2] font-black uppercase text-center">{isS ? '< Back to Login' : 'Create New Account >'}</button>
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
