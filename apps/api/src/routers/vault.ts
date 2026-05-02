import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'

export const vaultRouter = router({
  getMemories: protectedProcedure
    .input(z.object({ pairId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)

      if (!isMember?.length) throw new Error('Not a member of this pair')

      const { data: memories } = await supabase
        .from('vault_memories')
        .select('*')
        .eq('pair_id', input.pairId)
        .order('created_at', { ascending: false })

      return memories || []
    }),

  addMemory: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        title: z.string().min(1).max(200),
        content: z.string().max(5000).optional(),
        category: z.enum(['scene', 'milestone', 'moment']).optional(),
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
        .from('vault_memories')
        .insert({
          pair_id: input.pairId,
          title: input.title,
          content: input.content || null,
          category: input.category || 'moment',
        })
        .select()
        .single()

      if (error) throw error

      return data
    }),

  deleteMemory: protectedProcedure
    .input(z.object({ pairId: z.string().uuid(), memoryId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)

      if (!isMember?.length) throw new Error('Not a member of this pair')

      const { error } = await supabase
        .from('vault_memories')
        .delete()
        .eq('id', input.memoryId)
        .eq('pair_id', input.pairId)

      if (error) throw error

      return { success: true }
    }),

  createScene: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        title: z.string().min(1).max(200),
        content: z.string().max(5000).optional(),
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
        .from('vault_memories')
        .insert({
          pair_id: input.pairId,
          title: input.title,
          content: input.content || null,
          category: 'scene',
        })
        .select()
        .single()

      if (error) throw error

      return data
    }),

  addMilestone: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        title: z.string().min(1).max(200),
        content: z.string().max(5000).optional(),
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
        .from('vault_memories')
        .insert({
          pair_id: input.pairId,
          title: input.title,
          content: input.content || null,
          category: 'milestone',
        })
        .select()
        .single()

      if (error) throw error

      return data
    }),
})
