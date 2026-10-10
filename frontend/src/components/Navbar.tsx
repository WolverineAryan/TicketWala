"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LogOut, Menu, PlusCircle, Ticket, X } from "lucide-react";
import { auth, logOut, signInWithGoogle } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!auth) {
      const stored = localStorage.getItem("tw_user");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {
          localStorage.removeItem("tw_user");
        }
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        let existing: Record<string, unknown> = {};
        try {
          const stored = localStorage.getItem("tw_user");
          if (stored) existing = JSON.parse(stored);
        } catch {
          existing = {};
        }
        localStorage.setItem("tw_user", JSON.stringify({
          ...existing,
          displayName: user.displayName || existing.displayName,
          email: user.email,
          photoURL: user.photoURL || existing.photoURL,
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const { user, error } = await signInWithGoogle();
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("tw_user", JSON.stringify({
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      }));
    } else if (error) {
      alert(`Sign in: ${error}`);
    }
  };

  const handleSignOut = async () => {
    await logOut();
    setCurrentUser(null);
    localStorage.removeItem("tw_user");
  };

  const isActive = (path: string) => pathname === path || (path === "/home" && pathname === "/explore");

  return (
    <header className="site-navbar">
      <div className="site-navbar-inner">
        <Link href="/" className="site-navbar-brand" aria-label="TicketWala home">
          <span className="site-navbar-mark"><Ticket size={18} /></span>
          <span className="site-navbar-name">TicketWala<span>Live</span></span>
        </Link>

        <nav className="site-navbar-links" aria-label="Primary navigation">
          <Link href="/home" className={isActive("/home") ? "is-active" : ""}>Explore</Link>
          <Link href="/profile" className={isActive("/profile") ? "is-active" : ""}>My Bookings</Link>
          <Link href="/organizer" className={`site-navbar-host ${pathname.startsWith("/organizer") ? "is-active" : ""}`}>
            <PlusCircle size={15} /> Host Event
          </Link>
          {currentUser ? (
            <button type="button" className="site-navbar-auth site-navbar-signout" onClick={handleSignOut} title="Sign out">
              <LogOut size={15} /> Sign Out
            </button>
          ) : (
            <button type="button" className="site-navbar-auth" onClick={handleSignIn}>
              <LogIn size={15} /> Sign In
            </button>
          )}
        </nav>

        <button
          type="button"
          className="site-navbar-menu"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <nav className="site-navbar-mobile" aria-label="Mobile navigation">
          <Link href="/home" onClick={() => setMobileMenuOpen(false)}>Explore</Link>
          <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>My Bookings</Link>
          <Link href="/organizer" onClick={() => setMobileMenuOpen(false)}>Host an Event</Link>
          <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
          <Link href="/privacy" onClick={() => setMobileMenuOpen(false)}>Privacy</Link>
          <Link href="/terms" onClick={() => setMobileMenuOpen(false)}>Terms</Link>
          {currentUser ? (
            <button type="button" className="site-navbar-auth site-navbar-signout" onClick={handleSignOut}>
              <LogOut size={15} /> Sign Out
            </button>
          ) : (
            <button type="button" className="site-navbar-auth" onClick={handleSignIn}>
              <LogIn size={15} /> Sign In
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
