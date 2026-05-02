import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'

type RelationalState = 'CAPACITY_BLOCKED' | 'MISALIGNED' | 'DORMANT' | 'TRUST_FRACTURED' | 'ALIGNED' | 'UNKNOWN'
type MeasurementLevel = 'LOW' | 'MEDIUM' | 'HIGH'

interface Measurements {
  availability: MeasurementLevel
  alignment: MeasurementLevel
  activation: MeasurementLevel
  trust: MeasurementLevel
}

function deriveState(measurements: Measurements, asymmetries: string[]): RelationalState {
  const { availability, alignment, activation, trust } = measurements
  
  if (availability === 'LOW') return 'CAPACITY_BLOCKED'
  if (alignment === 'LOW') return 'MISALIGNED'
  if (alignment !== 'LOW' && activation === 'LOW') return 'DORMANT'
  if (alignment !== 'LOW' && activation !== 'LOW' && trust === 'LOW') return 'TRUST_FRACTURED'
  if (availability === 'HIGH' && alignment === 'HIGH' && activation === 'HIGH' && trust === 'HIGH') {
    return 'ALIGNED'
  }
  
  return 'UNKNOWN'
}

export const relationalEngineRouter = router({
  measure: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        availability: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        alignment: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        activation: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        trust: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        notes: z.string().optional(),
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
      
      const measurements: Measurements = {
        availability: input.availability,
        alignment: input.alignment,
        activation: input.activation,
        trust: input.trust,
      }
      
      const newState = deriveState(measurements, [])
      
      const { error: historyError } = await supabase
        .from('relational_state_history')
        .insert({
          pair_id: input.pairId,
          state: newState,
          availability: input.availability,
          alignment: input.alignment,
          activation: input.activation,
          trust: input.trust,
          asymmetries: [],
          recorded_at: new Date().toISOString(),
        })
      
      if (historyError) throw historyError
      
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
  
  getState: protectedProcedure
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
      
      const { data: pair, error: pairError } = await supabase
        .from('pairs')
        .select('*')
        .eq('id', input.pairId)
        .single()
      
      if (pairError) throw pairError
      
      const { data: latestHistory, error: historyError } = await supabase
        .from('relational_state_history')
        .select('*')
        .eq('pair_id', input.pairId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single()
      
      if (historyError && historyError.code !== 'PGRST116') throw historyError
      
      return {
        pair,
        latestMeasurement: latestHistory,
      }
    }),
  
  getHistory: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        limit: z.number().default(20),
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
      
      const { data, error } = await supabase
        .from('relational_state_history')
        .select('*')
        .eq('pair_id', input.pairId)
        .order('recorded_at', { ascending: false })
        .limit(input.limit)
      
      if (error) throw error
      
      return data
    }),
  
  measureNow: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        availability: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        alignment: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        activation: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        trust: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        notes: z.string().optional(),
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

      const measurements: Measurements = {
        availability: input.availability,
        alignment: input.alignment,
        activation: input.activation,
        trust: input.trust,
      }

      const newState = deriveState(measurements, [])

      const { error: historyError } = await supabase
        .from('relational_state_history')
        .insert({
          pair_id: input.pairId,
          state: newState,
          availability: input.availability,
          alignment: input.alignment,
          activation: input.activation,
          trust: input.trust,
          asymmetries: [],
          recorded_at: new Date().toISOString(),
        })

      if (historyError) throw historyError

      const { data: updatedPair, error: pairError } = await supabase
        .from('pairs')
        .update({ relational_state: newState })
        .eq('id', input.pairId)
        .select()
        .single()

      if (pairError) throw pairError

      return { measurements, state: newState, pair: updatedPair }
    }),

  getInsights: protectedProcedure
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
      
      const { data: history, error } = await supabase
        .from('relational_state_history')
        .select('*')
        .eq('pair_id', input.pairId)
        .order('recorded_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      
      const stateFrequency = (history || []).reduce(
        (acc, record) => {
          acc[record.state] = (acc[record.state] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )
      
      const dominantState = Object.entries(stateFrequency).sort(([, a], [, b]) => b - a)[0]?.[0]
      
      return {
        mostRecentState: history?.[0]?.state || 'UNKNOWN',
        dominantState,
        stateFrequency,
        measurementCount: history?.length || 0,
      }
    }),
})
