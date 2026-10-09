import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldCheck, Lock, Eye, Database, Server, Mail } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | TicketWala & FlashLock Engine",
  description: "Privacy and data protection commitments for TicketWala's high-contention flash reservation platform.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "October 2026";

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-slate-900 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Data Protection & Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400">
            Last Updated: {lastUpdated} • Governs TicketWala and the FlashLock High-Contention Reservation Architecture
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              1. Overview & Core Philosophy
            </h2>
            <p>
              TicketWala is engineered around a core principle of minimal data retention and strict transactional integrity. We collect only the information strictly required to facilitate atomic ticket holds, verify UPI transactions, and issue digital entry passes. We never monetize or sell personal customer data to advertisers or third-party data brokers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              2. Information We Collect
            </h2>
            <div className="space-y-2">
              <p>
                <strong className="text-white">• Account & Identity Data:</strong> When you sign in via Google OAuth / Firebase, we receive your full name, verified email address, and profile picture avatar.
              </p>
              <p>
                <strong className="text-white">• Transaction & Payment References:</strong> When paying for a reservation, we collect the 12-digit UPI UTR transaction reference number, timestamp, amount paid, and payee VPA (<span className="font-mono text-emerald-400">9146199158@fam</span>). <em>We never see, store, or transmit your banking passwords, debit card PINs, or UPI PINs.</em>
              </p>
              <p>
                <strong className="text-white">• Ephemeral Hold Credentials:</strong> During high-traffic ticket drops, our FlashLock engine generates temporary cryptographic hold tokens. These tokens are stored securely as SHA-256 hashes and expire automatically.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              3. The 120-Second Ephemeral Data Lifecycle
            </h2>
            <p>
              Unlike legacy ticketing services that hold customer data indefinitely during checkout abandonment:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>
                Reservations are locked for strictly <strong className="text-white">120 seconds</strong> via atomic Redis keys and in-memory TTL clocks.
              </li>
              <li>
                If a payment confirmation is not completed within 120 seconds, the hold token is invalidated immediately, and the unit is recycled back into the public queue.
              </li>
              <li>
                Abandoned hold sessions leave zero orphaned personal data in our persistence layer.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              4. Technical Security & Infrastructure Safeguards
            </h2>
            <p>
              We implement industry-standard defense-in-depth measures to protect your sessions:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>
                Strict HTTP security response headers (<code className="text-indigo-300">X-Content-Type-Options: nosniff</code>, <code className="text-indigo-300">X-Frame-Options: DENY</code>, and restrictive permissions policies).
              </li>
              <li>
                Sliding-window IP rate limiting across contact and reservation endpoints to deter automated bot scrapers.
              </li>
              <li>
                Idempotency key enforcement on all booking and payment confirmation requests to prevent duplicate charges.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              5. Data Rectification & Support Inquiries
            </h2>
            <p>
              If you wish to review, update, or purge your ticket booking records or account association, you may submit a request to our operations desk at:
            </p>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="font-semibold text-white">TicketWala Data Privacy Team</p>
              <p className="text-slate-400">
                Email: <a href="mailto:ticketwala.org@gmail.com" className="text-indigo-400 underline">ticketwala.org@gmail.com</a>
              </p>
              <p className="text-slate-500 text-xs">Response SLA: Within 48 hours for verified account holders.</p>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
