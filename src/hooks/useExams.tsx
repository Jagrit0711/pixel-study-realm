import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Exam {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  created_at: string;
}

export const useExams = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching exams:', error);
    } else {
      setExams(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      setExams([]);
      setLoading(false);
      return;
    }

    fetchExams();
  }, [user]);

  const addExam = async (name: string, startDate: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('exams')
      .insert({
        user_id: user.id,
        name,
        start_date: startDate
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add exam');
      console.error(error);
      return null;
    }

    toast.success('Exam added!');
    await fetchExams();
    return data;
  };

  const updateExam = async (id: string, updates: Partial<Exam>) => {
    const { error } = await supabase
      .from('exams')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update exam');
      console.error(error);
    } else {
      toast.success('Exam updated!');
      await fetchExams();
    }
  };

  const deleteExam = async (id: string) => {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete exam');
      console.error(error);
    } else {
      toast.success('Exam deleted');
      await fetchExams();
    }
  };

  return { exams, loading, addExam, updateExam, deleteExam };
};
