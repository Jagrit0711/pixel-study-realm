-- Fix squads SELECT policy so creators can read the squad immediately after insert (PostgREST needs this for return=representation)
DROP POLICY IF EXISTS "Anyone can view squads they are in" ON public.squads;

CREATE POLICY "Users can view squads they created or are members of"
ON public.squads
FOR SELECT
USING (
  auth.uid() = created_by
  OR EXISTS (
    SELECT 1
    FROM public.squad_members
    WHERE squad_members.squad_id = squads.id
      AND squad_members.user_id = auth.uid()
  )
);

-- Allow joining by code via a security definer helper (avoids making squads table publicly readable by code)
CREATE OR REPLACE FUNCTION public.get_squad_by_code(squad_code text)
RETURNS TABLE (id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.name
  FROM public.squads s
  WHERE s.code = upper(squad_code)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_squad_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_squad_by_code(text) TO authenticated;