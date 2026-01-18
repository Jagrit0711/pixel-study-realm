import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GameHUD } from '@/components/game/GameHUD';
import { GameNav } from '@/components/game/GameNav';
import { MobileNav } from '@/components/game/MobileNav';
import { GameBackground } from '@/components/game/GameBackground';
import { HubRoomConnected } from '@/components/rooms/HubRoomConnected';
import { SquadRoomConnected } from '@/components/rooms/SquadRoomConnected';
import { QuestBoardRoomConnected } from '@/components/rooms/QuestBoardRoomConnected';
import { ExamRoomConnected } from '@/components/rooms/ExamRoomConnected';
import { ProfileRoomConnected } from '@/components/rooms/ProfileRoomConnected';
import { ScheduleRoom } from '@/components/rooms/ScheduleRoom';
import { AnimatePresence, motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

const Index = () => {
  const { currentRoom } = useGameStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('gq_onboarded') === '1';
    if (!seen) setShowOnboarding(true);
  }, []);

  const renderRoom = () => {
    switch (currentRoom) {
      case 'hub':
        return <HubRoomConnected />;
      case 'squad':
        return <SquadRoomConnected />;
      case 'quest-board':
        return <QuestBoardRoomConnected />;
      case 'schedule':
        return <ScheduleRoom />;
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
        <meta
          name="description"
          content="Level up your study game with GrindQuest. A pixel-art study accountability system with squads, quests, and AI-verified progress tracking."
        />
        <link rel="canonical" href="/game" />
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

        {/* Desktop nav (tablet/desktop) */}
        <GameNav />

        {/* Mobile rover nav */}
        <MobileNav />

        <AnimatePresence>
          {showOnboarding && (
            <OnboardingModal
              onComplete={() => {
                localStorage.setItem('gq_onboarded', '1');
                setShowOnboarding(false);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Index;
