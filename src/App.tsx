
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
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
        const type = (prompt('Type (lecture/note/dpp):') || 'lecture') as any;
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
                        <button onClick={() => setActiveChapterId(null)} className={!activeChapterId ? 'text-blue-600' : ''}>{activeSubject.title.toUpperCase()}</button>
                      </>
                    )}
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
                    {editingVideo ? (
                        <div className="space-y-4 bg-gray-50 p-6 rounded-2xl">
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
          ...(editing || { id: Date.now().toString(), chapters: [], subjects: [], createdAt: new Date().toISOString() }), 
          ...form 
        };
        if (editing) updateCourse(data); else addCourse(data);
        setShowModal(false);
    };

    return (
        <div className="pb-24 pt-20 px-4 min-h-screen bg-[#f8fafc]">
             <div className="max-w-4xl mx-auto">
                 <div className="flex bg-white p-1.5 rounded-[24px] shadow-sm border border-gray-100 mb-8">
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
                                 <div key={c.id} className="bg-white p-4 rounded-[28px] flex items-center gap-4 border border-gray-100 shadow-sm">
                                     <img src={c.image} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                                     <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 text-sm">{c.title}</h3>
                                        <p className="text-[10px] text-blue-600 font-bold uppercase">{c.category}</p>
                                     </div>
                                     <div className="flex gap-2">
                                         <button onClick={() => setContentTarget(c)} className="px-4 py-2 bg-[#0056d2] text-white rounded-xl font-bold text-[10px]">CONTENT</button>
                                         <button onClick={() => { setEditing(c); setShowModal(true); }} className="p-2 bg-gray-50 text-gray-400 rounded-xl"><Edit className="w-4 h-4" /></button>
                                         <button onClick={() => { if(confirm('Delete batch?')) deleteCourse(c.id); }} className="p-2 bg-red-50 text-red-400 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                {tab === 'users' && (
                    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-500 uppercase text-[10px] tracking-widest">User Registry</div>
                      <div className="divide-y divide-gray-50">
                      {users.map(u => (
                          <div key={u.id} className="p-5 flex justify-between items-center">
                              <div>
                                  <p className="font-bold text-gray-800">{u.name}</p>
                                  <p className="text-[11px] text-gray-400">{u.email}</p>
                              </div>
                              <span className="text-[10px] font-bold px-3 py-1 bg-blue-50 text-blue-600 rounded-full">{u.role}</span>
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
                            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Batch Management</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X /></button>
                        </div>
                        <form onSubmit={handleSaveCourse} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Batch Thumbnail</label>
                                <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center group">
                                    {form.image ? (
                                        <>
                                            <img src={form.image} className="w-full h-full object-cover" alt="Preview" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button type="button" onClick={() => setForm({...form, image: ''})} className="bg-white text-red-500 p-2 rounded-full shadow-lg"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-6">
                                            <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                            <p className="text-[10px] font-bold text-gray-400">Enter Image URL Below</p>
                                        </div>
                                    )}
                                </div>
                                <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-mono text-[10px]" placeholder="Thumbnail URL" />
                            </div>

                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold" placeholder="Batch Name" required />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs uppercase font-bold" placeholder="Category" required />
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-xs font-bold text-gray-400 uppercase">New Badge?</span>
                                    <input type="checkbox" checked={form.isNew} onChange={e => setForm({...form, isNew: e.target.checked})} className="w-5 h-5 accent-blue-600" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 ml-1">Starts On</label>
                                    <input value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs" placeholder="Starts Date" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 ml-1">Ends On</label>
                                    <input value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs" placeholder="Ends Date" />
                                </div>
                            </div>

                            <div className="pt-6">
                                <button type="submit" className="w-full py-4 bg-[#0056d2] text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all">COMMIT BATCH NODE</button>
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
                <div className="bg-white p-1 rounded-2xl border border-gray-100 flex shadow-sm">
                    {(['Paid', 'Free'] as const).map((t) => (
                        <button key={t} onClick={() => setFilter(t)} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === t ? 'bg-blue-50 text-[#0056d2]' : 'text-gray-400'}`}>
                            {t}
                        </button>
                    ))}
                </div>

                <div className="space-y-6">
                    {filteredCourses.map(c => (
                        <div key={c.id} className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm">
                            <div className="p-6 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-black text-gray-800">{c.title}</h3>
                                    {c.isNew && <span className="bg-[#fff9e6] text-[#eab308] text-[9px] font-black px-2 py-0.5 rounded-md border border-yellow-200">New</span>}
                                </div>
                            </div>
                            <div className="px-6">
                                <img src={c.image} className="w-full aspect-[16/9] object-cover rounded-2xl" alt={c.title} />
                            </div>
                            <div className="p-6 pt-4 space-y-5">
                                <div className="flex items-center gap-4 text-[11px] font-bold text-gray-400">
                                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /><span>Starts on {c.startDate}</span></div>
                                    <div className="flex items-center gap-1.5"><span>Ends on {c.endDate}</span></div>
                                </div>
                                <div className="flex gap-3">
                                    <button className="flex-1 py-3 text-sm font-bold text-[#7c5cdb] border border-[#7c5cdb]/20 rounded-xl">Similar Batches</button>
                                    <Link to={`/course/${c.id}`} className="flex-1 py-3 bg-[#7c5cdb] text-white text-center text-sm font-bold rounded-xl shadow-lg">Let's Study</Link>
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
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
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
                    {(['Description', 'Subjects', 'Resources', 'Tests', 'Community'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${activeTab === tab ? 'text-[#7c5cdb] border-[#7c5cdb]' : 'text-gray-400 border-transparent'}`}>
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
                                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0056d2] font-black text-lg">{sub.iconText}</div>
                                <div className="flex-1">
                                    <h3 className="font-extrabold text-gray-800 text-base">{sub.title}</h3>
                                    <div className="flex items-center gap-4 mt-2.5">
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#0056d2] w-[0%]"></div></div>
                                        <span className="text-[11px] font-black text-gray-400">0%</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </div>
                        ))}
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
    const subject = course?.subjects?.find(s => s.id === subjectId);
    if (!subject) return <Navigate to="/" />;

    const handleGenerateNotes = async () => {
        setGeneratingNotes(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Generate concise study notes for "${subject.title}" chapters: ${subject.chapters.map(c => c.title).join(', ')}.`;
            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            setNotes(response.text || "Could not generate notes.");
        } catch (e) { alert("AI sync failed."); } finally { setGeneratingNotes(false); }
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
                        <button onClick={handleGenerateNotes} className="text-blue-600 p-2 rounded-full hover:bg-blue-50">
                          {generatingNotes ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        </button>
                        <XPBadge />
                    </div>
                </div>
                <div className="flex px-5 gap-8">
                    {['Chapters', 'Study Material'].map(t => (
                        <button key={t} onClick={() => setTab(t === 'Chapters' ? 'Chapters' : 'Notes')} className={`pb-3 text-sm font-bold border-b-2 transition-all ${tab === (t === 'Chapters' ? 'Chapters' : 'Notes') ? 'text-[#7c5cdb] border-[#7c5cdb]' : 'text-gray-400 border-transparent'}`}>{t}</button>
                    ))}
                </div>
            </div>

            <div className="p-5 space-y-6">
                {tab === 'Chapters' ? (
                  subject.chapters.map((chap, idx) => (
                    <div key={chap.id} onClick={() => setTab('Notes')} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex justify-between items-center active:scale-[0.98] transition-all">
                        <div>
                            <span className="inline-block bg-blue-50 text-[#0056d2] text-[10px] font-bold px-2.5 py-1 rounded-lg mb-2 border border-blue-100 uppercase tracking-widest">CH - {String(idx+1).padStart(2, '0')}</span>
                            <h3 className="font-extrabold text-gray-800 text-base">{chap.title}</h3>
                            <p className="text-[11px] text-gray-400 font-bold uppercase mt-1 tracking-wider">Lectures : {chap.videos.filter(v => v.type === 'lecture').length}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  ))
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                      {(['All', 'Lectures', 'Notes', 'DPPs'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filter === f ? 'bg-[#444] text-white' : 'bg-gray-100 text-gray-400'}`}>{f}</button>
                      ))}
                    </div>
                    {subject.chapters.flatMap(c => c.videos).filter(v => filter === 'All' || (filter === 'Lectures' && v.type === 'lecture') || (filter === 'Notes' && v.type === 'note')).map(v => (
                      <div key={v.id} className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex gap-4">
                        <div className="w-24 aspect-video bg-gray-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                          <PlayCircle className="w-6 h-6 text-gray-300" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{v.type?.toUpperCase()} • {v.date}</p>
                          <h4 className="text-xs font-extrabold text-gray-800 line-clamp-2">{v.title}</h4>
                          <button onClick={() => navigate(`/watch/${courseId}`)} className="flex items-center gap-1.5 mt-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black hover:bg-blue-100 transition-colors">
                            <PlayCircle className="w-3.5 h-3.5" /> Watch Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {notes && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setNotes(null)}>
                    <div className="bg-white w-full max-w-lg max-h-[80vh] rounded-[30px] p-8 overflow-y-auto shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-blue-500" /> AI Notes</h2>
                            <button onClick={() => setNotes(null)}><X className="text-gray-400" /></button>
                        </div>
                        <div className="prose prose-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">{notes}</div>
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
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white rounded-[50px] p-12 shadow-sm border border-gray-100 relative overflow-hidden text-center">
                    <div className="w-24 h-24 rounded-[32px] bg-[#0056d2] flex items-center justify-center text-white text-4xl font-black shadow-2xl mx-auto mb-6">
                        {currentUser.name.charAt(0)}
                    </div>
                    <h2 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">{currentUser.name}</h2>
                    <p className="text-[#0056d2] font-black text-[11px] uppercase tracking-[0.4em] bg-blue-50 px-4 py-1 rounded-full inline-block mt-3">{currentUser.role} IDENTITY</p>
                    <div className="mt-10 space-y-4">
                        <div className="p-5 bg-gray-50 rounded-[28px] text-gray-500 font-bold">{currentUser.email}</div>
                    </div>
                    <button onClick={logout} className="mt-12 w-full py-5 text-red-500 font-black bg-red-50 rounded-[24px] shadow-lg shadow-red-50 active:scale-95 transition-all">DISCONNECT IDENTITY</button>
                </div>
                {currentUser.role === UserRole.ADMIN && (
                    <Link to="/admin" className="block w-full py-7 bg-gradient-to-r from-[#0056d2] to-blue-800 text-white rounded-[40px] text-center font-black shadow-2xl uppercase tracking-[0.2em]">ADMIN COMMAND GRID</Link>
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
              <div className="w-20 h-20 bg-white rounded-[28px] flex items-center justify-center mx-auto mb-4 text-[#7c5cdb] text-3xl font-black">S</div>
              <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">Study Tool Hub</h1>
            </div>
            <div className="bg-white p-10 rounded-[50px] w-full max-w-md shadow-2xl animate-fade-in relative z-10">
                <h2 className="text-3xl font-black text-gray-800 mb-8 text-center italic uppercase tracking-tighter">Identity Sync</h2>
                <form onSubmit={e => { e.preventDefault(); if(isS) signup(f.name, f.email, '', f.pass); else if (!login(f.email, f.pass)) alert('Login failed.'); }} className="space-y-4">
                    {isS && <input className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-blue-100" placeholder="Full Identity" value={f.name} onChange={e => setF({...f, name: e.target.value})} required />}
                    <input className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-blue-100" placeholder="Email/Terminal" value={f.email} onChange={e => setF({...f, email: e.target.value})} required />
                    <input className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-blue-100" type="password" placeholder="Pass-Sequence" value={f.pass} onChange={e => setF({...f, pass: e.target.value})} required />
                    <button className="w-full py-6 bg-[#7c5cdb] text-white font-black rounded-3xl shadow-xl uppercase tracking-widest text-lg active:scale-95 transition-all mt-6">Initialize</button>
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
