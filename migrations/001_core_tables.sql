-- Phase 1: Core Tables (Locked)
-- This migration creates the complete AxM relational model

-- 1. Profiles (users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  app_mode VARCHAR(20) DEFAULT 'common' CHECK (app_mode IN ('common', 'deeply', 'both')),
  zodiac_sign VARCHAR(20),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Pairs (couples)
CREATE TABLE pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_code VARCHAR(6) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  relationship_start_date DATE,
  relational_state VARCHAR(50) DEFAULT 'UNKNOWN' CHECK (
    relational_state IN ('CAPACITY_BLOCKED', 'MISALIGNED', 'DORMANT', 'TRUST_FRACTURED', 'ALIGNED', 'UNKNOWN')
  ),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Pair Members (join table)
CREATE TABLE pair_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) CHECK (role IN ('initiator', 'partner')),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pair_id, profile_id)
);

-- 4. Messages (CommonGround)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  bently_suggestion TEXT,
  bently_rewrite_options JSONB DEFAULT '[]',
  mode VARCHAR(20) DEFAULT 'common' CHECK (mode IN ('common', 'deeply')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Intimate Messages (DeeplyUs)
CREATE TABLE intimate_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  bently_response TEXT,
  escalation_level INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Daily Questions
CREATE TABLE daily_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  category VARCHAR(50),
  difficulty VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Daily Answers (join table for couple responses)
CREATE TABLE daily_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES daily_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answered_at TIMESTAMP DEFAULT NOW()
);

-- 8. Missions
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50),
  duration_days INTEGER,
  xp_reward INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Mission Progress
CREATE TABLE mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  UNIQUE(pair_id, mission_id)
);

-- 10. Sparks (games/interactions)
CREATE TABLE sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  rules JSONB,
  xp_reward INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 11. Spark Scores
CREATE TABLE spark_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  spark_id UUID NOT NULL REFERENCES sparks(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),
  score INTEGER,
  played_at TIMESTAMP DEFAULT NOW()
);

-- 12. Exercises
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50),
  mode VARCHAR(20) DEFAULT 'both' CHECK (mode IN ('common', 'deeply', 'both')),
  difficulty VARCHAR(20),
  duration_minutes INTEGER,
  instructions JSONB,
  xp_reward INTEGER DEFAULT 15,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 13. Exercise Progress
CREATE TABLE exercise_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT,
  UNIQUE(pair_id, exercise_id)
);

-- 14. Vault (memories)
CREATE TABLE vault_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 15. Astrology
CREATE TABLE astrology_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  zodiac_sign_1 VARCHAR(20),
  zodiac_sign_2 VARCHAR(20),
  reading_text TEXT,
  mode VARCHAR(20) DEFAULT 'common' CHECK (mode IN ('common', 'deeply')),
  generated_at TIMESTAMP DEFAULT NOW()
);

-- 16. Quiz Questions
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_type VARCHAR(50),
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 17. Quiz Responses
CREATE TABLE quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_option TEXT,
  answered_at TIMESTAMP DEFAULT NOW()
);

-- 18. Journal Entries
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  mood VARCHAR(50),
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 19. Shared Lists
CREATE TABLE shared_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  list_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 20. List Items
CREATE TABLE list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES shared_lists(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 21. Calendar Events
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 22. Rankings (XP & Leaderboards)
CREATE TABLE pair_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE UNIQUE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 23. Relational Engine State History
CREATE TABLE relational_state_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  state VARCHAR(50) NOT NULL,
  availability VARCHAR(20),
  alignment VARCHAR(20),
  activation VARCHAR(20),
  trust VARCHAR(20),
  asymmetries JSONB DEFAULT '[]',
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- 24. Bently Interventions Log
CREATE TABLE bently_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  state VARCHAR(50),
  overlay_type VARCHAR(50),
  intervention_text TEXT,
  user_response TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profiles_auth_id ON profiles(auth_id);
CREATE INDEX idx_pairs_status ON pairs(status);
CREATE INDEX idx_pairs_relational_state ON pairs(relational_state);
CREATE INDEX idx_pair_members_pair_id ON pair_members(pair_id);
CREATE INDEX idx_pair_members_profile_id ON pair_members(profile_id);
CREATE INDEX idx_messages_pair_id ON messages(pair_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_intimate_messages_pair_id ON intimate_messages(pair_id);
CREATE INDEX idx_daily_answers_pair_id ON daily_answers(pair_id);
CREATE INDEX idx_mission_progress_pair_id ON mission_progress(pair_id);
CREATE INDEX idx_exercise_progress_pair_id ON exercise_progress(pair_id);
CREATE INDEX idx_vault_memories_pair_id ON vault_memories(pair_id);
CREATE INDEX idx_astrology_pair_id ON astrology_readings(pair_id);
CREATE INDEX idx_journal_pair_id ON journal_entries(pair_id);
CREATE INDEX idx_calendar_pair_id ON calendar_events(pair_id);
CREATE INDEX idx_relational_state_history_pair_id ON relational_state_history(pair_id);
CREATE INDEX idx_bently_interventions_pair_id ON bently_interventions(pair_id);

-- Row Level Security (RLS) - Enable for all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pair_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE intimate_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE spark_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE astrology_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pair_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE relational_state_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bently_interventions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY messages_select ON messages
  FOR SELECT USING (
    pair_id IN (
      SELECT pair_id FROM pair_members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY messages_insert ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    pair_id IN (
      SELECT pair_id FROM pair_members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY messages_delete ON messages
  FOR DELETE USING (
    sender_id = auth.uid()
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_pairs_updated_at BEFORE UPDATE ON pairs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vault_memories_updated_at BEFORE UPDATE ON vault_memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shared_lists_updated_at BEFORE UPDATE ON shared_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger to auto-create profile on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (auth_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
