"use client";

import React, { useState } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Plane,
  Music,
  Trophy,
  Film,
  Train,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import type { EventDetails, EventCategory } from "@/types/api";

export const MULTIPURPOSE_CATALOG: EventDetails[] = [
  {
    id: "evt-flight-ai101",
    title: "Air India AI-101: Mumbai (BOM) → London Heathrow (LHR)",
    category: "FLIGHT",
    categoryLabel: "Commercial Flight",
    venue: "Boeing 787-9 Dreamliner • CSMIA Terminal 2",
    location: "Mumbai → London Heathrow",
    dateTime: "Tomorrow • 02:15 AM Departure (9h 45m Non-stop)",
    totalSeats: 192,
    availableSeats: 148,
    basePrice: 48500,
    currency: "INR",
    badge: "FAST FILLING",
    description: "Flagship long-haul direct service with luxury lie-flat beds, gourmet multi-cuisine dining, and 4K in-flight entertainment.",
    tiers: [
      { id: "FIRST", name: "First Class Suite", price: 120000, color: "#F59E0B", description: "Private enclosed suite, caviar service & champagne" },
      { id: "BUSINESS", name: "Business Class Flatbed", price: 75000, color: "#6366F1", description: "180° lie-flat bed, lounge access & priority lane" },
      { id: "ECONOMY", name: "Economy Comfort", price: 48500, color: "#10B981", description: "Ergonomic 32-inch pitch, personal 4K display & meals" },
    ],
  },
  {
    id: "evt-concert-coldplay",
    title: "Coldplay: Music of the Spheres World Tour 2026",
    category: "CONCERT",
    categoryLabel: "Stadium Concert",
    venue: "DY Patil Sports Stadium, Navi Mumbai",
    location: "Navi Mumbai, India",
    dateTime: "Saturday, 18 Jan 2026 • 07:00 PM IST",
    totalSeats: 200,
    availableSeats: 34,
    basePrice: 4500,
    currency: "INR",
    badge: "HIGH DEMAND",
    description: "The worldwide record-breaking stadium spectacle featuring kinetic dance floors, solar-powered lasers, and illuminated xylobands.",
    tiers: [
      { id: "LOUNGE", name: "Infinity Lounge VIP", price: 25000, color: "#F59E0B", description: "Air-conditioned luxury lounge, artist gift pack & open bar" },
      { id: "STANDING", name: "Floor Standing Pit", price: 12500, color: "#EC4899", description: "Direct mainstage proximity, priority early gate admission" },
      { id: "LEVEL1", name: "Level 1 Premium Seated", price: 6500, color: "#6366F1", description: "Elevated mid-tier clear line-of-sight reserved seats" },
      { id: "GENERAL", name: "General Grandstand", price: 4500, color: "#10B981", description: "Upper bowl full stadium panoramic sound & visual view" },
    ],
  },
  {
    id: "evt-sports-iplfinal",
    title: "IPL Grand Final 2026: Mumbai Indians vs Chennai Super Kings",
    category: "SPORTS",
    categoryLabel: "Cricket Championship",
    venue: "Wankhede Stadium, Churchgate, Mumbai",
    location: "Mumbai, India",
    dateTime: "Sunday, 24 May 2026 • 07:30 PM IST",
    totalSeats: 180,
    availableSeats: 28,
    basePrice: 3200,
    currency: "INR",
    badge: "GRAND FINAL",
    description: "The greatest rivalry in cricket history competing for the championship trophy under full stadium floodlights.",
    tiers: [
      { id: "BOX", name: "Corporate Hospitality Box", price: 35000, color: "#F59E0B", description: "VIP glass enclosure, gourmet buffet & legend meet-and-greet" },
      { id: "SACHIN", name: "Sachin Tendulkar Stand", price: 8500, color: "#3B82F6", description: "Covered pavilion level, direct straight-drive boundary view" },
      { id: "GARWARE", name: "Garware Club Pavilion", price: 5000, color: "#6366F1", description: "Mid-wicket elevated stand with exclusive dining stalls" },
      { id: "GAVASKAR", name: "Sunil Gavaskar Stand", price: 3200, color: "#10B981", description: "High-energy stadium fan stand behind the bowler's arm" },
    ],
  },
  {
    id: "evt-cinema-imax",
    title: "Interstellar: 10th Anniversary IMAX 70mm Special Experience",
    category: "CINEMA",
    categoryLabel: "IMAX 70mm Cinema",
    venue: "PVR INOX IMAX with Laser • Palladium Mall, Lower Parel",
    location: "Mumbai, India",
    dateTime: "Tonight • 09:45 PM IST • Screen 1",
    totalSeats: 160,
    availableSeats: 52,
    basePrice: 850,
    currency: "INR",
    badge: "LIMITED SHOW",
    description: "Christopher Nolan's cinematic masterpiece in pure 70mm full-aperture IMAX laser format with 12-channel immersive audio.",
    tiers: [
      { id: "RECLINER", name: "Royal Motorized Recliner", price: 1500, color: "#F59E0B", description: "Plush leather motorized full recliner with in-seat service" },
      { id: "PRIME", name: "Prime Executive Center", price: 1050, color: "#6366F1", description: "Optimal acoustic & visual sweet spot in rows E through H" },
      { id: "CLASSIC", name: "Classic Standard", price: 850, color: "#10B981", description: "Standard rocker seating with unobstructed curved screen view" },
    ],
  },
  {
    id: "evt-train-vandebharat",
    title: "Vande Bharat Express (22229): Mumbai CSMT → Goa Madgaon",
    category: "TRANSIT",
    categoryLabel: "High-Speed Rail",
    venue: "Platform 18, Chhatrapati Shivaji Maharaj Terminus (CSMT)",
    location: "Mumbai → Goa",
    dateTime: "Friday • 05:25 AM Departure (7h 50m)",
    totalSeats: 150,
    availableSeats: 64,
    basePrice: 1815,
    currency: "INR",
    badge: "FASTEST TRAIN",
    description: "Semi-high speed aerodynamic express through the scenic Western Ghats with 180-degree revolving executive seating.",
    tiers: [
      { id: "EXECUTIVE", name: "Executive Anubhuti Class (EC)", price: 3355, color: "#F59E0B", description: "180-degree rotating seats, panoramic windows & hot breakfast" },
      { id: "CHAIR", name: "AC Chair Car (CC)", price: 1815, color: "#10B981", description: "Spacious ergonomic seating, onboard Wi-Fi infotainment" },
    ],
  },
];

