
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { 
  Home, BookOpen, User, Search, PlayCircle, Lock, 
  LayoutDashboard, Plus, Trash2, Edit, X, 
  Bot, Loader2, ArrowLeft, 
  Video as VideoIcon, Bell, 
  ChevronRight, MoreVertical, Calendar,
  ImageIcon, Upload, Globe, Settings, FileText, CheckCircle
} from './components/Icons';
import VideoPlayer from './components/VideoPlayer';
import ChatBot from './components/ChatBot';
import ExamMode from './components/ExamMode';
import { Course, Video, UserRole, Subject, Chapter } from './types';

// --- HELPERS ---

const extractYoutubeThumbnail = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) 
      ? `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg` 
      : '';
};

// --- SHARED UI COMPONENTS ---

const Banner = () => (
  <div className="bg-blue-50 px-4 py-3 flex items-center justify-between text-xs font-medium text-blue-700 border-b border-blue-100">
    <span>Welcome to the portal. Start your learning journey!</span>
    <X className="w-4 h-4 text-blue-400 cursor-pointer" />
  </div>
);

const STHeader = () => {
  const { currentUser, settings } = useStore();
  const location = useLocation();
  const isNoNav = ['/login', '/watch', '/exam'].some(p => location.pathname.includes(p));
  const isDetailView = location.pathname.includes('/course/') || location.pathname.includes('/subject/');

  if (isNoNav || isDetailView) return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">S</div>
          <span className="font-bold text-gray-900 tracking-tight text-xl">{settings.appName}</span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/profile" className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden transition-transform active:scale-95">
            {currentUser ? <span className="font-bold text-brand">{currentUser.name.charAt(0)}</span> : <User className="w-5 h-5 text-gray-400" />}
        </Link>
      </div>
    </header>
  );
};

