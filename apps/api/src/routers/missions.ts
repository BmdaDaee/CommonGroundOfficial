import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'
import { awardXP } from '../services/xp'
import { MISSIONS } from '../utils/constants'

export const missionsRouter = router({
  list: protectedProcedure
    .input(z.object({ pairId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)

      if (!isMember?.length) throw new Error('Not a member of this pair')

      const { data: completed } = await supabase
        .from('mission_completions')
        .select('mission_id, completed_at')
        .eq('pair_id', input.pairId)

      const completedIds = new Set(completed?.map(m => m.mission_id) || [])

      return MISSIONS.map(mission => ({
        ...mission,
        completed: completedIds.has(mission.id),
      }))
    }),

  complete: protectedProcedure
    .input(z.object({ pairId: z.string().uuid(), missionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)

      if (!isMember?.length) throw new Error('Not a member of this pair')

      const mission = MISSIONS.find(m => m.id === input.missionId)
      if (!mission) throw new Error('Mission not found')

      const { error } = await supabase.from('mission_completions').upsert({
        pair_id: input.pairId,
        profile_id: ctx.userId,
        mission_id: input.missionId,
        xp_awarded: mission.xp,
        completed_at: new Date().toISOString(),
      })

      if (error && !error.message.includes('duplicate')) throw error

      const totalXp = await awardXP(ctx.userId, mission.xp)

      return { missionId: input.missionId, xpAwarded: mission.xp, totalXp }
    }),

  getProgress: protectedProcedure
    .input(z.object({ pairId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)

      if (!isMember?.length) throw new Error('Not a member of this pair')

      const { data: progress } = await supabase
        .from('mission_completions')
        .select('*')
        .eq('pair_id', input.pairId)
        .order('completed_at', { ascending: false })

      return progress || []
    }),
})
