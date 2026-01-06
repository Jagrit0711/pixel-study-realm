import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTasks, Task, DifficultyResult } from '@/hooks/useTasks';
import { useExams } from '@/hooks/useExams';
import { PixelPanel } from '../game/PixelPanel';
import { PixelButton } from '../game/PixelButton';
import { PixelInput } from '../game/PixelInput';
import { PixelSelect } from '../game/PixelSelect';
import { QuizModal } from '../verification/QuizModal';
import { ProofUploadModal } from '../verification/ProofUploadModal';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Plus, Lock, Unlock, CheckCircle, Circle, Trash2, AlertTriangle, Upload, BookOpen, Loader2, IndianRupee, Clock } from 'lucide-react';
import { toast } from 'sonner';

const taskTypes = [
  { value: 'reading', label: '📖 Reading' },
  { value: 'problem-solving', label: '🧮 Problem Solving' },
  { value: 'revision', label: '🔄 Revision' },
  { value: 'practice', label: '✏️ Practice Questions' },
  { value: 'test-prep', label: '📝 Test Prep' },
];

const difficultyColors = {
  'Easy': 'text-game-energy',
  'Medium': 'text-game-gold',
  'Hard': 'text-accent',
  'Very Hard': 'text-destructive',
};

export const QuestBoardRoomConnected = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { tasks, loading, addTask, deleteTask, completeTask, uploadProof, analyzeDifficulty, analyzingDifficulty, isDateLocked } = useTasks();
  const { exams } = useExams();

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState<Task | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    subject: '',
    chapter: '',
    taskType: 'reading' as Task['task_type'],
    examId: '',
    estimatedMinutes: 30,
  });
  const [analyzedDifficulty, setAnalyzedDifficulty] = useState<DifficultyResult | null>(null);

  const dateTasks = tasks.filter(t => t.date === selectedDate);
  const isLocked = isDateLocked(selectedDate);

  const getDayStatus = (date: string) => {
    const locked = isDateLocked(date);
    const dayTasks = tasks.filter(t => t.date === date);
    const completed = dayTasks.filter(t => t.status === 'completed').length;
    return { locked, total: dayTasks.length, completed };
  };

  const generateWeekDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = -3; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const handleAnalyzeDifficulty = async () => {
    if (!newTask.subject.trim()) {
      toast.error('Please enter a subject first');
      return;
    }

    const exam = exams.find(e => e.id === newTask.examId);
    const result = await analyzeDifficulty(
      newTask.subject,
      newTask.chapter,
      newTask.taskType,
      exam?.name,
      exam?.start_date,
      profile?.board || undefined,
      profile?.class || undefined,
      newTask.estimatedMinutes
    );

    if (result) {
      setAnalyzedDifficulty(result);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    if (!newTask.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!analyzedDifficulty) {
      toast.error('AI must analyze difficulty before adding quest');
      return;
    }

    await addTask({
      ...newTask,
      task_type: newTask.taskType,
      date: selectedDate,
      exam_id: newTask.examId || undefined,
      difficulty: analyzedDifficulty,
      estimated_minutes: newTask.estimatedMinutes,
    });

    setShowAddModal(false);
    setNewTask({ title: '', subject: '', chapter: '', taskType: 'reading', examId: '', estimatedMinutes: 30 });
    setAnalyzedDifficulty(null);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  const handleVerificationChoice = (task: Task, type: 'quiz' | 'upload') => {
    if (type === 'quiz') {
      setShowQuizModal(task);
    } else {
      setShowUploadModal(task);
    }
  };

  const handleQuizComplete = async (passed: boolean, score: number) => {
    if (showQuizModal && passed) {
      await completeTask(showQuizModal.id, 'quiz', undefined, score);
    } else if (!passed) {
      toast.error('Quiz not passed. Try again or upload proof instead.');
    }
    setShowQuizModal(null);
  };

  const handleProofUpload = async (file: File) => {
    if (!showUploadModal) return null;
    return await uploadProof(showUploadModal.id, file);
  };

  const handleProofComplete = async (proofUrl: string) => {
    if (showUploadModal) {
      await completeTask(showUploadModal.id, 'upload', proofUrl);
    }
    setShowUploadModal(null);
  };

  // Calculate money owed/earned
  const completedPoints = tasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.points, 0);
  const missedPoints = tasks.filter(t => t.status === 'missed').reduce((sum, t) => sum + t.points, 0);

  if (loading) {
    return (
      <motion.div className="min-h-screen pt-24 pb-24 px-4 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-24 px-4"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Money Display */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <ScrollText className="w-8 h-8 text-primary" />
            <h1 className="font-pixel text-lg text-foreground">Quest Board</h1>
          </div>
          
          {/* Money tracker */}
          <div className="flex gap-4">
            <div className="flex items-center gap-1 px-3 py-1 bg-game-energy/20 pixel-border">
              <IndianRupee className="w-4 h-4 text-game-energy" />
              <span className="font-game text-lg text-game-energy">+{completedPoints}</span>
            </div>
            {missedPoints > 0 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-destructive/20 pixel-border">
                <IndianRupee className="w-4 h-4 text-destructive" />
                <span className="font-game text-lg text-destructive">-{missedPoints}</span>
              </div>
            )}
          </div>
        </div>

        {/* Date Selector */}
        <div className="overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex gap-2 min-w-max">
            {generateWeekDates().map((date) => {
              const { locked, total, completed } = getDayStatus(date);
              const isSelected = date === selectedDate;
              const isToday = date === new Date().toISOString().split('T')[0];
              const dayName = new Date(date).toLocaleDateString('en', { weekday: 'short' });
              const dayNum = new Date(date).getDate();

              return (
                <PixelButton
                  key={date}
                  variant={isSelected ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedDate(date)}
                  className="flex flex-col items-center min-w-[60px]"
                >
                  <span className="font-pixel text-[8px]">{dayName}</span>
                  <span className="font-game text-xl">{dayNum}</span>
                  {isToday && <span className="font-pixel text-[6px] text-game-gold">TODAY</span>}
                  {total > 0 && (
                    <span className="font-game text-sm">
                      {completed}/{total}
                    </span>
                  )}
                  {locked && <Lock className="w-3 h-3" />}
                </PixelButton>
              );
            })}
          </div>
        </div>

        {/* Lock Status */}
        <PixelPanel className={isLocked ? 'bg-destructive/10' : 'bg-primary/10'}>
          <div className="flex items-center gap-3">
            {isLocked ? (
              <>
                <Lock className="w-6 h-6 text-destructive" />
                <div>
                  <p className="font-pixel text-[10px] text-destructive">DAY LOCKED</p>
                  <p className="font-game text-lg text-muted-foreground">
                    No more quests can be added. Focus on completing!
                  </p>
                </div>
              </>
            ) : (
              <>
                <Unlock className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-pixel text-[10px] text-primary">PLAN YOUR QUESTS</p>
                  <p className="font-game text-lg text-muted-foreground">
                    Add quests for this day. Locks at 5:00 AM.
                  </p>
                </div>
                <PixelButton
                  size="sm"
                  variant="accent"
                  onClick={() => setShowAddModal(true)}
                  className="ml-auto"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Quest
                </PixelButton>
              </>
            )}
          </div>
        </PixelPanel>

        {/* Tasks List */}
        {dateTasks.length === 0 ? (
          <PixelPanel className="text-center py-12">
            <ScrollText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-pixel text-sm text-foreground mb-2">No Quests</h2>
            <p className="font-game text-xl text-muted-foreground">
              {isLocked
                ? 'This day is locked with no quests.'
                : 'Add some quests to start your study adventure!'}
            </p>
          </PixelPanel>
        ) : (
          <div className="space-y-3">
            {dateTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <PixelPanel className="flex items-center gap-4">
                  {/* Status / Complete Button */}
                  <div className="flex-shrink-0">
                    {task.status === 'completed' ? (
                      <CheckCircle className="w-8 h-8 text-primary" />
                    ) : task.status === 'locked' || !isLocked ? (
                      <Circle className="w-8 h-8 text-muted-foreground" />
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleVerificationChoice(task, 'upload')}
                          className="p-2 bg-primary/20 rounded hover:bg-primary/30 transition-colors"
                          title="Upload proof"
                        >
                          <Upload className="w-5 h-5 text-primary" />
                        </button>
                        <button
                          onClick={() => handleVerificationChoice(task, 'quiz')}
                          className="p-2 bg-accent/20 rounded hover:bg-accent/30 transition-colors"
                          title="Take quiz"
                        >
                          <BookOpen className="w-5 h-5 text-accent" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-game text-sm">
                        {taskTypes.find(t => t.value === task.task_type)?.label}
                      </span>
                      {task.difficulty_tier && (
                        <span className={`font-pixel text-[8px] ${difficultyColors[task.difficulty_tier]}`}>
                          {task.difficulty_tier}
                        </span>
                      )}
                    </div>
                    <h3 className="font-game text-xl text-foreground truncate">{task.title}</h3>
                    <p className="font-game text-lg text-muted-foreground">
                      {task.subject} {task.chapter && `- ${task.chapter}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-4 h-4 text-game-gold" />
                        <p className="font-game text-xl text-game-gold">{task.points}</p>
                      </div>
                      <p className="font-pixel text-[8px] text-muted-foreground">POINTS</p>
                    </div>
                    {!isLocked && task.status === 'planned' && (
                      <PixelButton
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </PixelButton>
                    )}
                  </div>
                </PixelPanel>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <PixelPanel variant="dialog">
                <h2 className="font-pixel text-sm text-foreground mb-4">New Quest</h2>
                
                <div className="bg-accent/20 p-3 pixel-border mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-accent" />
                    <p className="font-game text-sm text-accent-foreground">
                      AI will analyze and score this quest
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="font-pixel text-[8px] text-muted-foreground block mb-2">
                      QUEST TITLE *
                    </label>
                    <PixelInput
                      value={newTask.title}
                      onChange={(e) => setNewTask(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g., Complete Chapter 5 exercises"
                    />
                  </div>

                  <div>
                    <label className="font-pixel text-[8px] text-muted-foreground block mb-2">
                      SUBJECT *
                    </label>
                    <PixelInput
                      value={newTask.subject}
                      onChange={(e) => {
                        setNewTask(p => ({ ...p, subject: e.target.value }));
                        setAnalyzedDifficulty(null);
                      }}
                      placeholder="e.g., Physics"
                    />
                  </div>

                  <div>
                    <label className="font-pixel text-[8px] text-muted-foreground block mb-2">
                      CHAPTER / TOPIC
                    </label>
                    <PixelInput
                      value={newTask.chapter}
                      onChange={(e) => {
                        setNewTask(p => ({ ...p, chapter: e.target.value }));
                        setAnalyzedDifficulty(null);
                      }}
                      placeholder="e.g., Electromagnetism"
                    />
                  </div>

                  <div>
                    <label className="font-pixel text-[8px] text-muted-foreground block mb-2">
                      TASK TYPE
                    </label>
                    <PixelSelect
                      value={newTask.taskType}
                      onChange={(e) => {
                        setNewTask(p => ({ ...p, taskType: e.target.value as Task['task_type'] }));
                        setAnalyzedDifficulty(null);
                      }}
                      options={taskTypes}
                    />
                  </div>

                  <div>
                    <label className="font-pixel text-[8px] text-muted-foreground block mb-2">
                      ESTIMATED TIME (minutes)
                    </label>
                    <PixelSelect
                      value={String(newTask.estimatedMinutes)}
                      onChange={(e) => {
                        setNewTask(p => ({ ...p, estimatedMinutes: parseInt(e.target.value) }));
                        setAnalyzedDifficulty(null);
                      }}
                      options={[
                        { value: '15', label: '15 min' },
                        { value: '30', label: '30 min' },
                        { value: '45', label: '45 min' },
                        { value: '60', label: '1 hour' },
                        { value: '90', label: '1.5 hours' },
                        { value: '120', label: '2 hours' },
                        { value: '180', label: '3 hours' },
                        { value: '240', label: '4+ hours' },
                      ]}
                    />
                  </div>

                  {exams.length > 0 && (
                    <div>
                      <label className="font-pixel text-[8px] text-muted-foreground block mb-2">
                        LINKED EXAM (for AI scoring)
                      </label>
                      <PixelSelect
                        value={newTask.examId}
                        onChange={(e) => {
                          setNewTask(p => ({ ...p, examId: e.target.value }));
                          setAnalyzedDifficulty(null);
                        }}
                        options={[
                          { value: '', label: 'None' },
                          ...exams.map(e => ({ value: e.id, label: e.name }))
                        ]}
                      />
                    </div>
                  )}

                  {/* AI Analysis Section */}
                  <div className="pt-2">
                    {!analyzedDifficulty ? (
                      <PixelButton
                        variant="accent"
                        onClick={handleAnalyzeDifficulty}
                        disabled={analyzingDifficulty || !newTask.subject.trim()}
                        className="w-full"
                      >
                        {analyzingDifficulty ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            AI Analyzing...
                          </>
                        ) : (
                          'Analyze Difficulty with AI'
                        )}
                      </PixelButton>
                    ) : (
                      <div className="bg-card p-4 pixel-border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-pixel text-[10px] text-muted-foreground">DIFFICULTY</span>
                          <span className={`font-pixel text-sm ${difficultyColors[analyzedDifficulty.tier]}`}>
                            {analyzedDifficulty.tier}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-pixel text-[10px] text-muted-foreground">POINTS</span>
                          <div className="flex items-center gap-1">
                            <IndianRupee className="w-4 h-4 text-game-gold" />
                            <span className="font-game text-xl text-game-gold">{analyzedDifficulty.points}</span>
                          </div>
                        </div>
                        <p className="font-game text-sm text-muted-foreground">
                          {analyzedDifficulty.justification}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <PixelButton 
                      onClick={handleAddTask} 
                      className="flex-1"
                      disabled={!analyzedDifficulty}
                    >
                      Add Quest
                    </PixelButton>
                    <PixelButton
                      variant="secondary"
                      onClick={() => {
                        setShowAddModal(false);
                        setAnalyzedDifficulty(null);
                      }}
                    >
                      Cancel
                    </PixelButton>
                  </div>
                </div>
              </PixelPanel>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuizModal && (
          <QuizModal
            subject={showQuizModal.subject}
            chapter={showQuizModal.chapter}
            taskType={showQuizModal.task_type}
            difficultyTier={showQuizModal.difficulty_tier || 'Medium'}
            onComplete={handleQuizComplete}
            onClose={() => setShowQuizModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <ProofUploadModal
            onUpload={handleProofUpload}
            onComplete={handleProofComplete}
            onClose={() => setShowUploadModal(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
