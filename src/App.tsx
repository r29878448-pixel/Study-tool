
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { 
  Home, BookOpen, User, Search, PlayCircle, Lock, 
  LayoutDashboard, Settings, Plus, Trash2, Edit, X, 
  CheckCircle, ExternalLink, Play, Bot, Brain, Loader2, ArrowLeft, 
  Video as VideoIcon, Sparkles, Send, Smartphone, List, Globe, Bell, 
  ChevronRight, MoreVertical, MessageCircle, FileText, Calendar, MessageSquare, Eye,
  RotateCcw, ImageIcon, Upload, LinkIcon, Folder, FileVideo, Download
} from './components/Icons';
import VideoPlayer from './components/VideoPlayer';
import ChatBot from './components/ChatBot';
import ExamMode from './components/ExamMode';
import { GoogleGenAI } from "@google/genai";
import { Course, Chapter, Video, UserRole, Subject, GeneratedNote } from './types';

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
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-50 pb-safe shadow-sm">
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

// --- TEMP ACCESS HANDLER ---

const TempAccessHandler = () => {
    const { id } = useParams<{id: string}>();
    const { currentUser, grantTempAccess } = useStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!id) {
            navigate('/');
            return;
        }

        // If not logged in, redirect to login but save where they wanted to go
        if (!currentUser) {
            navigate('/login', { state: { from: location } });
            return;
        }

        // Simulate verification delay for UX
        const timer = setTimeout(() => {
            grantTempAccess(id);
            alert("✅ Verification Successful! 24-Hour Access Granted.");
            navigate(`/course/${id}`);
        }, 1500);

        return () => clearTimeout(timer);
    }, [id, currentUser, navigate, grantTempAccess, location]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-sm w-full">
                <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto mb-6" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Link...</h2>
                <p className="text-gray-500 text-sm">Please wait while we validate your access token.</p>
            </div>
        </div>
    );
};

// --- CONTENT MANAGEMENT SYSTEM ---

