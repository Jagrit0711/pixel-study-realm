import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { PixelPanel } from '../game/PixelPanel';
import { PixelButton } from '../game/PixelButton';
import { PixelInput } from '../game/PixelInput';
import { PixelAvatar } from '../game/PixelAvatar';
import { PixelBar } from '../game/PixelBar';
import { motion } from 'framer-motion';
import { User, Edit2, Check, Star, Flame, Trophy, Target, Award } from 'lucide-react';
import { toast } from 'sonner';

export const ProfileRoom = () => {
  const { profile, updateProfile, tasks, exams, squads } = useGameStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.name);

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalPoints = tasks
    .filter(t => t.status === 'completed' && t.difficulty)
    .reduce((sum, t) => sum + (t.difficulty?.points || 0), 0);
  const expForNextLevel = profile.level * 100;

  const handleSaveName = () => {
    if (!tempName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    updateProfile({ name: tempName });
    setIsEditingName(false);
    toast.success('Name updated!');
  };

  const generateNewAvatar = () => {
    const newSeed = Math.random().toString(36).substring(2, 10);
    updateProfile({ avatarSeed: newSeed });
    toast.success('New avatar generated!');
  };

  const stats = [
    { icon: Star, label: 'Total Points', value: totalPoints, color: 'text-game-gold' },
    { icon: Target, label: 'Quests Completed', value: completedTasks, color: 'text-primary' },
    { icon: Flame, label: 'Current Streak', value: profile.currentStreak, color: 'text-accent' },
    { icon: Trophy, label: 'Best Streak', value: profile.longestStreak, color: 'text-game-energy' },
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
        <div className="flex items-center gap-3">
          <User className="w-8 h-8 text-primary" />
          <h1 className="font-pixel text-lg text-foreground">Profile</h1>
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
                <PixelAvatar seed={profile.avatarSeed} size="xl" />
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
                      <PixelButton size="sm" variant="secondary" onClick={() => setIsEditingName(true)}>
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

        {/* Achievements placeholder */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <PixelPanel>
            <h3 className="font-pixel text-sm text-foreground mb-4">Achievements</h3>
            <div className="flex flex-wrap gap-3">
              {['First Quest', 'Week Warrior', 'Study Buddy', 'Early Bird'].map((achievement, i) => (
                <div
                  key={achievement}
                  className={`px-4 py-2 pixel-border ${i < 2 ? 'bg-game-gold/20' : 'bg-muted opacity-50'}`}
                >
                  <span className="font-game text-lg">
                    {i < 2 ? '🏆' : '🔒'} {achievement}
                  </span>
                </div>
              ))}
            </div>
          </PixelPanel>
        </motion.div>
      </div>
    </motion.div>
  );
};
