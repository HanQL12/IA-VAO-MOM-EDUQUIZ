
import React, { useRef, useState } from 'react';
import { SavedQuiz } from '../types';

interface FileUploadProps {
  onUpload: (file: File) => void;
  savedQuizzes: SavedQuiz[];
  onLoadSaved: (quiz: SavedQuiz) => void;
  onDeleteSaved: (id: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload, savedQuizzes, onLoadSaved, onDeleteSaved }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        onUpload(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const handleDeleteClick = (id: string) => {
    // Sử dụng window.confirm để xác nhận xóa
    if (window.confirm("Bạn có chắc chắn muốn xóa bộ đề này khỏi thư viện?")) {
      onDeleteSaved(id);
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${d.getMinutes()}`;
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto">
      {/* Khu vực Upload mới */}
      <div 
        className={`flex-shrink-0 h-48 md:h-64 flex flex-col items-center justify-center border-4 border-dashed rounded-3xl transition-all duration-300 mb-8 ${
          isDragging ? 'border-indigo-500 bg-indigo-50 scale-[0.98]' : 'border-slate-100 hover:border-indigo-200'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-3 text-indigo-600 shadow-inner">
          <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 className="text-sm md:text-lg font-black text-slate-800">Tải đề PDF mới</h3>
        <p className="text-[10px] md:text-xs text-slate-400 mb-4 font-bold uppercase tracking-tight">Kéo thả hoặc nhấn để chọn</p>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] md:text-xs uppercase shadow-lg active:scale-95 transition-transform"
        >
          Chọn file
        </button>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden"
        />
      </div>
      
      {/* Thư viện đề đã lưu */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4 px-1">
          <h4 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest">Thư viện đề thi ({savedQuizzes.length})</h4>
        </div>

        {savedQuizzes.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl p-8 text-center">
            <p className="text-slate-400 text-[10px] font-bold uppercase">Chưa có đề nào được lưu</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {savedQuizzes.map((quiz) => (
              <div 
                key={quiz.id} 
                className="group bg-white border border-slate-100 rounded-2xl p-2 pl-4 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex items-center justify-between"
              >
                {/* Khu vực thông tin - Click vào đây để mở đề */}
                <div 
                  className="flex-1 min-w-0 pr-4 cursor-pointer py-2"
                  onClick={() => onLoadSaved(quiz)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${quiz.name.startsWith('[Flagged]') ? 'bg-amber-400' : 'bg-indigo-400'}`}></span>
                    <h5 className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">{quiz.name}</h5>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{quiz.questions.length} câu hỏi</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase opacity-50">•</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{formatDate(quiz.timestamp)}</span>
                  </div>
                </div>

                {/* Khu vực nút bấm - Tách biệt hoàn toàn với sự kiện click ở trên */}
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => onLoadSaved(quiz)}
                    className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-colors"
                    title="Làm bài này"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleDeleteClick(quiz.id)}
                    className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-colors mr-2"
                    title="Xóa đề này"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
