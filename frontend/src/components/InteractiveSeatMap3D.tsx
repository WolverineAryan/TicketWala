"use client";

import React, { useState } from "react";
import type { InventoryUnitState, ReservationStatus } from "@/types/api";
import { Check, Lock, ShieldCheck, Eye, Layers } from "lucide-react";

interface InteractiveSeatMap3DProps {
  units: InventoryUnitState[];
  selectedUnitId?: string;
  activeHoldUnitId?: string;
  onSelectUnit?: (unitId: string) => void;
  isLoading?: boolean;
}

export const InteractiveSeatMap3D: React.FC<InteractiveSeatMap3DProps> = ({
  units,
  selectedUnitId,
  activeHoldUnitId,
  onSelectUnit,
  isLoading = false,
}) => {
  const [is3DMode, setIs3DMode] = useState(true);
  const [hoveredUnit, setHoveredUnit] = useState<InventoryUnitState | null>(null);

  // Fallback generation if inventory is empty
  const displayUnits: InventoryUnitState[] = units.length > 0
    ? units
    : Array.from({ length: 200 }, (_, i) => {
        const id = `unit-${String(i + 1).padStart(3, "0")}`;
        let status: ReservationStatus = "AVAILABLE";
        if (i < 12) status = "CONFIRMED";
        else if (i >= 12 && i < 18) status = "HELD";
        return {
          unitId: id,
          status,
          version: 1,
        };
      });

  const availableCount = displayUnits.filter((u) => u.status === "AVAILABLE").length;
  const heldCount = displayUnits.filter((u) => u.status === "HELD").length;
  const confirmedCount = displayUnits.filter((u) => u.status === "CONFIRMED").length;

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
          marginBottom: "20px",
          paddingBottom: "16px",
          borderBottom: "1px solid #E6E5E3",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#2B2A28", margin: 0 }}>
              Flight & Arena Inventory Matrix
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
              200 Contended Units
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "#8E8D88", margin: "4px 0 0 0" }}>
            Real-time in-memory inventory broker synchronized via atomic Lua locks
          </p>
        </div>

        {/* 3D View Toggle & Counts */}
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
          <span style={{ color: "#FF6B35", fontWeight: 700 }}>Held / Locked ({heldCount})</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "4px",
              backgroundColor: "#2B2A28",
              display: "inline-block",
            }}
          />
          <span style={{ color: "#5C5B57", fontWeight: 600 }}>Confirmed ({confirmedCount})</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "4px",
              backgroundColor: "#FFF0EB",
              border: "2px solid #FF6B35",
              display: "inline-block",
            }}
          />
          <span style={{ color: "#2B2A28", fontWeight: 700 }}>Your Active Hold</span>
        </div>
      </div>

      {/* The 3D Aircraft / Arena Seat Matrix */}
      <div
        style={{
          perspective: is3DMode ? "900px" : "none",
          padding: "16px 0",
          overflowX: "auto",
        }}
      >
        <div
          style={{
            transform: is3DMode ? "rotateX(22deg) scale(0.96)" : "none",
            transformOrigin: "center top",
            transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            backgroundColor: "#F8F8F7",
            borderRadius: "16px",
            padding: "20px",
            border: "1.5px solid #E6E5E3",
            boxShadow: is3DMode ? "0 20px 40px -10px rgba(43, 42, 40, 0.15)" : "none",
          }}
        >
          {/* Airplane Cockpit / Stage Indicator */}
          <div
            style={{
              textAlign: "center",
              paddingBottom: "14px",
              marginBottom: "16px",
              borderBottom: "1px dashed #D4D3CF",
              color: "#8E8D88",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            ✈️ Flight Nose / Concert Stage Front (Aisle A &bull; FCFS Head)
          </div>

          {/* Seat Grid - 20 rows of 10 seats (200 units) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(10, minmax(28px, 1fr))",
              gap: "6px",
              maxHeight: "360px",
              overflowY: "auto",
              padding: "4px",
            }}
          >
            {displayUnits.map((unit) => {
              const isHeld = unit.status === "HELD";
              const isConfirmed = unit.status === "CONFIRMED";
              const isAvailable = unit.status === "AVAILABLE";
              const isMyHold = activeHoldUnitId === unit.unitId;
              const isSelected = selectedUnitId === unit.unitId;

              let bg = "#FFFFFF";
              let textColor = "#2B2A28";
              let border = "1.5px solid #D4D3CF";
              let boxShadow = "none";

              if (isConfirmed) {
                bg = "#2B2A28";
                textColor = "#8E8D88";
                border = "1.5px solid #2B2A28";
              } else if (isMyHold) {
                bg = "#FFF0EB";
                textColor = "#FF6B35";
                border = "2px solid #FF6B35";
                boxShadow = "0 0 10px rgba(255, 107, 53, 0.6)";
              } else if (isHeld) {
                bg = "#FF6B35";
                textColor = "#FFFFFF";
                border = "1.5px solid #FF6B35";
                boxShadow = "0 0 6px rgba(255, 107, 53, 0.4)";
              } else if (isSelected) {
                border = "2px solid #2B2A28";
                boxShadow = "0 0 8px rgba(43, 42, 40, 0.2)";
              }

              return (
                <button
                  key={unit.unitId}
                  onClick={() => onSelectUnit && onSelectUnit(unit.unitId)}
                  onMouseEnter={() => setHoveredUnit(unit)}
                  onMouseLeave={() => setHoveredUnit(null)}
                  disabled={isLoading}
                  style={{
                    backgroundColor: bg,
                    color: textColor,
                    border,
                    borderRadius: "6px",
                    padding: "6px 2px",
                    fontSize: "10px",
                    fontWeight: 700,
                    cursor: isAvailable ? "pointer" : "default",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "2px",
                    minHeight: "38px",
                    boxShadow,
                    transition: "all 0.15s ease",
                    transform: hoveredUnit?.unitId === unit.unitId ? "scale(1.15) translateZ(10px)" : "none",
                    zIndex: hoveredUnit?.unitId === unit.unitId ? 20 : 1,
                  }}
                >
                  <span>{unit.unitId.replace("unit-", "")}</span>
                  {isConfirmed && <Check size={10} color="#8E8D88" />}
                  {isHeld && !isMyHold && <Lock size={9} color="#FFFFFF" />}
                  {isMyHold && <span style={{ fontSize: "8px", fontWeight: 900 }}>YOU</span>}
                </button>
              );
            })}
          </div>

          <div
            style={{
              textAlign: "center",
              paddingTop: "14px",
              marginTop: "16px",
              borderTop: "1px dashed #D4D3CF",
              color: "#8E8D88",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            Aft Cabin / Grandstand Rear (Row T) &bull; Units auto-requeued to FIFO head upon hold abandonment
          </div>
        </div>
      </div>

      {/* Floating Hover Unit Details Banner */}
      {hoveredUnit && (
        <div
          style={{
            marginTop: "14px",
            backgroundColor: "#2B2A28",
            borderRadius: "10px",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#FFFFFF",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: 800, color: "#FF6B35" }}>Unit #{hoveredUnit.unitId}</span>
            <span style={{ color: "#8E8D88" }}>|</span>
            <span>Status: <strong>{hoveredUnit.status}</strong></span>
            <span style={{ color: "#8E8D88" }}>|</span>
            <span>Version: v{hoveredUnit.version}</span>
          </div>
          <div style={{ color: "#8E8D88", fontSize: "11px" }}>
            {hoveredUnit.status === "AVAILABLE" ? "Ready for instant FCFS hold" : "Atomic lock active"}
          </div>
        </div>
      )}
    </div>
  );
};
