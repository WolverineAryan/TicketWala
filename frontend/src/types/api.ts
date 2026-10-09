/**
 * TicketWala API Contract & DTO Types for Frontend
 */

export type ReservationStatus = "AVAILABLE" | "HELD" | "CONFIRMED" | "EXPIRED" | "RELEASED";

export type EventCategory = "FLIGHT" | "CONCERT" | "SPORTS" | "CINEMA" | "TRANSIT";

export interface SeatTier {
  id: string;
  name: string;
  price: number;
  color: string;
  description: string;
}

export interface EventDetails {
  id: string;
  title: string;
  category: EventCategory;
  categoryLabel: string;
  venue: string;
  location: string;
  dateTime: string;
  totalSeats: number;
  availableSeats: number;
  basePrice: number;
  currency: string;
  badge?: string;
  description: string;
  tiers: SeatTier[];
}

export interface InventoryUnitState {
  unitId: string;
  status: ReservationStatus;
  reservationId?: string;
  expiresAt?: number;
  version: number;
  tierId?: string;
  tierName?: string;
  price?: number;
  seatLabel?: string;
  row?: number;
  col?: number;
}

export interface HoldRequest {
  eventId?: string;
  unitId?: string;
  category?: string;
  tierId?: string;
  passengerName?: string;
}

export interface HoldResponse {
  reservationId: string;
  unitId: string;
  status: "HELD";
  expiresAt: number; // Unix epoch seconds
  /** Present only on the initial authorized response; retain it for retries. */
  holdToken?: string;
  version: number;
  eventId: string;
  eventTitle?: string;
  tierName?: string;
  price?: number;
  currency?: string;
}

export interface ConfirmRequest {
  holdToken: string;
  passengerName?: string;
  email?: string;
  phone?: string;
  paymentMethod?: "UPI" | "CARD" | "NETBANKING";
}

export interface ConfirmResponse {
  reservationId: string;
  unitId: string;
  status: "CONFIRMED";
  version: number;
  confirmedAt: number;
  pnr: string;
  eventId: string;
  eventTitle: string;
  venue: string;
  dateTime: string;
  passengerName: string;
  tierName: string;
  amountPaid: number;
  currency: string;
  qrCodePayload: string;
  paymentRef: string;
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

export interface DynamicUpiDetails {
  upiId: string;
  payeeName: string;
  amount: number;
  currency: string;
  transactionRef: string;
  note: string;
  intentUrl: string;
  qrCodeDataUrl: string;
}

export interface VerifyPaymentRequest {
  holdToken: string;
  utr: string;
  passengerName: string;
  email: string;
  phone?: string;
  paymentMethod?: "UPI" | "CARD" | "NETBANKING";
}

export interface CreateEventRequest {
  title: string;
  category: EventCategory;
  categoryLabel: string;
  venue: string;
  location: string;
  dateTime: string;
  totalSeats: number;
  basePrice: number;
  currency: string;
  badge?: string;
  description: string;
  organizerId: string;
  tiers: SeatTier[];
}

export interface UpdatePricingRequest {
  basePrice?: number;
  surgeMultiplier?: number;
  tierPrices?: Record<string, number>;
}

export interface OrganizerAnalytics {
  eventId: string;
  title: string;
  totalCapacity: number;
  availableSeats: number;
  soldCount: number;
  occupancyRate: string;
  estimatedRevenue: number;
  currency: string;
  timestamp: string;
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
