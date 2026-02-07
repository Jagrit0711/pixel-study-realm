import { useState, useEffect, useRef } from 'react';
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
  status: 'planned' | 'locked' | 'completed' | 'missed' | 'pending_review';
  proof_url?: string;
  proof_type?: 'upload' | 'quiz';
  quiz_score?: number;
  completed_at?: string;
  created_at: string;
  estimated_minutes?: number;
}

export interface DifficultyResult {
  tier: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  score: number;
  points: number;
  estimatedMinutes: number;
  justification: string;
}

export const useTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingDifficulty, setAnalyzingDifficulty] = useState(false);
  const awardedTaskIdsRef = useRef<Set<string>>(new Set());

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

    // Subscribe to task changes with unique channel name per user
    const channelName = `task-changes-${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Task INSERT received:', payload);
          const newTask = payload.new as Task;
          setTasks(prev => {
            // Prevent duplicates
            if (prev.some(t => t.id === newTask.id)) return prev;
            return [...prev, newTask].sort((a, b) => a.date.localeCompare(b.date));
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('Task UPDATE received:', payload);
          const oldRow = payload.old as Partial<Task> | null;
          const newRow = payload.new as Task;

          // Handle proof approval points
          const wasPendingReview = oldRow?.status === 'pending_review';
          const isNowCompleted = newRow?.status === 'completed';
          const isUploadProof = newRow?.proof_type === 'upload';

          if (wasPendingReview && isNowCompleted && isUploadProof) {
            if (!awardedTaskIdsRef.current.has(newRow.id)) {
              awardedTaskIdsRef.current.add(newRow.id);
              await awardTaskPoints(newRow);
              toast.success(`Proof approved! +${newRow.points} points`);
            }
          }

          setTasks(prev => prev.map(t => t.id === newRow.id ? newRow : t));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Task DELETE received:', payload);
          const deletedId = (payload.old as { id: string }).id;
          setTasks(prev => prev.filter(t => t.id !== deletedId));
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const analyzeDifficulty = async (
    subject: string,
    chapter: string,
    taskType: string,
    examName?: string,
    examDate?: string,
    board?: string,
    classLevel?: string
  ): Promise<DifficultyResult | null> => {
    setAnalyzingDifficulty(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-difficulty', {
        body: { subject, chapter, taskType, examName, examDate, board, classLevel }
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
        status: 'planned',
        estimated_minutes: task.difficulty.estimatedMinutes || 30
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add quest');
      console.error(error);
      return null;
    }

    // Log activity to squad if user is in a squad
    await logTaskActivity('task_scheduled', data as Task);

    toast.success('Quest added!');
    return data;
  };

  const logTaskActivity = async (type: 'task_scheduled' | 'task_completed', task: Task) => {
    if (!user) return;

    // Get user's profile for name and avatar
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar_seed')
      .eq('user_id', user.id)
      .single();

    // Get user's squad memberships
    const { data: squadMemberships } = await supabase
      .from('squad_members')
      .select('squad_id')
      .eq('user_id', user.id);

    if (!squadMemberships || squadMemberships.length === 0) return;

    // Log activity to all squads
    const activityInserts = squadMemberships.map(sm => ({
      squad_id: sm.squad_id,
      user_id: user.id,
      activity_type: type,
      activity_data: {
        user_name: profile?.name || 'Unknown',
        avatar_seed: profile?.avatar_seed || 'default',
        task_title: task.title,
        points: task.points,
        subject: task.subject,
      }
    }));

    await supabase.from('squad_activity').insert(activityInserts);
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

    // For quiz completion, mark as completed immediately
    // For upload, mark as pending_review (squad member will verify)
    const newStatus = proofType === 'quiz' ? 'completed' : 'pending_review';

    const { error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
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

    // Only award points for quiz completion (upload needs squad review)
    if (proofType === 'quiz') {
      await awardTaskPoints(task);
      await logTaskActivity('task_completed', task);
      toast.success(`Quest completed! +${task.points} points`);
    } else {
      toast.success('Proof uploaded! Waiting for squad member review.');
    }
  };

  const awardTaskPoints = async (task: Task) => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points, exp, level')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      const newPoints = profile.total_points + task.points;
      let newExp = profile.exp + task.points;
      let newLevel = profile.level;

      // Recalculate the threshold each time the user levels up
      let expForNextLevel = newLevel * 100;
      while (newExp >= expForNextLevel) {
        newExp -= expForNextLevel;
        newLevel++;
        expForNextLevel = newLevel * 100;
      }

      await supabase
        .from('profiles')
        .update({
          total_points: newPoints,
          exp: newExp,
          level: newLevel
        })
        .eq('user_id', user.id);
    }
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
