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
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [holdLoaded, setHoldLoaded] = useState(false);
  const [upiError, setUpiError] = useState<string | null>(null);

  // Form State
  const [passengerName, setPassengerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [utrNumber, setUtrNumber] = useState("");

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmedTicket, setConfirmedTicket] = useState<ConfirmResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load and validate hold data saved when the seat was selected.
  useEffect(() => {
    const raw = sessionStorage.getItem("tw_hold");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as HoldResponse;
        if (
          parsed.reservationId === reservationId &&
          parsed.holdToken &&
          Number.isFinite(parsed.expiresAt) &&
          Number.isFinite(parsed.price)
        ) {
          setHoldData(parsed);
          setTimeLeft(Math.max(0, parsed.expiresAt - Math.floor(Date.now() / 1000)));
        } else {
          setTimeLeft(0);
        }
      } catch {
        sessionStorage.removeItem("tw_hold");
        setTimeLeft(0);
      }
    } else {
      setTimeLeft(0);
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
    setHoldLoaded(true);
  }, [reservationId]);

  // Fetch dynamic UPI QR from backend
  useEffect(() => {
    if (!reservationId || !holdData) return;
    let cancelled = false;

    fetch(`${API_BASE}/api/v1/reservations/${reservationId}/upi-qr`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || `Could not load payment details (HTTP ${res.status})`);
        return data as DynamicUpiDetails;
      })
      .then((data) => {
        if (!cancelled) setUpiDetails(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setUpiError(err instanceof Error ? err.message : "Could not load payment details.");
      });

    return () => {
      cancelled = true;
    };
  }, [reservationId, holdData]);

  // 45-second active hold countdown timer against server-issued hold expiry
  useEffect(() => {
    if (!holdData || confirmedTicket) return;

    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, holdData.expiresAt - Math.floor(Date.now() / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [confirmedTicket, holdData]);

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
      setErrorMessage("Enter a payment reference with at least 8 characters.");
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
      sessionStorage.removeItem("tw_hold");
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

  // A submitted reference creates a demo booking; payment is not verified by a provider.
  if (confirmedTicket) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-12 w-full flex-1">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
              <CheckCircle2 className="w-4 h-4" />
              <span>Demo booking created</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Your demo booking is ready</h1>
            <p className="text-xs text-slate-400 mt-1">
              Payment was not checked with your bank or UPI provider. Ticket details are shown below; email delivery is best-effort.
            </p>
          </div>

          <ConfirmedTicketPass ticket={confirmedTicket} onBookAnother={() => router.push("/explore")} />
        </main>
      </div>
    );
  }

  if (!holdLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
        <Navbar />
        <main className="flex flex-1 items-center justify-center text-sm text-slate-400">
          Loading your seat hold…
        </main>
      </div>
    );
  }

  // Missing or expired reservation state
  if (timeLeft === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {holdData ? "Reservation hold expired" : "Reservation details unavailable"}
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            {holdData
              ? "The 45-second lease has elapsed and the seat was released back to the available queue to prevent inventory hoarding."
              : "We couldn’t find this seat hold in your session. Please choose a seat again to continue."}
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
        <nav aria-label="Booking progress" className="mb-6 flex items-center gap-3 text-xs">
          <span className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="h-5 w-5" /> Seat chosen
          </span>
          <span className="h-px flex-1 bg-indigo-500/50" />
          <span className="flex items-center gap-2 font-semibold text-indigo-300">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20">2</span>
            Checkout
          </span>
          <span className="h-px flex-1 bg-slate-800" />
          <span className="flex items-center gap-2 text-slate-500">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700">3</span>
            Ticket
          </span>
        </nav>

        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Your seat is held for you</span>
              <span className="text-[11px] text-slate-400">
                Seat <strong className="text-indigo-400 font-bold">{holdData?.seatLabel || holdData?.unitId || "—"}</strong>
                {holdData?.eventTitle ? ` · ${holdData.eventTitle}` : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400">Time to finish:</span>
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
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                <span>Your details</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Name on ticket</label>
                  <input
                    type="text"
                    required
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Name on the ticket"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl pl-9 pr-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                      placeholder="you@example.com"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    We’ll show ticket details here after you submit your payment reference.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Mobile number</label>
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
              <h2 className="text-sm font-bold text-white mb-4">Price summary</h2>
              
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Ticket price</span>
                  <span className="text-white font-semibold">₹{(holdData?.price ?? 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Extra fees</span>
                  <span className="text-white font-semibold">None in this demo</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Seat</span>
                  <span className="text-white font-semibold">{holdData?.seatLabel || holdData?.unitId || "—"}</span>
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-between text-sm">
                  <span className="font-bold text-white">Amount Payable</span>
                  <span className="font-black text-emerald-400 text-base">
                    ₹{(holdData?.price ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: UPI demo payment details (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xs">
                    UPI
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">UPI payment demo</h2>
                    <span className="text-[10px] text-slate-400">Payment status is not verified automatically</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  UPI
                </span>
              </div>

              {/* Dynamic QR Code & Instructions */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-6 mb-6">
                
                {/* QR Image */}
                <div className="bg-white p-3 rounded-xl shadow-lg shrink-0">
                  {upiError ? (
                    <div role="alert" className="w-40 h-40 flex items-center justify-center text-center text-xs text-rose-600">
                      {upiError}
                    </div>
                  ) : upiDetails?.qrCodeDataUrl ? (
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
                        {upiDetails?.upiId || "Loading payment details…"}
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
                      ₹{(upiDetails?.amount ?? holdData?.price ?? 0).toLocaleString("en-IN")}
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
                    UPI reference (UTR)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    This demo checks only the reference format and duplicate submissions. It cannot confirm that money was received.
                  </p>
                  <input
                    type="text"
                    required
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="Enter payment reference"
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
                      <span>Creating demo booking…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Create demo booking</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-500 text-center">
              This demo does not verify payments with a bank or UPI provider. Do not send real money.
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
