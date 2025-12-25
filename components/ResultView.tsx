
import React, { useMemo, useState } from 'react';
import { QuizQuestion } from '../types';

interface ResultViewProps {
  onRestart: () => void;
  onRetake: () => void;
  onRedoMistakes: () => void;
  onRedoFlagged: () => void;
  onSaveToLibrary: (name: string, questions: QuizQuestion[]) => boolean;
  currentQuizName: string;
}

const ResultView: React.FC<ResultViewProps> = ({ 
  onRestart, 
  onRetake, 
  onRedoMistakes, 
  onRedoFlagged,
  onSaveToLibrary,
  currentQuizName
}) => {
  const [confirmModal, setConfirmModal] = useState<{show: boolean, type: 'restart' | 'retake' | 'redo' | 'home' | 'flagged' | 'save_flagged' | null}>({show: false, type: null});
  
  const resultData = useMemo(() => {
    const data = localStorage.getItem('lastQuizResult');
    return data ? JSON.parse(data) : null;
  }, []);

  if (!resultData) return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
       <h2 className="text-xl font-black text-slate-800 mb-2">Lỗi dữ liệu</h2>
       <button onClick={onRestart} className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl text-xs uppercase">Về trang chủ</button>
    </div>
  );

  const { score, total, questions, userAnswers, flaggedIds = [] } = resultData;
  const percentage = Math.round((score / total) * 100);
  const mistakesCount = total - score;
  const flaggedCount = flaggedIds.length;
  
  let grade = "";
  let color = "";
  let bgColor = "";
  
  if (percentage >= 90) { grade = "XUẤT SẮC!"; color = "text-green-600"; bgColor = "bg-green-50"; }
  else if (percentage >= 75) { grade = "RẤT TỐT!"; color = "text-blue-600"; bgColor = "bg-blue-50"; }
  else if (percentage >= 50) { grade = "ĐẠT"; color = "text-amber-600"; bgColor = "bg-amber-50"; }
  else { grade = "CỐ GẮNG!"; color = "text-rose-600"; bgColor = "bg-rose-50"; }

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const handleAction = () => {
    if (confirmModal.type === 'restart' || confirmModal.type === 'home') onRestart();
    if (confirmModal.type === 'retake') onRetake();
    if (confirmModal.type === 'redo') onRedoMistakes();
    if (confirmModal.type === 'flagged') onRedoFlagged();
    if (confirmModal.type === 'save_flagged') {
      const flaggedQuestions = questions.filter((q: QuizQuestion) => flaggedIds.includes(q.id));
      const success = onSaveToLibrary(`[Flagged] ${currentQuizName}`, flaggedQuestions);
      if (success) {
        alert(`Đã lưu ${flaggedCount} câu quan trọng vào thư viện.`);
      } else {
        alert("Thư viện đã đầy (tối đa 10 bộ). Vui lòng xóa bớt đề cũ để lưu đề này.");
      }
    }
    setConfirmModal({show: false, type: null});
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto bg-white relative pb-32">
      {/* Modal xác nhận */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-xs w-full shadow-2xl animate-pop-in border border-slate-100">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 ${
              confirmModal.type === 'home' ? 'bg-slate-100 text-slate-500' : 
              confirmModal.type === 'save_flagged' ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-500'
            }`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="text-xl font-black text-slate-800 mb-2 text-center uppercase tracking-tight">Xác nhận</h4>
            <p className="text-slate-500 text-center mb-8 text-xs font-bold leading-relaxed">
              {confirmModal.type === 'home' && "Bạn muốn quay về trang chủ? Bài làm hiện tại sẽ kết thúc."}
              {confirmModal.type === 'retake' && "Bạn muốn làm lại toàn bộ đề thi này?"}
              {confirmModal.type === 'redo' && `Bạn muốn làm lại ${mistakesCount} câu sai?`}
              {confirmModal.type === 'flagged' && `Chỉ ôn luyện ${flaggedCount} câu bạn đã đánh dấu?`}
              {confirmModal.type === 'save_flagged' && `Lưu ${flaggedCount} câu này thành một đề mới từ nguồn "${currentQuizName}"?`}
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={handleAction} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase shadow-xl shadow-indigo-100 active:scale-95 transition-all">Đồng ý</button>
              <button onClick={() => setConfirmModal({show: false, type: null})} className="w-full py-4 bg-slate-100 text-slate-400 font-black rounded-2xl text-xs uppercase active:scale-95">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Header điểm số */}
      <div className={`text-center mb-8 p-6 md:p-10 rounded-[2.5rem] ${bgColor} border border-white/50 shadow-sm flex flex-col items-center relative overflow-hidden`}>
        <div className="relative w-36 h-36 md:w-48 md:h-48 mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={radius} stroke="white" strokeWidth="12" fill="transparent" />
            <circle cx="100" cy="100" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent"
              strokeDasharray={circumference} strokeDashoffset={offset} className={`transition-all duration-1000 ${color}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">{percentage}%</span>
            <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest mt-1">Chính xác</span>
          </div>
        </div>
        <h2 className={`text-2xl md:text-3xl font-black mb-1 ${color} tracking-tight uppercase`}>{grade}</h2>
        <p className="text-sm md:text-lg text-slate-500 font-bold opacity-80">{score} đúng / {total} câu</p>
        <p className="mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentQuizName}</p>
      </div>

      {/* Action Center - Nhóm các nút hành động chính */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {/* Làm lại câu sai */}
        <button 
          onClick={() => setConfirmModal({show: true, type: 'redo'})}
          disabled={mistakesCount === 0}
          className={`py-5 px-6 rounded-3xl flex items-center justify-between transition-all active:scale-[0.98] shadow-lg ${
            mistakesCount > 0 ? 'bg-rose-600 text-white shadow-rose-100' : 'bg-slate-50 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${mistakesCount > 0 ? 'bg-white/20' : 'bg-slate-200'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="text-left">
              <span className="block font-black text-[11px] uppercase tracking-tight">Làm lại câu sai</span>
              <span className="block text-[10px] font-bold opacity-70">Có {mistakesCount} câu chưa đúng</span>
            </div>
          </div>
        </button>

        {/* Ôn tập câu đã lưu */}
        <button 
          onClick={() => setConfirmModal({show: true, type: 'flagged'})}
          disabled={flaggedCount === 0}
          className={`py-5 px-6 rounded-3xl flex items-center justify-between transition-all active:scale-[0.98] shadow-lg ${
            flaggedCount > 0 ? 'bg-amber-500 text-white shadow-amber-100' : 'bg-slate-50 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${flaggedCount > 0 ? 'bg-white/20' : 'bg-slate-200'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            </div>
            <div className="text-left">
              <span className="block font-black text-[11px] uppercase tracking-tight">Ôn tập đánh dấu</span>
              <span className="block text-[10px] font-bold opacity-70">{flaggedCount} câu quan trọng</span>
            </div>
          </div>
        </button>

        {/* Lưu bộ câu hỏi quan trọng */}
        <button 
          onClick={() => setConfirmModal({show: true, type: 'save_flagged'})}
          disabled={flaggedCount === 0}
          className={`py-5 px-6 rounded-3xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-between transition-all active:scale-[0.98] shadow-sm disabled:opacity-50`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            </div>
            <div className="text-left">
              <span className="block font-black text-[11px] uppercase tracking-tight">Lưu bộ đánh dấu</span>
              <span className="block text-[10px] font-bold opacity-70">Thêm vào thư viện</span>
            </div>
          </div>
        </button>

        {/* Làm lại toàn bộ */}
        <button 
          onClick={() => setConfirmModal({show: true, type: 'retake'})}
          className="py-5 px-6 rounded-3xl bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-between transition-all active:scale-[0.98] hover:bg-slate-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </div>
            <div className="text-left">
              <span className="block font-black text-[11px] uppercase tracking-tight">Làm lại toàn bộ</span>
              <span className="block text-[10px] font-bold opacity-70">Quay lại từ đầu đề này</span>
            </div>
          </div>
        </button>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 z-50">
        <button 
          onClick={() => setConfirmModal({show: true, type: 'home'})}
          className="max-w-4xl mx-auto w-full py-4 bg-slate-900 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          Quay lại trang chủ
        </button>
      </div>

      <style>{`
        @keyframes pop-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-pop-in { animation: pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </div>
  );
};

export default ResultView;
