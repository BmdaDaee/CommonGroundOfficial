import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'
import { analyzeJournal } from '../services/claude'

const MOODS = ['joyful', 'content', 'neutral', 'anxious', 'frustrated', 'sad', 'angry', 'hopeful'] as const

export const journalRouter = router({
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

      const { data: entries } = await supabase
        .from('journal_entries')
        .select('id, title, content, mood, ai_analysis, created_at, updated_at')
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)
        .order('created_at', { ascending: false })

      return entries || []
    }),

  create: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        title: z.string().max(200).optional(),
        content: z.string().min(1).max(10000),
        mood: z.enum(MOODS).optional(),
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

      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          pair_id: input.pairId,
          profile_id: ctx.userId,
          title: input.title || null,
          content: input.content,
          mood: input.mood || null,
        })
        .select()
        .single()

      if (error) throw error

      return data
    }),

  analyze: protectedProcedure
    .input(z.object({ pairId: z.string().uuid(), entryId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: entry } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', input.entryId)
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)
        .single()

      if (!entry) throw new Error('Journal entry not found')

      const analysis = await analyzeJournal(entry.content)

      const { error } = await supabase
        .from('journal_entries')
        .update({ ai_analysis: analysis, updated_at: new Date().toISOString() })
        .eq('id', input.entryId)

      if (error) throw error

      return { entryId: input.entryId, analysis }
    }),

  delete: protectedProcedure
    .input(z.object({ pairId: z.string().uuid(), entryId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', input.entryId)
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)

      if (error) throw error

      return { success: true }
    }),
})
