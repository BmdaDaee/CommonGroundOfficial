import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'
import { suggestListItems } from '../services/claude'

const LIST_TYPES = ['bucket', 'groceries', 'goals', 'wishlist'] as const

export const listsRouter = router({
  get: protectedProcedure
    .input(z.object({ pairId: z.string().uuid(), listType: z.enum(LIST_TYPES) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members').select('*')
        .eq('pair_id', input.pairId).eq('profile_id', ctx.userId)
      if (!isMember?.length) throw new Error('Not a member of this pair')

      let list = await supabase
        .from('shared_lists').select('*')
        .eq('pair_id', input.pairId).eq('list_type', input.listType).single()

      if (!list.data) {
        const created = await supabase
          .from('shared_lists')
          .insert({ pair_id: input.pairId, title: input.listType, list_type: input.listType })
          .select().single()
        list = created
      }

      if (!list.data) throw new Error('Could not get or create list')

      const { data: items } = await supabase
        .from('list_items').select('*')
        .eq('list_id', list.data.id)
        .order('created_at', { ascending: true })

      return { ...list.data, items: items || [] }
    }),

  create: protectedProcedure
    .input(z.object({
      pairId: z.string().uuid(),
      listType: z.enum(LIST_TYPES),
      content: z.string().min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members').select('*')
        .eq('pair_id', input.pairId).eq('profile_id', ctx.userId)
      if (!isMember?.length) throw new Error('Not a member of this pair')

      let { data: list } = await supabase
        .from('shared_lists').select('id')
        .eq('pair_id', input.pairId).eq('list_type', input.listType).single()

      if (!list) {
        const created = await supabase
          .from('shared_lists')
          .insert({ pair_id: input.pairId, title: input.listType, list_type: input.listType })
          .select().single()
        list = created.data
      }

      if (!list) throw new Error('Could not get or create list')

      const { data, error } = await supabase
        .from('list_items')
        .insert({ list_id: list.id, content: input.content, created_by: ctx.userId })
        .select().single()

      if (error) throw error
      return data
    }),

  toggle: protectedProcedure
    .input(z.object({ pairId: z.string().uuid(), itemId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members').select('*')
        .eq('pair_id', input.pairId).eq('profile_id', ctx.userId)
      if (!isMember?.length) throw new Error('Not a member of this pair')

      const { data: item } = await supabase
        .from('list_items').select('completed').eq('id', input.itemId).single()
      if (!item) throw new Error('Item not found')

      const { data, error } = await supabase
        .from('list_items').update({ completed: !item.completed })
        .eq('id', input.itemId).select().single()

      if (error) throw error
      return data
    }),

  delete: protectedProcedure
    .input(z.object({ pairId: z.string().uuid(), itemId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members').select('*')
        .eq('pair_id', input.pairId).eq('profile_id', ctx.userId)
      if (!isMember?.length) throw new Error('Not a member of this pair')

      const { error } = await supabase.from('list_items').delete().eq('id', input.itemId)
      if (error) throw error
      return { success: true }
    }),

  suggestAI: protectedProcedure
    .input(z.object({
      pairId: z.string().uuid(),
      listType: z.enum(LIST_TYPES),
      context: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members').select('*')
        .eq('pair_id', input.pairId).eq('profile_id', ctx.userId)
      if (!isMember?.length) throw new Error('Not a member of this pair')

      const suggestions = await suggestListItems(input.listType, input.context || '')
      return { suggestions }
    }),
})
