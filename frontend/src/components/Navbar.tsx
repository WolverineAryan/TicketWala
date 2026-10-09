"use client";

import React from "react";
import { Zap, Ticket, Calendar, User, ShieldCheck, Flame } from "lucide-react";

export type NavTab = "home" | "events" | "booking" | "profile";

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeHoldCount?: number;
  confirmedCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  activeHoldCount = 0,
  confirmedCount = 0,
}) => {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid #E6E5E3",
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        {/* Brand / Logo */}
        <div
          onClick={() => onSelectTab("home")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              backgroundColor: "#2B2A28",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(43, 42, 40, 0.15)",
              position: "relative",
            }}
          >
            <Ticket size={20} color="#FFFFFF" />
            <div
              style={{
                position: "absolute",
                top: "-3px",
                right: "-3px",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#FF6B35",
                border: "2px solid #FFFFFF",
              }}
            />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#2B2A28",
                  letterSpacing: "-0.5px",
                }}
              >
                Ticket<span style={{ color: "#FF6B35" }}>Wala</span>
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  backgroundColor: "#FFF0EB",
                  color: "#FF6B35",
                  padding: "2px 6px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(255, 107, 53, 0.2)",
                  letterSpacing: "0.5px",
                }}
              >
                Flash Engine
              </span>
            </div>
            <p
              style={{
                fontSize: "11px",
                color: "#8E8D88",
                margin: 0,
                letterSpacing: "-0.2px",
              }}
            >
              Zero-Double-Booking Architecture
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Home, Events, Booking, Profile) */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#F8F8F7",
            padding: "4px",
            borderRadius: "9999px",
            border: "1px solid #E6E5E3",
            gap: "2px",
          }}
        >
          {[
            { id: "home", label: "Home", icon: Flame },
            { id: "events", label: "Events", icon: Calendar },
            { id: "booking", label: "Booking", icon: Zap, badge: activeHoldCount > 0 ? "HOLD" : null },
            { id: "profile", label: "Profile", icon: User, badge: confirmedCount > 0 ? `${confirmedCount}` : null },
          ].map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as NavTab)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "9999px",
                  border: "none",
                  backgroundColor: isActive ? "#2B2A28" : "transparent",
                  color: isActive ? "#FFFFFF" : "#5C5B57",
                  fontSize: "13px",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
              >
                <Icon
                  size={15}
                  color={isActive ? (item.id === "booking" ? "#FF6B35" : "#FFFFFF") : "#8E8D88"}
                />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      backgroundColor: "#FF6B35",
                      color: "#FFFFFF",
                      padding: "1px 6px",
                      borderRadius: "9999px",
                      marginLeft: "2px",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Engine Status & CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Health indicator */}
          <div
            style={{
              display: "none",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              borderRadius: "9999px",
              backgroundColor: "#ECFDF5",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              fontSize: "12px",
              color: "#065F46",
              fontWeight: 600,
            }}
            className="md-flex"
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#10B981",
                display: "inline-block",
                boxShadow: "0 0 8px #10B981",
              }}
            />
            <span>5,000 req/s Armed</span>
          </div>

          {/* Quick flash booking CTA */}
          <button
            onClick={() => onSelectTab("booking")}
            className="btn-primary"
            style={{
              padding: "8px 18px",
              fontSize: "13px",
            }}
          >
            <Zap size={14} fill="#FFFFFF" />
            <span>Flash Drop Live</span>
          </button>
        </div>
      </div>
    </header>
  );
};
