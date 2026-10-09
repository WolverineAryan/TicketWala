import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText, ShieldAlert, Clock, QrCode, CreditCard, Ban } from "lucide-react";

export const metadata = {
  title: "Terms of Service | TicketWala",
  description: "Terms for using the TicketWala event booking demo.",
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
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              1. Seat selection and holds
            </h2>
            <p>
              When you select an available seat, it is held for you for up to <strong className="text-white">two minutes</strong> while you review your booking. If the hold expires, the seat may become available to another visitor.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>
                The hold is temporary and expires after up to two minutes.
              </li>
              <li>
                While the hold is active, other visitors cannot select that same seat.
              </li>
              <li>
                When the hold expires, the seat becomes available for someone else to select.
              </li>
              <li>
                Check the checkout page for the current hold timer and booking details.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              2. Demo checkout
            </h2>
            <p>
              TicketWala is a demonstration and does not process or verify real payments. Do not send money or enter banking credentials. Submitting a payment reference only creates a demo booking; it does not confirm that funds were received.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>
                Do not make payments to any account based on information shown in this demo.
              </li>
              <li>
                Payment references entered on the site are not checked with a bank or payment provider.
              </li>
              <li>
                A demo booking is not proof of payment, a confirmed ticket, or valid admission to an event.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-indigo-400" />
              3. Single-Use QR Pass & Gate Admission Rules
            </h2>
            <p>
              Booking summaries and QR codes shown by the demo are for demonstration only:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>
                They are not valid for entry unless an event organizer separately confirms otherwise.
              </li>
              <li>
                Check with the event organizer for official ticketing and entry information.
              </li>
              <li>
                Do not rely on a demo booking summary as an official ticket.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-400" />
              4. Fair use
            </h2>
            <p>
              Please use the site responsibly:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>
                Do not interfere with the site or attempt to disrupt its availability.
              </li>
              <li>
                Do not use automated tools to create bookings or submit misleading information.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              5. Support & Disputes
            </h2>
            <p>
              For questions about the demo or information you submitted, contact our support team:
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
