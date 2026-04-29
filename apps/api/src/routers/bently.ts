import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'
import { bentlyChat, bentlyRewrite, BentlyContext } from '../services/claude'

export const bentlyRouter = router({
  chat: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        message: z.string().min(1).max(2000),
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

      const { data: recentMessages } = await supabase
        .from('messages')
        .select('sender_id, content')
        .eq('pair_id', input.pairId)
        .eq('mode', input.mode)
        .order('created_at', { ascending: false })
        .limit(10)

      const { data: pair } = await supabase
        .from('pairs')
        .select('relational_state')
        .eq('id', input.pairId)
        .single()

      const pairHistory = (recentMessages || [])
        .reverse()
        .map(m => ({
          role: m.sender_id === ctx.userId ? 'user' : 'assistant',
          content: m.content,
        }))

      const context: BentlyContext = {
        mode: input.mode,
        state: pair?.relational_state || undefined,
        pairHistory,
      }

      const response = await bentlyChat(context, input.message)

      await supabase.from('bently_interventions').insert({
        pair_id: input.pairId,
        state: pair?.relational_state || null,
        overlay_type: input.mode,
        intervention_text: response,
        user_response: input.message,
      })

      return { response, mode: input.mode }
    }),

  rewrite: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(2000),
        style: z.enum(['gentle', 'direct', 'collaborative']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const rewritten = await bentlyRewrite(input.message, input.style)

      return { original: input.message, rewritten, style: input.style }
    }),

  getHistory: protectedProcedure
    .input(z.object({ pairId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)

      if (!isMember?.length) throw new Error('Not a member of this pair')

      const { data } = await supabase
        .from('bently_interventions')
        .select('*')
        .eq('pair_id', input.pairId)
        .order('created_at', { ascending: false })
        .limit(50)

      return data || []
    }),
})
