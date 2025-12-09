import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Course } from '../types';
import { useStore } from '../store';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index 0-3
}

interface ExamModeProps {
  course: Course;
}

const ExamMode: React.FC<ExamModeProps> = ({ course }) => {
  const { saveExamResult } = useStore();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    generateExam();
  }, []);

  useEffect(() => {
    if (loading || isFinished || timeLeft <= 0) return;

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
  }, [loading, isFinished, timeLeft]);

  const generateExam = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate 10 multiple choice questions based on the subject: "${course.title}". 
      Context description: ${course.description}.
      Format strictly as a JSON array of objects with keys: "id" (string), "question" (string), "options" (array of 4 strings), "correctAnswer" (number index 0-3).
      Do not include markdown formatting, just raw JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (text) {
        const data = JSON.parse(text);
        setQuestions(data);
        setAnswers(new Array(data.length).fill(-1));
        setLoading(false);
      } else {
        throw new Error("No data returned");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate exam. Please check your connection or try again.");
      setLoading(false);
    }
  };

  const handleAnswer = (optionIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIdx] = optionIdx;
    setAnswers(newAnswers);
  };

  const finishExam = () => {
    let calculatedScore = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        calculatedScore++;
      }
    });
    setScore(calculatedScore);
    setIsFinished(true);
    saveExamResult(course.id, calculatedScore, questions.length);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-brand animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Generating Exam...</h2>
        <p className="text-gray-500 text-center max-w-md mt-2">
          AI is creating unique questions based on {course.title}. This may take a few seconds.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button onClick={() => navigate(-1)} className="bg-brand text-white px-6 py-2 rounded-lg font-bold">
          Go Back
        </button>
      </div>
    );
  }

  if (isFinished) {
    const percentage = (score / questions.length) * 100;
    return (
      <div className="min-h-screen bg-brand flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Exam Completed!</h2>
          <p className="text-gray-500 mb-6">You have finished the test for {course.title}</p>
          
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="text-4xl font-bold text-brand mb-1">{score} / {questions.length}</div>
            <div className={`text-sm font-bold ${percentage >= 70 ? 'text-green-500' : percentage >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
              {percentage >= 70 ? 'Excellent!' : percentage >= 40 ? 'Good Effort!' : 'Keep Practicing!'}
            </div>
          </div>

          <button 
            onClick={() => navigate(`/course/${course.id}`)}
            className="w-full bg-brand text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-brand-dark transition-colors"
          >
            Return to Course
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIdx];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 text-red-600 font-bold font-mono text-xl bg-red-50 px-3 py-1 rounded-lg">
          <Timer className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
        <div className="text-gray-500 text-sm font-bold">
          Q {currentQuestionIdx + 1} / {questions.length}
        </div>
      </div>

      {/* Question Area */}
      <div className="flex-1 p-6 max-w-2xl mx-auto w-full flex flex-col justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 leading-relaxed">
            {currentQ.question}
          </h2>
        </div>

        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                answers[currentQuestionIdx] === idx 
                  ? 'border-brand bg-blue-50 text-brand font-bold' 
                  : 'border-transparent bg-white shadow-sm hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="inline-block w-6 h-6 rounded-full border-2 border-current mr-3 text-center leading-5 text-sm">
                {String.fromCharCode(65 + idx)}
              </span>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-white p-4 border-t flex justify-between max-w-2xl mx-auto w-full">
        <button 
          onClick={() => setCurrentQuestionIdx(curr => Math.max(0, curr - 1))}
          disabled={currentQuestionIdx === 0}
          className="px-6 py-2 text-gray-500 font-bold disabled:opacity-30"
        >
          Previous
        </button>
        
        {currentQuestionIdx === questions.length - 1 ? (
          <button 
            onClick={finishExam}
            className="bg-green-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-green-500/30"
          >
            Submit Exam
          </button>
        ) : (
          <button 
            onClick={() => setCurrentQuestionIdx(curr => Math.min(questions.length - 1, curr + 1))}
            className="bg-brand text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-blue-500/30"
          >
            Next Question
          </button>
        )}
      </div>
    </div>
  );
};

export default ExamMode;