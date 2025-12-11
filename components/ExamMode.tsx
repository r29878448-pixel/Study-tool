
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, CheckCircle, AlertCircle, ArrowLeft, Loader2, List, PlayCircle, Bot, Save, LogOut, RotateCcw } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Course, Question, Exam, ExamProgress } from '../types';
import { useStore } from '../store';

interface ExamModeProps {
  course: Course;
}

const ExamMode: React.FC<ExamModeProps> = ({ course }) => {
  const { saveExamResult, saveExamProgress, clearExamProgress, currentUser } = useStore();
  const navigate = useNavigate();
  
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

  // Check for saved progress on mount
  useEffect(() => {
    if (currentUser?.savedExamProgress) {
      const saved = currentUser.savedExamProgress.find(p => p.courseId === course.id);
      if (saved) {
        setResumePrompt(saved);
        return; 
      }
    }
    
    // Default view
    setView('selection'); 
  }, [course, currentUser]);

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
  // NOTE: We do NOT include timeLeft in dependencies to prevent the debounce from resetting every second
  useEffect(() => {
    if (view === 'taking' && !loading && !isFinished && questions.length > 0) {
      const timeout = setTimeout(() => {
        saveProgress();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [answers, currentQuestionIdx]); 

  const saveProgress = () => {
    saveExamProgress({
      courseId: course.id,
      questions,
      answers,
      timeLeft, // Captures current timeLeft due to closure or when called
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
      
      Questions must be strictly relevant to the provided topics.
      Format strictly as a JSON array of objects with keys: "id" (string), "question" (string), "options" (array of 4 strings), "correctAnswer" (number index 0-3).
      Do not include markdown formatting or 'json' code blocks. Just raw JSON.`;

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
        setTimeLeft(data.length * 60); // Reset time for new exam
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

  const startManualExam = (exam: Exam) => {
    setQuestions(exam.questions);
    setAnswers(new Array(exam.questions.length).fill(-1));
    setTimeLeft(exam.questions.length * 60); // 1 min per question
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
      if (answers[idx] === q.correctAnswer) {
        calculatedScore++;
      }
    });
    setScore(calculatedScore);
    setIsFinished(true);
    saveExamResult(course.id, calculatedScore, questions.length);
    clearExamProgress(course.id); // Clear saved progress on finish
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
         <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-2">Resume Exam?</h2>
            <p className="text-gray-500 mb-6 text-sm">
               You have an unfinished exam saved on {new Date(resumePrompt.lastSaved).toLocaleDateString()} at {new Date(resumePrompt.lastSaved).toLocaleTimeString()}.
            </p>
            <div className="flex gap-3">
               <button onClick={handleDiscardSaved} className="flex-1 py-3 text-red-500 font-bold border border-red-100 rounded-xl hover:bg-red-50">
                  Discard
               </button>
               <button onClick={handleResume} className="flex-1 py-3 bg-brand text-white font-bold rounded-xl shadow-lg">
                  Resume
               </button>
            </div>
         </div>
      </div>
    );
  }

  if (view === 'selection') {
    return (
       <div className="min-h-screen bg-gray-50 p-4 pt-20">
          <div className="flex items-center gap-2 mb-6">
             <button onClick={() => navigate(`/course/${course.id}`)} className="bg-white p-2 rounded-full shadow-sm hover:bg-gray-100">
               <ArrowLeft className="w-5 h-5 text-gray-600" />
             </button>
             <h2 className="text-2xl font-bold text-gray-800">Select Exam</h2>
          </div>
          
          <div className="grid gap-4">
            {/* Manual Exams */}
            {course.exams?.map((exam) => (
               <button 
                 key={exam.id}
                 onClick={() => startManualExam(exam)}
                 className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-left hover:border-brand transition-colors flex items-center justify-between"
               >
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{exam.title}</h3>
                    <p className="text-gray-500 text-sm">{exam.questions.length} Questions • {exam.questions.length} Minutes</p>
                  </div>
                  <PlayCircle className="w-8 h-8 text-brand" />
               </button>
            ))}

            {/* AI Generator Option */}
            <button 
               onClick={startAiExam}
               className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-xl shadow-lg text-left text-white flex items-center justify-between mt-4"
            >
               <div>
                  <h3 className="font-bold text-lg">Generate AI Mock Test</h3>
                  <p className="text-white/80 text-sm">Create a unique test based on course content</p>
               </div>
               <Bot className="w-8 h-8 text-white" />
            </button>
          </div>
       </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-brand animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Generating Exam...</h2>
        <p className="text-gray-500 text-center max-w-md mt-2">
          AI is analyzing {course.title} chapters to create relevant questions.
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
        <button onClick={() => setView('selection')} className="bg-brand text-white px-6 py-2 rounded-lg font-bold">
          Try Again
        </button>
      </div>
    );
  }

  // REVIEW MODE
  if (view === 'review') {
    const currentQ = questions[currentQuestionIdx];
    const userAnswer = answers[currentQuestionIdx];
    const isCorrect = userAnswer === currentQ.correctAnswer;

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
         <div className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
            <button onClick={() => navigate(`/course/${course.id}`)} className="text-gray-600 flex items-center gap-1 font-bold">
               <ArrowLeft className="w-5 h-5" /> Exit
            </button>
            <div className="text-gray-800 font-bold">Review Mode</div>
         </div>

         <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex justify-between items-start mb-2">
                 <span className="text-xs font-bold text-gray-400 uppercase">Question {currentQuestionIdx + 1}</span>
                 {userAnswer === -1 ? (
                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">Skipped</span>
                 ) : isCorrect ? (
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Correct</span>
                 ) : (
                    <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Incorrect</span>
                 )}
              </div>
              <h2 className="text-lg font-bold text-gray-900 leading-relaxed">
                {currentQ.question}
              </h2>
            </div>

            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                 let style = "bg-white border-transparent text-gray-700";
                 
                 // Logic for styling
                 if (idx === currentQ.correctAnswer) {
                    style = "bg-green-50 border-green-500 text-green-800 font-bold";
                 } else if (idx === userAnswer && idx !== currentQ.correctAnswer) {
                    style = "bg-red-50 border-red-500 text-red-800 font-bold";
                 }

                 return (
                   <div
                     key={idx}
                     className={`w-full text-left p-4 rounded-xl border-2 transition-all ${style}`}
                   >
                     <span className="inline-block w-6 h-6 rounded-full border-2 border-current mr-3 text-center leading-5 text-sm">
                       {String.fromCharCode(65 + idx)}
                     </span>
                     {opt}
                     {idx === currentQ.correctAnswer && <span className="float-right text-xs font-bold mt-1 text-green-600">Correct Answer</span>}
                     {idx === userAnswer && idx !== currentQ.correctAnswer && <span className="float-right text-xs font-bold mt-1 text-red-500">Your Answer</span>}
                   </div>
                 );
              })}
            </div>
         </div>

         <div className="bg-white p-4 border-t flex justify-between max-w-2xl mx-auto w-full">
            <button 
              onClick={() => setCurrentQuestionIdx(curr => Math.max(0, curr - 1))}
              disabled={currentQuestionIdx === 0}
              className="px-6 py-2 text-gray-500 font-bold disabled:opacity-30"
            >
              Previous
            </button>
            <div className="flex items-center text-sm font-bold text-gray-400">
               {currentQuestionIdx + 1} / {questions.length}
            </div>
            <button 
              onClick={() => setCurrentQuestionIdx(curr => Math.min(questions.length - 1, curr + 1))}
              disabled={currentQuestionIdx === questions.length - 1}
              className="px-6 py-2 bg-brand text-white rounded-xl font-bold disabled:opacity-50"
            >
              Next
            </button>
         </div>
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

          <div className="space-y-3">
             <button 
               onClick={() => { setView('review'); setCurrentQuestionIdx(0); }}
               className="w-full bg-blue-50 text-brand border border-blue-200 py-3 rounded-xl font-bold hover:bg-blue-100 transition-colors"
             >
               Review Answers
             </button>
             <button 
               onClick={() => navigate(`/course/${course.id}`)}
               className="w-full bg-brand text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-brand-dark transition-colors"
             >
               Return to Course
             </button>
          </div>
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
        
        <div className="flex items-center gap-3">
           <button 
              onClick={saveAndExit}
              className="text-brand font-bold text-sm flex items-center gap-1 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
           >
              <Save className="w-4 h-4" /> Save & Exit
           </button>
           <div className="text-gray-500 text-sm font-bold">
             Q {currentQuestionIdx + 1} / {questions.length}
           </div>
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