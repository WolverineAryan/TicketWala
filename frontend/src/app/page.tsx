"use client";

import React, { useState, useEffect, useCallback } from "react";
import type {
  HoldResponse,
  ConfirmResponse,
  MetricsResponse,
  InvariantAuditReport,
  InventoryUnitState,
} from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function TicketWalaScaffoldPage() {
  // Customer Booking State
  const [loading, setLoading] = useState(false);
  const [activeHold, setActiveHold] = useState<HoldResponse | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmResponse | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Observatory & Ops State
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [auditReport, setAuditReport] = useState<InvariantAuditReport | null>(null);
  const [inventoryGrid, setInventoryGrid] = useState<InventoryUnitState[]>([]);

  // 1. Fetch Metrics & Inventory
  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/ops/metrics`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }

      const invRes = await fetch(`${API_BASE}/api/v1/ops/inventory`);
      if (invRes.ok) {
        const data = await invRes.json();
        setInventoryGrid(data.units || []);
      }
    } catch {
      // API not yet running or network unavailable
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  // 2. Countdown Timer for Active Hold
  useEffect(() => {
    if (!activeHold?.expiresAt) return;
    const updateTimer = () => {
      const diff = Math.max(0, activeHold.expiresAt - Math.floor(Date.now() / 1000));
      setSecondsRemaining(diff);
      if (diff === 0 && activeHold) {
        setErrorMessage("Hold timer expired! Seat was returned to available queue.");
        setActiveHold(null);
      }
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [activeHold]);

  // 3. Customer Actions
  const handleClaimHold = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/v1/reservations/hold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: "evt-main" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(`[${data.error?.code || "ERROR"}] ${data.error?.message || "Hold request failed"}`);
      } else {
        setActiveHold(data as HoldResponse);
        setConfirmedBooking(null);
      }
    } catch (err: any) {
      setErrorMessage(`Connection Error: ${err.message}`);
    } finally {
      setLoading(false);
      fetchTelemetry();
    }
  };

  const handleConfirm = async () => {
    if (!activeHold) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/v1/reservations/${activeHold.reservationId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdToken: activeHold.holdToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(`[${data.error?.code || "ERROR"}] ${data.error?.message || "Confirmation failed"}`);
      } else {
        setConfirmedBooking(data as ConfirmResponse);
        setActiveHold(null);
      }
    } catch (err: any) {
      setErrorMessage(`Confirmation Error: ${err.message}`);
    } finally {
      setLoading(false);
      fetchTelemetry();
    }
  };

  const handleRelease = async () => {
    if (!activeHold) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/v1/reservations/${activeHold.reservationId}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdToken: activeHold.holdToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(`[${data.error?.code || "ERROR"}] ${data.error?.message || "Release failed"}`);
      } else {
        setActiveHold(null);
        setErrorMessage("Seat successfully released back to queue.");
      }
    } catch (err: any) {
      setErrorMessage(`Release Error: ${err.message}`);
    } finally {
      setLoading(false);
      fetchTelemetry();
    }
  };

  // 4. Ops Action: Run Invariant Audit
  const handleRunAudit = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/ops/audit`, { method: "POST" });
      const data = await res.json();
      setAuditReport(data as InvariantAuditReport);
    } catch (err: any) {
      alert(`Audit failed: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* HEADER */}
      <header style={{ borderBottom: "2px solid #cbd5e1", paddingBottom: "16px", marginBottom: "24px" }}>
        <h1 style={{ margin: "0 0 6px 0", fontSize: "28px", color: "#1e293b" }}>TicketWala 🎟️ [Frontend Scaffold]</h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
          Ready for UI Developer &bull; Fastify API, Redis Lua Broker & Supabase Postgres backend wired.
        </p>
      </header>

      {/* ERROR NOTICE */}
      {errorMessage && (
        <div style={{ background: "#fee2e2", border: "1px solid #ef4444", color: "#991b1b", padding: "12px", borderRadius: "6px", marginBottom: "20px" }}>
          ⚠️ {errorMessage}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* LEFT COLUMN: CUSTOMER BOOKING FLOW */}
        <section style={{ background: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <h2 style={{ marginTop: 0, fontSize: "18px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
            1. Customer Flash Booking Flow
          </h2>

          {!activeHold && !confirmedBooking && (
            <div>
              <p style={{ color: "#475569" }}>Click below to claim the next available seat via Strict FCFS allocation:</p>
              <button
                onClick={handleClaimHold}
                disabled={loading}
                style={{ background: "#2563eb", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "6px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}
              >
                {loading ? "Claiming..." : "⚡ Claim Next Available Seat"}
              </button>
            </div>
          )}

          {/* ACTIVE HOLD STATE */}
          {activeHold && (
            <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", padding: "16px", borderRadius: "8px", marginTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "bold", color: "#b45309" }}>SEAT RESERVED (HOLD)</span>
                <span style={{ background: "#b45309", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "13px", fontWeight: "bold" }}>
                  ⏳ {secondsRemaining}s Remaining
                </span>
              </div>
              <p style={{ margin: "8px 0" }}><strong>Unit ID:</strong> {activeHold.unitId}</p>
              <p style={{ margin: "4px 0", fontSize: "12px", color: "#78350f" }}><strong>Reservation ID:</strong> {activeHold.reservationId}</p>

              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  style={{ background: "#059669", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
                >
                  💳 Confirm & Pay (Simulated)
                </button>
                <button
                  onClick={handleRelease}
                  disabled={loading}
                  style={{ background: "#dc2626", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
                >
                  ❌ Abandon / Release
                </button>
              </div>
            </div>
          )}

          {/* CONFIRMED BOOKING STATE */}
          {confirmedBooking && (
            <div style={{ background: "#dcfce7", border: "1px solid #10b981", padding: "16px", borderRadius: "8px", marginTop: "12px" }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#065f46" }}>🎉 Booking Confirmed!</h3>
              <p style={{ margin: "4px 0" }}><strong>Seat Unit:</strong> {confirmedBooking.unitId}</p>
              <p style={{ margin: "4px 0", fontSize: "12px", color: "#047857" }}><strong>Reservation ID:</strong> {confirmedBooking.reservationId}</p>
              <p style={{ margin: "4px 0", fontSize: "12px", color: "#047857" }}><strong>Durable Status:</strong> Confirmed in Supabase Postgres</p>
              <button
                onClick={() => setConfirmedBooking(null)}
                style={{ marginTop: "12px", background: "#0f172a", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "4px", cursor: "pointer" }}
              >
                Book Another Seat
              </button>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: OPERATIONS & OBSERVATORY */}
        <section style={{ background: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
            <h2 style={{ margin: 0, fontSize: "18px" }}>2. Contention Observatory</h2>
            <button
              onClick={handleRunAudit}
              style={{ background: "#7c3aed", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
            >
              🔍 Run Invariant Audit
            </button>
          </div>

          {/* METRICS SUMMARY */}
          {metrics && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", margin: "14px 0" }}>
              <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "11px", color: "#64748b" }}>AVAILABLE</span>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#059669" }}>{metrics.inventory?.available ?? 0}</div>
              </div>
              <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "11px", color: "#64748b" }}>TOTAL REQS</span>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#2563eb" }}>{metrics.telemetry?.totalRequests ?? 0}</div>
              </div>
              <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "11px", color: "#64748b" }}>SOLD OUT REJECTS</span>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#dc2626" }}>{metrics.telemetry?.soldOutCount ?? 0}</div>
              </div>
            </div>
          )}

          {/* AUDIT REPORT */}
          {auditReport && (
            <div style={{ background: auditReport.passed ? "#f0fdf4" : "#fef2f2", border: `1px solid ${auditReport.passed ? "#86efac" : "#fca5a5"}`, padding: "12px", borderRadius: "6px", fontSize: "12px", marginBottom: "14px" }}>
              <div style={{ fontWeight: "bold", color: auditReport.passed ? "#166534" : "#991b1b" }}>
                Audit Status: {auditReport.passed ? "✅ 100% PASS (Zero Violations)" : "❌ ANOMALIES DETECTED"}
              </div>
              <p style={{ margin: "4px 0" }}>Single Ownership: {auditReport.checks?.singleOwnership?.details}</p>
              <p style={{ margin: "4px 0" }}>Capacity Conservation: {auditReport.checks?.capacityConservation?.details}</p>
            </div>
          )}

          {/* PREVIEW SEAT MATRIX (GRID) */}
          <h4 style={{ margin: "14px 0 6px 0", fontSize: "13px", color: "#475569" }}>
            Seat Status Grid ({inventoryGrid.length} configured units)
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "4px", maxHeight: "200px", overflowY: "auto", padding: "6px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            {inventoryGrid.slice(0, 100).map((u) => {
              let bg = "#dcfce7"; // Available
              if (u.status === "HELD") bg = "#fde68a"; // Held
              if (u.status === "CONFIRMED") bg = "#e9d5ff"; // Confirmed
              return (
                <div
                  key={u.unitId}
                  title={`${u.unitId} - ${u.status}`}
                  style={{ background: bg, fontSize: "9px", padding: "4px 2px", textAlign: "center", borderRadius: "3px", fontWeight: "bold", color: "#1e293b" }}
                >
                  {u.unitId.replace("unit-", "")}
                </div>
              );
            })}
          </div>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>Showing first 100 seats. Green=Available, Yellow=Held, Purple=Confirmed.</span>
        </section>
      </div>

      <footer style={{ marginTop: "40px", textAlign: "center", fontSize: "12px", color: "#94a3b8" }}>
        TicketWala High-Contention Reservation Engine &bull; Hack-a-Night 2026
      </footer>
    </div>
  );
}
