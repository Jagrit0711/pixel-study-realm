-- Make proof-uploads bucket public so squad members can view proofs
UPDATE storage.buckets 
SET public = true 
WHERE id = 'proof-uploads';

-- Add storage policies for proof-uploads bucket (if they don't exist)
-- Allow authenticated users to upload to their own folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload their own proofs'
  ) THEN
    CREATE POLICY "Users can upload their own proofs"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'proof-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Allow authenticated users to view all proofs (for squad review)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view proofs'
  ) THEN
    CREATE POLICY "Anyone can view proofs"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'proof-uploads');
  END IF;
END $$;

-- Allow users to delete their own proofs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own proofs'
  ) THEN
    CREATE POLICY "Users can delete their own proofs"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'proof-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Add RLS policy for squad members to update tasks they're reviewing (for auto-approve)
CREATE POLICY "Squad members can update tasks for proof approval"
ON public.tasks
FOR UPDATE
USING (
  status = 'pending_review' AND
  EXISTS (
    SELECT 1 FROM squad_members sm1
    JOIN squad_members sm2 ON sm1.squad_id = sm2.squad_id
    WHERE sm1.user_id = auth.uid() 
    AND sm2.user_id = tasks.user_id
    AND sm1.user_id <> tasks.user_id
  )
);