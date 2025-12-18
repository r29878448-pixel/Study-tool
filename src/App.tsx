
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { 
  Home, BookOpen, User, Search, PlayCircle, Lock, 
  LayoutDashboard, Settings, Plus, Trash2, Edit, X, 
  CheckCircle, ExternalLink, Play, Bot, Brain, Loader2, ArrowLeft, 
  Video as VideoIcon, Sparkles, Send, Smartphone, List, Globe, Bell, 
  ChevronRight, MoreVertical, MessageCircle, FileText, Calendar, MessageSquare, Eye,
  RotateCcw, Image as ImageIcon
} from './components/Icons';
import VideoPlayer from './components/VideoPlayer';
import ChatBot from './components/ChatBot';
import ExamMode from './components/ExamMode';
import { GoogleGenAI } from "@google/genai";
import { Course, Chapter, Video, UserRole, Subject } from './types';

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

  if (isNoNav || isTabbedView) return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-5 z-50">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#0056d2] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-200">S</div>
            <span className="font-display font-extrabold text-[#0056d2] tracking-tight text-xl">{settings.appName}</span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-400 relative transition-colors"><Bell className="w-6 h-6" /></button>
        <Link to="/profile" className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center transition-transform active:scale-90">
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
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
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

// --- CONTENT MANAGER (NEW Subject -> Chapter -> Video Hierarchy) ---

