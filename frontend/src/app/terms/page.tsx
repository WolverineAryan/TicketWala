import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText, ShieldAlert, Clock, QrCode, CreditCard, Ban } from "lucide-react";

export const metadata = {
  title: "Terms of Service | TicketWala & FlashLock Engine",
  description: "Terms and conditions governing high-contention flash reservations and ticket issuance.",
};

export default function TermsOfServicePage() {
  const lastUpdated = "October 2026";

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-slate-900 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <span>Platform Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-400">
            Last Updated: {lastUpdated} • Governing flash holds, payments, and admission verification
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              1. FlashLock 120-Second Reservation Engine
            </h2>
            <p>
              TicketWala utilizes the FlashLock distributed inventory algorithm to manage seat contention under extreme traffic surges. By initiating a booking hold:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>
                You receive an exclusive, temporary reservation lease valid for exactly <strong className="text-white">120 seconds</strong>.
              </li>
              <li>
                During this 120-second window, no other user, automated agent, or bot can purchase or hold that inventory unit.
              </li>
              <li>
                If you do not complete the payment verification within 120 seconds, the lease expires unconditionally, and the seat is immediately recycled to the public availability queue.
              </li>
              <li>
                The platform guarantees the mathematical invariant: <code className="text-amber-300">Available + Held + Confirmed = Total Capacity</code> at all times.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              2. UPI Payments & Verification
            </h2>
            <p>
              Checkout transactions are processed through India's National Payments Corporation of India (NPCI) Unified Payments Interface (UPI):
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>
                All direct payments must be made to the authorized platform VPA: <span className="font-mono text-emerald-400 font-semibold">9146199158@fam</span>.
              </li>
              <li>
                Users must provide a valid 12-digit UPI UTR transaction reference number for verification.
              </li>
              <li>
                Our backend uses strict idempotency checking. Duplicate payment submissions with the same UTR or provider transaction ID will be processed safely with zero duplicate charges.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-indigo-400" />
              3. Single-Use QR Pass & Gate Admission Rules
            </h2>
            <p>
              Upon successful payment confirmation, a cryptographic digital boarding pass with an entrance QR code is issued:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>
                Each boarding pass QR code is single-use only. Once scanned and verified at the venue gate, its state permanently transitions to <code className="text-emerald-400">USED</code>.
              </li>
              <li>
                Any subsequent scan of the same QR code will be rejected with an admission warning.
              </li>
              <li>
                Duplicating, capturing screenshots for multiple entries, or altering digital tickets is strictly prohibited.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-400" />
              4. Fair Contention & Anti-Bot Policy
            </h2>
            <p>
              To protect genuine attendees from ticket scalpers and automated queue manipulation:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>
                Rate-limiting algorithms monitor request volume per IP and session.
              </li>
              <li>
                Submitting scripted requests designed to monopolize inventory, bypass token verification, or flood the checkout pipeline will trigger adaptive admission fences or temporary IP bans.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              5. Support & Disputes
            </h2>
            <p>
              In the rare event of a network disruption during UPI payment where a seat expired before confirmation, contact our support team with your 12-digit UTR number:
            </p>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="font-semibold text-white">TicketWala Operations Support</p>
              <p className="text-slate-400">
                Email: <a href="mailto:ticketwala.org@gmail.com" className="text-indigo-400 underline">ticketwala.org@gmail.com</a>
              </p>
              <p className="text-slate-500 text-xs">Support Desk: <a href="/contact" className="text-indigo-400 underline">ticketwala.com/contact</a></p>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
