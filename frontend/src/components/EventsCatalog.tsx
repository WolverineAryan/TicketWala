"use client";

import React from "react";
import { Zap, Calendar, MapPin, Users, Clock, Flame, ArrowRight, ShieldCheck } from "lucide-react";

interface EventItem {
  id: string;
  title: string;
  category: string;
  location: string;
  date: string;
  totalSeats: number;
  availableSeats: number;
  contentionLevel: "EXTREME" | "VERY HIGH" | "HIGH";
  price: string;
  imageBg: string;
}

const EVENTS_DATA: EventItem[] = [
  {
    id: "evt-coldplay",
    title: "Coldplay: Music of the Spheres (Mumbai)",
    category: "Mega Stadium Concert",
    location: "DY Patil Sports Stadium, Navi Mumbai",
    date: "Jan 18, 2026 &bull; 19:30 IST",
    totalSeats: 200,
    availableSeats: 34,
    contentionLevel: "EXTREME",
    price: "₹6,500",
    imageBg: "linear-gradient(135deg, #2B2A28 0%, #1A1A18 100%)",
  },
  {
    id: "evt-transit",
    title: "Hyperloop Express Super-Pod 01 (Mumbai-Pune)",
    category: "High-Velocity Transit",
    location: "Bandra Kurla Complex Hyper-Terminal",
    date: "Daily Flash Departure &bull; 08:00 IST",
    totalSeats: 200,
    availableSeats: 72,
    contentionLevel: "VERY HIGH",
    price: "₹1,200",
    imageBg: "linear-gradient(135deg, #3A3936 0%, #201F1D 100%)",
  },
  {
    id: "evt-worldcup",
    title: "ICC World Cup Grandstand Final (VIP Lounge)",
    category: "Sports Tournament",
    location: "Narendra Modi Stadium, Ahmedabad",
    date: "Nov 22, 2026 &bull; 14:00 IST",
    totalSeats: 200,
    availableSeats: 12,
    contentionLevel: "EXTREME",
    price: "₹14,000",
    imageBg: "linear-gradient(135deg, #2B2A28 0%, #111110 100%)",
  },
  {
    id: "evt-arrahman",
    title: "A.R. Rahman Live Symphonic Arena Tour",
    category: "Live Arena Showcase",
    location: "Jio World Garden, BKC, Mumbai",
    date: "Dec 05, 2026 &bull; 20:00 IST",
    totalSeats: 200,
    availableSeats: 98,
    contentionLevel: "HIGH",
    price: "₹4,800",
    imageBg: "linear-gradient(135deg, #32312E 0%, #1F1E1C 100%)",
  },
];

interface EventsCatalogProps {
  onJoinEvent: (eventId: string) => void;
}

export const EventsCatalog: React.FC<EventsCatalogProps> = ({ onJoinEvent }) => {
  return (
    <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "32px 24px 64px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 12px",
            backgroundColor: "#FFF0EB",
            borderRadius: "9999px",
            color: "#FF6B35",
            fontSize: "12px",
            fontWeight: 700,
            marginBottom: "12px",
          }}
        >
          <Flame size={14} />
          <span>High-Contention Digital Ticket Releases</span>
        </div>
        <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#2B2A28", margin: "0 0 8px 0" }}>
          Live Flash Releases &amp; Reserved Allocations
        </h2>
        <p style={{ fontSize: "15px", color: "#5C5B57", margin: 0, maxWidth: "700px" }}>
          Targeted slots protected by sub-second in-memory Lua locking and strict first-come-first-served queues.
        </p>
      </div>

      {/* Grid of Events */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "24px",
        }}
      >
        {EVENTS_DATA.map((event) => {
          const claimedPercent = Math.round(((event.totalSeats - event.availableSeats) / event.totalSeats) * 100);

          return (
            <div
              key={event.id}
              className="card-3d"
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "20px",
                border: "1.5px solid #E6E5E3",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 8px 24px rgba(43, 42, 40, 0.04)",
              }}
            >
              {/* Event Card Header Graphic */}
              <div
                style={{
                  background: event.imageBg,
                  padding: "24px",
                  color: "#FFFFFF",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                      padding: "4px 10px",
                      borderRadius: "9999px",
                      textTransform: "uppercase",
                    }}
                  >
                    {event.category}
                  </span>

                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      backgroundColor: "#FF6B35",
                      color: "#FFFFFF",
                      padding: "4px 10px",
                      borderRadius: "9999px",
                    }}
                  >
                    {event.contentionLevel} CONTENTION
                  </span>
                </div>

                <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 10px 0", lineHeight: 1.25 }}>
                  {event.title}
                </h3>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#D4D3CF" }}>
                  <MapPin size={14} color="#FF6B35" />
                  <span>{event.location}</span>
                </div>
              </div>

              {/* Event Card Content */}
              <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#5C5B57", marginBottom: "16px" }}>
                    <Calendar size={14} color="#2B2A28" />
                    <span dangerouslySetInnerHTML={{ __html: event.date }} />
                  </div>

                  {/* Scarcity Progress Bar */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 600, color: "#5C5B57" }}>Inventory Depletion</span>
                      <span style={{ fontWeight: 800, color: "#FF6B35" }}>{claimedPercent}% Claimed</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", backgroundColor: "#F1F1EF", borderRadius: "4px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${claimedPercent}%`,
                          height: "100%",
                          backgroundColor: "#FF6B35",
                          borderRadius: "4px",
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8E8D88", marginTop: "4px" }}>
                      <span>{event.availableSeats} Units Remaining</span>
                      <span>{event.totalSeats} Total</span>
                    </div>
                  </div>
                </div>

                {/* Footer with Price and Claim Button */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "16px",
                    borderTop: "1px solid #E6E5E3",
                    marginTop: "8px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11px", color: "#8E8D88", display: "block" }}>From</span>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: "#2B2A28" }}>{event.price}</span>
                  </div>

                  <button
                    onClick={() => onJoinEvent(event.id)}
                    className="btn-primary"
                    style={{ padding: "10px 20px", fontSize: "13px" }}
                  >
                    <Zap size={14} fill="#FFFFFF" />
                    <span>Join Flash Drop</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
