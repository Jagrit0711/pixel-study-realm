import { useGameStore } from '@/store/gameStore';
import { GameHUD } from '@/components/game/GameHUD';
import { GameNav } from '@/components/game/GameNav';
import { GameBackground } from '@/components/game/GameBackground';
import { HubRoomConnected } from '@/components/rooms/HubRoomConnected';
import { SquadRoomConnected } from '@/components/rooms/SquadRoomConnected';
import { QuestBoardRoomConnected } from '@/components/rooms/QuestBoardRoomConnected';
import { ExamRoomConnected } from '@/components/rooms/ExamRoomConnected';
import { ProfileRoomConnected } from '@/components/rooms/ProfileRoomConnected';
import { AnimatePresence, motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  const { currentRoom } = useGameStore();

  const renderRoom = () => {
    switch (currentRoom) {
      case 'hub':
        return <HubRoomConnected />;
      case 'squad':
        return <SquadRoomConnected />;
      case 'quest-board':
        return <QuestBoardRoomConnected />;
      case 'exam-room':
        return <ExamRoomConnected />;
      case 'profile':
        return <ProfileRoomConnected />;
      default:
        return <HubRoomConnected />;
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
