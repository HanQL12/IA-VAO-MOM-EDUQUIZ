
import React, { useState } from 'react';
import { QuizSettings, QuizMode } from '../types';

interface QuizConfigProps {
  questionCount: number;
  onStart: (settings: QuizSettings) => void;
  onCancel: () => void;
}

const QuizConfig: React.FC<QuizConfigProps> = ({ questionCount, onStart, onCancel }) => {
  const [settings, setSettings] = useState<QuizSettings>({
    shuffleQuestions: true,
    shuffleOptions: true,
    mode: 'practice',
    autoAdvanceTime: 2
  });

  const toggleSetting = (key: keyof QuizSettings) => {
    if (typeof settings[key] === 'boolean') {
      setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const setMode = (mode: QuizMode) => {
    setSettings(prev => ({ ...prev, mode }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setSettings(prev => ({ ...prev, autoAdvanceTime: isNaN(val) ? 0 : val }));
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-10 overflow-y-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-slate-800">Cấu hình</h2>
        <p className="text-slate-400 mt-1 font-bold text-xs uppercase tracking-widest">Sẵn sàng {questionCount} câu hỏi</p>
      </div>

      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button onClick={() => setMode('practice')}
            className={`p-4 rounded-2xl border-2 text-left relative transition-all ${
              settings.mode === 'practice' ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-100'
            }`}
          >
            <h4 className="font-black text-sm text-indigo-900">Ôn tập</h4>
            <p className="text-[10px] text-indigo-600/70 mt-1">Hiện đáp án ngay khi chọn</p>
          </button>
          <button onClick={() => setMode('test')}
            className={`p-4 rounded-2xl border-2 text-left relative transition-all ${
              settings.mode === 'test' ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-100'
            }`}
          >
            <h4 className="font-black text-sm text-indigo-900">Thi thử</h4>
            <p className="text-[10px] text-indigo-600/70 mt-1">Xem kết quả khi nộp bài</p>
          </button>
        </div>

        <div className="space-y-3">
          <div onClick={() => toggleSetting('shuffleQuestions')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
              settings.shuffleQuestions ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-50'
            }`}
          >
            <span className="font-bold text-xs text-slate-700">Đảo câu hỏi</span>
            <div className={`w-10 h-5 rounded-full p-1 transition-colors ${settings.shuffleQuestions ? 'bg-indigo-600' : 'bg-slate-200'}`}>
              <div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings.shuffleQuestions ? 'translate-x-5' : ''}`}></div>
            </div>
          </div>

          <div onClick={() => toggleSetting('shuffleOptions')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
              settings.shuffleOptions ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-50'
            }`}
          >
            <span className="font-bold text-xs text-slate-700">Đảo đáp án</span>
            <div className={`w-10 h-5 rounded-full p-1 transition-colors ${settings.shuffleOptions ? 'bg-indigo-600' : 'bg-slate-200'}`}>
              <div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings.shuffleOptions ? 'translate-x-5' : ''}`}></div>
            </div>
          </div>

          {settings.mode === 'practice' && (
            <div className="p-4 rounded-xl border-2 border-slate-50 bg-slate-50 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">Tự chuyển câu (giây)</span>
              <input type="number" min="0" max="10" value={settings.autoAdvanceTime} onChange={handleTimeChange}
                className="w-10 bg-white border border-slate-200 rounded-lg text-center font-black text-indigo-600 text-sm py-1"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-8 flex flex-col gap-2">
        <button onClick={() => onStart(settings)} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl text-xs uppercase active:scale-95">Bắt đầu ngay</button>
        <button onClick={onCancel} className="w-full py-3 text-slate-400 font-black text-xs uppercase">Quay lại</button>
      </div>
    </div>
  );
};

export default QuizConfig;
