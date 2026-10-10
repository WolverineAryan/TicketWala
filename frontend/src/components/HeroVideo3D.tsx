"use client";

import React, { useState, useRef } from "react";
import { Zap, Play, Pause, ShieldCheck, Cpu, Database, Activity, ArrowRight, Sparkles, Plane, Users } from "lucide-react";

interface HeroVideo3DProps {
  onGoToBooking: () => void;
  onExploreEvents: () => void;
}

export const HeroVideo3D: React.FC<HeroVideo3DProps> = ({
  onGoToBooking,
  onExploreEvents,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <section
      style={{
        position: "relative",
        padding: "48px 24px 64px 24px",
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* Background Decorative Cloud & Gradient Elements */}
      <div
        className="animate-cloud-drift"
        style={{
          position: "absolute",
          top: "-60px",
          right: "5%",
          width: "480px",
          height: "480px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255, 107, 53, 0.08) 0%, rgba(255, 255, 255, 0) 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "0",
          left: "-5%",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(43, 42, 40, 0.04) 0%, rgba(255, 255, 255, 0) 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Top Badges & Headline */}
        <div style={{ textAlign: "center", maxWidth: "900px", margin: "0 auto 36px auto" }}>
          {/* Sub-badge matching reference video style */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              backgroundColor: "#FFF0EB",
              borderRadius: "9999px",
              border: "1px solid rgba(255, 107, 53, 0.25)",
              color: "#FF6B35",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "18px",
            }}
          >
            <Sparkles size={15} />
            <span>High-Velocity Flash-Reservation & Seat Inventory Engine</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(34px, 4.5vw, 58px)",
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: "-1.5px",
              color: "#2B2A28",
              marginBottom: "18px",
            }}
          >
            Sustain <span style={{ color: "#FF6B35" }}>5,000+ Concurrent</span> Users with Sub-Second FCFS Locks.
          </h1>

          <p
            style={{
              fontSize: "clamp(16px, 1.8vw, 19px)",
              lineHeight: 1.6,
              color: "#5C5B57",
              maxWidth: "760px",
              margin: "0 auto 28px auto",
            }}
          >
            Decoupled write traffic via an in-memory transactional Redis Lua broker with token buckets,
            enforcing atomic 60s TTL holds, eliminating race-condition double-allocations, and
            asynchronously persisting to Postgres.
          </p>

          {/* Action CTAs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <button onClick={onGoToBooking} className="btn-primary" style={{ padding: "14px 32px", fontSize: "15px" }}>
              <Zap size={18} fill="#FFFFFF" />
              <span>Claim Flash Reservation</span>
              <ArrowRight size={16} />
            </button>

            <button onClick={onExploreEvents} className="btn-dark" style={{ padding: "14px 28px", fontSize: "15px" }}>
              <Plane size={18} />
              <span>Explore High-Contention Drops</span>
            </button>
          </div>
        </div>

        {/* 3D Video Animated Showcase Container */}
        <div
          className="perspective-container"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          style={{
            maxWidth: "1080px",
            margin: "0 auto",
            position: "relative",
          }}
        >
          {/* 3D Tilted Glass Card containing the user's recorded video animation */}
          <div
            className="card-3d preserve-3d"
            style={{
              transform: isHovered
                ? `rotateY(${mousePos.x * 8}deg) rotateX(${-mousePos.y * 8}deg) scale3d(1.01, 1.01, 1.01)`
                : "rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)",
              borderRadius: "24px",
              backgroundColor: "#2B2A28",
              padding: "16px",
              boxShadow: "0 25px 60px -15px rgba(43, 42, 40, 0.25), 0 0 40px rgba(255, 107, 53, 0.12)",
              border: "1.5px solid #3F3E3B",
              position: "relative",
            }}
          >
            {/* Top Device Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 16px 14px 16px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "11px", height: "11px", borderRadius: "50%", backgroundColor: "#FF5F56", display: "inline-block" }} />
                <span style={{ width: "11px", height: "11px", borderRadius: "50%", backgroundColor: "#FFBD2E", display: "inline-block" }} />
                <span style={{ width: "11px", height: "11px", borderRadius: "50%", backgroundColor: "#27C93F", display: "inline-block" }} />
                <span style={{ color: "#8E8D88", fontSize: "12px", marginLeft: "10px", fontFamily: "monospace" }}>
                  ticketwala://flash-reservation-flight-cabin
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={togglePlay}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "none",
                    borderRadius: "9999px",
                    color: "#FFFFFF",
                    padding: "4px 10px",
                    cursor: "pointer",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                  <span>{isPlaying ? "Live Animation" : "Paused"}</span>
                </button>
              </div>
            </div>

            {/* Main Video Presentation Display */}
            <div
              style={{
                position: "relative",
                width: "100%",
                borderRadius: "16px",
                overflow: "hidden",
                backgroundColor: "#FBFBFA",
                aspectRatio: "16 / 9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <video
                ref={videoRef}
                src="/hero-video.mp4"
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />

              {/* Gradient edge blending overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  boxShadow: "inset 0 0 40px rgba(43, 42, 40, 0.15)",
                }}
              />
            </div>

            {/* Bottom 3D Flight / Cabin Passenger Window Indicator Strip */}
            <div
              style={{
                marginTop: "16px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "14px",
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 107, 53, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255, 107, 53, 0.4)",
                  }}
                >
                  <Plane size={18} color="#FF6B35" />
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>
                    Cabin Flight Allocation Matrix &bull; Flash Stream 2026
                  </div>
                  <div style={{ fontSize: "11px", color: "#8E8D88" }}>
                    200 Contended Units &bull; Instant Redis FIFO Head Enqueue on Release
                  </div>
                </div>
              </div>

              {/* Passenger Oval Seat Preview Icons matching recorded video */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div
                    key={idx}
                    title={`Window Seat #${idx} - Verified Single Ownership`}
                    style={{
                      width: "28px",
                      height: "36px",
                      borderRadius: "14px",
                      border: idx === 3 ? "2px solid #FF6B35" : "1.5px solid rgba(255, 255, 255, 0.2)",
                      backgroundColor: idx === 3 ? "#FFF0EB" : "rgba(255, 255, 255, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 0.2s ease",
                      cursor: "pointer",
                    }}
                  >
                    <Users size={12} color={idx === 3 ? "#FF6B35" : "#FFFFFF"} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating 3D Stat Badges surrounding the video viewport */}
          <div
            className="animate-float"
            style={{
              position: "absolute",
              top: "-20px",
              left: "-25px",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "12px 18px",
              boxShadow: "0 14px 30px rgba(43, 42, 40, 0.12)",
              border: "1.5px solid #E6E5E3",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#ECFDF5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheck size={20} color="#10B981" />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#2B2A28" }}>0 Double-Bookings</div>
              <div style={{ fontSize: "11px", color: "#5C5B57" }}>Strict Invariant Pass</div>
            </div>
          </div>

          <div
            className="animate-float"
            style={{
              position: "absolute",
              bottom: "20px",
              right: "-25px",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "12px 18px",
              boxShadow: "0 14px 30px rgba(43, 42, 40, 0.12)",
              border: "1.5px solid #E6E5E3",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              zIndex: 10,
              animationDelay: "2s",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#FFF0EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Zap size={20} color="#FF6B35" fill="#FF6B35" />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#2B2A28" }}>Sub-second FCFS</div>
              <div style={{ fontSize: "11px", color: "#FF6B35", fontWeight: 700 }}>60s TTL Lock Safety</div>
            </div>
          </div>
        </div>

        {/* 3-Tier Architecture Highlights */}
        <div
          style={{
            marginTop: "64px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid #E6E5E3",
              boxShadow: "0 4px 16px rgba(43, 42, 40, 0.04)",
              transition: "transform 0.2s ease, border-color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#FF6B35")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E6E5E3")}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                backgroundColor: "#FFF0EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
              }}
            >
              <Activity size={22} color="#FF6B35" />
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#2B2A28", marginBottom: "8px" }}>
              Adaptive Token Bucket
            </h3>
            <p style={{ fontSize: "13px", color: "#5C5B57", lineHeight: 1.5, margin: 0 }}>
              Early short-circuit admission gate throttles 5,000+ burst spikes based on remaining seat scarcity,
              preventing database thread exhaustion.
            </p>
          </div>

          {/* Card 2 */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid #E6E5E3",
              boxShadow: "0 4px 16px rgba(43, 42, 40, 0.04)",
              transition: "transform 0.2s ease, border-color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#FF6B35")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E6E5E3")}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                backgroundColor: "#2B2A28",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
              }}
            >
              <Cpu size={22} color="#FFFFFF" />
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#2B2A28", marginBottom: "8px" }}>
              In-Memory Redis Lua Broker
            </h3>
            <p style={{ fontSize: "13px", color: "#5C5B57", lineHeight: 1.5, margin: 0 }}>
              Single-threaded atomic Lua scripts execute atomic FCFS dequeues, version incrementing,
              and monotonic fencing with 0ms database lock wait.
            </p>
          </div>

          {/* Card 3 */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid #E6E5E3",
              boxShadow: "0 4px 16px rgba(43, 42, 40, 0.04)",
              transition: "transform 0.2s ease, border-color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#FF6B35")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E6E5E3")}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                backgroundColor: "#F8F8F7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
              }}
            >
              <Database size={22} color="#2B2A28" />
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#2B2A28", marginBottom: "8px" }}>
              Eventual Consistency Worker
            </h3>
            <p style={{ fontSize: "13px", color: "#5C5B57", lineHeight: 1.5, margin: 0 }}>
              Redis Streams pipeline asynchronously reconciles confirmed reservations into durable Supabase
              Postgres with idempotent batch upserts.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
