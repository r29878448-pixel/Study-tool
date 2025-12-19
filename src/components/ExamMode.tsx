
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Loader2, Sparkles, Clock } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { Question, ExamProgress } from '../types';
import { useStore } from '../store';

declare var process: { env: { API_KEY: string } };

const cleanJson = (text: string) => {
  if (!text) return null;
  try {
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      return JSON.parse(text.substring(firstBracket, lastBracket + 1));
    }
    return JSON.parse(text);
  } catch (e) { return null; }
};

const ExamMode = () => {
  const { id } = useParams<{ id: string }>();
  const { courses, saveExamResult, saveExamProgress, clearExamProgress, currentUser } = useStore();
  const navigate = useNavigate();
  const course = courses.find(c => c.id === id);
  
  const [view, setView] = useState<'selection' | 'taking'>('selection');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [resumePrompt, setResumePrompt] = useState<ExamProgress | null>(null);

  if (!course || !id) return <Navigate to="/" />;

  useEffect(() => {
    if (view === 'selection' && currentUser?.savedExamProgress) {
      const saved = currentUser.savedExamProgress.find(p => p.courseId === course.id);
      if (saved) setResumePrompt(saved);
    }
  }, [course, currentUser, view]);

  useEffect(() => {
    if (view !== 'taking' || loading || isFinished || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [view, loading, isFinished, timeLeft]);

  useEffect(() => {
    if (view === 'taking' && !loading && !isFinished && questions.length > 0 && course) {
      const timeout = setTimeout(() => {
        saveExamProgress({
          courseId: course.id,
          questions,
          answers,
          timeLeft,
          lastSaved: new Date().toISOString(),
          isAiGenerated: true
        });
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [answers, currentQuestionIdx, timeLeft, questions, course, saveExamProgress]);

  const startAiExam = async () => {
    if (!course) return;
    setLoading(true);
    setView('taking');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Create a 10 question multiple choice test for ${course.title}. JSON array output.`;

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
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.INTEGER }
              },
              required: ['id', 'question', 'options', 'correctAnswer']
            }
          }
        }
      });

      const data = cleanJson(response.text);
      if (data && Array.isArray(data)) {
        setQuestions(data);
        setAnswers(new Array(data.length).fill(-1));
        setTimeLeft(data.length * 60);
      } else throw new Error("Format error");
    } catch (e) {
      alert("Could not generate quiz. Please try again.");
      setView('selection');
    } finally {
      setLoading(false);
    }
  };

  const handleResume = () => {
    if (resumePrompt) {
      setQuestions(resumePrompt.questions);
      setAnswers(resumePrompt.answers);
      setTimeLeft(resumePrompt.timeLeft);
      setView('taking');
      setResumePrompt(null);
    }
  };

  const finishExam = () => {
    if (!course) return;
    let s = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correctAnswer) s++; });
    setScore(s);
    setIsFinished(true);
    saveExamResult(course.id, s, questions.length);
    clearExamProgress(course.id);
  };

  if (resumePrompt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
         <div className="bg-white p-8 rounded-2xl border border-gray-200 max-w-sm w-full text-center shadow-lg">
            <Clock className="w-12 h-12 text-brand mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-gray-800">Unfinished Quiz Found</h2>
            <p className="text-gray-500 mb-8 text-sm">Would you like to continue where you left off?</p>
            <div className="flex gap-4">
               <button onClick={() => { clearExamProgress(course.id); setResumePrompt(null); }} className="flex-1 py-3 text-red-500 font-bold border border-red-100 rounded-xl hover:bg-red-50">Discard</button>
               <button onClick={handleResume} className="flex-1 py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-dark">Resume</button>
            </div>
         </div>
      </div>
    );
  }

  if (view === 'selection') {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-200 shadow-xl text-center">
          <button onClick={() => navigate(-1)} className="mb-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <div className="w-16 h-16 bg-blue-50 text-brand rounded-2xl flex items-center justify-center mx-auto mb-6"><Sparkles className="w-8 h-8" /></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Assessment</h2>
          <p className="text-gray-500 mb-8 text-sm">Generate a 10-question mock test based on this course using AI.</p>
          <button onClick={startAiExam} className="w-full bg-brand py-4 rounded-xl text-white font-bold shadow-lg hover:bg-brand-dark transition-all">Start Quiz</button>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white">
      <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
      <p className="font-bold text-gray-600">Generating Questions...</p>
    </div>
  );

  if (isFinished) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center max-w-sm w-full">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete</h2>
        <div className="text-5xl font-bold text-brand mb-2">{score}<span className="text-2xl text-gray-400">/{questions.length}</span></div>
        <p className="text-gray-500 mb-8 text-sm">Result saved to profile.</p>
        <button onClick={() => navigate(-1)} className="w-full py-4 bg-brand text-white font-bold rounded-xl shadow-lg hover:bg-brand-dark">Back to Course</button>
      </div>
    </div>
  );

  const q = questions[currentQuestionIdx];
  if (!q) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2 text-gray-500 font-bold text-sm bg-gray-100 px-3 py-1 rounded-lg">
          <Clock className="w-4 h-4" />
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
        <div className="text-xs font-bold text-gray-400">Q {currentQuestionIdx + 1} of {questions.length}</div>
      </div>
      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <h2 className="text-lg font-bold text-gray-800 mb-8 leading-relaxed">{q.question}</h2>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => { const na = [...answers]; na[currentQuestionIdx] = i; setAnswers(na); }} className={`w-full p-4 rounded-xl border-2 text-left transition-all font-medium text-sm ${answers[currentQuestionIdx] === i ? 'bg-brand border-brand text-white' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}>
              <span className="mr-3 font-bold opacity-60">{String.fromCharCode(65 + i)}</span> {opt}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 border-t bg-white sticky bottom-0 flex gap-3">
        <button disabled={currentQuestionIdx === 0} onClick={() => setCurrentQuestionIdx(v => v - 1)} className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl disabled:opacity-50">Back</button>
        {currentQuestionIdx === questions.length - 1 ? (
          <button onClick={finishExam} className="flex-1 py-3 bg-brand text-white font-bold rounded-xl">Submit</button>
        ) : (
          <button onClick={() => setCurrentQuestionIdx(v => v + 1)} className="flex-1 py-3 bg-brand text-white font-bold rounded-xl">Next Question</button>
        )}
      </div>
    </div>
  );
};

export default ExamMode;
