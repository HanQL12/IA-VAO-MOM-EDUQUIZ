
export type QuizMode = 'practice' | 'test';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface SavedQuiz {
  id: string;
  name: string;
  questions: QuizQuestion[];
  timestamp: number;
}

export interface QuizState {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  userAnswers: (number | null)[];
  isFinished: boolean;
  score: number;
}

export interface QuizSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  mode: QuizMode;
  autoAdvanceTime: number; // in seconds, 0 to disable
}

export type AppView = 'upload' | 'config' | 'loading' | 'quiz' | 'result';
