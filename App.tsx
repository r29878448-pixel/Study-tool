
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { StoreProvider, useStore } from './store';
import { 
  Home, BookOpen, User, Search, PlayCircle, Lock, 
  LayoutDashboard, Settings, Plus, Trash2, Edit, X, 
  CheckCircle, ExternalLink, Play, Bot, Brain, Loader2, ArrowLeft, 
  Video as VideoIcon, Sparkles, Send, Smartphone, List, Globe, Bell, 
  ChevronRight, MoreVertical, MessageCircle, FileText, Calendar, MessageSquare, Eye,
  RotateCcw, ImageIcon
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

// --- SUBJECT & CHAPTER CONTENT MANAGER ---

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
        const iconText = prompt('Icon Text (e.g. Ch):') || 'Su';
        if (title) setSubjects([...subjects, { id: Date.now().toString(), title, iconText, chapters: [] }]);
    };

    const addChapter = (sId: string) => {
        const title = prompt('Chapter Title:');
        if (title) {
            setSubjects(subjects.map(s => s.id === sId ? { ...s, chapters: [...s.chapters, { id: Date.now().toString(), title, videos: [] }] } : s));
        }
    };

    const addVideo = (sId: string, cId: string) => {
        const title = prompt('Content Title:');
        const url = prompt('Stream Link:');
        const dur = prompt('Duration (e.g. 1:20:00):') || '10:00';
        const typeInput = prompt('Type (lecture/note/dpp):') || 'lecture';
        const type = (['lecture', 'note', 'dpp'].includes(typeInput) ? typeInput : 'lecture') as 'lecture' | 'note' | 'dpp';
        
        if (title && url) {
            setSubjects(subjects.map(s => s.id === sId ? { 
                ...s, 
                chapters: s.chapters.map(c => c.id === cId ? { 
                    ...c, 
                    videos: [...c.videos, { id: Date.now().toString(), title, filename: url, duration: dur, type, date: 'TODAY' }] 
                } : c)
            } : s));
        }
    };

    const updateVideoData = () => {
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
            <div className="bg-white w-full max-w-2xl rounded-[32px] p-8 max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                      <VideoIcon className="text-blue-600" /> 
                      {activeChapter ? activeChapter.title : activeSubject ? activeSubject.title : 'Manage Subjects'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X /></button>
                </div>

                <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-400 overflow-x-auto no-scrollbar">
                    <button onClick={() => { setActiveSubjectId(null); setActiveChapterId(null); }} className={!activeSubjectId ? 'text-blue-600' : ''}>ROOT</button>
                    {activeSubject && (
                      <>
                        <ChevronRight className="w-3 h-3" />
                        <button onClick={() => setActiveChapterId(null)} className={activeSubjectId && !activeChapterId ? 'text-blue-600' : ''}>{activeSubject.title.toUpperCase()}</button>
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
                                <button onClick={updateVideoData} className="flex-1 py-2 bg-[#0056d2] text-white font-bold rounded-xl">Save Node</button>
                            </div>
                        </div>
                    ) : activeChapterId && activeSubjectId ? (
                        <div className="space-y-3">
                            <button onClick={() => addVideo(activeSubjectId, activeChapterId)} className="w-full py-4 border-2 border-dashed border-blue-100 rounded-2xl text-blue-600 font-bold hover:bg-blue-50 transition-all">+ Add Chapter Content</button>
                            {activeChapter?.videos.map(vid => (
                                <div key={vid.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center">
                                    <div className="truncate pr-4">
                                        <p className="text-sm font-bold text-gray-800 truncate">{vid.title}</p>
                                        <p className="text-[10px] text-blue-500 font-bold uppercase">{vid.type} • {vid.duration}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => setEditingVideo({chapId: activeChapterId, vid})} className="p-2 text-gray-400 hover:text-blue-500"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => setSubjects(subjects.map(s => s.id === activeSubjectId ? {...s, chapters: s.chapters.map(c => c.id === activeChapterId ? {...c, videos: c.videos.filter(v => v.id !== vid.id)} : c)} : s))} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activeSubjectId ? (
                        <div className="space-y-3">
                            <button onClick={() => addChapter(activeSubjectId)} className="w-full py-4 border-2 border-dashed border-blue-100 rounded-2xl text-blue-600 font-bold hover:bg-blue-50 transition-all">+ Add New Chapter</button>
                            {activeSubject?.chapters.map(chap => (
                                <div key={chap.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm">
                                    <button onClick={() => setActiveChapterId(chap.id)} className="flex-1 text-left font-bold text-gray-700">{chap.title}</button>
                                    <button onClick={() => setSubjects(subjects.map(s => s.id === activeSubjectId ? {...s, chapters: s.chapters.filter(c => c.id !== chap.id)} : s))} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <button onClick={addSubject} className="w-full py-4 border-2 border-dashed border-blue-100 rounded-2xl text-blue-600 font-bold hover:bg-blue-50 transition-all">+ Add Subject wise Column</button>
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
                    <button onClick={onClose} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-colors">Discard</button>
                    <button onClick={handleSave} className="flex-1 py-4 bg-[#0056d2] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all">Commit Changes</button>
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
                            <div key={sub.id} onClick={() => navigate(`/course/${course.id}/subject/${sub.id}`)} className="bg-white border border-gray-100 rounded-[35px] p-6 flex items-center gap-6 shadow-sm active:scale-[0.98] transition-all hover:border-brand/30 hover:shadow-md">
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
    
    const course = courses.find(c => c.id === courseId);
    const subject = course?.subjects.find(s => s.id === subjectId);
    if (!subject || !courseId) return <Navigate to="/" />;

    const handleGenerateNotes = async () => {
        setGeneratingNotes(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Generate highly concise educational summary for "${subject.title}" based on these chapter topics: ${subject.chapters.map(c => c.title).join(', ')}. Use professional teaching tone.`;
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
                        <button onClick={handleGenerateNotes} className="text-brand p-2.5 rounded-2xl hover:bg-brand/5 border border-brand/10 transition-all active:scale-90">
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
                        <div key={chap.id} onClick={() => setTab('Notes')} className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-sm flex justify-between items-center active:scale-[0.98] transition-all hover:border-brand/20">
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
                      <div key={v.id} className="bg-white border border-gray-100 rounded-[35px] p-5 shadow-sm flex gap-5 animate-slide-up group">
                        <div className="w-28 aspect-video bg-gray-50 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center border border-gray-100 shadow-inner group-hover:border-brand/30 transition-colors">
                          <PlayCircle className="w-8 h-8 text-brand/20 group-hover:text-brand transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1.5">{v.type?.toUpperCase()} • {v.date}</p>
                          <h4 className="text-sm font-black text-gray-800 line-clamp-2 leading-tight tracking-tight mb-3 group-hover:text-brand transition-colors">{v.title}</h4>
                          <button onClick={() => navigate(`/watch/${courseId}`)} className="flex items-center gap-2 px-4 py-2 bg-brand/5 text-brand rounded-xl text-[10px] font-black hover:bg-brand hover:text-white transition-all shadow-sm active:scale-95 uppercase tracking-widest border border-brand/5">
                            <PlayCircle className="w-4 h-4" /> Initialize
                          </button>
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                )}
            </div>

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

const Profile = () => {
    const { currentUser, logout } = useStore();
    if (!currentUser) return <Navigate to="/login" />;
    return (
        <div className="pb-24 pt-24 px-6 min-h-screen bg-[#f8fafc]">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="bg-white rounded-[60px] p-12 shadow-sm border border-gray-100 relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
                    <div className="w-32 h-32 rounded-[45px] bg-brand flex items-center justify-center text-white text-5xl font-black shadow-2xl mx-auto mb-8 border-4 border-white">
                        {currentUser.name.charAt(0)}
                    </div>
                    <h2 className="text-4xl font-black text-gray-800 tracking-tighter uppercase mb-2">{currentUser.name}</h2>
                    <p className="text-brand font-black text-xs uppercase tracking-[0.4em] bg-brand/5 px-6 py-2 rounded-full inline-block mb-10 shadow-inner">{currentUser.role} IDENTITY</p>
                    <div className="mt-6 space-y-4">
                        <div className="p-6 bg-gray-50 rounded-[35px] text-gray-500 font-bold border border-gray-100/50 shadow-inner">{currentUser.email}</div>
                    </div>
                    <button onClick={logout} className="mt-14 w-full py-6 text-red-500 font-black bg-red-50 rounded-[30px] shadow-xl shadow-red-100 active:scale-95 transition-all uppercase tracking-[0.4em] text-xs">DISCONNECT</button>
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
    const [isS, setIsS] = useState(false);
    const [f, setF] = useState({ name: '', email: '', pass: '' });

    useEffect(() => { if (currentUser) navigate('/'); }, [currentUser, navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#7c5cdb] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full futuristic-grid opacity-10 pointer-events-none"></div>
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
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {!isWatch && <STBottomNav />}
      <ChatBot />
      <SpeedInsights />
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
