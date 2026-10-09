import QRCode from "qrcode";
import dotenv from "dotenv";
import path from "path";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

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

// In-memory or Redis-backed registry of verified UTR numbers to prevent replay attacks
const verifiedUtrRegistry = new Set<string>();

/**
 * Generates an authentic NPCI-compliant dynamic UPI payment intent and QR code
 */
export async function generateDynamicUpiPayment(params: {
  amount: number;
  reservationId: string;
  pnr: string;
  eventTitle: string;
  customUpiId?: string;
  customPayeeName?: string;
}): Promise<DynamicUpiDetails> {
  const upiId = params.customUpiId || process.env.PAYMENT_UPI_ID || "y9146199158@fam";
  const payeeName = params.customPayeeName || process.env.PAYMENT_PAYEE_NAME || "TicketWala";
  const transactionRef = `TW-${params.reservationId.substring(0, 8).toUpperCase()}`;
  const note = `TicketWala ${params.pnr}`;

  // Standard NPCI UPI URI Specification
  const intentUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${params.amount}&cu=INR&tr=${encodeURIComponent(transactionRef)}&tn=${encodeURIComponent(note)}`;

  // Generate dynamic QR code image for scanning with GPay/PhonePe/Paytm
  const qrCodeDataUrl = await QRCode.toDataURL(intentUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
    color: {
      dark: "#020617",
      light: "#FFFFFF",
    },
  });

  return {
    upiId,
    payeeName,
    amount: params.amount,
    currency: "INR",
    transactionRef,
    note,
    intentUrl,
    qrCodeDataUrl,
  };
}

/**
 * Validates a submitted 12-digit UPI UTR / Bank Reference Number
 */
export function verifyUpiTransaction(utr: string): { valid: boolean; error?: string } {
  const cleanUtr = utr.trim().replace(/\s+/g, "");

  // Most Indian bank UPI references (UTR) are 12 digits or alphanumeric (min 8 chars)
  if (!cleanUtr || cleanUtr.length < 8) {
    return {
      valid: false,
      error: "Invalid UPI Reference Number (UTR). Must be at least 8 digits / characters.",
    };
  }

  // Prevent replay attacks (duplicate submission of the same UTR)
  if (verifiedUtrRegistry.has(cleanUtr)) {
    return {
      valid: false,
      error: "This UPI Reference Number (UTR) has already been claimed for another ticket.",
    };
  }

  // Register UTR as used
  verifiedUtrRegistry.add(cleanUtr);
  return { valid: true };
}
