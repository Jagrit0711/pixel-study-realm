import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Squad {
  id: string;
  name: string;
  code: string;
  created_by: string;
  created_at: string;
}

export interface SquadMember {
  id: string;
  user_id: string;
  squad_id: string;
  joined_at: string;
  profile?: {
    name: string;
    avatar_seed: string;
    total_points: number;
    current_streak: number;
  };
  // Computed from tasks - source of truth for points
  computed_points?: number;
}

export const useSquads = () => {
  const { user } = useAuth();
  const [squads, setSquads] = useState<Squad[]>([]);
  const [members, setMembers] = useState<Record<string, SquadMember[]>>({});
  const [loading, setLoading] = useState(true);
  const [currentSquadId, setCurrentSquadId] = useState<string | null>(null);

  // Activity logging helper
  const logSquadActivity = async (squadId: string, activityType: string, activityData: Record<string, unknown>) => {
    if (!user) return;
    await (supabase as any)
      .from('squad_activity')
      .insert({
        squad_id: squadId,
        user_id: user.id,
        activity_type: activityType,
        activity_data: activityData
      });
  };

  const fetchSquads = async () => {
    if (!user) return;

    const { data: memberData, error: memberError } = await supabase
      .from('squad_members')
      .select('squad_id')
      .eq('user_id', user.id);

    if (memberError) {
      console.error('Error fetching squad memberships:', memberError);
      return;
    }

    const squadIds = memberData?.map(m => m.squad_id) || [];
    
    if (squadIds.length === 0) {
      setSquads([]);
      setLoading(false);
      return;
    }

    const { data: squadData, error: squadError } = await supabase
      .from('squads')
      .select('*')
      .in('id', squadIds);

    if (squadError) {
      console.error('Error fetching squads:', squadError);
    } else {
      const fetchedSquads = squadData || [];
      setSquads(fetchedSquads);
      
      // Auto-select if user has exactly 1 squad
      if (fetchedSquads.length === 1 && !currentSquadId) {
        setCurrentSquadId(fetchedSquads[0].id);
      }
    }
    setLoading(false);
  };

  const fetchSquadMembers = async (squadId: string) => {
    const { data: membersData, error: membersError } = await supabase
      .from('squad_members')
      .select('*')
      .eq('squad_id', squadId);

    if (membersError || !membersData) {
      console.error('Error fetching squad members:', membersError);
      return;
    }

    const userIds = membersData.map(m => m.user_id);
    
    // Fetch profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, name, avatar_seed, total_points, current_streak')
      .in('user_id', userIds);

    // Fetch completed tasks for each member to compute accurate points
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('user_id, points, status')
      .in('user_id', userIds)
      .eq('status', 'completed');

    // Compute points per user from tasks
    const pointsByUser: Record<string, number> = {};
    (tasksData || []).forEach(task => {
      pointsByUser[task.user_id] = (pointsByUser[task.user_id] || 0) + task.points;
    });

    const membersWithProfiles: SquadMember[] = membersData.map(member => ({
      ...member,
      profile: profilesData?.find(p => p.user_id === member.user_id),
      computed_points: pointsByUser[member.user_id] || 0
    }));

    setMembers(prev => ({ ...prev, [squadId]: membersWithProfiles }));
  };

  // Helper to get profile info for activity logging
  const getProfileInfo = async () => {
    if (!user) return { name: 'Unknown', avatar_seed: 'default' };
    const { data } = await supabase
      .from('profiles')
      .select('name, avatar_seed')
      .eq('user_id', user.id)
      .single();
    return data || { name: 'Unknown', avatar_seed: 'default' };
  };

  // Fetch squads on mount
  useEffect(() => {
    if (!user) {
      setSquads([]);
      setLoading(false);
      return;
    }
    fetchSquads();
  }, [user]);

  // Subscribe to squad member changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('squad-members-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'squad_members' },
        () => {
          fetchSquads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Subscribe to profile and task changes for current squad
  useEffect(() => {
    if (!user || !currentSquadId) return;

    // Fetch members immediately when squad is selected
    fetchSquadMembers(currentSquadId);

    const channel = supabase
      .channel(`squad-data-${currentSquadId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchSquadMembers(currentSquadId);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          // Refetch when tasks change (completion, etc.)
          fetchSquadMembers(currentSquadId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentSquadId]);

  const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const createSquad = async (name: string) => {
    if (!user) return null;

    const code = generateCode();
    
    const { data: squad, error: squadError } = await supabase
      .from('squads')
      .insert({ name, code, created_by: user.id })
      .select()
      .single();

    if (squadError) {
      toast.error('Failed to create squad');
      console.error(squadError);
      return null;
    }

    const { error: memberError } = await supabase
      .from('squad_members')
      .insert({ squad_id: squad.id, user_id: user.id });

    if (memberError) {
      console.error('Failed to add creator as member:', memberError);
    }

    // Log activity
    const profile = await getProfileInfo();
    await logSquadActivity(squad.id, 'joined', {
      user_name: profile.name,
      avatar_seed: profile.avatar_seed
    });

    toast.success(`Squad "${name}" created!`);
    await fetchSquads();
    setCurrentSquadId(squad.id);
    return squad;
  };

  const joinSquad = async (code: string) => {
    if (!user) return false;

    const { data: squadData, error: findError } = await (supabase.rpc as any)(
      'get_squad_by_code', 
      { squad_code: code.toUpperCase() }
    );

    const squad = squadData?.[0];

    if (findError || !squad) {
      toast.error('Squad not found. Check the code and try again.');
      return false;
    }

    const { data: existing } = await supabase
      .from('squad_members')
      .select('id')
      .eq('squad_id', squad.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      toast.error('You are already in this squad!');
      return false;
    }

    const { count } = await supabase
      .from('squad_members')
      .select('*', { count: 'exact', head: true })
      .eq('squad_id', squad.id);

    if (count && count >= 12) {
      toast.error('This squad is full (max 12 members)');
      return false;
    }

    const { error: joinError } = await supabase
      .from('squad_members')
      .insert({ squad_id: squad.id, user_id: user.id });

    if (joinError) {
      toast.error('Failed to join squad');
      return false;
    }

    // Log activity
    const profile = await getProfileInfo();
    await logSquadActivity(squad.id, 'joined', {
      user_name: profile.name,
      avatar_seed: profile.avatar_seed
    });

    toast.success(`Joined "${squad.name}"!`);
    await fetchSquads();
    setCurrentSquadId(squad.id);
    return true;
  };

  const leaveSquad = async (squadId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('squad_members')
      .delete()
      .eq('squad_id', squadId)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to leave squad');
    } else {
      toast.success('Left squad');
      if (currentSquadId === squadId) {
        setCurrentSquadId(null);
      }
      await fetchSquads();
    }
  };

  return {
    squads,
    members,
    loading,
    currentSquadId,
    setCurrentSquadId,
    createSquad,
    joinSquad,
    leaveSquad,
    fetchSquadMembers,
    logSquadActivity,
    getProfileInfo
  };
};
