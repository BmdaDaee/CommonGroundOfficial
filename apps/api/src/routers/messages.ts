import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'
import { bentlyChat, bentlyRewrite } from '../services/claude'

export const messagesRouter = router({
  send: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        content: z.string().min(1),
        mode: z.enum(['common', 'deeply']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')
      
      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)
      
      if (!isMember?.length) {
        throw new Error('Not a member of this pair')
      }
      
      const messageMode = input.mode || ctx.mode
      const isIntimate = messageMode === 'deeply'
      
      const { data: pair } = await supabase
        .from('pairs')
        .select('*')
        .eq('id', input.pairId)
        .single()
      
      const { data: history } = await supabase
        .from('messages')
        .select('sender_id, content, created_at')
        .eq('pair_id', input.pairId)
        .order('created_at', { ascending: false })
        .limit(10)
      
      let bentlyResponse: string | null = null
      let bentlySuggestion: string | null = null
      let bentlyRewrites: any[] = []
      
      if (!isIntimate) {
        try {
          const pairHistory = (history || []).reverse().map((msg: any) => ({
            role: msg.sender_id === ctx.userId ? 'user' : 'assistant',
            content: msg.content,
          }))
          
          bentlyResponse = await bentlyChat(
            {
              mode: 'common',
              state: pair?.relational_state,
              pairHistory,
              asymmetries: [],
            },
            input.content
          )
          
          bentlySuggestion = bentlyResponse
          
          const [gentle, direct, collaborative] = await Promise.all([
            bentlyRewrite(input.content, 'gentle'),
            bentlyRewrite(input.content, 'direct'),
            bentlyRewrite(input.content, 'collaborative'),
          ])
          
          bentlyRewrites = [
            { style: 'gentle', text: gentle },
            { style: 'direct', text: direct },
            { style: 'collaborative', text: collaborative },
          ]
        } catch (error) {
          console.error('Bently error:', error)
        }
      }
      
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          pair_id: input.pairId,
          sender_id: ctx.userId,
          content: input.content,
          bently_suggestion: bentlySuggestion,
          bently_rewrite_options: bentlyRewrites,
          mode: messageMode,
        })
        .select()
        .single()
      
      if (error) throw error
      
      return {
        message,
        bentlyResponse,
        bentlyRewrites,
      }
    }),
  
  list: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        mode: z.enum(['common', 'deeply']).optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')
      
      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)
      
      if (!isMember?.length) {
        throw new Error('Not a member of this pair')
      }
      
      let query = supabase
        .from('messages')
        .select('*')
        .eq('pair_id', input.pairId)
      
      if (input.mode) {
        query = query.eq('mode', input.mode)
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(input.limit)
      
      if (error) throw error
      
      return data
    }),
  
  get: protectedProcedure
    .input(z.object({ messageId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')
      
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', input.messageId)
        .single()
      
      if (messageError) throw messageError
      
      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', message.pair_id)
        .eq('profile_id', ctx.userId)
      
      if (!isMember?.length) {
        throw new Error('Not a member of this pair')
      }
      
      return message
    }),
  
  delete: protectedProcedure
    .input(z.object({ messageId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')
      
      const { data: message, error: getError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', input.messageId)
        .single()
      
      if (getError) throw getError
      
      if (message.sender_id !== ctx.userId) {
        throw new Error('Can only delete your own messages')
      }
      
      const { error } = await supabase.from('messages').delete().eq('id', input.messageId)
      
      if (error) throw error
      
      return { success: true }
    }),
})
