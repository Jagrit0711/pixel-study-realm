import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Task {
  id: string;
  user_id: string;
  exam_id?: string;
  title: string;
  subject: string;
  chapter: string;
  task_type: 'reading' | 'problem-solving' | 'revision' | 'practice' | 'test-prep';
  date: string;
  difficulty_tier?: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  difficulty_score?: number;
  points: number;
  difficulty_justification?: string;
  status: 'planned' | 'locked' | 'completed' | 'missed';
  proof_url?: string;
  proof_type?: 'upload' | 'quiz';
  quiz_score?: number;
  completed_at?: string;
  created_at: string;
}

export interface DifficultyResult {
  tier: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  score: number;
  points: number;
  justification: string;
}

export const useTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingDifficulty, setAnalyzingDifficulty] = useState(false);

  const fetchTasks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data as Task[] || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    fetchTasks();

    // Subscribe to task changes
    const channel = supabase
      .channel('task-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const analyzeDifficulty = async (
    subject: string,
    chapter: string,
    taskType: string,
    examName?: string,
    examDate?: string
  ): Promise<DifficultyResult | null> => {
    setAnalyzingDifficulty(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-difficulty', {
        body: { subject, chapter, taskType, examName, examDate }
      });

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return null;
      }

      return data as DifficultyResult;
    } catch (error) {
      console.error('Error analyzing difficulty:', error);
      toast.error('AI analysis failed. Cannot create quest without difficulty scoring.');
      return null;
    } finally {
      setAnalyzingDifficulty(false);
    }
  };

  const addTask = async (task: {
    title: string;
    subject: string;
    chapter: string;
    task_type: Task['task_type'];
    date: string;
    exam_id?: string;
    difficulty: DifficultyResult;
  }) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: task.title,
        subject: task.subject,
        chapter: task.chapter,
        task_type: task.task_type,
        date: task.date,
        exam_id: task.exam_id,
        difficulty_tier: task.difficulty.tier,
        difficulty_score: task.difficulty.score,
        points: task.difficulty.points,
        difficulty_justification: task.difficulty.justification,
        status: 'planned'
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add quest');
      console.error(error);
      return null;
    }

    toast.success('Quest added!');
    return data;
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId);

    if (error) {
      toast.error('Failed to update quest');
      console.error(error);
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      toast.error('Failed to delete quest');
      console.error(error);
    } else {
      toast.success('Quest removed');
    }
  };

  const completeTask = async (taskId: string, proofType: 'upload' | 'quiz', proofUrl?: string, quizScore?: number) => {
    if (!user) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        proof_type: proofType,
        proof_url: proofUrl,
        quiz_score: quizScore,
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) {
      toast.error('Failed to complete quest');
      return;
    }

    // Update profile points
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points, exp, level')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      const newPoints = profile.total_points + task.points;
      const newExp = profile.exp + task.points;
      const expForNextLevel = profile.level * 100;
      let newLevel = profile.level;
      let remainingExp = newExp;

      while (remainingExp >= expForNextLevel) {
        remainingExp -= expForNextLevel;
        newLevel++;
      }

      await supabase
        .from('profiles')
        .update({
          total_points: newPoints,
          exp: remainingExp,
          level: newLevel
        })
        .eq('user_id', user.id);
    }

    toast.success(`Quest completed! +${task.points} points`);
  };

  const uploadProof = async (taskId: string, file: File) => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${taskId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('proof-uploads')
      .upload(fileName, file);

    if (uploadError) {
      toast.error('Failed to upload proof');
      console.error(uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('proof-uploads')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  // Time locking logic
  const isDateLocked = (date: string) => {
    const now = new Date();
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
  };

  return {
    tasks,
    loading,
    analyzingDifficulty,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    uploadProof,
    analyzeDifficulty,
    isDateLocked
  };
};
