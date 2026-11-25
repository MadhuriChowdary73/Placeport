-- ==============================================================================
-- PlacePort: Complete Idempotent Supabase Database Setup
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
--
-- Covers:
--   1. Core & Legacy Tables (profiles, experiences, companies, round_types,
--      posts, rounds, dos_donts, resources, votes, saves, helpful_votes,
--      badges, user_badges, reports, notifications, valid_roll_numbers)
--   2. Indexes
--   3. Helper Functions & Triggers (is_admin, role/status protection,
--      vote/save/helpful counters, award_badges)
--   4. Views (posts_public with security_invoker, experiences_with_author)
--   5. Row Level Security (RLS) policies on every table
--   6. Seed Data (round_types, badges)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  roll_number TEXT,
  handle TEXT,
  full_name TEXT,
  display_mode TEXT NOT NULL DEFAULT 'name' CHECK (display_mode IN ('name', 'roll', 'full', 'masked', 'anon')),
  campus TEXT DEFAULT 'Amaravati',
  branch TEXT,
  batch INTEGER,
  batch_year INTEGER,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'blocked')),
  helped_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure columns exist if profiles was created by an older script
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS handle TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_mode TEXT NOT NULL DEFAULT 'name';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS campus TEXT DEFAULT 'Amaravati';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS batch INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS batch_year INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS helped_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS public.valid_roll_numbers (
  roll_number TEXT PRIMARY KEY,
  branch TEXT,
  batch INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.round_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

-- Current primary model used by /api/posts and experienceService
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
  display_mode TEXT NOT NULL DEFAULT 'name',
  author_name TEXT,
  author_roll_number TEXT,
  project_title TEXT,
  project_rating INTEGER CHECK (project_rating IS NULL OR (project_rating >= 1 AND project_rating <= 5)),
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS display_mode TEXT NOT NULL DEFAULT 'name';
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS author_roll_number TEXT;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS project_title TEXT;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS project_rating INTEGER;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;

-- Legacy relational model retained for /api/posts/[id], /api/companies/[slug]/summary, /api/admin/reports
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  year INTEGER NOT NULL,
  campus TEXT DEFAULT 'Amaravati',
  branch TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('selected', 'rejected', 'waitlisted', 'no_offer')),
  ctc_min NUMERIC,
  ctc_max NUMERIC,
  advice TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_mode TEXT DEFAULT 'name',
  vote_count INTEGER NOT NULL DEFAULT 0,
  save_count INTEGER NOT NULL DEFAULT 0,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  experience_id UUID REFERENCES public.experiences(id) ON DELETE CASCADE,
  round_type_id UUID REFERENCES public.round_types(id) ON DELETE SET NULL,
  round_type TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_min INTEGER,
  platform TEXT,
  questions TEXT,
  tips TEXT,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rounds ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE;
ALTER TABLE public.rounds ADD COLUMN IF NOT EXISTS experience_id UUID REFERENCES public.experiences(id) ON DELETE CASCADE;
ALTER TABLE public.rounds ADD COLUMN IF NOT EXISTS round_type_id UUID REFERENCES public.round_types(id) ON DELETE SET NULL;
ALTER TABLE public.rounds ADD COLUMN IF NOT EXISTS round_type TEXT;

CREATE TABLE IF NOT EXISTS public.dos_donts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('do', 'dont')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  note TEXT,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_vote_post_user UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  experience_id UUID REFERENCES public.experiences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_save_post_user UNIQUE (post_id, user_id)
);

ALTER TABLE public.saves ADD COLUMN IF NOT EXISTS post_id UUID;
ALTER TABLE public.saves ADD COLUMN IF NOT EXISTS experience_id UUID REFERENCES public.experiences(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_experience_vote UNIQUE (user_id, experience_id)
);

CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. INDEXES
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_roll_number ON public.profiles(roll_number);
CREATE INDEX IF NOT EXISTS idx_experiences_author_id ON public.experiences(author_id);
CREATE INDEX IF NOT EXISTS idx_experiences_created_at ON public.experiences(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_experiences_company_slug ON public.experiences(company_slug);
CREATE INDEX IF NOT EXISTS idx_experiences_campus ON public.experiences(campus);
CREATE INDEX IF NOT EXISTS idx_experiences_branch ON public.experiences(branch);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_company_id ON public.posts(company_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rounds_post_id ON public.rounds(post_id, order_index);
CREATE INDEX IF NOT EXISTS idx_rounds_experience_id ON public.rounds(experience_id, order_index);
CREATE INDEX IF NOT EXISTS idx_dos_donts_post_id ON public.dos_donts(post_id);
CREATE INDEX IF NOT EXISTS idx_resources_post_id ON public.resources(post_id);
CREATE INDEX IF NOT EXISTS idx_votes_post_user ON public.votes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_saves_post_user ON public.saves(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_helpful_votes_user_exp ON public.helpful_votes(user_id, experience_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Prevent authenticated users from changing their own role or status
CREATE OR REPLACE FUNCTION public.prevent_profile_role_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Forbidden: role can only be changed via service_role';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Forbidden: status can only be changed via service_role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_status_change ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_status_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_status_change();

-- Helpful votes trigger on experiences
CREATE OR REPLACE FUNCTION public.handle_helpful_vote_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.experiences
    SET helpful_count = COALESCE(helpful_count, 0) + 1
    WHERE id = NEW.experience_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.experiences
    SET helpful_count = GREATEST(COALESCE(helpful_count, 0) - 1, 0)
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

-- Votes trigger on posts & experiences & profiles.helped_count
CREATE OR REPLACE FUNCTION public.handle_votes_change()
RETURNS TRIGGER AS $$
DECLARE
  v_author_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET vote_count = vote_count + 1 WHERE id = NEW.post_id RETURNING author_id INTO v_author_id;
    IF v_author_id IS NULL THEN
      UPDATE public.experiences SET helpful_count = COALESCE(helpful_count, 0) + 1 WHERE id = NEW.post_id RETURNING author_id INTO v_author_id;
    END IF;
    IF v_author_id IS NOT NULL THEN
      UPDATE public.profiles SET helped_count = helped_count + 1 WHERE id = v_author_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.post_id RETURNING author_id INTO v_author_id;
    IF v_author_id IS NULL THEN
      UPDATE public.experiences SET helpful_count = GREATEST(COALESCE(helpful_count, 0) - 1, 0) WHERE id = OLD.post_id RETURNING author_id INTO v_author_id;
    END IF;
    IF v_author_id IS NOT NULL THEN
      UPDATE public.profiles SET helped_count = GREATEST(helped_count - 1, 0) WHERE id = v_author_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_votes_table_change ON public.votes;
CREATE TRIGGER on_votes_table_change
  AFTER INSERT OR DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_votes_change();

-- Saves counter trigger on posts
CREATE OR REPLACE FUNCTION public.handle_saves_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET save_count = save_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET save_count = GREATEST(save_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_saves_table_change ON public.saves;
CREATE TRIGGER on_saves_table_change
  AFTER INSERT OR DELETE ON public.saves
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_saves_change();

-- Badge awarding RPC called by /api/votes
CREATE OR REPLACE FUNCTION public.award_badges(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_post_count INTEGER := 0;
  v_vote_total INTEGER := 0;
BEGIN
  SELECT
    (SELECT COUNT(*) FROM public.experiences WHERE author_id = p_user_id)
    + (SELECT COUNT(*) FROM public.posts WHERE author_id = p_user_id),
    COALESCE((SELECT helped_count FROM public.profiles WHERE id = p_user_id), 0)
  INTO v_post_count, v_vote_total;

  IF v_post_count >= 1 THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT p_user_id, id FROM public.badges WHERE slug = 'first_post'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_vote_total >= 10 THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT p_user_id, id FROM public.badges WHERE slug = 'helpful_10'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_post_count >= 3 THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT p_user_id, id FROM public.badges WHERE slug = 'top_mentor'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 4. VIEWS
-- ------------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.posts_public
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.company_id,
  c.name AS company_name,
  c.slug AS company_slug,
  p.role,
  p.year,
  p.campus,
  p.branch,
  p.outcome,
  p.ctc_min,
  p.ctc_max,
  p.advice,
  p.vote_count,
  p.save_count,
  p.created_at,
  CASE
    WHEN p.display_mode = 'roll' THEN COALESCE(pr.roll_number, 'Amrita Student')
    ELSE COALESCE(pr.full_name, pr.roll_number, 'Amrita Student')
  END AS display_name,
  COALESCE(p.display_mode, 'name') AS display_mode,
  ARRAY(
    SELECT ub.badge_id::text
    FROM public.user_badges ub
    WHERE ub.user_id = p.author_id
  ) AS author_badge_ids
FROM public.posts p
JOIN public.companies c ON p.company_id = c.id
JOIN public.profiles pr ON p.author_id = pr.id
WHERE p.is_published = true;

CREATE OR REPLACE VIEW public.experiences_with_author
WITH (security_invoker = true) AS
SELECT
  e.*,
  p.roll_number AS profile_roll_number,
  p.full_name AS profile_full_name
FROM public.experiences e
JOIN public.profiles p ON e.author_id = p.id;

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valid_roll_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dos_donts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND role = 'student'
    AND status = 'approved'
  );

DROP POLICY IF EXISTS "Users can update only their own profile" ON public.profiles;
CREATE POLICY "Users can update only their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- VALID_ROLL_NUMBERS (readable by authenticated/service, writable only via service_role)
DROP POLICY IF EXISTS "Valid roll numbers readable by authenticated" ON public.valid_roll_numbers;
CREATE POLICY "Valid roll numbers readable by authenticated"
  ON public.valid_roll_numbers FOR SELECT
  TO authenticated
  USING (true);

-- COMPANIES (public read, authenticated insert)
DROP POLICY IF EXISTS "Companies readable by all" ON public.companies;
CREATE POLICY "Companies readable by all"
  ON public.companies FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert companies" ON public.companies;
CREATE POLICY "Authenticated users can insert companies"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ROUND_TYPES (public read)
DROP POLICY IF EXISTS "Round types readable by all" ON public.round_types;
CREATE POLICY "Round types readable by all"
  ON public.round_types FOR SELECT
  USING (true);

-- EXPERIENCES (public read for published, admins read all, owner insert/update/delete, admin update/delete)
DROP POLICY IF EXISTS "Experiences viewable by public when published" ON public.experiences;
DROP POLICY IF EXISTS "Experiences viewable by authenticated users" ON public.experiences;
CREATE POLICY "Experiences viewable by public when published"
  ON public.experiences FOR SELECT
  USING (is_published = true OR auth.uid() = author_id OR public.is_admin());

DROP POLICY IF EXISTS "Amrita students can insert their own experiences" ON public.experiences;
CREATE POLICY "Amrita students can insert their own experiences"
  ON public.experiences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update their own experiences" ON public.experiences;
CREATE POLICY "Users can update their own experiences"
  ON public.experiences FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id OR public.is_admin())
  WITH CHECK (auth.uid() = author_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete their own experiences" ON public.experiences;
CREATE POLICY "Users can delete their own experiences"
  ON public.experiences FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id OR public.is_admin());

-- POSTS (public read for published, admins read all, owner/admin write)
DROP POLICY IF EXISTS "Posts viewable when published" ON public.posts;
CREATE POLICY "Posts viewable when published"
  ON public.posts FOR SELECT
  USING (is_published = true OR auth.uid() = author_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own posts" ON public.posts;
CREATE POLICY "Users can insert own posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id OR public.is_admin())
  WITH CHECK (auth.uid() = author_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id OR public.is_admin());

-- ROUNDS (public read, owner write)
DROP POLICY IF EXISTS "Rounds readable by all" ON public.rounds;
CREATE POLICY "Rounds readable by all"
  ON public.rounds FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Rounds writable by post/experience owner" ON public.rounds;
CREATE POLICY "Rounds writable by post/experience owner"
  ON public.rounds FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.experiences e WHERE e.id = experience_id AND e.author_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.experiences e WHERE e.id = experience_id AND e.author_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid())
    OR public.is_admin()
  );

-- DOS_DONTS (public read, owner write)
DROP POLICY IF EXISTS "DosDonts readable by all" ON public.dos_donts;
CREATE POLICY "DosDonts readable by all"
  ON public.dos_donts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "DosDonts writable by post owner" ON public.dos_donts;
CREATE POLICY "DosDonts writable by post owner"
  ON public.dos_donts FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid())
    OR public.is_admin()
  );

-- RESOURCES (public read, owner write)
DROP POLICY IF EXISTS "Resources readable by all" ON public.resources;
CREATE POLICY "Resources readable by all"
  ON public.resources FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Resources writable by post owner" ON public.resources;
CREATE POLICY "Resources writable by post owner"
  ON public.resources FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid())
    OR public.is_admin()
  );