const ContentManager = ({ course, onClose }: { course: Course, onClose: () => void }) => {
    const { updateCourse } = useStore();
    const [subjects, setSubjects] = useState<Subject[]>(course.subjects || []);
    const [view, setView] = useState<'SUBJECTS' | 'CHAPTERS' | 'VIDEOS'>('SUBJECTS');
    const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        title: '', iconText: '', filename: '', duration: '', type: 'lecture', thumbnail: ''
    });

    // Auto-fetch thumbnail logic
    useEffect(() => {
        if (formData.filename && !formData.thumbnail) {
            const ytMatch = formData.filename.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/);
            if (ytMatch && ytMatch[7]?.length === 11) {
                setFormData(prev => ({ ...prev, thumbnail: `https://img.youtube.com/vi/${ytMatch[7]}/maxresdefault.jpg` }));
            }
        }
    }, [formData.filename]);

    const navigateToChapters = (sId: string) => { setActiveSubjectId(sId); setView('CHAPTERS'); };
    const navigateToVideos = (cId: string) => { setActiveChapterId(cId); setView('VIDEOS'); };
    const navigateUp = () => {
        if (view === 'VIDEOS') { setView('CHAPTERS'); setActiveChapterId(null); }
        else if (view === 'CHAPTERS') { setView('SUBJECTS'); setActiveSubjectId(null); }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith('video/') || file.type === 'application/pdf') {
                const objectUrl = URL.createObjectURL(file);
                setFormData(prev => ({ 
                    ...prev, 
                    filename: objectUrl,
                    duration: 'Local File',
                    type: file.type === 'application/pdf' ? 'dpp' : 'lecture'
                }));
            } else {
                const reader = new FileReader();
                reader.onloadend = () => setFormData(prev => ({ ...prev, thumbnail: reader.result as string }));
                reader.readAsDataURL(file);
            }
        }
    };

    const openAddForm = () => {
        setEditingItem(null);
        setFormData({ title: '', iconText: '', filename: '', duration: '', type: 'lecture', thumbnail: '' });
        setIsFormOpen(true);
    };

    const openEditForm = (item: any) => {
        setEditingItem(item);
        setFormData({
            title: item.title || '',
            iconText: item.iconText || '',
            filename: item.filename || '',
            duration: item.duration || '',
            type: item.type || 'lecture',
            thumbnail: item.thumbnail || ''
        });
        setIsFormOpen(true);
    };

    const handleDelete = (itemId: string) => {
        if (!confirm('Delete this item?')) return;
        let newSubjects = [...subjects];
        if (view === 'SUBJECTS') newSubjects = newSubjects.filter(s => s.id !== itemId);
        else if (view === 'CHAPTERS' && activeSubjectId) {
            newSubjects = newSubjects.map(s => s.id === activeSubjectId ? { ...s, chapters: s.chapters.filter(c => c.id !== itemId) } : s);
        } else if (view === 'VIDEOS' && activeSubjectId && activeChapterId) {
            newSubjects = newSubjects.map(s => s.id === activeSubjectId ? {
                ...s, chapters: s.chapters.map(c => c.id === activeChapterId ? { ...c, videos: c.videos.filter(v => v.id !== itemId) } : c)
            } : s);
        }
        setSubjects(newSubjects);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let newSubjects = [...subjects];
        const now = Date.now().toString();

        if (view === 'SUBJECTS') {
            const newItem: Subject = {
                id: editingItem ? editingItem.id : `sub-${now}`,
                title: formData.title,
                iconText: formData.iconText || formData.title.substring(0, 2).toUpperCase(),
                chapters: editingItem ? editingItem.chapters : []
            };
            if (editingItem) newSubjects = newSubjects.map(s => s.id === newItem.id ? newItem : s);
            else newSubjects.push(newItem);
        } else if (view === 'CHAPTERS' && activeSubjectId) {
            newSubjects = newSubjects.map(s => {
                if (s.id !== activeSubjectId) return s;
                const newItem: Chapter = {
                    id: editingItem ? editingItem.id : `ch-${now}`,
                    title: formData.title,
                    videos: editingItem ? editingItem.videos : []
                };
                return { ...s, chapters: editingItem ? s.chapters.map(c => c.id === newItem.id ? newItem : c) : [...s.chapters, newItem] };
            });
        } else if (view === 'VIDEOS' && activeSubjectId && activeChapterId) {
            newSubjects = newSubjects.map(s => {
                if (s.id !== activeSubjectId) return s;
                return {
                    ...s, chapters: s.chapters.map(c => {
                        if (c.id !== activeChapterId) return c;
                        const newItem: Video = {
                            id: editingItem ? editingItem.id : `vid-${now}`,
                            title: formData.title,
                            filename: formData.filename,
                            duration: formData.duration || '10:00',
                            type: formData.type as any,
                            date: new Date().toLocaleDateString(),
                            thumbnail: formData.thumbnail
                        };
                        return { ...c, videos: editingItem ? c.videos.map(v => v.id === newItem.id ? newItem : v) : [...c.videos, newItem] };
                    })
                };
            });
        }
        setSubjects(newSubjects);
        setIsFormOpen(false);
    };

    const saveChanges = () => {
        updateCourse({ ...course, subjects });
        onClose();
    };

    const activeSubject = subjects.find(s => s.id === activeSubjectId);
    const activeChapter = activeSubject?.chapters?.find(c => c.id === activeChapterId);

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl h-[85vh] rounded-3xl p-6 flex flex-col shadow-2xl animate-slide-up overflow-hidden">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                          <Settings className="text-blue-600 w-6 h-6" /> Content Manager
                        </h2>
                        <div className="flex items-center gap-1 text-xs text-gray-500 font-bold mt-1">
                            <button onClick={() => { setView('SUBJECTS'); setActiveSubjectId(null); setActiveChapterId(null); }} className={view === 'SUBJECTS' ? 'text-blue-600' : 'hover:text-blue-600'}>Subjects</button>
                            {activeSubject && <><ChevronRight className="w-3 h-3" /><button onClick={() => { setView('CHAPTERS'); setActiveChapterId(null); }} className={view === 'CHAPTERS' ? 'text-blue-600' : 'hover:text-blue-600'}>{activeSubject.title}</button></>}
                            {activeChapter && <><ChevronRight className="w-3 h-3" /><span className="text-blue-600">{activeChapter.title}</span></>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X /></button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
                    {isFormOpen ? (
                        <form onSubmit={handleFormSubmit} className="bg-gray-50 p-6 rounded-2xl animate-fade-in space-y-4 border border-gray-100">
                            <h3 className="font-bold text-gray-700 border-b pb-2">{editingItem ? 'Edit' : 'Add'} Item</h3>
                            <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Title</label><input className="w-full p-3 border rounded-xl bg-white" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required /></div>
                            
                            {view === 'SUBJECTS' && (
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Icon (2 chars)</label><input className="w-full p-3 border rounded-xl bg-white" value={formData.iconText} onChange={e => setFormData({...formData, iconText: e.target.value})} maxLength={2} /></div>
                            )}

                            {view === 'VIDEOS' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Content Source</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input className="w-full p-3 pl-10 border rounded-xl bg-white" value={formData.filename} onChange={e => setFormData({...formData, filename: e.target.value})} placeholder="YouTube URL" required />
                                                <LinkIcon className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                                            </div>
                                            <label className="flex items-center gap-2 px-4 py-3 bg-white border rounded-xl cursor-pointer hover:bg-gray-100">
                                                <Upload className="w-4 h-4 text-gray-600" />
                                                <input type="file" className="hidden" accept="video/*,application/pdf" onChange={handleFileUpload} />
                                            </label>
                                        </div>
                                        {formData.filename.startsWith('blob:') && <p className="text-xs text-orange-500 font-bold mt-1">⚠️ Local File Attached</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Duration</label><input className="w-full p-3 border rounded-xl bg-white" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} /></div>
                                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Type</label><select className="w-full p-3 border rounded-xl bg-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="lecture">Video Lecture</option><option value="note">PDF Note</option><option value="dpp">DPP / Quiz</option></select></div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Thumbnail</label>
                                        <div className="flex gap-2">
                                            <input value={formData.thumbnail} onChange={e => setFormData({...formData, thumbnail: e.target.value})} className="flex-1 p-3 border rounded-xl bg-white text-xs" placeholder="Image URL or Upload" />
                                            <label className="p-3 bg-white border rounded-xl cursor-pointer hover:bg-gray-100">
                                                <ImageIcon className="w-5 h-5 text-gray-600" />
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if(file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => setFormData(prev => ({ ...prev, thumbnail: reader.result as string }));
                                                        reader.readAsDataURL(file);
                                                    }
                                                }} />
                                            </label>
                                        </div>
                                        {formData.thumbnail && <img src={formData.thumbnail} className="mt-2 w-24 h-14 object-cover rounded-lg border" alt="Preview" />}
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3 text-gray-600 bg-gray-200 font-bold rounded-xl hover:bg-gray-300">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-[#0056d2] text-white font-bold rounded-xl hover:bg-blue-700">Save</button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            <button onClick={openAddForm} className="w-full py-4 border-2 border-dashed border-blue-200 rounded-2xl text-blue-600 font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Add New Item</button>
                            
                            {view === 'SUBJECTS' && subjects.map(sub => (
                                <div key={sub.id} onClick={() => navigateToChapters(sub.id)} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center cursor-pointer hover:border-blue-500 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm">{sub.iconText}</div>
                                        <div><h4 className="font-bold text-gray-800">{sub.title}</h4><p className="text-xs text-gray-500">{sub.chapters.length} Chapters</p></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); openEditForm(sub); }} className="p-2 text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(sub.id); }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}

                            {view === 'CHAPTERS' && activeSubject?.chapters.map(chap => (
                                <div key={chap.id} onClick={() => navigateToVideos(chap.id)} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center cursor-pointer hover:border-blue-500 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center"><Folder className="w-5 h-5" /></div>
                                        <div><h4 className="font-bold text-gray-800">{chap.title}</h4><p className="text-xs text-gray-500">{chap.videos.length} Videos</p></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); openEditForm(chap); }} className="p-2 text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(chap.id); }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}

                            {view === 'VIDEOS' && activeChapter?.videos.map(vid => (
                                <div key={vid.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center hover:border-blue-500 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        {vid.thumbnail ? <img src={vid.thumbnail} className="w-10 h-10 object-cover rounded-lg" alt="" /> : <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center"><FileVideo className="w-5 h-5" /></div>}
                                        <div className="overflow-hidden">
                                            <h4 className="font-bold text-gray-800 text-sm truncate">{vid.title}</h4>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">{vid.type} • {vid.duration}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEditForm(vid)} className="p-2 text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(vid.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="mt-6 pt-6 border-t flex gap-3">
                    {view !== 'SUBJECTS' && !isFormOpen && <button onClick={navigateUp} className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Back</button>}
                    {!isFormOpen && <button onClick={saveChanges} className="flex-1 py-3 bg-[#0056d2] text-white font-bold rounded-xl shadow-lg hover:bg-blue-700">Save Changes</button>}
                </div>
            </div>
        </div>
    );
};

// --- ADMIN PANEL ---

const AdminPanel = () => {
    const { currentUser, courses, settings, addCourse, updateCourse, deleteCourse, users } = useStore();
    const [tab, setTab] = useState<'batches' | 'users' | 'settings'>('batches');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Course | null>(null);
    const [contentTarget, setContentTarget] = useState<Course | null>(null);
    
    const [form, setForm] = useState({ 
      title: '', description: '', image: '', category: '', 
      price: 0, mrp: 0, isPaid: false, accessKey: '', 
      shortenerLink: '', telegramLink: '', startDate: '', 
      endDate: '', isNew: true 
    });

    useEffect(() => {
        if (editing) {
          setForm({ 
            title: editing.title,
            description: editing.description,
            image: editing.image,
            category: editing.category,
            price: editing.price,
            mrp: editing.mrp,
            isPaid: !!editing.isPaid,
            accessKey: editing.accessKey || '',
            shortenerLink: editing.shortenerLink || '',
            telegramLink: editing.telegramLink || '',
            startDate: editing.startDate || '',
            endDate: editing.endDate || '',
            isNew: editing.isNew ?? true
          });
        }
        else setForm({ title: '', description: '', image: '', category: '', price: 0, mrp: 0, isPaid: false, accessKey: '', shortenerLink: '', telegramLink: '', startDate: '', endDate: '', isNew: true });
    }, [editing, showModal]);

    if (!currentUser || currentUser.role !== UserRole.ADMIN) return <Navigate to="/" />;

    const handleSaveCourse = (e: React.FormEvent) => {
        e.preventDefault();
        const data: Course = { 
          ...(editing || { id: Date.now().toString(), subjects: [], createdAt: new Date().toISOString() }), 
          ...form 
        };
        if (editing) updateCourse(data); else addCourse(data);
        setShowModal(false);
    };

    return (
        <div className="pb-24 pt-20 px-4 min-h-screen bg-[#f8fafc]">
             <div className="max-w-4xl mx-auto">
                 <div className="flex bg-white p-1.5 rounded-[24px] shadow-sm border border-gray-100 mb-8 overflow-hidden">
                    {(['batches', 'users', 'settings'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 font-bold capitalize transition-all rounded-[18px] text-sm ${tab === t ? 'bg-[#0056d2] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>
                            {t}
                        </button>
                    ))}
                 </div>

                 {tab === 'batches' && (
                     <div className="space-y-4">
                         <button onClick={() => { setEditing(null); setShowModal(true); }} className="w-full py-10 bg-white border-2 border-dashed border-blue-200 rounded-[32px] text-[#0056d2] font-bold flex flex-col items-center justify-center gap-2 hover:bg-blue-50 transition-all">
                            <Plus className="w-8 h-8" />
                            <span>INITIALIZE NEW BATCH</span>
                         </button>
                         <div className="grid gap-3">
                             {courses.map(c => (
                                 <div key={c.id} className="bg-white p-4 rounded-[28px] flex items-center gap-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                     <img src={c.image} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                                     <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 text-sm truncate">{c.title}</h3>
                                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{c.category} • {c.isPaid ? 'Paid' : 'Free'}</p>
                                     </div>
                                     <div className="flex gap-2">
                                         <button onClick={() => setContentTarget(c)} className="px-4 py-2 bg-[#0056d2] text-white rounded-xl font-bold text-[10px] active:scale-95 transition-all">CONTENT</button>
                                         <button onClick={() => { setEditing(c); setShowModal(true); }} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>
                                         <button onClick={() => { if(confirm('Delete batch sequence?')) deleteCourse(c.id); }} className="p-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                {tab === 'users' && (
                    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
                      <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Global User Registry</div>
                      <div className="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto no-scrollbar">
                      {users.map(u => (
                          <div key={u.id} className="p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                              <div>
                                  <p className="font-bold text-gray-800">{u.name}</p>
                                  <p className="text-[11px] text-gray-400">{u.email}</p>
                              </div>
                              <span className="text-[10px] font-bold px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100">{u.role}</span>
                          </div>
                      ))}
                      </div>
                    </div>
                )}
             </div>

             {showModal && (
                 <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-[40px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar border border-gray-100 animate-slide-up">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{editing ? 'Edit Batch Configuration' : 'Initialize New Batch Node'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X /></button>
                        </div>
                        <form onSubmit={handleSaveCourse} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Identity Thumbnail</label>
                                <div className="relative aspect-video rounded-3xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center group shadow-inner">
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
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inject Thumbnail URL Below</p>
                                        </div>
                                    )}
                                </div>
                                <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-mono text-[10px] shadow-sm" placeholder="https://domain.com/thumbnail.jpg" />
                            </div>

                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold shadow-sm" placeholder="Course Title" required />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs uppercase font-bold shadow-sm" placeholder="Category" required />
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm cursor-pointer" onClick={() => setForm({...form, isNew: !form.isNew})}>
                                    <span className="text-xs font-bold text-gray-400 uppercase">New Badge</span>
                                    <div className={`w-10 h-5 rounded-full relative transition-all ${form.isNew ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.isNew ? 'left-5.5' : 'left-0.5'}`} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Node Active</label>
                                    <input value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs shadow-sm" placeholder="Start Date" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Node Expiry</label>
                                    <input value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs shadow-sm" placeholder="End Date" />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="w-full py-5 bg-[#0056d2] text-white font-black rounded-3xl shadow-xl shadow-blue-100 active:scale-95 transition-all uppercase tracking-[0.2em] text-sm">Commit Sequence</button>
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
                <div className="bg-white p-1 rounded-3xl border border-gray-100 flex shadow-sm">
                    {(['Paid', 'Free'] as const).map((t) => (
                        <button key={t} onClick={() => setFilter(t)} className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${filter === t ? 'bg-blue-50 text-[#0056d2] shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>
                            {t}
                        </button>
                    ))}
                </div>

                <div className="space-y-8">
                    {filteredCourses.length === 0 ? (
                        <div className="text-center py-20 animate-fade-in">
                            <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No active nodes in this sector</p>
                        </div>
                    ) : filteredCourses.map(c => (
                        <div key={c.id} className="bg-white rounded-[40px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 animate-slide-up">
                            <div className="p-7 flex justify-between items-center">
                                <div className="flex items-center gap-2.5">
                                    <h3 className="text-lg font-black text-gray-800 tracking-tight">{c.title}</h3>
                                    {c.isNew && <span className="bg-[#fff9e6] text-[#eab308] text-[9px] font-black px-2.5 py-1 rounded-lg border border-yellow-200 uppercase tracking-tighter shadow-sm">New</span>}
                                </div>
                            </div>
                            <div className="px-7 relative group">
                                <img src={c.image} className="w-full aspect-[16/9] object-cover rounded-[30px] group-hover:scale-[1.02] transition-transform duration-700" alt={c.title} />
                                {!c.isPaid && <div className="absolute top-4 left-11 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-[10px] font-black text-gray-800 shadow-xl ring-1 ring-black/5 uppercase tracking-widest">Free Node</div>}
                            </div>
                            <div className="p-7 pt-5 space-y-6">
                                <div className="flex items-center gap-5 text-[11px] font-bold text-gray-400">
                                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-brand/50" /><span>Starts {c.startDate}</span></div>
                                    <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
                                    <div className="flex items-center gap-2"><span>Ends {c.endDate}</span></div>
                                </div>
                                <div className="flex gap-4">
                                    <button className="flex-1 py-4 text-sm font-black text-[#7c5cdb] border-2 border-[#7c5cdb]/10 rounded-2xl hover:bg-[#7c5cdb]/5 transition-all uppercase tracking-widest">Archive</button>
                                    <Link to={`/course/${c.id}`} className="flex-[1.5] py-4 bg-[#7c5cdb] text-white text-center text-sm font-black rounded-2xl shadow-xl shadow-[#7c5cdb]/20 active:scale-95 transition-all uppercase tracking-widest">Let's Study</Link>
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
    const { courses } = useStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'Description' | 'Subjects' | 'Resources' | 'Tests' | 'Community'>('Subjects');

    const course = courses.find(c => c.id === id);
    if (!course) return <Navigate to="/" />;

    return (
        <div className="pb-24 pt-0 min-h-screen bg-white">
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex items-center justify-between p-4 px-6">
                    <div className="flex items-center gap-5">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-gray-800" /></button>
                        <h1 className="text-xl font-black text-gray-800 truncate max-w-[180px] tracking-tight">{course.title}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <XPBadge />
                        <Bell className="w-6 h-6 text-gray-600" />
                        <MoreVertical className="w-6 h-6 text-gray-600" />
                    </div>
                </div>
                
                <div className="flex px-6 gap-8 overflow-x-auto no-scrollbar">
                    {(['Description', 'Subjects', 'Resources', 'Tests', 'Community'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-black whitespace-nowrap transition-all border-b-4 ${activeTab === tab ? 'text-brand border-brand' : 'text-gray-400 border-transparent'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
            <Banner />
            <div className="p-6">
                {activeTab === 'Subjects' && (
                    <div className="space-y-5">
                        {(course.subjects || []).map((sub) => (
                            <div key={sub.id} onClick={() => navigate(`/course/${course.id}/subject/${sub.id}`)} className="bg-white border border-gray-100 rounded-[35px] p-6 flex items-center gap-6 shadow-sm active:scale-[0.98] transition-all hover:border-brand/30 hover:shadow-md cursor-pointer">
                                <div className="w-16 h-16 bg-brand/5 rounded-2xl flex items-center justify-center text-brand font-black text-xl border border-brand/10 shadow-inner">{sub.iconText}</div>
                                <div className="flex-1">
                                    <h3 className="font-black text-gray-800 text-lg leading-tight mb-2">{sub.title}</h3>
                                    <div className="flex items-center gap-5 mt-3">
                                        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-brand w-[0%]"></div></div>
                                        <span className="text-[12px] font-black text-gray-400">0%</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-6 h-6 text-gray-300" />
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'Description' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="relative group">
                             <img src={course.image} className="w-full h-56 object-cover rounded-[50px] shadow-2xl" alt="" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-[50px]"></div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-800 mb-4 tracking-tight">{course.title}</h2>
                            <p className="text-gray-500 text-base leading-relaxed font-medium">{course.description}</p>
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
    const [tab, setTab] = useState<'Chapters' | 'Notes'>('Chapters');
    const [filter, setFilter] = useState('All');
    const [generatingNotes, setGeneratingNotes] = useState(false);
    const [notes, setNotes] = useState<string | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    
    const course = courses.find(c => c.id === courseId);
    const subject = course?.subjects.find(s => s.id === subjectId);
    if (!subject || !courseId) return <Navigate to="/" />;

    const handleGenerateNotes = async () => {
        setGeneratingNotes(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Generate highly concise educational summary for "${subject.title}" based on these chapter topics: ${subject.chapters.map(c => c.title).join(', ')}. Include 5 Daily Practice Problems (DPP) at the end. Use professional teaching tone.`;
            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            setNotes(response.text || "Neural downlink failure. Could not synthesize data.");
        } catch (e) { alert("AI sync failed. Check terminal."); } finally { setGeneratingNotes(false); }
    };

    return (
        <div className="pb-24 pt-0 min-h-screen bg-white">
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex items-center justify-between p-4 px-6">
                    <div className="flex items-center gap-5">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-gray-800" /></button>
                        <h1 className="text-xl font-black text-gray-800 tracking-tight">{subject.title}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleGenerateNotes} className="text-brand p-2.5 rounded-2xl hover:bg-brand/5 border border-brand/10 transition-all active:scale-90" title="Generate AI Notes">
                          {generatingNotes ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                        </button>
                        <XPBadge />
                    </div>
                </div>
                <div className="flex px-6 gap-10">
                    {(['Chapters', 'Study Material'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t === 'Chapters' ? 'Chapters' : 'Notes')} className={`pb-4 text-sm font-black border-b-4 transition-all ${tab === (t === 'Chapters' ? 'Chapters' : 'Notes') ? 'text-brand border-brand' : 'text-gray-400 border-transparent'}`}>{t}</button>
                    ))}
                </div>
            </div>

            <div className="p-6 space-y-8 pb-32">
                {tab === 'Chapters' ? (
                  subject.chapters.length === 0 ? (
                    <div className="text-center py-32 opacity-30 italic font-black uppercase text-[10px] tracking-widest">No data sequences discovered</div>
                  ) : (
                    subject.chapters.map((chap, idx) => (
                        <div key={chap.id} onClick={() => setTab('Notes')} className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-sm flex justify-between items-center active:scale-[0.98] transition-all hover:border-brand/20 cursor-pointer">
                            <div>
                                <span className="inline-block bg-brand/5 text-brand text-[10px] font-black px-3 py-1.5 rounded-xl mb-3 border border-brand/10 uppercase tracking-[0.2em] shadow-sm">UNIT - {String(idx+1).padStart(2, '0')}</span>
                                <h3 className="font-black text-gray-800 text-xl mb-2 tracking-tight leading-tight">{chap.title}</h3>
                                <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.3em]">Module Stream : {chap.videos.filter(v => v.type === 'lecture').length} SEQUENCES</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-brand transition-colors"><ChevronRight className="w-7 h-7" /></div>
                        </div>
                    ))
                  )
                ) : (
                  <div className="space-y-6">
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                      {(['All', 'Lectures', 'Notes', 'DPPs'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-6 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all uppercase tracking-widest border-2 ${filter === f ? 'bg-[#333] border-[#333] text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}>{f}</button>
                      ))}
                    </div>
                    <div className="space-y-4">
                    {subject.chapters.flatMap(c => c.videos).filter(v => filter === 'All' || (filter === 'Lectures' && v.type === 'lecture') || (filter === 'Notes' && v.type === 'note') || (filter === 'DPPs' && v.type === 'dpp')).map(v => (
                      <div key={v.id} className="bg-white border border-gray-100 rounded-[35px] p-5 shadow-sm flex gap-5 animate-slide-up group cursor-pointer hover:border-blue-500/30" onClick={() => setSelectedVideo(v)}>
                        <div className="w-28 aspect-video bg-gray-50 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center border border-gray-100 shadow-inner group-hover:border-brand/30 transition-colors relative">
                          {v.thumbnail ? <img src={v.thumbnail} className="w-full h-full object-cover" alt="" /> : 
                           v.type === 'lecture' ? <PlayCircle className="w-8 h-8 text-brand/20 group-hover:text-brand transition-colors" /> : 
                           v.type === 'dpp' ? <FileText className="w-8 h-8 text-orange-400/50" /> : <FileText className="w-8 h-8 text-gray-400/50" />
                          }
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1.5">{v.type?.toUpperCase()} • {v.date}</p>
                          <h4 className="text-sm font-black text-gray-800 line-clamp-2 leading-tight tracking-tight mb-2 group-hover:text-brand transition-colors">{v.title}</h4>
                          <div className="flex items-center gap-2">
                              {v.type === 'lecture' && <span className="text-[10px] font-bold text-brand bg-brand/5 px-2 py-1 rounded-md">Watch Now</span>}
                              {v.type === 'dpp' && <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-md">Solve PDF</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Video/Content Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
                    <div className="w-full h-full flex flex-col">
                        <div className="p-4 flex justify-between items-center text-white bg-black/50 backdrop-blur-md absolute top-0 left-0 right-0 z-50">
                            <h3 className="font-bold truncate max-w-[80%]">{selectedVideo.title}</h3>
                            <button onClick={() => setSelectedVideo(null)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 flex items-center justify-center relative">
                            {selectedVideo.type === 'lecture' ? (
                                <VideoPlayer src={selectedVideo.filename} onBack={() => setSelectedVideo(null)} />
                            ) : (
                                <div className="w-full h-full pt-16 pb-4 px-4 flex flex-col items-center">
                                    <iframe src={selectedVideo.filename} className="w-full h-full rounded-xl bg-white" title="Document Viewer" />
                                    <a href={selectedVideo.filename} target="_blank" rel="noreferrer" className="mt-4 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2">
                                        <Download className="w-4 h-4" /> Download/Open External
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {notes && (
                <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in" onClick={() => setNotes(null)}>
                    <div className="bg-white w-full max-w-lg max-h-[85vh] rounded-[50px] p-10 overflow-y-auto shadow-2xl animate-slide-up relative border border-white/20" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8 sticky top-0 bg-white/80 backdrop-blur pb-4">
                            <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight"><Sparkles className="w-7 h-7 text-brand" /> Neural Summary</h2>
                            <button onClick={() => setNotes(null)} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><X className="text-gray-400" /></button>
                        </div>
                        <div className="prose prose-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-medium text-lg selection:bg-brand/10">{notes}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ... Profile, Login, MainContent ...

const Profile = () => {
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
        const blob = new Blob([note.content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.videoTitle.replace(/[^a-z0-9]/gi, '_')}.txt`;
        a.click();
    };

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        updateUser(editForm);
        setIsEditing(false);
        alert("Profile Updated Successfully!");
    };

    return (
        <div className="pb-24 pt-24 px-6 min-h-screen bg-[#f8fafc]">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="bg-white rounded-[60px] p-12 shadow-sm border border-gray-100 relative overflow-hidden text-center">
                    <div className="w-32 h-32 rounded-[45px] bg-brand flex items-center justify-center text-white text-5xl font-black shadow-2xl mx-auto mb-8 border-4 border-white">
                        {currentUser.name.charAt(0)}
                    </div>
                    
                    {isEditing ? (
                        <form onSubmit={handleUpdateProfile} className="space-y-4 text-left max-w-sm mx-auto">
                            <input className="w-full p-4 bg-gray-50 rounded-2xl" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Name" required />
                            <input className="w-full p-4 bg-gray-50 rounded-2xl" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} placeholder="Email" required />
                            <input className="w-full p-4 bg-gray-50 rounded-2xl" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="Phone" />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-brand text-white font-bold rounded-xl">Save</button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <h2 className="text-4xl font-black text-gray-800 tracking-tighter uppercase mb-2">{currentUser.name}</h2>
                            <p className="text-brand font-black text-xs uppercase tracking-[0.4em] bg-brand/5 px-6 py-2 rounded-full inline-block mb-10 shadow-inner">{currentUser.role} IDENTITY</p>
                            <button onClick={() => setIsEditing(true)} className="absolute top-8 right-8 p-3 text-gray-400 hover:text-brand bg-gray-50 rounded-2xl"><Edit className="w-5 h-5" /></button>
                            <button onClick={logout} className="w-full py-6 text-red-500 font-black bg-red-50 rounded-[30px] shadow-xl shadow-red-100 active:scale-95 transition-all uppercase tracking-[0.4em] text-xs">DISCONNECT</button>
                        </>
                    )}
                </div>
                {currentUser.role === UserRole.ADMIN && (
                    <Link to="/admin" className="block w-full py-8 bg-gradient-to-r from-brand to-[#003ea1] text-white rounded-[50px] text-center font-black shadow-2xl uppercase tracking-[0.3em] text-xl active:scale-95 transition-transform">ADMIN COMMAND GRID</Link>
                )}
            </div>
        </div>
    );
};

const Login = () => {
    const { login, signup, currentUser } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isS, setIsS] = useState(false);
    const [f, setF] = useState({ name: '', email: '', pass: '' });

    // Use location state to redirect back to where user came from, or home
    const from = location.state?.from?.pathname || "/";

    useEffect(() => { 
        if (currentUser) {
            navigate(from, { replace: true });
        }
    }, [currentUser, navigate, from]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#7c5cdb] relative overflow-hidden">
            <div className="text-center mb-14 relative z-10">
              <div className="w-24 h-24 bg-white rounded-[40px] flex items-center justify-center mx-auto mb-6 text-[#7c5cdb] text-4xl font-black shadow-2xl">S</div>
              <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase drop-shadow-xl">Study Tool Hub</h1>
            </div>
            <div className="bg-white p-12 rounded-[70px] w-full max-w-md shadow-2xl animate-fade-in relative z-10 border border-white/20">
                <h2 className="text-4xl font-black text-gray-800 mb-12 text-center uppercase tracking-tighter italic">Identity</h2>
                <form onSubmit={e => { e.preventDefault(); if(isS) signup(f.name, f.email, '', f.pass); else if (!login(f.email, f.pass)) alert('Neural mismatch. Signal rejected.'); }} className="space-y-5">
                    {isS && <input className="w-full p-6 bg-gray-50 rounded-3xl outline-none font-black border-2 border-transparent focus:border-brand/20 transition-all shadow-inner" placeholder="IDENTITY NAME" value={f.name} onChange={e => setF({...f, name: e.target.value})} required />}
                    <input className="w-full p-6 bg-gray-50 rounded-3xl outline-none font-black border-2 border-transparent focus:border-brand/20 transition-all shadow-inner" placeholder="SIGNAL / EMAIL" value={f.email} onChange={e => setF({...f, email: e.target.value})} required />
                    <input className="w-full p-6 bg-gray-50 rounded-3xl outline-none font-black border-2 border-transparent focus:border-brand/20 transition-all shadow-inner" type="password" placeholder="PASS-SEQUENCE" value={f.pass} onChange={e => setF({...f, pass: e.target.value})} required />
                    <button className="w-full py-6 bg-[#7c5cdb] text-white font-black rounded-[35px] shadow-2xl shadow-indigo-200 uppercase tracking-[0.3em] text-xl active:scale-95 transition-all mt-8">Initialize</button>
                </form>
                <button onClick={() => setIsS(!isS)} className="w-full mt-12 text-[10px] text-[#7c5cdb] font-black uppercase tracking-[0.5em] text-center">{isS ? '< Revert Access' : 'Construct New Identity >'}</button>
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
