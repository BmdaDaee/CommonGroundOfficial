import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase, getPairWithMembers } from '../lib/supabase'
import crypto from 'crypto'

function generatePairCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 6)
}

export const pairsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        relationshipStartDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')
      
      const pairCode = generatePairCode()
      
      const { data: pair, error: pairError } = await supabase
        .from('pairs')
        .insert({
          pair_code: pairCode,
          status: 'active',
          relationship_start_date: input.relationshipStartDate || null,
          relational_state: 'UNKNOWN',
        })
        .select()
        .single()
      
      if (pairError) throw pairError
      
      const { error: memberError } = await supabase
        .from('pair_members')
        .insert({
          pair_id: pair.id,
          profile_id: ctx.userId,
          role: 'initiator',
        })
      
      if (memberError) throw memberError
      
      await supabase
        .from('pair_rankings')
        .insert({
          pair_id: pair.id,
          total_xp: 0,
          level: 1,
        })
      
      return pair
    }),
  
  join: protectedProcedure
    .input(
      z.object({
        pairCode: z.string().length(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')
      
      const { data: pair, error: pairError } = await supabase
        .from('pairs')
        .select('*')
        .eq('pair_code', input.pairCode)
        .eq('status', 'active')
        .single()
      
      if (pairError) throw new Error('Pair not found or inactive')
      
      const { data: existing } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', pair.id)
        .eq('profile_id', ctx.userId)
      
      if (existing?.length) {
        throw new Error('Already a member of this pair')
      }
      
      const { error: memberError } = await supabase
        .from('pair_members')
        .insert({
          pair_id: pair.id,
          profile_id: ctx.userId,
          role: 'partner',
        })
      
      if (memberError) throw memberError
      
      return pair
    }),
  
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) throw new Error('Not authenticated')
    
    const { data, error } = await supabase
      .from('pair_members')
      .select('pairs(*)')
      .eq('profile_id', ctx.userId)
    
    if (error) throw error
    
    return data?.map(pm => pm.pairs).filter(Boolean) || []
  }),
  
  get: protectedProcedure
    .input(z.object({ pairId: z.string().uuid() }))
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
      
      const { pair, members } = await getPairWithMembers(input.pairId)
      
      const profileIds = members.map(m => m.profile_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, zodiac_sign')
        .in('id', profileIds)
      
      return {
        pair,
        members: members.map(m => ({
          ...m,
          profile: profiles?.find(p => p.id === m.profile_id),
        })),
      }
    }),
  
  update: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        status: z.enum(['active', 'paused', 'ended']).optional(),
        relationalState: z
          .enum(['CAPACITY_BLOCKED', 'MISALIGNED', 'DORMANT', 'TRUST_FRACTURED', 'ALIGNED', 'UNKNOWN'])
          .optional(),
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
      
      const { data, error } = await supabase
        .from('pairs')
        .update({
          status: input.status,
          relational_state: input.relationalState,
        })
        .eq('id', input.pairId)
        .select()
        .single()
      
      if (error) throw error
      
      if (input.relationalState) {
        await supabase
          .from('relational_state_history')
          .insert({
            pair_id: input.pairId,
            state: input.relationalState,
            recorded_at: new Date().toISOString(),
          })
      }
      
      return data
    }),
  
  leave: protectedProcedure
    .input(z.object({ pairId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')
      
      const { error } = await supabase
        .from('pair_members')
        .delete()
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)
      
      if (error) throw error
      
      const { data: remaining } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
      
      if (!remaining?.length) {
        await supabase
          .from('pairs')
          .update({ status: 'ended' })
          .eq('id', input.pairId)
      }
      
      return { success: true }
    }),
})
