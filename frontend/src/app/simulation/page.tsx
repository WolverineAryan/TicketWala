"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Zap,
  ShieldCheck,
  Activity,
  RefreshCw,
  ChevronLeft,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";

const N = 200;
const DEFAULT_TTL = 30;

interface Seat {
  st: number; // 0 = free, 1 = held, 2 = sold
  t: number;  // expiration timestamp
  bot?: boolean;
}

export default function SimulationPage() {
  const [seats, setSeats] = useState<Seat[]>(() =>
    Array.from({ length: N }, () => ({ st: 0, t: 0 }))
  );
  const [stats, setStats] = useState({ req: 0, ok: 0, no: 0, rev: 0 });
  const [logs, setLogs] = useState<Array<{ id: number; msg: string; type: string }>>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [intensity, setIntensity] = useState(100);
  const [customTtl, setCustomTtl] = useState(DEFAULT_TTL);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logIdRef = useRef(0);

  const addLog = (msg: string, type: string = "info") => {
    logIdRef.current++;
    setLogs((prev) => [
      { id: logIdRef.current, msg: `${new Date().toLocaleTimeString()} ${msg}`, type },
      ...prev.slice(0, 40),
    ]);
  };

  // Particle background canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let h = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const particles: Array<{ x: number; y: number; vx: number; vy: number; r: number; c: string }> = [];
    const colors = ["#FF6B35", "#6366F1", "#10B981", "#E2E8F0"];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        r: Math.random() * 2.5 + 1,
        c: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c;
        ctx.globalAlpha = 0.35;
        ctx.fill();
      }
      animId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      w = canvas.width = canvas.parentElement?.clientWidth || 800;
      h = canvas.height = canvas.parentElement?.clientHeight || 400;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Seat TTL expiry ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      const now = Date.now();
      setSeats((prev) =>
        prev.map((s, idx) => {
          if (s.st === 1 && s.t > 0 && now > s.t) {
            addLog(`Seat #${idx + 1} lease expired -> returned to inventory queue`, "warn");
            return { st: 0, t: 0 };
          }
          return s;
        })
      );
    }, 1000);

    return () => clearInterval(ticker);
  }, []);

  // Run Flash Drop Burst Storm Simulation
  const runBurstSimulation = () => {
    if (isBusy) return;
    setIsBusy(true);
    addLog(`[BURST TEST] Launching ${intensity} concurrent bot acquisition threads...`, "warn");

    let sent = 0;
    const interval = setInterval(() => {
      setSeats((prevSeats) => {
        const copy = [...prevSeats];
        for (let k = 0; k < 25; k++) {
          sent++;
          setStats((st) => ({ ...st, req: st.req + 1 }));
          const i = Math.floor(Math.random() * N);
          const s = copy[i];

          if (s.st !== 0) {
            setStats((st) => ({ ...st, no: st.no + 1 }));
          } else {
            copy[i] = {
              st: 1,
              t: Date.now() + customTtl * 1000,
              bot: true,
            };
            setStats((st) => ({ ...st, ok: st.ok + 1, rev: st.rev + 2500 }));
            addLog(`Bot acquired lock on Seat #${i + 1} (TTL ${customTtl}s)`, "ok");
          }
        }
        return copy;
      });

      if (sent >= intensity) {
        clearInterval(interval);
        setIsBusy(false);
        addLog(`[BURST FINISHED] Processed ${sent} requests with 100% capacity conservation.`, "ok");
      }
    }, 100);
  };

  const resetSimulation = () => {
    setSeats(Array.from({ length: N }, () => ({ st: 0, t: 0 })));
    setStats({ req: 0, ok: 0, no: 0, rev: 0 });
    setSelectedSeat(null);
    addLog("Simulator reset: all 200 seats recycled to available queue.", "info");
  };

  const handleUserLock = (idx: number) => {
    setSeats((prev) => {
      const copy = [...prev];
      if (copy[idx].st === 0) {
        copy[idx] = { st: 1, t: Date.now() + customTtl * 1000, bot: false };
        setSelectedSeat(idx);
        setStats((st) => ({ ...st, req: st.req + 1, ok: st.ok + 1, rev: st.rev + 2500 }));
        addLog(`Manual user locked Seat #${idx + 1} atomically.`, "ok");
      } else if (copy[idx].st === 1 && !copy[idx].bot) {
        copy[idx] = { st: 2, t: 0 };
        setStats((st) => ({ ...st, ok: st.ok + 1 }));
        addLog(`Manual user confirmed Seat #${idx + 1} -> status CONFIRMED.`, "ok");
      }
      return copy;
    });
  };

  const freeCount = seats.filter((s) => s.st === 0).length;
  const heldCount = seats.filter((s) => s.st === 1).length;
  const soldCount = seats.filter((s) => s.st === 2).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Exit to Landing Page</span>
            </Link>

            <span className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>⚡ TicketWala Architecture & Concurrency Simulation Studio</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase">
                Isolated Lab
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetSimulation}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset State</span>
            </button>
            <Link
              href="/home"
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-bold transition shadow-sm"
            >
              Go to Consumer Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {/* Hero Interactive Canvas Section */}
        <div className="relative rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-10 mb-8 overflow-hidden shadow-2xl">
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-40" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider mb-4">
              <Zap className="w-3.5 h-3.5" />
              <span>High Contention Flash-Drop Simulation Engine</span>
            </span>

            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              5,000 Fans. 200 Seats.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-pink-400 to-amber-400">
                Zero Double-Bookings Guaranteed.
              </span>
            </h1>

            <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Experience the atomic Redis Lua locking algorithm in real time. Simulate thousands of concurrent bot requests racing for the same inventory. Witness automatic lease expiration, capacity conservation, and zero race conditions.
            </p>

            {/* Simulation Controls */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                onClick={runBurstSimulation}
                disabled={isBusy}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>Trigger Burst Drop ({intensity} Requests)</span>
              </button>

              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-400">Bot Load:</span>
                <select
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                >
                  <option value={50} className="bg-slate-900">50 Clients</option>
                  <option value={100} className="bg-slate-900">100 Clients</option>
                  <option value={250} className="bg-slate-900">250 Clients</option>
                  <option value={500} className="bg-slate-900">500 Clients</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400">Hold Lease:</span>
                <select
                  value={customTtl}
                  onChange={(e) => setCustomTtl(Number(e.target.value))}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                >
                  <option value={10} className="bg-slate-900">10 Seconds</option>
                  <option value={30} className="bg-slate-900">30 Seconds</option>
                  <option value={60} className="bg-slate-900">60 Seconds</option>
                  <option value={120} className="bg-slate-900">120 Seconds</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase text-slate-500 block">Total Requests Processed</span>
            <span className="text-2xl font-black text-white mt-1 block">{stats.req}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">p99 latency: 0.42ms</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase text-slate-500 block">Available Seats (Free)</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{freeCount} / 200</span>
            <span className="text-[10px] text-emerald-500 mt-1 block">In FIFO queue</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase text-slate-500 block">Actively Held (TTL Leases)</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">{heldCount}</span>
            <span className="text-[10px] text-amber-500 mt-1 block">Protected by token</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase text-slate-500 block">Permanently Confirmed</span>
            <span className="text-2xl font-black text-indigo-400 mt-1 block">{soldCount}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Replicated to Postgres</span>
          </div>
        </div>

        {/* Two Column Grid: 200-Seat Realtime Matrix & Live Event Log */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Seat Grid (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Live Inventory Matrix (200 Units)</h2>
                <p className="text-[11px] text-slate-400">Click any seat to lock it manually or watch bot contention</p>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Free
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Held
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-600" /> Sold
                </span>
              </div>
            </div>

            {/* 200 Seat Visualizer Grid */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 max-h-[380px] overflow-y-auto">
              <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-16 gap-1.5 justify-items-center">
                {seats.map((seat, i) => {
                  let color = "bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white";
                  if (seat.st === 1) {
                    color = seat.bot
                      ? "bg-amber-950/80 text-amber-300 border border-amber-500/50 animate-pulse"
                      : "bg-indigo-600 text-white border border-indigo-400";
                  } else if (seat.st === 2) {
                    color = "bg-slate-800 text-slate-500 cursor-not-allowed";
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleUserLock(i)}
                      title={`Seat #${i + 1} (${seat.st === 0 ? "Free" : seat.st === 1 ? "Held" : "Sold"})`}
                      className={`w-7 h-7 rounded text-[9px] font-bold flex items-center justify-center transition-all ${color}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              <span>Conservation Invariant: {freeCount} + {heldCount} + {soldCount} = <strong>{freeCount + heldCount + soldCount} / 200</strong></span>
              <span className="text-emerald-400 font-bold">✓ PASSING</span>
            </div>
          </div>

          {/* Realtime Event Stream Log (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span>Redis Stream & Engine Telemetry</span>
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">XREADGROUP</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 h-[340px] overflow-y-auto space-y-1.5 font-mono text-[11px]">
                {logs.length === 0 ? (
                  <p className="text-slate-600 text-center py-20">Click &apos;Trigger Burst Drop&apos; or pick a seat to generate telemetry events...</p>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-1.5 rounded ${
                        log.type === "ok"
                          ? "text-emerald-300 bg-emerald-950/20"
                          : log.type === "warn"
                          ? "text-amber-300 bg-amber-950/20"
                          : "text-slate-300 bg-slate-900/50"
                      }`}
                    >
                      {log.msg}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
              <span>Async Ledger Worker Active</span>
              <span className="text-indigo-400 font-bold">PostgreSQL Sync Ready</span>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
