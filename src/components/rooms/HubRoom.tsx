import { useGameStore } from '@/store/gameStore';
import { PixelPanel } from '../game/PixelPanel';
import { PixelButton } from '../game/PixelButton';
import { PixelAvatar } from '../game/PixelAvatar';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, Target, Clock } from 'lucide-react';

export const HubRoom = () => {
  const { profile, exams, tasks, setCurrentRoom } = useGameStore();
  
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.date === today);
  const upcomingExams = exams
    .filter(e => new Date(e.startDate) > new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-24 px-4"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <PixelPanel variant="wood" className="text-center py-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-game-gold" />
              <h1 className="font-pixel text-lg text-primary-foreground text-shadow-pixel">
                Welcome, {profile.name}!
              </h1>
              <Sparkles className="w-8 h-8 text-game-gold" />
            </div>
            <p className="font-game text-2xl text-primary-foreground/80">
              Your study adventure awaits. What will you conquer today?
            </p>
          </PixelPanel>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <PixelPanel className="flex flex-col items-center text-center gap-4 hover:brightness-105 transition-all cursor-pointer" onClick={() => setCurrentRoom('quest-board')}>
            <Target className="w-12 h-12 text-primary" />
            <div>
              <h3 className="font-pixel text-[10px] text-foreground mb-1">TODAY'S QUESTS</h3>
              <p className="font-game text-3xl text-primary">{todayTasks.length}</p>
            </div>
            <PixelButton size="sm" onClick={() => setCurrentRoom('quest-board')}>
              View Quests
            </PixelButton>
          </PixelPanel>

          <PixelPanel className="flex flex-col items-center text-center gap-4 hover:brightness-105 transition-all cursor-pointer" onClick={() => setCurrentRoom('exam-room')}>
            <Clock className="w-12 h-12 text-accent" />
            <div>
              <h3 className="font-pixel text-[10px] text-foreground mb-1">NEXT EXAM</h3>
              {upcomingExams.length > 0 ? (
                <>
                  <p className="font-game text-xl text-foreground">{upcomingExams[0].name}</p>
                  <p className="font-game text-lg text-muted-foreground">
                    {Math.ceil((new Date(upcomingExams[0].startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </>
              ) : (
                <p className="font-game text-lg text-muted-foreground">No exams set</p>
              )}
            </div>
            <PixelButton size="sm" variant="accent" onClick={() => setCurrentRoom('exam-room')}>
              Manage Exams
            </PixelButton>
          </PixelPanel>

          <PixelPanel className="flex flex-col items-center text-center gap-4 hover:brightness-105 transition-all cursor-pointer" onClick={() => setCurrentRoom('squad')}>
            <Trophy className="w-12 h-12 text-game-gold" />
            <div>
              <h3 className="font-pixel text-[10px] text-foreground mb-1">YOUR RANK</h3>
              <p className="font-game text-3xl text-game-gold">#{Math.floor(Math.random() * 10) + 1}</p>
            </div>
            <PixelButton size="sm" variant="gold" onClick={() => setCurrentRoom('squad')}>
              View Squad
            </PixelButton>
          </PixelPanel>
        </motion.div>

        {/* Player Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <PixelPanel>
            <div className="flex items-center gap-6">
              <PixelAvatar seed={profile.avatarSeed} size="xl" />
              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="font-pixel text-sm text-foreground">{profile.name}</h2>
                  <p className="font-game text-xl text-muted-foreground">Level {profile.level} Scholar</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="font-game text-3xl text-primary">{profile.totalPoints}</p>
                    <p className="font-pixel text-[8px] text-muted-foreground">POINTS</p>
                  </div>
                  <div className="text-center">
                    <p className="font-game text-3xl text-accent">{profile.currentStreak}</p>
                    <p className="font-pixel text-[8px] text-muted-foreground">STREAK</p>
                  </div>
                  <div className="text-center">
                    <p className="font-game text-3xl text-game-gold">{profile.longestStreak}</p>
                    <p className="font-pixel text-[8px] text-muted-foreground">BEST</p>
                  </div>
                </div>
              </div>
            </div>
          </PixelPanel>
        </motion.div>
      </div>
    </motion.div>
  );
};
