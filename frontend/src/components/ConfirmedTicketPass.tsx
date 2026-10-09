"use client";

import React, { useState } from "react";
import type { ConfirmResponse } from "@/types/api";
import { Ticket, CheckCircle2, QrCode, Copy, Check, Download, Plane } from "lucide-react";

interface ConfirmedTicketPassProps {
  booking: ConfirmResponse;
  onBookAnother: () => void;
}

export const ConfirmedTicketPass: React.FC<ConfirmedTicketPassProps> = ({
  booking,
  onBookAnother,
}) => {
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(booking.reservationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        padding: "24px",
        border: "2px solid #2B2A28",
        boxShadow: "0 16px 40px rgba(43, 42, 40, 0.12)",
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          backgroundColor: "#ECFDF5",
          padding: "12px 18px",
          borderRadius: "12px",
          marginBottom: "20px",
          border: "1px solid rgba(16, 185, 129, 0.3)",
        }}
      >
        <CheckCircle2 size={24} color="#10B981" />
        <div>
          <span style={{ fontSize: "15px", fontWeight: 800, color: "#065F46", display: "block" }}>
            🎉 Flash Reservation Confirmed!
          </span>
          <span style={{ fontSize: "12px", color: "#047857" }}>
            Seat successfully reconciled with monotonic version fencing &amp; relational persistence.
          </span>
        </div>
      </div>

      {/* Boarding Pass Ticket Card */}
      <div
        style={{
          backgroundColor: "#2B2A28",
          color: "#FFFFFF",
          borderRadius: "16px",
          overflow: "hidden",
          position: "relative",
          marginBottom: "20px",
        }}
      >
        {/* Pass Header */}
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "#3A3936",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1.5px dashed rgba(255, 255, 255, 0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Ticket size={18} color="#FF6B35" />
            <span style={{ fontWeight: 800, fontSize: "14px", letterSpacing: "0.5px" }}>
              TICKETWALA FLASH PASS
            </span>
          </div>
          <span
            style={{
              backgroundColor: "#FF6B35",
              color: "#FFFFFF",
              fontSize: "11px",
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: "9999px",
            }}
          >
            CONFIRMED
          </span>
        </div>

        {/* Pass Body */}
        <div style={{ padding: "20px", display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#8E8D88", textTransform: "uppercase" }}>Allocated Unit</div>
            <div style={{ fontSize: "32px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-1px" }}>
              {booking.unitId}
            </div>
            <div style={{ fontSize: "12px", color: "#FF6B35", fontWeight: 600, marginTop: "4px" }}>
              Zone A &bull; Express Priority Boarding
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11px", color: "#8E8D88", textTransform: "uppercase" }}>Monotonic Version</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#FFFFFF" }}>
              v{booking.version}
            </div>
            <div style={{ fontSize: "11px", color: "#8E8D88", marginTop: "4px" }}>
              Confirmed at: {new Date(booking.confirmedAt * 1000).toLocaleTimeString()}
            </div>
          </div>

          {/* Simulated QR Code */}
          <div
            style={{
              width: "72px",
              height: "72px",
              backgroundColor: "#FFFFFF",
              borderRadius: "8px",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QrCode size={56} color="#2B2A28" />
          </div>
        </div>

        {/* Reservation Key Strip */}
        <div
          style={{
            padding: "12px 20px",
            backgroundColor: "#201F1D",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "11px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
            <span style={{ color: "#8E8D88" }}>ID:</span>
            <span style={{ fontFamily: "monospace", color: "#FFFFFF" }}>{booking.reservationId}</span>
          </div>
          <button
            onClick={copyId}
            style={{
              background: "transparent",
              border: "none",
              color: "#FF6B35",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Action to book another */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={onBookAnother}
          className="btn-dark"
          style={{ flex: 1, padding: "12px" }}
        >
          Book Another Inventory Unit
        </button>
      </div>
    </div>
  );
};
