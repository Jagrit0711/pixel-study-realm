import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SquadActivity {
  id: string;
  squad_id: string;
  user_id: string;
  activity_type: 'joined' | 'task_completed' | 'task_scheduled' | 'streak_milestone' | 'level_up' | 'proof_rejected';
  activity_data: {
    user_name?: string;
    avatar_seed?: string;
    task_title?: string;
    points?: number;
    streak?: number;
    level?: number;
    subject?: string;
    reviewer_name?: string;
    rejection_reason?: string;
    auto_approved?: boolean;
    [key: string]: unknown;
  };
  created_at: string;
}

export const useSquadActivity = (squadId: string | null) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<SquadActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    if (!squadId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('squad_activity')
      .select('*')
      .eq('squad_id', squadId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching squad activities:', error);
    } else {
      setActivities((data || []) as SquadActivity[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActivities();

    if (!squadId) return;

    // Subscribe to real-time activity updates
    const channel = supabase
      .channel(`squad-activity-${squadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'squad_activity',
          filter: `squad_id=eq.${squadId}`
        },
        (payload) => {
          const newActivity = payload.new as SquadActivity;
          setActivities(prev => [newActivity, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [squadId]);

  const logActivity = async (
    targetSquadId: string,
    activityType: SquadActivity['activity_type'],
    activityData: SquadActivity['activity_data']
  ) => {
    if (!user) return;

    // Type assertion needed until types are regenerated
    const { error } = await (supabase as any)
      .from('squad_activity')
      .insert({
        squad_id: targetSquadId,
        user_id: user.id,
        activity_type: activityType,
        activity_data: activityData
      });

    if (error) {
      console.error('Error logging activity:', error);
    }
  };

  return {
    activities,
    loading,
    logActivity,
    refetch: fetchActivities
  };
};
