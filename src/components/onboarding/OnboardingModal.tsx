import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Users, Trophy, Shield, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { PixelButton } from '@/components/game/PixelButton';
import { PixelPanel } from '@/components/game/PixelPanel';

interface OnboardingModalProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: Sparkles,
    title: 'Welcome to GrindQuest!',
    description: 'Your cozy pixel-art study companion. Let\'s show you around and get you started on your academic adventure!',
    color: 'text-game-gold',
  },
  {
    icon: Target,
    title: 'Schedule Quests',
    description: 'Add your study tasks with subjects, chapters, and due dates. Our AI will analyze the difficulty and assign points based on complexity.',
    color: 'text-primary',
  },
  {
    icon: Shield,
    title: 'Complete & Prove',
    description: 'After finishing a task, submit proof! Upload a photo of your notes, a screenshot, or take a quick quiz to verify completion.',
    color: 'text-accent',
  },
  {
    icon: Users,
    title: 'Join a Squad',
    description: 'Create or join a squad with friends. Squad members review each other\'s proof submissions, keeping everyone accountable!',
    color: 'text-game-exp',
  },
  {
    icon: Trophy,
    title: 'Earn Points & Streak',
    description: 'Complete tasks to earn points and build your streak. Climb the leaderboard and unlock achievements. Miss a task? Lose points!',
    color: 'text-game-gold',
  },
];

export const OnboardingModal = ({ onComplete }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md"
      >
        <PixelPanel className="relative overflow-hidden">
          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <motion.div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep ? 'bg-primary' : index < currentStep ? 'bg-primary/50' : 'bg-muted'
                }`}
                animate={index === currentStep ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5 }}
              />
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mb-6"
              >
                <Icon className={`w-16 h-16 mx-auto ${step.color}`} />
              </motion.div>

              <h2 className="font-pixel text-sm text-foreground mb-4">{step.title}</h2>
              <p className="font-game text-xl text-muted-foreground leading-relaxed mb-8">
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <PixelButton
              variant="secondary"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </PixelButton>

            <PixelButton
              variant={currentStep === steps.length - 1 ? 'gold' : 'primary'}
              onClick={handleNext}
              className="flex-1"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Your Quest!
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </PixelButton>
          </div>
        </PixelPanel>
      </motion.div>
    </motion.div>
  );
};
