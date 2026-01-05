-- Fix infinite recursion in RLS policies for squad_members by using a SECURITY DEFINER helper

-- Helper: is the current user a member of a squad?
CREATE OR REPLACE FUNCTION public.is_in_same_squad(target_squad_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.squad_members sm
    WHERE sm.squad_id = target_squad_id
      AND sm.user_id = auth.uid()
  );
$$;

-- Ensure RLS is enabled
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;

-- Replace the recursive SELECT policy
DROP POLICY IF EXISTS "Members can view squad members" ON public.squad_members;
CREATE POLICY "Members can view squad members"
ON public.squad_members
FOR SELECT
USING (public.is_in_same_squad(squad_id));
