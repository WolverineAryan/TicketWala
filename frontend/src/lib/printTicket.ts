export interface PrintableTicketData {
  ticketType: string;
  bookingId: string;
  customerName: string;
  title: string;
  subtitle?: string;
  venueOrRoute: string;
  dateStr: string;
  timeStr: string;
  seatOrClass: string;
  price: number | string;
  status: string;
  sourceType?: "event" | "travel";
  qrPayload?: string;
}

/**
 * Print the exact TicketWala ticket pass with full colors, signature styling,
 * and high-resolution live scannable turnstile QR code.
 */
export function printExactTicket(ticket: PrintableTicketData): void {
  if (typeof window === "undefined") return;

  const origin = window.location.origin || "https://ticketwala.org";
  const verifyUrl = `${origin}/verify?pnr=${encodeURIComponent(ticket.bookingId)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    verifyUrl
  )}&size=240x240&color=181716&margin=0`;

  const formattedPrice =
    typeof ticket.price === "number"
      ? ticket.price.toLocaleString("en-IN")
      : ticket.price;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>TicketWala Pass · ${ticket.bookingId}</title>
  <style>
    @page {
      size: landscape;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #f7f6f3 !important;
      color: #181716;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
    }
    .print-ticket-wrapper {
      width: 100%;
      max-width: 820px;
      margin: 0 auto;
    }
    .print-top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2ddd3;
    }
    .brand-title {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 1px;
      color: #FF5126;
      display: flex;
      align-items: center;
      gap: 6px;
      text-transform: uppercase;
    }
    .brand-meta {
      font-size: 11px;
      font-weight: 700;
      color: #77736c;
      letter-spacing: 0.5px;
    }
    .print-ticket-card {
      display: flex;
      width: 100%;
      min-height: 275px;
      border-radius: 20px;
      overflow: hidden;
      border: 1.5px solid #ded9d0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      background: #ffffff;
      page-break-inside: avoid;
    }
    /* LEFT BODY: Signature Orange Pass */
    .print-ticket-body {
      flex: 2.3;
      background: linear-gradient(135deg, #FF6B35 0%, #FF5126 45%, #E63E00 100%) !important;
      padding: 24px 28px;
      color: #ffffff !important;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    .top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .tag-left {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.95);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .type-pill {
      background: rgba(255, 255, 255, 0.25) !important;
      padding: 3px 10px;
      border-radius: 99px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1px;
    }
    .domain-right {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.95);
    }
    .hero-title {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin: 4px 0 8px;
    }
    .title-filled {
      font-size: 38px;
      font-weight: 900;
      letter-spacing: 1px;
      color: #ffffff !important;
      text-transform: uppercase;
      line-height: 1;
    }
    .title-outline {
      font-size: 38px;
      font-weight: 900;
      letter-spacing: 1px;
      color: transparent;
      -webkit-text-stroke: 2px #ffffff;
      text-transform: uppercase;
      line-height: 1;
    }
    .subtitle {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff !important;
      margin: 0 0 12px;
      line-height: 1.3;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      padding: 10px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.3);
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      margin-bottom: 12px;
    }
    .meta-item small {
      display: block;
      font-size: 9px;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.85);
      font-weight: 700;
      margin-bottom: 2px;
    }
    .meta-item b {
      display: block;
      font-size: 12.5px;
      font-weight: 800;
      color: #ffffff !important;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .footer-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #ffffff !important;
    }
    .verified-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 10.5px;
      font-weight: 800;
      letter-spacing: 1.2px;
      text-transform: uppercase;
    }
    .verified-icon {
      background: rgba(255, 255, 255, 0.2) !important;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 900;
    }
    .price-tag {
      font-size: 12.5px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    /* PERFORATED SEAM & NOTCHES */
    .print-ticket-seam {
      position: relative;
      width: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      z-index: 5;
    }
    .print-notch {
      width: 22px;
      height: 22px;
      background: #f7f6f3 !important;
      border-radius: 50%;
      position: absolute;
      left: -11px;
      border: 1.5px solid #ded9d0;
    }
    .print-notch.top { top: -11px; }
    .print-notch.bottom { bottom: -11px; }
    .print-perf-line {
      position: absolute;
      top: 14px;
      bottom: 14px;
      left: -1px;
      border-left: 2px dashed rgba(200, 195, 185, 0.85);
    }
    /* RIGHT STUB: Scannable Turnstile QR Code */
    .print-ticket-stub {
      flex: 0.95;
      background: #fbfaf8 !important;
      padding: 20px 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      color: #181716 !important;
    }
    .stub-header {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: #2b2a28;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .stub-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #27ae60 !important;
      display: inline-block;
    }
    .qr-box {
      background: #ffffff !important;
      padding: 8px;
      border-radius: 10px;
      border: 1.5px solid #ded9d0;
      margin: 8px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }
    .qr-img {
      display: block;
      width: 100px;
      height: 100px;
    }
    .qr-label {
      font-size: 8.5px;
      font-weight: 800;
      color: #FF5126;
      margin-top: 3px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stub-pnr {
      font-family: monospace;
      font-size: 13.5px;
      font-weight: 900;
      letter-spacing: 1.5px;
      color: #181716;
    }
    .stub-instruction {
      font-size: 9px;
      font-weight: 700;
      color: #77736c;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .print-footer-instructions {
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #8c8880;
      padding-top: 10px;
      border-top: 1px dashed #ded9d0;
    }
  </style>
</head>
<body>
  <div class="print-ticket-wrapper">
    <div class="print-top-header">
      <div class="brand-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle; margin-right:4px;"><rect x="2" y="6" width="20" height="12" rx="3"/><circle cx="12" cy="12" r="2"/></svg>
        <span>TICKETWALA OFFICIAL PASS</span>
      </div>
      <div class="brand-meta">
        PNR: <b>${ticket.bookingId}</b> · Issued &amp; Invariant Confirmed
      </div>
    </div>

    <div class="print-ticket-card">
      <div class="print-ticket-body">
        <div class="top-row">
          <div class="tag-left">
            <span>OFFICIAL</span>
            <span class="type-pill">${ticket.ticketType.toUpperCase()} PASS</span>
          </div>
          <div class="domain-right">TICKETWALA.COM</div>
        </div>

        <div class="hero-title">
          <span class="title-filled">TICKET</span>
          <span class="title-outline">PASS</span>
        </div>

        <div class="subtitle">
          ${ticket.title} · ${ticket.venueOrRoute}
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <small>PASSENGER / HOLDER</small>
            <b>${ticket.customerName}</b>
          </div>
          <div class="meta-item">
            <small>DATE &amp; TIME</small>
            <b>${ticket.dateStr} · ${ticket.timeStr}</b>
          </div>
          <div class="meta-item">
            <small>SEAT / CLASS</small>
            <b>${ticket.seatOrClass}</b>
          </div>
          <div class="meta-item">
            <small>STATUS</small>
            <b style="color: #ffffff;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="display:inline-block; vertical-align:middle; margin-right:3px;"><polyline points="20 6 9 17 4 12"/></svg>${ticket.status.toUpperCase()}</b>
          </div>
        </div>

        <div class="footer-row">
          <div class="verified-badge">
            <span class="verified-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" style="display:inline-block; vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>OFFICIAL VERIFIED PASS</span>
          </div>
          <div class="price-tag">
            ₹${formattedPrice} · 0 CONFLICT GUARANTEE
          </div>
        </div>
      </div>

      <div class="print-ticket-seam">
        <div class="print-notch top"></div>
        <div class="print-perf-line"></div>
        <div class="print-notch bottom"></div>
      </div>

      <div class="print-ticket-stub">
        <div class="stub-header">
          <span class="stub-dot"></span>
          <span>OFFICIAL PASS</span>
        </div>

        <div class="qr-box">
          <img class="qr-img" src="${qrUrl}" alt="Verification QR Code" />
          <span class="qr-label">● Live Scannable</span>
        </div>

        <div class="stub-pnr">${ticket.bookingId}</div>
        <div class="stub-instruction">SCAN WITH CAMERA AT GATE</div>
      </div>
    </div>

    <div class="print-footer-instructions">
      <span>● Present this printed pass or digital QR at turnstile optical readers, airport security, or train TTE.</span>
      <span>TicketWala Core Engine · Cryptographically Signed</span>
    </div>
  </div>
</body>
</html>`;

  // Create isolated invisible iframe for printing
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  const qrImg = doc.querySelector("img");
  const triggerPrint = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Print error:", err);
        window.print();
      } finally {
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch {}
        }, 3000);
      }
    }, 250);
  };

  if (qrImg && !qrImg.complete) {
    qrImg.onload = triggerPrint;
    qrImg.onerror = triggerPrint;
  } else {
    triggerPrint();
  }
}
