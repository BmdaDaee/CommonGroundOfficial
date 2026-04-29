import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'
import { getTierFromXP } from '../services/xp'

export const rankingsRouter = router({
  getRank: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data } = await supabase
        .from('user_xp').select('total_xp, updated_at')
        .eq('profile_id', ctx.userId).single()

      const totalXp = data?.total_xp || 0
      const { tier, emoji } = getTierFromXP(totalXp)

      return { totalXp, tier, emoji, updatedAt: data?.updated_at || null }
    }),

  getRankHistory: protectedProcedure
    .input(z.object({ pairId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: members } = await supabase
        .from('pair_members').select('profile_id').eq('pair_id', input.pairId)

      if (!members?.length) throw new Error('Pair not found')

      const memberIds = members.map(m => m.profile_id)
      if (!memberIds.includes(ctx.userId)) throw new Error('Not a member of this pair')

      const { data: xpData } = await supabase
        .from('user_xp').select('profile_id, total_xp, updated_at')
        .in('profile_id', memberIds)

      return (xpData || []).map(row => ({
        profileId: row.profile_id,
        totalXp: row.total_xp,
        ...getTierFromXP(row.total_xp),
        updatedAt: row.updated_at,
      }))
    }),

  leaderboard: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data } = await supabase
        .from('user_xp').select('profile_id, total_xp')
        .order('total_xp', { ascending: false })
        .limit(input.limit)

      return (data || []).map((row, index) => ({
        rank: index + 1,
        profileId: row.profile_id,
        totalXp: row.total_xp,
        ...getTierFromXP(row.total_xp),
      }))
    }),
})
