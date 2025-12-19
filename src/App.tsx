
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { 
  Home, BookOpen, User, Search, PlayCircle, Lock, 
  LayoutDashboard, Plus, Trash2, Edit, X, 
  Bot, Loader2, ArrowLeft, 
  Video as VideoIcon, Bell, 
  ChevronRight, MoreVertical, Calendar,
  ImageIcon, Upload, Globe, Settings, FileText, CheckCircle,
  Folder, FileVideo, ChevronDown, Sparkles, LogOut, Shield
} from './components/Icons';
import VideoPlayer from './components/VideoPlayer';
import ChatBot from './components/ChatBot';
import ExamMode from './components/ExamMode';
import { GoogleGenAI } from "@google/genai";
import { Course, Chapter, Video, UserRole, Subject } from './types';

declare var process: { env: { API_KEY: string } };

// --- SHARED UI COMPONENTS ---

const Banner = () => (
  <div className="bg-blue-50 px-4 py-3 flex items-center justify-between text-xs font-medium text-blue-800 border-b border-blue-100">
    <span>Welcome to your learning dashboard.</span>
    <X className="w-4 h-4 text-blue-400 cursor-pointer" />
  </div>
);

const XPBadge = ({ xp = 0 }: { xp?: number }) => (
  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
    <div className="w-5 h-5 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center text-[10px] font-bold">XP</div>
    <span className="text-xs font-bold text-gray-700">{xp}</span>
  </div>
);

