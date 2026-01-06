import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Task } from './useTasks';

export interface SquadMemberTask extends Task {
  owner_name?: string;
  owner_avatar?: string;
}

export const useSquadTasks = (squadId: string | null) => {
  const { user } = useAuth();
  const [squadTasks, setSquadTasks] = useState<SquadMemberTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSquadTasks = async () => {
    if (!user || !squadId) {
      setSquadTasks([]);
      setLoading(false);
      return;
    }

    // Get squad members (excluding self)
    const { data: squadMembers } = await supabase
      .from('squad_members')
      .select('user_id')
      .eq('squad_id', squadId)
      .neq('user_id', user.id);

    if (!squadMembers || squadMembers.length === 0) {
      setSquadTasks([]);
      setLoading(false);
      return;
    }

    const memberIds = squadMembers.map(sm => sm.user_id);
    const today = new Date().toISOString().split('T')[0];

    // Get today's tasks from squad members
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .in('user_id', memberIds)
      .eq('date', today)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching squad tasks:', error);
      setLoading(false);
      return;
    }

    // Get profiles for task owners
    const ownerIds = [...new Set((tasks || []).map(t => t.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, name, avatar_seed')
      .in('user_id', ownerIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    const enrichedTasks: SquadMemberTask[] = (tasks || []).map(task => ({
      ...task,
      owner_name: profileMap.get(task.user_id)?.name,
      owner_avatar: profileMap.get(task.user_id)?.avatar_seed,
    })) as SquadMemberTask[];

    setSquadTasks(enrichedTasks);
    setLoading(false);
  };

  useEffect(() => {
    fetchSquadTasks();
    
    // Subscribe to task changes for real-time updates
    if (squadId) {
      const channel = supabase
        .channel(`squad-tasks-${squadId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks'
          },
          () => {
            fetchSquadTasks();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, squadId]);

  return {
    squadTasks,
    loading,
    refetch: fetchSquadTasks
  };
};
