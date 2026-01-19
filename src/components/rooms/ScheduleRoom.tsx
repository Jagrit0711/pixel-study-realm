import { useState, useRef, useEffect } from 'react';
import { useStudyChat, ChatMessage, ScheduledTask } from '@/hooks/useStudyChat';
import { PixelPanel } from '../game/PixelPanel';
import { PixelButton } from '../game/PixelButton';
import { PixelInput } from '../game/PixelInput';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Loader2, 
  CheckCircle, 
  Plus, 
  Clock, 
  IndianRupee, 
  Sparkles,
  Brain,
  Target,
  BookOpen,
  History,
  AlertCircle,
  Trash2,
  MessageCircle
} from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

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
    messages, 
    isLoading, 
    pendingPlan,
    sendMessage, 
    addTaskFromPlan,
    addAllTasksFromPlan,
    clearChat 
  } = useStudyChat();
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: "Make a study plan", message: "Help me create a study plan for tomorrow" },
    { label: "What should I study?", message: "What should I focus on today based on my exams?" },
    { label: "Study tips", message: "Give me some quick study tips" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-24 px-4"
    >
      <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Brain className="w-8 h-8 text-primary" />
            </motion.div>
            <div>
              <h1 className="font-pixel text-lg text-foreground">Study Buddy AI</h1>
              <p className="font-game text-lg text-muted-foreground">Chat & plan your studies</p>
            </div>
          </div>
          
          <PixelButton 
            variant="secondary" 
            size="sm"
            onClick={clearChat}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </PixelButton>
        </div>

        {/* Chat Area */}
        <PixelPanel className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatBubble 
                  key={message.id} 
                  message={message}
                  onAddTask={addTaskFromPlan}
                  onAddAll={addAllTasksFromPlan}
                  pendingPlan={pendingPlan}
                />
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-game text-lg">Study Buddy is thinking...</span>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, i) => (
                  <PixelButton
                    key={i}
                    variant="secondary"
                    size="sm"
                    onClick={() => sendMessage(action.message)}
                    disabled={isLoading}
                  >
                    {action.label}
                  </PixelButton>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <PixelInput
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your studies or say 'make a plan'..."
                disabled={isLoading}
                className="flex-1"
              />
              <PixelButton
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                variant="primary"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </PixelButton>
            </div>
          </div>
        </PixelPanel>
      </div>
    </motion.div>
  );
};

interface ChatBubbleProps {
  message: ChatMessage;
  onAddTask: (task: ScheduledTask, index: number) => Promise<boolean>;
  onAddAll: () => Promise<void>;
  pendingPlan: { addedTasks: Set<number> } | null;
}

const ChatBubble = ({ message, onAddTask, onAddAll, pendingPlan }: ChatBubbleProps) => {
  const isUser = message.role === 'user';
  const [addingIndex, setAddingIndex] = useState<number | null>(null);

  const handleAddTask = async (task: ScheduledTask, index: number) => {
    setAddingIndex(index);
    await onAddTask(task, index);
    setAddingIndex(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[85%] ${isUser ? 'order-1' : ''}`}>
        {/* Chat bubble */}
        <div
          className={`px-4 py-3 rounded-lg ${
            isUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted'
          }`}
        >
          <div className="flex items-start gap-2">
            {!isUser && (
              <Sparkles className="w-4 h-4 mt-1 text-game-gold flex-shrink-0" />
            )}
            <p className={`font-game text-lg ${isUser ? '' : 'text-foreground'}`}>
              {message.content}
            </p>
          </div>
        </div>

        {/* Plan cards */}
        {message.plan && message.plan.tasks.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-pixel text-[8px] text-muted-foreground">
                STUDY PLAN • {formatDate(message.plan.targetDate)}
              </p>
              <PixelButton
                size="sm"
                variant="gold"
                onClick={onAddAll}
                disabled={pendingPlan?.addedTasks.size === message.plan.tasks.length}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add All
              </PixelButton>
            </div>

            <div className="space-y-2">
              {message.plan.tasks.map((task, index) => {
                const isAdded = pendingPlan?.addedTasks.has(index);
                
                return (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={`p-3 bg-card pixel-border ${priorityColors[task.priority]} ${isAdded ? 'opacity-60' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 p-2 bg-primary/20 rounded">
                          {taskTypeIcons[task.task_type]}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded font-pixel text-[8px] ${difficultyColors[task.difficulty_tier]}`}>
                              {task.difficulty_tier}
                            </span>
                          </div>
                          
                          <h3 className="font-game text-lg text-foreground">{task.title}</h3>
                          <p className="font-game text-sm text-muted-foreground">
                            {task.subject} {task.chapter && `• ${task.chapter}`}
                          </p>
                          
                          <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span className="font-game text-sm">{task.estimated_minutes}m</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <IndianRupee className="w-3 h-3 text-game-gold" />
                              <span className="font-game text-sm text-game-gold">{task.points}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          {isAdded ? (
                            <div className="flex items-center gap-1 text-game-energy">
                              <CheckCircle className="w-5 h-5" />
                            </div>
                          ) : (
                            <PixelButton
                              size="sm"
                              onClick={() => handleAddTask(task, index)}
                              disabled={addingIndex === index}
                            >
                              {addingIndex === index ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                            </PixelButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <p className={`font-game text-xs text-muted-foreground mt-1 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
