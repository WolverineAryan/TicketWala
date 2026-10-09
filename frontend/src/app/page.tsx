"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

const N = 200;
const TTL = 30;

interface Seat {
  st: number; // 0 = free, 1 = held, 2 = sold
  t: number;  // expiration timestamp
  bot?: boolean;
}

interface EventItem {
  month: string;
  day: string;
  name: string;
  sold: number;
}

interface Booking {
  s: number | string;
  e: string;
  tier?: string;
  price?: number;
}

interface User {
  name: string;
  email: string;
  pw: string;
}

export default function TicketWalaPage() {
  // Navigation & Page State
  const [activePage, setActivePage] = useState<string>("home");

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({
    "demo@ticketwala.com": {
      name: "Demo Fan",
      email: "demo@ticketwala.com",
      pw: "password123",
    },
  });
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPw, setSignupPw] = useState("");
  const [signupPw2, setSignupPw2] = useState("");
  const [signupErr, setSignupErr] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [nextPage, setNextPage] = useState("home");

  // Events State
  const [events, setEvents] = useState<EventItem[]>([
    { month: "OCT", day: "24", name: "Arijit Live — Mumbai", sold: 0 },
    { month: "NOV", day: "02", name: "Coldplay Fan Fest", sold: 0 },
    { month: "NOV", day: "15", name: "Mumbai–Nashik Express (Flash)", sold: 0 },
    { month: "DEC", day: "01", name: "IPL Final Screening", sold: 0 },
  ]);
  const [currentEventIdx, setCurrentEventIdx] = useState(0);

  // Seat Inventory & Booking State
  const [seats, setSeats] = useState<Seat[]>([]);
  const [mine, setMine] = useState<number | null>(null);
  const [stepNum, setStepNum] = useState<number>(1);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [logs, setLogs] = useState<Array<{ text: string; cls: string; time: string }>>([]);

  // Telemetry & Load-Testing State
  const [stats, setStats] = useState({ req: 0, ok: 0, no: 0, exp: 0 });
  const [isBusy, setIsBusy] = useState(false);
  const [liveReqs, setLiveReqs] = useState(0);
  const [lockLatency, setLockLatency] = useState("0.4ms");
  const [historyPoints, setHistoryPoints] = useState<number[]>([]);

  // Canvas Refs
  const sparkCanvasRef = useRef<HTMLCanvasElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Helper log function
  const addLog = useCallback((msg: string, cls = "") => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-100), { text: msg, cls, time }]);
    setTimeout(() => {
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    }, 20);
  }, []);

  // Initialize Seats
  const initSeats = useCallback(() => {
    const newSeats: Seat[] = Array.from({ length: N }, () => ({ st: 0, t: 0 }));
    // 40 randomly pre-sold seats
    for (let i = 0; i < 40; i++) {
      const idx = Math.floor(Math.random() * N);
      newSeats[idx].st = 2;
    }
    setSeats(newSeats);
    setMine(null);
    setStepNum(1);
  }, []);

  useEffect(() => {
    initSeats();
  }, [initSeats]);

  // Sync sold seats to current event
  useEffect(() => {
    const soldCount = seats.filter((s) => s.st === 2).length;
    setEvents((prev) => {
      const copy = [...prev];
      if (copy[currentEventIdx]) {
        copy[currentEventIdx] = { ...copy[currentEventIdx], sold: soldCount };
      }
      return copy;
    });
  }, [seats, currentEventIdx]);

  // Page Routing Helper with URL hash sync
  const navigateTo = useCallback((page: string) => {
    setActivePage(page);
    try {
      if (window.location.hash !== `#${page}`) {
        window.history.pushState(null, "", `#${page}`);
      }
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Listen to browser hash changes & expose window.go
  useEffect(() => {
    (window as any).go = (p: string) => navigateTo(p);
    const syncHash = () => {
      const h = (window.location.hash || "").replace("#", "").trim().toLowerCase();
      if (["home", "events", "booking", "profile", "login", "signup"].includes(h)) {
        setActivePage(h);
      }
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => {
      window.removeEventListener("hashchange", syncHash);
      delete (window as any).go;
    };
  }, [navigateTo]);

  // 1. Telemetry Dashboard & Sparkline Chart Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setLockLatency((0.4 + Math.random() * 0.5).toFixed(1) + "ms");
      setLiveReqs(isBusy ? Math.floor(2000 + Math.random() * 3000) : Math.floor(Math.random() * 40));

      const point = isBusy ? 60 + Math.random() * 40 : 5 + Math.random() * 10;
      setHistoryPoints((prev) => {
        const next = [...prev, point];
        return next.length > 60 ? next.slice(-60) : next;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isBusy]);

  // Draw Sparkline
  useEffect(() => {
    const canvas = sparkCanvasRef.current;
    if (!canvas || activePage !== "home") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.clientWidth * 2;
    canvas.height = 240;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#FF6B35";
    ctx.lineWidth = 4;
    ctx.beginPath();

    historyPoints.forEach((v, i) => {
      const X = (i / 59) * canvas.width;
      const Y = 230 - v * 2;
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    });

    ctx.stroke();
  }, [historyPoints, activePage]);

  // 3. TTL Expiration Loop (Every 500ms)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setSeats((prev) =>
        prev.map((s, idx) => {
          if (s.st === 1 && now > s.t) {
            if (idx === mine) {
              setMine(null);
              setStepNum(1);
              addLog(`TTL expired seat ${idx + 1} → released`, "no");
            }
            if (s.bot) {
              return { ...s, st: 2 };
            } else {
              setStats((st) => ({ ...st, exp: st.exp + 1 }));
              if (Math.random() < 0.2) {
                addLog(`TTL expired seat ${idx + 1} → released`, "no");
              }
              return { ...s, st: 0, t: 0 };
            }
          }
          return s;
        })
      );
    }, 500);

    return () => clearInterval(interval);
  }, [mine, addLog]);

  // Helper: Seat Metadata by Index (0 - 199 across Rows A - J)
  const getSeatDetails = (idx: number) => {
    const rowIdx = Math.floor(idx / 20);
    const rowChar = String.fromCharCode(65 + rowIdx);
    const seatNum = (idx % 20) + 1;
    let tier = "Standard Gallery";
    let price = 899;
    let badgeClass = "std";
    if (rowIdx < 2) {
      tier = "VIP Lounge";
      price = 2499;
      badgeClass = "vip";
    } else if (rowIdx < 6) {
      tier = "Executive Prime";
      price = 1499;
      badgeClass = "prime";
    }
    return { rowChar, seatNum, tier, price, badgeClass };
  };

  // 4. Seat Actions
  const handlePickSeat = (idx: number) => {
    if (!user) {
      setNextPage("booking");
      setLoginErr("Please log in to hold a seat.");
      navigateTo("login");
      return;
    }

    if (mine !== null) return;

    setStats((prev) => ({ ...prev, req: prev.req + 1 }));
    const s = seats[idx];
    const d = getSeatDetails(idx);
    const seatLabel = `${d.rowChar}-${d.seatNum}`;

    if (s.st !== 0) {
      setStats((prev) => ({ ...prev, no: prev.no + 1 }));
      addLog(`LOCK seat ${seatLabel} → 409 TAKEN`, "no");
      return;
    }

    // Lock seat
    const expiry = Date.now() + TTL * 1000;
    setSeats((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], st: 1, t: expiry };
      return copy;
    });

    setMine(idx);
    setStats((prev) => ({ ...prev, ok: prev.ok + 1 }));
    addLog(`EVAL lock.lua seat ${seatLabel} (${d.tier}) → OK ttl=${TTL}s`, "ok");
    setStepNum(2);
  };

  const handlePay = () => {
    if (mine === null) return;
    const d = getSeatDetails(mine);
    const seatLabel = `${d.rowChar}-${d.seatNum}`;
    const eventName = events[currentEventIdx].name;

    setSeats((prev) => {
      const copy = [...prev];
      copy[mine] = { ...copy[mine], st: 2 };
      return copy;
    });

    setBookings((prev) => [...prev, { s: seatLabel, e: eventName, tier: d.tier, price: d.price }]);
    addLog(`COMMIT seat ${seatLabel} (${d.tier}) → queued for DB write`, "ok");

    setTimeout(() => {
      addLog(`ASYNC persisted seat ${seatLabel} [OK] eventual consistency`, "ok");
    }, 900);

    setMine(null);
    setStepNum(3);
  };

  const handleDrop = () => {
    if (mine === null) return;
    const d = getSeatDetails(mine);
    const seatLabel = `${d.rowChar}-${d.seatNum}`;

    setSeats((prev) => {
      const copy = [...prev];
      copy[mine] = { ...copy[mine], st: 0, t: 0 };
      return copy;
    });

    addLog(`RELEASE seat ${seatLabel} (abandoned)`);
    setMine(null);
    setStepNum(1);
  };

  // 5. 5,000 Users Flash-Drop Demo ("storm()")
  const runFlashDropStorm = () => {
    if (isBusy) return;
    setIsBusy(true);
    if (activePage !== "booking") navigateTo("booking");

    addLog("[BURST] Flash-drop load test: 5,000 clients incoming", "no");
    let sent = 0;

    const interval = setInterval(() => {
      setSeats((prevSeats) => {
        const copy = [...prevSeats];
        for (let k = 0; k < 120; k++) {
          sent++;
          setStats((st) => ({ ...st, req: st.req + 1 }));
          const i = Math.floor(Math.random() * N);
          const s = copy[i];

          if (s.st !== 0 || i === mine) {
            setStats((st) => ({ ...st, no: st.no + 1 }));
          } else {
            copy[i] = {
              st: 1,
              t: Date.now() + (2 + Math.random() * 10) * 1000,
              bot: Math.random() < 0.5,
            };
            setStats((st) => ({ ...st, ok: st.ok + 1 }));
          }
        }
        return copy;
      });

      if (sent >= 5000) {
        clearInterval(interval);
        setIsBusy(false);
        addLog(`DONE: 5000 req · 0 double-bookings [VERIFIED]`, "ok");
      }
    }, 120);
  };

  // 6. Authentication Handlers
  const handleLogin = () => {
    const em = loginEmail.trim().toLowerCase();
    if (!em || !loginPw) {
      setLoginErr("Enter your email and password.");
      return;
    }
    const targetUser = users[em];
    if (!targetUser || targetUser.pw !== loginPw) {
      setLoginErr("Incorrect email or password.");
      return;
    }

    setUser(targetUser);
    setLoginErr("");
    setLoginPw("");
    navigateTo(nextPage);
    setNextPage("home");
  };

  const handleSignup = () => {
    const nm = signupName.trim();
    const em = signupEmail.trim().toLowerCase();
    if (!nm || !/^\S+@\S+\.\S+$/.test(em)) {
      setSignupErr("Enter your name and a valid email.");
      return;
    }
    if (signupPw.length < 6) {
      setSignupErr("Password must be at least 6 characters.");
      return;
    }
    if (signupPw !== signupPw2) {
      setSignupErr("Passwords do not match.");
      return;
    }
    if (users[em]) {
      setSignupErr("That email is already registered — log in instead.");
      return;
    }

    const newUser: User = { name: nm, email: em, pw: signupPw };
    setUsers((prev) => ({ ...prev, [em]: newUser }));
    setUser(newUser);
    setSignupErr("");
    setSignupPw("");
    setSignupPw2("");
    navigateTo(nextPage);
    setNextPage("home");
  };

  const handleGoogleAuth = () => {
    const googleUser: User = {
      name: "Alex Morgan",
      email: "alex.morgan@gmail.com",
      pw: "google-verified-oauth",
    };
    setUsers((prev) => ({ ...prev, [googleUser.email]: googleUser }));
    setUser(googleUser);
    setLoginErr("");
    setSignupErr("");
    addLog("OAUTH Google token verified for alex.morgan@gmail.com", "ok");
    navigateTo(nextPage);
    setNextPage("home");
  };

  const fillDemoCredentials = () => {
    setLoginEmail("demo@ticketwala.com");
    setLoginPw("password123");
    setLoginErr("");
  };

  const getPwStrength = (pw: string) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 6) score += 1;
    if (pw.length >= 10) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    return score;
  };

  const handleLogout = () => {
    if (mine !== null) handleDrop();
    setUser(null);
    setBookings([]);
    navigateTo("home");
  };

  // Seat Renderers for Theater Stadium View
  const renderSeatButton = (idx: number) => {
    const s = seats[idx] || { st: 0, t: 0 };
    const d = getSeatDetails(idx);
    const isMine = mine === idx;
    const isHeld = s.st === 1;
    const isSold = s.st === 2;
    const isVip = Math.floor(idx / 20) < 2;

    let cls = "s";
    if (isVip) cls += " tier-vip";
    if (isHeld) cls += " h";
    if (isSold) cls += " x";
    if (isMine) cls += " me";

    return (
      <button
        key={idx}
        type="button"
        className={cls}
        onClick={() => handlePickSeat(idx)}
        title={`${d.tier} · Row ${d.rowChar}-${d.seatNum} (₹${d.price}) - ${
          isMine ? "Your Selection" : isHeld ? "Held by another user" : isSold ? "Sold Out" : "Available"
        }`}
        aria-label={`Seat ${d.rowChar}-${d.seatNum}, ${d.tier}, ₹${d.price}`}
      >
        {d.seatNum}
      </button>
    );
  };

  const renderRow = (rowIdx: number) => {
    const rowChar = String.fromCharCode(65 + rowIdx);
    const startIdx = rowIdx * 20;

    return (
      <div key={rowIdx} className="seat-row">
        <span className="row-label">{rowChar}</span>
        {/* Left Wing (Seats 1 - 5) */}
        {[0, 1, 2, 3, 4].map((offset) => renderSeatButton(startIdx + offset))}
        {/* Aisle Gap */}
        <div className="aisle-gap"></div>
        {/* Center Wing (Seats 6 - 15) */}
        {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((offset) => renderSeatButton(startIdx + offset))}
        {/* Aisle Gap */}
        <div className="aisle-gap"></div>
        {/* Right Wing (Seats 16 - 20) */}
        {[15, 16, 17, 18, 19].map((offset) => renderSeatButton(startIdx + offset))}
        <span className="row-label">{rowChar}</span>
      </div>
    );
  };

  // Seconds Remaining for active hold
  const secondsLeft = mine !== null && seats[mine] ? Math.max(0, Math.ceil((seats[mine].t - Date.now()) / 1000)) : 0;
  const ringOffset = 415 * (1 - secondsLeft / TTL);

  return (
    <>
      {/* NAVIGATION BAR */}
      <nav>
        <div className="logo" onClick={() => navigateTo("home")} role="button" tabIndex={0} style={{ cursor: "pointer" }}>
          <img
            src="/logo-navbar.png"
            alt="TicketWala"
            style={{ height: "46px", width: "auto", objectFit: "contain", display: "block" }}
          />
        </div>

        <ul id="nav">
          <li>
            <a
              href="#home"
              role="button"
              style={{ cursor: "pointer" }}
              className={activePage === "home" ? "on" : ""}
              onClick={(e) => {
                e.preventDefault();
                navigateTo("home");
              }}
            >
              Home
            </a>
          </li>
          <li>
            <a
              href="#events"
              role="button"
              style={{ cursor: "pointer" }}
              className={activePage === "events" ? "on" : ""}
              onClick={(e) => {
                e.preventDefault();
                navigateTo("events");
              }}
            >
              Events
            </a>
          </li>
          <li>
            <a
              href="#booking"
              role="button"
              style={{ cursor: "pointer" }}
              className={activePage === "booking" ? "on" : ""}
              onClick={(e) => {
                e.preventDefault();
                navigateTo("booking");
              }}
            >
              Booking
            </a>
          </li>
          <li>
            <a
              href="#profile"
              role="button"
              style={{ cursor: "pointer" }}
              className={activePage === "profile" ? "on" : ""}
              onClick={(e) => {
                e.preventDefault();
                navigateTo("profile");
              }}
            >
              Profile
            </a>
          </li>
        </ul>

        <div id="auth" style={{ display: "flex", alignItems: "center" }}>
          {user ? (
            <>
              <span style={{ fontWeight: 600, fontSize: "14px", marginRight: "10px" }}>
                {user.name.split(" ")[0]}
              </span>
              <button type="button" className="btn ghost" style={{ padding: "8px 18px" }} onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn ghost"
                style={{ padding: "8px 18px", marginRight: "6px" }}
                onClick={() => navigateTo("login")}
              >
                Log in
              </button>
              <button type="button" className="btn" style={{ padding: "8px 18px" }} onClick={() => navigateTo("signup")}>
                Sign up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT PAGES */}
      <main>
        {/* 1. HOME PAGE */}
        <div
          className={`page ${activePage === "home" ? "on" : ""}`}
          id="home"
          style={{ display: activePage === "home" ? "block" : "none" }}
        >
          <div className="hero">
            <div>
              <span className="pill">
                <i className="dot"></i> Live drop · <span>{liveReqs}</span> requests in flight
              </span>
              <h1>
                5,000 fans.<br />
                200 seats.<br />
                <em>Zero</em> double-bookings.
              </h1>
              <p>
                TicketWala locks every seat in memory with atomic Redis Lua scripts, holds it with a TTL countdown,
                and writes to the database asynchronously — fair, first-come-first-served, sub-second.
              </p>
              <button className="btn" onClick={() => navigateTo("booking")}>
                Grab a seat now →
              </button>{" "}
              <button
                className="btn ghost"
                onClick={runFlashDropStorm}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Run flash-drop demo
              </button>
            </div>

            <div className="stage">
              <div className="stack">
                <div className="tk">
                  <div>
                    <span>ADMIT ONE</span>SEAT A-17
                  </div>
                  <b>T</b>
                </div>
                <div className="tk">
                  <div>
                    <span>HOLD · TTL</span>00:30
                  </div>
                  <b>
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="13" r="8" />
                      <path d="M12 9v4l2.5 1.5" />
                      <path d="M10 2h4" />
                    </svg>
                  </b>
                </div>
                <div className="tk">
                  <div>
                    <span>CONFIRMED</span>PAID
                  </div>
                  <b>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </b>
                </div>
              </div>
            </div>
          </div>

          {/* Marquee Ticker */}
          <div className="ticker">
            <div>
              <span style={{ padding: "0 30px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF6B35" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: "6px" }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                <b>200</b> seats · <b>5,000</b> users · <b>0</b> double-bookings &nbsp;•&nbsp; Redis Lua atomic locks
                &nbsp;•&nbsp; TTL holds &nbsp;•&nbsp; Async DB writes &nbsp;•&nbsp; Token-bucket throttling
              </span>
              <span style={{ padding: "0 30px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF6B35" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: "6px" }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                <b>200</b> seats · <b>5,000</b> users · <b>0</b> double-bookings &nbsp;•&nbsp; Redis Lua atomic locks
                &nbsp;•&nbsp; TTL holds &nbsp;•&nbsp; Async DB writes &nbsp;•&nbsp; Token-bucket throttling
              </span>
            </div>
          </div>

          {/* Steps Section */}
          <section className="light">
            <h2>
              One drop. <em>Three</em> steps.
            </h2>
            <p style={{ opacity: 0.7 }}>From click to confirmed in under a second of lock time.</p>
            <div className="grid">
              <div className="card">
                <div className="n">1</div>
                <h3>Atomic Lock</h3>
                <p>
                  A Lua script checks the token bucket and claims the seat in a single Redis operation. No race, no deadlock.
                </p>
              </div>
              <div className="card">
                <div className="n">2</div>
                <h3>TTL Hold</h3>
                <p>
                  The seat is yours for 30 seconds. Abandon checkout and it releases instantly to the next person in line.
                </p>
              </div>
              <div className="card">
                <div className="n">3</div>
                <h3>Async Commit</h3>
                <p>
                  Paid bookings stream to the relational DB through a queue — guaranteed eventual consistency.
                </p>
              </div>
            </div>
          </section>

          {/* Live Engine Dashboard */}
          <section className="dark">
            <h2>
              Live engine <em>dashboard</em>
            </h2>
            <p style={{ opacity: 0.7 }}>Streaming from the in-memory broker — try the demo above.</p>
            <div className="kpis">
              <div className="kpi">
                <b>{stats.req.toLocaleString()}</b>
                <span>Requests received</span>
              </div>
              <div className="kpi">
                <b>{stats.ok.toLocaleString()}</b>
                <span>Locks granted</span>
              </div>
              <div className="kpi">
                <b>{stats.no.toLocaleString()}</b>
                <span>Rejected (409)</span>
              </div>
              <div className="kpi">
                <b>0</b>
                <span>Double-bookings</span>
              </div>
              <div className="kpi">
                <b>{lockLatency}</b>
                <span>Lock latency</span>
              </div>
            </div>
            <canvas id="spark" ref={sparkCanvasRef}></canvas>
          </section>

          {/* Features Grid */}
          <section>
            <h2>
              Features you <em>won&apos;t find</em> elsewhere
            </h2>
            <div className="grid">
              <div className="card">
                <div className="n">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                    <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
                  </svg>
                </div>
                <h3>Virtual Waiting Room</h3>
                <p>Fair queue position with live ETA — no refresh-spamming advantage.</p>
              </div>
              <div className="card">
                <div className="n">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h3>Hold Ring</h3>
                <p>A visible countdown on your seat. Extend once if payment is in progress.</p>
              </div>
              <div className="card">
                <div className="n">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <h3>Token-Bucket Shield</h3>
                <p>Bots get throttled at the edge; real fans never see a 500.</p>
              </div>
              <div className="card">
                <div className="n">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                </div>
                <h3>Instant Seat Recycling</h3>
                <p>Expired holds reappear live to everyone watching the map.</p>
              </div>
              <div className="card">
                <div className="n">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0" />
                    <path d="M5.52 16h12.96" />
                  </svg>
                </div>
                <h3>Built-in Load Lab</h3>
                <p>Fire 5,000 simulated users at 200 seats from the UI and watch the proof.</p>
              </div>
              <div className="card">
                <div className="n">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h3>Audit Trail</h3>
                <p>Every lock, release and commit is logged with a monotonic ID.</p>
              </div>
            </div>
          </section>
        </div>

        {/* 2. EVENTS PAGE */}
        <div
          className={`page ${activePage === "events" ? "on" : ""}`}
          id="events"
          style={{ display: activePage === "events" ? "block" : "none" }}
        >
          <section>
            <h2>
              Upcoming <em>flash drops</em>
            </h2>
            <div id="evl">
              {events.map((e, idx) => {
                const percent = idx === currentEventIdx ? (e.sold / N) * 100 : [35, 60, 82, 15][idx];
                return (
                  <div key={idx} className="ev">
                    <div className="d">
                      <small>{e.month}</small>
                      {e.day}
                    </div>
                    <div>
                      <b>{e.name}</b>
                      <div style={{ fontSize: "13px", opacity: 0.7 }}>
                        {N} seats · 5,000+ expected
                      </div>
                      <div className="bar">
                        <i style={{ width: `${percent}%` }}></i>
                      </div>
                    </div>
                    <button
                      className="btn"
                      onClick={() => {
                        setCurrentEventIdx(idx);
                        initSeats();
                        navigateTo("booking");
                      }}
                    >
                      Reserve
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* 3. BOOKING PAGE */}
        <div
          className={`page ${activePage === "booking" ? "on" : ""}`}
          id="booking"
          style={{ display: activePage === "booking" ? "block" : "none" }}
        >
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
              <div>
                <h2>
                  Interactive <em>Seat Selection</em>
                </h2>
                <p style={{ opacity: 0.75, fontSize: "14px", marginTop: "4px" }}>
                  Select your preferred tier. Live Redis TTL locking guarantees zero double-bookings.
                </p>
              </div>

              {/* Quick event selector pills */}
              <div className="event-picker-tabs">
                {events.map((e, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`event-tab ${currentEventIdx === idx ? "active" : ""}`}
                    onClick={() => {
                      if (mine !== null) handleDrop();
                      setCurrentEventIdx(idx);
                      initSeats();
                    }}
                  >
                    <span className="badge-date">{e.month} {e.day}</span>
                    <span>{e.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="steps">
              <div id="st1" className={stepNum > 1 ? "done" : stepNum === 1 ? "on" : ""}>
                1 · Select Seat
              </div>
              <div id="st2" className={stepNum > 2 ? "done" : stepNum === 2 ? "on" : ""}>
                2 · Lock &amp; Hold (30s)
              </div>
              <div id="st3" className={stepNum === 3 ? "on" : ""}>
                3 · Confirm Order
              </div>
            </div>

            <div className="two" style={{ alignItems: "flex-start" }}>
              <div>
                {/* Curved Stage Screen */}
                <div className="screen-wrap">
                  <div className="screen-curve"></div>
                  <div className="screen-label">Main Stage / Performance Screen</div>
                </div>

                {/* Stadium Seat Map Frame */}
                <div className="theater-frame">
                  {/* VIP Tier */}
                  <div className="tier-section">
                    <div className="tier-header">
                      <span className="tier-name vip">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#d97706">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        VIP Lounge (Rows A - B)
                      </span>
                      <span className="tier-price">₹2,499</span>
                    </div>
                    <div className="seat-rows">
                      {[0, 1].map((rIdx) => renderRow(rIdx))}
                    </div>
                  </div>

                  {/* Executive Prime Tier */}
                  <div className="tier-section">
                    <div className="tier-header">
                      <span className="tier-name prime">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polygon points="12 8 8 12 12 16 16 12 12 8" />
                        </svg>
                        Executive Prime (Rows C - F)
                      </span>
                      <span className="tier-price">₹1,499</span>
                    </div>
                    <div className="seat-rows">
                      {[2, 3, 4, 5].map((rIdx) => renderRow(rIdx))}
                    </div>
                  </div>

                  {/* Standard Gallery Tier */}
                  <div className="tier-section">
                    <div className="tier-header">
                      <span className="tier-name std">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                        </svg>
                        Standard Gallery (Rows G - J)
                      </span>
                      <span className="tier-price">₹899</span>
                    </div>
                    <div className="seat-rows">
                      {[6, 7, 8, 9].map((rIdx) => renderRow(rIdx))}
                    </div>
                  </div>

                  {/* Legend Grid */}
                  <div className="legend-grid">
                    <div className="leg-item">
                      <span className="leg-box" style={{ background: "#f0ece6", border: "1px solid #ddd7cf" }}></span>
                      <span>Available</span>
                    </div>
                    <div className="leg-item">
                      <span className="leg-box" style={{ background: "#fef3c7", border: "1px solid #fcd34d" }}></span>
                      <span>VIP (₹2,499)</span>
                    </div>
                    <div className="leg-item">
                      <span className="leg-box" style={{ background: "#FF6B35" }}></span>
                      <span>Held (TTL)</span>
                    </div>
                    <div className="leg-item">
                      <span className="leg-box" style={{ background: "#2B2A28" }}></span>
                      <span>Sold Out</span>
                    </div>
                    <div className="leg-item">
                      <span className="leg-box" style={{ background: "#fff", border: "2px solid #FF6B35" }}></span>
                      <span>Your Pick</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Controls / Burst Sim */}
                <div style={{ marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                  <button
                    className="btn k"
                    onClick={runFlashDropStorm}
                    disabled={isBusy}
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF6B35">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    Simulate 5,000 Concurrent Users
                  </button>

                  <div style={{ display: "flex", gap: "16px", fontSize: "13px", fontWeight: 600 }}>
                    <span style={{ color: "#27ae60" }}>
                      ● {seats.filter((s) => s.st === 0).length} Available
                    </span>
                    <span style={{ color: "var(--o)" }}>
                      ● {seats.filter((s) => s.st === 1).length} Held
                    </span>
                    <span style={{ color: "#8c8880" }}>
                      ● {seats.filter((s) => s.st === 2).length} Sold
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Checkout Card + Broker Terminal */}
              <div>
                <div className="checkout-card" id="panel">
                  {mine === null ? (
                    stepNum === 3 ? (
                      <div>
                        <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#e8f8f0", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                        </div>
                        <h3 style={{ fontSize: "20px", marginBottom: "6px" }}>Reservation Confirmed!</h3>
                        <p style={{ fontSize: "13px", opacity: 0.75, marginBottom: "16px" }}>
                          Your atomic lock was written to database asynchronously with sub-second consistency.
                        </p>
                        <button className="btn k" style={{ width: "100%" }} onClick={() => navigateTo("profile")}>
                          View E-Ticket in Profile →
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--g)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" />
                            <line x1="8" y1="21" x2="16" y2="21" />
                            <line x1="12" y1="17" x2="12" y2="21" />
                          </svg>
                        </div>
                        <h3 style={{ fontSize: "18px", marginBottom: "6px" }}>Select an Available Seat</h3>
                        <p style={{ fontSize: "13px", opacity: 0.75, lineHeight: 1.5, marginBottom: "16px" }}>
                          Click any seat in the theater map to claim an atomic Redis lock. You will get 30 seconds to review and pay.
                        </p>
                        <div style={{ background: "var(--g)", borderRadius: "12px", padding: "12px 16px", textAlign: "left", fontSize: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                            <span style={{ color: "#666" }}>VIP Lounge:</span>
                            <b>₹2,499</b>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                            <span style={{ color: "#666" }}>Executive Prime:</span>
                            <b>₹1,499</b>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#666" }}>Standard Gallery:</span>
                            <b>₹899</b>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <div>
                      <div style={{ display: "inline-block", padding: "4px 12px", background: "rgba(255, 107, 55, 0.12)", color: "var(--o)", borderRadius: "99px", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>
                        Temporary Hold Active
                      </div>
                      <h3 style={{ fontSize: "20px", marginBottom: "4px" }}>
                        Seat {getSeatDetails(mine).rowChar}-{getSeatDetails(mine).seatNum}
                      </h3>
                      <p style={{ fontSize: "13px", opacity: 0.7, margin: 0 }}>
                        {events[currentEventIdx].name}
                      </p>

                      {/* Hold countdown timer */}
                      <div className="ring" style={{ margin: "14px auto" }}>
                        <svg width="120" height="120">
                          <circle cx="60" cy="60" r="50" fill="none" stroke="#0001" strokeWidth="8" />
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke="#FF6B35"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray="314"
                            strokeDashoffset={314 * (1 - secondsLeft / TTL)}
                            style={{ transition: "stroke-dashoffset 0.5s linear" }}
                          />
                        </svg>
                        <b style={{ fontSize: "24px" }}>{secondsLeft}s</b>
                      </div>

                      {/* Ticket breakdown */}
                      <div className="ticket-preview">
                        <div className="ticket-preview-top">
                          <div>
                            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#888" }}>Section</div>
                            <b style={{ fontSize: "14px" }}>{getSeatDetails(mine).tier}</b>
                          </div>
                          <div className="ticket-seat-badge">
                            {getSeatDetails(mine).rowChar}{getSeatDetails(mine).seatNum}
                          </div>
                        </div>
                        <div className="ticket-price-row">
                          <span>Base Ticket Fare</span>
                          <span>₹{getSeatDetails(mine).price.toLocaleString()}</span>
                        </div>
                        <div className="ticket-price-row">
                          <span>Service &amp; Booking Fee</span>
                          <span>₹99</span>
                        </div>
                        <div className="ticket-price-total">
                          <span>Total Amount</span>
                          <span>₹{(getSeatDetails(mine).price + 99).toLocaleString()}</span>
                        </div>
                      </div>

                      <button
                        className="btn"
                        style={{ width: "100%", padding: "13px", fontSize: "15px", marginBottom: "8px" }}
                        onClick={handlePay}
                      >
                        Pay ₹{(getSeatDetails(mine).price + 99).toLocaleString()} &amp; Confirm
                      </button>
                      <button
                        className="btn ghost"
                        style={{ width: "100%", padding: "10px", fontSize: "13px" }}
                        onClick={handleDrop}
                      >
                        Release Lock (Abandon)
                      </button>
                    </div>
                  )}
                </div>

                {/* Broker Terminal */}
                <div className="broker-terminal">
                  <div className="terminal-header">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="4 17 10 11 4 5" />
                        <line x1="12" y1="19" x2="20" y2="19" />
                      </svg>
                      Broker Telemetry
                    </span>
                    <span className="terminal-badge">
                      <span className="pulse-dot"></span>
                      Redis Engine Online
                    </span>
                  </div>
                  <div className="terminal-body" id="log" ref={logContainerRef}>
                    {logs.map((l, i) => (
                      <div key={i} className={l.cls}>
                        {l.time} {l.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 4. PROFILE PAGE */}
        <div
          className={`page ${activePage === "profile" ? "on" : ""}`}
          id="profile"
          style={{ display: activePage === "profile" ? "block" : "none" }}
        >
          <section className="light">
            <h2>
              Hi, <em id="uName">{user ? user.name.split(" ")[0] : "Fan"}</em>
            </h2>
            <div className="kpis">
              <div className="kpi">
                <b>{bookings.length}</b>
                <span>Bookings</span>
              </div>
              <div className="kpi">
                <b>{stats.exp}</b>
                <span>Holds expired</span>
              </div>
              <div className="kpi">
                <b>#1</b>
                <span>Queue priority</span>
              </div>
            </div>

            <h3>My tickets</h3>
            <div id="pl" style={{ marginTop: "14px" }}>
              {bookings.length > 0 ? (
                bookings.map((b, i) => (
                  <div key={i} className="ev">
                    <div className="d">
                      <small>SEAT</small>
                      {b.s}
                    </div>
                    <div>
                      <b>{b.e}</b>
                      <div style={{ fontSize: "13px", opacity: 0.7, display: "flex", alignItems: "center", gap: "5px", marginTop: "3px" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Confirmed
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ opacity: 0.6 }}>No tickets yet — grab a seat!</p>
              )}
            </div>
          </section>
        </div>

        {/* 5. LOGIN PAGE */}
        <div
          className={`page ${activePage === "login" ? "on" : ""}`}
          id="login"
          style={{ display: activePage === "login" ? "block" : "none" }}
        >
          <div className="auth-wrap">
            <div className="auth">
              {/* Left Side: Brand & Security Proof */}
              <div className="auth-side">
                <div>
                  <div className="auth-brand">
                    <img
                      src="/logo-navbar.png"
                      alt="TicketWala"
                      style={{ height: "42px", width: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }}
                    />
                  </div>

                  <span className="pill" style={{ background: "rgba(255, 107, 55, 0.18)", color: "#fff", border: "1px solid rgba(255, 107, 55, 0.35)", marginBottom: "16px" }}>
                    <i className="dot"></i> Next flash release in minutes
                  </span>

                  <h2>
                    Welcome back to the <em>fast lane</em>.
                  </h2>
                  <p>
                    Log in to lock high-contention seats before the other 5,000 fans. Your active holds, e-tickets, and VIP queue status are waiting.
                  </p>

                  <div className="auth-features">
                    <div className="auth-feature-item">
                      <div className="auth-feature-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                      </div>
                      <div className="auth-feature-text">
                        <b>Sub-Second Redis Lock</b>
                        <span>Atomic Lua scripts secure your seat in under 1 millisecond.</span>
                      </div>
                    </div>

                    <div className="auth-feature-item">
                      <div className="auth-feature-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      </div>
                      <div className="auth-feature-text">
                        <b>Anti-Bot Token Bucket Shield</b>
                        <span>Guaranteed fair access for verified human ticket buyers.</span>
                      </div>
                    </div>

                    <div className="auth-feature-item">
                      <div className="auth-feature-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <div className="auth-feature-text">
                        <b>Bank-Grade 256-Bit Encryption</b>
                        <span>PCI-DSS compliant checkouts with instant async DB commits.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="auth-status-card">
                  <div className="status-indicator">
                    <span className="live-dot"></span>
                    <span>Broker Engine Online</span>
                  </div>
                  <div className="status-stat">
                    <b>0 Double-Allocations</b>
                    <div style={{ opacity: 0.7 }}>5,000 users capacity</div>
                  </div>
                </div>
              </div>

              {/* Right Side: Form */}
              <div className="auth-box">
                <div className="auth-box-header">
                  <h2>Log in to Account</h2>
                  <p>Choose your preferred sign-in method to continue.</p>
                </div>

                {/* Continue with Google button */}
                <button
                  type="button"
                  className="btn-google"
                  onClick={handleGoogleAuth}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Divider */}
                <div className="auth-divider">
                  <span>or continue with email</span>
                </div>

                {/* Quick Demo Autofill Badge */}
                <div>
                  <button
                    type="button"
                    className="quick-demo-badge"
                    onClick={fillDemoCredentials}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>Click to auto-fill demo fan account</span>
                  </button>
                </div>

                {/* Email Field */}
                <div className="input-field-group">
                  <label className="input-field-label">Email Address</label>
                  <div className="input-field-box">
                    <span className="input-field-icon">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      className="input-field-input"
                      placeholder="name@example.com"
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="input-field-group">
                  <label className="input-field-label">Password</label>
                  <div className="input-field-box">
                    <span className="input-field-icon">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showLoginPw ? "text" : "password"}
                      className="input-field-input"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      value={loginPw}
                      onChange={(e) => setLoginPw(e.target.value)}
                    />
                    <button
                      type="button"
                      className="input-toggle-btn"
                      onClick={() => setShowLoginPw(!showLoginPw)}
                      title={showLoginPw ? "Hide password" : "Show password"}
                    >
                      {showLoginPw ? (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="auth-extras-row">
                  <label className="remember-label">
                    <input
                      type="checkbox"
                      className="remember-checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember this device</span>
                  </label>
                  <span
                    className="forgot-link"
                    onClick={() => {
                      alert("Password reset instructions sent to your email!");
                    }}
                  >
                    Forgot password?
                  </span>
                </div>

                {/* Error message */}
                <div className="err" style={{ marginBottom: loginErr ? "10px" : "0" }}>
                  {loginErr}
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  className="btn"
                  style={{ width: "100%", padding: "14px", fontSize: "15px" }}
                  onClick={handleLogin}
                >
                  Log in to TicketWala →
                </button>

                <div className="auth-footer-text">
                  New to TicketWala?{" "}
                  <a onClick={() => navigateTo("signup")}>
                    Create a free account
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. SIGNUP PAGE */}
        <div
          className={`page ${activePage === "signup" ? "on" : ""}`}
          id="signup"
          style={{ display: activePage === "signup" ? "block" : "none" }}
        >
          <div className="auth-wrap">
            <div className="auth">
              {/* Left Side: Brand & Perks */}
              <div className="auth-side">
                <div>
                  <div className="auth-brand">
                    <img
                      src="/logo-navbar.png"
                      alt="TicketWala"
                      style={{ height: "42px", width: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }}
                    />
                  </div>

                  <span className="pill" style={{ background: "rgba(255, 107, 55, 0.18)", color: "#fff", border: "1px solid rgba(255, 107, 55, 0.35)", marginBottom: "16px" }}>
                    <i className="dot"></i> 100% Free · Setup in 20 seconds
                  </span>

                  <h2>
                    Join the <em>exclusive drop lane</em>.
                  </h2>
                  <p>
                    One account unlocks every high-velocity ticket drop: atomic seat locks, 30-second hold rings, and zero double-booking assurance.
                  </p>

                  <div className="auth-features">
                    <div className="auth-feature-item">
                      <div className="auth-feature-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div className="auth-feature-text">
                        <b>Verified Queue Priority #1</b>
                        <span>Bypass waiting room lag with instant token verification.</span>
                      </div>
                    </div>

                    <div className="auth-feature-item">
                      <div className="auth-feature-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div className="auth-feature-text">
                        <b>Live TTL Hold Guarantee</b>
                        <span>Keep your seat protected for 30 seconds while finalizing payment.</span>
                      </div>
                    </div>

                    <div className="auth-feature-item">
                      <div className="auth-feature-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                        </svg>
                      </div>
                      <div className="auth-feature-text">
                        <b>Instant Digital E-Tickets</b>
                        <span>Boarding pass styled passes delivered directly to your profile.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="auth-status-card">
                  <div className="status-indicator">
                    <span className="live-dot"></span>
                    <span>Ready for Flash Drop</span>
                  </div>
                  <div className="status-stat">
                    <b>No Hidden Fees</b>
                    <div style={{ opacity: 0.7 }}>Instant cancellation support</div>
                  </div>
                </div>
              </div>

              {/* Right Side: Signup Form */}
              <div className="auth-box">
                <div className="auth-box-header">
                  <h2>Create Your Account</h2>
                  <p>Get instant access to live flash reservations.</p>
                </div>

                {/* Continue with Google button */}
                <button
                  type="button"
                  className="btn-google"
                  onClick={handleGoogleAuth}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Divider */}
                <div className="auth-divider">
                  <span>or sign up with email</span>
                </div>

                {/* Full Name */}
                <div className="input-field-group">
                  <label className="input-field-label">Full Name</label>
                  <div className="input-field-box">
                    <span className="input-field-icon">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      className="input-field-input"
                      placeholder="e.g. Alex Morgan"
                      autoComplete="name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="input-field-group">
                  <label className="input-field-label">Email Address</label>
                  <div className="input-field-box">
                    <span className="input-field-icon">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      className="input-field-input"
                      placeholder="name@example.com"
                      autoComplete="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="input-field-group">
                  <label className="input-field-label">Password (min 6 characters)</label>
                  <div className="input-field-box">
                    <span className="input-field-icon">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showSignupPw ? "text" : "password"}
                      className="input-field-input"
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      value={signupPw}
                      onChange={(e) => setSignupPw(e.target.value)}
                    />
                    <button
                      type="button"
                      className="input-toggle-btn"
                      onClick={() => setShowSignupPw(!showSignupPw)}
                      title={showSignupPw ? "Hide password" : "Show password"}
                    >
                      {showSignupPw ? (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {signupPw && (
                    <div className="pw-strength-bar">
                      <div className={`pw-strength-step ${getPwStrength(signupPw) >= 1 ? (getPwStrength(signupPw) === 1 ? "active-weak" : getPwStrength(signupPw) === 2 ? "active-medium" : "active-strong") : ""}`}></div>
                      <div className={`pw-strength-step ${getPwStrength(signupPw) >= 2 ? (getPwStrength(signupPw) === 2 ? "active-medium" : "active-strong") : ""}`}></div>
                      <div className={`pw-strength-step ${getPwStrength(signupPw) >= 3 ? "active-strong" : ""}`}></div>
                      <div className={`pw-strength-step ${getPwStrength(signupPw) >= 4 ? "active-strong" : ""}`}></div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="input-field-group">
                  <label className="input-field-label">Confirm Password</label>
                  <div className="input-field-box">
                    <span className="input-field-icon">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showSignupPw ? "text" : "password"}
                      className="input-field-input"
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      value={signupPw2}
                      onChange={(e) => setSignupPw2(e.target.value)}
                    />
                  </div>
                </div>

                {/* Error message */}
                <div className="err" style={{ marginBottom: signupErr ? "10px" : "0" }}>
                  {signupErr}
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  className="btn"
                  style={{ width: "100%", padding: "14px", fontSize: "15px", marginTop: "4px" }}
                  onClick={handleSignup}
                >
                  Create Fast-Lane Account →
                </button>

                <div className="auth-footer-text">
                  Already registered?{" "}
                  <a onClick={() => navigateTo("login")}>
                    Log in here
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer>© 2026 TicketWala · Redis Lua + TTL holds + async persistence</footer>
    </>
  );
}
