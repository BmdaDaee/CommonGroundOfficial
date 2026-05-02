import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'

const ATTACHMENT_STYLES = ['secure', 'anxious', 'avoidant', 'disorganized'] as const
const COMMUNICATION_STYLES = ['direct', 'indirect', 'assertive', 'passive', 'aggressive'] as const

export const personalityRouter = router({
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', ctx.userId)
        .single()

      if (profileError) throw profileError

      // TODO: query personality_profiles table once migration is created
      return {
        profileId: ctx.userId,
        loveLanguage: profile?.love_language || null,
        attachmentStyle: null as (typeof ATTACHMENT_STYLES)[number] | null,
        communicationStyle: null as (typeof COMMUNICATION_STYLES)[number] | null,
        zodiacSign: profile?.zodiac_sign || null,
        updatedAt: null as string | null,
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        loveLanguage: z.string().optional(),
        attachmentStyle: z.enum(ATTACHMENT_STYLES).optional(),
        communicationStyle: z.enum(COMMUNICATION_STYLES).optional(),
        zodiacSign: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const updates: Record<string, string> = {}
      if (input.loveLanguage) updates.love_language = input.loveLanguage
      if (input.zodiacSign) updates.zodiac_sign = input.zodiacSign

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', ctx.userId)

        if (error) throw error
      }

      // TODO: persist attachmentStyle / communicationStyle to personality_profiles once migration is created
      return {
        profileId: ctx.userId,
        ...input,
        updatedAt: new Date().toISOString(),
      }
    }),
})
