import { useProfile } from '@/hooks/useProfile';
import { useExams } from '@/hooks/useExams';
import { useTasks } from '@/hooks/useTasks';
import { PixelPanel } from './PixelPanel';
import { PixelAvatar } from './PixelAvatar';
import { PixelBar } from './PixelBar';
import { PixelButton } from './PixelButton';
import { SettingsModal } from './SettingsModal';
import { motion } from 'framer-motion';
import { Flame, Star, Trophy, Clock, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export const GameHUD = () => {
  const { profile } = useProfile();
  const { exams } = useExams();
  const { tasks } = useTasks();
  const [now, setNow] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const isMobile = useIsMobile();
  
  // Update time every minute for countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!profile) return null;

  // Use computed points from tasks (same as Quest tab)
  const computedPoints = tasks
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.points, 0);
  
  // Calculate exp and level based on computed points
  const computedExp = computedPoints % 100;
  const computedLevel = Math.floor(computedPoints / 100) + 1;

  // Find next upcoming exam
  const upcomingExams = exams
    .filter(exam => new Date(exam.start_date) > now)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  
  const nextExam = upcomingExams[0];
  
  const getExamCountdown = () => {
    if (!nextExam) return null;
    const examDate = new Date(nextExam.start_date);
    const diff = examDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days, hours, name: nextExam.name };
  };

  const examCountdown = getExamCountdown();

  // Mobile compact HUD
  if (isMobile) {
    return (
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 px-2 py-2 bg-card/95 backdrop-blur-sm border-b-4 border-foreground"
      >
        <div className="flex items-center justify-between gap-2">
          {/* Player Info - Compact */}
          <div className="flex items-center gap-2">
            <PixelAvatar seed={profile.avatar_seed} size="sm" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-pixel text-[6px] text-primary">Lv.{computedLevel}</span>
                <span className="font-game text-sm">{profile.name}</span>
              </div>
              <PixelBar
                value={computedExp}
                max={100}
                variant="exp"
                showText={false}
                className="w-16 h-2"
              />
            </div>
          </div>

          {/* Stats - Compact */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-accent" />
              <span className="font-game text-sm">{profile.current_streak}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-game-gold" />
              <span className="font-game text-sm">{computedPoints}</span>
            </div>

            {examCountdown && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-accent" />
                <span className="font-game text-sm">{examCountdown.days}d</span>
              </div>
            )}

            <button onClick={() => setShowSettings(true)} className="p-1">
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </motion.div>
    );
  }

  // Desktop HUD
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-4 left-4 right-4 z-50 pointer-events-none"
    >
      <div className="flex items-start justify-between gap-4 max-w-7xl mx-auto">
        {/* Player Info */}
        <PixelPanel variant="hud" className="pointer-events-auto flex items-center gap-3 pr-6">
          <PixelAvatar seed={profile.avatar_seed} size="md" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[10px] text-primary">Lv.{computedLevel}</span>
              <span className="font-game text-xl">{profile.name}</span>
            </div>
            <PixelBar
              value={computedExp}
              max={100}
              variant="exp"
              showText={false}
              className="w-32"
            />
          </div>
        </PixelPanel>

        {/* Next Exam Timer */}
        {examCountdown && (
          <PixelPanel variant="hud" className="pointer-events-auto flex items-center gap-2 bg-accent/20">
            <Clock className="w-4 h-4 text-accent" />
            <div className="flex flex-col">
              <span className="font-pixel text-[6px] text-muted-foreground truncate max-w-[80px]">
                {examCountdown.name}
              </span>
              <span className="font-game text-lg text-accent">
                {examCountdown.days}d {examCountdown.hours}h
              </span>
            </div>
          </PixelPanel>
        )}

        {/* Stats */}
        <PixelPanel variant="hud" className="pointer-events-auto flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-accent" />
            <span className="font-game text-xl">{profile.current_streak}</span>
            <span className="font-pixel text-[8px] text-muted-foreground">STREAK</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-game-gold" />
            <span className="font-game text-xl">{computedPoints}</span>
            <span className="font-pixel text-[8px] text-muted-foreground">POINTS</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-game text-xl">{profile.longest_streak}</span>
            <span className="font-pixel text-[8px] text-muted-foreground">BEST</span>
          </div>

          {/* Settings Button */}
          <PixelButton size="sm" variant="secondary" onClick={() => setShowSettings(true)}>
            <Settings className="w-4 h-4" />
          </PixelButton>
        </PixelPanel>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </motion.div>
  );
};
