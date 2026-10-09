import nodemailer from "nodemailer";
import QRCode from "qrcode";
import dotenv from "dotenv";
import path from "path";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

export interface TicketEmailPayload {
  toEmail: string;
  passengerName: string;
  pnr: string;
  eventTitle: string;
  categoryLabel: string;
  venue: string;
  dateTime: string;
  unitId: string;
  tierName: string;
  amountPaid: number;
  currency: string;
  paymentRef: string;
  qrCodePayload: string;
}

/**
 * Creates and caches the Nodemailer transporter using SMTP settings
 */
function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  // Google app passwords can contain spaces, normalize by removing spaces
  const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Sends a rich, branded TicketWala E-Ticket to the passenger's email
 */
export async function sendTicketEmail(payload: TicketEmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`ℹ️ [EmailService] SMTP credentials not fully configured. Skipping email dispatch to ${payload.toEmail}.`);
    return { success: false, error: "SMTP credentials missing" };
  }

  try {
    // Generate QR Code as base64 Data URL for embedding into the email
    const qrDataUrl = await QRCode.toDataURL(payload.qrCodePayload, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 250,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    });

    const fromAddress = process.env.EMAIL_FROM || `"TicketWala" <${process.env.SMTP_USER}>`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your TicketWala E-Ticket</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; margin: 0; padding: 24px; color: #F8FAFC; }
    .ticket-container { max-width: 600px; margin: 0 auto; background: #1E293B; border-radius: 16px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 28px; text-align: center; }
    .logo { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF; text-transform: uppercase; margin: 0; }
    .tagline { color: #E0E7FF; font-size: 13px; margin-top: 4px; opacity: 0.9; }
    .status-badge { display: inline-block; background: #10B981; color: #FFFFFF; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; margin-top: 12px; }
    .content { padding: 32px 28px; }
    .pnr-box { background: #0F172A; border-radius: 12px; padding: 16px; text-align: center; border: 1px dashed #6366F1; margin-bottom: 24px; }
    .pnr-label { font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px; margin: 0; }
    .pnr-value { font-size: 32px; font-weight: 900; color: #38BDF8; letter-spacing: 3px; margin: 4px 0 0 0; font-family: monospace; }
    .event-title { font-size: 20px; font-weight: 700; color: #FFFFFF; margin: 0 0 8px 0; line-height: 1.3; }
    .category-badge { display: inline-block; background: #312E81; color: #A5B4FC; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; margin-bottom: 16px; }
    .detail-row { display: flex; justify-content: space-between; border-bottom: 1px solid #334155; padding: 12px 0; }
    .detail-label { color: #94A3B8; font-size: 13px; }
    .detail-val { color: #F1F5F9; font-weight: 600; font-size: 13px; text-align: right; }
    .qr-section { text-align: center; padding: 24px 0 12px 0; background: #0F172A; border-radius: 12px; margin-top: 24px; border: 1px solid #334155; }
    .qr-img { width: 180px; height: 180px; border-radius: 8px; background: #FFFFFF; padding: 8px; }
    .qr-hint { color: #64748B; font-size: 11px; margin-top: 10px; }
    .footer { text-align: center; padding: 20px; color: #64748B; font-size: 12px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="ticket-container">
    <div class="header">
      <h1 class="logo">🎟️ TicketWala</h1>
      <div class="tagline">Official Verified Booking Confirmation</div>
      <div class="status-badge">✓ Confirmed & Verified</div>
    </div>
    
    <div class="content">
      <div class="pnr-box">
        <p class="pnr-label">Booking Reference / PNR</p>
        <p class="pnr-value">${payload.pnr}</p>
      </div>

      <div class="category-badge">${payload.categoryLabel}</div>
      <h2 class="event-title">${payload.eventTitle}</h2>

      <table width="100%" cellpadding="8" cellspacing="0" style="margin-top: 12px; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #334155;">
          <td style="color: #94A3B8; font-size: 13px;">Passenger / Guest</td>
          <td style="color: #F1F5F9; font-weight: 600; font-size: 13px; text-align: right;">${payload.passengerName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #334155;">
          <td style="color: #94A3B8; font-size: 13px;">Venue / Terminal</td>
          <td style="color: #F1F5F9; font-weight: 600; font-size: 13px; text-align: right;">${payload.venue}</td>
        </tr>
        <tr style="border-bottom: 1px solid #334155;">
          <td style="color: #94A3B8; font-size: 13px;">Date & Time</td>
          <td style="color: #F1F5F9; font-weight: 600; font-size: 13px; text-align: right;">${payload.dateTime}</td>
        </tr>
        <tr style="border-bottom: 1px solid #334155;">
          <td style="color: #94A3B8; font-size: 13px;">Seat & Tier</td>
          <td style="color: #F1F5F9; font-weight: 600; font-size: 13px; text-align: right;">${payload.unitId.toUpperCase()} (${payload.tierName})</td>
        </tr>
        <tr style="border-bottom: 1px solid #334155;">
          <td style="color: #94A3B8; font-size: 13px;">Amount Paid</td>
          <td style="color: #10B981; font-weight: 700; font-size: 14px; text-align: right;">${payload.currency} ${payload.amountPaid.toLocaleString("en-IN")}</td>
        </tr>
        <tr>
          <td style="color: #94A3B8; font-size: 13px;">Payment Ref / UTR</td>
          <td style="color: #94A3B8; font-size: 12px; text-align: right; font-family: monospace;">${payload.paymentRef}</td>
        </tr>
      </table>

      <div class="qr-section">
        <img src="${qrDataUrl}" alt="Ticket Verification QR Code" class="qr-img" />
        <p class="qr-hint">Scan at gate entry • Tamper-proof cryptographic barcode</p>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for booking with TicketWala.</p>
      <p style="margin: 4px 0 0 0;">Need assistance? Contact support at support@ticketwala.io</p>
    </div>
  </div>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: payload.toEmail,
      subject: `🎟️ Your Ticket Confirmation: ${payload.eventTitle} [PNR: ${payload.pnr}]`,
      html: htmlContent,
    });

    console.log(`✅ [EmailService] Confirmation email successfully dispatched to ${payload.toEmail} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`❌ [EmailService] Failed to send email to ${payload.toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}
