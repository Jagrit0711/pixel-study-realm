import { useProfile } from '@/hooks/useProfile';
import { useExams } from '@/hooks/useExams';
import { PixelPanel } from './PixelPanel';
import { PixelAvatar } from './PixelAvatar';
import { PixelBar } from './PixelBar';
import { motion } from 'framer-motion';
import { Flame, Star, Trophy, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

export const GameHUD = () => {
  const { profile } = useProfile();
  const { exams } = useExams();
  const [now, setNow] = useState(new Date());
  
  // Update time every minute for countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!profile) return null;

  const expForNextLevel = profile.level * 100;

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
              <span className="font-pixel text-[10px] text-primary">Lv.{profile.level}</span>
              <span className="font-game text-xl">{profile.name}</span>
            </div>
            <PixelBar
              value={profile.exp}
              max={expForNextLevel}
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
            <span className="font-game text-xl">{profile.total_points}</span>
            <span className="font-pixel text-[8px] text-muted-foreground">POINTS</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-game text-xl">{profile.longest_streak}</span>
            <span className="font-pixel text-[8px] text-muted-foreground">BEST</span>
          </div>
        </PixelPanel>
      </div>
    </motion.div>
  );
};