/**
 * Relational Engine Integration for Pairs
 * 
 * Wires the Relational Engine into pair operations.
 * Handles measurement collection, state derivation, and intervention triggering.
 */

import { supabase } from '../../lib/supabase'

export type MeasurementLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Measurements {
  availability: MeasurementLevel
  alignment: MeasurementLevel
  activation: MeasurementLevel
  trust: MeasurementLevel
}

export type RelationalState = 
  | 'CAPACITY_BLOCKED'
  | 'MISALIGNED'
  | 'DORMANT'
  | 'TRUST_FRACTURED'
  | 'ALIGNED'
  | 'UNKNOWN'

/**
 * Derive relational state from the four measurements
 * 
 * This follows the Relational Engine specification exactly:
 * https://github.com/AnarchyXMayhem/CommonGround/blob/main/Relational_Engine_Spec.md
 */
export function deriveRelationalState(measurements: Measurements): RelationalState {
  const { availability, alignment, activation, trust } = measurements

  // Priority 1: Survival capacity (Availability)
  // If either partner can't show up, everything else is secondary
  if (availability === 'LOW') {
    return 'CAPACITY_BLOCKED'
  }

  // Priority 2: Directional alignment
  // If partners are pulling in different directions, that's structural
  if (alignment === 'LOW') {
    return 'MISALIGNED'
  }

  // Priority 3: Activation/engagement
  // They're aligned but not reaching each other
  if (alignment !== 'LOW' && activation === 'LOW') {
    return 'DORMANT'
  }

  // Priority 4: Trust foundation
  // Everything works except the trust is broken
  if (alignment !== 'LOW' && activation !== 'LOW' && trust === 'LOW') {
    return 'TRUST_FRACTURED'
  }

  // Fully aligned across all dimensions
  if (
    availability === 'HIGH' &&
    alignment === 'HIGH' &&
    activation === 'HIGH' &&
    trust === 'HIGH'
  ) {
    return 'ALIGNED'
  }

  // Catch-all for anything that doesn't fit the pattern
  return 'UNKNOWN'
}

/**
 * Measure pair capacity
 * 
 * Collects or infers measurements across the four dimensions.
 * Can accept direct measurements or infer from behavioral data.
 */
export async function measurePairCapacity(
  pairId: string,
  directMeasurements?: Partial<Measurements>
): Promise<Measurements> {
  // If all dimensions are directly provided, use those
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

  // Otherwise, infer from recent interactions
  const measurements = await inferMeasurementsFromBehavior(pairId)
  
  // Override with any directly provided values
  return {
    availability: directMeasurements?.availability || measurements.availability,
    alignment: directMeasurements?.alignment || measurements.alignment,
    activation: directMeasurements?.activation || measurements.activation,
    trust: directMeasurements?.trust || measurements.trust,
  }
}

/**
 * Infer measurements from recent pair behavior
 * 
 * Analyzes:
 * - Availability: message frequency, time gaps (are they showing up?)
 * - Alignment: daily questions, exercise completion (are they moving together?)
 * - Activation: engagement depth, mission attempts (are they reaching?)
 * - Trust: consistency between words/actions, exercises like trust walks
 */
