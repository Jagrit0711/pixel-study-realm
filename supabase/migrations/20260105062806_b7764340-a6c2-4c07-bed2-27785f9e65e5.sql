-- Create squad_activity table for tracking events
CREATE TABLE public.squad_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'joined', 'task_completed', 'streak_milestone', 'level_up'
  activity_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_squad_activity_squad_id ON public.squad_activity(squad_id);
CREATE INDEX idx_squad_activity_created_at ON public.squad_activity(created_at DESC);

-- Enable RLS
ALTER TABLE public.squad_activity ENABLE ROW LEVEL SECURITY;

-- Squad members can view activity for their squads
CREATE POLICY "Squad members can view activity"
ON public.squad_activity
FOR SELECT
USING (is_in_same_squad(squad_id));

-- Users can insert their own activity
CREATE POLICY "Users can insert their own activity"
ON public.squad_activity
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for squad_activity
ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_activity;