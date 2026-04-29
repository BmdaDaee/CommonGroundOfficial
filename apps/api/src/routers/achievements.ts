import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'
import { ACHIEVEMENTS } from '../utils/constants'

export const achievementsRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: earned } = await supabase
        .from('user_achievements').select('achievement_id, earned_at')
        .eq('profile_id', ctx.userId)

      const earnedIds = new Set(earned?.map(a => a.achievement_id) || [])
      const earnedMap = Object.fromEntries(earned?.map(a => [a.achievement_id, a.earned_at]) || [])

      return ACHIEVEMENTS.map(achievement => ({
        ...achievement,
        earned: earnedIds.has(achievement.id),
        earnedAt: earnedMap[achievement.id] || null,
      }))
    }),

  unlocked: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: earned } = await supabase
        .from('user_achievements').select('achievement_id, earned_at')
        .eq('profile_id', ctx.userId)
        .order('earned_at', { ascending: false })

      return (earned || []).map(row => {
        const achievement = ACHIEVEMENTS.find(a => a.id === row.achievement_id)
        return { ...achievement, earnedAt: row.earned_at }
      }).filter(Boolean)
    }),

  check: protectedProcedure
    .input(z.object({ achievementId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const achievement = ACHIEVEMENTS.find(a => a.id === input.achievementId)
      if (!achievement) throw new Error('Achievement not found')

      const { error } = await supabase
        .from('user_achievements')
        .upsert({
          profile_id: ctx.userId,
          achievement_id: input.achievementId,
          earned_at: new Date().toISOString(),
        })

      if (error && !error.message.includes('duplicate')) throw error

      return { ...achievement, earned: true }
    }),
})
