import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'
import { awardXP } from '../services/xp'
import { EXERCISES } from '../utils/constants'

export const trustRouter = router({
  getExercises: protectedProcedure
    .input(z.object({ pairId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members').select('*')
        .eq('pair_id', input.pairId).eq('profile_id', ctx.userId)
      if (!isMember?.length) throw new Error('Not a member of this pair')

      const { data: completed } = await supabase
        .from('exercise_completions').select('exercise_id, completed_at')
        .eq('pair_id', input.pairId).eq('profile_id', ctx.userId)

      const completedIds = new Set(completed?.map(e => e.exercise_id) || [])

      return EXERCISES.map(exercise => ({
        ...exercise,
        completed: completedIds.has(exercise.id),
      }))
    }),

  complete: protectedProcedure
    .input(z.object({ pairId: z.string().uuid(), exerciseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members').select('*')
        .eq('pair_id', input.pairId).eq('profile_id', ctx.userId)
      if (!isMember?.length) throw new Error('Not a member of this pair')

      const exercise = EXERCISES.find(e => e.id === input.exerciseId)
      if (!exercise) throw new Error('Exercise not found')

      const { error } = await supabase.from('exercise_completions').upsert({
        pair_id: input.pairId,
        profile_id: ctx.userId,
        exercise_id: input.exerciseId,
        xp_awarded: exercise.xp,
        completed_at: new Date().toISOString(),
      })

      if (error && !error.message.includes('duplicate')) throw error

      const totalXp = await awardXP(ctx.userId, exercise.xp)

      return { exerciseId: input.exerciseId, xpAwarded: exercise.xp, totalXp }
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
        .from('exercise_completions').select('*')
        .eq('pair_id', input.pairId).eq('profile_id', ctx.userId)
        .order('completed_at', { ascending: false })

      return progress || []
    }),
})