-- VOTES (public read, owner insert/delete)
DROP POLICY IF EXISTS "Votes readable by authenticated" ON public.votes;
CREATE POLICY "Votes readable by authenticated"
  ON public.votes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own votes" ON public.votes;
CREATE POLICY "Users can insert own votes"
  ON public.votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own votes" ON public.votes;
CREATE POLICY "Users can delete own votes"
  ON public.votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- SAVES (private to owner)
DROP POLICY IF EXISTS "Users can view own saves" ON public.saves;
CREATE POLICY "Users can view own saves"
  ON public.saves FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saves" ON public.saves;
CREATE POLICY "Users can insert own saves"
  ON public.saves FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saves" ON public.saves;
CREATE POLICY "Users can delete own saves"
  ON public.saves FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- HELPFUL_VOTES (readable by authenticated, owner insert/delete)
DROP POLICY IF EXISTS "Helpful votes readable by authenticated" ON public.helpful_votes;
CREATE POLICY "Helpful votes readable by authenticated"
  ON public.helpful_votes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own helpful votes" ON public.helpful_votes;
CREATE POLICY "Users can insert own helpful votes"
  ON public.helpful_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own helpful votes" ON public.helpful_votes;
CREATE POLICY "Users can delete own helpful votes"
  ON public.helpful_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- BADGES & USER_BADGES (public read; written only via SECURITY DEFINER / service_role)
