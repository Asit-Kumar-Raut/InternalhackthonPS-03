// ─── Enums ────────────────────────────────────────────────────────────────────
export type Role = 'ADMIN' | 'OPERATOR' | 'VIEWER' | 'DRIVER'
export type VehicleType = 'AMBULANCE' | 'FIRE' | 'POLICE'
export type VehicleStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
export type SignalPhase = 'NS' | 'EW'
export type SignalState = 'GREEN' | 'YELLOW' | 'ALL_RED'
export type CongestionLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CONGESTED'
export type SensorType = 'CAMERA' | 'SPEED'
export type SensorStatus = 'ACTIVE' | 'FAULT' | 'OFFLINE'
export type EmergencyStatus =
  | 'PENDING_CONFIRM'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'ABORTED'
  | 'REJECTED'
  | 'EXPIRED'
export type JunctionEmergencyStatus =
  | 'WAITING'
  | 'CLEARING'
  | 'GREEN_READY'
  | 'PASSED'

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number
  email: string
  role: Role
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

// ─── Junction / Signal ────────────────────────────────────────────────────────
export interface Junction {
  id: number
  name: string
  x: number
  y: number
  status: string
}

export interface Signal {
  id: number
  junction_id: number
  phase: SignalPhase
  state: SignalState
  timer_s: number
}

export interface JunctionDetail extends Junction {
  signal: Signal
  recent_phases: PhaseRecord[]
  green_history: GreenTimeRecord[]
  demand: { NS: number; EW: number }
}

export interface PhaseRecord {
  phase: SignalPhase
  state: SignalState
  duration_s: number
  timestamp: string
}

export interface GreenTimeRecord {
  timestamp: string
  NS: number
  EW: number
}

// ─── Road / Traffic ───────────────────────────────────────────────────────────
export interface Road {
  id: number
  name: string
  from_junction_id: number
  to_junction_id: number
  length_m: number
  lanes: number
  capacity: number
}

export interface CongestionState {
  id: number
  road_id: number
  road_name: string
  level: CongestionLevel
  occupancy: number
  speed: number
  updated_at: string
}

export interface DensityRecord {
  timestamp: string
  occupancy: number
  speed: number
  predicted_occupancy?: number
}

// ─── Vehicle ──────────────────────────────────────────────────────────────────
export interface Vehicle {
  id: number
  user_id: number
  vehicle_number: string
  vehicle_type: VehicleType
  org_name: string
  org_type: string
  org_reg_no: string
  driver_name: string
  phone: string
  email: string
  vehicle_photo_path?: string
  driver_photo_path?: string
  rc_photo_path?: string
  status: VehicleStatus
  reject_reason?: string
  trust_score: number
  strikes: number
  ai_plate_text?: string
  ai_plate_match?: boolean
  ai_vehicle_class?: string
  ai_confidence?: number
  created_at: string
  reviewed_by?: number
  reviewed_at?: string
}

// ─── Emergency ────────────────────────────────────────────────────────────────
export interface EmergencyRequest {
  id: number
  vehicle_id: number
  vehicle_number: string
  vehicle_type: VehicleType
  status: EmergencyStatus
  route_junctions: number[]
  junction_confirmations: Record<string, boolean>
  junction_statuses?: Record<string, JunctionEmergencyStatus>
  flags: string[]
  created_at: string
  updated_at: string
}

// ─── Sensor ───────────────────────────────────────────────────────────────────
export interface Sensor {
  id: number
  type: SensorType
  road_id: number
  road_name?: string
  status: SensorStatus
  last_seen?: string
  fault_history?: SensorFault[]
}

export interface SensorFault {
  timestamp: string
  reason: string
}

// ─── Events ───────────────────────────────────────────────────────────────────
export interface AppEvent {
  id: number
  type: string
  payload: Record<string, unknown>
  actor?: string
  created_at: string
}

export interface AuditEntry {
  id: number
  action: string
  actor_id: number
  target_type: string
  target_id?: number
  details: Record<string, unknown>
  created_at: string
}

// ─── Config ───────────────────────────────────────────────────────────────────
export interface ConfigParam {
  key: string
  value: string
  description: string
  updated_at: string
}

export interface ConfigFormValues {
  min_green: number
  max_green: number
  gap: number
  yellow_time: number
  all_red_time: number
  ema_beta: number
  alpha: number
  aging_k: number
  aging_cap_s: number
  ai_enabled: boolean
  congestion_up_low: number
  congestion_up_medium: number
  congestion_up_high: number
  congestion_down_low: number
  congestion_down_medium: number
  congestion_down_high: number
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface AnalyticsComparison {
  mode: string
  avg_wait_time: number
  avg_queue_length: number
  wasted_green_time: number
}

export interface ModelMetrics {
  rf_mae: number
  rf_r2: number
  baseline_mae: number
  trained_at: string
}

export interface FeatureImportance {
  feature: string
  importance: number
}

export interface ActualVsPredicted {
  timestamp: string
  actual: number
  predicted: number
}

// ─── WebSocket message types ──────────────────────────────────────────────────
export interface WsMessage {
  type: string
  data: unknown
}

export interface WsSignalUpdate {
  junction_id: number
  phase: SignalPhase
  state: SignalState
  timer_s: number
}

export interface WsDensityUpdate {
  road_id: number
  level: CongestionLevel
  occupancy: number
  speed: number
}

export interface WsEmergencyUpdate {
  request_id: number
  status: EmergencyStatus
  junction_statuses?: Record<string, JunctionEmergencyStatus>
}

export interface WsLiveState {
  signals: Record<number, WsSignalUpdate>
  densities: Record<number, WsDensityUpdate>
  emergencies: EmergencyRequest[]
  events: AppEvent[]
}

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────
export interface DashboardKPIs {
  active_emergency_runs: number
  avg_wait_time: number
  congested_roads: number
  signals_in_fallback: number
  pending_approvals: number
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
}
