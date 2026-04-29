import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'

export const profileRouter = router({
  get: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('profiles').select('*').eq('id', ctx.userId).single()

      if (error) throw error
      return data
    }),

  update: protectedProcedure
    .input(z.object({
      displayName: z.string().max(100).optional(),
      avatarUrl: z.string().url().optional(),
      zodiacSign: z.string().optional(),
      appMode: z.enum(['common', 'deeply', 'both']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (input.displayName !== undefined) updates.display_name = input.displayName
      if (input.avatarUrl !== undefined) updates.avatar_url = input.avatarUrl
      if (input.zodiacSign !== undefined) updates.zodiac_sign = input.zodiacSign
      if (input.appMode !== undefined) updates.app_mode = input.appMode

      const { data, error } = await supabase
        .from('profiles').update(updates).eq('id', ctx.userId).select().single()

      if (error) throw error
      return data
    }),

  getSettings: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('profiles').select('preferences').eq('id', ctx.userId).single()

      if (error) throw error
      return (data?.preferences as Record<string, unknown>) || {}
    }),

  updateSettings: protectedProcedure
    .input(z.object({ settings: z.record(z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: current } = await supabase
        .from('profiles').select('preferences').eq('id', ctx.userId).single()

      const merged = { ...(current?.preferences as Record<string, unknown> || {}), ...input.settings }

      const { data, error } = await supabase
        .from('profiles')
        .update({ preferences: merged, updated_at: new Date().toISOString() })
        .eq('id', ctx.userId).select('preferences').single()

      if (error) throw error
      return (data?.preferences as Record<string, unknown>) || {}
    }),
})
