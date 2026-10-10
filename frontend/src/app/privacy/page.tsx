import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Privacy Policy | TicketWala",
  description: "How TicketWala handles account, reservation, payment, and technical data.",
};

export default function PrivacyPage() {
  return (
    <div className="public-page">
      <Navbar />
      <main className="public-document">
        <Link href="/" className="public-back-link">← Back to TicketWala</Link>
        <p className="public-eyebrow">Legal</p>
        <h1>Privacy Policy</h1>
        <p className="public-muted">Last updated: October 10, 2026 · Owner and legal review required before production use.</p>
        <p>
          This page describes the data practices visible in the current TicketWala implementation.
          It is product documentation, not a legal compliance certification.
        </p>
        <h2>Information used by the application</h2>
        <ul>
          <li>Account and authentication details supplied through the configured authentication provider.</li>
          <li>Reservation, booking, ticket, and payment-reference data needed to operate a booking.</li>
          <li>Support enquiry details when contact delivery is configured and enabled.</li>
          <li>Technical request, availability, and operational data used to protect and monitor the service.</li>
        </ul>
        <h2>How it is used</h2>
        <p>
          Data is used to authenticate customers, reserve inventory, verify ownership and payment,
          issue booking information, provide support, and maintain service reliability.
        </p>
        <h2>Providers and storage</h2>
        <p>
          The current implementation uses Firebase authentication when configured, Redis for
          short-lived reservation state, and PostgreSQL for asynchronous event and booking
          persistence. The exact providers, retention periods, deletion process, privacy contact,
          cookies, analytics, and international transfers require owner and legal confirmation.
        </p>
        <h2>Your choices</h2>
        <p>
          Production launch must provide a verified privacy contact and documented processes for
          access, correction, deletion, and account closure. Do not use this draft as a substitute
          for approved legal terms.
        </p>
      </main>
    </div>
  );
}
