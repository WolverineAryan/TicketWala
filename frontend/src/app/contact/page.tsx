"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message || "Contact delivery is not currently configured.");
      }
      event.currentTarget.reset();
      setStatus("success");
      setMessage("Your enquiry was submitted successfully.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to submit your enquiry.");
    }
  }

  return (
    <div className="public-page">
      <Navbar />
      <main className="public-page-main">
        <Link href="/" className="public-back-link">← Back to TicketWala</Link>
        <div className="public-page-grid">
          <section>
            <p className="public-eyebrow">Support</p>
            <h1>How can we help?</h1>
            <p className="public-lede">
              Send an enquiry about bookings, payments, tickets, accounts, or an event.
              We only confirm delivery after the configured support service accepts it.
            </p>
            <div className="public-note">
              <strong>Delivery status</strong>
              <span>Support delivery is not configured in this environment. Submissions will return an explicit error rather than being silently discarded.</span>
            </div>
          </section>

          <form className="public-form" onSubmit={submit}>
            <label>
              Full name
              <input name="fullName" required minLength={2} maxLength={100} />
            </label>
            <label>
              Email
              <input name="email" type="email" required maxLength={254} />
            </label>
            <label>
              Enquiry category
              <select name="category" required defaultValue="">
                <option value="" disabled>Select a category</option>
                <option value="booking">Booking</option>
                <option value="payment">Payment</option>
                <option value="tickets">Tickets</option>
                <option value="account">Account support</option>
                <option value="event">Event enquiry</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              Message
              <textarea name="message" required minLength={10} maxLength={4000} rows={6} />
            </label>
            <button className="public-submit" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Submitting..." : "Submit enquiry"}
            </button>
            {message && (
              <p className={`public-form-message ${status}`} role="status">
                {message}
              </p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
