"use client";

import React from "react";
import type { HoldResponse } from "@/types/api";
import { Clock, CheckCircle2, XCircle, ShieldAlert, KeyRound, Ticket } from "lucide-react";

interface HoldCountdownCardProps {
  hold: HoldResponse;
  secondsRemaining: number;
  totalTTL?: number;
  onConfirm: () => void;
  onRelease: () => void;
  isLoading: boolean;
}

export const HoldCountdownCard: React.FC<HoldCountdownCardProps> = ({
  hold,
  secondsRemaining,
  totalTTL = 120,
  onConfirm,
  onRelease,
  isLoading,
}) => {
  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / totalTTL) * 100));
  const isUrgent = secondsRemaining <= 20;

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        padding: "24px",
        border: "2px solid #FF6B35",
        boxShadow: "0 12px 36px rgba(255, 107, 53, 0.16)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Accent glow */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "160px",
          height: "160px",
          borderRadius: "50%",
          backgroundColor: "#FFF0EB",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Top Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                backgroundColor: "#FFF0EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255, 107, 53, 0.4)",
              }}
            >
              <Ticket size={22} color="#FF6B35" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "#2B2A28" }}>
                  Active Hold: {hold.unitId}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    backgroundColor: "#FF6B35",
                    color: "#FFFFFF",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                  }}
                >
                  HELD
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#8E8D88" }}>
                Exclusive transactional hold locked via Redis Lua
              </div>
            </div>
          </div>

          {/* Countdown Clock Display */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: isUrgent ? "#FEE2E2" : "#FFF0EB",
              border: `1.5px solid ${isUrgent ? "#EF4444" : "#FF6B35"}`,
              padding: "6px 14px",
              borderRadius: "9999px",
              color: isUrgent ? "#B91C1C" : "#FF6B35",
              fontWeight: 800,
              fontSize: "14px",
            }}
          >
            <Clock size={16} />
            <span>{secondsRemaining}s Remaining</span>
          </div>
        </div>

        {/* Progress Bar for TTL */}
        <div
          style={{
            width: "100%",
            height: "6px",
            backgroundColor: "#F1F1EF",
            borderRadius: "3px",
            overflow: "hidden",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              backgroundColor: isUrgent ? "#EF4444" : "#FF6B35",
              transition: "width 1s linear, background-color 0.3s ease",
            }}
          />
        </div>

        {/* Reservation Metadata Details */}
        <div
          style={{
            backgroundColor: "#F8F8F7",
            borderRadius: "12px",
            padding: "14px 18px",
            marginBottom: "20px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "10px",
            fontSize: "12px",
          }}
        >
          <div>
            <span style={{ color: "#8E8D88", display: "block" }}>Reservation ID</span>
            <span style={{ fontWeight: 700, color: "#2B2A28", fontFamily: "monospace", fontSize: "11px" }}>
              {hold.reservationId}
            </span>
          </div>

          <div>
            <span style={{ color: "#8E8D88", display: "block" }}>Hold Token (Fenced Secret)</span>
            <span style={{ fontWeight: 700, color: "#2B2A28", fontFamily: "monospace", fontSize: "11px" }}>
              {hold.holdToken?.slice(0, 16)}...
            </span>
          </div>

          <div>
            <span style={{ color: "#8E8D88", display: "block" }}>Monotonic Version</span>
            <span style={{ fontWeight: 700, color: "#2B2A28" }}>v{hold.version}</span>
          </div>

          <div>
            <span style={{ color: "#8E8D88", display: "block" }}>Event Scope</span>
            <span style={{ fontWeight: 700, color: "#2B2A28" }}>{hold.eventId || "evt-main"}</span>
          </div>
        </div>

        {/* Actions (Confirm vs Abandon) */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={onConfirm}
            disabled={isLoading || secondsRemaining <= 0}
            className="btn-primary"
            style={{ flex: "1 1 200px", padding: "12px 20px" }}
          >
            <CheckCircle2 size={18} />
            <span>{isLoading ? "Processing Lock..." : "💳 Confirm & Pay (Simulated)"}</span>
          </button>

          <button
            onClick={onRelease}
            disabled={isLoading}
            className="btn-secondary"
            style={{
              flex: "0 1 180px",
              padding: "12px 18px",
              color: "#DC2626",
              borderColor: "rgba(220, 38, 38, 0.3)",
            }}
          >
            <XCircle size={18} />
            <span>Abandon / Release</span>
          </button>
        </div>

        <p style={{ margin: "14px 0 0 0", fontSize: "11px", color: "#8E8D88", textAlign: "center" }}>
          ⚡ Strict Safety: If timer hits 0s, Lua script releases hold and requeues unit to FIFO queue with zero race hazard.
        </p>
      </div>
    </div>
  );
};
