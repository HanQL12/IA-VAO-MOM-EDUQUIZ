
import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion, QuizSettings } from '../types';

interface QuizViewProps {
  questions: QuizQuestion[];
  settings: QuizSettings;
  onFinish: (score: number, answers: number[]) => void;
  onRestart: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({ questions, settings, onFinish, onRestart }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [showNav, setShowNav] = useState(false);
  const [quizQueue, setQuizQueue] = useState<QuizQuestion[]>([]);
  const [confirmModal, setConfirmModal] = useState<{show: boolean, type: 'restart' | 'redo' | 'exit' | null}>({show: false, type: null});
  const autoAdvanceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    initQuiz(questions);
  }, [questions]);

  const initQuiz = (sourceQuestions: QuizQuestion[]) => {
    let q = [...sourceQuestions];
    if (settings.shuffleQuestions) {
      q = q.sort(() => Math.random() - 0.5);
    }
    
    const prepared = q.map(question => {
      if (settings.shuffleOptions) {
        const correctOptionText = question.options[question.correctIndex];
        const shuffledOptions = [...question.options].sort(() => Math.random() - 0.5);
        const newCorrectIndex = shuffledOptions.indexOf(correctOptionText);
        return { ...question, options: shuffledOptions, correctIndex: newCorrectIndex };
      }
      return question;
    });
    setQuizQueue(prepared);
    setSelectedAnswers(new Array(prepared.length).fill(null));
    setFlaggedIds(new Set());
    setCurrentIndex(0);
  };

  const currentQuestion = quizQueue[currentIndex];
  const progress = quizQueue.length > 0 ? ((currentIndex + 1) / quizQueue.length) * 100 : 0;

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) window.clearTimeout(autoAdvanceTimerRef.current);
    };
  }, []);

  const handleSelect = (optionIndex: number) => {
    if (settings.mode === 'practice' && selectedAnswers[currentIndex] !== null) return;
    
    const newAnswers = [...selectedAnswers];
    newAnswers[currentIndex] = optionIndex;
    setSelectedAnswers(newAnswers);

    if (settings.mode === 'practice' && settings.autoAdvanceTime > 0) {
      if (autoAdvanceTimerRef.current) window.clearTimeout(autoAdvanceTimerRef.current);
      
      autoAdvanceTimerRef.current = window.setTimeout(() => {
        if (currentIndex < quizQueue.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      }, settings.autoAdvanceTime * 1000);
    }
  };

  const toggleFlag = (id: string) => {
    const newFlags = new Set(flaggedIds);
    if (newFlags.has(id)) newFlags.delete(id);
    else newFlags.add(id);
    setFlaggedIds(newFlags);
  };

  const calculateResult = () => {
    let score = 0;
    quizQueue.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score++;
      }
    });
    
    localStorage.setItem('lastQuizResult', JSON.stringify({
      score,
      total: quizQueue.length,
      questions: quizQueue,
      userAnswers: selectedAnswers,
      flaggedIds: Array.from(flaggedIds)
    }));
    onFinish(score, selectedAnswers as number[]);
  };

  const executeRedoMistakes = () => {
    const wrongQuestions: QuizQuestion[] = [];
    const unansweredQuestions: QuizQuestion[] = [];
    
    quizQueue.forEach((q, idx) => {
      const answer = selectedAnswers[idx];
      if (answer !== null && answer !== q.correctIndex) {
        wrongQuestions.push(q);
      } else if (answer === null) {
        unansweredQuestions.push(q);
      }
    });

    const newQueue = [...wrongQuestions, ...unansweredQuestions];

    if (newQueue.length === 0) {
      alert("Bạn đã trả lời đúng tất cả các câu hỏi!");
      return;
    }

    setQuizQueue(newQueue);
    setSelectedAnswers(new Array(newQueue.length).fill(null));
    setCurrentIndex(0);
    setShowNav(false);
    setConfirmModal({show: false, type: null});
    if (autoAdvanceTimerRef.current) window.clearTimeout(autoAdvanceTimerRef.current);
  };

  const executeRestart = () => {
    initQuiz(questions);
    setConfirmModal({show: false, type: null});
    setShowNav(false);
  };

  if (quizQueue.length === 0 || !currentQuestion) return null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-white">
      {/* Cửa sổ xác nhận */}
      {confirmModal.show && (
        <div className="absolute inset-0 bg-slate-900/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-pop-in">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h4 className="text-xl md:text-2xl font-black text-slate-800 mb-2 text-center uppercase tracking-tight">Xác nhận</h4>
            <p className="text-slate-500 text-center mb-6 text-xs leading-relaxed font-bold">
              {confirmModal.type === 'restart' && "Bạn muốn làm lại từ đầu?"}
              {confirmModal.type === 'redo' && "Luyện lại các câu sai và chưa làm?"}
              {confirmModal.type === 'exit' && "Tiến độ bài làm sẽ bị mất. Bạn có chắc chắn muốn thoát về Trang chủ không?"}
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => {
                if (confirmModal.type === 'restart') executeRestart();
                if (confirmModal.type === 'redo') executeRedoMistakes();
                if (confirmModal.type === 'exit') onRestart();
              }} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg active:scale-95 text-xs uppercase transition-all">Đồng ý</button>
              <button onClick={() => setConfirmModal({show: false, type: null})} className="w-full py-4 bg-slate-100 text-slate-400 font-black rounded-2xl active:scale-95 text-xs uppercase transition-all">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Sidebar */}
      {showNav && (
        <div className="absolute inset-0 bg-slate-900/60 z-40 flex justify-end backdrop-blur-sm">
          <div className="w-full max-w-xs bg-white h-full shadow-2xl p-5 flex flex-col animate-slide-in">
            <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-3">
              <h4 className="font-black text-lg text-slate-800">Danh sách câu</h4>
              <button onClick={() => setShowNav(false)} className="text-slate-400 p-2">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto grid grid-cols-4 md:grid-cols-5 gap-2 content-start pb-4">
              {quizQueue.map((q, idx) => {
                const answer = selectedAnswers[idx];
                const isCurrent = idx === currentIndex;
                const isDone = answer !== null;
                const isFlagged = flaggedIds.has(q.id);
                const isCorrect = settings.mode === 'practice' && isDone && answer === quizQueue[idx].correctIndex;
                const isWrong = settings.mode === 'practice' && isDone && answer !== quizQueue[idx].correctIndex;

                let bgColor = 'bg-slate-100 text-slate-400';
                if (isCurrent) bgColor = 'bg-indigo-600 text-white font-black scale-105 shadow-md';
                else if (isCorrect) bgColor = 'bg-green-500 text-white';
                else if (isWrong) bgColor = 'bg-rose-500 text-white';
                else if (isDone) bgColor = 'bg-indigo-400 text-white';

                return (
                  <button key={idx} onClick={() => { setCurrentIndex(idx); setShowNav(false); }}
                    className={`h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all relative ${bgColor}`}
                  >
                    {idx + 1}
                    {isFlagged && <div className="absolute top-0 right-0 w-2 h-2 bg-amber-400 rounded-full border border-white translate-x-1/3 -translate-y-1/3 shadow-sm"></div>}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <button onClick={() => setConfirmModal({show: true, type: 'redo'})} className="w-full py-3.5 bg-rose-50 text-rose-600 font-black rounded-xl border border-rose-100 flex items-center justify-center gap-2 text-[10px] uppercase">
                Luyện lại câu sai
              </button>
              <button onClick={() => setConfirmModal({show: true, type: 'restart'})} className="w-full py-3.5 bg-indigo-50 text-indigo-600 font-black rounded-xl border border-indigo-100 flex items-center justify-center gap-2 text-[10px] uppercase">
                Làm lại từ đầu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Giao diện chính */}
      <div className="flex-1 flex flex-col p-3 md:p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNav(true)} className="p-2.5 bg-white rounded-xl text-indigo-600 border border-slate-200 shadow-sm active:scale-95 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="text-[10px] md:text-xs font-black text-slate-800 uppercase px-4 py-2 bg-slate-100 rounded-full border border-slate-200 tracking-tight">
              Câu {currentIndex + 1} / {quizQueue.length}
            </span>
            <button 
              onClick={() => toggleFlag(currentQuestion.id)}
              className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
                flaggedIds.has(currentQuestion.id) 
                ? 'bg-amber-50 border-amber-200 text-amber-500 shadow-inner' 
                : 'bg-white border-slate-200 text-slate-300'
              }`}
            >
              <svg className="w-5 h-5" fill={flaggedIds.has(currentQuestion.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            </button>
          </div>
          <button 
            onClick={() => setConfirmModal({show: true, type: 'exit'})} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="text-[10px] font-black uppercase tracking-tighter">Thoát</span>
          </button>
        </div>

        <div className="w-full bg-slate-100 h-2 rounded-full mb-8 relative overflow-hidden">
          <div className="bg-indigo-600 h-full transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="flex-1">
          <div className="mb-8">
            <h3 className="text-xl md:text-3xl font-black text-slate-800 leading-tight tracking-tight">
              {currentQuestion.question}
            </h3>
          </div>

          <div className="space-y-3 md:space-y-5">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswers[currentIndex] === idx;
              const isCorrect = currentQuestion.correctIndex === idx;
              const hasAnswered = selectedAnswers[currentIndex] !== null;
              
              let variantStyle = 'border-slate-100 bg-white shadow-sm hover:border-indigo-200';
              let circleStyle = 'border-slate-200 text-slate-400 bg-slate-50';

              if (settings.mode === 'practice' && hasAnswered) {
                if (isCorrect) {
                  variantStyle = 'border-green-500 bg-green-50 text-green-900 ring-4 ring-green-100';
                  circleStyle = 'bg-green-500 border-green-500 text-white';
                } else if (isSelected && !isCorrect) {
                  variantStyle = 'border-rose-500 bg-rose-50 text-rose-900 ring-4 ring-rose-100';
                  circleStyle = 'bg-rose-500 border-rose-500 text-white';
                }
              } else if (isSelected) {
                variantStyle = 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-4 ring-indigo-100';
                circleStyle = 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200';
              }

              return (
                <button key={`${currentIndex}-${idx}`} onClick={() => handleSelect(idx)}
                  className={`w-full p-4 md:p-6 rounded-[1.5rem] border-2 text-left transition-all flex items-start active:scale-[0.98] ${variantStyle}`}
                >
                  <div className={`w-7 h-7 md:w-10 md:h-10 rounded-xl border-2 flex-shrink-0 mr-3 md:mr-5 flex items-center justify-center text-[11px] md:text-sm font-black transition-all ${circleStyle}`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="font-bold text-base md:text-xl leading-snug pt-0.5">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center py-5 border-t border-slate-50 bg-white sticky bottom-0 z-10">
          <button onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)} disabled={currentIndex === 0}
            className={`flex items-center gap-1.5 px-5 py-2.5 font-black transition-all rounded-xl text-xs uppercase ${currentIndex === 0 ? 'text-slate-200' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
            Quay lại
          </button>

          <div className="flex gap-2">
            {currentIndex < quizQueue.length - 1 ? (
              <button 
                onClick={() => setCurrentIndex(currentIndex + 1)} 
                className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl text-xs shadow-xl shadow-indigo-100 uppercase active:scale-95 transition-all"
              >
                Tiếp theo
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              </button>
            ) : (
              <button 
                onClick={calculateResult} 
                className="flex items-center gap-2 px-10 py-4 bg-green-600 text-white font-black rounded-2xl text-xs shadow-xl shadow-green-100 uppercase active:scale-95 transition-all"
              >
                Nộp bài
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pop-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-slide-in { animation: slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-pop-in { animation: pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </div>
  );
};

export default QuizView;
