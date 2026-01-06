import { motion, AnimatePresence } from 'framer-motion';
import { PixelPanel } from '../game/PixelPanel';
import { PixelAvatar } from '../game/PixelAvatar';
import { SquadActivity } from '@/hooks/useSquadActivity';
import { UserPlus, CheckCircle, Flame, ArrowUp, Loader2, Calendar, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SquadActivityFeedProps {
  activities: SquadActivity[];
  loading: boolean;
}

const getActivityIcon = (type: SquadActivity['activity_type']) => {
  switch (type) {
    case 'joined':
      return <UserPlus className="w-4 h-4 text-primary" />;
    case 'task_completed':
      return <CheckCircle className="w-4 h-4 text-game-success" />;
    case 'task_scheduled':
      return <Calendar className="w-4 h-4 text-game-exp" />;
    case 'streak_milestone':
      return <Flame className="w-4 h-4 text-game-fire" />;
    case 'level_up':
      return <ArrowUp className="w-4 h-4 text-game-gold" />;
    case 'proof_rejected':
      return <XCircle className="w-4 h-4 text-destructive" />;
    default:
      return null;
  }
};

const getActivityMessage = (activity: SquadActivity) => {
  const name = activity.activity_data.user_name || 'Unknown';
  
  switch (activity.activity_type) {
    case 'joined':
      return <><span className="text-primary">{name}</span> joined the squad!</>;
    case 'task_scheduled':
      return (
        <>
          <span className="text-primary">{name}</span> scheduled{' '}
          <span className="text-game-exp">"{activity.activity_data.task_title}"</span>
          {activity.activity_data.points && (
            <span className="text-muted-foreground"> ({activity.activity_data.points} pts)</span>
          )}
        </>
      );
    case 'task_completed':
      return (
        <>
          <span className="text-primary">{name}</span> completed{' '}
          <span className="text-game-success">"{activity.activity_data.task_title}"</span>
          {activity.activity_data.points && (
            <span className="text-game-gold"> (+{activity.activity_data.points} pts)</span>
          )}
          {activity.activity_data.auto_approved && (
            <span className="text-muted-foreground"> (auto-approved)</span>
          )}
        </>
      );
    case 'proof_rejected':
      return (
        <>
          <span className="text-primary">{activity.activity_data.reviewer_name || 'A reviewer'}</span> rejected{' '}
          <span className="text-destructive">"{activity.activity_data.task_title}"</span>
          {' '}by <span className="text-primary">{name}</span>
        </>
      );
    case 'streak_milestone':
      return (
        <>
          <span className="text-primary">{name}</span> reached a{' '}
          <span className="text-game-fire">{activity.activity_data.streak}-day streak!</span>
        </>
      );
    case 'level_up':
      return (
        <>
          <span className="text-primary">{name}</span> leveled up to{' '}
          <span className="text-game-gold">Level {activity.activity_data.level}!</span>
        </>
      );
    default:
      return 'Unknown activity';
  }
};

export const SquadActivityFeed = ({ activities, loading }: SquadActivityFeedProps) => {
  if (loading) {
    return (
      <PixelPanel className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </PixelPanel>
    );
  }

  if (activities.length === 0) {
    return (
      <PixelPanel className="text-center py-6">
        <p className="font-game text-lg text-muted-foreground">
          No activity yet. Complete quests to show up here!
        </p>
      </PixelPanel>
    );
  }

  return (
    <PixelPanel className="max-h-80 overflow-y-auto">
      <h3 className="font-pixel text-xs text-muted-foreground mb-3">LIVE ACTIVITY</h3>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              layout
              className="flex items-start gap-3 p-2 rounded bg-card/30 hover:bg-card/50 transition-colors"
            >
              <PixelAvatar 
                seed={activity.activity_data.avatar_seed || 'default'} 
                size="sm" 
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {getActivityIcon(activity.activity_type)}
                  <p className="font-game text-base text-foreground truncate">
                    {getActivityMessage(activity)}
                  </p>
                </div>
                <p className="font-game text-sm text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </PixelPanel>
  );
};
