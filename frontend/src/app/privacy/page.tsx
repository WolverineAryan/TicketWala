import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldCheck, Lock, Eye, Database, Server, Mail } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | TicketWala",
  description: "Learn how TicketWala handles the information you provide.",
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
            Last updated: {lastUpdated}
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
              TicketWala is a booking demonstration. We use information you enter, such as account, contact, and booking details, to operate the site and display your bookings. Do not enter payment card details, banking passwords, or UPI PINs, and do not send real payments through this demo.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              2. Information We Collect
            </h2>
            <div className="space-y-2">
              <p>
                <strong className="text-white">• Account & Identity Data:</strong> When you sign in with Google, we receive the profile details needed to identify your account.
              </p>
              <p>
                <strong className="text-white">• Booking details:</strong> We store the details you submit for a demo booking, which may include your name, contact information, selected event, and the payment reference you enter. A reference is not verified with a bank or payment provider.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              3. Seat holds
            </h2>
            <p>
              When you select a seat:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>
                Your selected seat is held for up to <strong className="text-white">two minutes</strong> while you review your booking.
              </li>
              <li>
                When the hold expires, the seat becomes available for someone else to select.
              </li>
              <li>
                Information you submit as part of a booking may remain in the demo's booking records.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              4. Keeping your information safe
            </h2>
            <p>
              Please use the site as a demo and avoid submitting sensitive financial information. We take steps to protect information submitted to the site, but no internet service can guarantee complete security.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>
                Sign-in and booking information is used to provide the site's features.
              </li>
              <li>
                We may use technical information, such as browser or request details, to maintain and protect the service.
              </li>
              <li>
                Payment references entered into this demo do not verify a payment or confirm that funds were received.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              5. Data Rectification & Support Inquiries
            </h2>
            <p>
              To ask about information associated with your account or booking, contact us at:
            </p>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="font-semibold text-white">TicketWala Data Privacy Team</p>
              <p className="text-slate-400">
                Email: <a href="mailto:ticketwala.org@gmail.com" className="text-indigo-400 underline">ticketwala.org@gmail.com</a>
              </p>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