const ContentManager = ({ course, onClose }: { course: Course, onClose: () => void }) => {
    const { updateCourse } = useStore();
    const [subjects, setSubjects] = useState<Subject[]>(course.subjects || []);
    const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
    const [editingVideo, setEditingVideo] = useState<{chapId: string, vid: Video} | null>(null);

    const handleSave = () => {
        updateCourse({ ...course, subjects });
        onClose();
    };

    const addSubject = () => {
        const title = prompt('Subject Title (e.g. Chemistry):');
        const iconText = prompt('Icon Text (2 chars, e.g. Ch):') || 'Su';
        if (title) {
            setSubjects([...subjects, { id: Date.now().toString(), title, iconText, chapters: [] }]);
        }
    };

    const addChapter = (sId: string) => {
        const title = prompt('Chapter Title:');
        if (title) {
            setSubjects(subjects.map(s => s.id === sId ? { ...s, chapters: [...s.chapters, { id: Date.now().toString(), title, videos: [] }] } : s));
        }
    };

    const addVideo = (sId: string, cId: string) => {
        const title = prompt('Sequence Title:');
        const url = prompt('Stream Link (URL):');
        const dur = prompt('Duration (HH:MM):') || '10:00';
        const typeInput = prompt('Type (lecture, dpp, note):') as any;
        const type = ['lecture', 'dpp', 'note'].includes(typeInput) ? typeInput : 'lecture';

        if (title && url) {
            setSubjects(subjects.map(s => s.id === sId ? { 
                ...s, 
                chapters: s.chapters.map(c => c.id === cId ? { 
                    ...c, 
                    videos: [...c.videos, { id: Date.now().toString(), title, filename: url, duration: dur, type, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase() }] 
                } : c)
            } : s));
        }
    };

    const updateVideo = () => {
        if (!editingVideo || !activeSubjectId) return;
        const { chapId, vid } = editingVideo;
        setSubjects(subjects.map(s => s.id === activeSubjectId ? {
            ...s,
            chapters: s.chapters.map(c => c.id === chapId ? { ...c, videos: c.videos.map(v => v.id === vid.id ? vid : v) } : c)
        } : s));
        setEditingVideo(null);
    };

    const activeSubject = subjects.find(s => s.id === activeSubjectId);
    const activeChapter = activeSubject?.chapters.find(c => c.id === activeChapterId);

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[32px] p-6 md:p-8 max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                        <VideoIcon className="text-blue-600" /> 
                        {activeChapter ? 'Manage Videos' : activeSubject ? 'Manage Chapters' : 'Manage Subjects'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X /></button>
                </div>

                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-400 overflow-x-auto no-scrollbar pb-2">
                    <button onClick={() => { setActiveSubjectId(null); setActiveChapterId(null); }} className={`${!activeSubjectId ? 'text-blue-600' : ''}`}>ROOT</button>
                    {activeSubject && (
                        <>
                            <ChevronRight className="w-3 h-3" />
                            <button onClick={() => setActiveChapterId(null)} className={`${activeSubjectId && !activeChapterId ? 'text-blue-600' : ''}`}>{activeSubject.title.toUpperCase()}</button>
                        </>
                    )}
                    {activeChapter && (
                        <>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-blue-600">{activeChapter.title.toUpperCase()}</span>
                        </>
                    )}
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
                    {editingVideo ? (
                        <div className="space-y-4 bg-gray-50 p-6 rounded-2xl animate-fade-in">
                            <h3 className="font-bold text-gray-700">Edit Node Data</h3>
                            <input value={editingVideo.vid.title} onChange={e => setEditingVideo({...editingVideo, vid: {...editingVideo.vid, title: e.target.value}})} className="w-full p-3 border rounded-xl" placeholder="Title" />
                            <input value={editingVideo.vid.filename} onChange={e => setEditingVideo({...editingVideo, vid: {...editingVideo.vid, filename: e.target.value}})} className="w-full p-3 border rounded-xl" placeholder="URL" />
                            <input value={editingVideo.vid.duration} onChange={e => setEditingVideo({...editingVideo, vid: {...editingVideo.vid, duration: e.target.value}})} className="w-full p-3 border rounded-xl" placeholder="Duration" />
                            <div className="flex gap-2">
                                <button onClick={() => setEditingVideo(null)} className="flex-1 py-2 text-gray-500 font-bold bg-white border rounded-xl">Cancel</button>
                                <button onClick={updateVideo} className="flex-1 py-2 bg-[#0056d2] text-white font-bold rounded-xl">Save Node</button>
                            </div>
                        </div>
                    ) : activeChapterId && activeSubjectId ? (
                        // Videos List
                        <div className="space-y-3">
                            <button onClick={() => addVideo(activeSubjectId, activeChapterId)} className="w-full py-4 border-2 border-dashed rounded-2xl text-blue-600 font-bold hover:bg-blue-50">+ Add Video/Note</button>
                            {activeChapter?.videos.map(vid => (
                                <div key={vid.id} className="p-4 bg-white border rounded-2xl flex items-center justify-between shadow-sm">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{vid.title}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{vid.type} • {vid.duration || 'N/A'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingVideo({chapId: activeChapterId, vid})} className="p-2 text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => setSubjects(subjects.map(s => s.id === activeSubjectId ? {
                                            ...s,
                                            chapters: s.chapters.map(c => c.id === activeChapterId ? { ...c, videos: c.videos.filter(v => v.id !== vid.id) } : c)
                                        } : s))} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                            {activeChapter?.videos.length === 0 && <p className="text-center py-10 text-gray-400 italic">No content in this chapter.</p>}
                        </div>
                    ) : activeSubjectId ? (
                        // Chapters List
                        <div className="space-y-3">
                            <button onClick={() => addChapter(activeSubjectId)} className="w-full py-4 border-2 border-dashed rounded-2xl text-blue-600 font-bold hover:bg-blue-50">+ Add Chapter</button>
                            {activeSubject?.chapters.map(chap => (
                                <div key={chap.id} className="p-4 bg-white border rounded-2xl flex items-center justify-between shadow-sm group">
                                    <button onClick={() => setActiveChapterId(chap.id)} className="flex-1 text-left">
                                        <p className="text-sm font-bold text-gray-800">{chap.title}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{chap.videos.length} Units</p>
                                    </button>
                                    <div className="flex gap-2">
                                        <button onClick={() => setSubjects(subjects.map(s => s.id === activeSubjectId ? { ...s, chapters: s.chapters.filter(c => c.id !== chap.id) } : s))} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                            {activeSubject?.chapters.length === 0 && <p className="text-center py-10 text-gray-400 italic">No chapters in this subject.</p>}
                        </div>
                    ) : (
                        // Subjects List
                        <div className="space-y-3">
                            <button onClick={addSubject} className="w-full py-4 border-2 border-dashed rounded-2xl text-blue-600 font-bold hover:bg-blue-50">+ Add Subject (e.g. Maths)</button>
                            {subjects.map(sub => (
                                <div key={sub.id} className="p-4 bg-white border rounded-2xl flex items-center justify-between shadow-sm">
                                    <button onClick={() => setActiveSubjectId(sub.id)} className="flex-1 text-left flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">{sub.iconText}</div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{sub.title}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">{sub.chapters.length} Chapters</p>
                                        </div>
                                    </button>
                                    <div className="flex gap-2">
                                        <button onClick={() => setSubjects(subjects.filter(s => s.id !== sub.id))} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                            {subjects.length === 0 && <p className="text-center py-10 text-gray-400 italic">No subjects added yet.</p>}
                        </div>
                    )}
                </div>
                
                <div className="mt-6 pt-6 border-t flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3.5 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-colors">Discard</button>
                    <button onClick={handleSave} className="flex-1 py-3.5 bg-[#0056d2] text-white font-bold rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition-all">Commit Batch Grid</button>
                </div>
            </div>
        </div>
    );
};

// --- ADMIN PANEL ---

const AdminPanel = () => {
    const { currentUser, courses, settings, addCourse, updateCourse, deleteCourse, updateSettings, users, updateUser } = useStore();
    const [tab, setTab] = useState<'batches' | 'users' | 'settings'>('batches');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Course | null>(null);
    const [contentTarget, setContentTarget] = useState<Course | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [form, setForm] = useState({ title: '', description: '', image: '', category: '', price: 0, mrp: 0, isPaid: false, accessKey: '', shortenerLink: '', telegramLink: '', startDate: '', endDate: '', isNew: true });

    useEffect(() => {
        if (editing) setForm({ ...editing, isPaid: !!editing.isPaid });
        else setForm({ title: '', description: '', image: '', category: '', price: 0, mrp: 0, isPaid: false, accessKey: '', shortenerLink: '', telegramLink: '', startDate: '', endDate: '', isNew: true });
    }, [editing, showModal]);

    if (!currentUser || currentUser.role !== UserRole.ADMIN) return <Navigate to="/" />;

    const handleSaveCourse = (e: React.FormEvent) => {
        e.preventDefault();
        const data = { ...(editing || { id: Date.now().toString(), chapters: [], subjects: [], createdAt: new Date().toISOString() }), ...form };
        if (editing) updateCourse(data); else addCourse(data);
        setShowModal(false);
    };

    const handleGenerateLink = async () => {
        setIsGenerating(true);
        const courseId = editing?.id || 'temp';
        const dest = `${window.location.origin}/#/temp-access/${courseId}`;
        
        try {
            if (!settings.linkShortenerApiKey || !settings.linkShortenerApiUrl) {
                const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(dest)}`);
                if (res.ok) {
                    const text = await res.text();
                    setForm({ ...form, shortenerLink: text });
                    return;
                } else {
                    throw new Error("TinyURL Failed");
                }
            }

            const api = `${settings.linkShortenerApiUrl}?api=${settings.linkShortenerApiKey}&url=${encodeURIComponent(dest)}`;
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(api)}`);
            const json = await res.json();
            const data = JSON.parse(json.contents);
            if (data.shortenedUrl || data.shortlink) {
                setForm({ ...form, shortenerLink: data.shortenedUrl || data.shortlink });
            } else throw new Error();
        } catch {
            setForm({ ...form, shortenerLink: dest });
            alert("Auto-shortener failed. Using direct link.");
        } finally { setIsGenerating(false); }
    };

    const toggleRole = (u: any) => {
        if (u.id === 'admin') return; 
        alert("Role update requires backend implementation in this demo.");
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
                                <button onClick={() => toggleRole(u)} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl transition-colors hover:bg-blue-100">
                                    {u.role === UserRole.ADMIN ? 'DEMOTE' : 'MAKE ADMIN'}
                                </button>
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
                            <button onClick={() => alert("Memory Synced.")} className="w-full py-4 bg-[#0056d2] text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:scale-[1.01] transition-transform mt-4 uppercase tracking-[0.2em] text-xs">SYNC NEURAL GLOBALS</button>
                        </div>
                    </div>
                 )}
             </div>

             {/* Add/Edit Modal */}
             {showModal && (
                 <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-[40px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar border border-gray-100 animate-slide-up">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{editing ? 'Edit Batch' : 'Add New Batch'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X /></button>
                        </div>
                        <form onSubmit={handleSaveCourse} className="space-y-5">
                            {/* Thumbnail Section */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Thumbnail Configuration</label>
                                <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 group flex items-center justify-center">
                                    {form.image ? (
                                        <>
                                            <img src={form.image} className="w-full h-full object-cover" alt="Preview" />
                                            <button type="button" onClick={() => setForm({...form, image: ''})} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black transition-colors"><X className="w-4 h-4" /></button>
                                        </>
                                    ) : (
                                        <div className="text-center p-4">
                                            <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                            <p className="text-[10px] font-bold text-gray-400">Enter Image URL Below</p>
                                        </div>
                                    )}
                                </div>
                                <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-500 font-mono text-xs" placeholder="https://image-link.com/photo.jpg" required />
                            </div>

                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold" placeholder="Batch Name (e.g. Hope Backlog)" required />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs uppercase font-bold" placeholder="Category (Class 10)" required />
                                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-xs font-bold text-gray-400 uppercase">New?</span>
                                    <input type="checkbox" checked={form.isNew} onChange={e => setForm({...form, isNew: e.target.checked})} className="w-5 h-5 accent-blue-600" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Starts On</label>
                                    <input value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs" placeholder="07 Jul 2024" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Ends On</label>
                                    <input value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs" placeholder="31 Mar 2026" />
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between cursor-pointer border border-gray-100" onClick={() => setForm({ ...form, isPaid: !form.isPaid })}>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Premium Batch</span>
                                <div className={`w-10 h-5 rounded-full relative transition-all ${form.isPaid ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.isPaid ? 'left-5.5' : 'left-0.5'}`} />
                                </div>
                            </div>

                            {form.isPaid && (
                                <div className="space-y-3 animate-fade-in">
                                    <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl font-bold" placeholder="Selling Price (₹)" />
                                    <input value={form.accessKey} onChange={e => setForm({ ...form, accessKey: e.target.value })} className="w-full p-4 bg-blue-50 border-2 border-blue-100 rounded-xl font-mono text-center tracking-widest" placeholder="KEY_2025" />
                                </div>
                            )}

                            <div className="pt-4 flex flex-col gap-3">
                                <button type="submit" className="w-full py-4 bg-[#0056d2] text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-sm">Save Batch</button>
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
    const [filter, setFilter] = useState<'Paid' | 'Free'>('Free');

    const filteredCourses = courses.filter(c => filter === 'Paid' ? c.isPaid : !c.isPaid);

    return (
        <div className="pb-24 pt-20 px-5 min-h-screen bg-[#f8fafc]">
            <div className="max-w-md mx-auto space-y-6">
                {/* Segmented Control */}
                <div className="bg-white p-1 rounded-2xl border border-gray-100 flex shadow-sm">
                    {['Paid', 'Free'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilter(t as any)}
                            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === t ? 'bg-blue-50 text-[#0056d2] shadow-sm' : 'text-gray-400'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Course List */}
                <div className="space-y-6">
                    {filteredCourses.map(c => (
                        <div key={c.id} className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm flex flex-col">
                            <div className="p-6 pb-2 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-black text-gray-800">{c.title}</h3>
                                    {c.isNew && (
                                        <span className="bg-[#fff9e6] text-[#eab308] text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter border border-yellow-200">New</span>
                                    )}
                                </div>
                                <button className="p-1.5 hover:bg-gray-50 rounded-full">
                                    <Smartphone className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="px-6 relative group">
                                <img src={c.image} className="w-full aspect-[16/9] object-cover rounded-2xl" />
                                {!c.isPaid && (
                                    <div className="absolute top-4 left-10 bg-white/95 px-3 py-1 rounded-lg text-[10px] font-black text-gray-800 shadow-md">FREE</div>
                                )}
                            </div>

                            <div className="p-6 pt-4 space-y-5">
                                <div className="flex items-center gap-4 text-[11px] font-bold text-gray-400">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Starts on <span className="text-gray-600">{c.startDate || 'TBA'}</span></span>
                                    </div>
                                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                    <div className="flex items-center gap-1.5">
                                        <span>Ends on <span className="text-gray-600">{c.endDate || 'TBA'}</span></span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button className="flex-1 py-3 text-sm font-bold text-[#7c5cdb] border border-[#7c5cdb]/20 rounded-xl hover:bg-[#7c5cdb]/5 transition-all">Similar Batches</button>
                                    <Link to={`/course/${c.id}`} className="flex-1 py-3 bg-[#7c5cdb] text-white text-center text-sm font-bold rounded-xl shadow-lg shadow-[#7c5cdb]/20 active:scale-95 transition-all">Let's Study</Link>
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
    const { id } = useParams();
    const { courses, currentUser } = useStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'Description' | 'Subjects' | 'Resources' | 'Tests' | 'Community'>('Subjects');

    const course = courses.find(c => c.id === id);
    if (!course) return <Navigate to="/" />;

    return (
        <div className="pb-24 pt-0 min-h-screen bg-white">
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex items-center justify-between p-4 px-5">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)}><ArrowLeft className="w-6 h-6 text-gray-800" /></button>
                        <h1 className="text-lg font-extrabold text-gray-800 truncate max-w-[160px]">{course.title}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <XPBadge />
                        <MessageCircle className="w-5.5 h-5.5 text-gray-600" />
                        <Bell className="w-5.5 h-5.5 text-gray-600" />
                        <MoreVertical className="w-5.5 h-5.5 text-gray-600" />
                    </div>
                </div>
                
                <div className="flex px-5 gap-8 overflow-x-auto no-scrollbar">
                    {['Description', 'Subjects', 'Resources', 'Tests', 'Community'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-3 text-sm font-bold whitespace-nowrap transition-all border-b-3 ${activeTab === tab ? 'text-[#7c5cdb] border-[#7c5cdb]' : 'text-gray-400 border-transparent'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <Banner />

            <div className="p-5">
                {activeTab === 'Subjects' && (
                    <div className="space-y-4">
                        {(course.subjects || []).map((sub) => (
                            <div key={sub.id} onClick={() => navigate(`/course/${course.id}/subject/${sub.id}`)} className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-5 shadow-sm active:scale-[0.98] transition-all">
                                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0056d2] font-black text-lg border border-blue-100">
                                    {sub.iconText}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-extrabold text-gray-800 text-base">{sub.title}</h3>
                                    <div className="flex items-center gap-4 mt-2.5">
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#0056d2] w-[0%]"></div>
                                        </div>
                                        <span className="text-[11px] font-black text-gray-400">0%</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'Community' && <CommunityView />}

                {activeTab === 'Description' && (
                    <div className="space-y-6 animate-fade-in">
                        <img src={course.image} className="w-full h-52 object-cover rounded-[40px] shadow-lg" />
                        <div>
                            <h2 className="text-2xl font-black text-gray-800 mb-3">{course.title}</h2>
                            <p className="text-gray-500 text-sm leading-relaxed font-medium">{course.description}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const CommunityView = () => {
  const [tab, setTab] = useState<'All Posts' | 'My Posts'>('All Posts');
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex gap-6 border-b border-gray-100">
        {['All Posts', 'My Posts'].map(t => (
          <button 
            key={t}
            onClick={() => setTab(t as any)}
            className={`pb-2 text-xs font-bold transition-all border-b-2 ${tab === t ? 'text-[#7c5cdb] border-[#7c5cdb]' : 'text-gray-400 border-transparent'}`}
          >
            {t}
          </button>
        ))}
      </div>
      
      {/* Sample Post */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Prakash</p>
              <p className="text-[10px] text-gray-400 font-medium">4 Min Ago</p>
            </div>
          </div>
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-sm text-gray-600">Hlo 👋</p>
        <div className="flex gap-6 pt-2 border-t border-gray-50">
          <button className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold">
            <Sparkles className="w-4 h-4" /> React
          </button>
          <button className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold">
            <MessageSquare className="w-4 h-4" /> Comments(0)
          </button>
        </div>
      </div>
    </div>
  )
}

const SubjectDetail = () => {
    const { courseId, subjectId } = useParams();
    const { courses } = useStore();
    const navigate = useNavigate();
    const [tab, setTab] = useState<'Chapters' | 'Notes'>('Chapters');
    const [filter, setFilter] = useState('All');
    const [generatingNotes, setGeneratingNotes] = useState(false);
    const [notes, setNotes] = useState<string | null>(null);
    
    const course = courses.find(c => c.id === courseId);
    const subject = course?.subjects?.find(s => s.id === subjectId);
    if (!subject) return <Navigate to="/" />;

    const filters = ['All', 'Lectures', 'DPPs', 'Notes', 'DPP PDFs', 'DPP Videos'];

    const handleGenerateNotes = async () => {
        setGeneratingNotes(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Generate concise, high-yield study notes for the subject "${subject.title}" based on these chapter titles: ${subject.chapters.map(c => c.title).join(', ')}. Format nicely with Markdown.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });
            
            setNotes(response.text || "Could not generate notes.");
        } catch (e) {
            alert("Failed to generate notes. Please try again.");
        } finally {
            setGeneratingNotes(false);
        }
    };

    return (
        <div className="pb-24 pt-0 min-h-screen bg-white">
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
                <div className="flex items-center justify-between p-4 px-5">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)}><ArrowLeft className="w-6 h-6 text-gray-800" /></button>
                        <h1 className="text-lg font-extrabold text-gray-800">{subject.title}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleGenerateNotes} disabled={generatingNotes} className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors">
                            {generatingNotes ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        </button>
                        <XPBadge />
                    </div>
                </div>
                <div className="flex px-5 gap-8">
                    {['Chapters', 'Study Material'].map(t => (
                        <button key={t} onClick={() => setTab(t === 'Chapters' ? 'Chapters' : 'Notes')} className={`pb-3 text-sm font-bold border-b-3 transition-all ${tab === (t === 'Chapters' ? 'Chapters' : 'Notes') ? 'text-[#7c5cdb] border-[#7c5cdb]' : 'text-gray-400 border-transparent'}`}>{t}</button>
                    ))}
                </div>
            </div>

            {tab === 'Chapters' && (
                <div className="p-5 space-y-4">
                    {subject.chapters.map((chap, idx) => (
                        <div key={chap.id} onClick={() => setTab('Notes')} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all">
                            <div>
                                <span className="inline-block bg-blue-50 text-[#0056d2] text-[10px] font-bold px-2.5 py-1 rounded-lg mb-2.5 border border-blue-100 uppercase">CH - {String(idx+1).padStart(2, '0')}</span>
                                <h3 className="font-extrabold text-gray-800 text-base mb-1.5 leading-tight">{chap.title}</h3>
                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Lectures : 0/{chap.videos.length}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300" />
                        </div>
                    ))}
                </div>
            )}

            {tab === 'Notes' && (
                <div className="space-y-6">
                    <div className="bg-blue-50 px-5 py-4 flex items-start gap-3">
                        <div className="w-5 h-5 bg-[#0056d2] rounded-full flex items-center justify-center text-white text-[10px] font-bold mt-0.5">i</div>
                        <div className="flex-1">
                          <p className="text-[11px] font-bold text-gray-700 leading-tight">Don't worry if there's a small error, missing XP points will be added soon!</p>
                        </div>
                        <X className="w-4 h-4 text-gray-400" />
                    </div>

                    <div className="px-5 flex gap-3 overflow-x-auto no-scrollbar">
                        {filters.map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-5 py-2 rounded-full text-xs font-bold transition-all border ${filter === f ? 'bg-[#444] text-white border-[#444]' : 'bg-gray-100 text-gray-500 border-gray-100'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="px-5 space-y-4 pb-10">
                        {subject.chapters.flatMap(c => c.videos).map(v => (
                            v.type === 'lecture' ? (
                                <div key={v.id} className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex gap-4">
                                    <div className="relative w-32 aspect-[4/3] rounded-xl overflow-hidden shrink-0">
                                        <img src="https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" />
                                        <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">{v.duration}</div>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">LECTURE • {v.date}</p>
                                            <h4 className="text-xs font-extrabold text-gray-800 line-clamp-2 leading-snug">{v.title}</h4>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => navigate(`/watch/${courseId}?sub=${subjectId}&chap=${subject.chapters[0].id}`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f3f7ff] text-[#0056d2] rounded-lg text-[10px] font-black hover:bg-blue-100 transition-all">
                                                <PlayCircle className="w-3.5 h-3.5 text-white" fill="currentColor" /> Watch Lecture
                                            </button>
                                            <button className="p-2 bg-gray-50 text-gray-400 rounded-lg"><FileText className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div key={v.id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-5">
                                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shrink-0">
                                        <FileText className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">NOTES • {v.date}</p>
                                        <h4 className="text-xs font-extrabold text-gray-800 line-clamp-2 leading-snug">{v.title}</h4>
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f3f7ff] text-[#0056d2] rounded-lg text-[10px] font-black w-fit">
                                            <Eye className="w-3.5 h-3.5" /> View Note
                                        </button>
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            )}
            {/* AI Notes Modal */}
            {notes && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setNotes(null)}>
                    <div className="bg-white w-full max-w-lg max-h-[80vh] rounded-[30px] p-8 overflow-y-auto shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-blue-500" /> AI Notes</h2>
                            <button onClick={() => setNotes(null)}><X className="text-gray-400" /></button>
                        </div>
                        <div className="prose prose-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                            {notes}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- AUTH & OTHER ---

const Profile = () => {
    const { currentUser, logout } = useStore();
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
    const { login, signup, currentUser } = useStore();
    const navigate = useNavigate();
    const [isS, setIsS] = useState(false);
    const [f, setF] = useState({ name: '', email: '', pass: '' });

    useEffect(() => { if (currentUser) navigate('/'); }, [currentUser, navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#7c5cdb] relative overflow-hidden">
            <div className="text-center mb-12 relative z-10">
              <div className="w-20 h-20 bg-white rounded-[28px] flex items-center justify-center mx-auto mb-4 text-[#7c5cdb] text-3xl font-black shadow-2xl">S</div>
              <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">Study Tool Hub</h1>
            </div>
            <div className="bg-white p-10 rounded-[50px] w-full max-w-md shadow-2xl animate-fade-in relative z-10">
                <h2 className="text-3xl font-black text-gray-800 mb-8 text-center italic uppercase tracking-tighter">Identity Sync</h2>
                <form onSubmit={e => { e.preventDefault(); if(isS) signup(f.name, f.email, '', f.pass); else login(f.email, f.pass); }} className="space-y-4">
                    {isS && <input className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-blue-100" placeholder="Full Identity" value={f.name} onChange={e => setF({...f, name: e.target.value})} required />}
                    <input className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-blue-100" placeholder="Email/Terminal" value={f.email} onChange={e => setF({...f, email: e.target.value})} required />
                    <input className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-blue-100" type="password" placeholder="Pass-Sequence" value={f.pass} onChange={e => setF({...f, pass: e.target.value})} required />
                    <button className="w-full py-6 bg-[#7c5cdb] text-white font-black rounded-3xl shadow-xl shadow-blue-100 uppercase tracking-widest text-lg active:scale-95 transition-all mt-6">Initialize</button>
                </form>
                <button onClick={() => setIsS(!isS)} className="w-full mt-10 text-[10px] text-[#7c5cdb] font-black uppercase tracking-[0.4em] text-center">{isS ? '< Revert to Login' : 'Construct New Node >'}</button>
            </div>
        </div>
    );
};

const MainContent = () => {
  const loc = useLocation();
  const isWatch = loc.pathname.startsWith('/watch') || loc.pathname.startsWith('/exam') || loc.pathname === '/login' || loc.pathname.startsWith('/temp-access');
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {!isWatch && <STHeader />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<CourseListing />} />
        <Route path="/courses" element={<CourseListing />} />
        <Route path="/my-courses" element={<CourseListing />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/course/:courseId/subject/:subjectId" element={<SubjectDetail />} />
        <Route path="/exam/:id" element={<ExamMode />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminPanel />} />
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
