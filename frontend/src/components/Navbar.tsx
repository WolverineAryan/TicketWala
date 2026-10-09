"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Ticket,
  MapPin,
  Search,
  User as UserIcon,
  PlusCircle,
  LogIn,
  LogOut,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { auth, signInWithGoogle, logOut } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

const CITIES = ["Mumbai", "Delhi-NCR", "Bengaluru", "Hyderabad", "Goa", "Pune", "Chennai"];

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedCity, setSelectedCity] = useState("Mumbai");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  useEffect(() => {
    if (!auth) {
      // Check localStorage for simulated user
      const stored = localStorage.getItem("tw_user");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (_) {}
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        localStorage.setItem("tw_user", JSON.stringify({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const { user, error } = await signInWithGoogle();
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("tw_user", JSON.stringify({
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      }));
    } else if (error) {
      alert(`Sign in: ${error}`);
    }
  };

  const handleSignOut = async () => {
    await logOut();
    setCurrentUser(null);
    localStorage.removeItem("tw_user");
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & City Selector */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                  TicketWala
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    Live
                  </span>
                </span>
              </div>
            </Link>

            {/* City Selector (BookMyShow style) */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
              >
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>{selectedCity}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {showCityDropdown && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50">
                  {CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedCity(city);
                        setShowCityDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-800 transition ${
                        selectedCity === city ? "text-indigo-400 font-bold" : "text-slate-300"
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search Bar (District by Zomato style) */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search movies, concerts, sports, flights..."
                className="w-full bg-slate-900/80 border border-slate-800 text-xs rounded-xl pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* Navigation Links & User Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/explore"
              className={`text-xs font-medium px-3 py-2 rounded-lg transition ${
                pathname === "/explore"
                  ? "bg-slate-800 text-indigo-400 font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-slate-900"
              }`}
            >
              Explore
            </Link>

            <Link
              href="/profile"
              className={`text-xs font-medium px-3 py-2 rounded-lg transition ${
                pathname === "/profile"
                  ? "bg-slate-800 text-indigo-400 font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-slate-900"
              }`}
            >
              My Bookings
            </Link>

            {/* Organizer Portal CTA */}
            <Link
              href="/organizer"
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                pathname.startsWith("/organizer")
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                  : "bg-slate-900 text-indigo-300 border-indigo-500/30 hover:border-indigo-500 hover:bg-indigo-950/30"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Host Event</span>
            </Link>

            {/* Google Authentication */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-2">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || "User"}
                      className="w-7 h-7 rounded-full border border-indigo-500/50"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center text-xs font-bold text-indigo-400">
                      {currentUser.displayName?.[0] || "U"}
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-200 hidden lg:inline-block max-w-[100px] truncate">
                    {currentUser.displayName || currentUser.email?.split("@")[0]}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm shadow-indigo-600/20"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