async function inferMeasurementsFromBehavior(pairId: string): Promise<Measurements> {
  // Collect recent data
  const [messages, exercises, questions, missions] = await Promise.all([
    supabase
      .from('messages')
      .select('*')
      .eq('pair_id', pairId)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('trust_exercises')
      .select('*')
      .eq('pair_id', pairId)
      .order('completed_at', { ascending: false })
      .limit(20),
    supabase
      .from('daily_questions')
      .select('*')
      .eq('pair_id', pairId)
      .order('created_at', { ascending: false })
      .limit(14), // Last 2 weeks
    supabase
      .from('missions')
      .select('*')
      .eq('pair_id', pairId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return {
    availability: inferAvailability(messages.data),
    alignment: inferAlignment(questions.data, missions.data),
    activation: inferActivation(exercises.data, missions.data),
    trust: inferTrust(exercises.data, messages.data),
  }
}

/**
 * Availability: Are they showing up?
 * 
 * Looks at message frequency and consistency.
 * LOW: Haven't messaged in 7+ days
 * MEDIUM: Sporadic messaging (1-2 per day on average)
 * HIGH: Regular daily contact (3+ per day on average)
 */
function inferAvailability(messages: any[] | null): MeasurementLevel {
  if (!messages?.length) return 'LOW'

  const now = new Date()
  
  // Messages in last 7 days
  const last7Days = messages.filter(m => {
    const msgDate = new Date(m.created_at)
    const daysDiff = (now.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff <= 7
  })

  if (last7Days.length === 0) return 'LOW'
  if (last7Days.length < 10) return 'MEDIUM'
  return 'HIGH'
}

/**
 * Alignment: Are they moving in the same direction?
 * 
 * Looks at daily question agreement and mission compatibility.
 * LOW: Conflicting answers, abandoned missions together
 * MEDIUM: Some agreement, inconsistent follow-through
 * HIGH: Aligned on values, completing missions together
 * 
 * NOTE: Real implementation would need NLP for sentiment analysis.
 * For now, this is a placeholder that defaults to MEDIUM.
 */
function inferAlignment(questions: any[] | null, missions: any[] | null): MeasurementLevel {
  // TODO: Integrate sentiment analysis or explicit agreement tracking
  // For now, assume medium alignment based on engagement
  
  if (!questions?.length && !missions?.length) return 'MEDIUM'
  
  return 'MEDIUM'
}

/**
 * Activation: Are they reaching for each other?
 * 
 * Looks at exercise and mission engagement.
 * LOW: No exercises or missions started
 * MEDIUM: Started some, completed few
 * HIGH: Actively completing exercises, trying missions
 */
function inferActivation(exercises: any[] | null, missions: any[] | null): MeasurementLevel {
  const exerciseCount = exercises?.filter(e => e.status === 'completed').length || 0
  const missionCount = missions?.filter(m => m.status === 'completed').length || 0

  const totalCompleted = exerciseCount + missionCount

  if (totalCompleted === 0) return 'LOW'
  if (totalCompleted < 3) return 'MEDIUM'
  return 'HIGH'
}

/**
 * Trust: Is the foundation solid?
 * 
 * Looks at consistency and repair attempts.
 * LOW: Trust exercises failed/skipped, hedging behavior
 * MEDIUM: Some trust exercises, occasional repair attempts
 * HIGH: Consistent trust behaviors, repair practiced
 */
function inferTrust(exercises: any[] | null, messages: any[] | null): MeasurementLevel {
  // Trust exercises are the most direct signal
  const trustExercises = exercises?.filter(e => e.status === 'completed').length || 0

  if (trustExercises === 0) {
    // No trust exercises—conservative estimate
    return 'MEDIUM'
  }

  if (trustExercises < 2) return 'MEDIUM'
  return 'HIGH'
}

/**
 * Get the latest measurement for a pair
 */
export async function getLatestMeasurement(pairId: string) {
  const { data, error } = await supabase
    .from('relational_state_history')
    .select('*')
    .eq('pair_id', pairId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  if (error) throw error
  return data
}

/**
 * Log a measurement to history
 */
export async function logMeasurement(
  pairId: string,
  measurements: Measurements,
  state: RelationalState
) {
  const { error } = await supabase
    .from('relational_state_history')
    .insert({
      pair_id: pairId,
      state,
      availability: measurements.availability,
      alignment: measurements.alignment,
      activation: measurements.activation,
      trust: measurements.trust,
      recorded_at: new Date().toISOString(),
    })

  if (error) throw error
}

/**
 * Determine if intervention is needed
 * 
 * Returns the intervention type based on the current state.
 * Used by Bently to decide how to engage with the couple.
 */
export function getInterventionType(state: RelationalState) {
  const interventions: Record<RelationalState, 'support' | 'reality_check' | 'advisor' | 'presence'> = {
    CAPACITY_BLOCKED: 'support',      // Hold them through the crisis
    MISALIGNED: 'reality_check',      // Make them see the incompatibility
    DORMANT: 'advisor',               // Guide them to reactivate
    TRUST_FRACTURED: 'reality_check', // Name the hedging/protection
    ALIGNED: 'presence',              // Just be there, don't interrupt
    UNKNOWN: 'presence',              // Don't assume anything yet
  }

  return interventions[state]
}
