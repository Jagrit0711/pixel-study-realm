import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Task } from './useTasks';

export interface ProofReview {
  id: string;
  task_id: string;
  reviewer_id: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  ai_rejection_approved?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PendingProofTask extends Task {
  owner_name?: string;
  owner_avatar?: string;
}

export const useProofReviews = () => {
  const { user } = useAuth();
  const [pendingTasks, setPendingTasks] = useState<PendingProofTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingProofs = async () => {
    if (!user) {
      setPendingTasks([]);
      setLoading(false);
      return;
    }

    // Get user's squad memberships
    const { data: squadMemberships } = await supabase
      .from('squad_members')
      .select('squad_id')
      .eq('user_id', user.id);

    if (!squadMemberships || squadMemberships.length === 0) {
      setPendingTasks([]);
      setLoading(false);
      return;
    }

    const squadIds = squadMemberships.map(sm => sm.squad_id);

    // Get all squad members (excluding self)
    const { data: squadMembers } = await supabase
      .from('squad_members')
      .select('user_id')
      .in('squad_id', squadIds)
      .neq('user_id', user.id);

    if (!squadMembers || squadMembers.length === 0) {
      setPendingTasks([]);
      setLoading(false);
      return;
    }

    const memberIds = [...new Set(squadMembers.map(sm => sm.user_id))];

    // Get pending_review tasks from squad members
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .in('user_id', memberIds)
      .eq('status', 'pending_review');

    if (error) {
      console.error('Error fetching pending proofs:', error);
      setLoading(false);
      return;
    }

    // Check for auto-approval (tasks pending for more than 24 hours)
    const now = new Date();
    const autoApproveTasks = (tasks || []).filter(task => {
      if (task.completed_at) {
        const completedAt = new Date(task.completed_at);
        const hoursSinceCompletion = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceCompletion >= 24;
      }
      return false;
    });

    // Auto-approve tasks older than 24 hours
    for (const task of autoApproveTasks) {
      await autoApproveTask(task as PendingProofTask);
    }

    // Get profiles for task owners
    const remainingTasks = (tasks || []).filter(t => !autoApproveTasks.some(at => at.id === t.id));
    const ownerIds = [...new Set(remainingTasks.map(t => t.user_id))];
    
    let profiles: any[] = [];
    if (ownerIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_seed')
        .in('user_id', ownerIds);
      profiles = data || [];
    }

    const profileMap = new Map(profiles.map(p => [p.user_id, p]));

    const enrichedTasks: PendingProofTask[] = remainingTasks.map(task => ({
      ...task,
      owner_name: profileMap.get(task.user_id)?.name,
      owner_avatar: profileMap.get(task.user_id)?.avatar_seed,
    })) as PendingProofTask[];

    setPendingTasks(enrichedTasks);
    setLoading(false);
  };

  const awardPoints = async (userId: string, points: number) => {
    // Get current profile
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('total_points, exp, level')
      .eq('user_id', userId)
      .single();

    if (fetchError || !profile) {
      console.error('Failed to fetch profile for points award:', fetchError);
      return false;
    }

    let newPoints = profile.total_points + points;
    let newExp = profile.exp + points;
    let newLevel = profile.level;

    // Level up calculation - recalculate threshold for each level
    let expForNextLevel = newLevel * 100;
    while (newExp >= expForNextLevel) {
      newExp -= expForNextLevel;
      newLevel++;
      expForNextLevel = newLevel * 100; // Recalculate for new level
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        total_points: newPoints,
        exp: newExp,
        level: newLevel
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to update profile points:', updateError);
      return false;
    }

    return true;
  };

  const autoApproveTask = async (task: PendingProofTask) => {
    // Update task status to completed
    const { error: taskError } = await supabase
      .from('tasks')
      .update({ status: 'completed' })
      .eq('id', task.id);

    if (taskError) {
      console.error('Failed to auto-approve task:', taskError);
      return;
    }

    // Award points to task owner
    await awardPoints(task.user_id, task.points);

    // Log activity as auto-approved
    await logAutoApproveActivity(task);
  };

  const logAutoApproveActivity = async (task: PendingProofTask) => {
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('name, avatar_seed')
      .eq('user_id', task.user_id)
      .single();

    const { data: squadMemberships } = await supabase
      .from('squad_members')
      .select('squad_id')
      .eq('user_id', task.user_id);

    if (!squadMemberships) return;

    const activityInserts = squadMemberships.map(sm => ({
      squad_id: sm.squad_id,
      user_id: task.user_id,
      activity_type: 'task_completed' as const,
      activity_data: {
        user_name: ownerProfile?.name || task.owner_name,
        avatar_seed: ownerProfile?.avatar_seed || task.owner_avatar,
        task_title: task.title,
        points: task.points,
        auto_approved: true,
      }
    }));

    await supabase.from('squad_activity').insert(activityInserts);
  };

  useEffect(() => {
    fetchPendingProofs();
  }, [user]);

  const approveProof = async (taskId: string) => {
    if (!user) return false;

    // Update task status to completed
    const { error: taskError } = await supabase
      .from('tasks')
      .update({ status: 'completed' })
      .eq('id', taskId);

    if (taskError) {
      toast.error('Failed to approve proof');
      return false;
    }

    // Get task details for points
    const task = pendingTasks.find(t => t.id === taskId);
    if (task) {
      // Award points to task owner
      const success = await awardPoints(task.user_id, task.points);
      if (!success) {
        toast.error('Failed to award points');
      }

      // Log activity
      await logProofActivity(task, 'approved');
    }

    // Create review record
    await (supabase as any)
      .from('proof_reviews')
      .insert({
        task_id: taskId,
        reviewer_id: user.id,
        status: 'approved'
      });

    toast.success('Proof approved! Points awarded.');
    await fetchPendingProofs();
    return true;
  };

  const rejectProof = async (taskId: string, reason: string) => {
    if (!user) return { success: false, message: 'Not authenticated' };

    const task = pendingTasks.find(t => t.id === taskId);
    if (!task) return { success: false, message: 'Task not found' };

    // Validate rejection with AI
    try {
      const { data, error } = await supabase.functions.invoke('validate-rejection', {
        body: {
          rejectionReason: reason,
          taskTitle: task.title,
          taskSubject: task.subject,
          proofUrl: task.proof_url
        }
      });

      if (error) throw error;

      if (!data.approved) {
        return { 
          success: false, 
          message: `Rejection not approved: ${data.reasoning}` 
        };
      }

      // AI approved the rejection - update task
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'planned', proof_url: null, proof_type: null })
        .eq('id', taskId);

      if (taskError) {
        return { success: false, message: 'Failed to reject proof' };
      }

      // Create review record
      await (supabase as any)
        .from('proof_reviews')
        .insert({
          task_id: taskId,
          reviewer_id: user.id,
          status: 'rejected',
          rejection_reason: reason,
          ai_rejection_approved: true
        });

      await logProofActivity(task, 'rejected', reason);
      toast.success('Proof rejected. User must resubmit.');
      await fetchPendingProofs();
      return { success: true, message: 'Rejection approved' };
    } catch (error) {
      console.error('Error validating rejection:', error);
      return { success: false, message: 'Failed to validate rejection' };
    }
  };

  const logProofActivity = async (task: PendingProofTask, action: 'approved' | 'rejected', reason?: string) => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar_seed')
      .eq('user_id', user.id)
      .single();

    const { data: squadMemberships } = await supabase
      .from('squad_members')
      .select('squad_id')
      .eq('user_id', task.user_id);

    if (!squadMemberships) return;

    const activityInserts = squadMemberships.map(sm => ({
      squad_id: sm.squad_id,
      user_id: user.id,
      activity_type: action === 'approved' ? 'task_completed' : 'proof_rejected',
      activity_data: {
        user_name: task.owner_name,
        avatar_seed: task.owner_avatar,
        task_title: task.title,
        points: action === 'approved' ? task.points : 0,
        reviewer_name: profile?.name,
        rejection_reason: reason,
      }
    }));

    await supabase.from('squad_activity').insert(activityInserts);
  };

  return {
    pendingTasks,
    loading,
    approveProof,
    rejectProof,
    refetch: fetchPendingProofs
  };
};
