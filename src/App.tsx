
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { 
  Home, BookOpen, User, Search, PlayCircle, Lock, 
  LayoutDashboard, Plus, Trash2, Edit, X, 
  Bot, Loader2, ArrowLeft, 
  Video as VideoIcon, Bell, 
  ChevronRight, MoreVertical, Calendar,
  ImageIcon, Upload, Globe
} from './components/Icons';
import VideoPlayer from './components/VideoPlayer';
import ChatBot from './components/ChatBot';
import ExamMode from './components/ExamMode';
import { Course, Video, UserRole, Subject, Chapter } from './types';

// --- SHARED UI COMPONENTS ---

const Banner = () => (
  <div className="bg-blue-50 px-4 py-2 flex items-center justify-between text-xs font-medium text-blue-700 border-b border-blue-100">
    <span>Welcome to your learning portal! Explore your courses below.</span>
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
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-bold">S</div>
          <span className="font-bold text-gray-900 tracking-tight text-lg">{settings.appName}</span>
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 text-gray-400 hover:text-gray-600"><Bell className="w-5 h-5" /></button>
        <Link to="/profile" className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
            {currentUser ? <span className="text-xs font-bold text-gray-600">{currentUser.name.charAt(0)}</span> : <User className="w-4 h-4 text-gray-400" />}
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
    <nav className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200 flex items-center justify-around px-2 z-50 pb-safe shadow-lg">
      {tabs.map(tab => {
        const isActive = location.pathname === tab.path || (tab.path === '/' && location.pathname === '');
        return (
          <Link key={tab.path} to={tab.path} className={`flex flex-col items-center gap-0.5 flex-1 py-1 transition-colors ${isActive ? 'text-brand' : 'text-gray-400'}`}>
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

// --- CONTENT MANAGEMENT ---

const ContentManager = ({ course, onClose }: { course: Course, onClose: () => void }) => {
    const { updateCourse } = useStore();
    const [subjects, setSubjects] = useState<Subject[]>(course.subjects || []);
    const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

    const handleSave = () => {
        updateCourse({ ...course, subjects });
        onClose();
    };

    const addSubject = () => {
        const title = prompt('Subject Title:');
        if (title) setSubjects([...subjects, { id: Date.now().toString(), title, iconText: title.substring(0,2), chapters: [] }]);
    };

    const editSubject = (sId: string) => {
        const subject = subjects.find(s => s.id === sId);
        if (!subject) return;
        const newTitle = prompt('Rename Subject:', subject.title);
        const newIcon = prompt('Update Icon Text (2 chars):', subject.iconText);
        if (newTitle) {
            setSubjects(subjects.map(s => s.id === sId ? { ...s, title: newTitle, iconText: newIcon || s.iconText } : s));
        }
    };

    const addChapter = (sId: string) => {
        const title = prompt('Chapter Title:');
        if (title) {
            setSubjects(subjects.map(s => s.id === sId ? { ...s, chapters: [...s.chapters, { id: Date.now().toString(), title, videos: [] }] } : s));
        }
    };

    const editChapter = (sId: string, cId: string) => {
        const subject = subjects.find(s => s.id === sId);
        const chapter = subject?.chapters.find(c => c.id === cId);
        if (!chapter) return;
        const newTitle = prompt('Rename Chapter:', chapter.title);
        if (newTitle) {
            setSubjects(subjects.map(s => s.id === sId ? {
                ...s,
                chapters: s.chapters.map(c => c.id === cId ? { ...c, title: newTitle } : c)
            } : s));
        }
    };

    const addVideo = (sId: string, cId: string) => {
        const title = prompt('Lesson Title:');
        const url = prompt('Video URL:');
        const typeInput = prompt('Type (lecture/note/dpp):') || 'lecture';
        const type = (['lecture', 'note', 'dpp'].includes(typeInput) ? typeInput : 'lecture') as 'lecture' | 'note' | 'dpp';
        if (title && url) {
            setSubjects(subjects.map(s => s.id === sId ? { 
                ...s, 
                chapters: s.chapters.map(c => c.id === cId ? { 
                    ...c, 
                    videos: [...c.videos, { id: Date.now().toString(), title, filename: url, duration: '10:00', type, date: 'Today' }] 
                } : c)
            } : s));
        }
    };

    const editVideo = (sId: string, cId: string, vId: string) => {
        const subject = subjects.find(s => s.id === sId);
        const chapter = subject?.chapters.find(c => c.id === cId);
        const video = chapter?.videos.find(v => v.id === vId);
        if (!video) return;

        const newTitle = prompt('Rename Lesson:', video.title);
        const newUrl = prompt('Update Video URL:', video.filename);
        const newType = prompt('Update Type (lecture/note/dpp):', video.type) || 'lecture';

        if (newTitle && newUrl) {
            setSubjects(subjects.map(s => s.id === sId ? {
                ...s,
                chapters: s.chapters.map(c => c.id === cId ? {
                    ...c,
                    videos: c.videos.map(v => v.id === vId ? { 
                        ...v, 
                        title: newTitle, 
                        filename: newUrl, 
                        type: (['lecture', 'note', 'dpp'].includes(newType) ? newType : 'lecture') as any 
                    } : v)
                } : c)
            } : s));
        }
    };

    const activeSubject = subjects.find(s => s.id === activeSubjectId);
    const activeChapter = activeSubject?.chapters.find(c => c.id === activeChapterId);

    return (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xl rounded-2xl p-6 max-h-[80vh] flex flex-col shadow-xl">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h2 className="text-lg font-bold text-gray-800">Course Content Editor</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X /></button>
                </div>
                <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-gray-400">
                    <button onClick={() => { setActiveSubjectId(null); setActiveChapterId(null); }} className={!activeSubjectId ? 'text-brand' : ''}>Hierarchy</button>
                    {activeSubject && (
                      <><ChevronRight className="w-3 h-3" /><button onClick={() => setActiveChapterId(null)} className={!activeChapterId ? 'text-brand' : ''}>{activeSubject.title}</button></>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {activeChapterId && activeSubjectId ? (
                        <>
                            <button onClick={() => addVideo(activeSubjectId, activeChapterId)} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-bold hover:bg-gray-50">+ Add Lesson</button>
                            {activeChapter?.videos.map(vid => (
                                <div key={vid.id} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center group">
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium block truncate">{vid.title}</span>
                                        <span className="text-[10px] text-gray-400 uppercase font-bold">{vid.type}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => editVideo(activeSubjectId, activeChapterId, vid.id)} className="p-2 text-gray-400 hover:text-brand transition-colors"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => setSubjects(subjects.map(s => s.id === activeSubjectId ? {...s, chapters: s.chapters.map(c => c.id === activeChapterId ? {...c, videos: c.videos.filter(v => v.id !== vid.id)} : c)} : s))} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : activeSubjectId ? (
                        <>
                            <button onClick={() => addChapter(activeSubjectId)} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-bold hover:bg-gray-50">+ Add Chapter</button>
                            {activeSubject?.chapters.map(chap => (
                                <div key={chap.id} className="p-3 border border-gray-100 rounded-xl flex justify-between items-center group">
                                    <button onClick={() => setActiveChapterId(chap.id)} className="flex-1 text-left font-medium">{chap.title}</button>
                                    <div className="flex gap-1">
                                        <button onClick={() => editChapter(activeSubjectId, chap.id)} className="p-2 text-gray-400 hover:text-brand"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => setSubjects(subjects.map(s => s.id === activeSubjectId ? {...s, chapters: s.chapters.filter(c => c.id !== chap.id)} : s))} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            <button onClick={addSubject} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-bold hover:bg-gray-50">+ Add Subject</button>
                            {subjects.map(sub => (
                                <div key={sub.id} className="p-4 bg-gray-50 rounded-xl flex justify-between items-center group">
                                    <button onClick={() => setActiveSubjectId(sub.id)} className="flex-1 text-left font-bold text-gray-800">{sub.title}</button>
                                    <div className="flex gap-1">
                                        <button onClick={() => editSubject(sub.id)} className="p-2 text-gray-400 hover:text-brand transition-colors"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => setSubjects(subjects.filter(s => s.id !== sub.id))} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
                <div className="mt-6 pt-4 border-t flex gap-2">
                    <button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-brand text-white font-bold rounded-xl shadow-md">Update Course</button>
                </div>
            </div>
        </div>
    );
};

// --- PAGES ---

const AdminPanel = () => {
    const { currentUser, courses, addCourse, updateCourse, deleteCourse, users } = useStore();
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
        <div className="pb-24 pt-16 px-4 min-h-screen bg-gray-50">
             <div className="max-w-4xl mx-auto">
                 <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 mb-6">
                    {(['batches', 'users'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 font-bold capitalize transition-all rounded-lg text-sm ${tab === t ? 'bg-brand text-white' : 'text-gray-400'}`}>
                            {t === 'batches' ? 'Courses' : 'Users'}
                        </button>
                    ))}
                 </div>
                 {tab === 'batches' && (
                     <div className="space-y-4">
                         <button onClick={() => { setEditing(null); setShowModal(true); }} className="w-full py-6 bg-white border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold flex flex-col items-center justify-center gap-2 hover:bg-gray-50">
                            <Plus className="w-6 h-6" />
                            <span>Create New Course</span>
                         </button>
                         <div className="grid gap-3">
                             {courses.map(c => (
                                 <div key={c.id} className="bg-white p-3 rounded-xl flex items-center gap-4 border border-gray-200 shadow-sm">
                                     <img src={c.image} className="w-12 h-12 rounded-lg object-cover" alt="" />
                                     <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-800 text-sm truncate">{c.title}</h3>
                                        <p className="text-xs text-gray-500">{c.category}</p>
                                     </div>
                                     <div className="flex gap-2">
                                         <button onClick={() => setContentTarget(c)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">Content</button>
                                         <button onClick={() => { setEditing(c); setShowModal(true); }} className="p-2 text-gray-400 hover:text-brand"><Edit className="w-4 h-4" /></button>
                                         <button onClick={() => { if(confirm('Are you sure you want to delete this course?')) deleteCourse(c.id); }} className="p-2 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}
                 {tab === 'users' && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      <div className="divide-y divide-gray-100">
                      {users.map(u => (
                          <div key={u.id} className="p-4 flex justify-between items-center">
                              <div><p className="font-bold text-sm text-gray-800">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{u.role}</span>
                          </div>
                      ))}
                      </div>
                    </div>
                )}
             </div>
             {showModal && (
                 <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">{editing ? 'Edit Course' : 'Add New Course'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X /></button>
                        </div>
                        <form onSubmit={handleSaveCourse} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Thumbnail</label>
                                <div className="aspect-video rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center relative shadow-inner">
                                    {form.image ? (
                                        <img src={form.image} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-gray-300" />
                                    )}
                                    <label className="absolute bottom-3 right-3 p-2 bg-brand text-white rounded-full cursor-pointer shadow-lg hover:scale-105 transition-transform">
                                        <Upload className="w-4 h-4" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    </label>
                                </div>
                                <input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs" placeholder="Or paste image URL here..." />
                            </div>
                            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" placeholder="Course Title" required />
                            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm h-24" placeholder="Description" required />
                            <div className="grid grid-cols-2 gap-3">
                                <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="Category" required />
                                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer" onClick={() => setForm(f => ({...f, isPaid: !f.isPaid}))}>
                                    <input type="checkbox" checked={form.isPaid} readOnly />
                                    <span className="text-sm font-medium">Paid Access</span>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3 bg-brand text-white font-bold rounded-xl shadow-md">Save Changes</button>
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
        <div className="pb-24 pt-16 px-4 min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-white p-1 rounded-xl border border-gray-200 flex shadow-sm">
                    {(['Paid', 'Free'] as const).map((t) => (
                        <button key={t} onClick={() => setFilter(t)} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${filter === t ? 'bg-brand text-white' : 'text-gray-400'}`}>
                            {t} Courses
                        </button>
                    ))}
                </div>
                <div className="grid gap-4">
                    {filteredCourses.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 italic">No courses found in this category.</div>
                    ) : (
                        filteredCourses.map(c => (
                            <Link key={c.id} to={`/course/${c.id}`} className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm block hover:shadow-md transition-shadow">
                                <img src={c.image} className="w-full aspect-video object-cover" alt="" />
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{c.title}</h3>
                                        {c.isNew && <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-100">NEW</span>}
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">{c.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{c.category}</span>
                                        <span className="text-brand font-bold text-sm">Open Course →</span>
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
            <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
                <div className="flex items-center gap-4 p-4">
                    <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-6 h-6" /></button>
                    <h1 className="text-lg font-bold truncate">{course.title}</h1>
                </div>
                <div className="flex px-4 gap-6">
                    {(['About', 'Lessons', 'Tests'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm font-bold border-b-2 transition-all ${tab === t ? 'text-brand border-brand' : 'text-gray-400 border-transparent'}`}>{t}</button>
                    ))}
                </div>
            </div>
            <Banner />
            <div className="p-4">
                {tab === 'Lessons' && (
                    <div className="space-y-4">
                        {course.subjects.map((sub) => (
                            <div key={sub.id} onClick={() => navigate(`/course/${course.id}/subject/${sub.id}`)} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100 hover:border-brand/30 transition-colors cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-brand font-bold border border-gray-200">{sub.iconText}</div>
                                    <h3 className="font-bold text-gray-800">{sub.title}</h3>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </div>
                        ))}
                    </div>
                )}
                {tab === 'About' && (
                    <div className="space-y-6">
                        <img src={course.image} className="w-full aspect-video object-cover rounded-xl shadow-md" alt="" />
                        <div><h2 className="text-xl font-bold mb-2">About this Course</h2><p className="text-gray-600 leading-relaxed">{course.description}</p></div>
                    </div>
                )}
                {tab === 'Tests' && (
                    <div className="py-20 text-center">
                        <Link to={`/exam/${course.id}`} className="inline-block px-10 py-3 bg-brand text-white font-bold rounded-xl shadow-md hover:bg-brand-dark transition-colors">Start Mock Test</Link>
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
            <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
                <div className="flex items-center gap-4 p-4">
                    <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-6 h-6" /></button>
                    <h1 className="text-lg font-bold">{subject.title}</h1>
                </div>
            </div>
            <div className="p-4 space-y-6">
                {subject.chapters.map((chap) => (
                    <div key={chap.id} className="space-y-2">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">{chap.title}</h2>
                        {chap.videos.map(vid => (
                            <div key={vid.id} onClick={() => navigate(`/watch/${courseId}`)} className="bg-gray-50 p-4 rounded-xl flex items-center gap-4 border border-gray-100 group hover:border-brand/30 cursor-pointer transition-colors">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 group-hover:bg-brand group-hover:text-white transition-colors"><PlayCircle className="w-5 h-5" /></div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-gray-800 truncate">{vid.title}</h4>
                                    <p className="text-[10px] text-gray-500 font-medium uppercase">{vid.type} • {vid.duration}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
                {subject.chapters.length === 0 && <div className="text-center py-20 text-gray-400 font-medium italic">No content available yet.</div>}
            </div>
        </div>
    );
};

const Profile = () => {
    const { currentUser, logout } = useStore();
    if (!currentUser) return <Navigate to="/login" />;
    return (
        <div className="pb-24 pt-20 px-4 min-h-screen bg-gray-50">
            <div className="max-w-md mx-auto bg-white rounded-2xl p-8 border border-gray-200 text-center shadow-sm">
                <div className="w-20 h-20 bg-brand rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">{currentUser.name.charAt(0)}</div>
                <h2 className="text-xl font-bold text-gray-900">{currentUser.name}</h2>
                <p className="text-sm text-gray-500 mb-6">{currentUser.email}</p>
                <div className="p-3 bg-gray-50 rounded-lg text-xs font-bold text-gray-500 uppercase mb-8">{currentUser.role} Account</div>
                <button onClick={logout} className="w-full py-3 text-red-500 font-bold bg-red-50 rounded-xl hover:bg-red-100 transition-colors shadow-sm">Sign Out</button>
            </div>
            {currentUser.role === UserRole.ADMIN && (
                <Link to="/admin" className="block w-full max-w-md mx-auto mt-4 py-4 bg-gray-900 text-white rounded-xl text-center font-bold shadow-lg hover:bg-black transition-colors">Access Admin Panel</Link>
            )}
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
            <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-8 shadow-xl">S</div>
            <div className="bg-white p-8 rounded-2xl w-full max-w-sm shadow-xl border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{isSignup ? 'Create Account' : 'Student Login'}</h2>
                <form onSubmit={e => { e.preventDefault(); if(isSignup) signup(form.name, form.email, '', form.pass); else if (!login(form.email, form.pass)) alert('Invalid email or password'); }} className="space-y-4">
                    {isSignup && <input className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:border-brand outline-none transition-all" placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />}
                    <input className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:border-brand outline-none transition-all" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                    <input className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:border-brand outline-none transition-all" type="password" placeholder="Password" value={form.pass} onChange={e => setForm({...form, pass: e.target.value})} required />
                    <button className="w-full py-4 bg-brand text-white font-bold rounded-xl shadow-lg mt-4 hover:bg-brand-dark transition-colors">Continue</button>
                </form>
                <button onClick={() => setIsSignup(!isSignup)} className="w-full mt-6 text-sm text-brand font-bold hover:underline">{isSignup ? 'Back to Login' : 'Create an Account'}</button>
            </div>
        </div>
    );
};

const MainContent = () => {
  const loc = useLocation();
  const { currentUser } = useStore();
  const isNoLayout = loc.pathname.startsWith('/watch') || loc.pathname.startsWith('/exam') || loc.pathname === '/login';
  
  return (
    <div className="min-h-screen">
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
      
      {/* RESTRICT CHATBOT: Only accessible for signed up users */}
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
