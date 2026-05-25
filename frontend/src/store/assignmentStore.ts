import { create } from 'zustand';

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

export interface Assignment {
  _id: string;
  title: string;
  dueDate?: string;
  questionTypes: { type: string; count: number; marks: number }[];
  additionalInstructions?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
  paper?: QuestionPaper;
  answerKey?: string[];
  createdAt: string;
}

interface AssignmentState {
  assignments: Assignment[];
  activeAssignment: Assignment | null;
  isLoading: boolean;
  error: string | null;
  wsProgress: number;
  wsStatus: 'idle' | 'pending' | 'generating' | 'completed' | 'failed';
  wsSocket: WebSocket | null;

  fetchAssignments: () => Promise<void>;
  fetchAssignment: (id: string) => Promise<Assignment | null>;
  createAssignment: (data: {
    title: string;
    dueDate?: string;
    questionTypes: { type: string; count: number; marks: number }[];
    additionalInstructions?: string;
  }) => Promise<Assignment | null>;
  deleteAssignment: (id: string) => Promise<boolean>;
  regenerateAssignment: (id: string) => Promise<boolean>;
  connectWebSocket: (assignmentId: string, onComplete?: () => void) => void;
  disconnectWebSocket: () => void;
  resetWsState: () => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  activeAssignment: null,
  isLoading: false,
  error: null,
  wsProgress: 0,
  wsStatus: 'idle',
  wsSocket: null,

  fetchAssignments: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/assignments`);
      if (!res.ok) throw new Error('Failed to fetch assignments');
      const data = await res.json();
      set({ assignments: data, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchAssignment: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/assignments/${id}`);
      if (!res.ok) throw new Error('Failed to fetch assignment');
      const data = await res.json();
      set({ activeAssignment: data, isLoading: false });
      return data;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  createAssignment: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create assignment');
      }
      const newAssignment = await res.json();
      set((state) => ({
        assignments: [newAssignment, ...state.assignments],
        isLoading: false,
      }));
      return newAssignment;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  deleteAssignment: async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/assignments/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete assignment');
      set((state) => ({
        assignments: state.assignments.filter((a) => a._id !== id),
        activeAssignment: state.activeAssignment?._id === id ? null : state.activeAssignment,
      }));
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  regenerateAssignment: async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/assignments/${id}/regenerate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to trigger regeneration');
      
      // Update local status of active assignment
      set((state) => {
        const updated = state.activeAssignment?._id === id
          ? { ...state.activeAssignment, status: 'pending' as const, paper: undefined, answerKey: undefined }
          : null;
        
        const updatedList = state.assignments.map((a) => 
          a._id === id ? { ...a, status: 'pending' as const, paper: undefined, answerKey: undefined } : a
        );

        return {
          activeAssignment: updated,
          assignments: updatedList,
          wsStatus: 'pending',
          wsProgress: 0
        };
      });

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  connectWebSocket: (assignmentId: string, onComplete?: () => void) => {
    // Clean up existing socket
    const existingSocket = get().wsSocket;
    if (existingSocket) {
      existingSocket.close();
    }

    console.log(`🔌 Establishing WebSocket for assignment: ${assignmentId}`);
    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      // Subscribe to this assignment
      socket.send(JSON.stringify({ type: 'subscribe', assignmentId }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.assignmentId !== assignmentId) return;

        console.log('📡 WS Message Received:', data);

        if (data.status === 'generating') {
          set({
            wsStatus: 'generating',
            wsProgress: data.progress || 0,
          });
        } else if (data.status === 'completed') {
          set((state) => {
            const updatedAssignment = state.activeAssignment
              ? { ...state.activeAssignment, status: 'completed' as const, paper: data.paper, answerKey: data.answerKey }
              : null;
            
            return {
              wsStatus: 'completed',
              wsProgress: 100,
              activeAssignment: updatedAssignment,
            };
          });
          if (onComplete) onComplete();
          socket.close();
        } else if (data.status === 'failed') {
          set((state) => {
            const updatedAssignment = state.activeAssignment
              ? { ...state.activeAssignment, status: 'failed' as const, error: data.error }
              : null;

            return {
              wsStatus: 'failed',
              wsProgress: 0,
              activeAssignment: updatedAssignment,
            };
          });
          socket.close();
        }
      } catch (err) {
        console.error('❌ Failed to parse WS message:', err);
      }
    };

    socket.onclose = () => {
      console.log('🔌 WebSocket connection closed.');
      set({ wsSocket: null });
    };

    set({ wsSocket: socket });
  },

  disconnectWebSocket: () => {
    const socket = get().wsSocket;
    if (socket) {
      socket.close();
      set({ wsSocket: null });
    }
  },

  resetWsState: () => {
    set({ wsStatus: 'idle', wsProgress: 0 });
  }
}));
