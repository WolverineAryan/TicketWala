"use client";

import React from "react";
import { Ticket, Calendar, User, Compass, Sparkles, CheckCircle2 } from "lucide-react";

export type NavTab = "home" | "events" | "booking" | "profile";

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeHoldCount?: number;
  confirmedCount?: number;
  selectedEventTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  activeHoldCount = 0,
  confirmedCount = 0,
  selectedEventTitle,
}) => {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "rgba(255, 255, 255, 0.94)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
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
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              backgroundColor: "#2B2A28",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(43, 42, 40, 0.15)",
              position: "relative",
            }}
          >
            <Ticket size={22} color="#FFFFFF" />
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
                  fontSize: "22px",
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
                  padding: "2px 7px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(255, 107, 53, 0.2)",
                  letterSpacing: "0.5px",
                }}
              >
                Official
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
              Flights • Concerts • Sports • Cinema • Express Rail
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Home, Browse Events, Seat Booking, My Tickets) */}
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
            { id: "home", label: "Home", icon: Compass },
            { id: "events", label: "Browse Events", icon: Calendar },
            {
              id: "booking",
              label: "Seat Booking",
              icon: Ticket,
              badge: activeHoldCount > 0 ? "1 HELD" : null,
            },
            {
              id: "profile",
              label: "My Tickets",
              icon: User,
              badge: confirmedCount > 0 ? `${confirmedCount}` : null,
            },
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
                  color={isActive ? (item.id === "booking" && activeHoldCount > 0 ? "#FF6B35" : "#FFFFFF") : "#8E8D88"}
                />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      backgroundColor: item.id === "booking" ? "#FF6B35" : "#10B981",
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

        {/* User-friendly Trust Badge & Action */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "9999px",
              backgroundColor: "#ECFDF5",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              fontSize: "12px",
              color: "#065F46",
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={14} color="#10B981" />
            <span>Instant Confirmation</span>
          </div>

          <button
            onClick={() => onSelectTab("events")}
            className="btn-primary"
            style={{
              padding: "8px 18px",
              fontSize: "13px",
              borderRadius: "9999px",
            }}
          >
            <Sparkles size={14} fill="#FFFFFF" />
            <span>Book Tickets</span>
          </button>
        </div>
      </div>
    </header>
  );
};
