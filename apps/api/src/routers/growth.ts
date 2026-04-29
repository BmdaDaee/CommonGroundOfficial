import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'
import { awardXP } from '../services/xp'
import { GROWTH_MODULES } from '../utils/constants'

export const growthRouter = router({
  getModules: protectedProcedure
    .input(z.object({ pairId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members').select('*')
        .eq('pair_id', input.pairId).eq('profile_id', ctx.userId)
      if (!isMember?.length) throw new Error('Not a member of this pair')

      const { data: completed } = await supabase
        .from('growth_completions').select('module_id, completed_at')
        .eq('pair_id', input.pairId)

      const completedIds = new Set(completed?.map(m => m.module_id) || [])

      return GROWTH_MODULES.map(module => ({
        ...module,
        completed: completedIds.has(module.id),
      }))
    }),

  completeModule: protectedProcedure
    .input(z.object({ pairId: z.string().uuid(), moduleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members').select('*')
        .eq('pair_id', input.pairId).eq('profile_id', ctx.userId)
      if (!isMember?.length) throw new Error('Not a member of this pair')

      const module = GROWTH_MODULES.find(m => m.id === input.moduleId)
      if (!module) throw new Error('Module not found')

      const { error } = await supabase.from('growth_completions').upsert({
        pair_id: input.pairId,
        profile_id: ctx.userId,
        module_id: input.moduleId,
        xp_awarded: module.xp,
        completed_at: new Date().toISOString(),
      })

      if (error && !error.message.includes('duplicate')) throw error

      const totalXp = await awardXP(ctx.userId, module.xp)

      return { moduleId: input.moduleId, xpAwarded: module.xp, totalXp }
    }),

  getProgress: protectedProcedure
    .input(z.object({ pairId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members').select('*')
        .eq('pair_id', input.pairId).eq('profile_id', ctx.userId)
      if (!isMember?.length) throw new Error('Not a member of this pair')

      const { data: progress } = await supabase
        .from('growth_completions').select('*')
        .eq('pair_id', input.pairId)
        .order('completed_at', { ascending: false })

      return progress || []
    }),
})
