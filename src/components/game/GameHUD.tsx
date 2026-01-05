import { useGameStore } from '@/store/gameStore';
import { PixelPanel } from './PixelPanel';
import { PixelAvatar } from './PixelAvatar';
import { PixelBar } from './PixelBar';
import { motion } from 'framer-motion';
import { Flame, Star, Trophy } from 'lucide-react';

export const GameHUD = () => {
  const { profile } = useGameStore();
  
  const expForNextLevel = profile.level * 100;

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-4 left-4 right-4 z-50 pointer-events-none"
    >
      <div className="flex items-start justify-between gap-4 max-w-7xl mx-auto">
        {/* Player Info */}
        <PixelPanel variant="hud" className="pointer-events-auto flex items-center gap-3 pr-6">
          <PixelAvatar seed={profile.avatarSeed} size="md" />
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

        {/* Stats */}
        <PixelPanel variant="hud" className="pointer-events-auto flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-accent" />
            <span className="font-game text-xl">{profile.currentStreak}</span>
            <span className="font-pixel text-[8px] text-muted-foreground">STREAK</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-game-gold" />
            <span className="font-game text-xl">{profile.totalPoints}</span>
            <span className="font-pixel text-[8px] text-muted-foreground">POINTS</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-game text-xl">{profile.longestStreak}</span>
            <span className="font-pixel text-[8px] text-muted-foreground">BEST</span>
          </div>
        </PixelPanel>
      </div>
    </motion.div>
  );
};
