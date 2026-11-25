-- DEPRECATED: Replaced by supabase/complete_setup.sql. Do not run directly.
-- ==============================================================================
-- PlacePort: Profiles Table & Row Level Security (RLS) Policies
-- Enforces:
-- 1. Users can only insert posts as themselves (author_id = auth.uid())
-- 2. Only users with a verified Amrita email (@av.students.amrita.edu) can insert posts
-- 3. Profiles table stores verified roll number derived from email
-- ==============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  roll_number TEXT, -- Optional / nullable so existing records don't fail, derived on first login
  display_mode TEXT DEFAULT 'masked' CHECK (display_mode IN ('full', 'masked', 'anon')),
  handle TEXT,
  full_name TEXT,
  campus TEXT DEFAULT 'Amaravati',
  branch TEXT,
  batch INTEGER,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  helped_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone authenticated can read profiles (for author handles)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Profiles: Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

-- Profiles: Users can only update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR auth.uid() = user_id)
  WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

-- 2. Posts Table RLS Policies
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Posts: Publicly readable for all published experiences
CREATE POLICY "Published posts are viewable by authenticated users"
  ON public.posts
  FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Posts: Insert policy
-- A user can only insert an experience as themselves (author_id = auth.uid())
-- AND must have a verified Amrita email (ending with @av.students.amrita.edu)
CREATE POLICY "Amrita students can insert experiences as themselves"
  ON public.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND (auth.jwt() ->> 'email') LIKE '%@av.students.amrita.edu'
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE (profiles.id = auth.uid() OR profiles.user_id = auth.uid())
          AND profiles.roll_number IS NOT NULL
      )
    )
  );

-- Posts: Users can only update their own experiences
CREATE POLICY "Users can update their own posts"
  ON public.posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Posts: Users can only delete their own experiences
CREATE POLICY "Users can delete their own posts"
  ON public.posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- 3. Rounds Table RLS
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rounds are viewable by authenticated users"
  ON public.rounds FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert rounds for their own posts"
  ON public.rounds FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = rounds.post_id AND posts.author_id = auth.uid()
    )
  );

-- 4. Do's and Don'ts Table RLS
ALTER TABLE public.dos_donts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dos and donts are viewable by authenticated users"
  ON public.dos_donts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert dos and donts for their own posts"
  ON public.dos_donts FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = dos_donts.post_id AND posts.author_id = auth.uid()
    )
  );

-- 5. Resources Table RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resources are viewable by authenticated users"
  ON public.resources FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert resources for their own posts"
  ON public.resources FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = resources.post_id AND posts.author_id = auth.uid()
    )
  );
