import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useSquads } from '@/hooks/useSquads';
import { useSquadActivity } from '@/hooks/useSquadActivity';
import { PixelPanel } from '../game/PixelPanel';
import { PixelButton } from '../game/PixelButton';
import { PixelInput } from '../game/PixelInput';
import { PixelAvatar } from '../game/PixelAvatar';
import { SquadActivityFeed } from './SquadActivityFeed';
import { ProofReviewPanel } from '../verification/ProofReviewPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, LogOut, Copy, Check, Loader2, Crown, IndianRupee, Activity, FileCheck } from 'lucide-react';
import { toast } from 'sonner';

export const SquadRoomConnected = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { 
    squads, 
    members, 
    loading, 
    currentSquadId, 
    setCurrentSquadId,
    createSquad, 
    joinSquad, 
    leaveSquad,
    fetchSquadMembers
  } = useSquads();

  const { activities, loading: activitiesLoading } = useSquadActivity(currentSquadId);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(true);
  const [showProofReviews, setShowProofReviews] = useState(false);

  const currentSquad = squads.find(s => s.id === currentSquadId);
  const currentMembers = currentSquadId ? members[currentSquadId] || [] : [];

  useEffect(() => {
    if (currentSquadId && !members[currentSquadId]) {
      fetchSquadMembers(currentSquadId);
    }
  }, [currentSquadId]);

  const handleCreateSquad = async () => {
    if (!newSquadName.trim()) {
      toast.error('Please enter a squad name');
      return;
    }
    setCreating(true);
    const squad = await createSquad(newSquadName);
    if (squad) {
      setCurrentSquadId(squad.id);
    }
    setCreating(false);
    setShowCreateModal(false);
    setNewSquadName('');
  };

  const handleJoinSquad = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a squad code');
      return;
    }
    setJoining(true);
    await joinSquad(joinCode);
    setJoining(false);
    setShowJoinModal(false);
    setJoinCode('');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleLeaveSquad = async (squadId: string) => {
    await leaveSquad(squadId);
  };

  const handleSelectSquad = (squadId: string) => {
    setCurrentSquadId(squadId);
    fetchSquadMembers(squadId);
  };

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="font-pixel text-lg text-foreground">Your Squads</h1>
          </div>
          <div className="flex gap-2">
            <PixelButton size="sm" onClick={() => setShowJoinModal(true)}>
              Join Squad
            </PixelButton>
            <PixelButton size="sm" variant="accent" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Create
            </PixelButton>
          </div>
        </div>

        {/* Squads List */}
        {squads.length === 0 ? (
          <PixelPanel className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-pixel text-sm text-foreground mb-2">No Squads Yet</h2>
            <p className="font-game text-xl text-muted-foreground mb-6">
              Create a squad or join one with a code to compete with friends!
            </p>
            <div className="flex justify-center gap-4">
              <PixelButton onClick={() => setShowCreateModal(true)}>Create Squad</PixelButton>
              <PixelButton variant="secondary" onClick={() => setShowJoinModal(true)}>Join Squad</PixelButton>
            </div>
          </PixelPanel>
        ) : (
          <div className="space-y-4">
            {squads.map((squad) => (
              <motion.div
                key={squad.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <PixelPanel
                  className={`cursor-pointer transition-all ${
                    currentSquadId === squad.id ? 'ring-2 ring-primary' : 'hover:brightness-105'
                  }`}
                  onClick={() => handleSelectSquad(squad.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-pixel text-sm text-foreground">{squad.name}</h3>
                        {squad.created_by === user?.id && (
                          <Crown className="w-4 h-4 text-game-gold" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-game text-lg text-muted-foreground">
                          Code: {squad.code}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCode(squad.code);
                          }}
                          className="p-1 hover:bg-muted rounded"
                        >
                          {copiedCode === squad.code ? (
                            <Check className="w-4 h-4 text-primary" />
                          ) : (
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                    <PixelButton
                      size="sm"
                      variant="danger"
                      onClick={() => handleLeaveSquad(squad.id)}
                    >
                      <LogOut className="w-4 h-4" />
                    </PixelButton>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-[8px] text-muted-foreground">MEMBERS:</span>
                    <div className="flex -space-x-2">
                      {(members[squad.id] || []).slice(0, 5).map((member) => (
                        <PixelAvatar key={member.id} seed={member.profile?.avatar_seed || 'default'} size="sm" />
                      ))}
                    </div>
                    <span className="font-game text-lg text-muted-foreground">
                      {(members[squad.id] || []).length}/12
                    </span>
                  </div>
                </PixelPanel>
              </motion.div>
            ))}
          </div>
        )}

        {/* Current Squad Leaderboard */}
        {currentSquad && currentMembers.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <PixelPanel variant="wood" className="mt-8">
              <h2 className="font-pixel text-sm text-primary-foreground mb-4">
                {currentSquad.name} - Leaderboard
              </h2>
              <div className="space-y-3">
                {[...currentMembers]
                  .sort((a, b) => (b.profile?.total_points || 0) - (a.profile?.total_points || 0))
                  .map((member, index) => (
                    <div
                      key={member.id}
                      className={`flex items-center gap-4 p-3 pixel-border ${
                        index === 0 ? 'bg-game-gold/20' : 
                        index === 1 ? 'bg-card/40' :
                        index === 2 ? 'bg-accent/20' : 'bg-card/20'
                      }`}
                    >
                      <span className="font-pixel text-lg text-game-gold w-8">
                        #{index + 1}
                      </span>
                      <PixelAvatar seed={member.profile?.avatar_seed || 'default'} size="sm" />
                      <div className="flex-1">
                        <p className="font-game text-xl text-primary-foreground">
                          {member.profile?.name || 'Unknown'}
                          {member.user_id === user?.id && ' (You)'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-4 h-4 text-game-gold" />
                          <p className="font-game text-xl text-game-gold">
                            {member.profile?.total_points || 0}
                          </p>
                        </div>
                        <p className="font-pixel text-[8px] text-primary-foreground/60">
                          {member.profile?.current_streak || 0} day streak
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </PixelPanel>
          </motion.div>
        )}

        {/* Proof Reviews Section */}
        {squads.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-game-energy" />
                <h3 className="font-pixel text-xs text-foreground">Proof Reviews</h3>
              </div>
              <PixelButton 
                size="sm" 
                variant="secondary"
                onClick={() => setShowProofReviews(!showProofReviews)}
              >
                {showProofReviews ? 'Hide' : 'Show'}
              </PixelButton>
            </div>
            {showProofReviews && <ProofReviewPanel />}
          </motion.div>
        )}

        {/* Activity Feed */}
        {currentSquad && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="font-pixel text-xs text-foreground">Activity Feed</h3>
              </div>
              <PixelButton 
                size="sm" 
                variant="secondary"
                onClick={() => setShowActivityFeed(!showActivityFeed)}
              >
                {showActivityFeed ? 'Hide' : 'Show'}
              </PixelButton>
            </div>
            {showActivityFeed && (
              <SquadActivityFeed activities={activities} loading={activitiesLoading} />
            )}
          </motion.div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <PixelPanel variant="dialog" className="w-full max-w-md">
                <h2 className="font-pixel text-sm text-foreground mb-4">Create Squad</h2>
                <div className="space-y-4">
                  <div>
                    <label className="font-pixel text-[8px] text-muted-foreground block mb-2">
                      SQUAD NAME
                    </label>
                    <PixelInput
                      value={newSquadName}
                      onChange={(e) => setNewSquadName(e.target.value)}
                      placeholder="Enter squad name..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <PixelButton onClick={handleCreateSquad} className="flex-1" disabled={creating}>
                      {creating ? 'Creating...' : 'Create'}
                    </PixelButton>
                    <PixelButton
                      variant="secondary"
                      onClick={() => setShowCreateModal(false)}
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

      {/* Join Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowJoinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <PixelPanel variant="dialog" className="w-full max-w-md">
                <h2 className="font-pixel text-sm text-foreground mb-4">Join Squad</h2>
                <div className="space-y-4">
                  <div>
                    <label className="font-pixel text-[8px] text-muted-foreground block mb-2">
                      SQUAD CODE
                    </label>
                    <PixelInput
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="Enter 6-digit code..."
                      maxLength={6}
                    />
                  </div>
                  <div className="flex gap-2">
                    <PixelButton onClick={handleJoinSquad} className="flex-1" disabled={joining}>
                      {joining ? 'Joining...' : 'Join'}
                    </PixelButton>
                    <PixelButton
                      variant="secondary"
                      onClick={() => setShowJoinModal(false)}
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
