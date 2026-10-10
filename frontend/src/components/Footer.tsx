"use client";

import React from "react";
import Link from "next/link";
import { Ticket, Mail, ArrowUpRight, ShieldCheck } from "lucide-react";


export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-900 bg-slate-950 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand & Mission */}
          <div className="md:col-span-1 space-y-3">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                TicketWala
                <span className="text-[9px] uppercase font-bold tracking-widest px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Live
                </span>
              </span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed">
              Discover events, compare ticket options, and choose a seat for your next experience.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>FlashLock 45s Invariant Verified</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Explore</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/home" className="hover:text-indigo-400 transition flex items-center gap-1">
                  Events Catalog
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-indigo-400 transition flex items-center gap-1">
                  My Bookings & Passes
                </Link>
              </li>
              <li>
                <Link href="/organizer" className="hover:text-indigo-400 transition flex items-center gap-1">
                  Organizer Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Information</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="hover:text-indigo-400 transition">
                  Privacy Policy & Data Security
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-indigo-400 transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <span className="text-slate-500 text-[11px] block mt-1">
                  Holds expire strictly after 45s if unpaid. Recycled to pool automatically.
                </span>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="hover:text-indigo-400 transition font-medium text-slate-200 flex items-center gap-1">
                  Contact Support Desk
                  <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <a
                  href="mailto:ticketwala.org@gmail.com"
                  className="hover:text-indigo-400 transition flex items-center gap-1.5 text-slate-300"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ticketwala.org@gmail.com</span>
                </a>
              </li>
              <li className="pt-2 text-[11px] text-amber-300">
                Demo only: payments are not processed or verified. Please do not send money.
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            © {currentYear} TicketWala. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-400 transition">Privacy</Link>
            <span className="text-slate-800">•</span>
            <Link href="/terms" className="hover:text-slate-400 transition">Terms</Link>
            <span className="text-slate-800">•</span>
            <Link href="/contact" className="hover:text-slate-400 transition">Contact</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
