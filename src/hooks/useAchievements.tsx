import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_required?: number;
  streak_required?: number;
  tasks_required?: number;
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export const useAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      // Fetch all achievements
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*');

      setAchievements(allAchievements || []);

      if (user) {
        // Fetch user's unlocked achievements
        const { data: unlocked } = await supabase
          .from('user_achievements')
          .select('*, achievement:achievements(*)')
          .eq('user_id', user.id);

        setUserAchievements(unlocked || []);
      }
      setLoading(false);
    };

    fetchAchievements();
  }, [user]);

  const checkAndUnlockAchievements = async (
    totalPoints: number,
    currentStreak: number,
    completedTasks: number
  ) => {
    if (!user) return;

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));
    const toUnlock: string[] = [];

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;

      if (achievement.points_required && totalPoints >= achievement.points_required) {
        shouldUnlock = true;
      }
      if (achievement.streak_required && currentStreak >= achievement.streak_required) {
        shouldUnlock = true;
      }
      if (achievement.tasks_required && completedTasks >= achievement.tasks_required) {
        shouldUnlock = true;
      }

      if (shouldUnlock) {
        toUnlock.push(achievement.id);
      }
    }

    if (toUnlock.length > 0) {
      const { data } = await supabase
        .from('user_achievements')
        .insert(toUnlock.map(id => ({ user_id: user.id, achievement_id: id })))
        .select('*, achievement:achievements(*)');

      if (data) {
        setUserAchievements(prev => [...prev, ...data]);
        return data.map(ua => ua.achievement);
      }
    }

    return [];
  };

  return {
    achievements,
    userAchievements,
    loading,
    checkAndUnlockAchievements
  };
};
