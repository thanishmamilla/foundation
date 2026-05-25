import mongoose, { Schema, Document } from 'mongoose';

export interface QuestionTypeInput {
  type: string;
  count: number;
  marks: number;
}

export interface Question {
  text: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  marks: number;
}

export interface PaperSection {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface QuestionPaper {
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  instructions: string;
  sections: PaperSection[];
}

export interface IAssignment extends Document {
  title: string;
  dueDate?: Date;
  questionTypes: QuestionTypeInput[];
  additionalInstructions?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
  paper?: QuestionPaper;
  answerKey?: string[];
  createdAt: Date;
}

// In-Memory Fallback Store (for environment where MongoDB is not running)
export class InMemoryAssignmentStore {
  private static store: Map<string, any> = new Map();

  static async create(data: any): Promise<any> {
    const id = new mongoose.Types.ObjectId().toString();
    const assignment = {
      _id: id,
      id: id,
      ...data,
      createdAt: new Date(),
    };
    this.store.set(id, assignment);
    return assignment;
  }

  static async find(): Promise<any[]> {
    return Array.from(this.store.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  static async findById(id: string): Promise<any | null> {
    return this.store.get(id) || null;
  }

  static async findByIdAndUpdate(id: string, update: any, options = { new: true }): Promise<any | null> {
    const current = this.store.get(id);
    if (!current) return null;
    const updated = { ...current, ...update };
    this.store.set(id, updated);
    return updated;
  }

  static async findByIdAndDelete(id: string): Promise<any | null> {
    const current = this.store.get(id);
    if (!current) return null;
    this.store.delete(id);
    return current;
  }
}

const QuestionTypeSchema = new Schema<QuestionTypeInput>({
  type: { type: String, required: true },
  count: { type: Number, required: true, min: 1 },
  marks: { type: Number, required: true, min: 1 },
}, { _id: false });

const QuestionSchema = new Schema<Question>({
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Moderate', 'Hard'], required: true },
  marks: { type: Number, required: true },
}, { _id: false });

const PaperSectionSchema = new Schema<PaperSection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: [QuestionSchema],
}, { _id: false });

const QuestionPaperSchema = new Schema<QuestionPaper>({
  schoolName: { type: String, required: true },
  subject: { type: String, required: true },
  className: { type: String, required: true },
  timeAllowed: { type: String, required: true },
  maxMarks: { type: Number, required: true },
  instructions: { type: String, required: true },
  sections: [PaperSectionSchema],
}, { _id: false });

const AssignmentSchema = new Schema<IAssignment>({
  title: { type: String, required: true },
  dueDate: { type: Date },
  questionTypes: [QuestionTypeSchema],
  additionalInstructions: { type: String },
  status: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed'],
    default: 'pending',
  },
  error: { type: String },
  paper: { type: QuestionPaperSchema },
  answerKey: { type: [String] },
  createdAt: { type: Date, default: Date.now },
});

export const AssignmentModel = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
