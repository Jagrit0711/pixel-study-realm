-- Drop and recreate the status check constraint to include 'pending_review'
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check 
CHECK (status = ANY (ARRAY['planned'::text, 'locked'::text, 'completed'::text, 'missed'::text, 'pending_review'::text]));