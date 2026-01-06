import { motion } from 'framer-motion';
import { PixelPanel } from '../game/PixelPanel';
import { PixelAvatar } from '../game/PixelAvatar';
import { useSquadTasks, SquadMemberTask } from '@/hooks/useSquadTasks';
import { CheckCircle, Circle, Clock, Loader2, ScrollText, IndianRupee, HourglassIcon } from 'lucide-react';

interface SquadTodayTasksProps {
  squadId: string | null;
}

const statusConfig = {
  planned: { icon: Circle, color: 'text-muted-foreground', label: 'Planned' },
  locked: { icon: Circle, color: 'text-muted-foreground', label: 'Locked' },
  pending_review: { icon: HourglassIcon, color: 'text-game-gold', label: 'Pending Review' },
  completed: { icon: CheckCircle, color: 'text-primary', label: 'Completed' },
  missed: { icon: Circle, color: 'text-destructive', label: 'Missed' },
};

export const SquadTodayTasks = ({ squadId }: SquadTodayTasksProps) => {
  const { squadTasks, loading } = useSquadTasks(squadId);

  if (loading) {
    return (
      <PixelPanel className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </PixelPanel>
    );
  }

  if (squadTasks.length === 0) {
    return (
      <PixelPanel className="text-center py-6">
        <ScrollText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="font-game text-lg text-muted-foreground">
          No quests scheduled by squad members today.
        </p>
      </PixelPanel>
    );
  }

  // Group tasks by owner
  const tasksByOwner = squadTasks.reduce((acc, task) => {
    const ownerId = task.user_id;
    if (!acc[ownerId]) {
      acc[ownerId] = {
        name: task.owner_name || 'Unknown',
        avatar: task.owner_avatar || 'default',
        tasks: [],
      };
    }
    acc[ownerId].tasks.push(task);
    return acc;
  }, {} as Record<string, { name: string; avatar: string; tasks: SquadMemberTask[] }>);

  return (
    <PixelPanel>
      <h3 className="font-pixel text-xs text-muted-foreground mb-4">
        TODAY'S SQUAD QUESTS
      </h3>

      <div className="space-y-4">
        {Object.entries(tasksByOwner).map(([ownerId, { name, avatar, tasks }]) => (
          <motion.div
            key={ownerId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/30 p-3 pixel-border"
          >
            <div className="flex items-center gap-2 mb-3">
              <PixelAvatar seed={avatar} size="sm" />
              <span className="font-game text-lg text-foreground">{name}</span>
              <span className="font-game text-sm text-muted-foreground ml-auto">
                {tasks.filter(t => t.status === 'completed').length}/{tasks.length} done
              </span>
            </div>

            <div className="space-y-2">
              {tasks.map((task) => {
                const config = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.planned;
                const StatusIcon = config.icon;
                
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 py-1"
                  >
                    <StatusIcon className={`w-4 h-4 ${config.color}`} />
                    <span className="font-game text-sm text-foreground flex-1 truncate">
                      {task.title}
                    </span>
                    <span className="font-game text-xs text-muted-foreground">
                      {task.subject}
                    </span>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="w-3 h-3 text-game-gold" />
                      <span className="font-game text-xs text-game-gold">{task.points}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </PixelPanel>
  );
};