const STBottomNav = () => {
  const location = useLocation();
  const isNoNav = ['/login', '/watch', '/exam'].some(p => location.pathname.includes(p));
  if (isNoNav) return null;

  const tabs = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Courses', path: '/courses', icon: LayoutDashboard },
    { label: 'My Study', path: '/my-courses', icon: BookOpen },
    { label: 'Profile', path: '/profile', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-50 pb-safe shadow-lg">
      {tabs.map(tab => {
        const isActive = location.pathname === tab.path || (tab.path === '/' && location.pathname === '');
        return (
          <Link key={tab.path} to={tab.path} className={`flex flex-col items-center gap-1 flex-1 py-1 transition-colors ${isActive ? 'text-brand' : 'text-gray-400'}`}>
            <tab.icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

// --- CONTENT MANAGEMENT SYSTEM ---

const ContentManager = ({ course, onClose }: { course: Course, onClose: () => void }) => {
    const { updateCourse } = useStore();
    const [subjects, setSubjects] = useState<Subject[]>(course.subjects || []);
    
    // Navigation State
    const [view, setView] = useState<'SUBJECTS' | 'CHAPTERS' | 'VIDEOS'>('SUBJECTS');
    const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

    // Form State (for Add/Edit)
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null); // Polymorphic: Subject | Chapter | Video
    
    // Generic Form Data
    const [formData, setFormData] = useState({
        title: '',
        iconText: '', // Subject
        image: '', // Chapter
        filename: '', // Video
        duration: '', // Video
        type: 'lecture', // Video
        thumbnail: '' // Video
    });

    // --- Navigation Handlers ---
    const navigateToChapters = (sId: string) => {
        setActiveSubjectId(sId);
        setView('CHAPTERS');
    };

    const navigateToVideos = (cId: string) => {
        setActiveChapterId(cId);
        setView('VIDEOS');
    };

    const navigateUp = () => {
        if (view === 'VIDEOS') {
            setView('CHAPTERS');
            setActiveChapterId(null);
        } else if (view === 'CHAPTERS') {
            setView('SUBJECTS');
            setActiveSubjectId(null);
        }
    };

    // --- CRUD Handlers ---

    const openAddForm = () => {
        setEditingItem(null);
        setFormData({ title: '', iconText: '', image: '', filename: '', duration: '', type: 'lecture', thumbnail: '' });
        setIsFormOpen(true);
    };

    const openEditForm = (item: any) => {
        setEditingItem(item);
        setFormData({
            title: item.title || '',
            iconText: item.iconText || '',
            image: item.image || '',
            filename: item.filename || '',
            duration: item.duration || '',
            type: item.type || 'lecture',
            thumbnail: item.thumbnail || ''
        });
        setIsFormOpen(true);
    };

    const handleDelete = (itemId: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        
        let newSubjects = [...subjects];
        
        if (view === 'SUBJECTS') {
            newSubjects = newSubjects.filter(s => s.id !== itemId);
        } else if (view === 'CHAPTERS' && activeSubjectId) {
            newSubjects = newSubjects.map(s => s.id === activeSubjectId ? {
                ...s,
                chapters: s.chapters.filter(c => c.id !== itemId)
            } : s);
        } else if (view === 'VIDEOS' && activeSubjectId && activeChapterId) {
            newSubjects = newSubjects.map(s => s.id === activeSubjectId ? {
                ...s,
                chapters: s.chapters.map(c => c.id === activeChapterId ? {
                    ...c,
                    videos: c.videos.filter(v => v.id !== itemId)
                } : c)
            } : s);
        }
        setSubjects(newSubjects);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let newSubjects = [...subjects];

        if (view === 'SUBJECTS') {
            const newItem: Subject = {
                id: editingItem ? editingItem.id : Date.now().toString(),
                title: formData.title,
                iconText: formData.iconText || formData.title.substring(0, 2).toUpperCase(),
                chapters: editingItem ? editingItem.chapters : []
            };

            if (editingItem) {
                newSubjects = newSubjects.map(s => s.id === newItem.id ? newItem : s);
            } else {
                newSubjects.push(newItem);
            }
        } else if (view === 'CHAPTERS' && activeSubjectId) {
            newSubjects = newSubjects.map(s => {
                if (s.id !== activeSubjectId) return s;
                
                const newItem: Chapter = {
                    id: editingItem ? editingItem.id : Date.now().toString(),
                    title: formData.title,
                    image: formData.image,
                    videos: editingItem ? editingItem.videos : []
                };

                const newChapters = editingItem 
                    ? s.chapters.map(c => c.id === newItem.id ? newItem : c)
                    : [...s.chapters, newItem];
                
                return { ...s, chapters: newChapters };
            });
        } else if (view === 'VIDEOS' && activeSubjectId && activeChapterId) {
            newSubjects = newSubjects.map(s => {
                if (s.id !== activeSubjectId) return s;
                return {
                    ...s,
                    chapters: s.chapters.map(c => {
                        if (c.id !== activeChapterId) return c;
                        
                        // Auto-generate thumbnail if missing
                        let finalThumb = formData.thumbnail;
                        if (!finalThumb && formData.filename) {
                            finalThumb = extractYoutubeThumbnail(formData.filename);
                        }

                        const newItem: Video = {
                            id: editingItem ? editingItem.id : Date.now().toString(),
                            title: formData.title,
                            filename: formData.filename,
                            duration: formData.duration || '10:00',
                            type: formData.type as any,
                            date: new Date().toLocaleDateString(),
                            thumbnail: finalThumb
                        };

                        const newVideos = editingItem
                            ? c.videos.map(v => v.id === newItem.id ? newItem : v)
                            : [...c.videos, newItem];
                        
                        return { ...c, videos: newVideos };
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

    // --- Render Helpers ---

    const activeSubject = subjects.find(s => s.id === activeSubjectId);
    const activeChapter = activeSubject?.chapters.find(c => c.id === activeChapterId);

    return (
        <div className="fixed inset-0 z-[100] bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Content Manager</h2>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <span className={view === 'SUBJECTS' ? 'font-bold text-brand' : 'cursor-pointer hover:underline'} onClick={() => { setView('SUBJECTS'); setActiveSubjectId(null); setActiveChapterId(null); }}>Subjects</span>
                            {activeSubject && (
                                <>
                                    <ChevronRight className="w-3 h-3" />
                                    <span className={view === 'CHAPTERS' ? 'font-bold text-brand' : 'cursor-pointer hover:underline'} onClick={() => { setView('CHAPTERS'); setActiveChapterId(null); }}>{activeSubject.title}</span>
                                </>
                            )}
                            {activeChapter && (
                                <>
                                    <ChevronRight className="w-3 h-3" />
                                    <span className="font-bold text-brand">{activeChapter.title}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-600" /></button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {isFormOpen ? (
                        <form onSubmit={handleFormSubmit} className="bg-white p-6 rounded-xl shadow-sm space-y-4 animate-fade-in">
                            <h3 className="font-bold text-lg border-b pb-2 mb-4">
                                {editingItem ? 'Edit' : 'Add'} {view === 'SUBJECTS' ? 'Subject' : view === 'CHAPTERS' ? 'Chapter' : 'Lesson'}
                            </h3>
                            
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
                                <input className="w-full p-3 border rounded-lg bg-gray-50" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Enter title..." required />
                            </div>

                            {view === 'SUBJECTS' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Icon Short Text (2 chars)</label>
                                    <input className="w-full p-3 border rounded-lg bg-gray-50" value={formData.iconText} onChange={e => setFormData({...formData, iconText: e.target.value})} placeholder="e.g. PH" maxLength={2} />
                                </div>
                            )}

                            {view === 'CHAPTERS' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Chapter Image URL (Optional)</label>
                                    <input className="w-full p-3 border rounded-lg bg-gray-50" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="https://..." />
                                </div>
                            )}

                            {view === 'VIDEOS' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Video URL</label>
                                        <input 
                                            className="w-full p-3 border rounded-lg bg-gray-50" 
                                            value={formData.filename} 
                                            onChange={e => {
                                                const val = e.target.value;
                                                const thumb = extractYoutubeThumbnail(val);
                                                setFormData({ ...formData, filename: val, thumbnail: thumb || formData.thumbnail });
                                            }} 
                                            placeholder="YouTube or File URL" 
                                            required 
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Duration</label>
                                            <input className="w-full p-3 border rounded-lg bg-gray-50" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="e.g. 10:00" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                                            <select className="w-full p-3 border rounded-lg bg-gray-50" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                                <option value="lecture">Video Lecture</option>
                                                <option value="note">PDF Note</option>
                                                <option value="dpp">DPP / Quiz</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Thumbnail URL</label>
                                        <div className="flex gap-2">
                                            <input className="flex-1 p-3 border rounded-lg bg-gray-50" value={formData.thumbnail} onChange={e => setFormData({...formData, thumbnail: e.target.value})} placeholder="Auto-generated for YT" />
                                            {formData.thumbnail && <img src={formData.thumbnail} className="w-12 h-12 object-cover rounded border" alt="Prev" />}
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-brand text-white font-bold rounded-xl shadow-md hover:bg-brand-dark">Save</button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            <button onClick={openAddForm} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:bg-white hover:border-brand hover:text-brand transition-all flex items-center justify-center gap-2">
                                <Plus className="w-5 h-5" />
                                Add {view === 'SUBJECTS' ? 'Subject' : view === 'CHAPTERS' ? 'Chapter' : 'Lesson'}
                            </button>

                            {/* LIST RENDERING */}
                            {view === 'SUBJECTS' && subjects.map(sub => (
                                <div key={sub.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-brand transition-all cursor-pointer" onClick={() => navigateToChapters(sub.id)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-50 text-brand rounded-lg flex items-center justify-center font-bold text-sm">{sub.iconText}</div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">{sub.title}</h4>
                                            <p className="text-xs text-gray-400">{sub.chapters.length} Chapters</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); openEditForm(sub); }} className="p-2 text-gray-400 hover:text-brand bg-gray-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(sub.id); }} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}

                            {view === 'CHAPTERS' && activeSubject?.chapters.map(chap => (
                                <div key={chap.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-brand transition-all cursor-pointer" onClick={() => navigateToVideos(chap.id)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center font-bold text-xs">CH</div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">{chap.title}</h4>
                                            <p className="text-xs text-gray-400">{chap.videos.length} Videos</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); openEditForm(chap); }} className="p-2 text-gray-400 hover:text-brand bg-gray-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(chap.id); }} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}

                            {view === 'VIDEOS' && activeChapter?.videos.map(vid => (
                                <div key={vid.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-brand transition-all">
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        {vid.thumbnail ? (
                                            <img src={vid.thumbnail} className="w-16 h-10 object-cover rounded-md bg-gray-200" alt="" />
                                        ) : (
                                            <div className="w-16 h-10 bg-gray-100 rounded-md flex items-center justify-center"><VideoIcon className="w-5 h-5 text-gray-400" /></div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-gray-800 truncate">{vid.title}</h4>
                                            <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                                                <span className="uppercase font-bold bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{vid.type}</span>
                                                <span>{vid.duration}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-2">
                                        <button onClick={() => openEditForm(vid)} className="p-2 text-gray-400 hover:text-brand bg-gray-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(vid.id)} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex gap-3">
                    {view !== 'SUBJECTS' && !isFormOpen && (
                        <button onClick={navigateUp} className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100">Back</button>
                    )}
                    <button onClick={saveChanges} className="flex-1 py-3 bg-brand text-white font-bold rounded-xl shadow-lg hover:bg-brand-dark transition-colors">Save All Changes</button>
                </div>
            </div>
        </div>
    );
};

// --- PAGES ---

const AdminPanel = () => {
    const { currentUser, courses, addCourse, updateCourse, deleteCourse, users, manageUserRole } = useStore();
    const [tab, setTab] = useState<'batches' | 'users'>('batches');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Course | null>(null);
    const [contentTarget, setContentTarget] = useState<Course | null>(null);
    
    const [form, setForm] = useState({ 
      title: '', description: '', image: '', category: '', 
      price: 0, mrp: 0, isPaid: false, isNew: true 
    });

    useEffect(() => {
        if (editing) {
          setForm({ 
            title: editing.title, description: editing.description, image: editing.image, 
            category: editing.category, price: editing.price, mrp: editing.mrp, 
            isPaid: !!editing.isPaid, isNew: editing.isNew ?? true
          });
        } else {
          setForm({ title: '', description: '', image: '', category: '', price: 0, mrp: 0, isPaid: false, isNew: true });
        }
    }, [editing, showModal]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setForm(prev => ({ ...prev, image: reader.result as string }));
            reader.readAsDataURL(file);
        }
    };

    // Admins and Managers (Editors) can access
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.EDITOR)) return <Navigate to="/" />;

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
        <div className="pb-24 pt-20 px-4 min-h-screen bg-gray-50">
             <div className="max-w-4xl mx-auto">
                 <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 mb-8">
                    <button onClick={() => setTab('batches')} className={`flex-1 py-3 font-bold capitalize transition-all rounded-lg text-sm ${tab === 'batches' ? 'bg-brand text-white shadow-sm' : 'text-gray-400'}`}>
                        Batches & Content
                    </button>
                    {currentUser.role === UserRole.ADMIN && (
                      <button onClick={() => setTab('users')} className={`flex-1 py-3 font-bold capitalize transition-all rounded-lg text-sm ${tab === 'users' ? 'bg-brand text-white shadow-sm' : 'text-gray-400'}`}>
                          User Management
                      </button>
                    )}
                 </div>
                 {tab === 'batches' && (
                     <div className="space-y-4">
                         <button onClick={() => { setEditing(null); setShowModal(true); }} className="w-full py-8 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-bold flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                            <Plus className="w-8 h-8 text-brand/50" />
                            <span>Create New Batch</span>
                         </button>
                         <div className="grid gap-3">
                             {courses.map(c => (
                                 <div key={c.id} className="bg-white p-4 rounded-xl flex items-center gap-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                     <img src={c.image} className="w-16 h-16 rounded-lg object-cover bg-gray-100" alt="" />
                                     <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-800 text-base truncate">{c.title}</h3>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{c.category}</p>
                                     </div>
                                     <div className="flex gap-2">
                                         <button onClick={() => setContentTarget(c)} className="px-4 py-2 bg-brand text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm active:scale-95 transition-transform flex items-center gap-1"><FileText className="w-3 h-3" /> Content</button>
                                         <button onClick={() => { setEditing(c); setShowModal(true); }} className="p-2 text-gray-400 hover:text-brand transition-colors"><Edit className="w-4 h-4" /></button>
                                         {currentUser.role === UserRole.ADMIN && (
                                            <button onClick={() => { if(confirm('Are you sure you want to delete this batch?')) deleteCourse(c.id); }} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                         )}
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}
                 {tab === 'users' && currentUser.role === UserRole.ADMIN && (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                      <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-500 text-xs uppercase tracking-widest">
                        Total Users: {users.length}
                      </div>
                      <div className="divide-y divide-gray-50">
                      {users.map(u => (
                          <div key={u.id} className="p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                              <div><p className="font-bold text-gray-800">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                              <div className="flex items-center gap-3">
                                  <select 
                                    value={u.role}
                                    onChange={(e) => manageUserRole(u.id, e.target.value as UserRole)}
                                    disabled={u.id === currentUser.id} 
                                    className="text-xs font-bold px-3 py-2 bg-gray-100 rounded-lg border-none focus:ring-0 cursor-pointer outline-none"
                                  >
                                    <option value={UserRole.USER}>User</option>
                                    <option value={UserRole.EDITOR}>Manager</option>
                                    <option value={UserRole.ADMIN}>Admin</option>
                                  </select>
                              </div>
                          </div>
                      ))}
                      </div>
                    </div>
                )}
             </div>
             {showModal && (
                 <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">{editing ? 'Edit Batch' : 'Create Batch'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X /></button>
                        </div>
                        <form onSubmit={handleSaveCourse} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Batch Thumbnail</label>
                                <div className="aspect-video rounded-xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center relative shadow-inner group">
                                    {form.image ? (
                                        <img src={form.image} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <ImageIcon className="w-12 h-12 text-gray-300" />
                                    )}
                                    <label className="absolute bottom-4 right-4 p-3 bg-brand text-white rounded-xl cursor-pointer shadow-lg hover:scale-105 transition-transform z-10">
                                        <Upload className="w-5 h-5" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    </label>
                                </div>
                                <input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono" placeholder="Or paste image URL here..." />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Batch Title</label>
                                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl font-bold text-lg" placeholder="e.g. Class 10 Science" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm h-32 resize-none" placeholder="Batch Description" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                                    <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold uppercase tracking-widest" placeholder="e.g. Science" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Access</label>
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer h-[58px]" onClick={() => setForm(f => ({...f, isPaid: !f.isPaid}))}>
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.isPaid ? 'bg-brand border-brand' : 'border-gray-300 bg-white'}`}>
                                            {form.isPaid && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <span className="text-sm font-bold text-gray-600">{form.isPaid ? 'Paid' : 'Free'}</span>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-5 bg-brand text-white font-bold rounded-xl shadow-lg shadow-brand/20 active:scale-95 transition-all uppercase tracking-widest text-sm">Save Batch</button>
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
    const [filter, setFilter] = useState<'Paid' | 'Free'>('Free');
    const filteredCourses = courses.filter(c => filter === 'Paid' ? c.isPaid : !c.isPaid);

    return (
        <div className="pb-24 pt-20 px-4 min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white p-1 rounded-2xl border border-gray-100 flex shadow-sm">
                    {(['Paid', 'Free'] as const).map((t) => (
                        <button key={t} onClick={() => setFilter(t)} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${filter === t ? 'bg-brand text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>
                            {t} Courses
                        </button>
                    ))}
                </div>
                <div className="grid gap-6">
                    {filteredCourses.length === 0 ? (
                        <div className="text-center py-24 animate-fade-in flex flex-col items-center">
                            <Search className="w-16 h-16 text-gray-200 mb-4" />
                            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No batches found in this category.</p>
                        </div>
                    ) : (
                        filteredCourses.map(c => (
                            <Link key={c.id} to={`/course/${c.id}`} className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm block hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <img src={c.image} className="w-full aspect-video object-cover" alt="" />
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">{c.title}</h3>
                                        {c.isNew && <span className="text-[10px] font-bold bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-100 uppercase tracking-widest">New</span>}
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-6 leading-relaxed">{c.description}</p>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{c.category}</span>
                                        <span className="text-brand font-bold text-sm flex items-center gap-1">Open Batch <ChevronRight className="w-4 h-4" /></span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const CourseDetail = () => {
    const { id } = useParams<{id: string}>();
    const { courses } = useStore();
    const navigate = useNavigate();
    const [tab, setTab] = useState<'About' | 'Lessons' | 'Tests'>('Lessons');
    const course = courses.find(c => c.id === id);
    if (!course) return <Navigate to="/" />;

    return (
        <div className="pb-24 pt-0 min-h-screen bg-white">
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex items-center gap-5 p-5 px-6">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-gray-800" /></button>
                    <h1 className="text-xl font-bold text-gray-800 truncate tracking-tight">{course.title}</h1>
                </div>
                <div className="flex px-6 gap-8">
                    {(['About', 'Lessons', 'Tests'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`pb-4 text-sm font-bold uppercase tracking-widest border-b-4 transition-all ${tab === t ? 'text-brand border-brand' : 'text-gray-400 border-transparent'}`}>{t}</button>
                    ))}
                </div>
            </div>
            <Banner />
            <div className="p-6">
                {tab === 'Lessons' && (
                    <div className="space-y-5">
                        {course.subjects.map((sub) => (
                            <div key={sub.id} onClick={() => navigate(`/course/${course.id}/subject/${sub.id}`)} className="bg-gray-50 rounded-[28px] p-6 flex items-center justify-between border border-gray-100 hover:border-brand/30 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-brand font-bold text-xl border border-gray-200 group-hover:border-brand/20 shadow-sm">{sub.iconText}</div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg leading-tight">{sub.title}</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{sub.chapters.length} Chapters Available</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-6 h-6 text-gray-300 transition-transform group-hover:translate-x-1" />
                            </div>
                        ))}
                        {course.subjects.length === 0 && <div className="text-center py-24 text-gray-400 italic font-medium">No subjects found in this batch.</div>}
                    </div>
                )}
                {tab === 'About' && (
                    <div className="space-y-8 animate-fade-in">
                        <img src={course.image} className="w-full aspect-video object-cover rounded-[32px] shadow-lg" alt="" />
                        <div><h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Batch Overview</h2><p className="text-gray-600 leading-relaxed text-lg">{course.description}</p></div>
                    </div>
                )}
                {tab === 'Tests' && (
                    <div className="py-24 text-center">
                        <div className="mb-8 p-10 bg-gray-50 rounded-[40px] border border-dashed border-gray-200 inline-block">
                            <Bot className="w-16 h-16 text-brand/20 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Ready for Assessment?</h3>
                            <p className="text-gray-400 text-sm max-w-xs mx-auto">Generate a unique mock test powered by AI based on your course syllabus.</p>
                        </div>
                        <br />
                        <Link to={`/exam/${course.id}`} className="inline-block px-12 py-5 bg-brand text-white font-bold rounded-[24px] shadow-xl shadow-brand/20 hover:bg-brand-dark active:scale-95 transition-all uppercase tracking-widest text-sm">Initialize AI Test</Link>
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
        <div className="pb-24 min-h-screen bg-white">
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex items-center gap-5 p-5 px-6">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-gray-800" /></button>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">{subject.title}</h1>
                </div>
            </div>
            <div className="p-6 space-y-10">
                {subject.chapters.map((chap, idx) => (
                    <div key={chap.id} className="space-y-4">
                        <div className="flex items-center gap-4 mb-4 px-2">
                            {chap.image ? (
                                <img src={chap.image} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="" />
                            ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-400 text-xs">U{idx+1}</div>
                            )}
                            <div>
                                <h2 className="text-base font-bold text-gray-800 tracking-tight">{chap.title}</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Unit {idx + 1}</p>
                            </div>
                        </div>
                        <div className="grid gap-3">
                        {chap.videos.map(vid => (
                            <div key={vid.id} onClick={() => navigate(`/watch/${courseId}`)} className="bg-white p-5 rounded-[24px] flex items-center gap-5 border border-gray-100 group hover:border-brand hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all duration-300">
                                <div className="w-14 h-14 shrink-0 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 group-hover:bg-brand group-hover:text-white transition-all overflow-hidden relative">
                                    {vid.thumbnail ? (
                                        <img src={vid.thumbnail} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <PlayCircle className="w-7 h-7" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-gray-800 truncate mb-1 group-hover:text-brand transition-colors">{vid.title}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md uppercase tracking-widest">{vid.type}</span>
                                        <span className="text-[10px] text-gray-400 font-medium">{vid.duration}</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-brand/10 group-hover:text-brand transition-colors"><ChevronRight className="w-4 h-4" /></div>
                            </div>
                        ))}
                        </div>
                    </div>
                ))}
                {subject.chapters.length === 0 && <div className="text-center py-32 text-gray-400 font-medium italic opacity-50">No chapters have been added yet.</div>}
            </div>
        </div>
    );
};

const Profile = () => {
    const { currentUser, logout } = useStore();
    if (!currentUser) return <Navigate to="/login" />;
    return (
        <div className="pb-24 pt-24 px-6 min-h-screen bg-gray-50">
            <div className="max-w-md mx-auto space-y-6">
                <div className="bg-white rounded-[40px] p-10 border border-gray-100 text-center shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-brand opacity-10"></div>
                    <div className="w-24 h-24 bg-brand rounded-3xl flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6 shadow-xl shadow-brand/20">{currentUser.name.charAt(0)}</div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{currentUser.name}</h2>
                    <p className="text-sm text-gray-500 mb-8 font-medium">{currentUser.email}</p>
                    <div className="inline-block p-3 px-6 bg-gray-100 rounded-2xl text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-10 border border-gray-200/50">{currentUser.role} Account Access</div>
                    <button onClick={logout} className="w-full py-5 text-red-500 font-bold bg-red-50 rounded-2xl hover:bg-red-100 transition-colors shadow-sm active:scale-95 uppercase tracking-widest text-xs">Sign Out Identity</button>
                </div>
                {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.EDITOR) && (
                    <Link to="/admin" className="block w-full py-6 bg-gray-900 text-white rounded-[28px] text-center font-bold shadow-xl hover:bg-black active:scale-95 transition-all uppercase tracking-widest text-sm">
                        {currentUser.role === UserRole.ADMIN ? 'Admin Dashboard' : 'Manager Dashboard'}
                    </Link>
                )}
            </div>
        </div>
    );
};

const Login = () => {
    const { login, signup, currentUser } = useStore();
    const navigate = useNavigate();
    const [isSignup, setIsSignup] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', pass: '' });

    useEffect(() => { if (currentUser) navigate('/'); }, [currentUser, navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-brand">
            <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center text-brand text-4xl font-bold mb-10 shadow-2xl">S</div>
            <div className="bg-white p-10 rounded-[40px] w-full max-w-sm shadow-2xl border border-white/20 animate-slide-up">
                <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center tracking-tight italic">{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
                <form onSubmit={e => { e.preventDefault(); if(isSignup) signup(form.name, form.email, '', form.pass); else if (!login(form.email, form.pass)) alert('Identity mismatch. Please check your credentials.'); }} className="space-y-4">
                    {isSignup && <input className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-brand/10 outline-none transition-all font-medium text-gray-800 shadow-inner" placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />}
                    <input className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-brand/10 outline-none transition-all font-medium text-gray-800 shadow-inner" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                    <input className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-brand/10 outline-none transition-all font-medium text-gray-800 shadow-inner" type="password" placeholder="Password" value={form.pass} onChange={e => setForm({...form, pass: e.target.value})} required />
                    <button className="w-full py-5 bg-brand text-white font-bold rounded-2xl shadow-xl shadow-brand/20 mt-6 active:scale-95 transition-all uppercase tracking-widest">Proceed</button>
                </form>
                <button onClick={() => setIsSignup(!isSignup)} className="w-full mt-8 text-xs text-brand font-bold hover:underline uppercase tracking-widest">{isSignup ? 'Already registered? Login' : 'New User? Create Account'}</button>
            </div>
        </div>
    );
};

const MainContent = () => {
  const loc = useLocation();
  const { currentUser } = useStore();
  const isNoLayout = loc.pathname.startsWith('/watch') || loc.pathname.startsWith('/exam') || loc.pathname === '/login';
  
  return (
    <div className="min-h-screen bg-gray-50">
      {!isNoLayout && <STHeader />}
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
      {!isNoLayout && <STBottomNav />}
      
      {/* RESTRICT CHATBOT: Only accessible for authenticated users */}
      {currentUser && <ChatBot />}
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
