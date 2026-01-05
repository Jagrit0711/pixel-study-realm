import { useGameStore } from '@/store/gameStore';
import { GameHUD } from '@/components/game/GameHUD';
import { GameNav } from '@/components/game/GameNav';
import { GameBackground } from '@/components/game/GameBackground';
import { HubRoom } from '@/components/rooms/HubRoom';
import { SquadRoom } from '@/components/rooms/SquadRoom';
import { QuestBoardRoom } from '@/components/rooms/QuestBoardRoom';
import { ExamRoom } from '@/components/rooms/ExamRoom';
import { ProfileRoom } from '@/components/rooms/ProfileRoom';
import { AnimatePresence, motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  const { currentRoom } = useGameStore();

  const renderRoom = () => {
    switch (currentRoom) {
      case 'hub':
        return <HubRoom />;
      case 'squad':
        return <SquadRoom />;
      case 'quest-board':
        return <QuestBoardRoom />;
      case 'exam-room':
        return <ExamRoom />;
      case 'profile':
        return <ProfileRoom />;
      default:
        return <HubRoom />;
    }
  };

  return (
    <>
      <Helmet>
        <title>GrindQuest - Gamified Study Accountability</title>
        <meta name="description" content="Level up your study game with GrindQuest. A pixel-art study accountability system with squads, quests, and AI-verified progress tracking." />
      </Helmet>
      
      <div className="min-h-screen overflow-hidden">
        <GameBackground />
        <GameHUD />
        
        <AnimatePresence mode="wait">
          <motion.main
            key={currentRoom}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderRoom()}
          </motion.main>
        </AnimatePresence>
        
        <GameNav />
      </div>
    </>
  );
};

export default Index;
