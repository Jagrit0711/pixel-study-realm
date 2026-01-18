import { useState } from 'react';
import { useSchedule, ScheduledTask, SchedulePreferences } from '@/hooks/useSchedule';
import { useExams } from '@/hooks/useExams';
import { PixelPanel } from '../game/PixelPanel';
import { PixelButton } from '../game/PixelButton';
import { PixelInput } from '../game/PixelInput';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wand2, 
  Calendar, 
  Loader2, 
  CheckCircle, 
  Plus, 
  Clock, 
  IndianRupee, 
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Sparkles,
  History,
  Brain,
  Target,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

const taskTypeIcons: Record<string, React.ReactNode> = {
  'reading': <BookOpen className="w-4 h-4" />,
  'problem-solving': <Brain className="w-4 h-4" />,
  'revision': <History className="w-4 h-4" />,
  'practice': <Target className="w-4 h-4" />,
  'test-prep': <AlertCircle className="w-4 h-4" />,
};

const difficultyColors = {
  'Easy': 'text-game-energy bg-game-energy/20',
  'Medium': 'text-game-gold bg-game-gold/20',
  'Hard': 'text-accent bg-accent/20',
  'Very Hard': 'text-destructive bg-destructive/20',
};

const priorityColors = {
  'high': 'border-l-4 border-l-destructive',
  'medium': 'border-l-4 border-l-game-gold',
  'low': 'border-l-4 border-l-muted',
};

