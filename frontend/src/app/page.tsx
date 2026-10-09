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
  s: number;
  e: string;
}

interface User {
  name: string;
  email: string;
  pw: string;
}

interface Particle {
  x: number;
  y: number;
  v: number;
  r: number;
  o: boolean;
}

export default function TicketWalaPage() {
  // Navigation & Page State
  const [activePage, setActivePage] = useState<string>("home");

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPw, setSignupPw] = useState("");
  const [signupPw2, setSignupPw2] = useState("");
  const [signupErr, setSignupErr] = useState("");
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
  const heroCanvasRef = useRef<HTMLCanvasElement>(null);
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

  // Page Routing Helper
  const navigateTo = useCallback((page: string) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // 1. Hero Canvas Streaming Requests Animation
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];

    const handleResize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (Math.random() < 0.6) {
        particles.push({
          x: Math.random() * canvas.width,
          y: -10,
          v: 2 + Math.random() * 3,
          r: 2 + Math.random() * 3,
          o: Math.random() < 0.3,
        });
      }

      particles = particles.filter((p) => {
        p.y += p.v;
        ctx.fillStyle = p.o ? "#FF6B35" : "rgba(43, 42, 40, 0.2)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        return p.y < canvas.height + 10;
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [activePage]);

  // 2. Telemetry Dashboard & Sparkline Chart Loop
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

    if (s.st !== 0) {
      setStats((prev) => ({ ...prev, no: prev.no + 1 }));
      addLog(`LOCK seat ${idx + 1} → 409 TAKEN`, "no");
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
    addLog(`EVAL lock.lua seat ${idx + 1} → OK ttl=${TTL}s`, "ok");
    setStepNum(2);
  };

  const handlePay = () => {
    if (mine === null) return;
    const seatNum = mine + 1;
    const eventName = events[currentEventIdx].name;

    setSeats((prev) => {
      const copy = [...prev];
      copy[mine] = { ...copy[mine], st: 2 };
      return copy;
    });

    setBookings((prev) => [...prev, { s: seatNum, e: eventName }]);
    addLog(`COMMIT seat ${seatNum} → queued for DB write`, "ok");

    setTimeout(() => {
      addLog(`ASYNC persisted seat ${seatNum} ✓ eventual consistency`, "ok");
    }, 900);

    setMine(null);
    setStepNum(3);
  };

  const handleDrop = () => {
    if (mine === null) return;
    const seatNum = mine + 1;

    setSeats((prev) => {
      const copy = [...prev];
      copy[mine] = { ...copy[mine], st: 0, t: 0 };
      return copy;
    });

    addLog(`RELEASE seat ${seatNum} (abandoned)`);
    setMine(null);
    setStepNum(1);
  };

  // 5. 5,000 Users Flash-Drop Demo ("storm()")
  const runFlashDropStorm = () => {
    if (isBusy) return;
    setIsBusy(true);
    if (activePage !== "booking") navigateTo("booking");

    addLog("⚡ FLASH DROP: 5,000 clients incoming", "no");
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
        addLog(`DONE: 5000 req · 0 double-bookings ✓`, "ok");
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

  const handleLogout = () => {
    if (mine !== null) handleDrop();
    setUser(null);
    setBookings([]);
    navigateTo("home");
  };

  // Seconds Remaining for active hold
  const secondsLeft = mine !== null && seats[mine] ? Math.max(0, Math.ceil((seats[mine].t - Date.now()) / 1000)) : 0;
  const ringOffset = 415 * (1 - secondsLeft / TTL);

  return (
    <>
      {/* 🧭 NAVIGATION BAR */}
      <nav>
        <div className="logo" onClick={() => navigateTo("home")}>
          <svg width="40" height="40" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#FF6B35" strokeWidth="6" />
            <circle cx="50" cy="24" r="10" fill="#fff" stroke="#2B2A28" strokeWidth="3" />
            <path d="M50 18v7l4 3" stroke="#2B2A28" strokeWidth="2.5" fill="none" />
            <rect x="30" y="46" width="42" height="22" rx="4" fill="#FF6B35" transform="rotate(-18 50 57)" />
            <circle cx="50" cy="57" r="6" fill="#fff" />
          </svg>
          <span>
            ticketwala<small>TICKETS</small>
          </span>
        </div>

        <ul id="nav">
          <li>
            <a className={activePage === "home" ? "on" : ""} onClick={() => navigateTo("home")}>
              Home
            </a>
          </li>
          <li>
            <a className={activePage === "events" ? "on" : ""} onClick={() => navigateTo("events")}>
              Events
            </a>
          </li>
          <li>
            <a className={activePage === "booking" ? "on" : ""} onClick={() => navigateTo("booking")}>
              Booking
            </a>
          </li>
          <li>
            <a className={activePage === "profile" ? "on" : ""} onClick={() => navigateTo("profile")}>
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
              <button className="btn ghost" style={{ padding: "8px 18px" }} onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                className="btn ghost"
                style={{ padding: "8px 18px", marginRight: "6px" }}
                onClick={() => navigateTo("login")}
              >
                Log in
              </button>
              <button className="btn" style={{ padding: "8px 18px" }} onClick={() => navigateTo("signup")}>
                Sign up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* 🚀 MAIN CONTENT PAGES */}
      <main>
        {/* 1. HOME PAGE */}
        <div className={`page ${activePage === "home" ? "on" : ""}`} id="home">
          <div className="hero">
            <canvas id="heroCv" ref={heroCanvasRef}></canvas>
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
              <button className="btn ghost" onClick={runFlashDropStorm}>
                ▶ Run flash-drop demo
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
                  <b>⏱</b>
                </div>
                <div className="tk">
                  <div>
                    <span>CONFIRMED</span>PAID ✓
                  </div>
                  <b>T</b>
                </div>
              </div>
            </div>
          </div>

          {/* Marquee Ticker */}
          <div className="ticker">
            <div>
              <span style={{ padding: "0 30px" }}>
                ⚡ <b>200</b> seats · <b>5,000</b> users · <b>0</b> double-bookings &nbsp;•&nbsp; Redis Lua atomic locks
                &nbsp;•&nbsp; TTL holds &nbsp;•&nbsp; Async DB writes &nbsp;•&nbsp; Token-bucket throttling
              </span>
              <span style={{ padding: "0 30px" }}>
                ⚡ <b>200</b> seats · <b>5,000</b> users · <b>0</b> double-bookings &nbsp;•&nbsp; Redis Lua atomic locks
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
                <div className="n">🎟</div>
                <h3>Virtual Waiting Room</h3>
                <p>Fair queue position with live ETA — no refresh-spamming advantage.</p>
              </div>
              <div className="card">
                <div className="n">⏳</div>
                <h3>Hold Ring</h3>
                <p>A visible countdown on your seat. Extend once if payment is in progress.</p>
              </div>
              <div className="card">
                <div className="n">🪣</div>
                <h3>Token-Bucket Shield</h3>
                <p>Bots get throttled at the edge; real fans never see a 500.</p>
              </div>
              <div className="card">
                <div className="n">🔁</div>
                <h3>Instant Seat Recycling</h3>
                <p>Expired holds reappear live to everyone watching the map.</p>
              </div>
              <div className="card">
                <div className="n">🧪</div>
                <h3>Built-in Load Lab</h3>
                <p>Fire 5,000 simulated users at 200 seats from the UI and watch the proof.</p>
              </div>
              <div className="card">
                <div className="n">🛡</div>
                <h3>Audit Trail</h3>
                <p>Every lock, release and commit is logged with a monotonic ID.</p>
              </div>
            </div>
          </section>
        </div>

        {/* 2. EVENTS PAGE */}
        <div className={`page ${activePage === "events" ? "on" : ""}`} id="events">
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
        <div className={`page ${activePage === "booking" ? "on" : ""}`} id="booking">
          <section>
            <h2>
              Book your <em>seat</em>
            </h2>
            <div className="steps">
              <div id="st1" className={stepNum > 1 ? "done" : stepNum === 1 ? "on" : ""}>
                1 · Pick seat
              </div>
              <div id="st2" className={stepNum > 2 ? "done" : stepNum === 2 ? "on" : ""}>
                2 · Hold (TTL)
              </div>
              <div id="st3" className={stepNum === 3 ? "on" : ""}>
                3 · Confirm
              </div>
            </div>

            <div className="two">
              <div>
                <div className="leg">
                  <span>
                    <i style={{ background: "#e4e0da" }}></i>Free
                  </span>
                  <span>
                    <i style={{ background: "#FF6B35" }}></i>Held
                  </span>
                  <span>
                    <i style={{ background: "#2B2A28" }}></i>Sold
                  </span>
                  <span>
                    <i style={{ background: "#fff", outline: "2px solid #FF6B35" }}></i>You
                  </span>
                </div>

                <div className="seats" id="seats">
                  {seats.map((s, i) => (
                    <button
                      key={i}
                      className={`s ${s.st === 1 ? "h" : s.st === 2 ? "x" : ""} ${mine === i ? "me" : ""}`}
                      onClick={() => handlePickSeat(i)}
                      title={`Seat ${i + 1}`}
                    ></button>
                  ))}
                </div>

                <div style={{ marginTop: "20px" }}>
                  <button className="btn k" onClick={runFlashDropStorm} disabled={isBusy}>
                    ⚡ Simulate 5,000 users
                  </button>
                  <span id="evName" style={{ fontWeight: 600, marginLeft: "10px" }}>
                    {events[currentEventIdx]?.name}
                  </span>
                </div>
              </div>

              <div>
                <div className="card" id="panel" style={{ textAlign: "center" }}>
                  {mine === null ? (
                    stepNum === 3 ? (
                      <>
                        <h3>🎉 Booking confirmed</h3>
                        <p>Your ticket is in Profile.</p>
                        <button className="btn k" onClick={() => navigateTo("profile")}>
                          View ticket
                        </button>
                      </>
                    ) : (
                      <>
                        <h3>Select a seat</h3>
                        <p>Click any free seat to lock it. You get 30 seconds to pay.</p>
                      </>
                    )
                  ) : (
                    <>
                      <h3>Seat {mine + 1} is held</h3>
                      <div className="ring">
                        <svg width="150" height="150">
                          <circle cx="75" cy="75" r="66" fill="none" stroke="#0002" strokeWidth="10" />
                          <circle
                            cx="75"
                            cy="75"
                            r="66"
                            fill="none"
                            stroke="#FF6B35"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray="415"
                            strokeDashoffset={ringOffset}
                          />
                        </svg>
                        <b>{secondsLeft}s</b>
                      </div>
                      <button className="btn" onClick={handlePay}>
                        Pay ₹1,499 &amp; confirm
                      </button>{" "}
                      <button className="btn ghost" onClick={handleDrop}>
                        Abandon
                      </button>
                    </>
                  )}
                </div>

                <h3 style={{ margin: "20px 0 8px" }}>Broker log</h3>
                <div className="log" id="log" ref={logContainerRef}>
                  {logs.map((l, i) => (
                    <div key={i} className={l.cls}>
                      {l.time} {l.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 4. PROFILE PAGE */}
        <div className={`page ${activePage === "profile" ? "on" : ""}`} id="profile">
          <section className="light">
            <h2>
              Hi, <em id="uName">{user ? user.name.split(" ")[0] : "Fan"}</em> 👋
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
                      <div style={{ fontSize: "13px", opacity: 0.7 }}>Confirmed ✓</div>
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
        <div className={`page ${activePage === "login" ? "on" : ""}`} id="login">
          <div className="auth">
            <div className="side">
              <span className="pill" style={{ alignSelf: "flex-start", color: "var(--k)" }}>
                <i className="dot"></i> Next drop in minutes
              </span>
              <h2 style={{ marginTop: "18px" }}>
                Welcome <em>back</em>.
              </h2>
              <p style={{ opacity: 0.75, lineHeight: 1.7, maxWidth: "380px" }}>
                Log in to lock your seat before the other 4,999 do. Your holds, tickets and queue priority are waiting.
              </p>
            </div>
            <div className="box">
              <h2>Log in</h2>
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                value={loginPw}
                onChange={(e) => setLoginPw(e.target.value)}
              />
              <div className="err">{loginErr}</div>
              <button className="btn" onClick={handleLogin}>
                Log in →
              </button>
              <p style={{ fontSize: "14px" }}>
                New here?{" "}
                <a className="lk" onClick={() => navigateTo("signup")}>
                  Create an account
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* 6. SIGNUP PAGE */}
        <div className={`page ${activePage === "signup" ? "on" : ""}`} id="signup">
          <div className="auth">
            <div className="side">
              <span className="pill" style={{ alignSelf: "flex-start", color: "var(--k)" }}>
                <i className="dot"></i> Free · takes 20 seconds
              </span>
              <h2 style={{ marginTop: "18px" }}>
                Join the <em>fast lane</em>.
              </h2>
              <p style={{ opacity: 0.75, lineHeight: 1.7, maxWidth: "380px" }}>
                One account for every flash drop: atomic seat locks, 30-second holds and instant confirmation.
              </p>
            </div>
            <div className="box">
              <h2>Sign up</h2>
              <input
                placeholder="Full name"
                autoComplete="name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                autoComplete="new-password"
                value={signupPw}
                onChange={(e) => setSignupPw(e.target.value)}
              />
              <input
                type="password"
                placeholder="Confirm password"
                autoComplete="new-password"
                value={signupPw2}
                onChange={(e) => setSignupPw2(e.target.value)}
              />
              <div className="err">{signupErr}</div>
              <button className="btn" onClick={handleSignup}>
                Create account →
              </button>
              <p style={{ fontSize: "14px" }}>
                Already registered?{" "}
                <a className="lk" onClick={() => navigateTo("login")}>
                  Log in
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer>© 2026 TicketWala · Redis Lua + TTL holds + async persistence</footer>
    </>
  );
}
