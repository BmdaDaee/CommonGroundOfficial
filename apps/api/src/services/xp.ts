import { supabase } from '../lib/supabase'
import { RANK_TIERS } from '../utils/constants'

export async function awardXP(profileId: string, amount: number): Promise<number> {
  const { data } = await supabase
    .from('user_xp')
    .select('total_xp')
    .eq('profile_id', profileId)
    .single()

  const newTotal = (data?.total_xp || 0) + amount

  await supabase
    .from('user_xp')
    .upsert({ profile_id: profileId, total_xp: newTotal, updated_at: new Date().toISOString() })
    .eq('profile_id', profileId)

  return newTotal
}

export function getTierFromXP(xp: number): { tier: string; emoji: string } {
  const sorted = [...RANK_TIERS].reverse()
  const matched = sorted.find(t => xp >= t.minXP)
  return matched ? { tier: matched.tier, emoji: matched.emoji } : { tier: 'SPARK', emoji: '✨' }
}
