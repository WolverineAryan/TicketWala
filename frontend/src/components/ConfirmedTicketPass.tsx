"use client";

import React, { useState } from "react";
import type { ConfirmResponse } from "@/types/api";
import { Ticket, CheckCircle2, QrCode, Copy, Check, Download, Plane, Calendar, MapPin, User, ShieldCheck } from "lucide-react";

interface ConfirmedTicketPassProps {
  booking: ConfirmResponse;
  onBookAnother: () => void;
}

export const ConfirmedTicketPass: React.FC<ConfirmedTicketPassProps> = ({
  booking,
  onBookAnother,
}) => {
  const [copied, setCopied] = useState(false);

  const copyPnr = () => {
    navigator.clipboard.writeText(booking.pnr || booking.reservationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        padding: "24px",
        border: "1.5px solid #E2E8F0",
        boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          backgroundColor: "#ECFDF5",
          padding: "14px 18px",
          borderRadius: "14px",
          marginBottom: "20px",
          border: "1px solid rgba(16, 185, 129, 0.3)",
        }}
      >
        <CheckCircle2 size={24} color="#10B981" />
        <div>
          <span style={{ fontSize: "16px", fontWeight: 800, color: "#065F46", display: "block" }}>
            Booking Confirmed! 🎉
          </span>
          <span style={{ fontSize: "12px", color: "#047857" }}>
            Your seat is durably locked. A copy of the e-ticket has been issued with PNR: {booking.pnr || "CONFIRMED"}.
          </span>
        </div>
      </div>

      {/* Boarding Pass Ticket Card */}
      <div
        style={{
          backgroundColor: "#0F172A",
          color: "#FFFFFF",
          borderRadius: "16px",
          overflow: "hidden",
          position: "relative",
          marginBottom: "20px",
          boxShadow: "0 10px 25px rgba(15, 23, 42, 0.2)",
        }}
      >
        {/* Pass Header */}
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "#1E293B",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1.5px dashed rgba(255, 255, 255, 0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Ticket size={18} color="#FF6B35" />
            <span style={{ fontWeight: 800, fontSize: "14px", letterSpacing: "0.5px" }}>
              TICKETWALA VERIFIED PASS
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                backgroundColor: "#10B981",
                color: "#FFFFFF",
                fontSize: "11px",
                fontWeight: 800,
                padding: "3px 10px",
                borderRadius: "9999px",
              }}
            >
              CONFIRMED
            </span>
          </div>
        </div>

        {/* Pass Body */}
        <div style={{ padding: "20px" }}>
          {/* Event Title & Venue */}
          <div style={{ marginBottom: "18px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 6px 0", color: "#F8FAFC" }}>
              {booking.eventTitle || "Multipurpose Event Booking"}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#94A3B8" }}>
              <MapPin size={13} color="#FF6B35" />
              <span>{booking.venue || "Official Venue"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>
              <Calendar size={13} color="#38BDF8" />
              <span>{booking.dateTime || "Scheduled Time"}</span>
            </div>
          </div>

          {/* Ticket Information Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              padding: "14px",
              borderRadius: "12px",
              marginBottom: "18px",
            }}
          >
            <div>
              <span style={{ fontSize: "10px", color: "#94A3B8", textTransform: "uppercase", display: "block" }}>
                Seat Assigned
              </span>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "#FF6B35" }}>
                {booking.unitId}
              </span>
            </div>

            <div>
              <span style={{ fontSize: "10px", color: "#94A3B8", textTransform: "uppercase", display: "block" }}>
                Tier / Class
              </span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC" }}>
                {booking.tierName || "Standard"}
              </span>
            </div>

            <div>
              <span style={{ fontSize: "10px", color: "#94A3B8", textTransform: "uppercase", display: "block" }}>
                Booking Ref (PNR)
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#38BDF8", fontFamily: "monospace" }}>
                  {booking.pnr || "CONFIRMED"}
                </span>
                <button
                  onClick={copyPnr}
                  title="Copy PNR"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "#94A3B8",
                  }}
                >
                  {copied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>

          {/* Passenger & Payment Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", borderTop: "1px dashed rgba(255, 255, 255, 0.15)", paddingTop: "14px" }}>
            <div>
              <span style={{ color: "#94A3B8", display: "block" }}>Passenger / Attendee</span>
              <span style={{ fontWeight: 700, color: "#F8FAFC" }}>{booking.passengerName || "Verified Guest"}</span>
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{ color: "#94A3B8", display: "block" }}>Amount Paid</span>
              <span style={{ fontWeight: 800, color: "#10B981", fontSize: "15px" }}>
                ₹{(booking.amountPaid || 4500).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={handlePrint}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            backgroundColor: "#0F172A",
            color: "#FFFFFF",
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <Download size={16} />
          <span>Save / Print E-Ticket</span>
        </button>

        <button
          onClick={onBookAnother}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            backgroundColor: "#F1F5F9",
            color: "#334155",
            padding: "12px",
            borderRadius: "12px",
            border: "1.5px solid #CBD5E1",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <span>Book Another Seat</span>
        </button>
      </div>
    </div>
  );
};
