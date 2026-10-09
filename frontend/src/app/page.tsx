"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar, type NavTab } from "@/components/Navbar";
import { HeroAirplaneCabin } from "@/components/HeroAirplaneCabin";
import { InteractiveSeatMap3D } from "@/components/InteractiveSeatMap3D";
import { HoldCountdownCard } from "@/components/HoldCountdownCard";
import { ConfirmedTicketPass } from "@/components/ConfirmedTicketPass";
import { EventsCatalog, MULTIPURPOSE_CATALOG } from "@/components/EventsCatalog";
import { UserProfileView } from "@/components/UserProfileView";

import type {
  HoldResponse,
  ConfirmResponse,
  InventoryUnitState,
  EventDetails,
} from "@/types/api";

import {
  Ticket,
  Calendar,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plane,
  Music,
  Trophy,
  Film,
  Train,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Initial fallback inventory with seats
function createInitialInventory(totalSeats: number = 192): InventoryUnitState[] {
  return Array.from({ length: totalSeats }, (_, i) => {
    const id = `unit-${String(i + 1).padStart(3, "0")}`;
    let status: "AVAILABLE" | "HELD" | "CONFIRMED" = "AVAILABLE";
    if (i < 12) status = "CONFIRMED";
    else if (i >= 12 && i < 16) status = "HELD";

    const row = Math.ceil((i + 1) / 6);
    const colLetters = ["A", "B", "C", "D", "E", "F"];
    const col = i % 6;
    const seatLabel = `${row}${colLetters[col]}`;

    let tierName = "Economy Comfort";
    let price = 48500;
    if (row <= 2) {
      tierName = "First Class Suite";
      price = 120000;
    } else if (row <= 7) {
      tierName = "Business Class Flatbed";
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
}

export default function TicketWalaApp() {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Multipurpose Event Selection
  const [currentEvent, setCurrentEvent] = useState<EventDetails>(MULTIPURPOSE_CATALOG[0]);

  // Customer Booking State
  const [activeHold, setActiveHold] = useState<HoldResponse | null>(null);
  const [confirmedBookings, setConfirmedBookings] = useState<ConfirmResponse[]>([]);
  const [latestConfirmed, setLatestConfirmed] = useState<ConfirmResponse | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  // Inventory State
  const [inventoryGrid, setInventoryGrid] = useState<InventoryUnitState[]>(() =>
    createInitialInventory(MULTIPURPOSE_CATALOG[0].totalSeats)
  );

  // 1. Fetch Live Telemetry & Seat Grid from API if available
  const fetchTelemetry = useCallback(async () => {
    try {
      const liveRes = await fetch(`${API_BASE}/health/live`, { cache: "no-store" });
      if (liveRes.ok) {
        setIsApiConnected(true);

        // Fetch seat inventory for current event
        const invRes = await fetch(`${API_BASE}/api/v1/events/${currentEvent.id}/seats`);
        if (invRes.ok) {
          const data = await invRes.json();
          if (data.seats && data.seats.length > 0) {
            setInventoryGrid(data.seats);
          }
        }
      } else {
        setIsApiConnected(false);
      }
    } catch {
      setIsApiConnected(false);
    }
  }, [currentEvent.id]);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 4000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  // When currentEvent changes, regenerate/refresh seat grid
  useEffect(() => {
    setInventoryGrid(createInitialInventory(currentEvent.totalSeats));
    setSelectedUnitId("");
    fetchTelemetry();
  }, [currentEvent, fetchTelemetry]);

  // 2. Countdown Timer for Active Hold Lease
  useEffect(() => {
    if (!activeHold?.expiresAt) return;

    const updateTimer = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const diff = Math.max(0, activeHold.expiresAt - nowSec);
      setSecondsRemaining(diff);

      if (diff === 0 && activeHold) {
        setErrorMessage(`Hold expired on ${activeHold.unitId}. Seat was released back to the event pool.`);
        setActiveHold(null);
        setSelectedUnitId("");
        fetchTelemetry();
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [activeHold, fetchTelemetry]);

  // 3. Customer Action: Claim Seat Hold (Specific or Auto FCFS)
  const handleClaimHold = async (targetUnitId?: string) => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    // If connected to live Fastify API
    if (isApiConnected) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/reservations/hold`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": `idemp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          },
          body: JSON.stringify({
            eventId: currentEvent.id,
            unitId: targetUnitId || selectedUnitId || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(`[${data.error?.code || "HOLD_FAILED"}] ${data.error?.message || "Failed to claim seat"}`);
        } else {
          const hold = data as HoldResponse;
          setActiveHold(hold);
          setSelectedUnitId(hold.unitId);
          setLatestConfirmed(null);
          setSecondsRemaining(120);
          setSuccessMessage(`⚡ Seat ${hold.unitId} locked exclusively for 120 seconds!`);
        }
      } catch (err: any) {
        setErrorMessage(`Connection Error: ${err.message}`);
      } finally {
        setLoading(false);
        fetchTelemetry();
      }
      return;
    }

    // Client-side fallback simulation
    await new Promise((r) => setTimeout(r, 200));

    const unitToClaim = targetUnitId
      ? inventoryGrid.find((u) => u.unitId === targetUnitId && u.status === "AVAILABLE")
      : inventoryGrid.find((u) => u.status === "AVAILABLE");

    if (!unitToClaim) {
      setErrorMessage("SOLD OUT: All seats for this event are currently claimed or booked!");
      setLoading(false);
      return;
    }

    const expiresAt = Math.floor(Date.now() / 1000) + 120;
    const holdData: HoldResponse = {
      reservationId: `res-${Math.random().toString(36).substring(2, 9)}`,
      unitId: unitToClaim.unitId,
      status: "HELD",
      expiresAt,
      holdToken: `tok_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`,
      version: unitToClaim.version + 1,
      eventId: currentEvent.id,
      eventTitle: currentEvent.title,
      tierName: unitToClaim.tierName || "Standard",
      price: unitToClaim.price || currentEvent.basePrice,
      currency: "INR",
    };

    setActiveHold(holdData);
    setSelectedUnitId(unitToClaim.unitId);
    setSecondsRemaining(120);
    setLatestConfirmed(null);
    setSuccessMessage(`⚡ Seat ${unitToClaim.seatLabel || unitToClaim.unitId} locked exclusively!`);

    setInventoryGrid((prev) =>
      prev.map((u) => (u.unitId === unitToClaim.unitId ? { ...u, status: "HELD", version: u.version + 1 } : u))
    );

    setLoading(false);
  };

  // 4. Customer Action: Confirm & Pay
  const handleConfirm = async (passengerData: {
    name: string;
    email: string;
    phone: string;
    paymentMethod: "UPI" | "CARD" | "NETBANKING";
  }) => {
    if (!activeHold) return;
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (isApiConnected) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/reservations/${activeHold.reservationId}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            holdToken: activeHold.holdToken,
            passengerName: passengerData.name,
            email: passengerData.email,
            phone: passengerData.phone,
            paymentMethod: passengerData.paymentMethod,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(`[${data.error?.code || "CONFIRM_FAILED"}] ${data.error?.message || "Payment confirmation failed"}`);
        } else {
          const confirmed = data as ConfirmResponse;
          setLatestConfirmed(confirmed);
          setConfirmedBookings((prev) => [confirmed, ...prev]);
          setActiveHold(null);
          setSuccessMessage(`🎉 Booking confirmed! PNR: ${confirmed.pnr || "CONFIRMED"}`);
          triggerConfetti();
        }
      } catch (err: any) {
        setErrorMessage(`Confirm Error: ${err.message}`);
      } finally {
        setLoading(false);
        fetchTelemetry();
      }
      return;
    }

    // Client-side confirmation fallback
    await new Promise((r) => setTimeout(r, 250));

    const pnrCode = `TW-${currentEvent.category.substring(0, 2)}-${Math.floor(Math.random() * 8999 + 1000)}`;
    const confirmed: ConfirmResponse = {
      reservationId: activeHold.reservationId,
      unitId: activeHold.unitId,
      status: "CONFIRMED",
      version: activeHold.version + 1,
      confirmedAt: Math.floor(Date.now() / 1000),
      pnr: pnrCode,
      eventId: currentEvent.id,
      eventTitle: currentEvent.title,
      venue: currentEvent.venue,
      dateTime: currentEvent.dateTime,
      passengerName: passengerData.name,
      tierName: activeHold.tierName || "Standard",
      amountPaid: (activeHold.price || currentEvent.basePrice) * 1.05,
      currency: "INR",
      qrCodePayload: `TICKETWALA:${pnrCode}:${activeHold.unitId}:${passengerData.name}`,
      paymentRef: `PAY-${Date.now().toString(36).toUpperCase()}`,
    };

    setLatestConfirmed(confirmed);
    setConfirmedBookings((prev) => [confirmed, ...prev]);
    setActiveHold(null);
    setSuccessMessage(`🎉 Booking confirmed! PNR: ${pnrCode}`);
    triggerConfetti();

    setInventoryGrid((prev) =>
      prev.map((u) => (u.unitId === activeHold.unitId ? { ...u, status: "CONFIRMED", version: u.version + 1 } : u))
    );

    setLoading(false);
  };

  // 5. Customer Action: Release / Cancel Hold
  const handleRelease = async () => {
    if (!activeHold) return;
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (isApiConnected) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/reservations/${activeHold.reservationId}/release`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ holdToken: activeHold.holdToken }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(`[${data.error?.code || "RELEASE_FAILED"}] ${data.error?.message || "Failed to release"}`);
        } else {
          setActiveHold(null);
          setSelectedUnitId("");
          setSuccessMessage("Seat successfully released back to the event pool.");
        }
      } catch (err: any) {
        setErrorMessage(`Release Error: ${err.message}`);
      } finally {
        setLoading(false);
        fetchTelemetry();
      }
      return;
    }

    // Client-side release
    await new Promise((r) => setTimeout(r, 150));
    setInventoryGrid((prev) =>
      prev.map((u) => (u.unitId === activeHold.unitId ? { ...u, status: "AVAILABLE", version: u.version + 1 } : u))
    );
    setActiveHold(null);
    setSelectedUnitId("");
    setSuccessMessage("Seat successfully released back to available pool.");
    setLoading(false);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#FF6B35", "#2B2A28", "#10B981"],
      });
    } catch {
      // Confetti fallback
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column" }}>
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeHoldCount={activeHold ? 1 : 0}
        confirmedCount={confirmedBookings.length}
        selectedEventTitle={currentEvent.title}
      />

      {/* Global Alerts Banner */}
      <div style={{ maxWidth: "1320px", margin: "0 auto", width: "100%", padding: "0 24px" }}>
        {errorMessage && (
          <div
            style={{
              marginTop: "16px",
              backgroundColor: "#FEE2E2",
              border: "1.5px solid #EF4444",
              color: "#991B1B",
              padding: "12px 18px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={18} color="#DC2626" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage("")}
              style={{ background: "none", border: "none", color: "#991B1B", cursor: "pointer", fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              marginTop: "16px",
              backgroundColor: "#ECFDF5",
              border: "1.5px solid #10B981",
              color: "#065F46",
              padding: "12px 18px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={18} color="#10B981" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              style={{ background: "none", border: "none", color: "#065F46", cursor: "pointer", fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      <main style={{ flex: 1 }}>
        {/* 1. HOME TAB */}
        {activeTab === "home" && (
          <div>
            <HeroAirplaneCabin
              onGoToBooking={() => setActiveTab("booking")}
              onExploreEvents={() => setActiveTab("events")}
            />

            {/* Multipurpose Showcase Categories */}
            <section style={{ backgroundColor: "#F8F8F7", borderTop: "1px solid #E6E5E3", borderBottom: "1px solid #E6E5E3", padding: "56px 24px" }}>
              <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: "36px" }}>
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
                    Unified Multipurpose Ticketing
                  </span>
                  <h2 style={{ fontSize: "30px", fontWeight: 800, color: "#2B2A28", margin: "10px 0 10px 0" }}>
                    One Platform for Every Experience
                  </h2>
                  <p style={{ color: "#64748B", maxWidth: "600px", margin: "0 auto", fontSize: "14px" }}>
                    From international long-haul flights and sold-out stadium concerts to cricket playoff finals and IMAX premieres.
                  </p>
                </div>

                {/* 5 Multipurpose Categories Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px", marginBottom: "40px" }}>
                  {[
                    { title: "Flights & Transit", icon: Plane, count: "148 Available", color: "#3B82F6", cat: "FLIGHT" },
                    { title: "Stadium Concerts", icon: Music, count: "34 Available", color: "#EC4899", cat: "CONCERT" },
                    { title: "Sports & Cricket", icon: Trophy, count: "28 Available", color: "#10B981", cat: "SPORTS" },
                    { title: "IMAX 70mm Cinema", icon: Film, count: "52 Available", color: "#8B5CF6", cat: "CINEMA" },
                    { title: "Express Trains", icon: Train, count: "64 Available", color: "#F59E0B", cat: "TRANSIT" },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          const ev = MULTIPURPOSE_CATALOG.find((e) => e.category === item.cat);
                          if (ev) setCurrentEvent(ev);
                          setActiveTab("events");
                        }}
                        style={{
                          backgroundColor: "#FFFFFF",
                          borderRadius: "16px",
                          padding: "20px",
                          border: "1.5px solid #E2E8F0",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                        }}
                      >
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "12px",
                            backgroundColor: `${item.color}15`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "14px",
                          }}
                        >
                          <Icon size={22} color={item.color} />
                        </div>
                        <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#1E293B", margin: "0 0 4px 0" }}>
                          {item.title}
                        </h4>
                        <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>{item.count}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ textAlign: "center" }}>
                  <button
                    onClick={() => setActiveTab("events")}
                    className="btn-primary"
                    style={{ padding: "12px 32px", fontSize: "15px" }}
                  >
                    <span>Browse All Available Events</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 2. EVENTS TAB: Multipurpose Catalog */}
        {activeTab === "events" && (
          <EventsCatalog
            selectedEventId={currentEvent.id}
            onJoinEvent={(event) => {
              setCurrentEvent(event);
              setActiveTab("booking");
            }}
          />
        )}

        {/* 3. BOOKING TAB: User-Friendly Seat Selection & Checkout */}
        {activeTab === "booking" && (
          <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "32px 24px 64px 24px" }}>
            {/* Header: Selected Event Banner */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                marginBottom: "28px",
                padding: "20px 24px",
                backgroundColor: "#F8FAFC",
                borderRadius: "16px",
                border: "1.5px solid #E2E8F0",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      backgroundColor: "#FFF0EB",
                      color: "#FF6B35",
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      textTransform: "uppercase",
                    }}
                  >
                    {currentEvent.categoryLabel}
                  </span>
                  <span style={{ fontSize: "12px", color: "#10B981", fontWeight: 700 }}>
                    ● {currentEvent.availableSeats} of {currentEvent.totalSeats} seats available
                  </span>
                </div>
                <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", margin: "2px 0 4px 0" }}>
                  {currentEvent.title}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "13px", color: "#64748B" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <MapPin size={14} color="#FF6B35" />
                    {currentEvent.venue}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={14} color="#3B82F6" />
                    {currentEvent.dateTime}
                  </span>
                </div>
              </div>

              {/* Action: Change Event / Auto Pick */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={() => setActiveTab("events")}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: "1.5px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  Change Event
                </button>

                {!activeHold && !latestConfirmed && (
                  <button
                    onClick={() => handleClaimHold()}
                    disabled={loading}
                    className="btn-primary"
                    style={{ padding: "10px 20px", fontSize: "13px" }}
                  >
                    <Zap size={15} fill="#FFFFFF" />
                    <span>{loading ? "Locking Seat..." : "Auto-Pick Best Seat"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Main Booking Two-Column Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: "28px", alignItems: "start" }}>
              {/* Left Column: Interactive Seat Map */}
              <div>
                <InteractiveSeatMap3D
                  units={inventoryGrid}
                  selectedUnitId={selectedUnitId}
                  activeHoldUnitId={activeHold?.unitId}
                  eventTitle={currentEvent.title}
                  eventCategory={currentEvent.category}
                  onSelectUnit={(unitId) => {
                    setSelectedUnitId(unitId);
                    if (!activeHold && !latestConfirmed) {
                      handleClaimHold(unitId);
                    }
                  }}
                  isLoading={loading}
                />
              </div>

              {/* Right Column: Checkout / Ticket Pass / Selection Guide */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* 1. Active Hold State: Complete Professional Checkout Card */}
                {activeHold && (
                  <HoldCountdownCard
                    hold={activeHold}
                    secondsRemaining={secondsRemaining}
                    totalTTL={120}
                    onConfirm={handleConfirm}
                    onRelease={handleRelease}
                    isLoading={loading}
                  />
                )}

                {/* 2. Confirmed Booking State: Boarding Pass / E-Ticket */}
                {latestConfirmed && (
                  <ConfirmedTicketPass
                    booking={latestConfirmed}
                    onBookAnother={() => {
                      setLatestConfirmed(null);
                      setSelectedUnitId("");
                      fetchTelemetry();
                    }}
                  />
                )}

                {/* 3. Idle State: Event Guide & Tier Pricing Card */}
                {!activeHold && !latestConfirmed && (
                  <div
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "20px",
                      padding: "24px",
                      border: "1.5px solid #E2E8F0",
                      boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "10px",
                          backgroundColor: "#FFF0EB",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ticket size={20} color="#FF6B35" />
                      </div>
                      <div>
                        <h4 style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                          Select Your Preferred Seat
                        </h4>
                        <span style={{ fontSize: "12px", color: "#64748B" }}>
                          Click any seat on the map to lock it with a 120s guarantee
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, marginBottom: "18px" }}>
                      {currentEvent.description}
                    </p>

                    {/* Tier Price Options */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                      {currentEvent.tiers.map((t) => (
                        <div
                          key={t.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 14px",
                            borderRadius: "10px",
                            backgroundColor: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                          }}
                        >
                          <div>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#1E293B", display: "block" }}>
                              {t.name}
                            </span>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>{t.description}</span>
                          </div>
                          <span style={{ fontSize: "14px", fontWeight: 800, color: "#0F172A" }}>
                            ₹{t.price.toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleClaimHold()}
                      disabled={loading}
                      className="btn-primary"
                      style={{ width: "100%", padding: "12px", borderRadius: "10px" }}
                    >
                      <Zap size={16} fill="#FFFFFF" />
                      <span>Claim Next Best Available Seat</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. PROFILE TAB: My Tickets & Passenger Info */}
        {activeTab === "profile" && (
          <UserProfileView
            confirmedBookings={confirmedBookings}
            activeHold={activeHold}
            secondsRemaining={secondsRemaining}
            onGoToBooking={() => setActiveTab("booking")}
          />
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #E6E5E3",
          backgroundColor: "#FFFFFF",
          padding: "28px 24px",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "1320px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            fontSize: "12px",
            color: "#8E8D88",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: 800, color: "#2B2A28" }}>TicketWala</span>
            <span>•</span>
            <span>Multipurpose Real-Time Ticketing Platform</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span>Flights</span>
            <span>•</span>
            <span>Concerts</span>
            <span>•</span>
            <span>Sports</span>
            <span>•</span>
            <span>Cinema</span>
            <span>•</span>
            <span style={{ color: "#10B981", fontWeight: 700 }}>100% Guaranteed Seat Allocation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
