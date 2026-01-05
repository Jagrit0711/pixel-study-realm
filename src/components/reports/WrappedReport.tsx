import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelPanel } from '../game/PixelPanel';
import { PixelButton } from '../game/PixelButton';
import { X, ChevronLeft, ChevronRight, Star, TrendingUp, TrendingDown, AlertTriangle, Trophy } from 'lucide-react';
import { toast } from 'sonner';

interface Insight {
  title: string;
  value: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
}

interface Report {
  insights: Insight[];
  overallGrade: string;
  mainMessage: string;
}

interface WrappedReportProps {
  tasksCompleted: number;
  tasksMissed: number;
  pointsEarned: number;
  pointsLost: number;
  totalTasks: number;
  streak: number;
  subjects: string[];
  avgDifficulty: string;
  reportType: 'daily' | 'weekly';
  onClose: () => void;
}

const typeIcons = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Star,
  warning: AlertTriangle,
};

const typeColors = {
  positive: 'bg-game-energy/20 border-game-energy',
  negative: 'bg-destructive/20 border-destructive',
  neutral: 'bg-primary/20 border-primary',
  warning: 'bg-game-gold/20 border-game-gold',
};

export const WrappedReport = ({
  tasksCompleted,
  tasksMissed,
  pointsEarned,
  pointsLost,
  totalTasks,
  streak,
  subjects,
  avgDifficulty,
  reportType,
  onClose
}: WrappedReportProps) => {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentCard, setCurrentCard] = useState(-1); // -1 is intro, 0-4 are insights, 5 is summary

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          tasksCompleted,
          tasksMissed,
          pointsEarned,
          pointsLost,
          totalTasks,
          streak,
          subjects,
          avgDifficulty,
          reportType
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setReport(data);
      setCurrentCard(0);
    } catch (err) {
      console.error('Error generating report:', err);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    if (report && currentCard < report.insights.length) {
      setCurrentCard(c => c + 1);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(c => c - 1);
    }
  };

  const gradeColors: Record<string, string> = {
    'A': 'text-game-energy',
    'B': 'text-primary',
    'C': 'text-game-gold',
    'D': 'text-accent',
    'F': 'text-destructive',
  };

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
        {currentCard === -1 && !report && (
          <PixelPanel className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto text-game-gold mb-4" />
            <h2 className="font-pixel text-lg text-foreground mb-2">
              {reportType === 'daily' ? 'Daily' : 'Weekly'} Wrapped
            </h2>
            <p className="font-game text-xl text-muted-foreground mb-6">
              See your brutally honest performance report
            </p>
            <PixelButton onClick={generateReport} disabled={loading}>
              {loading ? 'Generating...' : 'Show My Wrapped'}
            </PixelButton>
            <button onClick={onClose} className="block mx-auto mt-4 font-game text-lg text-muted-foreground">
              Maybe later
            </button>
          </PixelPanel>
        )}

        {report && (
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 z-10 bg-card p-2 pixel-border"
            >
              <X className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait">
              {currentCard < report.insights.length ? (
                <motion.div
                  key={currentCard}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                >
                  <PixelPanel className={`${typeColors[report.insights[currentCard].type]} border-2 py-12`}>
                    {(() => {
                      const insight = report.insights[currentCard];
                      const Icon = typeIcons[insight.type];
                      return (
                        <div className="text-center">
                          <Icon className="w-12 h-12 mx-auto mb-4 text-foreground" />
                          <p className="font-pixel text-[10px] text-muted-foreground mb-2">
                            {currentCard + 1} / {report.insights.length}
                          </p>
                          <h3 className="font-pixel text-sm text-foreground mb-4">
                            {insight.title}
                          </h3>
                          <p className="font-pixel text-3xl text-primary mb-4">
                            {insight.value}
                          </p>
                          <p className="font-game text-xl text-muted-foreground px-4">
                            {insight.description}
                          </p>
                        </div>
                      );
                    })()}
                  </PixelPanel>
                </motion.div>
              ) : (
                <motion.div
                  key="summary"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <PixelPanel variant="wood" className="py-12 text-center">
                    <h3 className="font-pixel text-sm text-primary-foreground mb-4">
                      YOUR GRADE
                    </h3>
                    <p className={`font-pixel text-6xl mb-4 ${gradeColors[report.overallGrade] || 'text-foreground'}`}>
                      {report.overallGrade}
                    </p>
                    <p className="font-game text-xl text-primary-foreground/80 px-4">
                      {report.mainMessage}
                    </p>
                    <PixelButton onClick={onClose} className="mt-8">
                      Close
                    </PixelButton>
                  </PixelPanel>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            {currentCard < report.insights.length && (
              <div className="flex justify-between mt-4">
                <PixelButton
                  variant="secondary"
                  size="sm"
                  onClick={prevCard}
                  disabled={currentCard === 0}
                >
                  <ChevronLeft className="w-5 h-5" />
                </PixelButton>
                <PixelButton size="sm" onClick={nextCard}>
                  {currentCard === report.insights.length - 1 ? 'See Grade' : 'Next'}
                  <ChevronRight className="w-5 h-5 ml-1" />
                </PixelButton>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
