"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Calendar,
  MapPin,
  ShieldCheck,
  Zap,
  ChevronLeft,
  ArrowRight,
  Info,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { EventDetails, InventoryUnitState, SeatTier } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = (params?.id as string) || "evt-flight-ai101";

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [seats, setSeats] = useState<InventoryUnitState[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<InventoryUnitState | null>(null);
  const [selectedTier, setSelectedTier] = useState<SeatTier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHolding, setIsHolding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchEventAndSeats = async () => {
    try {
      setIsLoading(true);
      const [eventRes, seatsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/events/${eventId}`),
        fetch(`${API_BASE}/api/v1/events/${eventId}/seats`),
      ]);

      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setEvent(eventData);
        if (eventData.tiers && eventData.tiers.length > 0) {
          setSelectedTier(eventData.tiers[0]);
        }
      }

      if (seatsRes.ok) {
        const seatsData = await seatsRes.json();
        setSeats(seatsData.seats || []);
      }
    } catch (err) {
      console.error("Failed to fetch event:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventAndSeats();
  }, [eventId]);

  const handleHoldSeat = async () => {
    if (!event) return;
    setIsHolding(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/reservations/hold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          unitId: selectedSeat ? selectedSeat.unitId : undefined,
          tierId: selectedTier?.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error?.message || "Failed to hold seat. Please select another seat.");
        return;
      }

      // Store hold token & details in session storage
      sessionStorage.setItem("tw_hold", JSON.stringify(data));
      // Redirect to checkout page with reservation ID
      router.push(`/checkout/${data.reservationId}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Network error. Could not reach TicketWala server.");
    } finally {
      setIsHolding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
          <p className="text-xs text-slate-400">Loading seat layout and tiers...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <p className="text-sm text-slate-300">Event not found</p>
          <Link href="/explore" className="mt-4 text-xs text-indigo-400 hover:underline">
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const effectivePrice = selectedSeat?.price || selectedTier?.price || event.basePrice;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        
        {/* Back Link */}
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Events</span>
        </Link>

        {/* Event Header Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  {event.categoryLabel}
                </span>
                {event.badge && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    {event.badge}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white">{event.title}</h1>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  <span>{event.venue}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>{event.dateTime}</span>
                </div>
              </div>
            </div>

            <div className="text-left md:text-right bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Available Inventory</span>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">
                {event.availableSeats} <span className="text-xs font-normal text-slate-400">/ {event.totalSeats} seats</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">45s atomic reservation guarantee</div>
            </div>
          </div>
        </div>

        {/* Seat Selection & Tier Matrix Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Interactive Seat Matrix */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-white">Select Your Seat</h2>
                <p className="text-xs text-slate-400">Click any available seat or select auto-allocation</p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-emerald-600" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-indigo-500 ring-2 ring-indigo-300" />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-slate-700 opacity-40" />
                  <span>Occupied</span>
                </div>
              </div>
            </div>

            {/* Stage / Screen / Cockpit Indicator */}
            <div className="mb-6 text-center">
              <div className="w-3/4 mx-auto h-2 rounded-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-lg shadow-indigo-500/50" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1.5 inline-block">
                {event.category === "FLIGHT" ? "Cockpit Front" : event.category === "CINEMA" ? "IMAX 70mm Screen" : "Main Stage / Pitch"}
              </span>
            </div>

            {/* Seat Grid */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 justify-items-center">
                {seats.map((seat) => {
                  const isAvailable = seat.status === "AVAILABLE";
                  const isSelected = selectedSeat?.unitId === seat.unitId;

                  let bgColor = "bg-slate-800/40 text-slate-600 cursor-not-allowed";
                  if (isAvailable) {
                    bgColor = "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white cursor-pointer";
                  }
                  if (isSelected) {
                    bgColor = "bg-indigo-600 text-white border-2 border-indigo-400 shadow-lg shadow-indigo-600/50 scale-110";
                  }

                  return (
                    <button
                      key={seat.unitId}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSeat(isSelected ? null : seat)}
                      title={`${seat.unitId} - ${seat.tierName || "Standard"} (₹${seat.price || event.basePrice})`}
                      className={`w-8 h-8 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all ${bgColor}`}
                    >
                      {seat.unitId.replace("unit-", "")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tier Filter Pills */}
            <div className="mt-6">
              <span className="text-xs font-bold text-slate-400 block mb-2">Available Categories / Classes</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {event.tiers.map((tier) => {
                  const isTierActive = selectedTier?.id === tier.id;
                  return (
                    <button
                      key={tier.id}
                      onClick={() => {
                        setSelectedTier(tier);
                        setSelectedSeat(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition ${
                        isTierActive
                          ? "bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-600/20"
                          : "bg-slate-950 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{tier.name}</span>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                      </div>
                      <div className="text-sm font-black text-indigo-400">₹{tier.price.toLocaleString("en-IN")}</div>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{tier.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Summary & Hold Action */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
            <div>
              <h2 className="text-base font-bold text-white mb-4">Reservation Summary</h2>

              <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Selected Event</span>
                  <span className="text-white font-semibold text-right max-w-[150px] truncate">{event.title}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Seat Allocation</span>
                  <span className="text-indigo-400 font-bold">
                    {selectedSeat ? selectedSeat.unitId.toUpperCase() : "Auto FCFS Allocation"}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Tier / Class</span>
                  <span className="text-white font-semibold">
                    {selectedSeat?.tierName || selectedTier?.name || "Standard"}
                  </span>
                </div>
                <div className="flex justify-between pt-1 text-sm">
                  <span className="font-bold text-white">Total Amount</span>
                  <span className="font-black text-white text-base">₹{effectivePrice.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Zero Fee Assurance */}
              <div className="mt-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>0% convenience fee with direct UPI payment. No gateway markups.</span>
              </div>

              {errorMessage && (
                <div className="mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Action CTA */}
            <div className="mt-8 pt-4 border-t border-slate-800">
              <button
                onClick={handleHoldSeat}
                disabled={isHolding}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isHolding ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Locking Seat...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Lock Seat for 45s & Pay</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-500 mt-2">
                Locks seat atomically. You will have 45 seconds to confirm payment.
              </p>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
