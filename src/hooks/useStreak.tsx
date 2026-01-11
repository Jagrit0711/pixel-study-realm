import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  isAtRisk: boolean;
  hoursUntilMidnight: number;
  minutesUntilMidnight: number;
  hasCompletedToday: boolean;
}

export const useStreak = () => {
  const { user } = useAuth();
  const [streakInfo, setStreakInfo] = useState<StreakInfo>({
    currentStreak: 0,
    longestStreak: 0,
    isAtRisk: false,
    hoursUntilMidnight: 0,
    minutesUntilMidnight: 0,
    hasCompletedToday: false,
  });

  const calculateTimeUntilMidnight = useCallback(() => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    
    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  }, []);

  const checkStreak = useCallback(async () => {
    if (!user) return;

    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_streak, longest_streak')
        .eq('user_id', user.id)
        .maybeSingle();

      // Get today's completed tasks
      const today = new Date().toISOString().split('T')[0];
      const { data: todayTasks } = await supabase
        .from('tasks')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('date', today);

      const hasCompletedToday = todayTasks?.some(t => t.status === 'completed') || false;
      const hasPendingTasks = todayTasks?.some(t => t.status === 'planned' || t.status === 'in_progress') || false;

      const { hours, minutes } = calculateTimeUntilMidnight();
      
      // Streak is at risk if there are pending tasks and less than 3 hours until midnight
      const isAtRisk = hasPendingTasks && !hasCompletedToday && hours < 3;

      setStreakInfo({
        currentStreak: profile?.current_streak || 0,
        longestStreak: profile?.longest_streak || 0,
        isAtRisk,
        hoursUntilMidnight: hours,
        minutesUntilMidnight: minutes,
        hasCompletedToday,
      });

      // Show warning toast if streak is at risk
      if (isAtRisk && hours <= 2) {
        toast.warning(`⚠️ Streak at risk! Complete a task in ${hours}h ${minutes}m to keep your ${profile?.current_streak || 0} day streak!`, {
          duration: 10000,
          id: 'streak-warning',
        });
      }
    } catch (error) {
      console.error('Error checking streak:', error);
    }
  }, [user, calculateTimeUntilMidnight]);

  // Update streak at midnight
  const updateStreakAtMidnight = useCallback(async () => {
    if (!user) return;

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Check if user completed any task yesterday
      const { data: yesterdayTasks } = await supabase
        .from('tasks')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('date', yesterdayStr)
        .eq('status', 'completed');

      const { data: profile } = await supabase
        .from('profiles')
        .select('current_streak, longest_streak')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) return;

      let newStreak = profile.current_streak;
      let newLongest = profile.longest_streak;

      if (yesterdayTasks && yesterdayTasks.length > 0) {
        // Streak continues - this would have been incremented when task was completed
        // Just ensure longest is updated
        newLongest = Math.max(newLongest, newStreak);
      } else if (profile.current_streak > 0) {
        // No completed tasks yesterday - streak breaks
        newStreak = 0;
        toast.error('💔 Your streak has been broken! Start fresh today.', {
          duration: 8000,
        });
      }

      await supabase
        .from('profiles')
        .update({ 
          current_streak: newStreak,
          longest_streak: newLongest,
        })
        .eq('user_id', user.id);

      checkStreak();
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  }, [user, checkStreak]);

  useEffect(() => {
    checkStreak();

    // Update time until midnight every minute
    const intervalId = setInterval(() => {
      checkStreak();
    }, 60000);

    // Schedule midnight check
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      updateStreakAtMidnight();
      // Then check every 24 hours
      setInterval(updateStreakAtMidnight, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    return () => {
      clearInterval(intervalId);
      clearTimeout(midnightTimeout);
    };
  }, [checkStreak, updateStreakAtMidnight]);

  return { streakInfo, checkStreak };
};
