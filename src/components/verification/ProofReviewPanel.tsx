import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelPanel } from '../game/PixelPanel';
import { PixelButton } from '../game/PixelButton';
import { PixelAvatar } from '../game/PixelAvatar';
import { PixelInput } from '../game/PixelInput';
import { useProofReviews, PendingProofTask } from '@/hooks/useProofReviews';
import { CheckCircle, X, ExternalLink, Loader2, AlertTriangle, FileCheck } from 'lucide-react';

interface ProofReviewPanelProps {
  onClose?: () => void;
}

export const ProofReviewPanel = ({ onClose }: ProofReviewPanelProps) => {
  const { pendingTasks, loading, approveProof, rejectProof } = useProofReviews();
  const [rejectingTask, setRejectingTask] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async (taskId: string) => {
    setProcessing(taskId);
    setError(null);
    await approveProof(taskId);
    setProcessing(null);
  };

  const handleReject = async (taskId: string) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setProcessing(taskId);
    setError(null);
    
    const result = await rejectProof(taskId, rejectionReason);
    
    if (!result.success) {
      setError(result.message);
      setProcessing(null);
    } else {
      setRejectingTask(null);
      setRejectionReason('');
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <PixelPanel className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </PixelPanel>
    );
  }

  if (pendingTasks.length === 0) {
    return (
      <PixelPanel className="text-center py-6">
        <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="font-game text-lg text-muted-foreground">
          No proofs pending review from your squad members.
        </p>
      </PixelPanel>
    );
  }

  return (
    <PixelPanel>
      <h3 className="font-pixel text-xs text-muted-foreground mb-4">
        PENDING PROOF REVIEWS ({pendingTasks.length})
      </h3>
      
      <div className="space-y-4">
        {pendingTasks.map((task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/30 p-4 pixel-border"
          >
            <div className="flex items-start gap-3 mb-3">
              <PixelAvatar seed={task.owner_avatar || 'default'} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-game text-lg text-foreground">
                  <span className="text-primary">{task.owner_name}</span> completed
                </p>
                <p className="font-game text-xl text-foreground truncate">{task.title}</p>
                <p className="font-game text-sm text-muted-foreground">
                  {task.subject} {task.chapter && `- ${task.chapter}`}
                </p>
                <p className="font-game text-lg text-game-gold mt-1">
                  {task.points} pts if approved
                </p>
              </div>
            </div>

            {/* Proof Link */}
            {task.proof_url && (
              <a
                href={task.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline font-game text-lg mb-3"
              >
                <ExternalLink className="w-4 h-4" />
                View Uploaded Proof
              </a>
            )}

            {/* Actions */}
            {rejectingTask === task.id ? (
              <div className="space-y-3">
                <div className="bg-destructive/10 p-3 pixel-border">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <p className="font-pixel text-[8px] text-destructive">
                      AI WILL VALIDATE YOUR REJECTION
                    </p>
                  </div>
                  <p className="font-game text-sm text-muted-foreground">
                    Your rejection must be specific and fair. Vague or unfair rejections will be blocked.
                  </p>
                </div>
                
                <PixelInput
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Specific reason for rejection (e.g., 'Only 5 questions shown, task required 15')"
                />
                
                {error && (
                  <p className="font-game text-sm text-destructive">{error}</p>
                )}
                
                <div className="flex gap-2">
                  <PixelButton
                    variant="danger"
                    size="sm"
                    onClick={() => handleReject(task.id)}
                    disabled={processing === task.id}
                  >
                    {processing === task.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Submit Rejection'
                    )}
                  </PixelButton>
                  <PixelButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setRejectingTask(null);
                      setRejectionReason('');
                      setError(null);
                    }}
                  >
                    Cancel
                  </PixelButton>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <PixelButton
                  variant="primary"
                  size="sm"
                  onClick={() => handleApprove(task.id)}
                  disabled={processing === task.id}
                >
                  {processing === task.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </>
                  )}
                </PixelButton>
                <PixelButton
                  variant="danger"
                  size="sm"
                  onClick={() => setRejectingTask(task.id)}
                  disabled={processing === task.id}
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </PixelButton>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </PixelPanel>
  );
};