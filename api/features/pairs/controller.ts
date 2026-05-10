/**
 * Pair Controller
 * 
 * Business logic and data access patterns for pair operations.
 * Separates concerns from tRPC router definitions.
 */

import { supabase } from '../../lib/supabase'

export interface Measurements {
  availability: 'LOW' | 'MEDIUM' | 'HIGH'
  alignment: 'LOW' | 'MEDIUM' | 'HIGH'
  activation: 'LOW' | 'MEDIUM' | 'HIGH'
  trust: 'LOW' | 'MEDIUM' | 'HIGH'
}

export type RelationalState = 
  | 'CAPACITY_BLOCKED'
  | 'MISALIGNED'
  | 'DORMANT'
  | 'TRUST_FRACTURED'
  | 'ALIGNED'
  | 'UNKNOWN'

/**
 * Derive relational state from measurements
 * 
 * Follows the Relational Engine logic:
 * - CAPACITY_BLOCKED: availability LOW (survival mode)
 * - MISALIGNED: alignment LOW (incompatible directions)
 * - DORMANT: alignment OK, activation LOW (asleep)
 * - TRUST_FRACTURED: alignment OK, activation OK, trust LOW (broken confidence)
 * - ALIGNED: all four HIGH (solid capacity)
 * - UNKNOWN: anything else
 */
export function deriveRelationalState(measurements: Measurements): RelationalState {
  const { availability, alignment, activation, trust } = measurements

  // Highest priority: survival capacity
  if (availability === 'LOW') {
    return 'CAPACITY_BLOCKED'
  }

  // Next: directional alignment
  if (alignment === 'LOW') {
    return 'MISALIGNED'
  }

  // Then: activation/engagement
  if (alignment !== 'LOW' && activation === 'LOW') {
    return 'DORMANT'
  }

  // Then: trust foundation
  if (alignment !== 'LOW' && activation !== 'LOW' && trust === 'LOW') {
    return 'TRUST_FRACTURED'
  }

  // Fully aligned
  if (
    availability === 'HIGH' &&
    alignment === 'HIGH' &&
    activation === 'HIGH' &&
    trust === 'HIGH'
  ) {
    return 'ALIGNED'
  }

  return 'UNKNOWN'
}

/**
 * Measure pair capacity by reading recent interactions
 * 
 * If direct measurements provided, use those.
 * Otherwise, infer from:
 * - Message frequency (availability)
 * - Agreement patterns (alignment)
 * - Engagement depth (activation)
 * - Consistency (trust)
 */
export async function measurePairCapacity(
  pairId: string,
  directMeasurements?: Partial<Measurements>
): Promise<Measurements> {
  // If all measurements provided directly, use those
  if (
    directMeasurements?.availability &&
    directMeasurements?.alignment &&
    directMeasurements?.activation &&
    directMeasurements?.trust
  ) {
    return {
      availability: directMeasurements.availability,
      alignment: directMeasurements.alignment,
      activation: directMeasurements.activation,
      trust: directMeasurements.trust,
    }
  }

  // Otherwise, infer from recent data
  return inferMeasurementsFromData(pairId, directMeasurements)
}

/**
 * Infer measurements from recent pair interactions
 * 
 * Looks at:
 * - Message frequency / time gaps (availability)
 * - Message sentiment / agreement (alignment)
 * - Engagement depth in exercises (activation)
 * - Consistency between words and actions (trust)
 */
async function inferMeasurementsFromData(
  pairId: string,
  directMeasurements?: Partial<Measurements>
): Promise<Measurements> {
  // Get recent messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('pair_id', pairId)
    .order('created_at', { ascending: false })
    .limit(50)

  // Get recent exercises/missions completion
  const { data: exercises } = await supabase
    .from('trust_exercises')
    .select('*')
    .eq('pair_id', pairId)
    .order('completed_at', { ascending: false })
    .limit(10)

  // Get latest relational state history for consistency check
  const { data: history } = await supabase
    .from('relational_state_history')
    .select('*')
    .eq('pair_id', pairId)
    .order('recorded_at', { ascending: false })
    .limit(1)

  // Infer availability (message frequency)
  const availability = inferAvailability(messages)

  // Infer alignment (would need NLP or explicit user input in real implementation)
  const alignment = directMeasurements?.alignment || inferAlignment(messages)

  // Infer activation (exercise engagement)
  const activation = directMeasurements?.activation || inferActivation(exercises)

  // Infer trust (consistency between recent patterns)
  const trust = directMeasurements?.trust || inferTrust(messages, history)

  return {
    availability,
    alignment,
    activation,
    trust,
  }
}

function inferAvailability(messages: any[] | null): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (!messages?.length) return 'LOW'

  // Check frequency: are they messaging regularly?
  const now = new Date()
  const last7Days = messages.filter(m => {
    const msgDate = new Date(m.created_at)
    return (now.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24) <= 7
  })

  if (last7Days.length < 5) return 'LOW'
  if (last7Days.length < 20) return 'MEDIUM'
  return 'HIGH'
}

function inferAlignment(messages: any[] | null): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (!messages?.length) return 'UNKNOWN'

  // In a real system, this would use NLP to detect agreement/disagreement.
  // For now, we default to MEDIUM as a placeholder.
  // TODO: Integrate sentiment analysis or explicit user reporting

  return 'MEDIUM'
}

function inferActivation(exercises: any[] | null): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (!exercises?.length) return 'LOW'

  const completed = exercises.filter(e => e.status === 'completed')

  if (completed.length === 0) return 'LOW'
  if (completed.length < 3) return 'MEDIUM'
  return 'HIGH'
}

function inferTrust(messages: any[] | null, history: any[] | null): 'LOW' | 'MEDIUM' | 'HIGH' {
  // If state has been consistently the same, trust is stable
  if (history?.length && history[0].state === 'ALIGNED') {
    return 'HIGH'
  }

  // If messages are present and frequent, assume medium trust
  if (messages?.length && messages.length > 10) {
    return 'MEDIUM'
  }

  // Default to medium for unknowns
  return 'MEDIUM'
}

/**
 * Get pair with members (helper used in routers)
 */
export async function getPairWithMembers(pairId: string) {
  const { data: pair } = await supabase
    .from('pairs')
    .select('*')
    .eq('id', pairId)
    .single()

  const { data: members } = await supabase
    .from('pair_members')
    .select('*')
    .eq('pair_id', pairId)

  return { pair, members: members || [] }
}

/**
 * Verify user membership in pair
 */
export async function verifyPairMembership(pairId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('pair_members')
    .select('*')
    .eq('pair_id', pairId)
    .eq('user_id', userId)

  return !!data?.length
}