interface EventsCatalogProps {
  onJoinEvent: (event: EventDetails) => void;
  selectedEventId?: string;
}

export const EventsCatalog: React.FC<EventsCatalogProps> = ({
  onJoinEvent,
  selectedEventId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const categories = [
    { id: "ALL", label: "All Categories", icon: Sparkles },
    { id: "FLIGHT", label: "Flights", icon: Plane },
    { id: "CONCERT", label: "Concerts", icon: Music },
    { id: "SPORTS", label: "Sports", icon: Trophy },
    { id: "CINEMA", label: "Cinema", icon: Film },
    { id: "TRANSIT", label: "Express Rail", icon: Train },
  ];

  const filteredEvents =
    selectedCategory === "ALL"
      ? MULTIPURPOSE_CATALOG
      : MULTIPURPOSE_CATALOG.filter((e) => e.category === selectedCategory);

  return (
    <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "36px 24px 64px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              backgroundColor: "#FFF0EB",
              color: "#FF6B35",
              padding: "4px 10px",
              borderRadius: "9999px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Live Availability
          </span>
          <span style={{ fontSize: "13px", color: "#10B981", fontWeight: 700 }}>
            ● Real-Time Seat Inventory Active
          </span>
        </div>
        <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#2B2A28", margin: "0 0 8px 0" }}>
          Explore Multipurpose Bookings
        </h2>
        <p style={{ fontSize: "15px", color: "#5C5B57", margin: 0, maxWidth: "720px" }}>
          Choose your travel, stadium concert, cricket championship, or IMAX screening. Real-time seats are locked instantly with 120-second lease guarantees.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "12px",
          marginBottom: "28px",
        }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "9999px",
                border: isSelected ? "1.5px solid #2B2A28" : "1.5px solid #E6E5E3",
                backgroundColor: isSelected ? "#2B2A28" : "#FFFFFF",
                color: isSelected ? "#FFFFFF" : "#5C5B57",
                fontSize: "13px",
                fontWeight: isSelected ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                boxShadow: isSelected ? "0 4px 12px rgba(43, 42, 40, 0.12)" : "none",
              }}
            >
              <Icon size={16} color={isSelected ? "#FF6B35" : "#8E8D88"} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Events Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
          gap: "24px",
        }}
      >
        {filteredEvents.map((event) => {
          const isCurrent = selectedEventId === event.id;
          const availableRatio = event.availableSeats / event.totalSeats;

          return (
            <div
              key={event.id}
              className="card-3d"
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "20px",
                border: isCurrent ? "2px solid #FF6B35" : "1.5px solid #E6E5E3",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: isCurrent
                  ? "0 12px 32px rgba(255, 107, 53, 0.14)"
                  : "0 8px 24px rgba(43, 42, 40, 0.04)",
                transition: "all 0.2s ease",
              }}
            >
              {/* Card Banner */}
              <div
                style={{
                  background:
                    event.category === "FLIGHT"
                      ? "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)"
                      : event.category === "CONCERT"
                      ? "linear-gradient(135deg, #4A044E 0%, #1E1B4B 100%)"
                      : event.category === "SPORTS"
                      ? "linear-gradient(135deg, #14532D 0%, #064E3B 100%)"
                      : event.category === "CINEMA"
                      ? "linear-gradient(135deg, #312E81 0%, #1E1B4B 100%)"
                      : "linear-gradient(135deg, #78350F 0%, #451A03 100%)",
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
                      backgroundColor: "rgba(255, 255, 255, 0.18)",
                      padding: "4px 10px",
                      borderRadius: "9999px",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {event.categoryLabel}
                  </span>

                  {event.badge && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        backgroundColor: "#FF6B35",
                        color: "#FFFFFF",
                        padding: "3px 10px",
                        borderRadius: "9999px",
                      }}
                    >
                      {event.badge}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: "19px", fontWeight: 800, margin: "0 0 8px 0", lineHeight: 1.3 }}>
                  {event.title}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", opacity: 0.9 }}>
                  <MapPin size={14} color="#FF6B35" />
                  <span>{event.venue}</span>
                </div>
              </div>

              {/* Card Details */}
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#5C5B57", fontSize: "13px", marginBottom: "14px" }}>
                  <Clock size={15} color="#8E8D88" />
                  <span>{event.dateTime}</span>
                </div>

                <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.5, margin: "0 0 18px 0" }}>
                  {event.description}
                </p>

                {/* Available Tiers Pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
                  {event.tiers.map((t) => (
                    <span
                      key={t.id}
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        backgroundColor: "#F8FAFC",
                        color: "#334155",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      {t.name} (₹{t.price.toLocaleString("en-IN")})
                    </span>
                  ))}
                </div>

                {/* Seat Availability Bar */}
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                    <span style={{ color: "#64748B" }}>Remaining Capacity</span>
                    <span style={{ fontWeight: 700, color: availableRatio > 0.3 ? "#10B981" : "#FF6B35" }}>
                      {event.availableSeats} of {event.totalSeats} seats left
                    </span>
                  </div>
                  <div style={{ height: "6px", backgroundColor: "#F1F5F9", borderRadius: "9999px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.round(availableRatio * 100)}%`,
                        backgroundColor: availableRatio > 0.3 ? "#10B981" : "#FF6B35",
                        borderRadius: "9999px",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Price and CTA Button */}
                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "16px",
                    borderTop: "1px solid #F1F5F9",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11px", color: "#94A3B8", display: "block" }}>Starts from</span>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: "#1E293B" }}>
                      ₹{event.basePrice.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <button
                    onClick={() => onJoinEvent(event)}
                    className="btn-primary"
                    style={{
                      padding: "10px 20px",
                      fontSize: "14px",
                      borderRadius: "10px",
                    }}
                  >
                    <span>{isCurrent ? "View Seats" : "Select Seats"}</span>
                    <ArrowRight size={16} />
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
