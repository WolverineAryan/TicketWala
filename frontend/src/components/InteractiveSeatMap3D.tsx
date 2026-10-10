"use client";

import React, { useState } from "react";
import type { InventoryUnitState, ReservationStatus, SeatTier } from "@/types/api";
import { Check, Lock, Eye, Layers, Sparkles, Plane, Mic, Trophy, Film, TrainFront } from "lucide-react";

interface InteractiveSeatMap3DProps {
  units: InventoryUnitState[];
  selectedUnitId?: string;
  activeHoldUnitId?: string;
  onSelectUnit?: (unitId: string) => void;
  isLoading?: boolean;
  eventTitle?: string;
  eventCategory?: string;
}

export const InteractiveSeatMap3D: React.FC<InteractiveSeatMap3DProps> = ({
  units,
  selectedUnitId,
  activeHoldUnitId,
  onSelectUnit,
  isLoading = false,
  eventTitle = "Interactive Seating Plan",
  eventCategory = "FLIGHT",
}) => {
  const [is3DMode, setIs3DMode] = useState(true);
  const [hoveredUnit, setHoveredUnit] = useState<InventoryUnitState | null>(null);

  // Fallback generation if inventory is empty
  const displayUnits: InventoryUnitState[] =
    units.length > 0
      ? units
      : Array.from({ length: 192 }, (_, i) => {
          const id = `unit-${String(i + 1).padStart(3, "0")}`;
          let status: ReservationStatus = "AVAILABLE";
          if (i < 12) status = "CONFIRMED";
          else if (i >= 12 && i < 18) status = "HELD";

          const row = Math.ceil((i + 1) / 6);
          const colLetters = ["A", "B", "C", "D", "E", "F"];
          const col = i % 6;
          const seatLabel = `${row}${colLetters[col]}`;

          let tierName = "Economy";
          let price = 48500;
          if (row <= 2) {
            tierName = "First Class";
            price = 120000;
          } else if (row <= 7) {
            tierName = "Business Class";
            price = 75000;
          }

          return {
            unitId: id,
            seatLabel,
            status,
            version: 1,
            tierName,
            price,
            row,
            col: col + 1,
          };
        });

  const availableCount = displayUnits.filter((u) => u.status === "AVAILABLE").length;
  const heldCount = displayUnits.filter((u) => u.status === "HELD").length;
  const confirmedCount = displayUnits.filter((u) => u.status === "CONFIRMED").length;

  const stageLabel =
    eventCategory === "FLIGHT"
      ? "🛫 Cockpit & Flight Direction"
      : eventCategory === "CONCERT"
      ? "🎤 Main Stage & Sound Pod"
      : eventCategory === "SPORTS"
      ? "🏏 Pitch & Center Wicket"
      : eventCategory === "CINEMA"
      ? "📽️ IMAX Curved 70mm Screen"
      : "🚆 Engine / Driver Cab";

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        padding: "24px",
        border: "1.5px solid #E6E5E3",
        boxShadow: "0 10px 30px rgba(43, 42, 40, 0.05)",
        position: "relative",
      }}
    >
      {/* Top Header & Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "18px",
          paddingBottom: "16px",
          borderBottom: "1px solid #E6E5E3",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#2B2A28", margin: 0 }}>
              {eventTitle}
            </h3>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                backgroundColor: "#F1F1EF",
                color: "#2B2A28",
                padding: "2px 8px",
                borderRadius: "9999px",
              }}
            >
              {displayUnits.length} Seats
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "#8E8D88", margin: "4px 0 0 0" }}>
            Click any seat to lock it with a 120-second lease guarantee
          </p>
        </div>

        {/* 3D View Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "9999px",
              border: "1px solid #E6E5E3",
              backgroundColor: is3DMode ? "#2B2A28" : "#FFFFFF",
              color: is3DMode ? "#FFFFFF" : "#2B2A28",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <Layers size={13} color={is3DMode ? "#FF6B35" : "#2B2A28"} />
            <span>{is3DMode ? "3D Isometric View" : "2D Plan View"}</span>
          </button>
        </div>
      </div>

      {/* Legend Badges */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          backgroundColor: "#F8F8F7",
          padding: "10px 16px",
          borderRadius: "12px",
          marginBottom: "20px",
          fontSize: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "4px",
              backgroundColor: "#FFFFFF",
              border: "1.5px solid #2B2A28",
              display: "inline-block",
            }}
          />
          <span style={{ color: "#2B2A28", fontWeight: 600 }}>Available ({availableCount})</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "4px",
              backgroundColor: "#FF6B35",
              display: "inline-block",
              boxShadow: "0 0 6px rgba(255, 107, 53, 0.5)",
            }}
          />
          <span style={{ color: "#FF6B35", fontWeight: 700 }}>Held ({heldCount})</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "4px",
              backgroundColor: "#CBD5E1",
              display: "inline-block",
            }}
          />
          <span style={{ color: "#64748B", fontWeight: 500 }}>Booked ({confirmedCount})</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "4px",
              backgroundColor: "#2563EB",
              display: "inline-block",
            }}
          />
          <span style={{ color: "#2563EB", fontWeight: 700 }}>Your Selection</span>
        </div>
      </div>

      {/* Screen / Stage Orientation Indicator */}
      <div
        style={{
          textAlign: "center",
          padding: "8px",
          backgroundColor: "#F1F5F9",
          borderRadius: "10px",
          border: "1.5px dashed #CBD5E1",
          marginBottom: "24px",
          fontSize: "12px",
          fontWeight: 700,
          color: "#475569",
          letterSpacing: "0.5px",
        }}
      >
        {stageLabel}
      </div>

      {/* Interactive Grid Canvas */}
      <div
        style={{
          perspective: is3DMode ? "1000px" : "none",
          overflowX: "auto",
          padding: "16px 8px 32px 8px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            transform: is3DMode ? "rotateX(24deg) scale(0.96)" : "none",
            transformOrigin: "top center",
            transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            display: "grid",
            gridTemplateColumns: "repeat(6, 48px)",
            gap: "10px",
            justifyContent: "center",
          }}
        >
          {displayUnits.map((u, index) => {
            const isHeldByMe = activeHoldUnitId === u.unitId;
            const isSelected = selectedUnitId === u.unitId;
            const isAvailable = u.status === "AVAILABLE";
            const isHeldOther = u.status === "HELD" && !isHeldByMe;
            const isConfirmed = u.status === "CONFIRMED";

            let bg = "#FFFFFF";
            let borderColor = "#CBD5E1";
            let textColor = "#1E293B";
            let cursor = "pointer";

            if (isHeldByMe || isSelected) {
              bg = "#2563EB";
              borderColor = "#1D4ED8";
              textColor = "#FFFFFF";
            } else if (isHeldOther) {
              bg = "#FF6B35";
              borderColor = "#EA580C";
              textColor = "#FFFFFF";
              cursor = "not-allowed";
            } else if (isConfirmed) {
              bg = "#E2E8F0";
              borderColor = "#CBD5E1";
              textColor = "#94A3B8";
              cursor = "not-allowed";
            }

            const label = u.seatLabel || u.unitId.replace("unit-", "");

            return (
              <button
                key={u.unitId}
                disabled={isLoading || !isAvailable}
                onClick={() => isAvailable && onSelectUnit && onSelectUnit(u.unitId)}
                onMouseEnter={() => setHoveredUnit(u)}
                onMouseLeave={() => setHoveredUnit(null)}
                style={{
                  width: "48px",
                  height: "44px",
                  borderRadius: "8px",
                  border: `1.5px solid ${borderColor}`,
                  backgroundColor: bg,
                  color: textColor,
                  fontSize: "11px",
                  fontWeight: 800,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor,
                  transition: "all 0.15s ease",
                  transform: isSelected ? "translateY(-4px)" : "none",
                  boxShadow: isSelected
                    ? "0 8px 16px rgba(37, 99, 235, 0.3)"
                    : isHeldOther
                    ? "0 4px 10px rgba(255, 107, 53, 0.25)"
                    : "0 2px 4px rgba(0,0,0,0.02)",
                  position: "relative",
                  outline: "none",
                  marginRight: (index % 6 === 2) ? "18px" : "0", // Aisle gap in middle
                }}
              >
                <span>{label}</span>
                {u.price && (
                  <span style={{ fontSize: "8px", opacity: 0.8, fontWeight: 600 }}>
                    ₹{Math.round(u.price / 1000)}k
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredUnit && (
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#0F172A",
            color: "#FFFFFF",
            padding: "8px 16px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.25)",
            zIndex: 10,
          }}
        >
          <span>Seat {hoveredUnit.seatLabel || hoveredUnit.unitId}</span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span>{hoveredUnit.tierName || "Standard"}</span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span style={{ color: "#38BDF8" }}>
            {hoveredUnit.price ? `₹${hoveredUnit.price.toLocaleString("en-IN")}` : "Available"}
          </span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span
            style={{
              color:
                hoveredUnit.status === "AVAILABLE"
                  ? "#10B981"
                  : hoveredUnit.status === "HELD"
                  ? "#FF6B35"
                  : "#94A3B8",
            }}
          >
            {hoveredUnit.status}
          </span>
        </div>
      )}
    </div>
  );
};