DROP POLICY IF EXISTS "Badges readable by all" ON public.badges;
CREATE POLICY "Badges readable by all"
  ON public.badges FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "User badges readable by authenticated" ON public.user_badges;
CREATE POLICY "User badges readable by authenticated"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (true);

-- REPORTS (private to reporter + admins)
DROP POLICY IF EXISTS "Users can insert own reports" ON public.reports;
CREATE POLICY "Users can insert own reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Reports viewable by reporter or admin" ON public.reports;
CREATE POLICY "Reports viewable by reporter or admin"
  ON public.reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id OR public.is_admin());

DROP POLICY IF EXISTS "Reports updatable by admin only" ON public.reports;
CREATE POLICY "Reports updatable by admin only"
  ON public.reports FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- NOTIFICATIONS (private to owner)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. SEED DATA (idempotent)
-- ------------------------------------------------------------------------------

INSERT INTO public.round_types (name) VALUES
  ('Online Assessment'),
  ('Group Discussion'),
  ('Technical Interview 1'),
  ('Technical Interview 2'),
  ('System Design'),
  ('Managerial Round'),
  ('HR Interview')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.badges (slug, name, description, icon) VALUES
  ('first_post', 'First Contributor', 'Shared your first placement experience', '✍️'),
  ('helpful_10', 'Helpful Peer', 'Received 10+ helpful votes', '💡'),
  ('top_mentor', 'Top Mentor', 'Shared 3+ interview experiences with comprehensive tips', '🏆')
ON CONFLICT (slug) DO NOTHING;
