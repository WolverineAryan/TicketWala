"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  CreditCard,
  QrCode,
  Mail,
  User,
  Phone,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Download,
} from "lucide-react";
import confetti from "canvas-confetti";
import ConfirmedTicketPass from "@/components/ConfirmedTicketPass";
import { ConfirmResponse, DynamicUpiDetails, HoldResponse } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = (params?.id as string) || "";

  const [holdData, setHoldData] = useState<HoldResponse | null>(null);
  const [upiDetails, setUpiDetails] = useState<DynamicUpiDetails | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(120);

  // Form State
  const [passengerName, setPassengerName] = useState("Aryan Sharma");
  const [email, setEmail] = useState("ticketwala.org@gmail.com");
  const [phone, setPhone] = useState("+91 91461 99158");
  const [utrNumber, setUtrNumber] = useState("");

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmedTicket, setConfirmedTicket] = useState<ConfirmResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load hold data from session
  useEffect(() => {
    const raw = sessionStorage.getItem("tw_hold");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setHoldData(parsed);
      } catch (_) {}
    }

    // Prefill from user session if available
    const userRaw = localStorage.getItem("tw_user");
    if (userRaw) {
      try {
        const u = JSON.parse(userRaw);
        if (u.displayName) setPassengerName(u.displayName);
        if (u.email) setEmail(u.email);
      } catch (_) {}
    }
  }, []);

  // Fetch dynamic UPI QR from backend
  useEffect(() => {
    if (!reservationId) return;

    fetch(`${API_BASE}/api/v1/reservations/${reservationId}/upi-qr?amount=${holdData?.price || 48500}`)
      .then((res) => res.json())
      .then((data) => setUpiDetails(data))
      .catch((err) => console.error("Failed to load UPI QR:", err));
  }, [reservationId, holdData?.price]);

  // 120-second active hold countdown timer
  useEffect(() => {
    if (confirmedTicket) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [confirmedTicket]);

  const copyUpiId = () => {
    if (!upiDetails?.upiId) return;
    navigator.clipboard.writeText(upiDetails.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleVerifyAndConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holdData?.holdToken) {
      setErrorMessage("Missing hold authorization token. Please select seat again.");
      return;
    }

    if (!utrNumber || utrNumber.trim().length < 8) {
      setErrorMessage("Please enter a valid 12-digit UPI Reference / UTR Number from your payment receipt.");
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/reservations/${reservationId}/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holdToken: holdData.holdToken,
          utr: utrNumber.trim(),
          passengerName: passengerName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          paymentMethod: "UPI",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error?.message || "Failed to verify UPI payment.");
        return;
      }

      setConfirmedTicket(data);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to verify payment with server.");
    } finally {
      setIsVerifying(false);
    }
  };

  // If confirmed, render verified boarding pass
  if (confirmedTicket) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-12 w-full flex-1">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
              <CheckCircle2 className="w-4 h-4" />
              <span>Payment Verified • Ticket Dispatched to {email}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Your Booking is Confirmed!</h1>
            <p className="text-xs text-slate-400 mt-1">An official HTML ticket with gate QR barcode has been emailed to you.</p>
          </div>

          <ConfirmedTicketPass ticket={confirmedTicket} onBookAnother={() => router.push("/explore")} />
        </main>
      </div>
    );
  }

  // Expired State
  if (timeLeft === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Reservation Hold Expired</h2>
          <p className="text-xs text-slate-400 mt-2">
            The 120-second lease has elapsed and the seat was released back to the available queue to prevent inventory hoarding.
          </p>
          <button
            onClick={() => router.push("/explore")}
            className="mt-6 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition"
          >
            Select Another Seat
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {/* Urgent Timer Alert Header */}
        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Seat Temporarily Held for You</span>
              <span className="text-[11px] text-slate-400">
                Seat <strong className="text-indigo-400 font-bold">{holdData?.unitId || "Allocated"}</strong> is locked exclusively in your name.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400">Time Left:</span>
            <span className="text-xl font-black font-mono text-amber-400">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Checkout Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Attendee Form & Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Passenger Details */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                <span>Passenger / Attendee Details</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Aryan Sharma"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Email Address (For E-Ticket Dispatch)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl pl-9 pr-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. ticketwala.org@gmail.com"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Your confirmed ticket and QR barcode will be dispatched to this address.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Mobile Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl pl-9 pr-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                      placeholder="+91 91461 99158"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Fare Breakdown</h2>
              
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Base Ticket Fare</span>
                  <span className="text-white font-semibold">₹{(holdData?.price || 48500).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Convenience Fee (UPI Direct)</span>
                  <span className="text-emerald-400 font-bold">₹0 (FREE)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST & Service Taxes</span>
                  <span className="text-white font-semibold">Included</span>
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-between text-sm">
                  <span className="font-bold text-white">Amount Payable</span>
                  <span className="font-black text-emerald-400 text-base">
                    ₹{(holdData?.price || 48500).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Zero-Cost UPI Payment Module (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xs">
                    UPI
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Zero-Fee Direct UPI Payment</h2>
                    <span className="text-[10px] text-slate-400">GPay • PhonePe • Paytm • Cred • BHIM</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  0% MDR Fee
                </span>
              </div>

              {/* Dynamic QR Code & Instructions */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-6 mb-6">
                
                {/* QR Image */}
                <div className="bg-white p-3 rounded-xl shadow-lg shrink-0">
                  {upiDetails?.qrCodeDataUrl ? (
                    <img
                      src={upiDetails.qrCodeDataUrl}
                      alt="Scan to Pay via UPI"
                      className="w-40 h-40 object-contain rounded"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                    </div>
                  )}
                </div>

                {/* UPI Details & App Launch */}
                <div className="space-y-3 text-xs w-full">
                  <div>
                    <span className="text-slate-500 font-semibold text-[10px] uppercase block">Receiver UPI ID</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-indigo-300 font-mono text-xs font-bold">
                        {upiDetails?.upiId || "9146199158@fam"}
                      </code>
                      <button
                        type="button"
                        onClick={copyUpiId}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 font-semibold text-[10px] uppercase block">Exact Amount</span>
                    <div className="text-lg font-black text-white mt-0.5">
                      ₹{(holdData?.price || 48500).toLocaleString("en-IN")}
                    </div>
                  </div>

                  {upiDetails?.intentUrl && (
                    <a
                      href={upiDetails.intentUrl}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
                    >
                      <span>Pay via UPI App on Mobile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

              </div>

              {/* UTR Submission Form */}
              <form onSubmit={handleVerifyAndConfirm} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-white block mb-1">
                    Enter 12-Digit UPI Reference / UTR Number
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    After completing the payment in your UPI app, enter the 12-digit transaction ID or UTR number shown on your receipt.
                  </p>
                  <input
                    type="text"
                    required
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. 412356789012"
                    maxLength={16}
                    className="w-full bg-slate-950 border border-indigo-500/40 text-sm font-mono tracking-wider rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying UTR & Issuing Ticket...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify Payment & Dispatch Ticket</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-500 text-center">
              Replay protection active. Duplicate UTR submissions are cryptographically rejected.
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
