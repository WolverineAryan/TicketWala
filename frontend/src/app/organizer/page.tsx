"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  PlusCircle,
  TrendingUp,
  Users,
  ShieldCheck,
  Zap,
  Sliders,
  DollarSign,
  Ticket,
  Calendar,
  MapPin,
  RefreshCw,
  CheckCircle2,
  Lock,
  ChevronRight,
  Eye,
} from "lucide-react";
import { EventCategory, EventDetails, SeatTier } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function OrganizerPortalPage() {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true); // Default to unlocked for demo/testing
  const [organizerKey, setOrganizerKey] = useState<string>("org-ticketwala-master");

  const [events, setEvents] = useState<EventDetails[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [surgeMultiplier, setSurgeMultiplier] = useState<number>(1.2);
  const [isUpdatingPricing, setIsUpdatingPricing] = useState<boolean>(false);
  const [pricingSuccessMsg, setPricingSuccessMsg] = useState<string | null>(null);

  // New Event Form State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<EventCategory>("CONCERT");
  const [newCategoryLabel, setNewCategoryLabel] = useState("Live Stadium Concert");
  const [newVenue, setNewVenue] = useState("");
  const [newLocation, setNewLocation] = useState("Mumbai, India");
  const [newDateTime, setNewDateTime] = useState("This Saturday • 07:00 PM IST");
  const [newTotalSeats, setNewTotalSeats] = useState<number>(150);
  const [newBasePrice, setNewBasePrice] = useState<number>(3500);
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/events`);
      if (res.ok) {
        const data = await res.json();
        const list = data.events || [];
        setEvents(list);
        if (list.length > 0 && !selectedEventId) {
          setSelectedEventId(list[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load organizer events:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleApplySurge = async () => {
    if (!selectedEventId) return;
    setIsUpdatingPricing(true);
    setPricingSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/organizer/events/${selectedEventId}/pricing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surgeMultiplier,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPricingSuccessMsg(`Dynamic surge pricing applied (${surgeMultiplier}x). Prices refreshed live.`);
        await fetchEvents();
      } else {
        alert(data.error?.message || "Failed to update pricing.");
      }
    } catch (err: any) {
      alert(err.message || "Network error.");
    } finally {
      setIsUpdatingPricing(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    const defaultTiers: SeatTier[] = [
      { id: "VIP", name: "VIP Lounge / Front Row", price: Math.round(newBasePrice * 2.5), color: "#F59E0B", description: "Priority check-in & best view" },
      { id: "PREMIUM", name: "Premium Tier", price: Math.round(newBasePrice * 1.5), color: "#6366F1", description: "Elevated line-of-sight reserved seats" },
      { id: "STANDARD", name: "Standard General", price: newBasePrice, color: "#10B981", description: "Standard admission access" },
    ];

    try {
      const res = await fetch(`${API_BASE}/api/v1/organizer/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          categoryLabel: newCategoryLabel,
          venue: newVenue,
          location: newLocation,
          dateTime: newDateTime,
          totalSeats: Number(newTotalSeats),
          basePrice: Number(newBasePrice),
          currency: "INR",
          description: newDescription || "Official event organized and managed on TicketWala.",
          tiers: defaultTiers,
          organizerId: "org-master",
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        // Reset form
        setNewTitle("");
        setNewVenue("");
        await fetchEvents();
        alert("Event successfully created and published live!");
      } else {
        const errData = await res.json();
        alert(errData.error?.message || "Failed to create event.");
      }
    } catch (err: any) {
      alert(err.message || "Network error creating event.");
    } finally {
      setIsCreating(false);
    }
  };

  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];

  return (
    <div className="organizer-page min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {/* Organizer Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                Organizer Studio & Control Room
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Verified Host
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Event Organizer Portal</h1>
            <p className="text-xs text-slate-400 mt-1">
              Publish events, manage seat capacity, inspect live sales telemetry, and set dynamic surge pricing.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        </div>

        {/* Global Sales Telemetry Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Total Events Hosted</span>
            <span className="text-2xl font-black text-white mt-1 block">{events.length}</span>
            <span className="text-[10px] text-slate-500 mt-1 block">Live in catalog</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Total Seat Capacity</span>
            <span className="text-2xl font-black text-indigo-400 mt-1 block">
              {events.reduce((acc, e) => acc + e.totalSeats, 0)}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">Units tracked</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Active Bookings Sold</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">
              {events.reduce((acc, e) => acc + (e.totalSeats - e.availableSeats), 0)}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">Confirmed attendees</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Estimated Revenue</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">
              ₹{(events.reduce((acc, e) => acc + (e.totalSeats - e.availableSeats) * e.basePrice, 0)).toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">0% gateway deductions</span>
          </div>
        </div>

        {/* Dynamic Surge Pricing & Event Management Two-Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Left Column: Event Selector & Surge Controls (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Dynamic Time & Demand Surge Pricing</h2>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Live Controller
              </span>
            </div>

            <div className="space-y-6">
              {/* Event Picker */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-2">Select Event to Manage</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({e.categoryLabel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Multiplier Presets */}
              {currentEvent && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-2">
                    Surge Multiplier: <strong className="text-indigo-400 font-bold">{surgeMultiplier}x</strong>
                  </label>
                  
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      { mult: 1.0, label: "Standard (1.0x)" },
                      { mult: 1.15, label: "Peak (+15%)" },
                      { mult: 1.3, label: "High Rush (+30%)" },
                      { mult: 1.5, label: "Surge (+50%)" },
                    ].map((item) => (
                      <button
                        key={item.mult}
                        type="button"
                        onClick={() => setSurgeMultiplier(item.mult)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                          surgeMultiplier === item.mult
                            ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Tier Preview with Surge Applied */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">
                      Live Projected Tier Prices
                    </span>
                    {currentEvent.tiers.map((tier) => (
                      <div key={tier.id} className="flex justify-between items-center py-1 border-b border-slate-900 last:border-0">
                        <span className="text-slate-300 font-medium">{tier.name}</span>
                        <div className="text-right">
                          <span className="text-xs font-bold text-white">
                            ₹{Math.round(tier.price * surgeMultiplier).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {pricingSuccessMsg && (
                    <div className="p-3 mt-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{pricingSuccessMsg}</span>
                    </div>
                  )}

                  <button
                    onClick={handleApplySurge}
                    disabled={isUpdatingPricing}
                    className="w-full mt-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUpdatingPricing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Pricing...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Apply & Publish Surge Multiplier</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Event Occupancy Card (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            {currentEvent ? (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-2">
                  Live Event Telemetry
                </span>
                <h3 className="text-base font-bold text-white mb-4">{currentEvent.title}</h3>

                <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Capacity</span>
                    <span className="font-bold text-white">{currentEvent.totalSeats} seats</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Available to Book</span>
                    <span className="font-bold text-emerald-400">{currentEvent.availableSeats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sold Out Occupancy</span>
                    <span className="font-bold text-indigo-400">
                      {Math.round(((currentEvent.totalSeats - currentEvent.availableSeats) / currentEvent.totalSeats) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Base Unit Price</span>
                    <span className="font-black text-white text-sm">₹{currentEvent.basePrice.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-[11px]">
                  <p>Venue: <strong className="text-slate-200">{currentEvent.venue}</strong></p>
                  <p className="mt-1">Schedule: <strong className="text-slate-200">{currentEvent.dateTime}</strong></p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">No event selected</div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">Seat availability updates live</span>
              <Link
                href={`/events/${currentEvent?.id}`}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
              >
                <span>View Public Page</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

        {/* Modal: Create Event Wizard */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <h2 className="text-lg font-bold text-white">Create & Host New Event</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Event Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Ed Sheeran: Mathematics Tour Mumbai"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => {
                        const val = e.target.value as EventCategory;
                        setNewCategory(val);
                        if (val === "CONCERT") setNewCategoryLabel("Live Stadium Concert");
                        if (val === "CINEMA") setNewCategoryLabel("IMAX 70mm Screen");
                        if (val === "SPORTS") setNewCategoryLabel("Championship Match");
                        if (val === "FLIGHT") setNewCategoryLabel("Commercial Flight");
                        if (val === "TRANSIT") setNewCategoryLabel("High-Speed Rail");
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="CONCERT">Concert</option>
                      <option value="CINEMA">Cinema / Theater</option>
                      <option value="SPORTS">Sports / Cricket</option>
                      <option value="FLIGHT">Flight</option>
                      <option value="TRANSIT">Express Rail</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Total Seat Capacity</label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={5000}
                      value={newTotalSeats}
                      onChange={(e) => setNewTotalSeats(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Venue & Terminal / Stadium</label>
                  <input
                    type="text"
                    required
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    placeholder="e.g. Jio World Convention Centre, Bandra"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Base Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={newBasePrice}
                      onChange={(e) => setNewBasePrice(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Date & Time</label>
                    <input
                      type="text"
                      required
                      value={newDateTime}
                      onChange={(e) => setNewDateTime(e.target.value)}
                      placeholder="e.g. Saturday • 08:00 PM IST"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Details about the event, artist, and highlights..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1.5"
                  >
                    {isCreating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                    <span>Publish Event</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
