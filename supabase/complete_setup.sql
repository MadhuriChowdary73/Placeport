-- ==============================================================================
-- PlacePort: Complete Supabase Database Setup
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  roll_number TEXT NOT NULL,
  branch TEXT,
  batch_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create experiences table
CREATE TABLE IF NOT EXISTS public.experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_slug TEXT NOT NULL,
  role TEXT NOT NULL,
  year INTEGER NOT NULL,
  campus TEXT NOT NULL DEFAULT 'Amaravati',
  branch TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('selected', 'rejected', 'waitlisted', 'no_offer')),
  ctc_min NUMERIC,
  ctc_max NUMERIC,
  overall_experience TEXT,
  preparation_tips TEXT,
  advice TEXT,
  dos TEXT[] DEFAULT '{}'::text[],
  donts TEXT[] DEFAULT '{}'::text[],
  resources JSONB DEFAULT '[]'::jsonb,
  rounds JSONB DEFAULT '[]'::jsonb,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create rounds table (for normalized round references if needed)
CREATE TABLE IF NOT EXISTS public.rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  round_type TEXT NOT NULL,
  duration_min INTEGER,
  platform TEXT,
  questions TEXT,
  tips TEXT,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create saves table (bookmarks)
CREATE TABLE IF NOT EXISTS public.saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_experience_save UNIQUE (user_id, experience_id)
);

-- 5. Create helpful_votes table
CREATE TABLE IF NOT EXISTS public.helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_experience_vote UNIQUE (user_id, experience_id)
);

-- 6. Trigger to automatically increment/decrement helpful_count on experiences
CREATE OR REPLACE FUNCTION public.handle_helpful_vote_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.experiences
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.experience_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.experiences
    SET helpful_count = GREATEST(helpful_count - 1, 0)
    WHERE id = OLD.experience_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vote_change ON public.helpful_votes;
CREATE TRIGGER on_vote_change
  AFTER INSERT OR DELETE ON public.helpful_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_helpful_vote_change();

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_experiences_author_id ON public.experiences(author_id);
CREATE INDEX IF NOT EXISTS idx_experiences_created_at ON public.experiences(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_experiences_company_slug ON public.experiences(company_slug);
CREATE INDEX IF NOT EXISTS idx_experiences_campus ON public.experiences(campus);
CREATE INDEX IF NOT EXISTS idx_experiences_branch ON public.experiences(branch);
CREATE INDEX IF NOT EXISTS idx_rounds_experience_id ON public.rounds(experience_id, order_index);
CREATE INDEX IF NOT EXISTS idx_saves_user_exp ON public.saves(user_id, experience_id);
CREATE INDEX IF NOT EXISTS idx_helpful_votes_user_exp ON public.helpful_votes(user_id, experience_id);

-- 8. View: experiences with author roll number
CREATE OR REPLACE VIEW public.experiences_with_author AS
SELECT
  e.*,
  p.roll_number AS author_roll_number,
  p.email AS author_email
FROM public.experiences e
JOIN public.profiles p ON e.author_id = p.id;

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpful_votes ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES RLS
-- Readable by all signed-in users, writable only by owner
-- ------------------------------------------------------------------------------
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND (auth.jwt() ->> 'email') LIKE '%@av.students.amrita.edu'
  );

CREATE POLICY "Users can update only their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- EXPERIENCES RLS
-- Readable by all signed-in users
-- Insert/Update/Delete only by owner with Amrita email
-- ------------------------------------------------------------------------------
CREATE POLICY "Experiences viewable by authenticated users"
  ON public.experiences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Amrita students can insert their own experiences"
  ON public.experiences FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
  );

CREATE POLICY "Users can update their own experiences"
  ON public.experiences FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own experiences"
  ON public.experiences FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- ------------------------------------------------------------------------------
-- ROUNDS RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Rounds viewable by authenticated users"
  ON public.rounds FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert rounds for their own experiences"
  ON public.rounds FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.experiences
      WHERE experiences.id = rounds.experience_id
        AND experiences.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rounds for their own experiences"
  ON public.rounds FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.experiences
      WHERE experiences.id = rounds.experience_id
        AND experiences.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete rounds for their own experiences"
  ON public.rounds FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.experiences
      WHERE experiences.id = rounds.experience_id
        AND experiences.author_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- SAVES RLS
-- Users can only see and manage their own bookmarks
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own saves"
  ON public.saves FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saves"
  ON public.saves FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (auth.jwt() ->> 'email') LIKE '%@av.students.amrita.edu'
  );

CREATE POLICY "Users can delete their own saves"
  ON public.saves FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- HELPFUL VOTES RLS
-- Votes viewable by all signed in; user can insert/delete own vote
-- ------------------------------------------------------------------------------
CREATE POLICY "Helpful votes viewable by authenticated users"
  ON public.helpful_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can cast helpful vote as themselves"
  ON public.helpful_votes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (auth.jwt() ->> 'email') LIKE '%@av.students.amrita.edu'
  );

CREATE POLICY "Users can remove their helpful vote"
  ON public.helpful_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
