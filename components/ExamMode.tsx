
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Timer, CheckCircle, AlertCircle, ArrowLeft, Loader2, List, PlayCircle, Bot, Save, LogOut, RotateCcw, Brain, Sparkles } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { Course, Question, Exam, ExamProgress } from '../types';
import { useStore } from '../store';

declare var process: { env: { API_KEY: string } };

/**
 * Robustly parses JSON from model output, handling potential markdown wrappers
 * or trailing text that might occur even in JSON mode.
 */
const cleanJson = (text: string) => {
  if (!text) return null;
  try {
    // 1. Initial attempt to parse directly
    return JSON.parse(text);
  } catch (e) {
    try {
      // 2. Fallback: Strip common markdown wrappers and extract array/object content
      let cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
      const firstBracket = cleaned.search(/\[|\{/);
      const lastBracket = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
      
      if (firstBracket !== -1 && lastBracket !== -1) {
         cleaned = cleaned.substring(firstBracket, lastBracket + 1);
      }
      return JSON.parse(cleaned);
    } catch (innerError) {
      console.error("Critical JSON Parse Failure:", innerError, "Original text:", text);
      return null;
    }
  }
};

const ExamMode = () => {
  const { id } = useParams();
  const { courses, saveExamResult, saveExamProgress, clearExamProgress, currentUser } = useStore();
  const navigate = useNavigate();
  const course = courses.find(c => c.id === id);
  
  const [view, setView] = useState<'selection' | 'taking' | 'review'>('selection');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [resumePrompt, setResumePrompt] = useState<ExamProgress | null>(null);

  if (!course) return <Navigate to="/" />;

  // Check for saved progress on initial load
  useEffect(() => {
    if (view !== 'selection') return;
    if (currentUser?.savedExamProgress) {
      const saved = currentUser.savedExamProgress.find(p => p.courseId === course.id);
      if (saved) {
        setResumePrompt(saved);
      }
    }
  }, [course, currentUser, view]);

  // Assessment Timer Logic
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

  // Periodic Auto-save Progress
  useEffect(() => {
    if (view === 'taking' && !loading && !isFinished && questions.length > 0) {
      const timeout = setTimeout(() => {
        if (timeLeft > 0) {
          saveExamProgress({
            courseId: course.id,
            questions,
            answers,
            timeLeft,
            lastSaved: new Date().toISOString(),
            isAiGenerated
          });
        }
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [answers, currentQuestionIdx, timeLeft]);

  const startAiExam = async () => {
    setView('taking');
    setLoading(true);
    setQuestions([]);
    setIsAiGenerated(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Build context for AI to generate highly relevant questions
      const chapterContext = course.chapters?.map(c => 
        `Chapter "${c.title}" covers topics like: ${c.videos?.map(v => v.title).join(', ')}`
      ).join('. ') || course.description;

      const prompt = `Act as an expert educational assessor for the course: "${course.title}".
      Target Course Content: ${chapterContext}.
      Task: Create exactly 10 high-quality, conceptual, and challenging multiple choice questions.
      Strict Requirements:
      - 4 unique options per question.
      - Exactly one clearly correct answer.
      - Varied difficulty levels.
      - Output strictly as a JSON array of objects.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "A unique identifier for the question" },
                question: { type: Type.STRING, description: "The full text of the question" },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  minItems: 4,
                  maxItems: 4,
                  description: "Exactly 4 options for the user to choose from"
                },
                correctAnswer: { 
                  type: Type.INTEGER, 
                  description: "The 0-based index (0-3) of the correct answer in the options array" 
                }
              },
              required: ["id", "question", "options", "correctAnswer"],
              propertyOrdering: ["id", "question", "options", "correctAnswer"]
            }
          }
        }
      });

      const data = cleanJson(response.text);
      if (Array.isArray(data) && data.length > 0) {
        setQuestions(data);
        setAnswers(new Array(data.length).fill(-1));
        setTimeLeft(data.length * 60); // 1 minute per question
        setLoading(false);
      } else {
        throw new Error("Received empty or malformed question array from AI.");
      }
    } catch (err) {
      console.error("AI Generation Failure:", err);
      alert("Neural sync failure: Could not synthesize assessment questions. Please check your terminal connection.");
      setView('selection');
      setLoading(false);
    }
  };

  const startManualExam = (exam: Exam) => {
    setQuestions(exam.questions);
    setAnswers(new Array(exam.questions.length).fill(-1));
    setTimeLeft(exam.questions.length * 60);
    setIsAiGenerated(false);
    setView('taking');
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
    if (confirm("Permanently discard this unfinished assessment sequence?")) {
      clearExamProgress(course.id);
      setResumePrompt(null);
    }
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (resumePrompt) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center p-6">
         <div className="glass p-10 rounded-[50px] border-indigo-500/20 max-w-sm w-full text-center shadow-neon">
            <h2 className="text-2xl font-display font-bold mb-4 text-white">Resume Sync?</h2>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
               An active assessment node from {new Date(resumePrompt.lastSaved).toLocaleDateString()} was detected in your neural logs.
            </p>
            <div className="flex gap-4">
               <button onClick={handleDiscardSaved} className="flex-1 py-4 text-red-400 font-bold border border-red-400/20 rounded-2xl hover:bg-red-400/10 transition-colors">
                  Discard
               </button>
               <button onClick={handleResume} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-neon hover:scale-105 transition-all">
                  Resume
               </button>
            </div>
         </div>
      </div>
    );
  }

  if (view === 'selection') {
    return (
       <div className="min-h-screen bg-[#050508] p-6 pt-24 overflow-hidden relative">
          <div className="absolute inset-0 futuristic-grid opacity-10"></div>
          <div className="max-w-2xl mx-auto relative z-10">
              <button onClick={() => navigate(`/course/${course.id}`)} className="p-3 glass rounded-2xl text-white mb-10 transition-transform hover:scale-110 shadow-neon border-white/10">
                <ArrowLeft />
              </button>
              <h2 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">Select Assessment Node</h2>
              <p className="text-indigo-400 font-bold uppercase tracking-widest text-[10px] mb-12">Calibration required for progress tracking</p>
              
              <div className="grid gap-6">
                <button onClick={startAiExam} className="glass p-8 rounded-[40px] border-indigo-500/30 text-left group hover:border-indigo-500 transition-all shadow-neon shadow-indigo-500/5 hover:bg-indigo-500/5">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 rounded-2xl bg-indigo-500 shadow-neon text-white transition-transform group-hover:scale-110">
                          <Brain className="w-6 h-6" />
                        </div>
                        <Sparkles className="text-indigo-400 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Neural AI Mock Test</h3>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed">Synthesize a unique, personalized assessment based on current course topography and complexity vectors.</p>
                </button>

                {course.exams?.length ? (
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mt-8 mb-2">Preset Nodes</h3>
                ) : null}

                {course.exams?.map((exam) => (
                  <button key={exam.id} onClick={() => startManualExam(exam)} className="glass p-6 rounded-[35px] border-white/5 text-left flex items-center justify-between hover:bg-white/5 transition-all group">
                      <div>
                        <h3 className="font-bold text-white text-lg group-hover:text-indigo-400 transition-colors">{exam.title}</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">{exam.questions.length} Question Units</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-neon">
                        <PlayCircle className="w-6 h-6" />
                      </div>
                  </button>
                ))}
              </div>
          </div>
       </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
        <h2 className="text-2xl font-display font-bold text-white tracking-widest uppercase">Synthesizing node sequence...</h2>
        <p className="text-indigo-400/60 text-xs mt-3 font-mono animate-pulse uppercase tracking-[0.2em]">Calibrating Neural Weights & Topography</p>
      </div>
    );
  }

  if (isFinished) {
    const percentage = (score / questions.length) * 100;
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center glass p-12 rounded-[60px] border-indigo-500/20 shadow-neon animate-slide-up">
          <div className="w-24 h-24 bg-emerald-500 shadow-neon shadow-emerald-500/40 rounded-[30px] flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">Sync Complete</h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-12">Assessor Results Verified</p>
          
          <div className="text-6xl font-display font-bold text-white mb-4">
            {score}<span className="text-2xl text-indigo-500">/{questions.length}</span>
          </div>
          <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.4em] mb-12">Accuracy: {Math.round(percentage)}%</div>
          
          <button onClick={() => navigate(`/course/${course.id}`)} className="w-full py-5 bg-indigo-600 text-white font-bold rounded-2xl shadow-neon tracking-widest uppercase hover:scale-[1.02] active:scale-95 transition-all">
            RETURN TO GRID
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQuestionIdx];

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col">
        <div className="p-6 glass border-b border-white/5 flex justify-between items-center sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <div className="text-indigo-400 font-mono text-xl font-bold px-4 py-2 glass rounded-xl border-indigo-500/20 shadow-neon">
                  {formatTime(timeLeft)}
                </div>
            </div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Unit {currentQuestionIdx + 1} of {questions.length}
            </div>
        </div>

        <div className="flex-1 p-8 max-w-3xl mx-auto w-full animate-fade-in flex flex-col" key={currentQuestionIdx}>
            <h2 className="text-3xl font-display font-bold mb-12 leading-tight tracking-tight text-indigo-50">
              {q.question}
            </h2>
            <div className="grid gap-4">
                {q.options.map((opt, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => { const na = [...answers]; na[currentQuestionIdx] = idx; setAnswers(na); }} 
                      className={`p-6 rounded-[30px] border text-left transition-all font-medium text-lg flex items-center gap-5 group ${answers[currentQuestionIdx] === idx ? 'bg-indigo-600 border-indigo-400 shadow-neon scale-[1.02]' : 'glass border-white/5 hover:bg-white/5'}`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${answers[currentQuestionIdx] === idx ? 'bg-white text-indigo-600' : 'bg-white/10 text-gray-400 group-hover:text-white'}`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="flex-1 leading-snug">{opt}</span>
                        {answers[currentQuestionIdx] === idx && <CheckCircle className="w-5 h-5 text-white/50" />}
                    </button>
                ))}
            </div>
        </div>

        <div className="p-6 glass border-t border-white/5 flex justify-between gap-4 sticky bottom-0 z-20">
            <button 
              onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))} 
              disabled={currentQuestionIdx === 0}
              className="px-8 py-4 glass border-white/10 rounded-2xl font-bold text-gray-400 hover:text-white disabled:opacity-20 transition-all uppercase tracking-widest text-[10px]"
            >
              Previous
            </button>
            <div className="flex-1 flex justify-center">
               <button onClick={finishExam} className="px-10 py-4 border border-indigo-500/30 text-indigo-400 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-500/10 transition-all">Submit Early</button>
            </div>
            {currentQuestionIdx === questions.length - 1 ? (
                <button onClick={finishExam} className="px-12 py-4 bg-indigo-600 rounded-2xl font-bold shadow-neon uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95">
                  Finalize
                </button>
            ) : (
                <button onClick={() => setCurrentQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))} className="px-12 py-4 bg-indigo-600 rounded-2xl font-bold shadow-neon uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95">
                  Next Node
                </button>
            )}
        </div>
    </div>
  );
};

export default ExamMode;
