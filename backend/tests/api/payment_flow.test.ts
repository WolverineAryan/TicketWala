import { describe, expect, it } from "vitest";
import { generateDynamicUpiPayment, verifyUpiTransaction } from "../../src/services/paymentService.js";
import { createServer } from "../../src/api/server.js";

describe("TicketWala Dynamic UPI & Automated Email Payment Gateway", () => {
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

  it("handles POST /api/v1/payments/confirm-and-send-ticket and issues cryptographic PNR", async () => {
    const { app } = await createServer();
    const uniqueUtr = "4289" + Math.floor(10000000 + Math.random() * 90000000).toString();

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/payments/confirm-and-send-ticket",
      payload: {
        utr: uniqueUtr,
        passengerName: "Test Fan",
        email: "ticketwala.org@gmail.com",
        phone: "+91 91461 99158",
        eventTitle: "Arijit Live — Mumbai",
        seatLabel: "B-12",
        tierName: "VIP Lounge",
        amountPaid: 2598,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe("CONFIRMED");
    expect(body.pnr).toMatch(/^TW-[A-Z0-9]+$/);
    expect(body.qrCodePayload).toContain("TICKETWALA:");
    expect(body.verifiedUtr).toBe(uniqueUtr);
    expect(body.emailDispatched).toBe(true);
    expect(body.recipientEmail).toBe("ticketwala.org@gmail.com");

    await app.close();
  }, 15000);
});
