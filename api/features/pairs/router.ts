import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase, getPairWithMembers } from '../../lib/supabase'
import { measurePairCapacity, deriveRelationalState } from './relationalEngine'
import crypto from 'crypto'

/**
 * Pair Management Router
 * 
 * Handles pair creation, joining, member management, and state updates.
 * Integrates with Relational Engine for capacity measurement and state derivation.
 */

// ============= Input Schemas =============

const CreatePairInput = z.object({
  relationshipStartDate: z.string().optional(),
  displayName: z.string().optional(),
})

const JoinPairInput = z.object({
  pairCode: z.string().length(6),
})

const GetPairInput = z.object({
  pairId: z.string().uuid(),
})

const UpdatePairInput = z.object({
  pairId: z.string().uuid(),
  status: z.enum(['active', 'paused', 'ended']).optional(),
  relationalState: z
    .enum(['CAPACITY_BLOCKED', 'MISALIGNED', 'DORMANT', 'TRUST_FRACTURED', 'ALIGNED', 'UNKNOWN'])
    .optional(),
})

const LeavePairInput = z.object({
  pairId: z.string().uuid(),
})

// ============= Helper Functions =============

function generatePairCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 6)
}

/**
 * Initialize pair on creation
 * - Create pair record
 * - Add initiator as member
 * - Set up XP tracking
 * - Trigger initial state measurement
 */
async function initializePair(userId: string, pairCode: string, relationshipStartDate?: string) {
  // Create pair
  const { data: pair, error: pairError } = await supabase
    .from('pairs')
    .insert({
      pair_code: pairCode,
      status: 'active',
      relationship_start_date: relationshipStartDate || null,
      relational_state: 'UNKNOWN',
    })
    .select()
    .single()

  if (pairError) throw pairError

  // Add initiator as member
  const { error: memberError } = await supabase
    .from('pair_members')
    .insert({
      pair_id: pair.id,
      user_id: userId,
      role: 'initiator',
    })

  if (memberError) throw memberError

  // Initialize XP tracking
  const { error: xpError } = await supabase
    .from('user_xp')
    .insert({
      user_id: userId,
      pair_id: pair.id,
      total_xp: 0,
      rank: 'SPARK',
      streak: 0,
    })

  if (xpError) throw xpError

  return pair
}

// ============= Router Procedures =============

