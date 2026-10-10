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
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { EventDetails } from "@/types/api";

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
  const [sortOrder, setSortOrder] = useState<"featured" | "price-low" | "price-high" | "availability">("featured");
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
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesSearch =
      normalizedQuery === "" ||
      e.title.toLowerCase().includes(normalizedQuery) ||
      e.venue.toLowerCase().includes(normalizedQuery) ||
      e.location.toLowerCase().includes(normalizedQuery) ||
      e.description.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesSearch;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortOrder === "price-low") return a.basePrice - b.basePrice;
    if (sortOrder === "price-high") return b.basePrice - a.basePrice;
    if (sortOrder === "availability") return b.availableSeats - a.availableSeats;
    return 0;
  });

  const clearFilters = () => {
    setSelectedCategory("ALL");
    setSearchQuery("");
    setSortOrder("featured");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
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
                  aria-pressed={isSelected}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105"
                      : "bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    isSelected ? "bg-white/15 text-white" : "bg-slate-800 text-slate-500"
                  }`}>
                    {cat.id === "ALL"
                      ? events.length
                      : events.filter((event) => event.category.toUpperCase() === cat.id).length}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={fetchEvents}
            disabled={isLoading}
            title="Refresh Live Availability"
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition disabled:cursor-not-allowed disabled:opacity-50 hidden sm:flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Hero Spotlight Banner */}
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-indigo-900/50 via-purple-900/30 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <h1 className="text-2xl sm:text-3xl font-black text-white">Find your next great experience</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Instant 60s seat reservation with zero booking fee via direct UPI payment. Select your exact seats in real-time.
            </p>
            <p className="text-xs text-slate-400 mt-3">Your seat is held for 60 seconds when you continue to checkout.</p>
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search events, venues, or locations"
              aria-label="Search events, venues, or locations"
              className="w-full bg-slate-900 border border-slate-800 text-sm rounded-xl pl-10 pr-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs text-slate-400">
            <span className="whitespace-nowrap">Sort by</span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)}
              aria-label="Sort events"
              className="min-w-36 bg-transparent py-3 font-semibold text-white outline-none"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="availability">Most seats available</option>
            </select>
          </label>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Events for you</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
                {filteredEvents.length} {filteredEvents.length === 1 ? "Event" : "Events"}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Select an event to view available seats and ticket prices</p>
          </div>
        </div>

        {/* Events Grid (BookMyShow Card Layout) */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
            <p className="text-xs">Fetching live events catalog...</p>
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
            <Search className="mx-auto mb-3 h-6 w-6 text-slate-500" />
            <p className="text-sm font-semibold text-slate-400">No events match those filters</p>
            <button
              onClick={clearFilters}
              className="mt-3 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300"
            >
              Clear search and filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedEvents.map((event) => {
              return (
                <div
                  key={event.id}
                  className="transform rounded-2xl border border-slate-800 bg-slate-900 transition duration-200 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 focus-within:ring-2 focus-within:ring-indigo-500/50 group flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-5">
                    {/* Badge & Category */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 uppercase tracking-wider">
                        {event.categoryLabel}
                      </span>
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

                  {/* Availability & Booking Footer */}
                  <div className="p-5 bg-slate-950/60 border-t border-slate-800/80">
                    {/* Price and CTA */}
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">From</span>
                        <span className="text-lg font-black text-white">
                          ₹{event.basePrice.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-1">
                          {event.availableSeats} of {event.totalSeats} seats available
                        </span>
                      </div>

                      <Link
                        href={`/events/${event.id}`}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
                      >
                        <span>View event</span>
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
