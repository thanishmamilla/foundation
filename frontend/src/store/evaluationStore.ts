import { create } from 'zustand';

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface ExtractedQuestion {
  id: string;
  number: string;
  text: string;
  totalMarks: number;
  awardedMarks: number;
  studentAnswer: string | null;
  isCorrect: boolean;
  feedback: string;
  boundingBox: BoundingBox;
  pageNumber: number;
}

interface EvaluationState {
  questions: ExtractedQuestion[];
  answerSheetImageUrl: string | null;
  answerSheetType?: string;
  setEvaluationData: (questions: ExtractedQuestion[], imageUrl: string, imageType?: string) => void;
  clearEvaluationData: () => void;
}

export const useEvaluationStore = create<EvaluationState>((set) => ({
  questions: [],
  answerSheetImageUrl: null,
  answerSheetType: undefined,
  setEvaluationData: (questions, imageUrl, imageType) => set({ questions, answerSheetImageUrl: imageUrl, answerSheetType: imageType }),
  clearEvaluationData: () => set({ questions: [], answerSheetImageUrl: null, answerSheetType: undefined }),
}));
