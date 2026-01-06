-- Drop the existing policy that's missing WITH CHECK
DROP POLICY IF EXISTS "Squad members can update tasks for proof approval" ON public.tasks;

-- Recreate with proper WITH CHECK clause
CREATE POLICY "Squad members can update tasks for proof approval"
ON public.tasks
FOR UPDATE
USING (
  status = 'pending_review'
  AND EXISTS (
    SELECT 1 FROM public.squad_members sm1
    JOIN public.squad_members sm2 ON sm1.squad_id = sm2.squad_id
    WHERE sm1.user_id = auth.uid()
      AND sm2.user_id = tasks.user_id
      AND sm1.user_id <> tasks.user_id
  )
)
WITH CHECK (
  -- Allow updating to completed status only
  status = 'completed'
  AND EXISTS (
    SELECT 1 FROM public.squad_members sm1
    JOIN public.squad_members sm2 ON sm1.squad_id = sm2.squad_id
    WHERE sm1.user_id = auth.uid()
      AND sm2.user_id = tasks.user_id
      AND sm1.user_id <> tasks.user_id
  )
);