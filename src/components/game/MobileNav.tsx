import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import { Home, Users, ScrollText, GraduationCap, User, Target } from 'lucide-react';
import { feedback } from '@/hooks/useSettings';

const navItems = [
  { id: 'hub' as const, icon: Home, label: 'Hub' },
  { id: 'squad' as const, icon: Users, label: 'Squad' },
  { id: 'quest-board' as const, icon: ScrollText, label: 'Quests' },
  { id: 'focus' as const, icon: Target, label: 'Focus' },
  { id: 'exam-room' as const, icon: GraduationCap, label: 'Exams' },
  { id: 'profile' as const, icon: User, label: 'Profile' },
];

export const MobileNav = () => {
  const { currentRoom, setCurrentRoom } = useGameStore();

  const handleNavClick = (id: typeof navItems[number]['id']) => {
    feedback('click');
    setCurrentRoom(id);
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-sm border-t-4 border-foreground safe-bottom"
    >
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoom === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center gap-0.5 py-2 px-2 sm:px-3 rounded-lg transition-all min-w-[48px] ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted'
              }`}
            >
              <motion.div
                animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              <span className="font-pixel text-[5px] sm:text-[6px] leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
};
