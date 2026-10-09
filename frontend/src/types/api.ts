/**
 * TicketWala API Contract & DTO Types for Frontend
 */

export type ReservationStatus = "AVAILABLE" | "HELD" | "CONFIRMED" | "EXPIRED" | "RELEASED";

export interface HoldRequest {
  eventId?: string;
  category?: string;
}

export interface HoldResponse {
  reservationId: string;
  unitId: string;
  status: "HELD";
  expiresAt: number; // Unix epoch seconds
  holdToken: string;
  version: number;
  eventId: string;
}

export interface ConfirmRequest {
  holdToken: string;
}

export interface ConfirmResponse {
  reservationId: string;
  unitId: string;
  status: "CONFIRMED";
  version: number;
  confirmedAt: number;
}

export interface ReleaseRequest {
  holdToken: string;
}

export interface ReleaseResponse {
  reservationId: string;
  unitId: string;
  status: "RELEASED";
  version: number;
}

export interface StandardErrorResponse {
  error: {
    code: string;
    message: string;
    retryable: boolean;
    timestamp: string;
  };
}

export interface InventoryUnitState {
  unitId: string;
  status: ReservationStatus;
  reservationId?: string;
  expiresAt?: number;
  version: number;
}

export interface MetricsResponse {
  inventory: {
    total: number;
    available: number;
    held: number;
    confirmed: number;
  };
  telemetry: {
    totalRequests: number;
    holdsCreated: number;
    holdsConfirmed: number;
    holdsReleased: number;
    holdsExpired: number;
    soldOutCount: number;
    rateLimitedCount: number;
  };
  stream: {
    pendingEvents: number;
    lastDeliveredId: string;
  };
  serverTime: string;
}

export interface InvariantAuditReport {
  passed: boolean;
  timestamp: string;
  summary: {
    totalConfiguredCapacity: number;
    activeHolds: number;
    confirmedBookings: number;
    availableQueueLength: number;
    violationsCount: number;
  };
  checks: {
    singleOwnership: { passed: boolean; details: string };
    capacityConservation: { passed: boolean; details: string };
    versionMonotonicity: { passed: boolean; details: string };
    crossStoreConvergence: { passed: boolean; details: string };
  };
  anomalies: string[];
}
