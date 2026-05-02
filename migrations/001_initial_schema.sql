-- ============================================================
-- AxM CommonGround: Initial Schema Migration
-- Version: 001
-- Supersedes: 001_core_tables.sql, 002_feature_tables.sql
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE pair_status AS ENUM ('PENDING', 'ACTIVE', 'DISSOLVED');
CREATE TYPE message_type AS ENUM ('user', 'assistant', 'system', 'media');
CREATE TYPE message_room AS ENUM ('solo', 'couple');
CREATE TYPE media_type AS ENUM ('image', 'video', 'audio');
CREATE TYPE mission_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE module_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');
CREATE TYPE exercise_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE rank_tier AS ENUM ('SPARK', 'FLAME', 'CALIBRATOR', 'INFERNO', 'SOVEREIGN');
CREATE TYPE rank_theme AS ENUM ('PHARAOH', 'SAMURAI', 'CELESTIAL', 'SHADOW');
CREATE TYPE relational_state AS ENUM ('ALIGNED', 'DORMANT', 'MISALIGNED', 'CAPACITY_BLOCKED', 'TRUST_FRACTURED');
CREATE TYPE signal_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE measurement_input_type AS ENUM ('message_pattern', 'manual_checkin', 'mission_completion', 'exercise_response', 'chat_sentiment');
CREATE TYPE communication_style AS ENUM ('direct', 'gentle', 'collaborative', 'expressive');
CREATE TYPE art_style AS ENUM ('ethereal', 'bold', 'classic', 'fantasy');
CREATE TYPE list_type AS ENUM ('bucket', 'playlist', 'movies', 'goals');
CREATE TYPE vault_memory_type AS ENUM ('scene', 'photo', 'milestone');
CREATE TYPE game_type AS ENUM ('two_truths_one_lie', 'rate_your_day', 'would_you_rather', 'finish_the_sentence');
CREATE TYPE love_language AS ENUM ('words_of_affirmation', 'acts_of_service', 'receiving_gifts', 'quality_time', 'physical_touch');

-- ============================================================
-- UTILITY FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CORE TABLES
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  avatar_initials TEXT GENERATED ALWAYS AS (UPPER(LEFT(COALESCE(display_name, email), 2))) STORED,
  gender TEXT,
  partner_gender TEXT,
  ethnicity TEXT,
  birth_date DATE,
  birth_time TIME,
  birth_location TEXT,
  zodiac TEXT,
  communication_style communication_style DEFAULT 'direct',
  art_style art_style DEFAULT 'bold',
  relationship_start_date DATE,
  deeply_unlocked BOOLEAN DEFAULT FALSE,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  favorites JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Auto-create profile row when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TABLE pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL DEFAULT UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6)),
  status pair_status DEFAULT 'PENDING',
  member_a_uid UUID REFERENCES profiles(id) ON DELETE SET NULL,
  member_b_uid UUID REFERENCES profiles(id) ON DELETE SET NULL,
  relationship_start_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER pairs_updated_at
  BEFORE UPDATE ON pairs
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TABLE pair_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('member_a', 'member_b')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (pair_id, user_id)
);

-- Activate pair once both members have joined
CREATE OR REPLACE FUNCTION activate_pair_on_join()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pairs
  SET status = 'ACTIVE', updated_at = NOW()
  WHERE id = NEW.pair_id
    AND member_a_uid IS NOT NULL
    AND member_b_uid IS NOT NULL
    AND status = 'PENDING';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pair_activation
  AFTER INSERT ON pair_members
  FOR EACH ROW EXECUTE FUNCTION activate_pair_on_join();

-- ============================================================
-- MESSAGING
-- ============================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID REFERENCES pairs(id) ON DELETE CASCADE,
  sender_uid UUID REFERENCES profiles(id) ON DELETE SET NULL,
  text TEXT,
  type message_type DEFAULT 'user',
  room_type message_room DEFAULT 'couple',
  media_url TEXT,
  media_type media_type,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX messages_pair_id_idx ON messages(pair_id);
CREATE INDEX messages_sender_uid_idx ON messages(sender_uid);
CREATE INDEX messages_created_at_idx ON messages(created_at DESC);

-- ============================================================
-- BONDING
-- ============================================================

CREATE TABLE daily_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  answers JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (pair_id, date)
);

CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL,
  status mission_status DEFAULT 'NOT_STARTED',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER missions_updated_at
  BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TABLE mission_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL,
  xp_awarded INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- XP & PROGRESSION
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_rank(xp INTEGER)
RETURNS rank_tier AS $$
BEGIN
  IF xp >= 15000 THEN RETURN 'SOVEREIGN';
  ELSIF xp >= 5000 THEN RETURN 'INFERNO';
  ELSIF xp >= 2000 THEN RETURN 'CALIBRATOR';
  ELSIF xp >= 500 THEN RETURN 'FLAME';
  ELSE RETURN 'SPARK';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE TABLE user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0 CHECK (total_xp >= 0),
  rank rank_tier DEFAULT 'SPARK',
  rank_theme rank_theme DEFAULT 'SHADOW',
  streak INTEGER DEFAULT 0 CHECK (streak >= 0),
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER user_xp_updated_at
  BEFORE UPDATE ON user_xp
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE OR REPLACE FUNCTION update_rank_on_xp_change()
RETURNS TRIGGER AS $$
BEGIN
  NEW.rank = calculate_rank(NEW.total_xp);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_rank_update
  BEFORE UPDATE OF total_xp ON user_xp
  FOR EACH ROW EXECUTE FUNCTION update_rank_on_xp_change();

-- Auto-seed user_xp row when profile is created
CREATE OR REPLACE FUNCTION create_user_xp_on_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_xp (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER init_user_xp
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_user_xp_on_profile();

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  badge_url TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

-- ============================================================
-- GAMES & EXERCISES
-- ============================================================

CREATE TABLE spark_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  game_type game_type NOT NULL,
  score INTEGER DEFAULT 0,
  players JSONB DEFAULT '[]'::jsonb,
  game_data JSONB DEFAULT '{}'::jsonb,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trust_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  status exercise_status DEFAULT 'NOT_STARTED',
  responses JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trust_exercises_updated_at
  BEFORE UPDATE ON trust_exercises
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TABLE growth_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  status module_status DEFAULT 'NOT_STARTED',
  current_day INTEGER DEFAULT 0,
  day_completions JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER growth_modules_updated_at
  BEFORE UPDATE ON growth_modules
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- VAULT & MEMORIES
-- ============================================================

CREATE TABLE vault_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  type vault_memory_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  date_created DATE DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER vault_memories_updated_at
  BEFORE UPDATE ON vault_memories
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TABLE vault_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  title TEXT,
  date_achieved DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PERSONAL
-- ============================================================

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  emotion TEXT,
  analysis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pair_id UUID REFERENCES pairs(id) ON DELETE CASCADE,
  type list_type NOT NULL,
  title TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- ASTROLOGY & LOVE LANGUAGES
-- ============================================================

CREATE TABLE astrology_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  zodiac_sign TEXT NOT NULL,
  horoscope TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER astrology_profiles_updated_at
  BEFORE UPDATE ON astrology_profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TABLE love_language_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  language_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  top_3 love_language[] DEFAULT ARRAY[]::love_language[],
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER love_language_results_updated_at
  BEFORE UPDATE ON love_language_results
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- RELATIONAL ENGINE
-- ============================================================

CREATE TABLE pair_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  availability signal_level DEFAULT 'MEDIUM',
  alignment signal_level DEFAULT 'MEDIUM',
  activation signal_level DEFAULT 'MEDIUM',
  trust signal_level DEFAULT 'MEDIUM',
  confidence INTEGER DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  measured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX pair_measurements_pair_id_idx ON pair_measurements(pair_id);
CREATE INDEX pair_measurements_measured_at_idx ON pair_measurements(measured_at DESC);

CREATE TABLE pair_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  current_state relational_state NOT NULL,
  previous_state relational_state,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX pair_states_pair_id_idx ON pair_states(pair_id);

CREATE TABLE measurement_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  input_type measurement_input_type NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX measurement_inputs_pair_id_idx ON measurement_inputs(pair_id);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX profiles_email_idx ON profiles(email);
CREATE INDEX pairs_code_idx ON pairs(code);
CREATE INDEX pair_members_user_id_idx ON pair_members(user_id);
CREATE INDEX daily_questions_pair_date_idx ON daily_questions(pair_id, date DESC);
CREATE INDEX journal_entries_user_id_idx ON journal_entries(user_id);
CREATE INDEX achievements_user_id_idx ON achievements(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pair_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE spark_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE astrology_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE love_language_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE pair_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pair_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_inputs ENABLE ROW LEVEL SECURITY;

-- Helper: check if the calling user is a member of a given pair.
-- SECURITY DEFINER so it can read pair_members without a recursive RLS check.
CREATE OR REPLACE FUNCTION is_pair_member(p_pair_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM pair_members
    WHERE pair_id = p_pair_id
      AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------

-- Own profile: full CRUD
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());

-- Partner can read your profile when paired together
CREATE POLICY "profiles_select_partner" ON profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM pair_members pm1
    JOIN pair_members pm2 ON pm1.pair_id = pm2.pair_id
    WHERE pm1.user_id = auth.uid()
      AND pm2.user_id = profiles.id
  )
);

