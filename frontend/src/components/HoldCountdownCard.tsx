"use client";

import React, { useState } from "react";
import type { HoldResponse } from "@/types/api";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Ticket,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building,
  User,
  Mail,
  Phone,
  Lock,
} from "lucide-react";

interface HoldCountdownCardProps {
  hold: HoldResponse;
  secondsRemaining: number;
  totalTTL?: number;
  onConfirm: (passengerData: { name: string; email: string; phone: string; paymentMethod: "UPI" | "CARD" | "NETBANKING" }) => void;
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
  const [name, setName] = useState("Rushikesh Thormise");
  const [email, setEmail] = useState("rushikesh@ticketwala.io");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "NETBANKING">("UPI");

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / totalTTL) * 100));
  const isUrgent = secondsRemaining <= 25;

  const basePrice = hold.price || 4500;
  const taxes = Math.round(basePrice * 0.05); // 5% GST
  const totalPrice = basePrice + taxes;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      name,
      email,
      phone,
      paymentMethod,
    });
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        padding: "24px",
        border: isUrgent ? "2px solid #EF4444" : "2px solid #FF6B35",
        boxShadow: isUrgent
          ? "0 12px 36px rgba(239, 68, 68, 0.2)"
          : "0 12px 36px rgba(255, 107, 53, 0.16)",
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.3s ease",
      }}
    >
      {/* Top Countdown Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
          paddingBottom: "14px",
          borderBottom: "1px solid #F1F5F9",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              backgroundColor: isUrgent ? "#FEE2E2" : "#FFF0EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${isUrgent ? "#EF4444" : "#FF6B35"}`,
            }}
          >
            <Ticket size={22} color={isUrgent ? "#EF4444" : "#FF6B35"} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "17px", fontWeight: 800, color: "#1E293B" }}>
                Seat Held: {hold.unitId}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  backgroundColor: isUrgent ? "#EF4444" : "#FF6B35",
                  color: "#FFFFFF",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                }}
              >
                HELD
              </span>
            </div>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              {hold.tierName || "Standard"} • {hold.eventTitle || "Multipurpose Event"}
            </span>
          </div>
        </div>

        {/* Live Countdown Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: isUrgent ? "#FEE2E2" : "#FFF0EB",
            color: isUrgent ? "#DC2626" : "#C2410C",
            padding: "8px 14px",
            borderRadius: "9999px",
            fontWeight: 800,
            fontSize: "14px",
            border: `1px solid ${isUrgent ? "#FCA5A5" : "rgba(255, 107, 53, 0.3)"}`,
          }}
        >
          <Clock size={16} />
          <span>
            {Math.floor(secondsRemaining / 60)}:
            {String(secondsRemaining % 60).padStart(2, "0")}
          </span>
          <span style={{ fontSize: "11px", fontWeight: 600 }}>left to pay</span>
        </div>
      </div>

      {/* Expiry Bar */}
      <div style={{ height: "6px", backgroundColor: "#F1F5F9", borderRadius: "9999px", overflow: "hidden", marginBottom: "20px" }}>
        <div
          style={{
            height: "100%",
            width: `${progressPercent}%`,
            backgroundColor: isUrgent ? "#EF4444" : "#FF6B35",
            transition: "width 1s linear, background-color 0.3s ease",
          }}
        />
      </div>

      <form onSubmit={handleSubmit}>
        {/* Passenger / Guest Details */}
        <div style={{ marginBottom: "18px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>
            Passenger / Attendee Details
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
            <div style={{ position: "relative" }}>
              <User size={15} color="#94A3B8" style={{ position: "absolute", left: "12px", top: "12px" }} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name as on ID"
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  borderRadius: "10px",
                  border: "1.5px solid #E2E8F0",
                  fontSize: "13px",
                  color: "#1E293B",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ position: "relative" }}>
                <Mail size={15} color="#94A3B8" style={{ position: "absolute", left: "12px", top: "12px" }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 36px",
                    borderRadius: "10px",
                    border: "1.5px solid #E2E8F0",
                    fontSize: "13px",
                    color: "#1E293B",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ position: "relative" }}>
                <Phone size={15} color="#94A3B8" style={{ position: "absolute", left: "12px", top: "12px" }} />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Mobile Number"
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 36px",
                    borderRadius: "10px",
                    border: "1.5px solid #E2E8F0",
                    fontSize: "13px",
                    color: "#1E293B",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>
            Select Payment Method
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            {[
              { id: "UPI", label: "UPI Instant", icon: Smartphone, desc: "GPay / PhonePe" },
              { id: "CARD", label: "Debit / Card", icon: CreditCard, desc: "Visa / Master" },
              { id: "NETBANKING", label: "Net Banking", icon: Building, desc: "All Major Banks" },
            ].map((method) => {
              const isSelected = paymentMethod === method.id;
              const Icon = method.icon;
              return (
                <div
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  style={{
                    border: isSelected ? "2px solid #2563EB" : "1.5px solid #E2E8F0",
                    backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
                    borderRadius: "12px",
                    padding: "10px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textAlign: "center",
                  }}
                >
                  <Icon size={18} color={isSelected ? "#2563EB" : "#64748B"} style={{ margin: "0 auto 4px auto" }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: isSelected ? "#1E3A8A" : "#334155", display: "block" }}>
                    {method.label}
                  </span>
                  <span style={{ fontSize: "10px", color: "#64748B" }}>{method.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fare Summary Breakdown */}
        <div
          style={{
            backgroundColor: "#F8FAFC",
            borderRadius: "12px",
            padding: "14px 16px",
            border: "1px solid #E2E8F0",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569", marginBottom: "6px" }}>
            <span>Seat Base Fare ({hold.tierName || "Standard"})</span>
            <span>₹{basePrice.toLocaleString("en-IN")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569", marginBottom: "8px" }}>
            <span>GST &amp; Security Convenience Fee</span>
            <span>₹{taxes.toLocaleString("en-IN")}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "15px",
              fontWeight: 800,
              color: "#0F172A",
              borderTop: "1px dashed #CBD5E1",
              paddingTop: "8px",
            }}
          >
            <span>Total Payable</span>
            <span style={{ color: "#059669" }}>₹{totalPrice.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="submit"
            disabled={isLoading || secondsRemaining <= 0}
            className="btn-primary"
            style={{
              flex: 1,
              padding: "12px 18px",
              fontSize: "14px",
              fontWeight: 800,
              borderRadius: "12px",
              backgroundColor: "#059669",
              borderColor: "#059669",
            }}
          >
            <Lock size={15} fill="#FFFFFF" />
            <span>{isLoading ? "Processing Payment..." : `Pay ₹${totalPrice.toLocaleString("en-IN")} & Confirm`}</span>
          </button>

          <button
            type="button"
            onClick={onRelease}
            disabled={isLoading}
            style={{
              padding: "12px 16px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#DC2626",
              backgroundColor: "#FEF2F2",
              border: "1.5px solid #FCA5A5",
              borderRadius: "12px",
              cursor: "pointer",
            }}
          >
            <XCircle size={15} />
            <span>Cancel</span>
          </button>
        </div>
      </form>
    </div>
  );
};
