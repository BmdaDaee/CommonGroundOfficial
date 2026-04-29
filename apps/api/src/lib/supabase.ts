import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials')
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Helper to get user context from auth token
export async function getUserFromToken(token: string) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    throw new Error('Invalid auth token')
  }
  
  return user
}

// Helper to get pair membership
export async function getUserPairs(userId: string) {
  const { data, error } = await supabase
    .from('pair_members')
    .select('pair_id')
    .eq('profile_id', userId)
  
  if (error) throw error
  return data?.map(pm => pm.pair_id) || []
}

// Helper to get pair details with both members
export async function getPairWithMembers(pairId: string) {
  const { data: pair, error: pairError } = await supabase
    .from('pairs')
    .select('*')
    .eq('id', pairId)
    .single()
  
  if (pairError) throw pairError
  
  const { data: members, error: membersError } = await supabase
    .from('pair_members')
    .select('profile_id, role')
    .eq('pair_id', pairId)
  
  if (membersError) throw membersError
  
  return { pair, members }
}

// Helper to get profile by auth_id
export async function getProfileByAuthId(authId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', authId)
    .single()
  
  if (error) throw error
  return data
}
