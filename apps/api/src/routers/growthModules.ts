import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'
import { awardXP } from '../services/xp'
import { GROWTH_MODULES } from '../utils/constants'

export const growthModulesRouter = router({
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

      const { data: completions } = await supabase
        .from('growth_completions')
        .select('module_id, completed_at')
        .eq('pair_id', input.pairId)

      const completedIds = new Set(completions?.map(c => c.module_id) || [])

      return GROWTH_MODULES.map(module => ({
        ...module,
        completed: completedIds.has(module.id),
      }))
    }),

  start: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        moduleId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)

      if (!isMember?.length) throw new Error('Not a member of this pair')

      const module = GROWTH_MODULES.find(m => m.id === input.moduleId)
      if (!module) throw new Error('Growth module not found')

      // TODO: persist active module start to growth_module_progress table once migration is created
      return {
        moduleId: input.moduleId,
        pairId: input.pairId,
        startedAt: new Date().toISOString(),
        totalDays: module.days,
        currentDay: 1,
      }
    }),

  completeDay: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        moduleId: z.string(),
        day: z.number().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)

      if (!isMember?.length) throw new Error('Not a member of this pair')

      const module = GROWTH_MODULES.find(m => m.id === input.moduleId)
      if (!module) throw new Error('Growth module not found')

      if (input.day > module.days) throw new Error(`Day ${input.day} exceeds module length`)

      const isLastDay = input.day === module.days

      if (isLastDay) {
        const { error } = await supabase.from('growth_completions').upsert({
          pair_id: input.pairId,
          profile_id: ctx.userId,
          module_id: input.moduleId,
          xp_awarded: module.xp,
          completed_at: new Date().toISOString(),
        })

        if (error && !error.message.includes('duplicate')) throw error

        const totalXp = await awardXP(ctx.userId, module.xp)

        return { day: input.day, moduleComplete: true, xpAwarded: module.xp, totalXp }
      }

      // TODO: track individual day completions in growth_module_progress table once migration is created
      return { day: input.day, moduleComplete: false, xpAwarded: 0, totalXp: null }
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

      const { data: completions, error } = await supabase
        .from('growth_completions')
        .select('*')
        .eq('pair_id', input.pairId)
        .order('completed_at', { ascending: false })

      if (error) throw error

      const completedIds = new Set(completions?.map(c => c.module_id) || [])

      return {
        completedModules: completions || [],
        totalModules: GROWTH_MODULES.length,
        completedCount: completedIds.size,
      }
    }),
})
