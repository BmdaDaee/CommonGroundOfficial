/**
 * Pair Types
 * 
 * TypeScript definitions for pair-related data structures,
 * request/response types, and database records.
 */

// ============= Database Record Types =============

export interface Pair {
  id: string
  pair_code: string
  status: 'active' | 'paused' | 'ended'
  relationship_start_date: string | null
  relational_state: RelationalState
  created_at: string
  updated_at: string
}

export interface PairMember {
  id: string
  pair_id: string
  user_id: string
  role: 'initiator' | 'partner'
  joined_at: string
}

export interface RelationalStateHistory {
  id: string
  pair_id: string
  state: RelationalState
  availability?: 'LOW' | 'MEDIUM' | 'HIGH'
  alignment?: 'LOW' | 'MEDIUM' | 'HIGH'
  activation?: 'LOW' | 'MEDIUM' | 'HIGH'
  trust?: 'LOW' | 'MEDIUM' | 'HIGH'
  recorded_at: string
}

export interface UserXP {
  id: string
  user_id: string
  pair_id: string
  total_xp: number
  rank: Rank
  rank_theme: RankTheme
  streak: number
  last_activity: string
}

// ============= Enums =============

export type RelationalState = 
  | 'CAPACITY_BLOCKED'
  | 'MISALIGNED'
  | 'DORMANT'
  | 'TRUST_FRACTURED'
  | 'ALIGNED'
  | 'UNKNOWN'

export type Rank = 
  | 'SPARK'
  | 'FLAME'
  | 'CALIBRATOR'
  | 'INFERNO'
  | 'SOVEREIGN'

export type RankTheme = 
  | 'pharaoh'    // Gold
  | 'samurai'    // Blue
  | 'celestial'  // Purple
  | 'shadow'     // Black

export type MeasurementLevel = 'LOW' | 'MEDIUM' | 'HIGH'

// ============= Request Input Types =============

export interface CreatePairRequest {
  relationshipStartDate?: string
  displayName?: string
}

export interface JoinPairRequest {
  pairCode: string
}

export interface UpdatePairRequest {
  pairId: string
  status?: 'active' | 'paused' | 'ended'
  relationalState?: RelationalState
}

export interface MeasureNowRequest {
  pairId: string
  availability?: MeasurementLevel
  alignment?: MeasurementLevel
  activation?: MeasurementLevel
  trust?: MeasurementLevel
}

// ============= Response Types =============

export interface CreatePairResponse {
  pair: Pair
  pairCode: string
  message: string
}

export interface JoinPairResponse {
  pair: Pair
  message: string
}

export interface PairDetailResponse {
  pair: Pair
  members: (PairMember & { profile?: Profile })[]
}

export interface MeasurementResult {
  measurements: Measurements
  state: RelationalState
  pair: Pair
}

export interface HistoryResponse {
  data: RelationalStateHistory[]
  count: number
}

// ============= Supporting Types =============

export interface Measurements {
  availability: MeasurementLevel
  alignment: MeasurementLevel
  activation: MeasurementLevel
  trust: MeasurementLevel
}

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  zodiac_sign: string | null
}

// ============= State Mapping =============

/**
 * Relational State Metadata
 * Describes what each state means, what intervention it triggers, etc.
 */
export const RelationalStateMetadata: Record<RelationalState, {
  label: string
  description: string
  interventionType: 'support' | 'reality_check' | 'advisor' | 'presence'
  severity: 'low' | 'medium' | 'high'
}> = {
  CAPACITY_BLOCKED: {
    label: 'Capacity Blocked',
    description: 'One or both partners in survival mode. Relationship work paused until stabilized.',
    interventionType: 'support',
    severity: 'high',
  },
  MISALIGNED: {
    label: 'Misaligned',
    description: 'Partners pulling in different directions. Incompatibilities surfacing.',
    interventionType: 'reality_check',
    severity: 'high',
  },
  DORMANT: {
    label: 'Dormant',
    description: 'Relationship is asleep. Connection fading unless reactivated intentionally.',
    interventionType: 'advisor',
    severity: 'medium',
  },
  TRUST_FRACTURED: {
    label: 'Trust Fractured',
    description: 'Confidence broken. One or both hedging. Repair or separation likely.',
    interventionType: 'reality_check',
    severity: 'high',
  },
  ALIGNED: {
    label: 'Aligned',
    description: 'Solid capacity across all dimensions. Relationship is thriving.',
    interventionType: 'presence',
    severity: 'low',
  },
  UNKNOWN: {
    label: 'Unknown',
    description: 'Not enough data to assess relational capacity yet.',
    interventionType: 'presence',
    severity: 'low',
  },
}
