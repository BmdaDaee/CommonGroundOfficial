import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'
import { generateHoroscope } from '../services/claude'
import { ZODIAC_SIGNS } from '../utils/constants'

export const astrologyRouter = router({
  getHoroscope: protectedProcedure
    .input(z.object({ pairId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)

      if (!isMember?.length) throw new Error('Not a member of this pair')

      const today = new Date().toISOString().split('T')[0]

      const { data: existing } = await supabase
        .from('astrology_readings')
        .select('*')
        .eq('pair_id', input.pairId)
        .gte('generated_at', `${today}T00:00:00`)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()

      return existing || null
    }),

  generate: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        zodiac1: z.string(),
        zodiac2: z.string(),
        mode: z.enum(['common', 'deeply']).default('common'),
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

      const readingText = await generateHoroscope(input.zodiac1, input.zodiac2, input.mode)

      const { data, error } = await supabase
        .from('astrology_readings')
        .insert({
          pair_id: input.pairId,
          zodiac_sign_1: input.zodiac1,
          zodiac_sign_2: input.zodiac2,
          reading_text: readingText,
          mode: input.mode,
        })
        .select()
        .single()

      if (error) throw error

      return data
    }),

  getZodiacInfo: protectedProcedure
    .input(z.object({ sign: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const info = ZODIAC_SIGNS.find(
        z => z.sign.toLowerCase() === input.sign.toLowerCase()
      )

      if (!info) throw new Error('Zodiac sign not found')

      return info
    }),
})
