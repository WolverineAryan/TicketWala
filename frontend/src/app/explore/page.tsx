"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Film,
  Music,
  Trophy,
  Plane,
  Train,
  Sparkles,
  Calendar,
  MapPin,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Search,
} from "lucide-react";
import { EventCategory, EventDetails } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CATEGORIES: { id: string; label: string; icon: any }[] = [
  { id: "ALL", label: "All Events", icon: Sparkles },
  { id: "CONCERT", label: "Concerts", icon: Music },
  { id: "CINEMA", label: "Movies & IMAX", icon: Film },
  { id: "SPORTS", label: "Sports & IPL", icon: Trophy },
  { id: "FLIGHT", label: "Flights", icon: Plane },
  { id: "TRANSIT", label: "Express Rail", icon: Train },
];

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [events, setEvents] = useState<EventDetails[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((e) => {
    const matchesCategory =
      selectedCategory === "ALL" || e.category.toUpperCase() === selectedCategory.toUpperCase();
    const matchesSearch =
      searchQuery === "" ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="explore-page min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {/* District by Zomato & BookMyShow Style Category Filters */}
        <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-900 overflow-x-auto">
          <div className="flex items-center gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105"
                      : "bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={fetchEvents}
            title="Refresh Live Availability"
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition hidden sm:flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Hero Spotlight Banner */}
        <div className="mb-10 rounded-3xl bg-gradient-to-r from-indigo-900/50 via-purple-900/30 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold tracking-wide uppercase mb-3">
              <TrendingUp className="w-3 h-3 text-indigo-400" />
              <span>Trending in Mumbai & Live Events</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Experience High-Contention Ticketing</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Instant 120s seat reservation with zero booking fee via direct UPI payment. Select your exact seats in real-time.
            </p>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Explore Live Events</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
                {filteredEvents.length} Available
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Pick an event to select seats and reserve your ticket</p>
          </div>
        </div>

        {/* Events Grid (BookMyShow Card Layout) */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
            <p className="text-xs">Fetching live events catalog...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
            <p className="text-sm font-semibold text-slate-400">No events found matching your filter</p>
            <button
              onClick={() => setSelectedCategory("ALL")}
              className="mt-3 text-xs text-indigo-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const occupancy = Math.round(
                ((event.totalSeats - event.availableSeats) / event.totalSeats) * 100
              );

              return (
                <div
                  key={event.id}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition group flex flex-col justify-between shadow-lg hover:shadow-indigo-500/10"
                >
                  <div className="p-5">
                    {/* Badge & Category */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 uppercase tracking-wider">
                        {event.categoryLabel}
                      </span>
                      {event.badge && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wide">
                          {event.badge}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition line-clamp-2 leading-snug">
                      {event.title}
                    </h3>

                    {/* Venue & Date */}
                    <div className="mt-4 space-y-2 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{event.dateTime}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mt-3 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  {/* Seat Occupancy & Booking Footer */}
                  <div className="p-5 bg-slate-950/60 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-slate-400">
                        <strong className="text-emerald-400 font-bold">{event.availableSeats}</strong> of {event.totalSeats} seats left
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">{occupancy}% Booked</span>
                    </div>

                    {/* Mini Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-4">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(8, occupancy))}%` }}
                      />
                    </div>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Starts From</span>
                        <span className="text-lg font-black text-white">
                          ₹{event.basePrice.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <Link
                        href={`/events/${event.id}`}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
                      >
                        <span>Select Seats</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
