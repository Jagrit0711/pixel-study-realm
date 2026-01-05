import { useState } from 'react';
import { useGameStore, Task } from '@/store/gameStore';
import { PixelPanel } from '../game/PixelPanel';
import { PixelButton } from '../game/PixelButton';
import { PixelInput } from '../game/PixelInput';
import { PixelSelect } from '../game/PixelSelect';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Plus, Lock, Unlock, CheckCircle, Circle, Trash2, AlertTriangle } from 'lucide-react';
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

export const QuestBoardRoom = () => {
  const { tasks, addTask, deleteTask, isDateLocked, exams } = useGameStore();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    subject: '',
    chapter: '',
    taskType: 'reading' as Task['taskType'],
  });

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

  const handleAddTask = () => {
    if (!newTask.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    if (!newTask.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    // AI would score here - for now, simulate
    const mockDifficulty = {
      tier: ['Easy', 'Medium', 'Hard', 'Very Hard'][Math.floor(Math.random() * 4)] as Task['difficulty']['tier'],
      score: Math.floor(Math.random() * 100),
      points: Math.floor(Math.random() * 50) + 10,
      justification: 'AI-scored based on subject complexity and exam proximity.',
    };

    addTask({
      ...newTask,
      date: selectedDate,
      difficulty: mockDifficulty,
    });

    setShowAddModal(false);
    setNewTask({ title: '', subject: '', chapter: '', taskType: 'reading' });
    toast.success('Quest added!');
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    toast.success('Quest removed');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-24 px-4"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScrollText className="w-8 h-8 text-primary" />
            <h1 className="font-pixel text-lg text-foreground">Quest Board</h1>
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
                  <button className="flex-shrink-0">
                    {task.status === 'completed' ? (
                      <CheckCircle className="w-8 h-8 text-primary" />
                    ) : (
                      <Circle className="w-8 h-8 text-muted-foreground" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-game text-sm">
                        {taskTypes.find(t => t.value === task.taskType)?.label}
                      </span>
                      {task.difficulty && (
                        <span className={`font-pixel text-[8px] ${difficultyColors[task.difficulty.tier]}`}>
                          {task.difficulty.tier}
                        </span>
                      )}
                    </div>
                    <h3 className="font-game text-xl text-foreground truncate">{task.title}</h3>
                    <p className="font-game text-lg text-muted-foreground">
                      {task.subject} {task.chapter && `- ${task.chapter}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.difficulty && (
                      <div className="text-right">
                        <p className="font-game text-xl text-game-gold">{task.difficulty.points}</p>
                        <p className="font-pixel text-[8px] text-muted-foreground">POINTS</p>
                      </div>
                    )}
                    {!isLocked && (
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
              className="w-full max-w-md"
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
                      onChange={(e) => setNewTask(p => ({ ...p, subject: e.target.value }))}
                      placeholder="e.g., Mathematics"
                    />
                  </div>

                  <div>
                    <label className="font-pixel text-[8px] text-muted-foreground block mb-2">
                      CHAPTER / TOPIC
                    </label>
                    <PixelInput
                      value={newTask.chapter}
                      onChange={(e) => setNewTask(p => ({ ...p, chapter: e.target.value }))}
                      placeholder="e.g., Quadratic Equations"
                    />
                  </div>

                  <div>
                    <label className="font-pixel text-[8px] text-muted-foreground block mb-2">
                      TASK TYPE
                    </label>
                    <PixelSelect
                      value={newTask.taskType}
                      onChange={(e) => setNewTask(p => ({ ...p, taskType: e.target.value as Task['taskType'] }))}
                      options={taskTypes}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <PixelButton onClick={handleAddTask} className="flex-1">
                      Add Quest
                    </PixelButton>
                    <PixelButton
                      variant="secondary"
                      onClick={() => setShowAddModal(false)}
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
    </motion.div>
  );
};