-- ------------------------------------------------------------
-- pairs
-- ------------------------------------------------------------

CREATE POLICY "pairs_select_member" ON pairs FOR SELECT USING (is_pair_member(id));
CREATE POLICY "pairs_insert_any"    ON pairs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "pairs_update_member" ON pairs FOR UPDATE USING (is_pair_member(id));

-- ------------------------------------------------------------
-- pair_members
-- ------------------------------------------------------------

CREATE POLICY "pair_members_select"      ON pair_members FOR SELECT USING (is_pair_member(pair_id));
CREATE POLICY "pair_members_insert_own"  ON pair_members FOR INSERT WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------
-- messages: couple room visible to both; solo room to sender only
-- ------------------------------------------------------------

CREATE POLICY "messages_select_couple" ON messages FOR SELECT USING (
  is_pair_member(pair_id) AND room_type = 'couple'
);
CREATE POLICY "messages_select_solo" ON messages FOR SELECT USING (
  sender_uid = auth.uid() AND room_type = 'solo'
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  sender_uid = auth.uid() AND is_pair_member(pair_id)
);

-- ------------------------------------------------------------
-- pair-scoped tables (any pair member gets full access)
-- ------------------------------------------------------------

CREATE POLICY "daily_questions_pair"    ON daily_questions    FOR ALL USING (is_pair_member(pair_id));
CREATE POLICY "missions_pair"           ON missions           FOR ALL USING (is_pair_member(pair_id));
CREATE POLICY "mission_completions_pair" ON mission_completions FOR ALL USING (is_pair_member(pair_id));
CREATE POLICY "spark_games_pair"        ON spark_games        FOR ALL USING (is_pair_member(pair_id));
CREATE POLICY "trust_exercises_pair"    ON trust_exercises    FOR ALL USING (is_pair_member(pair_id));
CREATE POLICY "growth_modules_pair"     ON growth_modules     FOR ALL USING (is_pair_member(pair_id));
CREATE POLICY "vault_memories_pair"     ON vault_memories     FOR ALL USING (is_pair_member(pair_id));
CREATE POLICY "vault_milestones_pair"   ON vault_milestones   FOR ALL USING (is_pair_member(pair_id));
CREATE POLICY "calendar_events_pair"    ON calendar_events    FOR ALL USING (is_pair_member(pair_id));
CREATE POLICY "pair_measurements_pair"  ON pair_measurements  FOR ALL USING (is_pair_member(pair_id));
CREATE POLICY "pair_states_pair"        ON pair_states        FOR ALL USING (is_pair_member(pair_id));
CREATE POLICY "measurement_inputs_pair" ON measurement_inputs FOR ALL USING (is_pair_member(pair_id));

-- ------------------------------------------------------------
-- user-scoped tables (own data only)
-- ------------------------------------------------------------

CREATE POLICY "user_xp_own"                 ON user_xp                 FOR ALL USING (user_id = auth.uid());
CREATE POLICY "achievements_own"            ON achievements            FOR ALL USING (user_id = auth.uid());
CREATE POLICY "journal_entries_own"         ON journal_entries         FOR ALL USING (user_id = auth.uid());
CREATE POLICY "astrology_profiles_own"      ON astrology_profiles      FOR ALL USING (user_id = auth.uid());
CREATE POLICY "love_language_results_own"   ON love_language_results   FOR ALL USING (user_id = auth.uid());

-- ------------------------------------------------------------
-- lists: personal lists owned by user; shared lists visible to pair
-- ------------------------------------------------------------

-- Own lists: full access
CREATE POLICY "lists_own" ON lists FOR ALL USING (user_id = auth.uid());

-- Pair-shared lists: members can read, insert, update, delete
CREATE POLICY "lists_pair_select" ON lists FOR SELECT
  USING (pair_id IS NOT NULL AND is_pair_member(pair_id));

CREATE POLICY "lists_pair_insert" ON lists FOR INSERT
  WITH CHECK (pair_id IS NOT NULL AND is_pair_member(pair_id));

CREATE POLICY "lists_pair_update" ON lists FOR UPDATE
  USING (pair_id IS NOT NULL AND is_pair_member(pair_id));

CREATE POLICY "lists_pair_delete" ON lists FOR DELETE
  USING (pair_id IS NOT NULL AND is_pair_member(pair_id));
