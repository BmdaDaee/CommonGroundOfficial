// Auto-generated from Supabase schema (migrations/001_core_tables.sql)
// Regenerate with: supabase gen types typescript --local > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          auth_id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          app_mode: 'common' | 'deeply' | 'both'
          zodiac_sign: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          app_mode?: 'common' | 'deeply' | 'both'
          zodiac_sign?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          app_mode?: 'common' | 'deeply' | 'both'
          zodiac_sign?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      pairs: {
        Row: {
          id: string
          pair_code: string
          status: 'active' | 'paused' | 'ended'
          relationship_start_date: string | null
          relational_state: 'CAPACITY_BLOCKED' | 'MISALIGNED' | 'DORMANT' | 'TRUST_FRACTURED' | 'ALIGNED' | 'UNKNOWN'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pair_code: string
          status?: 'active' | 'paused' | 'ended'
          relationship_start_date?: string | null
          relational_state?: 'CAPACITY_BLOCKED' | 'MISALIGNED' | 'DORMANT' | 'TRUST_FRACTURED' | 'ALIGNED' | 'UNKNOWN'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pair_code?: string
          status?: 'active' | 'paused' | 'ended'
          relationship_start_date?: string | null
          relational_state?: 'CAPACITY_BLOCKED' | 'MISALIGNED' | 'DORMANT' | 'TRUST_FRACTURED' | 'ALIGNED' | 'UNKNOWN'
          created_at?: string
          updated_at?: string
        }
      }
      pair_members: {
        Row: {
          id: string
          pair_id: string
          profile_id: string
          role: 'initiator' | 'partner' | null
          joined_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          profile_id: string
          role?: 'initiator' | 'partner' | null
          joined_at?: string
        }
        Update: {
          id?: string
          pair_id?: string
          profile_id?: string
          role?: 'initiator' | 'partner' | null
          joined_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          pair_id: string
          sender_id: string
          content: string
          bently_suggestion: string | null
          bently_rewrite_options: Json
          mode: 'common' | 'deeply'
          created_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          sender_id: string
          content: string
          bently_suggestion?: string | null
          bently_rewrite_options?: Json
          mode?: 'common' | 'deeply'
          created_at?: string
        }
        Update: {
          id?: string
          pair_id?: string
          sender_id?: string
          content?: string
          bently_suggestion?: string | null
          bently_rewrite_options?: Json
          mode?: 'common' | 'deeply'
          created_at?: string
        }
      }
      intimate_messages: {
        Row: {
          id: string
          pair_id: string
          sender_id: string
          content: string
          bently_response: string | null
          escalation_level: number
          created_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          sender_id: string
          content: string
          bently_response?: string | null
          escalation_level?: number
          created_at?: string
        }
        Update: {
          id?: string
          pair_id?: string
          sender_id?: string
          content?: string
          bently_response?: string | null
          escalation_level?: number
          created_at?: string
        }
      }
      daily_questions: {
        Row: {
          id: string
          question_text: string
          category: string | null
          difficulty: string | null
          created_at: string
        }
        Insert: {
          id?: string
          question_text: string
          category?: string | null
          difficulty?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          question_text?: string
          category?: string | null
          difficulty?: string | null
          created_at?: string
        }
      }
      daily_answers: {
        Row: {
          id: string
          pair_id: string
          profile_id: string
          question_id: string
          answer_text: string | null
          answered_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          profile_id: string
          question_id: string
          answer_text?: string | null
          answered_at?: string
        }
        Update: {
          id?: string
          pair_id?: string
          profile_id?: string
          question_id?: string
          answer_text?: string | null
          answered_at?: string
        }
      }
      missions: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string | null
          duration_days: number | null
          xp_reward: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category?: string | null
          duration_days?: number | null
          xp_reward?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string | null
          duration_days?: number | null
          xp_reward?: number
          created_at?: string
        }
      }
      mission_progress: {
        Row: {
          id: string
          pair_id: string
          mission_id: string
          status: 'not_started' | 'in_progress' | 'completed'
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          pair_id: string
          mission_id: string
          status?: 'not_started' | 'in_progress' | 'completed'
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          pair_id?: string
          mission_id?: string
          status?: 'not_started' | 'in_progress' | 'completed'
          started_at?: string | null
          completed_at?: string | null
        }
      }
      sparks: {
        Row: {
          id: string
          title: string
          rules: Json | null
          xp_reward: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          rules?: Json | null
          xp_reward?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          rules?: Json | null
          xp_reward?: number
          created_at?: string
        }
      }
      spark_scores: {
        Row: {
          id: string
          pair_id: string
          spark_id: string
          profile_id: string
          score: number | null
          played_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          spark_id: string
          profile_id: string
          score?: number | null
          played_at?: string
        }
        Update: {
          id?: string
          pair_id?: string
          spark_id?: string
          profile_id?: string
          score?: number | null
          played_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string | null
          mode: 'common' | 'deeply' | 'both'
          difficulty: string | null
          duration_minutes: number | null
          instructions: Json | null
          xp_reward: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category?: string | null
          mode?: 'common' | 'deeply' | 'both'
          difficulty?: string | null
          duration_minutes?: number | null
          instructions?: Json | null
          xp_reward?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string | null
          mode?: 'common' | 'deeply' | 'both'
          difficulty?: string | null
          duration_minutes?: number | null
          instructions?: Json | null
          xp_reward?: number
          created_at?: string
        }
      }
      exercise_progress: {
        Row: {
          id: string
          pair_id: string
          exercise_id: string
          status: 'not_started' | 'in_progress' | 'completed'
          started_at: string | null
          completed_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          pair_id: string
          exercise_id: string
          status?: 'not_started' | 'in_progress' | 'completed'
          started_at?: string | null
          completed_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          pair_id?: string
          exercise_id?: string
          status?: 'not_started' | 'in_progress' | 'completed'
          started_at?: string | null
          completed_at?: string | null
          notes?: string | null
        }
      }
      vault_memories: {
        Row: {
          id: string
          pair_id: string
          title: string
          content: string | null
          category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          title: string
          content?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pair_id?: string
          title?: string
          content?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      astrology_readings: {
        Row: {
          id: string
          pair_id: string
          zodiac_sign_1: string | null
          zodiac_sign_2: string | null
          reading_text: string | null
          mode: 'common' | 'deeply'
          generated_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          zodiac_sign_1?: string | null
          zodiac_sign_2?: string | null
          reading_text?: string | null
          mode?: 'common' | 'deeply'
          generated_at?: string
        }
        Update: {
          id?: string
          pair_id?: string
          zodiac_sign_1?: string | null
          zodiac_sign_2?: string | null
          reading_text?: string | null
          mode?: 'common' | 'deeply'
          generated_at?: string
        }
      }
      quiz_questions: {
        Row: {
          id: string
          quiz_type: string
          question_text: string
          options: Json | null
          correct_answer: string | null
          created_at: string
        }
        Insert: {
          id?: string
          quiz_type: string
          question_text: string
          options?: Json | null
          correct_answer?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          quiz_type?: string
          question_text?: string
          options?: Json | null
          correct_answer?: string | null
          created_at?: string
        }
      }
      quiz_responses: {
        Row: {
          id: string
          pair_id: string
          profile_id: string
          question_id: string
          selected_option: string | null
          answered_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          profile_id: string
          question_id: string
          selected_option?: string | null
          answered_at?: string
        }
        Update: {
          id?: string
          pair_id?: string
          profile_id?: string
          question_id?: string
          selected_option?: string | null
          answered_at?: string
        }
      }
      journal_entries: {
        Row: {
          id: string
          pair_id: string
          profile_id: string
          title: string | null
          content: string
          mood: string | null
          ai_analysis: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          profile_id: string
          title?: string | null
          content: string
          mood?: string | null
          ai_analysis?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pair_id?: string
          profile_id?: string
          title?: string | null
          content?: string
          mood?: string | null
          ai_analysis?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shared_lists: {
        Row: {
          id: string
          pair_id: string
          title: string
          list_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          title: string
          list_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pair_id?: string
          title?: string
          list_type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      list_items: {
        Row: {
          id: string
          list_id: string
          content: string
          completed: boolean
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          list_id: string
          content: string
          completed?: boolean
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          content?: string
          completed?: boolean
          created_by?: string
          created_at?: string
        }
      }
      calendar_events: {
        Row: {
          id: string
          pair_id: string
          title: string
          description: string | null
          event_date: string
          start_time: string | null
          end_time: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          title: string
          description?: string | null
          event_date: string
          start_time?: string | null
          end_time?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          pair_id?: string
          title?: string
          description?: string | null
          event_date?: string
          start_time?: string | null
          end_time?: string | null
          created_at?: string
        }
      }
      pair_rankings: {
        Row: {
          id: string
          pair_id: string
          total_xp: number
          level: number
          updated_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          total_xp?: number
          level?: number
          updated_at?: string
        }
        Update: {
          id?: string
          pair_id?: string
          total_xp?: number
          level?: number
          updated_at?: string
        }
      }
      relational_state_history: {
        Row: {
          id: string
          pair_id: string
          state: string
          availability: string | null
          alignment: string | null
          activation: string | null
          trust: string | null
          asymmetries: Json
          recorded_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          state: string
          availability?: string | null
          alignment?: string | null
          activation?: string | null
          trust?: string | null
          asymmetries?: Json
          recorded_at?: string
        }
        Update: {
          id?: string
          pair_id?: string
          state?: string
          availability?: string | null
          alignment?: string | null
          activation?: string | null
          trust?: string | null
          asymmetries?: Json
          recorded_at?: string
        }
      }
      bently_interventions: {
        Row: {
          id: string
          pair_id: string
          state: string | null
          overlay_type: string | null
          intervention_text: string | null
          user_response: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          state?: string | null
          overlay_type?: string | null
          intervention_text?: string | null
          user_response?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          pair_id?: string
          state?: string | null
          overlay_type?: string | null
          intervention_text?: string | null
          user_response?: string | null
          created_at?: string
        }
      }
      user_xp: {
        Row: {
          id: string
          profile_id: string
          total_xp: number
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          total_xp?: number
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          total_xp?: number
          updated_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          profile_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          achievement_id?: string
          earned_at?: string
        }
      }
      mission_completions: {
        Row: {
          id: string
          pair_id: string
          mission_id: string
          profile_id: string
          xp_awarded: number
          completed_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          mission_id: string
          profile_id: string
          xp_awarded?: number
          completed_at?: string
        }
        Update: {
          id?: string
          pair_id?: string
          mission_id?: string
          profile_id?: string
          xp_awarded?: number
          completed_at?: string
        }
      }
      exercise_completions: {
        Row: {
          id: string
          pair_id: string
          profile_id: string
          exercise_id: string
          xp_awarded: number
          completed_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          profile_id: string
          exercise_id: string
          xp_awarded?: number
          completed_at?: string
        }
        Update: {
          id?: string
          pair_id?: string
          profile_id?: string
          exercise_id?: string
          xp_awarded?: number
          completed_at?: string
        }
      }
      spark_sessions: {
        Row: {
          id: string
          pair_id: string
          profile_id: string
          game_id: string
          score: number | null
          xp_awarded: number | null
          played_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          profile_id: string
          game_id: string
          score?: number
          xp_awarded?: number
          played_at?: string
        }
        Update: {
          id?: string
          pair_id?: string
          profile_id?: string
          game_id?: string
          score?: number
          xp_awarded?: number
          played_at?: string
        }
      }
      growth_completions: {
        Row: {
          id: string
          pair_id: string
          module_id: string
          profile_id: string
          xp_awarded: number
          completed_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          module_id: string
          profile_id: string
          xp_awarded?: number
          completed_at?: string
        }
        Update: {
          id?: string
          pair_id?: string
          module_id?: string
          profile_id?: string
          xp_awarded?: number
          completed_at?: string
        }
      }
      question_answers: {
        Row: {
          id: string
          pair_id: string
          profile_id: string
          question_id: string
          answer_text: string
          answered_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          profile_id: string
          question_id: string
          answer_text: string
          answered_at?: string
        }
        Update: {
          id?: string
          pair_id?: string
          profile_id?: string
          question_id?: string
          answer_text?: string
          answered_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
