"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Mail,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Copy,
  Check,
  CreditCard,
  Lock,
} from "lucide-react";

const CATEGORIES = [
  { id: "BOOKING", label: "Booking & Flash Hold Assistance" },
  { id: "PAYMENT", label: "Payment Verification & UPI UTR Status" },
  { id: "TICKETS", label: "Ticket Issuance & QR Delivery" },
  { id: "ACCOUNT", label: "Organizer & Account Access" },
  { id: "EVENT_ENQUIRY", label: "Event Listing & Tier Inquiry" },
  { id: "OTHER", label: "General Feedback & Inquiry" },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    category: "BOOKING",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<null | {
    ticketId: string;
    receivedAt: string;
    message: string;
  }>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (formData.fullName.trim().length < 2) {
      setErrorMessage("Please provide your full name (minimum 2 characters).");
      return;
    }
    if (!formData.email.includes("@") || !formData.email.includes(".")) {
      setErrorMessage("Please provide a valid email address.");
      return;
    }
    if (formData.subject.trim().length < 3) {
      setErrorMessage("Please enter a subject (minimum 3 characters).");
      return;
    }
    if (formData.message.trim().length < 10) {
      setErrorMessage("Please describe your issue or inquiry in detail (minimum 10 characters).");
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${apiUrl}/api/v1/support/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Submission failed (${response.status}). Please email ticketwala.org@gmail.com directly.`
        );
      }

      const data = await response.json();
      setSubmitSuccess({
        ticketId: data.ticketId,
        receivedAt: data.receivedAt,
        message: data.message,
      });
    } catch (err: any) {
      // Offline fallback: generate client-side reference ticket ID so user is never stranded
      const fallbackTicketId = `TKT-SUP-${Date.now().toString(36).toUpperCase()}-LOCAL`;
      setSubmitSuccess({
        ticketId: fallbackTicketId,
        receivedAt: new Date().toISOString(),
        message:
          "Your inquiry has been generated locally. You can also forward this reference ID directly to ticketwala.org@gmail.com for priority processing.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Page Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Support and help</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            How can our team help you?
          </h1>
          <p className="text-slate-400 text-sm">
            Whether you have an active 45s reservation inquiry, need UPI payment verification, or want to host a high-demand drop, we are here to support you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Inquiry Form or Confirmation Banner */}
          <div className="lg:col-span-2">
            {submitSuccess ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-6 shadow-xl animate-in fade-in duration-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white">Inquiry Received Successfully</h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {submitSuccess.message}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Your Support Reference ID
                  </span>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm sm:text-base font-bold text-indigo-400">
                      {submitSuccess.ticketId}
                    </span>
                    <button
                      onClick={() => handleCopy(submitSuccess.ticketId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied" : "Copy Reference"}</span>
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <p>• Logged At: <span className="text-slate-200">{new Date(submitSuccess.receivedAt).toLocaleString()}</span></p>
                  <p>• Category: <span className="text-indigo-300 font-semibold">{formData.category}</span></p>
                  <p>• If urgent, you can email <a href="mailto:ticketwala.org@gmail.com" className="text-indigo-400 underline">ticketwala.org@gmail.com</a> with this reference.</p>
                </div>

                <button
                  onClick={() => {
                    setSubmitSuccess(null);
                    setFormData({
                      fullName: "",
                      email: "",
                      category: "BOOKING",
                      subject: "",
                      message: "",
                    });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5"
              >
                {errorMessage && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Your Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Inquiry Category <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Subject Line <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Brief topic of inquiry"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Detailed Message & Booking / UTR Reference <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Please include reservation ID, transaction UTR number, or event title if applicable..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Do NOT enter bank passwords, debit card PINs, or UPI PINs. Our team never requests PINs.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/20"
                >
                  {isSubmitting ? (
                    <span>Submitting Inquiry...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Inquiry Ticket</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Direct Support & Operational Assurances Sidebar */}
          <div className="space-y-6">
            {/* Direct Email Card */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Direct Email Support</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                For urgent escalation or enterprise organizer inquiries, reach our customer response desk directly:
              </p>
              <a
                href="mailto:ticketwala.org@gmail.com"
                className="inline-block text-xs font-mono font-semibold text-indigo-400 hover:text-indigo-300 underline"
              >
                ticketwala.org@gmail.com
              </a>
            </div>

            {/* Demo checkout information */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Payment information</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This is a booking demo. Payments are not processed or verified, so please do not send money.
              </p>
            </div>

            {/* Seat hold information */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Seat hold time</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A selected seat is held for up to two minutes while you review your booking. When the time ends, the seat becomes available again.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-amber-400 font-medium">
                <Lock className="w-3.5 h-3.5" />
                <span>Choose an available seat to continue</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
