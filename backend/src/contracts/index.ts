import { z } from "zod";

export type ReservationStatus = "AVAILABLE" | "HELD" | "CONFIRMED" | "EXPIRED" | "RELEASED";

export type EventType =
  | "HOLD_CREATED"
  | "RESERVATION_CONFIRMED"
  | "HOLD_EXPIRED"
  | "HOLD_RELEASED";

export interface ReservationEvent {
  eventId: string;
  eventType: EventType;
  reservationId: string;
  unitId: string;
  version: number;
  occurredAt: string;
  payload?: Record<string, unknown>;
}

export interface InventoryUnitState {
  unitId: string;
  status: ReservationStatus;
  reservationId?: string;
  expiresAt?: number;
  version: number;
}

// Request Schemas
export const HoldRequestSchema = z.object({
  eventId: z.string().default("evt-main"),
  category: z.string().optional().default("STANDARD"),
});
export type HoldRequest = z.infer<typeof HoldRequestSchema>;

export const ConfirmRequestSchema = z.object({
  holdToken: z.string().min(1, "holdToken is required"),
});
export type ConfirmRequest = z.infer<typeof ConfirmRequestSchema>;

export const ReleaseRequestSchema = z.object({
  holdToken: z.string().min(1, "holdToken is required"),
});
export type ReleaseRequest = z.infer<typeof ReleaseRequestSchema>;

// Response Types
export interface HoldResponse {
  reservationId: string;
  unitId: string;
  status: "HELD";
  expiresAt: number;
  /** Present only on the initial authorized response; Redis never stores raw tokens. */
  holdToken?: string;
  version: number;
  eventId: string;
}

export interface ConfirmResponse {
  reservationId: string;
  unitId: string;
  status: "CONFIRMED";
  version: number;
  confirmedAt: number;
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
