
import React, { useState, useEffect } from 'react';
import { AppView, QuizQuestion, QuizSettings, SavedQuiz } from './types';
import { extractQuizFromText } from './services/geminiService';
import FileUpload from './components/FileUpload';
import QuizConfig from './components/QuizConfig';
import QuizView from './components/QuizView';
import ResultView from './components/ResultView';

declare const pdfjsLib: any;
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('upload');
  const [masterQuestions, setMasterQuestions] = useState<QuizQuestion[]>([]);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizName, setCurrentQuizName] = useState<string>("");
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [settings, setSettings] = useState<QuizSettings>({
    shuffleQuestions: false,
    shuffleOptions: false,
    mode: 'practice',
    autoAdvanceTime: 2
  });
  const [error, setError] = useState<string | null>(null);

  // Load thư viện từ localStorage khi khởi chạy
  useEffect(() => {
    const saved = localStorage.getItem('quiz_library');
    if (saved) {
      try {
        setSavedQuizzes(JSON.parse(saved));
      } catch (e) {
        console.error("Lỗi load thư viện:", e);
      }
    }
  }, []);

  const saveToLibrary = (name: string, questions: QuizQuestion[]): boolean => {
    if (savedQuizzes.length >= 15) { 
      return false;
    }
    const newQuiz: SavedQuiz = {
      id: `quiz-${Date.now()}`,
      name: name.replace(/\.[^/.]+$/, ""), // Xóa đuôi file
      questions,
      timestamp: Date.now()
    };

    setSavedQuizzes(prev => {
      const updated = [newQuiz, ...prev];
      localStorage.setItem('quiz_library', JSON.stringify(updated));
      return updated;
    });
    return true;
  };

  const deleteFromLibrary = (id: string) => {
    setSavedQuizzes(prev => {
      const updated = prev.filter(q => q.id !== id);
      localStorage.setItem('quiz_library', JSON.stringify(updated));
      return updated;
    });
  };

  const loadFromLibrary = (quiz: SavedQuiz) => {
    setMasterQuestions(quiz.questions);
    setActiveQuestions(quiz.questions);
    setCurrentQuizName(quiz.name);
    setView('config');
  };

  const handleFileUpload = async (file: File) => {
    setView('loading');
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        let lastY: number | null = null;
        let pageText = '';
        for (const item of textContent.items as any[]) {
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            pageText += '\n';
          }
          pageText += item.str + ' ';
          lastY = item.transform[5];
        }
        fullText += pageText + '\n--- TRANG ' + i + ' ---\n';
      }

      const extracted = await extractQuizFromText(fullText);
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setMasterQuestions(extracted);
      setActiveQuestions(extracted);
      setCurrentQuizName(cleanName);
      
      const saved = saveToLibrary(cleanName, extracted);
      if (!saved) {
        console.log("Thư viện đã đầy, không tự động lưu.");
      }
      
      setView('config');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể xử lý file PDF.");
      setView('upload');
    }
  };

  const startQuiz = (finalSettings: QuizSettings) => {
    setSettings(finalSettings);
    setView('quiz');
  };

  const handleRetakeAll = () => {
    setActiveQuestions(masterQuestions);
    setView('quiz');
  };

  const handleRedoMistakes = () => {
    const data = localStorage.getItem('lastQuizResult');
    if (!data) return;
    const { questions, userAnswers } = JSON.parse(data);
    const mistakes = questions.filter((q: QuizQuestion, idx: number) => {
      return userAnswers[idx] === null || userAnswers[idx] !== q.correctIndex;
    });
    
    if (mistakes.length > 0) {
      setActiveQuestions(mistakes);
      setView('quiz');
    }
  };

  const handleRedoFlagged = () => {
    const data = localStorage.getItem('lastQuizResult');
    if (!data) return;
    const { questions, flaggedIds } = JSON.parse(data);
    if (!flaggedIds || flaggedIds.length === 0) return;

    const flaggedQuestions = questions.filter((q: QuizQuestion) => flaggedIds.includes(q.id));
    setActiveQuestions(flaggedQuestions);
    setView('quiz');
  };

  const resetApp = () => {
    setView('upload');
    setMasterQuestions([]);
    setActiveQuestions([]);
    setCurrentQuizName("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-4 md:py-10 px-2 md:px-4">
      <header className="max-w-4xl w-full mb-4 md:mb-10 text-center">
        <h1 className="text-2xl md:text-4xl font-black text-indigo-600 mb-1 tracking-tight uppercase">EduQuiz Automator</h1>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">AI Powered System</p>
      </header>

      <main className="max-w-4xl w-full bg-white rounded-3xl md:rounded-[2.5rem] shadow-xl overflow-hidden min-h-[500px] flex flex-col border border-slate-100">
        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 m-4 rounded-xl shadow-sm">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="ml-3">
                <p className="text-xs text-rose-700 font-bold">{error}</p>
                <button onClick={() => setError(null)} className="mt-2 text-[10px] font-black text-rose-500 uppercase">Đóng</button>
              </div>
            </div>
          </div>
        )}

        {view === 'upload' && (
          <FileUpload 
            onUpload={handleFileUpload} 
            savedQuizzes={savedQuizzes} 
            onLoadSaved={loadFromLibrary}
            onDeleteSaved={deleteFromLibrary}
          />
        )}
        
        {view === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-indigo-600 font-black text-sm animate-pulse">AI</span>
              </div>
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Đang phân tích đề...</h2>
            <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-[250px]">Gemini đang lọc câu hỏi cho bạn.</p>
          </div>
        )}

        {view === 'config' && (
          <QuizConfig 
            questionCount={masterQuestions.length} 
            onStart={startQuiz} 
            onCancel={resetApp}
          />
        )}

        {view === 'quiz' && (
          <QuizView 
            questions={activeQuestions} 
            settings={settings} 
            onFinish={() => setView('result')} 
            onRestart={resetApp}
          />
        )}

        {view === 'result' && (
          <ResultView 
            onRestart={resetApp} 
            onRetake={handleRetakeAll}
            onRedoMistakes={handleRedoMistakes}
            onRedoFlagged={handleRedoFlagged}
            onSaveToLibrary={saveToLibrary}
            currentQuizName={currentQuizName}
          />
        )}
      </main>
    </div>
  );
};

export default App;