export const ScheduleRoom = () => {
  const { 
    generating, 
    generatedSchedule, 
    scheduleHistory,
    generateSchedule, 
    addScheduledTask,
    addAllScheduledTasks,
    getSubjectInsights,
    clearSchedule 
  } = useSchedule();
  const { exams } = useExams();
  
  const [targetDate, setTargetDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [maxTasks, setMaxTasks] = useState(5);
  const [addedTasks, setAddedTasks] = useState<Set<number>>(new Set());
  const [showHistory, setShowHistory] = useState(false);

  const handleGenerate = async () => {
    if (!targetDate) {
      toast.error('Please select a date');
      return;
    }

    setAddedTasks(new Set());
    const preferences: SchedulePreferences = { maxTasks };
    await generateSchedule(targetDate, preferences);
  };

  const handleAddTask = async (task: ScheduledTask, index: number) => {
    const result = await addScheduledTask(task, targetDate);
    if (result) {
      setAddedTasks(prev => new Set([...prev, index]));
    }
  };

  const handleAddAll = async () => {
    if (!generatedSchedule) return;
    await addAllScheduledTasks(generatedSchedule);
    setAddedTasks(new Set(generatedSchedule.tasks.map((_, i) => i)));
  };

  const insights = getSubjectInsights();
  const totalPoints = generatedSchedule?.tasks.reduce((sum, t) => sum + t.points, 0) || 0;
  const totalMinutes = generatedSchedule?.tasks.reduce((sum, t) => sum + t.estimated_minutes, 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-24 px-4"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wand2 className="w-8 h-8 text-primary" />
            </motion.div>
            <div>
              <h1 className="font-pixel text-lg text-foreground">AI Schedule Maker</h1>
              <p className="font-game text-lg text-muted-foreground">Let AI plan your study day</p>
            </div>
          </div>
          
          {scheduleHistory.length > 0 && (
            <PixelButton 
              variant="secondary" 
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4 mr-1" />
              History ({scheduleHistory.length})
            </PixelButton>
          )}
        </div>

        {/* Generator Panel */}
        <PixelPanel variant="wood">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-game-gold" />
              <h2 className="font-pixel text-sm text-foreground">Generate Smart Schedule</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="font-pixel text-[8px] text-muted-foreground block mb-2">
                  TARGET DATE
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-3 font-game text-lg bg-background pixel-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-pixel text-[8px] text-muted-foreground block mb-2">
                  MAX TASKS
                </label>
                <PixelInput
                  type="number"
                  min={1}
                  max={10}
                  value={maxTasks}
                  onChange={(e) => setMaxTasks(Number(e.target.value))}
                  placeholder="5"
                />
              </div>

              <div className="flex items-end">
                <PixelButton
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full"
                  variant="accent"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-2" />
                      Generate Schedule
                    </>
                  )}
                </PixelButton>
              </div>
            </div>

            {exams.length === 0 && (
              <div className="flex items-center gap-2 p-3 bg-game-gold/20 pixel-border">
                <AlertCircle className="w-5 h-5 text-game-gold" />
                <p className="font-game text-lg text-foreground">
                  Add exams to get more personalized schedules!
                </p>
              </div>
            )}
          </div>
        </PixelPanel>

        {/* Generated Schedule */}
        <AnimatePresence mode="wait">
          {generatedSchedule && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <PixelPanel className="text-center py-3">
                  <p className="font-game text-3xl text-primary">{generatedSchedule.tasks.length}</p>
                  <p className="font-pixel text-[8px] text-muted-foreground">TASKS</p>
                </PixelPanel>
                <PixelPanel className="text-center py-3">
                  <div className="flex items-center justify-center gap-1">
                    <IndianRupee className="w-4 h-4 text-game-gold" />
                    <p className="font-game text-3xl text-game-gold">{totalPoints}</p>
                  </div>
                  <p className="font-pixel text-[8px] text-muted-foreground">POTENTIAL POINTS</p>
                </PixelPanel>
                <PixelPanel className="text-center py-3">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-4 h-4 text-accent" />
                    <p className="font-game text-3xl text-accent">{totalMinutes}</p>
                  </div>
                  <p className="font-pixel text-[8px] text-muted-foreground">MINUTES</p>
                </PixelPanel>
                <PixelPanel className="text-center py-3">
                  <p className="font-game text-3xl text-foreground">
                    {Math.round(totalMinutes / 60 * 10) / 10}h
                  </p>
                  <p className="font-pixel text-[8px] text-muted-foreground">STUDY TIME</p>
                </PixelPanel>
              </div>

              {/* Insights */}
              {insights && insights.length > 0 && (
                <PixelPanel>
                  <h3 className="font-pixel text-[10px] text-foreground mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    PERFORMANCE INSIGHTS
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {insights.map((insight, i) => (
                      <div 
                        key={i}
                        className={`flex items-center gap-2 p-2 rounded ${
                          insight.type === 'success' ? 'bg-game-energy/20' :
                          insight.type === 'warning' ? 'bg-destructive/20' : 'bg-primary/20'
                        }`}
                      >
                        {insight.type === 'success' ? (
                          <TrendingUp className="w-4 h-4 text-game-energy" />
                        ) : insight.type === 'warning' ? (
                          <TrendingDown className="w-4 h-4 text-destructive" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-primary" />
                        )}
                        <span className="font-game text-lg">
                          <strong>{insight.subject}:</strong> {insight.insight}
                        </span>
                      </div>
                    ))}
                  </div>
                </PixelPanel>
              )}

              {/* Add All Button */}
              <div className="flex gap-3">
                <PixelButton 
                  onClick={handleAddAll}
                  variant="gold"
                  className="flex-1"
                  disabled={addedTasks.size === generatedSchedule.tasks.length}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add All to Quest Board
                </PixelButton>
                <PixelButton 
                  onClick={clearSchedule}
                  variant="secondary"
                >
                  Clear
                </PixelButton>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                {generatedSchedule.tasks.map((task, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <PixelPanel className={`${priorityColors[task.priority]} ${addedTasks.has(index) ? 'opacity-60' : ''}`}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 p-2 bg-primary/20 rounded">
                          {taskTypeIcons[task.task_type]}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded font-pixel text-[8px] ${difficultyColors[task.difficulty_tier]}`}>
                              {task.difficulty_tier}
                            </span>
                            <span className="font-pixel text-[8px] text-muted-foreground uppercase">
                              {task.priority} priority
                            </span>
                          </div>
                          
                          <h3 className="font-game text-xl text-foreground">{task.title}</h3>
                          <p className="font-game text-lg text-muted-foreground">
                            {task.subject} {task.chapter && `• ${task.chapter}`}
                          </p>
                          
                          <p className="font-game text-sm text-muted-foreground mt-1 italic">
                            "{task.justification}"
                          </p>
                          
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="font-game text-sm text-muted-foreground">
                                {task.estimated_minutes} min
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1">
                            <IndianRupee className="w-4 h-4 text-game-gold" />
                            <span className="font-game text-xl text-game-gold">{task.points}</span>
                          </div>
                          
                          {addedTasks.has(index) ? (
                            <div className="flex items-center gap-1 text-game-energy">
                              <CheckCircle className="w-5 h-5" />
                              <span className="font-pixel text-[8px]">ADDED</span>
                            </div>
                          ) : (
                            <PixelButton
                              size="sm"
                              onClick={() => handleAddTask(task, index)}
                            >
                              <Plus className="w-4 h-4" />
                            </PixelButton>
                          )}
                        </div>
                      </div>
                    </PixelPanel>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!generatedSchedule && !generating && (
          <PixelPanel className="text-center py-12">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wand2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            </motion.div>
            <h2 className="font-pixel text-sm text-foreground mb-2">No Schedule Generated</h2>
            <p className="font-game text-xl text-muted-foreground mb-4">
              AI will analyze your exams, history, and performance to create the perfect study plan!
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <span className="px-2 py-1 bg-primary/20 rounded font-game">📚 Exam-aware</span>
              <span className="px-2 py-1 bg-game-gold/20 rounded font-game">📊 History-based</span>
              <span className="px-2 py-1 bg-accent/20 rounded font-game">🎯 Personalized</span>
            </div>
          </PixelPanel>
        )}

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && scheduleHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <PixelPanel>
                <h3 className="font-pixel text-[10px] text-foreground mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  SCHEDULE HISTORY
                </h3>
                <div className="space-y-2">
                  {scheduleHistory.map((schedule, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded"
                    >
                      <div>
                        <p className="font-game text-lg text-foreground">
                          {new Date(schedule.targetDate).toLocaleDateString('en', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="font-game text-sm text-muted-foreground">
                          {schedule.tasks.length} tasks • {schedule.tasks.reduce((s, t) => s + t.points, 0)} pts
                        </p>
                      </div>
                      <p className="font-pixel text-[8px] text-muted-foreground">
                        {new Date(schedule.generatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </PixelPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
