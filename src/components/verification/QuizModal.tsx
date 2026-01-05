import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelPanel } from '../game/PixelPanel';
import { PixelButton } from '../game/PixelButton';
import { X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface QuizModalProps {
  subject: string;
  chapter: string;
  taskType: string;
  difficultyTier: string;
  onComplete: (passed: boolean, score: number) => void;
  onClose: () => void;
}

export const QuizModal = ({
  subject,
  chapter,
  taskType,
  difficultyTier,
  onComplete,
  onClose
}: QuizModalProps) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const generateQuiz = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { subject, chapter, taskType, difficultyTier }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(-1));
    } catch (err) {
      console.error('Error generating quiz:', err);
      toast.error('Failed to generate quiz');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
    } else {
      // Calculate score
      const correctCount = answers.reduce((sum, ans, idx) => {
        return sum + (ans === questions[idx].correctIndex ? 1 : 0);
      }, 0);
      const score = Math.round((correctCount / questions.length) * 100);
      const passed = score >= 60; // 3 out of 5 correct
      setShowResults(true);
      
      setTimeout(() => {
        onComplete(passed, score);
      }, 2000);
    }
  };

  if (!questions.length && !loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-foreground/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg"
        >
          <PixelPanel className="text-center py-12">
            <h2 className="font-pixel text-sm text-foreground mb-4">
              Verification Quiz
            </h2>
            <p className="font-game text-xl text-muted-foreground mb-2">
              Answer 5 questions about:
            </p>
            <p className="font-pixel text-lg text-primary mb-6">
              {subject} - {chapter}
            </p>
            <p className="font-game text-lg text-muted-foreground mb-6">
              Score at least 60% to verify completion
            </p>
            <div className="flex gap-4 justify-center">
              <PixelButton onClick={generateQuiz}>
                Start Quiz
              </PixelButton>
              <PixelButton variant="secondary" onClick={onClose}>
                Cancel
              </PixelButton>
            </div>
          </PixelPanel>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-foreground/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg"
      >
        {loading ? (
          <PixelPanel className="text-center py-12">
            <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
            <p className="font-pixel text-sm text-foreground">
              AI is generating your quiz...
            </p>
          </PixelPanel>
        ) : showResults ? (
          <PixelPanel className="text-center py-12">
            {(() => {
              const correctCount = answers.reduce((sum, ans, idx) => {
                return sum + (ans === questions[idx].correctIndex ? 1 : 0);
              }, 0);
              const passed = correctCount >= 3;
              return (
                <>
                  <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${passed ? 'bg-game-energy/20' : 'bg-destructive/20'}`}>
                    <Check className={`w-10 h-10 ${passed ? 'text-game-energy' : 'text-destructive'}`} />
                  </div>
                  <h2 className="font-pixel text-lg text-foreground mb-2">
                    {passed ? 'PASSED!' : 'NOT QUITE...'}
                  </h2>
                  <p className="font-game text-2xl text-muted-foreground">
                    {correctCount}/5 correct
                  </p>
                </>
              );
            })()}
          </PixelPanel>
        ) : (
          <PixelPanel>
            <div className="flex justify-between items-center mb-6">
              <p className="font-pixel text-[10px] text-muted-foreground">
                QUESTION {currentIndex + 1}/{questions.length}
              </p>
              <button onClick={onClose}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <h3 className="font-game text-xl text-foreground mb-6">
              {questions[currentIndex].question}
            </h3>

            <div className="space-y-3">
              {questions[currentIndex].options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`w-full text-left p-4 pixel-border transition-all ${
                    answers[currentIndex] === idx
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card hover:bg-muted'
                  }`}
                >
                  <span className="font-game text-lg">
                    {String.fromCharCode(65 + idx)}. {option}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <PixelButton
                onClick={handleNext}
                disabled={answers[currentIndex] === -1}
              >
                {currentIndex === questions.length - 1 ? 'Submit' : 'Next'}
              </PixelButton>
            </div>
          </PixelPanel>
        )}
      </motion.div>
    </motion.div>
  );
};
