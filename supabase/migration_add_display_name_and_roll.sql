-- DEPRECATED: Replaced by supabase/complete_setup.sql. Do not run directly.
-- Run this in the Supabase SQL Editor if you want to store author_name and display_mode directly on the experiences table
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS author_roll_number TEXT;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS display_mode TEXT DEFAULT 'masked';

-- Ensure profiles table has full_name and display_mode
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_mode TEXT DEFAULT 'masked';

-- Ensure RLS allows all signed-in users (e.g. via Google OAuth) to insert experiences
DROP POLICY IF EXISTS "Amrita students can insert their own experiences" ON public.experiences;
CREATE POLICY "Amrita students can insert their own experiences"
  ON public.experiences FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
  );
