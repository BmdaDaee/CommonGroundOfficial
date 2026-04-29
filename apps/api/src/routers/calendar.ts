import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'

export const calendarRouter = router({
  getEvents: protectedProcedure
    .input(z.object({ pairId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members').select('*')
        .eq('pair_id', input.pairId).eq('profile_id', ctx.userId)
      if (!isMember?.length) throw new Error('Not a member of this pair')

      const { data: events } = await supabase
        .from('calendar_events').select('*')
        .eq('pair_id', input.pairId)
        .order('event_date', { ascending: true })

      return events || []
    }),

  create: protectedProcedure
    .input(z.object({
      pairId: z.string().uuid(),
      title: z.string().min(1).max(200),
      description: z.string().max(1000).optional(),
      eventDate: z.string(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members').select('*')
        .eq('pair_id', input.pairId).eq('profile_id', ctx.userId)
      if (!isMember?.length) throw new Error('Not a member of this pair')

      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          pair_id: input.pairId,
          title: input.title,
          description: input.description || null,
          event_date: input.eventDate,
          start_time: input.startTime || null,
          end_time: input.endTime || null,
        })
        .select().single()

      if (error) throw error
      return data
    }),

  delete: protectedProcedure
    .input(z.object({ pairId: z.string().uuid(), eventId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members').select('*')
        .eq('pair_id', input.pairId).eq('profile_id', ctx.userId)
      if (!isMember?.length) throw new Error('Not a member of this pair')

      const { error } = await supabase
        .from('calendar_events').delete()
        .eq('id', input.eventId).eq('pair_id', input.pairId)

      if (error) throw error
      return { success: true }
    }),
})
