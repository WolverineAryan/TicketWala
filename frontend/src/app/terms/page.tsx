import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Terms & Conditions | TicketWala",
  description: "Draft TicketWala terms covering reservations, payments, tickets, and support.",
};

export default function TermsPage() {
  return (
    <div className="public-page">
      <Navbar />
      <main className="public-document">
        <Link href="/" className="public-back-link">← Back to TicketWala</Link>
        <p className="public-eyebrow">Legal</p>
        <h1>Terms &amp; Conditions</h1>
        <p className="public-muted">Draft for owner and legal review · Last updated: October 10, 2026.</p>
        <p>
          These draft terms describe behaviors implemented or represented by the current product.
          They are not final terms of sale and must be approved before production launch.
        </p>
        <h2>Reservations and expiry</h2>
        <p>
          A hold temporarily reserves inventory. It is not a booking until the server verifies the
          required confirmation and payment steps. Holds expire at the server-controlled deadline,
          and expired inventory may become available to another customer.
        </p>
        <h2>Confirmation and tickets</h2>
        <p>
          A confirmation is issued only after ownership, expiry, idempotency, and payment checks
          succeed. Customers must provide accurate booking details and protect their reservation
          credentials.
        </p>
        <h2>Organizers and events</h2>
        <p>
          Organizers are responsible for accurate event information, inventory, pricing, venue
          rules, and fulfillment. Organizer permissions and publishing workflows remain subject to
          the backend capabilities and authorization configuration available at launch.
        </p>
        <h2>Cancellations, refunds, and event changes</h2>
        <p>
          Refund, rescheduling, cancellation, event-cancellation, abuse, support, and dispute
          rules are unresolved business decisions and must be confirmed by the owner before being
          presented as enforceable policy.
        </p>
      </main>
    </div>
  );
}
