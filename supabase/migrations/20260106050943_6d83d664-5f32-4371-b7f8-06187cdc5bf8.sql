-- Add board and class to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS board text,
ADD COLUMN IF NOT EXISTS class text;

-- Add estimated_minutes to tasks for time-based scoring
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS estimated_minutes integer DEFAULT 30;

-- Create proof_reviews table for squad member verification
CREATE TABLE IF NOT EXISTS public.proof_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  ai_rejection_approved boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on proof_reviews
ALTER TABLE public.proof_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for proof_reviews
CREATE POLICY "Squad members can view proof reviews"
ON public.proof_reviews FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN squad_members sm1 ON sm1.user_id = t.user_id
    JOIN squad_members sm2 ON sm2.squad_id = sm1.squad_id
    WHERE t.id = proof_reviews.task_id AND sm2.user_id = auth.uid()
  )
);

CREATE POLICY "Squad members can create proof reviews"
ON public.proof_reviews FOR INSERT
WITH CHECK (
  auth.uid() = reviewer_id AND
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN squad_members sm1 ON sm1.user_id = t.user_id
    JOIN squad_members sm2 ON sm2.squad_id = sm1.squad_id AND sm2.user_id = auth.uid()
    WHERE t.id = task_id AND t.user_id != auth.uid()
  )
);

CREATE POLICY "Reviewers can update their own reviews"
ON public.proof_reviews FOR UPDATE
USING (auth.uid() = reviewer_id);

-- Add new activity types constraint is handled via text column - no need for enum
-- Update tasks status to include pending_review
-- No change needed as status is text type