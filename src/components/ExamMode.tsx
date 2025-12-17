
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Timer, CheckCircle, AlertCircle, ArrowLeft, Loader2, List, PlayCircle, Bot, Save, LogOut, RotateCcw, Brain } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Course, Question, Exam, ExamProgress } from '../types';
import { useStore } from '../store';

declare var process: { env: { API_KEY: string } };

// Helper to clean JSON from AI response (Markdown/Text stripping)
const cleanJson = (text: string) => {
  try {
    // 1. Remove markdown code blocks if present
    let cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
    // 2. Locate the first '[' or '{'
    const firstBracket = cleaned.search(/\[|\{/);
    // 3. Locate the last ']' or '}'
    const lastBracket = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
    
    if (firstBracket !== -1 && lastBracket !== -1) {
       cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error", e);
    // Attempt direct parse as fallback
    return JSON.parse(text);
  }
};

const ExamMode = () => {
  const { id } = useParams();
  const { courses, saveExamResult, saveExamProgress, clearExamProgress, currentUser } = useStore();
  const navigate = useNavigate();
  
  const course = courses.find(c => c.id === id);
  
  // States
  const [view, setView] = useState<'selection' | 'taking' | 'review'>('selection');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [resumePrompt, setResumePrompt] = useState<ExamProgress | null>(null);
  
  // Track if we've already checked for saved progress to prevent loops
  const hasCheckedProgress = useRef(false);

  // Validate Course
  if (!course) return <Navigate to="/" />;

  // Check for saved progress on mount (and when user data loads)
  useEffect(() => {
    // CRITICAL FIX: If we are already in 'taking' or 'review' mode, do NOT check for saved progress.
    if (view !== 'selection') return;

    if (currentUser?.savedExamProgress) {
      const saved = currentUser.savedExamProgress.find(p => p.courseId === course.id);
      if (saved) {
        setResumePrompt(saved);
        return; 
      }
    }
  }, [course, currentUser, view]);

  // Timer Logic
  useEffect(() => {
    if (view !== 'taking' || loading || isFinished || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [view, loading, isFinished, timeLeft]);

  // Auto-save progress
  useEffect(() => {
    if (view === 'taking' && !loading && !isFinished && questions.length > 0) {
      const timeout = setTimeout(() => {
        saveProgress();
      }, 2000); // Increased to 2s debounce
      return () => clearTimeout(timeout);
    }
  }, [answers, currentQuestionIdx, timeLeft]); // Added timeLeft to ensure regular saves

  const saveProgress = () => {
    // Don't save if 0 time left
    if (timeLeft <= 0) return;
    
    saveExamProgress({
      courseId: course.id,
      questions,
      answers,
      timeLeft,
      lastSaved: new Date().toISOString(),
      isAiGenerated
    });
  };

  const handleResume = () => {
    if (resumePrompt) {
      setQuestions(resumePrompt.questions);
      setAnswers(resumePrompt.answers);
      setTimeLeft(resumePrompt.timeLeft);
      setIsAiGenerated(resumePrompt.isAiGenerated);
      setView('taking');
      setResumePrompt(null);
    }
  };

  const handleDiscardSaved = () => {
    clearExamProgress(course.id);
    setResumePrompt(null);
    setView('selection');
  };

  const startAiExam = async () => {
    setView('taking');
    setLoading(true);
    setQuestions([]);
    setError('');
    setIsAiGenerated(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chapterContext = course.chapters.map(c => 
        `Chapter: ${c.title} (Topics: ${c.videos.map(v => v.title).join(', ')})`
      ).join('; ');

      const prompt = `Act as a strict exam setter for a school. Create 10 multiple choice questions for the course "${course.title}".
      The course specifically covers these topics: ${chapterContext || course.description}.
      Questions must be strictly relevant. Format strictly as a JSON array of objects with keys: "id", "question", "options" (array of 4 strings), "correctAnswer" (number index 0-3).`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const text = response.text;
      if (text) {
        const data = cleanJson(text); // Use robust cleaner here
        if (Array.isArray(data) && data.length > 0) {
            setQuestions(data);
            setAnswers(new Array(data.length).fill(-1));
            setTimeLeft(data.length * 60);
            setLoading(false);
        } else {
            throw new Error("Invalid question format received");
        }
      } else {
        throw new Error("No data returned");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate exam. Please check your connection or try again.");
      setLoading(false);
      setView('selection');
      alert("Failed to generate exam. Please try again.");
    }
  };

  const startManualExam = (exam: Exam) => {
    setQuestions(exam.questions);
    setAnswers(new Array(exam.questions.length).fill(-1));
    setTimeLeft(exam.questions.length * 60);
    setIsAiGenerated(false);
    setView('taking');
  };

  const handleAnswer = (optionIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIdx] = optionIdx;
    setAnswers(newAnswers);
  };

  const finishExam = () => {
    let calculatedScore = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) calculatedScore++;
    });
    setScore(calculatedScore);
    setIsFinished(true);
    saveExamResult(course.id, calculatedScore, questions.length);
    clearExamProgress(course.id);
  };

  const saveAndExit = () => {
    saveProgress();
    navigate(`/course/${course.id}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- Views ---

  if (resumePrompt) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
         <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center animate-fade-in">
            <h2 className="text-2xl font-display font-bold mb-2 text-gray-900">Resume Exam?</h2>
            <p className="text-gray-500 mb-6 text-sm">
               You have an unfinished exam saved on {new Date(resumePrompt.lastSaved).toLocaleDateString()}.
            </p>
            <div className="flex gap-3">
               <button onClick={handleDiscardSaved} className="flex-1 py-3 text-red-500 font-bold border-2 border-red-50 rounded-2xl hover:bg-red-50 transition-colors">
                  Discard
               </button>
               <button onClick={handleResume} className="flex-1 py-3 bg-brand text-white font-bold rounded-2xl shadow-lg shadow-brand/30 hover:shadow-brand/50 transition-all">
                  Resume
               </button>
            </div>
         </div>
      </div>
    );
  }

  if (view === 'selection') {
    return (
       <div className="min-h-screen bg-gray-50 p-6 pt-24">
          <div className="flex items-center gap-3 mb-8">
             <button onClick={() => navigate(`/course/${course.id}`)} className="bg-white p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
               <ArrowLeft className="w-5 h-5 text-gray-600" />
             </button>
             <h2 className="text-3xl font-display font-bold text-gray-900">Select Exam</h2>
          </div>
          
          <div className="grid gap-4 max-w-xl mx-auto">
            {/* AI Generator Option */}
            <button 
               onClick={startAiExam}
               className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-glow text-left text-white flex items-center justify-between group hover:scale-[1.02] transition-transform"
            >
               <div>
                  <h3 className="font-bold text-xl font-display flex items-center gap-2">
                    <Brain className="w-5 h-5 text-white/80"/> AI Mock Test
                  </h3>
                  <p className="text-white/70 text-sm mt-1">Generate a unique test instantly</p>
               </div>
               <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                  <PlayCircle className="w-6 h-6 text-white" />
               </div>
            </button>

            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mt-4">Available Tests</h3>

            {/* Manual Exams */}
            {course.exams?.length === 0 && (
                <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-300">
                    <p className="text-gray-400 font-medium">No tests created yet.</p>
                </div>
            )}

            {course.exams?.map((exam) => (
               <button 
                 key={exam.id}
                 onClick={() => startManualExam(exam)}
                 className="bg-white p-5 rounded-2xl shadow-card border border-gray-100 text-left hover:border-brand transition-all flex items-center justify-between group"
               >
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-brand transition-colors">{exam.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1"><List className="w-3 h-3"/> {exam.questions.length} Qs</span>
                        <span className="flex items-center gap-1"><Timer className="w-3 h-3"/> {exam.questions.length} Mins</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
                      <PlayCircle className="w-5 h-5" />
                  </div>
               </button>
            ))}
          </div>
       </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-brand animate-spin mb-4" />
            <h2 className="text-xl font-bold text-gray-800">Creating Your Exam</h2>
            <p className="text-gray-500 text-center max-w-xs mt-2 text-sm">
            AI is analyzing {course.title} to prepare high-quality questions.
            </p>
        </div>
      </div>
    );
  }

  // REVIEW MODE
  if (view === 'review') {
    const currentQ = questions[currentQuestionIdx];
    const userAnswer = answers[currentQuestionIdx];
    const isCorrect = userAnswer === currentQ.correctAnswer;

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col pb-safe">
         <div className="bg-white/80 backdrop-blur-md border-b p-4 flex justify-between items-center sticky top-0 z-10">
            <button onClick={() => navigate(`/course/${course.id}`)} className="text-gray-600 flex items-center gap-2 font-bold hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">
               <ArrowLeft className="w-5 h-5" /> Exit Review
            </button>
         </div>

         <div className="flex-1 p-4 max-w-2xl mx-auto w-full overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Question {currentQuestionIdx + 1}</span>
                 {userAnswer === -1 ? (
                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">Skipped</span>
                 ) : isCorrect ? (
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Correct</span>
                 ) : (
                    <span className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Incorrect</span>
                 )}
              </div>
              <h2 className="text-xl font-display font-bold text-gray-900 leading-snug">
                {currentQ.question}
              </h2>
            </div>

            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                 let style = "bg-white border-gray-200 text-gray-700 opacity-60";
                 let icon = null;

                 if (idx === currentQ.correctAnswer) {
                    style = "bg-green-50 border-green-500 text-green-900 font-bold opacity-100 shadow-md ring-1 ring-green-500";
                    icon = <CheckCircle className="w-5 h-5 text-green-600" />;
                 } else if (idx === userAnswer && idx !== currentQ.correctAnswer) {
                    style = "bg-red-50 border-red-500 text-red-900 font-bold opacity-100 shadow-md";
                    icon = <AlertCircle className="w-5 h-5 text-red-600" />;
                 }

                 return (
                   <div key={idx} className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${style}`}>
                     <div className="flex items-center gap-3">
                        <span className="w-8 h-8 flex-none rounded-full bg-white/50 border border-current flex items-center justify-center text-sm font-bold">
                            {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                     </div>
                     {icon}
                   </div>
                 );
              })}
            </div>
         </div>

         <div className="bg-white/80 backdrop-blur border-t p-4 flex justify-between max-w-2xl mx-auto w-full">
            <button 
              onClick={() => setCurrentQuestionIdx(curr => Math.max(0, curr - 1))}
              disabled={currentQuestionIdx === 0}
              className="px-6 py-3 text-gray-500 font-bold disabled:opacity-30 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center text-sm font-bold text-gray-400">
               {currentQuestionIdx + 1} / {questions.length}
            </div>
            <button 
              onClick={() => setCurrentQuestionIdx(curr => Math.min(questions.length - 1, curr + 1))}
              disabled={currentQuestionIdx === questions.length - 1}
              className="px-6 py-3 bg-brand text-white rounded-xl font-bold shadow-lg shadow-brand/20 disabled:opacity-50"
            >
              Next
            </button>
         </div>
      </div>
    );
  }

  // FINISHED SCREEN
  if (isFinished) {
    const percentage = (score / questions.length) * 100;
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center animate-slide-up">
          <div className="w-24 h-24 bg-gradient-to-tr from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/40">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">Great Job!</h2>
          <p className="text-gray-500 mb-8">You have completed the test for {course.title}</p>
          
          <div className="bg-gray-50 rounded-3xl p-8 mb-8 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-200">
                <div className="h-full bg-brand transition-all duration-1000" style={{width: `${percentage}%`}}></div>
            </div>
            <div className="text-5xl font-display font-bold text-gray-900 mb-2">{score}<span className="text-2xl text-gray-400">/{questions.length}</span></div>
            <div className={`text-sm font-bold uppercase tracking-wider ${percentage >= 70 ? 'text-green-600' : percentage >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
              {percentage >= 70 ? 'Excellent Score' : percentage >= 40 ? 'Good Effort' : 'Needs Improvement'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button 
               onClick={() => { setView('review'); setCurrentQuestionIdx(0); }}
               className="w-full bg-white text-gray-700 border-2 border-gray-200 py-3.5 rounded-2xl font-bold hover:bg-gray-50 transition-colors"
             >
               Review
             </button>
             <button 
               onClick={() => navigate(`/course/${course.id}`)}
               className="w-full bg-brand text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-brand/30 hover:shadow-brand/50 transition-all"
             >
               Finish
             </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIdx];

  // EXAM TAKING VIEW
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-safe">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2 text-red-600 font-bold font-mono text-lg bg-red-50 px-3 py-1.5 rounded-lg">
          <Timer className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
        
        <div className="flex items-center gap-3">
           <button 
              onClick={saveAndExit}
              className="text-gray-600 font-bold text-sm flex items-center gap-1 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
           >
              <Save className="w-4 h-4" /> Save
           </button>
        </div>
      </div>

      {/* Question Area */}
      <div className="flex-1 p-4 max-w-2xl mx-auto w-full flex flex-col justify-start pt-6 overflow-y-auto">
        <div className="mb-6 px-2">
            <span className="text-xs font-bold text-brand uppercase tracking-widest mb-2 block">Question {currentQuestionIdx + 1} of {questions.length}</span>
            <h2 className="text-xl md:text-2xl font-display font-bold text-gray-900 leading-snug">
                {currentQ.question}
            </h2>
        </div>

        <div className="space-y-3 pb-8">
          {currentQ.options.map((opt, idx) => {
            const isSelected = answers[currentQuestionIdx] === idx;
            return (
                <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 group relative overflow-hidden ${
                    isSelected
                    ? 'border-brand bg-white shadow-glow ring-1 ring-brand z-10' 
                    : 'border-gray-200 bg-white shadow-sm hover:border-gray-300 hover:bg-gray-50'
                }`}
                >
                    {/* Visual Selection Indicator */}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-none transition-colors ${isSelected ? 'border-brand bg-brand text-white' : 'border-gray-300 text-gray-400'}`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>

                    <span className={`text-base font-medium ${isSelected ? 'text-brand-dark' : 'text-gray-700'}`}>
                        {opt}
                    </span>
                    
                    {/* Subtle Background Effect for Selection */}
                    {isSelected && <div className="absolute inset-0 bg-brand/5 pointer-events-none" />}
                </button>
            );
          })}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-white/90 backdrop-blur border-t p-4 flex justify-between max-w-2xl mx-auto w-full sticky bottom-0 z-20">
        <button 
          onClick={() => setCurrentQuestionIdx(curr => Math.max(0, curr - 1))}
          disabled={currentQuestionIdx === 0}
          className="px-6 py-3 text-gray-500 font-bold disabled:opacity-30 hover:bg-gray-100 rounded-xl transition-colors"
        >
          Previous
        </button>
        
        {currentQuestionIdx === questions.length - 1 ? (
          <button 
            onClick={finishExam}
            className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-500/30 hover:bg-green-700 transition-all"
          >
            Submit
          </button>
        ) : (
          <button 
            onClick={() => setCurrentQuestionIdx(curr => Math.min(questions.length - 1, curr + 1))}
            className="bg-brand text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-brand/30 hover:bg-brand-dark transition-all"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default ExamMode;
