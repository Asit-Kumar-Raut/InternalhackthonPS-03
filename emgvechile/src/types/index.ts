export type VehicleType = 'AMBULANCE' | 'FIRE' | 'POLICE';
export type VehicleStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface User {
  id: number;
  email: string;
  role: string;
}

export interface Vehicle {
  id: number;
  user_id: number;
  vehicle_number: string;
  vehicle_type: VehicleType;
  org_name: string;
  org_type: string;
  driver_name: string;
  phone: string;
  email: string;
  status: VehicleStatus;
  trust_score: number;
  strikes: number;
  reject_reason?: string;
  created_at: string;
}

export interface CorridorJunction {
  state: 'WAITING' | 'CLEARING' | 'GREEN_READY' | 'PASSED';
  confirmed: boolean | null;
  eta_s: number;
}

export interface EmergencyRun {
  request_id: number;
  vehicle_id: number;
  route_junctions: number[];
  current_index: number;
  status: string;
  junction_status: Record<number, CorridorJunction>;
  created_at: number;
  last_gps?: { lat: number; lng: number; speed: number; ts: number };
}
