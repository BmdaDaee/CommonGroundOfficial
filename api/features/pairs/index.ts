/**
 * Pairs Feature Index
 * 
 * Exports the pairs router and types for integration into the main appRouter.
 */

export { pairsRouter } from './router'
export type {
  Pair,
  PairMember,
  RelationalStateHistory,
  UserXP,
  RelationalState,
  Rank,
  RankTheme,
  MeasurementLevel,
  Measurements,
  CreatePairRequest,
  JoinPairRequest,
  UpdatePairRequest,
  MeasureNowRequest,
  CreatePairResponse,
  JoinPairResponse,
  PairDetailResponse,
  MeasurementResult,
  HistoryResponse,
  RelationalStateMetadata,
} from './types'

export {
  deriveRelationalState,
  measurePairCapacity,
  getLatestMeasurement,
  logMeasurement,
  getInterventionType,
} from './relationalEngine'
