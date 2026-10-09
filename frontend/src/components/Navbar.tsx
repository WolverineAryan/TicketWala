"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Ticket,
  User as UserIcon,
  PlusCircle,
  LogIn,
  LogOut,
  Menu,
  X,
  HelpCircle,
} from "lucide-react";
import { auth, signInWithGoogle, logOut } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


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

          </div>

          {/* Desktop Navigation Links & User Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/home"
              className={`text-xs font-medium px-3 py-2 rounded-lg transition ${
                pathname === "/home" || pathname === "/explore"
                  ? "bg-slate-800 text-indigo-400 font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-slate-900"
              }`}
            >
              Explore Events
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

            <Link
              href="/contact"
              className={`text-xs font-medium px-2.5 py-2 rounded-lg transition ${
                pathname === "/contact"
                  ? "bg-slate-800 text-indigo-400 font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
              title="Support Desk"
            >
              Support
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

          {/* Mobile Hamburger & Quick Action Button */}
          <div className="flex md:hidden items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "User"}
                    className="w-6 h-6 rounded-full border border-indigo-500/50"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-600/30 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                    {currentUser.displayName?.[0] || "U"}
                  </div>
                )}
              </div>
            ) : null}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-indigo-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-150">
          {/* Primary Links */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/home"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl border transition ${
                pathname === "/home" || pathname === "/explore"
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-slate-900 text-slate-200 border-slate-800"
              }`}
            >
              <span>Explore Events</span>
            </Link>

            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl border transition ${
                pathname === "/profile"
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-slate-900 text-slate-200 border-slate-800"
              }`}
            >
              <span>My Bookings</span>
            </Link>

            <Link
              href="/organizer"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl border transition ${
                pathname.startsWith("/organizer")
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-slate-900 text-slate-200 border-slate-800"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Host Event</span>
            </Link>
          </div>

          {/* Secondary & Support Links */}
          <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-indigo-400 transition"
            >
              Contact Support
            </Link>
            <Link
              href="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-indigo-400 transition"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-indigo-400 transition"
            >
              Terms of Service
            </Link>
          </div>

          {/* User Auth Bar */}
          <div className="pt-2 border-t border-slate-900">
            {currentUser ? (
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
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
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-white">
                      {currentUser.displayName || "User"}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                      {currentUser.email}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1 text-xs text-rose-400 font-semibold px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  handleSignIn();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/20"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Google</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
