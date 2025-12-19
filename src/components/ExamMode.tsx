
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from '../types';
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
  
  const [view, setView] = useState<'selection' | 'taking'>('selection');
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
      const prompt = `Generate a 10-question MCQ quiz for: "${course.title}". Subject content: ${course.description}. Output strictly as a JSON array.`;

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
      alert("Neural link failed. Please retry starting the test.");
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
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-200 shadow-xl text-center">
          <button onClick={() => navigate(-1)} className="mb-6 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"><ArrowLeft /></button>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Mock Test Centre</h2>
          <p className="text-gray-500 mb-8 text-sm">Prepare for your finals with a custom AI-generated quiz covering all subject topics.</p>
          <button onClick={startAiExam} className="w-full bg-brand p-5 rounded-xl text-white font-bold flex items-center justify-center gap-3 shadow-lg hover:bg-brand-dark transition-all">
            <Sparkles className="w-5 h-5" />
            Launch Assessment
          </button>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white">
      <Loader2 className="w-12 h-12 text-brand animate-spin mb-4" />
      <p className="font-bold text-gray-500">Generating Questions...</p>
    </div>
  );

  if (isFinished) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center max-w-sm w-full">
        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Complete</h2>
        <p className="text-gray-500 mb-8">Great job! Your performance has been recorded.</p>
        <div className="text-6xl font-bold text-brand mb-8">{score}<span className="text-2xl text-gray-400">/{questions.length}</span></div>
        <button onClick={() => navigate(-1)} className="w-full py-4 bg-brand text-white font-bold rounded-xl shadow-lg hover:bg-brand-dark transition-colors">Finish & Return</button>
      </div>
    </div>
  );

  const q = questions[currentQuestionIdx];
  if (!q) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm">
        <div className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-lg font-bold text-sm">
          Timer: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
        <div className="text-xs font-bold text-gray-400 uppercase">Step {currentQuestionIdx + 1} of {questions.length}</div>
      </div>
      <div className="flex-1 p-6 pt-10 max-w-2xl mx-auto w-full">
        <h2 className="text-lg font-bold text-gray-800 mb-10 leading-relaxed">{q.question}</h2>
        <div className="space-y-4">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => { const na = [...answers]; na[currentQuestionIdx] = i; setAnswers(na); }} className={`w-full p-5 rounded-xl border-2 text-left transition-all font-semibold ${answers[currentQuestionIdx] === i ? 'bg-brand border-brand text-white' : 'border-gray-100 hover:border-gray-200 text-gray-700'}`}>
              <span className="mr-3 opacity-50">{String.fromCharCode(65 + i)}.</span> {opt}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 border-t bg-white sticky bottom-0 flex gap-3 shadow-lg">
        <button disabled={currentQuestionIdx === 0} onClick={() => setCurrentQuestionIdx(v => v - 1)} className="flex-1 py-4 bg-gray-50 text-gray-500 font-bold rounded-xl disabled:opacity-30">Back</button>
        {currentQuestionIdx === questions.length - 1 ? (
          <button onClick={finishExam} className="flex-[2] py-4 bg-brand text-white font-bold rounded-xl">Complete Test</button>
        ) : (
          <button onClick={() => setCurrentQuestionIdx(v => v + 1)} className="flex-[2] py-4 bg-brand text-white font-bold rounded-xl">Next Question</button>
        )}
      </div>
    </div>
  );
};

export default ExamMode;
