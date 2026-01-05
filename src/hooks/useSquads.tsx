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
}

export const useSquads = () => {
  const { user } = useAuth();
  const [squads, setSquads] = useState<Squad[]>([]);
  const [members, setMembers] = useState<Record<string, SquadMember[]>>({});
  const [loading, setLoading] = useState(true);
  const [currentSquadId, setCurrentSquadId] = useState<string | null>(null);

  const fetchSquads = async () => {
    if (!user) return;

    // Get squads the user is a member of
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
      setSquads(squadData || []);
    }
    setLoading(false);
  };

  const fetchSquadMembers = async (squadId: string) => {
    // First get the squad members
    const { data: membersData, error: membersError } = await supabase
      .from('squad_members')
      .select('*')
      .eq('squad_id', squadId);

    if (membersError || !membersData) {
      console.error('Error fetching squad members:', membersError);
      return;
    }

    // Then fetch profiles for those members
    const userIds = membersData.map(m => m.user_id);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, name, avatar_seed, total_points, current_streak')
      .in('user_id', userIds);

    // Combine the data
    const membersWithProfiles: SquadMember[] = membersData.map(member => ({
      ...member,
      profile: profilesData?.find(p => p.user_id === member.user_id)
    }));

    setMembers(prev => ({ ...prev, [squadId]: membersWithProfiles }));
  };

  useEffect(() => {
    if (!user) {
      setSquads([]);
      setLoading(false);
      return;
    }

    fetchSquads();

    // Subscribe to squad member changes for real-time updates
    const channel = supabase
      .channel('squad-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'squad_members'
        },
        () => {
          fetchSquads();
          if (currentSquadId) {
            fetchSquadMembers(currentSquadId);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          // Refresh members when profiles update (for leaderboard)
          if (currentSquadId) {
            fetchSquadMembers(currentSquadId);
          }
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

    // Add creator as member
    const { error: memberError } = await supabase
      .from('squad_members')
      .insert({ squad_id: squad.id, user_id: user.id });

    if (memberError) {
      console.error('Failed to add creator as member:', memberError);
    }

    toast.success(`Squad "${name}" created!`);
    await fetchSquads();
    return squad;
  };

  const joinSquad = async (code: string) => {
    if (!user) return false;

    // Find squad by code
    const { data: squad, error: findError } = await supabase
      .from('squads')
      .select('id, name')
      .eq('code', code.toUpperCase())
      .maybeSingle();

    if (findError || !squad) {
      toast.error('Squad not found. Check the code and try again.');
      return false;
    }

    // Check if already a member
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

    // Check member count
    const { count } = await supabase
      .from('squad_members')
      .select('*', { count: 'exact', head: true })
      .eq('squad_id', squad.id);

    if (count && count >= 12) {
      toast.error('This squad is full (max 12 members)');
      return false;
    }

    // Join squad
    const { error: joinError } = await supabase
      .from('squad_members')
      .insert({ squad_id: squad.id, user_id: user.id });

    if (joinError) {
      toast.error('Failed to join squad');
      return false;
    }

    toast.success(`Joined "${squad.name}"!`);
    await fetchSquads();
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
    fetchSquadMembers
  };
};
