import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Exam {
  id: string;
  name: string;
  startDate: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  taskType: 'reading' | 'problem-solving' | 'revision' | 'practice' | 'test-prep';
  date: string;
  difficulty?: {
    tier: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
    score: number;
    points: number;
    justification: string;
  };
  status: 'planned' | 'locked' | 'completed' | 'missed';
  completedAt?: string;
  proofUrl?: string;
}

export interface Squad {
  id: string;
  name: string;
  code: string;
  members: SquadMember[];
  createdAt: string;
}

export interface SquadMember {
  id: string;
  name: string;
  avatarSeed: string;
  points: number;
  streak: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarSeed: string;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  exp: number;
}

interface GameState {
  // Current view/room
  currentRoom: 'hub' | 'squad' | 'quest-board' | 'exam-room' | 'profile';
  currentSquadId: string | null;
  
  // User data
  profile: UserProfile;
  exams: Exam[];
  tasks: Task[];
  squads: Squad[];
  
  // Server time simulation (would be from backend in production)
  serverTime: Date;
  
  // Actions
  setCurrentRoom: (room: GameState['currentRoom']) => void;
  setCurrentSquad: (squadId: string | null) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  
  // Exam actions
  addExam: (exam: Omit<Exam, 'id' | 'createdAt'>) => void;
  updateExam: (id: string, exam: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  // Squad actions
  createSquad: (name: string) => Squad;
  joinSquad: (code: string) => boolean;
  leaveSquad: (squadId: string) => void;
  
  // Time helpers
  isDateLocked: (date: string) => boolean;
  getTimeUntilLock: (date: string) => number | null;
}

const generateId = () => Math.random().toString(36).substring(2, 9);
const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      currentRoom: 'hub',
      currentSquadId: null,
      
      profile: {
        id: generateId(),
        name: 'Adventurer',
        avatarSeed: 'hero',
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        level: 1,
        exp: 0,
      },
      
      exams: [],
      tasks: [],
      squads: [],
      
      serverTime: new Date(),
      
      setCurrentRoom: (room) => set({ currentRoom: room }),
      setCurrentSquad: (squadId) => set({ currentSquadId: squadId }),
      
      updateProfile: (profile) =>
        set((state) => ({
          profile: { ...state.profile, ...profile },
        })),
      
      addExam: (exam) =>
        set((state) => ({
          exams: [
            ...state.exams,
            {
              ...exam,
              id: generateId(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      
      updateExam: (id, examUpdate) =>
        set((state) => ({
          exams: state.exams.map((exam) =>
            exam.id === id ? { ...exam, ...examUpdate } : exam
          ),
        })),
      
      deleteExam: (id) =>
        set((state) => ({
          exams: state.exams.filter((exam) => exam.id !== id),
        })),
      
      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...task,
              id: generateId(),
              status: 'planned',
            },
          ],
        })),
      
      updateTask: (id, taskUpdate) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...taskUpdate } : task
          ),
        })),
      
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        })),
      
      createSquad: (name) => {
        const newSquad: Squad = {
          id: generateId(),
          name,
          code: generateCode(),
          members: [
            {
              id: get().profile.id,
              name: get().profile.name,
              avatarSeed: get().profile.avatarSeed,
              points: get().profile.totalPoints,
              streak: get().profile.currentStreak,
            },
          ],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ squads: [...state.squads, newSquad] }));
        return newSquad;
      },
      
      joinSquad: (code) => {
        // In production, this would verify with backend
        const existingSquad = get().squads.find((s) => s.code === code);
        if (existingSquad) {
          // Already in this squad
          return true;
        }
        // Simulate joining - in production would fetch from server
        return false;
      },
      
      leaveSquad: (squadId) =>
        set((state) => ({
          squads: state.squads.filter((s) => s.id !== squadId),
          currentSquadId: state.currentSquadId === squadId ? null : state.currentSquadId,
        })),
      
      isDateLocked: (date) => {
        const now = get().serverTime;
        const targetDate = new Date(date);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        
        // Future days are NEVER locked
        if (target > today) return false;
        
        // Past days are always locked
        if (target < today) return true;
        
        // Today: locked after 5:00 AM
        const hours = now.getHours();
        return hours >= 5;
      },
      
      getTimeUntilLock: (date) => {
        const now = get().serverTime;
        const targetDate = new Date(date);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        
        // Not today
        if (target.getTime() !== today.getTime()) return null;
        
        // Calculate time until 5 AM
        const lockTime = new Date(today);
        lockTime.setHours(5, 0, 0, 0);
        
        if (now >= lockTime) return 0;
        
        return lockTime.getTime() - now.getTime();
      },
    }),
    {
      name: 'grindquest-storage',
    }
  )
);
