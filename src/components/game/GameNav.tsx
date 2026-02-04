import { useGameStore } from '@/store/gameStore';
import { PixelButton } from './PixelButton';
import { motion } from 'framer-motion';
import { Home, Users, ScrollText, GraduationCap, User, Wand2, Target } from 'lucide-react';

const navItems = [
  { id: 'hub' as const, icon: Home, label: 'Hub' },
  { id: 'squad' as const, icon: Users, label: 'Squad' },
  { id: 'quest-board' as const, icon: ScrollText, label: 'Quests' },
  { id: 'focus' as const, icon: Target, label: 'Focus' },
  { id: 'schedule' as const, icon: Wand2, label: 'AI Plan' },
  { id: 'exam-room' as const, icon: GraduationCap, label: 'Exams' },
  { id: 'profile' as const, icon: User, label: 'Profile' },
];

export const GameNav = () => {
  const { currentRoom, setCurrentRoom } = useGameStore();

  return (
    <motion.nav
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 hidden md:block"
    >
      <div className="flex items-center gap-2 bg-card/95 backdrop-blur-sm pixel-border p-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentRoom === item.id;
          
          return (
            <motion.div
              key={item.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <PixelButton
                variant={isActive ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setCurrentRoom(item.id)}
                className={`flex items-center gap-2 relative ${isActive ? 'animate-pulse-glow' : ''}`}
              >
                <motion.div
                  animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Icon className="w-4 h-4" />
                </motion.div>
                <span className="hidden sm:inline">{item.label}</span>
              </PixelButton>
            </motion.div>
          );
        })}
      </div>
    </motion.nav>
  );
};
