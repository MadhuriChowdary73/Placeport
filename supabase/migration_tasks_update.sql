-- DEPRECATED: Replaced by supabase/complete_setup.sql. Do not run directly.
-- ==============================================================================
-- PlacePort: Migration for Tasks 2, 3, 4
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Ensure experiences table has optional/nullable columns for project, identity & visibility
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS display_mode TEXT DEFAULT 'roll';
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS author_roll_number TEXT;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS project_title TEXT;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS project_rating INTEGER;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- 2. Ensure profiles table has full_name and display_mode
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_mode TEXT DEFAULT 'roll';

-- 3. Allow Admins to update experiences (e.g. toggling is_published Hide/Unhide)
DROP POLICY IF EXISTS "Admins can update experience publish status" ON public.experiences;
CREATE POLICY "Admins can update experience publish status"
  ON public.experiences FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'madhurichowdary2007@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
    OR auth.uid() = author_id
  );
