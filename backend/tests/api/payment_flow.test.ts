import { describe, expect, it, afterEach } from "vitest";
import { generateDynamicUpiPayment, verifyUpiTransaction } from "../../src/services/paymentService.js";
import { createServer } from "../../src/api/server.js";

describe("TicketWala Dynamic UPI & Automated Email Payment Gateway", () => {
  const originalSmtpHost = process.env.SMTP_HOST;
  const originalSmtpPort = process.env.SMTP_PORT;
  const originalSmtpSecure = process.env.SMTP_SECURE;
  const originalSmtpUser = process.env.SMTP_USER;
  const originalSmtpPass = process.env.SMTP_PASS;

  afterEach(() => {
    for (const [key, value] of Object.entries({
      SMTP_HOST: originalSmtpHost,
      SMTP_PORT: originalSmtpPort,
      SMTP_SECURE: originalSmtpSecure,
      SMTP_USER: originalSmtpUser,
      SMTP_PASS: originalSmtpPass,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("generates an authentic NPCI-compliant dynamic UPI intent and Base64 QR code", async () => {
    const upiData = await generateDynamicUpiPayment({
      amount: 1598,
      reservationId: "res-test-9901",
      pnr: "TW-9901AB",
      eventTitle: "Arijit Live — Mumbai",
      customUpiId: "9146199158@fam",
      customPayeeName: "TicketWala",
    });

    expect(upiData.upiId).toBe("9146199158@fam");
    expect(upiData.payeeName).toBe("TicketWala");
    expect(upiData.amount).toBe(1598);
    expect(upiData.currency).toBe("INR");
    expect(upiData.intentUrl).toContain("upi://pay?");
    expect(upiData.intentUrl).toContain("pa=9146199158%40fam");
    expect(upiData.intentUrl).toContain("pn=TicketWala");
    expect(upiData.intentUrl).toContain("am=1598");
    expect(upiData.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("validates 12-digit UTR numbers and prevents replay attacks", () => {
    // 1. Invalid short UTR
    const invalidShort = verifyUpiTransaction("123");
    expect(invalidShort.valid).toBe(false);
    expect(invalidShort.error).toBeDefined();

    // 2. Valid unique UTR
    const uniqueUtr = "4289" + Math.floor(10000000 + Math.random() * 90000000).toString();
    const validFirst = verifyUpiTransaction(uniqueUtr);
    expect(validFirst.valid).toBe(true);

    // 3. Replay attack with same UTR
    const replayAttempt = verifyUpiTransaction(uniqueUtr);
    expect(replayAttempt.valid).toBe(false);
    expect(replayAttempt.error).toContain("already been claimed");
  });

  it("handles POST /api/v1/payments/generate-upi via Fastify server", async () => {
    const { app } = await createServer();

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/payments/generate-upi",
      payload: {
        amount: 2598,
        eventTitle: "Coldplay Fan Fest",
        reservationId: "res-fastify-test",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.upiId).toBe("9146199158@fam");
    expect(body.payeeName).toBe("TicketWala");
    expect(body.amount).toBe(2598);
    expect(body.intentUrl).toContain("upi://pay?");
    expect(body.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);

    await app.close();
  }, 15000);

  it("retires the unsafe legacy ticket-issuance endpoint", async () => {
    const { app } = await createServer();

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/payments/confirm-and-send-ticket",
      payload: {
        utr: "428912345678",
        reservationId: "fabricated-reservation",
        unitId: "unit-001",
        eventId: "fabricated-event",
      },
    });

    expect(res.statusCode).toBe(410);
    expect(JSON.parse(res.body).error.code).toBe("ENDPOINT_RETIRED");

    await app.close();
  }, 15000);

  it("confirms only an owned reservation and reports unavailable email delivery accurately", async () => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    const { app } = await createServer();
    const hold = await app.inject({
      method: "POST",
      url: "/api/v1/reservations/hold",
      payload: { eventId: "evt-flight-ai101" },
    });
    expect(hold.statusCode).toBeGreaterThanOrEqual(200);
    expect(hold.statusCode).toBeLessThan(300);
    const held = JSON.parse(hold.body);
    const utr = `4289${Math.floor(10000000 + Math.random() * 90000000)}`;

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/reservations/${held.reservationId}/verify-payment`,
      headers: { "x-event-id": held.eventId },
      payload: {
        holdToken: held.holdToken,
        utr,
        passengerName: "Test Fan",
        email: "test@example.com",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe("CONFIRMED");
    expect(body.unitId).toBe(held.unitId);
    expect(body.eventId).toBe(held.eventId);
    expect(body.emailDispatched).toBe(false);
    expect(body.emailError).toContain("SMTP");
    await app.close();
  }, 15000);

  it("rejects fabricated reservation and unit ownership data", async () => {
    const { app } = await createServer();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/reservations/fabricated-reservation/verify-payment",
      payload: {
        holdToken: "fabricated-token",
        utr: `4289${Math.floor(10000000 + Math.random() * 90000000)}`,
        passengerName: "Attacker",
        email: "attacker@example.com",
      },
    });

    expect([400, 404]).toContain(res.statusCode);
    expect(JSON.parse(res.body).error.code).not.toBe("CONFIRMED");
    await app.close();
  }, 15000);

  it("rejects a replayed UTR submission", async () => {
    const { app } = await createServer();
    const firstHold = await app.inject({
      method: "POST",
      url: "/api/v1/reservations/hold",
      payload: { eventId: "evt-flight-ai101" },
    });
    const first = JSON.parse(firstHold.body);
    const utr = `4289${Math.floor(10000000 + Math.random() * 90000000)}`;
    const firstPayment = await app.inject({
      method: "POST",
      url: `/api/v1/reservations/${first.reservationId}/verify-payment`,
      payload: { holdToken: first.holdToken, utr, passengerName: "First Fan", email: "first@example.com" },
    });
    expect(firstPayment.statusCode).toBe(200);

    const secondHold = await app.inject({
      method: "POST",
      url: "/api/v1/reservations/hold",
      payload: { eventId: "evt-flight-ai101" },
    });
    const second = JSON.parse(secondHold.body);
    const replay = await app.inject({
      method: "POST",
      url: `/api/v1/reservations/${second.reservationId}/verify-payment`,
      payload: { holdToken: second.holdToken, utr, passengerName: "Replay Fan", email: "replay@example.com" },
    });

    expect(replay.statusCode).toBe(400);
    expect(JSON.parse(replay.body).error.code).toBe("INVALID_UTR");
    await app.close();
  }, 15000);

  it("keeps the ticket confirmed when email dispatch fails", async () => {
    process.env.SMTP_HOST = "127.0.0.1";
    process.env.SMTP_PORT = "1";
    process.env.SMTP_SECURE = "false";
    process.env.SMTP_USER = "test@example.com";
    process.env.SMTP_PASS = "test-password";

    const { app } = await createServer();
    const hold = await app.inject({
      method: "POST",
      url: "/api/v1/reservations/hold",
      payload: { eventId: "evt-flight-ai101" },
    });
    const held = JSON.parse(hold.body);
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/reservations/${held.reservationId}/verify-payment`,
      payload: {
        holdToken: held.holdToken,
        utr: `4289${Math.floor(10000000 + Math.random() * 90000000)}`,
        passengerName: "Mail Failure Fan",
        email: "mail-failure@example.com",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe("CONFIRMED");
    expect(body.emailDispatched).toBe(false);
    expect(body.emailError).toBeTruthy();
    await app.close();
  }, 15000);
});