const STHeader = () => {
  const { currentUser, settings } = useStore();
  const location = useLocation();
  const isNoNav = ['/login', '/watch', '/exam', '/temp-access'].some(p => location.pathname.includes(p));
  const isTabbedView = location.pathname.startsWith('/course/') || location.pathname.startsWith('/subject/');

  if (isNoNav || isTabbedView) return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-bold text-lg">S</div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">{settings.appName}</span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-gray-500 hover:text-brand transition-colors"><Bell className="w-6 h-6" /></button>
        <Link to="/profile" className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
            {currentUser ? <span className="font-bold text-brand text-sm">{currentUser.name.charAt(0)}</span> : <User className="w-4 h-4 text-gray-400" />}
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
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-50 pb-safe">
      {tabs.map(tab => {
        const isActive = location.pathname === tab.path;
        return (
          <Link key={tab.path} to={tab.path} className={`flex flex-col items-center gap-1 flex-1 py-1 ${isActive ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}>
            <tab.icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

// --- CONTENT MANAGEMENT SYSTEM ---

const ContentManager = ({ course, onClose }: { course: Course, onClose: () => void }) => {
    const { updateCourse } = useStore();
    const [subjects, setSubjects] = useState<Subject[]>(() => {
        return (course.subjects || []).map(s => ({
            ...s,
            chapters: (s.chapters || []).map(c => ({
                ...c,
                videos: c.videos || []
            }))
        }));
    });
    
    const [view, setView] = useState<'SUBJECTS' | 'CHAPTERS' | 'VIDEOS'>('SUBJECTS');
    const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        title: '', iconText: '', image: '', filename: '', duration: '', type: 'lecture', thumbnail: ''
    });

    const navigateToChapters = (sId: string) => { setActiveSubjectId(sId); setView('CHAPTERS'); };
    const navigateToVideos = (cId: string) => { setActiveChapterId(cId); setView('VIDEOS'); };
    const navigateUp = () => {
        if (view === 'VIDEOS') { setView('CHAPTERS'); setActiveChapterId(null); }
        else if (view === 'CHAPTERS') { setView('SUBJECTS'); setActiveSubjectId(null); }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFormData(prev => ({ ...prev, thumbnail: reader.result as string }));
            reader.readAsDataURL(file);
        }
    };

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
                    image: formData.image,
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
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl h-[85vh] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-slide-up">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="font-bold text-gray-800">Content Manager</h2>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                            <button onClick={() => { setView('SUBJECTS'); setActiveSubjectId(null); setActiveChapterId(null); }} className={view === 'SUBJECTS' ? 'font-bold text-brand' : 'hover:text-brand'}>Subjects</button>
                            {activeSubject && <><ChevronRight className="w-3 h-3" /><button onClick={() => { setView('CHAPTERS'); setActiveChapterId(null); }} className={view === 'CHAPTERS' ? 'font-bold text-brand' : 'hover:text-brand'}>{activeSubject.title}</button></>}
                            {activeChapter && <><ChevronRight className="w-3 h-3" /><span className="font-bold text-brand">{activeChapter.title}</span></>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5 text-gray-600" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {isFormOpen ? (
                        <form onSubmit={handleFormSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <h3 className="font-bold text-gray-800 border-b pb-2">{editingItem ? 'Edit' : 'Add'} Item</h3>
                            <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Title</label><input className="w-full p-3 border rounded-lg bg-gray-50" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required /></div>
                            
                            {view === 'SUBJECTS' && (
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Icon (2 chars)</label><input className="w-full p-3 border rounded-lg bg-gray-50" value={formData.iconText} onChange={e => setFormData({...formData, iconText: e.target.value})} maxLength={2} /></div>
                            )}

                            {view === 'VIDEOS' && (
                                <>
                                    <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">URL</label><input className="w-full p-3 border rounded-lg bg-gray-50" value={formData.filename} onChange={e => setFormData({...formData, filename: e.target.value})} required /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Duration</label><input className="w-full p-3 border rounded-lg bg-gray-50" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} /></div>
                                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Type</label><select className="w-full p-3 border rounded-lg bg-gray-50" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="lecture">Video</option><option value="note">PDF</option><option value="dpp">Quiz</option></select></div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Thumbnail</label>
                                        <div className="flex gap-2">
                                            <input value={formData.thumbnail} onChange={e => setFormData({...formData, thumbnail: e.target.value})} className="flex-1 p-3 border rounded-lg bg-gray-50 text-xs" placeholder="https://... or upload" />
                                            <label className="p-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 border border-gray-200">
                                                <Upload className="w-5 h-5 text-gray-600" />
                                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                            </label>
                                        </div>
                                        {formData.thumbnail && (
                                            <img src={formData.thumbnail} className="mt-2 w-24 h-14 object-cover rounded-lg border border-gray-200" alt="Preview" />
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3 text-gray-600 bg-gray-100 font-bold rounded-lg hover:bg-gray-200">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-brand text-white font-bold rounded-lg hover:bg-brand-dark">Save</button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            <button onClick={openAddForm} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:bg-white hover:border-brand hover:text-brand flex items-center justify-center gap-2">
                                <Plus className="w-5 h-5" /> Add New
                            </button>
                            
                            {view === 'SUBJECTS' && subjects.map(sub => (
                                <div key={sub.id} onClick={() => navigateToChapters(sub.id)} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center cursor-pointer hover:border-brand hover:shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 text-brand rounded-lg flex items-center justify-center font-bold text-sm">{sub.iconText}</div>
                                        <div><h4 className="font-bold text-gray-800">{sub.title}</h4><p className="text-xs text-gray-500">{sub.chapters.length} Chapters</p></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); openEditForm(sub); }} className="p-2 text-gray-400 hover:text-brand"><Edit className="w-4 h-4" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(sub.id); }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}

                            {view === 'CHAPTERS' && activeSubject?.chapters.map(chap => (
                                <div key={chap.id} onClick={() => navigateToVideos(chap.id)} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center cursor-pointer hover:border-brand hover:shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center"><Folder className="w-5 h-5" /></div>
                                        <div><h4 className="font-bold text-gray-800">{chap.title}</h4><p className="text-xs text-gray-500">{chap.videos.length} Items</p></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); openEditForm(chap); }} className="p-2 text-gray-400 hover:text-brand"><Edit className="w-4 h-4" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(chap.id); }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}

                            {view === 'VIDEOS' && activeChapter?.videos.map(vid => (
                                <div key={vid.id} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center hover:border-brand hover:shadow-sm">
                                    <div className="flex items-center gap-3">
                                        {vid.thumbnail ? (
                                            <img src={vid.thumbnail} className="w-10 h-10 object-cover rounded-lg" alt="" />
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center"><FileVideo className="w-5 h-5" /></div>
                                        )}
                                        <div><h4 className="font-bold text-gray-800 text-sm">{vid.title}</h4><p className="text-xs text-gray-500 uppercase">{vid.type}</p></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEditForm(vid)} className="p-2 text-gray-400 hover:text-brand"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(vid.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t bg-white flex gap-3">
                    {view !== 'SUBJECTS' && !isFormOpen && <button onClick={navigateUp} className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200">Back</button>}
                    {!isFormOpen && <button onClick={saveChanges} className="flex-1 py-2 bg-brand text-white font-bold rounded-lg hover:bg-brand-dark">Save Changes</button>}
                </div>
            </div>
        </div>
    );
};

// --- ADMIN PANEL ---

const AdminPanel = () => {
    const { currentUser, courses, addCourse, updateCourse, deleteCourse, users, manageUserRole, createUser } = useStore();
    const [tab, setTab] = useState<'batches' | 'users'>('batches');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Course | null>(null);
    const [contentTarget, setContentTarget] = useState<Course | null>(null);
    
    // User Creation State
    const [showUserModal, setShowUserModal] = useState(false);
    const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: UserRole.USER });

    const [form, setForm] = useState({ title: '', description: '', image: '', category: '', price: 0, mrp: 0, isPaid: false, isNew: true, accessKey: '', shortenerLink: '', telegramLink: '', startDate: '', endDate: '' });

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
                isNew: editing.isNew ?? true,
                accessKey: editing.accessKey || '',
                shortenerLink: editing.shortenerLink || '',
                telegramLink: editing.telegramLink || '',
                startDate: editing.startDate || '',
                endDate: editing.endDate || ''
            });
        }
        else setForm({ title: '', description: '', image: '', category: '', price: 0, mrp: 0, isPaid: false, isNew: true, accessKey: '', shortenerLink: '', telegramLink: '', startDate: '', endDate: '' });
    }, [editing, showModal]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setForm(prev => ({ ...prev, image: reader.result as string }));
            reader.readAsDataURL(file);
        }
    };

    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.EDITOR)) return <Navigate to="/" />;

    const handleSaveCourse = (e: React.FormEvent) => {
        e.preventDefault();
        const data: Course = { ...(editing || { id: Date.now().toString(), subjects: [], createdAt: new Date().toISOString() }), ...form };
        if (editing) updateCourse(data); else addCourse(data);
        setShowModal(false);
    };

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        createUser({
            id: Date.now().toString(),
            name: userForm.name,
            email: userForm.email,
            phone: '',
            password: userForm.password,
            role: userForm.role,
            purchasedCourseIds: [],
            lastLogin: new Date().toISOString(),
            tempAccess: {}
        });
        setShowUserModal(false);
        setUserForm({ name: '', email: '', password: '', role: UserRole.USER });
    };

    return (
        <div className="pb-24 pt-20 px-4 min-h-screen bg-gray-50">
             <div className="max-w-4xl mx-auto">
                 <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 mb-8">
                    <button onClick={() => setTab('batches')} className={`flex-1 py-2.5 font-bold text-sm rounded-lg ${tab === 'batches' ? 'bg-brand text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>Batches</button>
                    {currentUser.role === UserRole.ADMIN && <button onClick={() => setTab('users')} className={`flex-1 py-2.5 font-bold text-sm rounded-lg ${tab === 'users' ? 'bg-brand text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>Users</button>}
                 </div>

                 {tab === 'batches' && (
                     <div className="space-y-4">
                         <button onClick={() => { setEditing(null); setShowModal(true); }} className="w-full py-6 bg-white border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold flex flex-col items-center justify-center gap-2 hover:border-brand hover:text-brand transition-colors">
                            <Plus className="w-6 h-6" /> Create New Batch
                         </button>
                         <div className="grid gap-3">
                             {courses.map(c => (
                                 <div key={c.id} className="bg-white p-4 rounded-xl flex items-center gap-4 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                     <img src={c.image} className="w-16 h-16 rounded-lg object-cover bg-gray-100" alt="" />
                                     <div className="flex-1">
                                        <h3 className="font-bold text-gray-800">{c.title}</h3>
                                        <p className="text-xs text-gray-500">{c.category} • {c.isPaid ? 'Paid' : 'Free'}</p>
                                     </div>
                                     <div className="flex gap-2">
                                         <button onClick={() => setContentTarget(c)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200">Content</button>
                                         <button onClick={() => { setEditing(c); setShowModal(true); }} className="p-2 text-gray-400 hover:text-brand bg-gray-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                                         {currentUser.role === UserRole.ADMIN && <button onClick={() => { if(confirm('Delete?')) deleteCourse(c.id); }} className="p-2 text-red-400 hover:text-red-600 bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                {tab === 'users' && (
                    <div className="space-y-4">
                        <button onClick={() => setShowUserModal(true)} className="w-full py-4 bg-white border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-brand hover:text-brand flex items-center justify-center gap-2">
                            <Plus className="w-5 h-5" /> Create New User
                        </button>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {users.map(u => (
                                <div key={u.id} className="p-4 border-b last:border-0 flex justify-between items-center hover:bg-gray-50">
                                    <div><p className="font-bold text-gray-800">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></div>
                                    <select value={u.role} onChange={(e) => manageUserRole(u.id, e.target.value as UserRole)} disabled={u.id === currentUser.id} className="text-xs font-bold px-3 py-1 bg-gray-100 rounded-lg border-none outline-none">
                                        <option value={UserRole.USER}>User</option><option value={UserRole.EDITOR}>Manager</option><option value={UserRole.ADMIN}>Admin</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>

             {/* Batch Modal */}
             {showModal && (
                 <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">{editing ? 'Edit Batch' : 'New Batch'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
                        </div>
                        <form onSubmit={handleSaveCourse} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Image URL</label>
                                <div className="flex gap-2">
                                    <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="flex-1 p-3 border rounded-lg bg-gray-50" placeholder="https://..." />
                                    <label className="p-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200"><Upload className="w-5 h-5 text-gray-600" /><input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} /></label>
                                </div>
                            </div>
                            <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-3 border rounded-lg bg-gray-50" required /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-3 border rounded-lg bg-gray-50 h-24 resize-none" required /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Category</label><input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full p-3 border rounded-lg bg-gray-50" required /></div>
                                <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => setForm({...form, isPaid: !form.isPaid})}>
                                    <div className={`w-4 h-4 rounded border ${form.isPaid ? 'bg-brand border-brand' : 'bg-white border-gray-300'}`}></div><span className="text-sm font-bold text-gray-600">Paid Course</span>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3 bg-brand text-white font-bold rounded-lg hover:bg-brand-dark shadow-md mt-4">Save Batch</button>
                        </form>
                    </div>
                 </div>
             )}

             {/* Create User Modal */}
             {showUserModal && (
                 <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Create New User</h2>
                            <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
                        </div>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Full Name</label><input value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className="w-full p-3 border rounded-lg bg-gray-50" required /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Email</label><input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="w-full p-3 border rounded-lg bg-gray-50" required /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Password</label><input type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className="w-full p-3 border rounded-lg bg-gray-50" required /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Role</label>
                                <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value as UserRole })} className="w-full p-3 border rounded-lg bg-gray-50">
                                    <option value={UserRole.USER}>User</option>
                                    <option value={UserRole.EDITOR}>Manager</option>
                                    <option value={UserRole.ADMIN}>Admin</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full py-3 bg-brand text-white font-bold rounded-lg hover:bg-brand-dark shadow-md mt-4">Create User</button>
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
        <div className="pb-24 pt-20 px-4 min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white p-1 rounded-xl border border-gray-200 flex shadow-sm">
                    {(['Paid', 'Free'] as const).map((t) => (
                        <button key={t} onClick={() => setFilter(t)} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${filter === t ? 'bg-gray-100 text-brand' : 'text-gray-400 hover:bg-gray-50'}`}>
                            {t} Courses
                        </button>
                    ))}
                </div>

                <div className="space-y-6">
                    {filteredCourses.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="font-medium text-sm">No batches found.</p>
                        </div>
                    ) : filteredCourses.map(c => (
                        <Link key={c.id} to={`/course/${c.id}`} className="block bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all">
                            <div className="relative">
                                <img src={c.image} className="w-full aspect-video object-cover" alt={c.title} />
                                {c.isNew && <span className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">NEW</span>}
                            </div>
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{c.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{c.description}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <span className="text-xs font-bold text-gray-400 uppercase">{c.category}</span>
                                    <span className="text-brand text-sm font-bold flex items-center gap-1">View Details <ChevronRight className="w-4 h-4" /></span>
                                </div>
                            </div>
                        </Link>
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
    const [activeTab, setActiveTab] = useState<'Subjects' | 'Description'>('Subjects');

    const course = courses.find(c => c.id === id);
    if (!course) return <Navigate to="/" />;

    return (
        <div className="pb-24 pt-0 min-h-screen bg-white">
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 p-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-700" /></button>
                    <h1 className="text-lg font-bold text-gray-900 truncate flex-1">{course.title}</h1>
                </div>
                <div className="flex px-4 gap-6">
                    {(['Subjects', 'Description'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'text-brand border-brand' : 'text-gray-400 border-transparent'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
            <Banner />
            <div className="p-4">
                {activeTab === 'Subjects' && (
                    <div className="space-y-3">
                        {(course.subjects || []).map((sub) => (
                            <div key={sub.id} onClick={() => navigate(`/course/${course.id}/subject/${sub.id}`)} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-brand cursor-pointer shadow-sm">
                                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-brand font-bold text-lg">{sub.iconText}</div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800">{sub.title}</h3>
                                    <p className="text-xs text-gray-500">{sub.chapters.length} Chapters</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'Description' && (
                    <div className="space-y-6">
                        <img src={course.image} className="w-full rounded-2xl shadow-sm" alt="" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">About this Batch</h2>
                            <p className="text-gray-600 leading-relaxed text-sm">{course.description}</p>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex justify-center pb-safe">
                <Link to={`/exam/${course.id}`} className="flex items-center gap-2 px-6 py-3 bg-brand text-white font-bold rounded-full shadow-lg hover:bg-brand-dark transition-transform active:scale-95">
                    <Bot className="w-5 h-5" /> Take AI Assessment
                </Link>
            </div>
        </div>
    );
};

const SubjectDetail = () => {
    const { courseId, subjectId } = useParams<{courseId: string, subjectId: string}>();
    const { courses } = useStore();
    const navigate = useNavigate();
    const [generatingNotes, setGeneratingNotes] = useState(false);
    const [notes, setNotes] = useState<string | null>(null);
    
    const course = courses.find(c => c.id === courseId);
    const subject = course?.subjects.find(s => s.id === subjectId);
    if (!subject || !courseId) return <Navigate to="/" />;

    const handleGenerateNotes = async () => {
        setGeneratingNotes(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Provide a concise study summary for ${subject.title} covering: ${subject.chapters.map(c => c.title).join(', ')}.`;
            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            setNotes(response.text || "Could not generate summary.");
        } catch (e) { alert("AI Service Unavailable"); } finally { setGeneratingNotes(false); }
    };

    return (
        <div className="pb-24 min-h-screen bg-white">
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-700" /></button>
                        <h1 className="text-lg font-bold text-gray-800">{subject.title}</h1>
                    </div>
                    <button onClick={handleGenerateNotes} className="text-brand p-2 hover:bg-blue-50 rounded-full" title="Generate AI Summary">
                        {generatingNotes ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {subject.chapters.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 text-sm">No chapters available yet.</div>
                ) : subject.chapters.map((chap, idx) => (
                    <div key={chap.id} className="space-y-3">
                        <h3 className="font-bold text-gray-400 text-xs uppercase tracking-wider pl-1">Chapter {idx + 1}</h3>
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-800">{chap.title}</div>
                            <div className="divide-y divide-gray-100">
                                {chap.videos.map(v => (
                                    <div key={v.id} onClick={() => navigate(`/watch/${courseId}`)} className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors group">
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 group-hover:text-brand transition-colors">
                                            {v.type === 'note' ? <FileText className="w-5 h-5 text-gray-500" /> : <PlayCircle className="w-5 h-5 text-gray-500" />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-gray-700">{v.title}</h4>
                                            <p className="text-xs text-gray-400 mt-0.5">{v.type?.toUpperCase()} • {v.duration}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {notes && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setNotes(null)}>
                    <div className="bg-white w-full max-w-lg max-h-[80vh] rounded-2xl p-6 overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand" /> AI Summary</h2>
                            <button onClick={() => setNotes(null)}><X className="text-gray-400" /></button>
                        </div>
                        <div className="prose prose-sm text-gray-600">{notes}</div>
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
        <div className="pb-24 pt-20 px-4 min-h-screen bg-gray-50">
            <div className="max-w-md mx-auto space-y-6">
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center">
                    <div className="w-20 h-20 bg-brand rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                        {currentUser.name.charAt(0)}
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">{currentUser.name}</h2>
                    <p className="text-gray-500 text-sm mb-6">{currentUser.email}</p>
                    <div className="inline-block px-4 py-1.5 bg-gray-100 rounded-full text-xs font-bold text-gray-600 uppercase mb-8">{currentUser.role}</div>
                    
                    <button onClick={logout} className="w-full py-3 text-red-500 font-bold bg-red-50 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
                {currentUser.role === UserRole.ADMIN && (
                    <Link to="/admin" className="block w-full py-4 bg-gray-800 text-white rounded-xl text-center font-bold shadow-lg hover:bg-black transition-colors">
                        <Shield className="w-4 h-4 inline mr-2" /> Admin Dashboard
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
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg shadow-blue-200">S</div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-500 text-sm mt-2">Sign in to continue your learning journey.</p>
                </div>
                
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                    <form onSubmit={e => { e.preventDefault(); if(isSignup) signup(form.name, form.email, '', form.pass); else if (!login(form.email, form.pass)) alert('Invalid credentials'); }} className="space-y-4">
                        {isSignup && <input className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-brand focus:ring-0 outline-none transition-colors" placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />}
                        <input className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-brand focus:ring-0 outline-none transition-colors" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                        <input className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-brand focus:ring-0 outline-none transition-colors" type="password" placeholder="Password" value={form.pass} onChange={e => setForm({...form, pass: e.target.value})} required />
                        <button className="w-full py-4 bg-brand text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-brand-dark transition-all mt-2">{isSignup ? 'Create Account' : 'Sign In'}</button>
                    </form>
                    <div className="mt-6 text-center">
                        <button onClick={() => setIsSignup(!isSignup)} className="text-sm font-bold text-brand hover:underline">{isSignup ? 'Already have an account? Sign In' : 'Create new account'}</button>
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
