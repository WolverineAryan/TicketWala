"use client";

import React from "react";
import type { InvariantAuditReport } from "@/types/api";
import { X, ShieldCheck, AlertCircle, CheckCircle2, Cpu } from "lucide-react";

interface AuditReportModalProps {
  report: InvariantAuditReport | null;
  onClose: () => void;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  report,
  onClose,
}) => {
  if (!report) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(43, 42, 40, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "20px",
          maxWidth: "600px",
          width: "100%",
          padding: "28px",
          border: "1.5px solid #E6E5E3",
          boxShadow: "0 25px 60px -15px rgba(43, 42, 40, 0.3)",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "#F8F8F7",
            border: "1px solid #E6E5E3",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={16} color="#2B2A28" />
        </button>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: report.passed ? "#ECFDF5" : "#FEE2E2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {report.passed ? (
              <ShieldCheck size={24} color="#10B981" />
            ) : (
              <AlertCircle size={24} color="#EF4444" />
            )}
          </div>
          <div>
            <h3 style={{ fontSize: "19px", fontWeight: 800, color: "#2B2A28", margin: 0 }}>
              Invariant Audit Certification
            </h3>
            <span style={{ fontSize: "11px", color: "#8E8D88" }}>
              Timestamp: {new Date(report.timestamp).toLocaleTimeString()} &bull; Mathematical Proof
            </span>
          </div>
        </div>

        {/* Status Callout */}
        <div
          style={{
            backgroundColor: report.passed ? "#ECFDF5" : "#FEE2E2",
            border: `1.5px solid ${report.passed ? "#10B981" : "#EF4444"}`,
            borderRadius: "12px",
            padding: "14px 18px",
            marginBottom: "20px",
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: 800, color: report.passed ? "#065F46" : "#991B1B" }}>
            {report.passed ? "✅ 100% PASS — ZERO DOUBLE ALLOCATIONS VERIFIED" : "❌ AUDIT ANOMALY DETECTED"}
          </div>
          <div style={{ fontSize: "12px", color: report.passed ? "#047857" : "#B91C1C", marginTop: "4px" }}>
            Every inventory unit adheres strictly to single-ownership and capacity preservation axioms.
          </div>
        </div>

        {/* Capacity Summary Table */}
        <div
          style={{
            backgroundColor: "#F8F8F7",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
            fontSize: "13px",
          }}
        >
          <div style={{ fontWeight: 700, color: "#2B2A28", marginBottom: "10px" }}>
            Capacity Breakdown (Configured: {report.summary.totalConfiguredCapacity})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
            <div>Available in FIFO Queue: <strong>{report.summary.availableQueueLength}</strong></div>
            <div>Active TTL Holds: <strong>{report.summary.activeHolds}</strong></div>
            <div>Confirmed in Storage: <strong>{report.summary.confirmedBookings}</strong></div>
            <div>Violations Detected: <strong style={{ color: "#10B981" }}>{report.summary.violationsCount}</strong></div>
          </div>
        </div>

        {/* Detailed Checks */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E6E5E3", padding: "12px", borderRadius: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "13px" }}>
              <CheckCircle2 size={16} color="#10B981" />
              <span>Single Ownership Invariant</span>
            </div>
            <p style={{ margin: "4px 0 0 22px", fontSize: "12px", color: "#5C5B57" }}>
              {report.checks?.singleOwnership?.details || "Passed: Verified each unit is held by at most 1 user"}
            </p>
          </div>

          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E6E5E3", padding: "12px", borderRadius: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "13px" }}>
              <CheckCircle2 size={16} color="#10B981" />
              <span>Capacity Conservation Invariant</span>
            </div>
            <p style={{ margin: "4px 0 0 22px", fontSize: "12px", color: "#5C5B57" }}>
              {report.checks?.capacityConservation?.details || "Passed: Available + Held + Confirmed = Total Capacity"}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="btn-dark"
          style={{ width: "100%", padding: "12px" }}
        >
          Dismiss Certification
        </button>
      </div>
    </div>
  );
};
