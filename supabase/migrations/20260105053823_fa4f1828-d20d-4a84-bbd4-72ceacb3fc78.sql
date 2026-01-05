-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Adventurer',
  avatar_seed TEXT NOT NULL DEFAULT 'hero',
  total_points INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  exp INTEGER NOT NULL DEFAULT 0,
  amount_owed DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_to_receive DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create squads table
CREATE TABLE public.squads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create squad members junction table
CREATE TABLE public.squad_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(squad_id, user_id)
);

-- Create exams table
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks (quests) table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('reading', 'problem-solving', 'revision', 'practice', 'test-prep')),
  date DATE NOT NULL,
  difficulty_tier TEXT CHECK (difficulty_tier IN ('Easy', 'Medium', 'Hard', 'Very Hard')),
  difficulty_score INTEGER,
  points INTEGER NOT NULL DEFAULT 0,
  difficulty_justification TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'locked', 'completed', 'missed')),
  proof_url TEXT,
  proof_type TEXT CHECK (proof_type IN ('upload', 'quiz')),
  quiz_score INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  points_required INTEGER,
  streak_required INTEGER,
  tasks_required INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user achievements junction table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create daily reports table
CREATE TABLE public.daily_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  tasks_missed INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  points_lost INTEGER NOT NULL DEFAULT 0,
  ai_insights JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, report_date)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Squad members can view other members' profiles for leaderboard
CREATE POLICY "Squad members can view teammate profiles" ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.squad_members sm1
    JOIN public.squad_members sm2 ON sm1.squad_id = sm2.squad_id
    WHERE sm1.user_id = auth.uid() AND sm2.user_id = profiles.user_id
  )
);

-- Squads policies
CREATE POLICY "Anyone can view squads they are in" ON public.squads FOR SELECT
USING (EXISTS (SELECT 1 FROM public.squad_members WHERE squad_id = squads.id AND user_id = auth.uid()));
CREATE POLICY "Authenticated users can create squads" ON public.squads FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Squad creator can update squad" ON public.squads FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Squad creator can delete squad" ON public.squads FOR DELETE USING (auth.uid() = created_by);

-- Squad members policies
CREATE POLICY "Members can view squad members" ON public.squad_members FOR SELECT
USING (EXISTS (SELECT 1 FROM public.squad_members sm WHERE sm.squad_id = squad_members.squad_id AND sm.user_id = auth.uid()));
CREATE POLICY "Users can join squads" ON public.squad_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave squads" ON public.squad_members FOR DELETE USING (auth.uid() = user_id);

-- Exams policies
CREATE POLICY "Users can view their own exams" ON public.exams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own exams" ON public.exams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own exams" ON public.exams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own exams" ON public.exams FOR DELETE USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view their own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Squad members can view each other's tasks for leaderboard
CREATE POLICY "Squad members can view teammate tasks" ON public.tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.squad_members sm1
    JOIN public.squad_members sm2 ON sm1.squad_id = sm2.squad_id
    WHERE sm1.user_id = auth.uid() AND sm2.user_id = tasks.user_id
  )
);

-- Achievements policies (public read)
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- User achievements policies
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can grant achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Squad members can view each other's achievements
CREATE POLICY "Squad members can view teammate achievements" ON public.user_achievements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.squad_members sm1
    JOIN public.squad_members sm2 ON sm1.squad_id = sm2.squad_id
    WHERE sm1.user_id = auth.uid() AND sm2.user_id = user_achievements.user_id
  )
);

-- Daily reports policies
CREATE POLICY "Users can view their own reports" ON public.daily_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own reports" ON public.daily_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reports" ON public.daily_reports FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, avatar_seed)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Adventurer'), 'hero_' || substr(NEW.id::text, 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto profile creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for squad-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, points_required, streak_required, tasks_required) VALUES
('First Quest', 'Complete your first quest', '⚔️', NULL, NULL, 1),
('Week Warrior', 'Maintain a 7-day streak', '🔥', NULL, 7, NULL),
('Century Club', 'Earn 100 points', '💯', 100, NULL, NULL),
('Grind Master', 'Complete 50 quests', '🏆', NULL, NULL, 50),
('Point Hunter', 'Earn 500 points', '💎', 500, NULL, NULL),
('Unstoppable', 'Maintain a 30-day streak', '⚡', NULL, 30, NULL),
('Legend', 'Earn 1000 points', '👑', 1000, NULL, NULL),
('Quest Machine', 'Complete 100 quests', '🎯', NULL, NULL, 100);

-- Create storage bucket for proof uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('proof-uploads', 'proof-uploads', false);

-- Storage policies for proof uploads
CREATE POLICY "Users can upload their own proofs" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'proof-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own proofs" ON storage.objects FOR SELECT
USING (bucket_id = 'proof-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own proofs" ON storage.objects FOR DELETE
USING (bucket_id = 'proof-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);