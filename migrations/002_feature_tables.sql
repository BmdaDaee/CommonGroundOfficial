-- Phase 2: Feature Tracking Tables
-- Adds string-keyed tracking tables for constants-driven features

-- Mission completions (string mission_id from constants)
CREATE TABLE IF NOT EXISTS mission_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL,
  xp_awarded INTEGER DEFAULT 0,
  completed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pair_id, mission_id)
);

-- Exercise completions (string exercise_id from constants)
CREATE TABLE IF NOT EXISTS exercise_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  xp_awarded INTEGER DEFAULT 0,
  completed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pair_id, exercise_id)
);

-- Spark game sessions (string game_id from constants)
CREATE TABLE IF NOT EXISTS spark_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  xp_awarded INTEGER DEFAULT 0,
  played_at TIMESTAMP DEFAULT NOW()
);

-- Growth module completions (string module_id from constants)
CREATE TABLE IF NOT EXISTS growth_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  xp_awarded INTEGER DEFAULT 0,
  completed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pair_id, module_id)
);

-- Per-user XP tracking
CREATE TABLE IF NOT EXISTS user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  total_xp INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Per-user achievement tracking (string achievement_id from constants)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(profile_id, achievement_id)
);

-- Daily question answers (string question_id, since questions rotate by day)
CREATE TABLE IF NOT EXISTS question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  answered_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pair_id, profile_id, question_id)
);

-- RLS for new tables
ALTER TABLE mission_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spark_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mission_completions_pair_id ON mission_completions(pair_id);
CREATE INDEX IF NOT EXISTS idx_exercise_completions_pair_id ON exercise_completions(pair_id);
CREATE INDEX IF NOT EXISTS idx_spark_sessions_pair_id ON spark_sessions(pair_id);
CREATE INDEX IF NOT EXISTS idx_growth_completions_pair_id ON growth_completions(pair_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_profile_id ON user_xp(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_profile_id ON user_achievements(profile_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_pair_id ON question_answers(pair_id);
