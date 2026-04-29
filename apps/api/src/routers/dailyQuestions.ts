import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'
import { awardXP } from '../services/xp'
import { DAILY_QUESTIONS } from '../utils/constants'

export const dailyQuestionsRouter = router({
  getToday: protectedProcedure
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
      const startOfYear = new Date(new Date().getFullYear(), 0, 0)
      const dayOfYear = Math.floor((Date.now() - startOfYear.getTime()) / 86400000)
      const questionIndex = dayOfYear % DAILY_QUESTIONS.length
      const questionId = `daily-${today}`

      return {
        id: questionId,
        question: DAILY_QUESTIONS[questionIndex],
        date: today,
        index: questionIndex,
      }
    }),

  answer: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        questionId: z.string(),
        answer: z.string().min(1).max(1000),
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

      const { error } = await supabase.from('question_answers').upsert({
        pair_id: input.pairId,
        profile_id: ctx.userId,
        question_id: input.questionId,
        answer_text: input.answer,
        answered_at: new Date().toISOString(),
      })

      if (error && !error.message.includes('duplicate')) throw error

      const totalXp = await awardXP(ctx.userId, 10)

      return { success: true, xpAwarded: 10, totalXp }
    }),

  getAnswers: protectedProcedure
    .input(z.object({ pairId: z.string().uuid(), questionId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: members } = await supabase
        .from('pair_members')
        .select('profile_id')
        .eq('pair_id', input.pairId)

      if (!members?.length) throw new Error('Pair not found')

      const memberIds = members.map(m => m.profile_id)

      if (!memberIds.includes(ctx.userId)) throw new Error('Not a member of this pair')

      const { data: answers } = await supabase
        .from('question_answers')
        .select('profile_id, answer_text, answered_at')
        .eq('pair_id', input.pairId)
        .eq('question_id', input.questionId)

      const partnerIds = memberIds.filter(id => id !== ctx.userId)

      return {
        questionId: input.questionId,
        myAnswer: answers?.find(a => a.profile_id === ctx.userId)?.answer_text || null,
        partnerAnswer: answers?.find(a => a.profile_id === partnerIds[0])?.answer_text || null,
        bothAnswered: answers?.length === 2,
      }
    }),
})
