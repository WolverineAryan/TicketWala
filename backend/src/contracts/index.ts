import { z } from "zod";

export type ReservationStatus = "AVAILABLE" | "HELD" | "CONFIRMED" | "EXPIRED" | "RELEASED";

export type EventCategory = "FLIGHT" | "CONCERT" | "SPORTS" | "CINEMA" | "TRANSIT";

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
  tierId?: string;
  tierName?: string;
  price?: number;
  seatLabel?: string;
  row?: number;
  col?: number;
}

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

// Request Schemas
export const HoldRequestSchema = z.object({
  eventId: z.string().default("evt-flight-ai101"),
  unitId: z.string().optional(), // Specific seat selection or auto FCFS
  category: z.string().optional().default("STANDARD"),
  tierId: z.string().optional(),
  passengerName: z.string().optional(),
});
export type HoldRequest = z.infer<typeof HoldRequestSchema>;

export const ConfirmRequestSchema = z.object({
  holdToken: z.string().min(1, "holdToken is required"),
  passengerName: z.string().optional().default("Guest Traveler"),
  email: z.string().optional(),
  phone: z.string().optional(),
  paymentMethod: z.enum(["UPI", "CARD", "NETBANKING"]).optional().default("UPI"),
});
export type ConfirmRequest = z.infer<typeof ConfirmRequestSchema>;

export const ReleaseRequestSchema = z.object({
  holdToken: z.string().min(1, "holdToken is required"),
});
export type ReleaseRequest = z.infer<typeof ReleaseRequestSchema>;

// Organizer & Dynamic Pricing Schemas
export const CreateEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: z.enum(["FLIGHT", "CONCERT", "SPORTS", "CINEMA", "TRANSIT"]),
  categoryLabel: z.string(),
  venue: z.string().min(2),
  location: z.string().min(2),
  dateTime: z.string().min(2),
  totalSeats: z.number().int().min(10).max(10000).default(100),
  basePrice: z.number().positive(),
  currency: z.string().default("INR"),
  badge: z.string().optional(),
  description: z.string().min(10),
  organizerId: z.string().default("org-default"),
  tiers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      price: z.number().positive(),
      color: z.string(),
      description: z.string(),
    })
  ).min(1),
});
export type CreateEventRequest = z.infer<typeof CreateEventSchema>;

export const UpdatePricingSchema = z.object({
  basePrice: z.number().positive().optional(),
  surgeMultiplier: z.number().min(0.5).max(5.0).optional().default(1.0),
  tierPrices: z.record(z.string(), z.number().positive()).optional(),
});
export type UpdatePricingRequest = z.infer<typeof UpdatePricingSchema>;

export const VerifyPaymentRequestSchema = z.object({
  holdToken: z.string().min(1, "holdToken is required"),
  utr: z.string().min(6, "Valid UPI Reference Number / UTR is required"),
  passengerName: z.string().min(2).default("Guest Traveler"),
  email: z.string().email("Valid email address is required"),
  phone: z.string().optional().default("+91 98765 43210"),
  paymentMethod: z.enum(["UPI", "CARD", "NETBANKING"]).default("UPI"),
});
export type VerifyPaymentRequest = z.infer<typeof VerifyPaymentRequestSchema>;

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
  eventTitle?: string;
  tierName?: string;
  price?: number;
  currency?: string;
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

// -----------------------------------------------------------------------------
// QR Scanner & Ticket Check-In Contracts
// -----------------------------------------------------------------------------
export const VerifyScanSchema = z.object({
  qrPayload: z.string().optional(),
  pnr: z.string().optional(),
  gate: z.string().optional().default("Gate-1A"),
});
export type VerifyScanRequest = z.infer<typeof VerifyScanSchema>;

export interface VerifyScanResponse {
  valid: boolean;
  status: "ADMISSION_GRANTED" | "DUPLICATE_SCAN_REJECTED" | "TICKET_NOT_FOUND";
  pnr?: string;
  unitId?: string;
  passengerName?: string;
  eventTitle?: string;
  scannedAt: string;
  scanCount: number;
  gate: string;
  message: string;
}

// -----------------------------------------------------------------------------
// Payment Webhook Contracts
// -----------------------------------------------------------------------------
export const PaymentWebhookSchema = z.object({
  providerEventId: z.string().min(1, "providerEventId is required"),
  reservationId: z.string().min(1, "reservationId is required"),
  holdToken: z.string().min(1, "holdToken is required"),
  status: z.enum(["PAYMENT_SUCCESS", "PAYMENT_FAILED"]),
  amount: z.number().positive(),
  currency: z.string().default("INR"),
  signature: z.string().optional(),
});
export type PaymentWebhookRequest = z.infer<typeof PaymentWebhookSchema>;

// -----------------------------------------------------------------------------
// FlashLock Collision Lab Scenario Runner Contracts
// -----------------------------------------------------------------------------
export const RunScenarioSchema = z.object({
  scenario: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  concurrency: z.number().int().min(1).max(200).optional().default(20),
  totalRequests: z.number().int().min(1).max(1000).optional().default(100),
});
export type RunScenarioRequest = z.infer<typeof RunScenarioSchema>;

// -----------------------------------------------------------------------------
// Support & Contact Us Contracts
// -----------------------------------------------------------------------------
export const ContactCategorySchema = z.enum([
  "BOOKING",
  "PAYMENT",
  "TICKETS",
  "ACCOUNT",
  "EVENT_ENQUIRY",
  "OTHER",
]);
export type ContactCategory = z.infer<typeof ContactCategorySchema>;

export const ContactInquirySchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Valid email address is required").max(150),
  category: ContactCategorySchema.default("BOOKING"),
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(200),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
});
export type ContactInquiryRequest = z.infer<typeof ContactInquirySchema>;

export interface ContactInquiryResponse {
  success: boolean;
  ticketId: string;
  receivedAt: string;
  category: string;
  message: string;
}
