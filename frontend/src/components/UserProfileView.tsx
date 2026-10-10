"use client";

import React from "react";
import type { ConfirmResponse, HoldResponse } from "@/types/api";
import { User, Ticket, ShieldCheck, Clock, Key, ArrowRight, CheckCircle2, QrCode } from "lucide-react";

interface UserProfileViewProps {
  confirmedBookings: ConfirmResponse[];
  activeHold: HoldResponse | null;
  secondsRemaining: number;
  onGoToBooking: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  confirmedBookings,
  activeHold,
  secondsRemaining,
  onGoToBooking,
}) => {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px 64px 24px" }}>
      {/* Profile Header */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "20px",
          padding: "28px",
          border: "1.5px solid #E6E5E3",
          marginBottom: "28px",
          boxShadow: "0 8px 24px rgba(43, 42, 40, 0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "#2B2A28",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #FF6B35",
            }}
          >
            <User size={28} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#2B2A28", margin: 0 }}>
                Rushikesh &bull; VIP Ticket Holder
              </h2>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  backgroundColor: "#FFF0EB",
                  color: "#FF6B35",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                }}
              >
                Fast-Lane Verified
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "#8E8D88", margin: "4px 0 0 0" }}>
              Client ID: <span style={{ fontFamily: "monospace", color: "#2B2A28" }}>usr-7749-mumbai</span> &bull; 
              Idempotency Scope: <span style={{ fontFamily: "monospace", color: "#2B2A28" }}>session-live-01</span>
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "14px" }}>
          <div style={{ backgroundColor: "#F8F8F7", padding: "10px 16px", borderRadius: "12px", textAlign: "center" }}>
            <span style={{ fontSize: "11px", color: "#8E8D88", display: "block" }}>CONFIRMED</span>
            <span style={{ fontSize: "18px", fontWeight: 800, color: "#2B2A28" }}>{confirmedBookings.length}</span>
          </div>

          <div style={{ backgroundColor: "#F8F8F7", padding: "10px 16px", borderRadius: "12px", textAlign: "center" }}>
            <span style={{ fontSize: "11px", color: "#8E8D88", display: "block" }}>ACTIVE HOLDS</span>
            <span style={{ fontSize: "18px", fontWeight: 800, color: activeHold ? "#FF6B35" : "#2B2A28" }}>
              {activeHold ? "1" : "0"}
            </span>
          </div>
        </div>
      </div>

      {/* Active Hold Alert Card */}
      {activeHold && (
        <div
          style={{
            backgroundColor: "#FFF0EB",
            border: "2px solid #FF6B35",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Clock size={24} color="#FF6B35" />
            <div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#2B2A28" }}>
                Active Reservation Hold: {activeHold.unitId}
              </div>
              <div style={{ fontSize: "12px", color: "#FF6B35", fontWeight: 700 }}>
                Expires in {secondsRemaining} seconds! Complete checkout to claim.
              </div>
            </div>
          </div>

          <button onClick={onGoToBooking} className="btn-primary" style={{ padding: "10px 20px", fontSize: "13px" }}>
            <span>Checkout Hold Now</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Confirmed Passes Section */}
      <div style={{ marginBottom: "32px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#2B2A28", marginBottom: "16px" }}>
          Confirmed Ticket Passes ({confirmedBookings.length})
        </h3>

        {confirmedBookings.length === 0 ? (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "40px 20px",
              textAlign: "center",
              border: "1.5px dashed #D4D3CF",
            }}
          >
            <Ticket size={40} color="#D4D3CF" style={{ marginBottom: "12px" }} />
            <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#2B2A28", margin: "0 0 6px 0" }}>
              No Confirmed Tickets Yet
            </h4>
            <p style={{ fontSize: "13px", color: "#8E8D88", margin: "0 0 18px 0" }}>
              Join a flash drop and confirm a seat to generate your digital boarding pass.
            </p>
            <button onClick={onGoToBooking} className="btn-dark" style={{ padding: "10px 22px", fontSize: "13px" }}>
              Book Your First Flash Seat
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {confirmedBookings.map((b) => (
              <div
                key={b.reservationId}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "20px",
                  border: "1.5px solid #E6E5E3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      backgroundColor: "#2B2A28",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <QrCode size={26} color="#FFFFFF" />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "17px", fontWeight: 800, color: "#2B2A28" }}>
                        Unit {b.unitId}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          backgroundColor: "#ECFDF5",
                          color: "#065F46",
                          padding: "2px 6px",
                          borderRadius: "9999px",
                        }}
                      >
                        CONFIRMED
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#8E8D88", marginTop: "2px" }}>
                      Reservation: <span style={{ fontFamily: "monospace" }}>{b.reservationId}</span> &bull; Version: v{b.version}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "12px", color: "#10B981", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle2 size={15} />
                    <span>Durable Postgres Persisted</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