export const pairsRouter = router({
  /**
   * create: Initialize a new pair relationship
   * 
   * Creates pair record, adds initiator, sets up tracking.
   * Initiator can share pair code with partner to join.
   */
  create: protectedProcedure
    .input(CreatePairInput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const pairCode = generatePairCode()

      try {
        const pair = await initializePair(ctx.userId, pairCode, input.relationshipStartDate)
        return {
          pair,
          pairCode,
          message: 'Pair created. Share the code with your partner to join.',
        }
      } catch (error) {
        throw new Error(`Failed to create pair: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }),

  /**
   * join: Join an existing pair via code
   * 
   * Verifies pair exists and is active, adds user as partner.
   * Cannot join if already a member.
   */
  join: protectedProcedure
    .input(JoinPairInput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      // Find pair by code
      const { data: pair, error: pairError } = await supabase
        .from('pairs')
        .select('*')
        .eq('pair_code', input.pairCode)
        .eq('status', 'active')
        .single()

      if (pairError) throw new Error('Pair not found or inactive')

      // Check if already a member
      const { data: existing } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', pair.id)
        .eq('user_id', ctx.userId)

      if (existing?.length) {
        throw new Error('You are already a member of this pair')
      }

      // Add as partner
      const { error: memberError } = await supabase
        .from('pair_members')
        .insert({
          pair_id: pair.id,
          user_id: ctx.userId,
          role: 'partner',
        })

      if (memberError) throw memberError

      // Initialize XP tracking for new member
      const { error: xpError } = await supabase
        .from('user_xp')
        .insert({
          user_id: ctx.userId,
          pair_id: pair.id,
          total_xp: 0,
          rank: 'SPARK',
          streak: 0,
        })

      if (xpError) throw xpError

      return {
        pair,
        message: 'Successfully joined the pair. Welcome!',
      }
    }),

  /**
   * list: Get all pairs the user is a member of
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('pair_members')
      .select('pairs(*)')
      .eq('user_id', ctx.userId)

    if (error) throw error

    return data?.map(pm => pm.pairs).filter(Boolean) || []
  }),

  /**
   * get: Retrieve full pair details including members and profiles
   * 
   * User must be a member to access. Returns pair record with member profiles.
   */
  get: protectedProcedure
    .input(GetPairInput)
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      // Verify user is a member
      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('user_id', ctx.userId)

      if (!isMember?.length) {
        throw new Error('You are not a member of this pair')
      }

      const { pair, members } = await getPairWithMembers(input.pairId)

      const userIds = members.map(m => m.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, zodiac_sign')
        .in('id', userIds)

      return {
        pair,
        members: members.map(m => ({
          ...m,
          profile: profiles?.find(p => p.id === m.user_id),
        })),
      }
    }),

  /**
   * update: Update pair status or relational state
   * 
   * Can update pair status (active/paused/ended) and relational state.
   * State changes are logged to relational_state_history.
   */
  update: protectedProcedure
    .input(UpdatePairInput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      // Verify user is a member
      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('user_id', ctx.userId)

      if (!isMember?.length) {
        throw new Error('You are not a member of this pair')
      }

      const updateData: Record<string, any> = {}
      if (input.status) updateData.status = input.status
      if (input.relationalState) updateData.relational_state = input.relationalState

      const { data, error } = await supabase
        .from('pairs')
        .update(updateData)
        .eq('id', input.pairId)
        .select()
        .single()

      if (error) throw error

      // Log state change if provided
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

  /**
   * leave: Remove user from pair
   * 
   * Removes user as member. If no members remain, pair is marked as ended.
   */
  leave: protectedProcedure
    .input(LeavePairInput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('pair_members')
        .delete()
        .eq('pair_id', input.pairId)
        .eq('user_id', ctx.userId)

      if (error) throw error

      // Check if any members remain
      const { data: remaining } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)

      // If no members, mark pair as ended
      if (!remaining?.length) {
        await supabase
          .from('pairs')
          .update({ status: 'ended' })
          .eq('id', input.pairId)
      }

      return { success: true, message: 'You have left the pair.' }
    }),

  /**
   * measureNow: Trigger immediate Relational Engine measurement for pair
   * 
   * Measures current couple capacity across 4 dimensions and derives state.
   * Optional: provide direct measurements, otherwise engine infers from recent data.
   */
  measureNow: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        availability: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
        alignment: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
        activation: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
        trust: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      // Verify user is a member
      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('user_id', ctx.userId)

      if (!isMember?.length) {
        throw new Error('You are not a member of this pair')
      }

      // Measure capacity
      const measurements = await measurePairCapacity(input.pairId, {
        availability: input.availability,
        alignment: input.alignment,
        activation: input.activation,
        trust: input.trust,
      })

      // Derive new state
      const newState = deriveRelationalState(measurements)

      // Log measurement
      const { error: historyError } = await supabase
        .from('relational_state_history')
        .insert({
          pair_id: input.pairId,
          state: newState,
          availability: measurements.availability,
          alignment: measurements.alignment,
          activation: measurements.activation,
          trust: measurements.trust,
          recorded_at: new Date().toISOString(),
        })

      if (historyError) throw historyError

      // Update pair with new state
      const { data: updatedPair, error: pairError } = await supabase
        .from('pairs')
        .update({ relational_state: newState })
        .eq('id', input.pairId)
        .select()
        .single()

      if (pairError) throw pairError

      return {
        measurements,
        state: newState,
        pair: updatedPair,
      }
    }),

  /**
   * getHistory: Retrieve relational state history for pair
   * 
   * Returns time-series of state changes and measurements.
   * Useful for understanding relationship trajectory and intervention timing.
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        limit: z.number().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      // Verify user is a member
      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('user_id', ctx.userId)

      if (!isMember?.length) {
        throw new Error('You are not a member of this pair')
      }

      const { data, error } = await supabase
        .from('relational_state_history')
        .select('*')
        .eq('pair_id', input.pairId)
        .order('recorded_at', { ascending: false })
        .limit(input.limit)

      if (error) throw error

      return data || []
    }),
})
