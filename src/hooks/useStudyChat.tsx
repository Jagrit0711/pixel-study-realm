import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { useTasks, DifficultyResult } from './useTasks';
import { useExams } from './useExams';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  plan?: GeneratedPlan;
}

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

export interface GeneratedPlan {
  tasks: ScheduledTask[];
  targetDate: string;
  approved: boolean;
  addedTasks: Set<number>;
}

export const useStudyChat = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { tasks, addTask } = useTasks();
  const { exams } = useExams();
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey! 👋 I'm your Study Buddy! I can help you plan your studies, give advice, or just chat about your exam prep. What's on your mind?",
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<GeneratedPlan | null>(null);

  const getContext = useCallback(() => {
    const taskHistory = tasks.map(t => ({
      subject: t.subject,
      chapter: t.chapter,
      task_type: t.task_type,
      difficulty_tier: t.difficulty_tier,
      points: t.points,
      status: t.status,
      date: t.date,
    }));

    const examData = exams.map(e => ({
      id: e.id,
      name: e.name,
      start_date: e.start_date,
    }));

    return {
      exams: examData,
      taskHistory,
      profile: {
        board: profile?.board,
        class: profile?.class,
        current_streak: profile?.current_streak || 0,
        level: profile?.level || 1,
        name: profile?.name,
      },
    };
  }, [tasks, exams, profile]);

  const sendMessage = async (content: string) => {
    if (!user || !profile) {
      toast.error('Please log in to chat');
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const chatMessages = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      chatMessages.push({ role: 'user', content });

      const { data, error } = await supabase.functions.invoke('ai-study-chat', {
        body: {
          messages: chatMessages,
          context: getContext(),
        },
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Too many messages. Please wait a moment.');
        } else if (data.error.includes('credits')) {
          toast.error('AI credits exhausted. Please try again later.');
        } else {
          toast.error(data.error);
        }
        return;
      }

      let replyContent = data.message;
      
      // Check if AI wants to generate a plan
      const planMatch = replyContent.match(/\[GENERATE_PLAN:(\d{4}-\d{2}-\d{2}):(\d+)\]/);
      
      if (planMatch) {
        const planDate = planMatch[1];
        const maxTasks = parseInt(planMatch[2]);
        
        // Remove the marker from the message
        replyContent = replyContent.replace(/\[GENERATE_PLAN:[^\]]+\]/, '').trim() || 
          `Awesome! Let me create a study plan for ${formatDate(planDate)}... 🎯`;

        setMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: replyContent,
          timestamp: new Date(),
        }]);

        // Generate the actual plan
        await generatePlan(planDate, maxTasks);
      } else {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: replyContent,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePlan = async (date: string, maxTasks: number) => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-study-chat', {
        body: {
          messages: [],
          context: getContext(),
          action: 'generate_plan',
          planDate: date,
          maxTasks,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const plan: GeneratedPlan = {
        tasks: data.tasks,
        targetDate: date,
        approved: false,
        addedTasks: new Set(),
      };

      setPendingPlan(plan);

      const planMessage: ChatMessage = {
        id: `plan-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        plan,
      };

      setMessages(prev => [...prev, planMessage]);

    } catch (error) {
      console.error('Plan generation error:', error);
      toast.error('Failed to generate plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addTaskFromPlan = async (task: ScheduledTask, index: number) => {
    if (!pendingPlan) return false;

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
      date: pendingPlan.targetDate,
      difficulty,
    });

    if (result) {
      setPendingPlan(prev => {
        if (!prev) return null;
        const newAdded = new Set(prev.addedTasks);
        newAdded.add(index);
        return { ...prev, addedTasks: newAdded };
      });
      
      // Update the plan in messages too
      setMessages(prev => prev.map(m => {
        if (m.plan) {
          const newAdded = new Set(m.plan.addedTasks);
          newAdded.add(index);
          return { ...m, plan: { ...m.plan, addedTasks: newAdded } };
        }
        return m;
      }));
      
      return true;
    }
    return false;
  };

  const addAllTasksFromPlan = async () => {
    if (!pendingPlan) return;

    let added = 0;
    for (let i = 0; i < pendingPlan.tasks.length; i++) {
      if (!pendingPlan.addedTasks.has(i)) {
        const success = await addTaskFromPlan(pendingPlan.tasks[i], i);
        if (success) added++;
      }
    }

    if (added > 0) {
      toast.success(`Added ${added} tasks to your quest board! 🎮`);
      
      // Add a celebratory message
      setMessages(prev => [...prev, {
        id: `celebrate-${Date.now()}`,
        role: 'assistant',
        content: `Awesome! I've added ${added} tasks to your quest board! 🎉 You've got this! Let me know if you need anything else or want to adjust the plan.`,
        timestamp: new Date(),
      }]);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Chat cleared! 🔄 How can I help you with your studies today?",
      timestamp: new Date(),
    }]);
    setPendingPlan(null);
  };

  return {
    messages,
    isLoading,
    pendingPlan,
    sendMessage,
    addTaskFromPlan,
    addAllTasksFromPlan,
    clearChat,
  };
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}
