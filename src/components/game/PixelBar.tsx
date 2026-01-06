import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PixelBarProps {
  value: number;
  max: number;
  variant?: 'health' | 'exp' | 'energy' | 'gold';
  showText?: boolean;
  label?: string;
  className?: string;
}

export const PixelBar = ({
  value,
  max,
  variant = 'health',
  showText = true,
  label,
  className,
}: PixelBarProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const variants = {
    health: 'bg-game-health',
    exp: 'bg-game-exp',
    energy: 'bg-game-energy',
    gold: 'bg-game-gold',
  };

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <span className="font-pixel text-[8px] text-muted-foreground uppercase">
          {label}
        </span>
      )}
      <div className="relative h-4 bg-muted pixel-border overflow-hidden">
        <motion.div
          className={cn('absolute inset-y-0 left-0', variants[variant])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
          />
        </motion.div>
        <div className="absolute inset-0 pixel-inset pointer-events-none" />
        {showText && (
          <span className="absolute inset-0 flex items-center justify-center font-game text-sm text-foreground">
            {value} / {max}
          </span>
        )}
      </div>
    </div>
  );
};
