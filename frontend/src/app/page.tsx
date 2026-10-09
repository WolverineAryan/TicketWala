"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Sparkles,
  ArrowRight,
  Plane,
  Music,
  Trophy,
  Film,
  Train,
  ShieldCheck,
  Zap,
  CreditCard,
  Mail,
  ChevronRight,
  Users,
} from "lucide-react";

export default function LandingPage() {
  const categories = [
    {
      title: "Commercial Flights",
      desc: "Flagship long-haul direct routes with lie-flat beds and dining",
      icon: Plane,
      color: "from-sky-500 to-blue-600",
      count: "192 Seats / flight",
    },
    {
      title: "Stadium Concerts",
      desc: "Coldplay, AR Rahman & world tour spectacles with kinetic stages",
      icon: Music,
      color: "from-fuchsia-500 to-pink-600",
      count: "VIP & Standing Pits",
    },
    {
      title: "Cricket & Sports",
      desc: "IPL Grand Finals & championship matches at premier pavilions",
      icon: Trophy,
      color: "from-amber-500 to-orange-600",
      count: "Pitch-side Stands",
    },
    {
      title: "IMAX 70mm Cinema",
      desc: "10th Anniversary special screenings in dual laser full aperture",
      icon: Film,
      color: "from-violet-500 to-indigo-600",
      count: "Motorized Recliners",
    },
    {
      title: "High-Speed Rail",
      desc: "Vande Bharat Express semi-high speed panoramic journeys",
      icon: Train,
      color: "from-emerald-500 to-teal-600",
      count: "Executive Revolving",
    },
  ];

  const features = [
    {
      icon: Zap,
      title: "Atomic 120s Flash Hold",
      desc: "Seats are locked atomically in milliseconds. Zero double bookings or race conditions even under high-traffic ticket drops.",
    },
    {
      icon: CreditCard,
      title: "Zero-Cost UPI Checkout",
      desc: "Pay directly via GPay, PhonePe, Paytm, or Cred with dynamic QR codes. 0% convenience fees and instant receipt verification.",
    },
    {
      icon: Mail,
      title: "Instant Ticket Dispatch",
      desc: "Receive your official boarding pass, PNR reference, and cryptographic gate-entry QR code immediately in your inbox.",
    },
    {
      icon: ShieldCheck,
      title: "Verified Organizer Portal",
      desc: "Professional hosts can publish events, manage seat layouts, inspect analytics, and apply dynamic surge pricing.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Flash Ticketing Engine • BookMyShow & District Redefined</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            The Modern Ticket Booking Experience for{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-400 bg-clip-text text-transparent">
              Everything You Love
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Reserve movies, stadium concerts, cricket finals, flights, and express trains with zero contention, 120s guaranteed seat locks, and free direct UPI payments.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/explore"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2 group"
            >
              <span>Explore All Events</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/organizer"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Organizer & Host Portal</span>
            </Link>
          </div>

          {/* Live Trust Metrics */}
          <div className="mt-16 pt-8 border-t border-slate-900 grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-3xl mx-auto">
            <div>
              <div className="text-2xl font-black text-white">0%</div>
              <div className="text-xs text-slate-500 mt-1">Convenience Fee via UPI</div>
            </div>
            <div>
              <div className="text-2xl font-black text-indigo-400">120s</div>
              <div className="text-xs text-slate-500 mt-1">Guaranteed Hold Lock</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400">100%</div>
              <div className="text-xs text-slate-500 mt-1">No Double Bookings</div>
            </div>
            <div>
              <div className="text-2xl font-black text-violet-400">Instant</div>
              <div className="text-xs text-slate-500 mt-1">Email QR Dispatch</div>
            </div>
          </div>

        </div>
      </section>

      {/* Multipurpose Categories */}
      <section className="py-20 bg-slate-950 border-b border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Categories</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">One Platform, Five Verticals</h2>
            </div>
            <Link
              href="/explore"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group"
            >
              <span>View live inventory</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={idx}
                  href="/explore"
                  className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-5 transition flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-sm group-hover:text-indigo-300 transition">{cat.title}</h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{cat.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">{cat.count}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition" />
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

      {/* Why TicketWala Features */}
      <section className="py-20 bg-slate-900/30 border-b border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Built for High Contention</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">Engineered Like a Financial Exchange</h2>
            <p className="text-sm text-slate-400 mt-3">
              Traditional platforms crash or double-book tickets during high-demand drops. TicketWala isolates inventory with sub-millisecond atomic locks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-sm mb-2">{feat.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Organizer Call to Action */}
      <section className="py-20 bg-gradient-to-b from-slate-950 to-indigo-950/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border border-indigo-500/30 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <h2 className="text-2xl sm:text-3xl font-black text-white">Are You an Event Host or Organizer?</h2>
            <p className="text-sm text-slate-300 max-w-xl mx-auto mt-3">
              Host your own concerts, theatrical screenings, cricket leagues, or flights. Configure custom seat maps, apply dynamic time-based surge pricing, and view live sales analytics.
            </p>

            <div className="mt-8 flex justify-center">
              <Link
                href="/organizer"
                className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center gap-2"
              >
                <span>Launch Organizer Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-10 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">🎟️ TicketWala</span>
            <span>• Multipurpose High-Contention Ticketing Engine</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/explore" className="hover:text-slate-300 transition">Explore Events</Link>
            <Link href="/profile" className="hover:text-slate-300 transition">My Bookings</Link>
            <Link href="/organizer" className="hover:text-slate-300 transition">Organizer Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
