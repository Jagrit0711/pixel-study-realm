import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { useTasks, Task, DifficultyResult } from './useTasks';
import { useExams } from './useExams';
import { toast } from 'sonner';

export interface ScheduledTask {
  title: string;
  subject: string;
  chapter: string;
  task_type: 'reading' | 'problem-solving' | 'revision' | 'practice' | 'test-prep';
  difficulty_tier: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  difficulty_score: number;
  points: number;
  estimated_minutes: number;
  justification: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ScheduleAnalysis {
  subjectPerformance: Record<string, { completed: number; missed: number; avgPoints: number }>;
  totalHistoricalTasks: number;
  upcomingExamsCount: number;
}

export interface GeneratedSchedule {
  tasks: ScheduledTask[];
  generatedAt: string;
  targetDate: string;
  analysis: ScheduleAnalysis;
}

export interface SchedulePreferences {
  maxTasks?: number;
  focusSubjects?: string[];
  avoidDifficulty?: string[];
}

export const useSchedule = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { tasks, addTask } = useTasks();
  const { exams } = useExams();
  const [generating, setGenerating] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedSchedule | null>(null);
  const [scheduleHistory, setScheduleHistory] = useState<GeneratedSchedule[]>([]);

  const generateSchedule = async (
    targetDate: string,
    preferences?: SchedulePreferences
  ): Promise<GeneratedSchedule | null> => {
    if (!user || !profile) {
      toast.error('Please log in to generate a schedule');
      return null;
    }

    setGenerating(true);

    try {
      // Prepare task history for AI
      const taskHistory = tasks.map(t => ({
        subject: t.subject,
        chapter: t.chapter,
        task_type: t.task_type,
        difficulty_tier: t.difficulty_tier,
        points: t.points,
        status: t.status,
        date: t.date,
      }));

      // Prepare exam data
      const examData = exams.map(e => ({
        id: e.id,
        name: e.name,
        start_date: e.start_date,
      }));

      const { data, error } = await supabase.functions.invoke('generate-schedule', {
        body: {
          exams: examData,
          taskHistory,
          profile: {
            board: profile.board,
            class: profile.class,
            current_streak: profile.current_streak,
            level: profile.level,
          },
          targetDate,
          preferences,
        },
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Too many requests. Please wait a moment and try again.');
        } else if (data.error.includes('credits')) {
          toast.error('AI credits exhausted. Please try again later.');
        } else {
          toast.error(data.error);
        }
        return null;
      }

      const schedule: GeneratedSchedule = data;
      setGeneratedSchedule(schedule);
      
      // Add to history
      setScheduleHistory(prev => [schedule, ...prev.slice(0, 9)]);

      toast.success(`Generated ${schedule.tasks.length} tasks for your schedule!`);
      return schedule;

    } catch (error) {
      console.error('Schedule generation error:', error);
      toast.error('Failed to generate schedule. Please try again.');
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const addScheduledTask = async (task: ScheduledTask, date: string) => {
    const difficulty: DifficultyResult = {
      tier: task.difficulty_tier,
      score: task.difficulty_score,
      points: task.points,
      estimatedMinutes: task.estimated_minutes,
      justification: task.justification,
    };

    const result = await addTask({
      title: task.title,
      subject: task.subject,
      chapter: task.chapter,
      task_type: task.task_type,
      date,
      difficulty,
    });

    return result;
  };

  const addAllScheduledTasks = async (schedule: GeneratedSchedule) => {
    let added = 0;
    let failed = 0;

    for (const task of schedule.tasks) {
      const result = await addScheduledTask(task, schedule.targetDate);
      if (result) {
        added++;
      } else {
        failed++;
      }
    }

    if (failed > 0) {
      toast.warning(`Added ${added} tasks, ${failed} failed`);
    } else {
      toast.success(`Added all ${added} tasks to your quest board!`);
    }

    return { added, failed };
  };

  const getSubjectInsights = () => {
    if (!generatedSchedule?.analysis) return null;

    const { subjectPerformance } = generatedSchedule.analysis;
    const insights: Array<{ subject: string; insight: string; type: 'success' | 'warning' | 'info' }> = [];

    Object.entries(subjectPerformance).forEach(([subject, perf]) => {
      const total = perf.completed + perf.missed;
      if (total === 0) return;

      const rate = (perf.completed / total) * 100;

      if (rate >= 80) {
        insights.push({
          subject,
          insight: `Great job! ${rate.toFixed(0)}% completion rate`,
          type: 'success',
        });
      } else if (rate >= 50) {
        insights.push({
          subject,
          insight: `${rate.toFixed(0)}% completion - room for improvement`,
          type: 'info',
        });
      } else {
        insights.push({
          subject,
          insight: `Only ${rate.toFixed(0)}% completion - needs focus!`,
          type: 'warning',
        });
      }
    });

    return insights;
  };

  const clearSchedule = () => {
    setGeneratedSchedule(null);
  };

  return {
    generating,
    generatedSchedule,
    scheduleHistory,
    generateSchedule,
    addScheduledTask,
    addAllScheduledTasks,
    getSubjectInsights,
    clearSchedule,
  };
};
