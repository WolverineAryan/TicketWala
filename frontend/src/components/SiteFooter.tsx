import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <Link href="/" className="site-footer-brand">
            TicketWala
          </Link>
          <p className="site-footer-copy">
            Real-time event reservations with atomic holds and server-verified booking state.
          </p>
        </div>
        <nav className="site-footer-links" aria-label="Footer">
          <Link href="/explore">Explore events</Link>
          <Link href="/organizer">Host an event</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} TicketWala</span>
        <span>FlashLock reservations · Redis Lua · asynchronous persistence</span>
      </div>
    </footer>
  );
}
