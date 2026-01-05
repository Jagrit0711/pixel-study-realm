import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTasks } from '@/hooks/useTasks';
import { useExams } from '@/hooks/useExams';
import { useSquads } from '@/hooks/useSquads';
import { useAchievements } from '@/hooks/useAchievements';
import { PixelPanel } from '../game/PixelPanel';
import { PixelButton } from '../game/PixelButton';
import { PixelInput } from '../game/PixelInput';
import { PixelAvatar } from '../game/PixelAvatar';
import { PixelBar } from '../game/PixelBar';
import { motion } from 'framer-motion';
import { User, Edit2, Check, Star, Flame, Trophy, Target, Award, IndianRupee, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const ProfileRoomConnected = () => {
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const { tasks } = useTasks();
  const { exams } = useExams();
  const { squads } = useSquads();
  const { achievements, userAchievements } = useAchievements();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile?.name || '');

  if (loading || !profile) {
    return (
      <motion.div className="min-h-screen pt-24 pb-24 px-4 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </motion.div>
    );
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const missedTasks = tasks.filter(t => t.status === 'missed').length;
  const totalPoints = profile.total_points;
  const expForNextLevel = profile.level * 100;

  // Calculate money owed/to receive
  const earnedPoints = tasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.points, 0);
  const lostPoints = tasks.filter(t => t.status === 'missed').reduce((sum, t) => sum + t.points, 0);

  const handleSaveName = async () => {
    if (!tempName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    await updateProfile({ name: tempName });
    setIsEditingName(false);
  };

  const generateNewAvatar = async () => {
    const newSeed = Math.random().toString(36).substring(2, 10);
    await updateProfile({ avatar_seed: newSeed });
  };

  const unlockedAchievementIds = new Set(userAchievements.map(ua => ua.achievement_id));

  const stats = [
    { icon: Star, label: 'Total Points', value: totalPoints, color: 'text-game-gold' },
    { icon: Target, label: 'Quests Done', value: completedTasks, color: 'text-primary' },
    { icon: Flame, label: 'Current Streak', value: profile.current_streak, color: 'text-accent' },
    { icon: Trophy, label: 'Best Streak', value: profile.longest_streak, color: 'text-game-energy' },
    { icon: Award, label: 'Exams Tracked', value: exams.length, color: 'text-game-exp' },
    { icon: User, label: 'Squads Joined', value: squads.length, color: 'text-primary' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-24 px-4"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            <h1 className="font-pixel text-lg text-foreground">Profile</h1>
          </div>
          <PixelButton variant="danger" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </PixelButton>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <PixelPanel variant="wood" className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <PixelAvatar seed={profile.avatar_seed} size="xl" />
                <PixelButton size="sm" variant="secondary" onClick={generateNewAvatar}>
                  Randomize
                </PixelButton>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <PixelInput
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="max-w-[200px]"
                      />
                      <PixelButton size="sm" onClick={handleSaveName}>
                        <Check className="w-4 h-4" />
                      </PixelButton>
                    </div>
                  ) : (
                    <>
                      <h2 className="font-pixel text-lg text-primary-foreground">{profile.name}</h2>
                      <PixelButton size="sm" variant="secondary" onClick={() => {
                        setTempName(profile.name);
                        setIsEditingName(true);
                      }}>
                        <Edit2 className="w-4 h-4" />
                      </PixelButton>
                    </>
                  )}
                </div>

                <p className="font-game text-2xl text-primary-foreground/80 mb-4">
                  Level {profile.level} Scholar
                </p>

                {/* Experience Bar */}
                <div className="max-w-xs mx-auto md:mx-0">
                  <div className="flex justify-between mb-1">
                    <span className="font-pixel text-[8px] text-primary-foreground/60">EXP</span>
                    <span className="font-game text-sm text-primary-foreground/80">
                      {profile.exp} / {expForNextLevel}
                    </span>
                  </div>
                  <PixelBar
                    value={profile.exp}
                    max={expForNextLevel}
                    variant="exp"
                    showText={false}
                  />
                </div>
              </div>
            </div>
          </PixelPanel>
        </motion.div>

        {/* Money Balance */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <PixelPanel>
            <h3 className="font-pixel text-sm text-foreground mb-4">Weekly Balance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-game-energy/10 p-4 pixel-border text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <IndianRupee className="w-5 h-5 text-game-energy" />
                  <span className="font-pixel text-2xl text-game-energy">{earnedPoints}</span>
                </div>
                <p className="font-pixel text-[8px] text-muted-foreground">EARNED</p>
                <p className="font-game text-sm text-muted-foreground mt-1">
                  You'll receive from squad
                </p>
              </div>
              <div className="bg-destructive/10 p-4 pixel-border text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <IndianRupee className="w-5 h-5 text-destructive" />
                  <span className="font-pixel text-2xl text-destructive">{lostPoints}</span>
                </div>
                <p className="font-pixel text-[8px] text-muted-foreground">OWED</p>
                <p className="font-game text-sm text-muted-foreground mt-1">
                  You owe to squad
                </p>
              </div>
            </div>
            <p className="font-game text-sm text-muted-foreground text-center mt-4">
              Net: <span className={earnedPoints >= lostPoints ? 'text-game-energy' : 'text-destructive'}>
                ₹{earnedPoints - lostPoints}
              </span>
            </p>
          </PixelPanel>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <PixelPanel className="text-center py-6">
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                  <p className="font-pixel text-2xl text-foreground">{stat.value}</p>
                  <p className="font-pixel text-[8px] text-muted-foreground mt-1">{stat.label}</p>
                </PixelPanel>
              </motion.div>
            );
          })}
        </div>

        {/* Achievements */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <PixelPanel>
            <h3 className="font-pixel text-sm text-foreground mb-4">
              Achievements ({userAchievements.length}/{achievements.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {achievements.map((achievement) => {
                const isUnlocked = unlockedAchievementIds.has(achievement.id);
                return (
                  <div
                    key={achievement.id}
                    className={`px-4 py-2 pixel-border ${
                      isUnlocked ? 'bg-game-gold/20' : 'bg-muted opacity-50'
                    }`}
                    title={achievement.description}
                  >
                    <span className="font-game text-lg">
                      {achievement.icon} {achievement.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </PixelPanel>
        </motion.div>
      </div>
    </motion.div>
  );
};
