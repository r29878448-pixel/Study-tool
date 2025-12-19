
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Loader2, PlayCircle, Brain, Sparkles } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Exam, ExamProgress } from '../types';
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
  } catch (e) {
    console.error("JSON Parse Error", e);
    return null;
  }
};

const ExamMode = () => {
  const params = useParams<{ id: string }>();
  const id = params.id || "";
  const { courses, saveExamResult } = useStore();
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

  if (!course || !id) return <Navigate to="/" />;

  useEffect(() => {
    if (view !== 'taking' || loading || isFinished || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [view, loading, isFinished, timeLeft]);

  const startAiExam = async () => {
    setLoading(true);
    setView('taking');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate a 10-question MCQ quiz for: "${course.title}". Context: ${course.description}. Output strictly as JSON array.`;

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
      } else throw new Error("Invalid format");
    } catch (e) {
      alert("AI Sync Error. Please try again.");
      setView('selection');
    } finally {
      setLoading(false);
    }
  };

  const finishExam = () => {
    let s = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correctAnswer) s++; });
    setScore(s);
    setIsFinished(true);
    saveExamResult(course.id, s, questions.length);
  };

  if (view === 'selection') {
    return (
      <div className="min-h-screen bg-white p-6 pt-24">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="mb-8 p-3 bg-gray-100 rounded-2xl"><ArrowLeft /></button>
          <h2 className="text-3xl font-black text-gray-800 mb-8 uppercase tracking-tighter">Assessments</h2>
          <button onClick={startAiExam} className="w-full bg-blue-600 p-8 rounded-[40px] text-white text-left relative overflow-hidden shadow-xl active:scale-[0.98] transition-all">
            <Sparkles className="absolute top-4 right-4 w-12 h-12 opacity-20" />
            <h3 className="text-xl font-bold mb-2">Neural AI Test</h3>
            <p className="text-blue-100 text-sm">Generate unique questions based on course data.</p>
          </button>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
      <p className="font-bold text-gray-500 uppercase tracking-widest text-xs">Synthesizing Questions...</p>
    </div>
  );

  if (isFinished) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center max-w-sm w-full">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-gray-800 mb-2">Node Sync Complete</h2>
        <div className="text-6xl font-black text-blue-600 mb-8">{score}/{questions.length}</div>
        <button onClick={() => navigate(-1)} className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl shadow-lg uppercase">Return to Grid</button>
      </div>
    </div>
  );

  const q = questions[currentQuestionIdx];
  if (!q) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
        <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold font-mono">
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
        <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Question {currentQuestionIdx + 1}/{questions.length}</div>
      </div>
      <div className="flex-1 p-6 pt-10 max-w-2xl mx-auto w-full">
        <h2 className="text-xl font-bold text-gray-800 mb-10 leading-relaxed">{q.question}</h2>
        <div className="space-y-4">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => { const na = [...answers]; na[currentQuestionIdx] = i; setAnswers(na); }} className={`w-full p-6 rounded-3xl border-2 text-left transition-all font-bold ${answers[currentQuestionIdx] === i ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'border-gray-100 hover:border-blue-100 text-gray-600'}`}>
              <span className="mr-4 opacity-40">{String.fromCharCode(65 + i)}</span> {opt}
            </button>
          ))}
        </div>
      </div>
      <div className="p-6 border-t bg-white sticky bottom-0 flex gap-4">
        <button disabled={currentQuestionIdx === 0} onClick={() => setCurrentQuestionIdx(v => v - 1)} className="flex-1 py-4 bg-gray-50 text-gray-400 font-bold rounded-2xl disabled:opacity-30">Back</button>
        {currentQuestionIdx === questions.length - 1 ? (
          <button onClick={finishExam} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg">Finalize Node</button>
        ) : (
          <button onClick={() => setCurrentQuestionIdx(v => v + 1)} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg">Next Question</button>
        )}
      </div>
    </div>
  );
};

export default ExamMode;
