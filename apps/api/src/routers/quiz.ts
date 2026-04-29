import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'
import { LOVE_LANGUAGE_QUESTIONS, LOVE_LANGUAGES } from '../utils/constants'

export const quizRouter = router({
  getQuestions: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) throw new Error('Not authenticated')
      return LOVE_LANGUAGE_QUESTIONS
    }),

  submitAnswers: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        answers: z.array(
          z.object({ questionId: z.number(), choice: z.enum(['A', 'B']) })
        ),
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

      const scores: Record<string, number> = {}
      for (const answer of input.answers) {
        const q = LOVE_LANGUAGE_QUESTIONS.find(q => q.id === answer.questionId)
        if (!q) continue
        const lang = answer.choice === 'A'
          ? q.optionA.split('/')[0].trim()
          : q.optionB.split('/')[0].trim()
        scores[lang] = (scores[lang] || 0) + 1
      }

      const topLanguage = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || LOVE_LANGUAGES[0]

      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', ctx.userId)
        .single()

      await supabase
        .from('profiles')
        .update({
          preferences: {
            ...(profile?.preferences as Record<string, unknown> || {}),
            loveLanguage: topLanguage,
            loveLanguageScores: scores,
          },
        })
        .eq('id', ctx.userId)

      return { loveLanguage: topLanguage, scores }
    }),

  getResults: protectedProcedure
    .input(z.object({ pairId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: members } = await supabase
        .from('pair_members')
        .select('profile_id')
        .eq('pair_id', input.pairId)

      if (!members?.length) throw new Error('Pair not found')

      const memberIds = members.map(m => m.profile_id)
      if (!memberIds.includes(ctx.userId)) throw new Error('Not a member of this pair')

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, preferences')
        .in('id', memberIds)

      return profiles?.map(p => ({
        profileId: p.id,
        displayName: p.display_name,
        loveLanguage: (p.preferences as Record<string, unknown>)?.loveLanguage || null,
        scores: (p.preferences as Record<string, unknown>)?.loveLanguageScores || null,
      })) || []
    }),
})
