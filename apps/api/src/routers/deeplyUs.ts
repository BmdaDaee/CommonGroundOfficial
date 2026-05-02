import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'

const DEEPLY_US_PROMPTS = [
  { id: 'morning_check_in', title: 'Morning Check-In', category: 'connection', description: 'Start your day together with intention.' },
  { id: 'gratitude_loop', title: 'Gratitude Loop', category: 'appreciation', description: 'Name three things you love about today.' },
  { id: 'body_scan', title: 'Body Scan Together', category: 'presence', description: 'Ground into your bodies and into each other.' },
  { id: 'desire_map', title: 'Desire Map', category: 'intimacy', description: 'Speak what you want without apology.' },
]

const DEEPLY_US_EXERCISES = [
  { id: 'breath_sync', title: 'Breath Sync', category: 'presence', duration: 5, description: 'Breathe together until your rhythms align.' },
  { id: 'slow_gaze', title: 'Slow Gaze', category: 'connection', duration: 4, description: 'Look at each other without speaking for 4 minutes.' },
  { id: 'body_gratitude', title: 'Body Gratitude', category: 'intimacy', duration: 10, description: "Name what you appreciate about your partner's physical presence." },
]

export const deeplyUsRouter = router({
  getPrompts: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        category: z.enum(['connection', 'appreciation', 'presence', 'intimacy']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)

      if (!isMember?.length) throw new Error('Not a member of this pair')

      const prompts = input.category
        ? DEEPLY_US_PROMPTS.filter(p => p.category === input.category)
        : DEEPLY_US_PROMPTS

      return prompts
    }),

  getExercises: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        category: z.enum(['presence', 'connection', 'intimacy']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)

      if (!isMember?.length) throw new Error('Not a member of this pair')

      const exercises = input.category
        ? DEEPLY_US_EXERCISES.filter(e => e.category === input.category)
        : DEEPLY_US_EXERCISES

      return exercises
    }),

  unlock: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        contentId: z.string(),
        contentType: z.enum(['prompt', 'exercise']),
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

      // TODO: persist unlock to deeply_us_unlocks table once migration is created
      return {
        pairId: input.pairId,
        contentId: input.contentId,
        contentType: input.contentType,
        unlockedAt: new Date().toISOString(),
      }
    }),
})
