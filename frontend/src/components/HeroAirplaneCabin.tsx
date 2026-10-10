"use client";

import React, { useState, useEffect, useRef } from "react";
import { Zap, ShieldCheck, ArrowRight, Sparkles, Plane, Users, Lock, CheckCircle2, Volume2, VolumeX } from "lucide-react";

interface HeroAirplaneCabinProps {
  onGoToBooking: () => void;
  onExploreEvents: () => void;
}

interface CabinPassenger {
  id: string;
  seatNumber: string;
  name: string;
  role: string;
  status: "AVAILABLE" | "HELD" | "CONFIRMED";
  avatarColor: string;
  hairColor: string;
  accessory: "cap" | "glasses" | "beanie" | "headphones" | "bun" | "wavy" | "tie";
  expression: "happy" | "focused" | "chill" | "surprised";
}

const PASSENGERS: CabinPassenger[] = [
  {
    id: "p1",
    seatNumber: "01A",
    name: "Aarav S.",
    role: "Flash Snipers Lead",
    status: "HELD",
    avatarColor: "#FF6B35",
    hairColor: "#2B2A28",
    accessory: "cap",
    expression: "focused",
  },
  {
    id: "p2",
    seatNumber: "01B",
    name: "Elena R.",
    role: "Concurrency Tester",
    status: "CONFIRMED",
    avatarColor: "#2B2A28",
    hairColor: "#5C5B57",
    accessory: "glasses",
    expression: "happy",
  },
  {
    id: "p3",
    seatNumber: "01C",
    name: "Marcus V.",
    role: "Redis Lua Architect",
    status: "CONFIRMED",
    avatarColor: "#FF6B35",
    hairColor: "#2B2A28",
    accessory: "tie",
    expression: "focused",
  },
  {
    id: "p4",
    seatNumber: "01D",
    name: "Dev K.",
    role: "High-Volume Broker",
    status: "HELD",
    avatarColor: "#2B2A28",
    hairColor: "#8E8D88",
    accessory: "beanie",
    expression: "chill",
  },
  {
    id: "p5",
    seatNumber: "01E",
    name: "Priya M.",
    role: "Invariant Auditor",
    status: "AVAILABLE",
    avatarColor: "#FF6B35",
    hairColor: "#2B2A28",
    accessory: "bun",
    expression: "happy",
  },
  {
    id: "p6",
    seatNumber: "01F",
    name: "Zain H.",
    role: "Admission Throttle",
    status: "CONFIRMED",
    avatarColor: "#2B2A28",
    hairColor: "#3A3936",
    accessory: "glasses",
    expression: "focused",
  },
  {
    id: "p7",
    seatNumber: "01G",
    name: "Chloe T.",
    role: "Stream Worker",
    status: "HELD",
    avatarColor: "#FF6B35",
    hairColor: "#2B2A28",
    accessory: "wavy",
    expression: "happy",
  },
  {
    id: "p8",
    seatNumber: "01H",
    name: "Vikram N.",
    role: "Eventual Consistency",
    status: "AVAILABLE",
    avatarColor: "#2B2A28",
    hairColor: "#4B4A47",
    accessory: "headphones",
    expression: "chill",
  },
];

export const HeroAirplaneCabin: React.FC<HeroAirplaneCabinProps> = ({
  onGoToBooking,
  onExploreEvents,
}) => {
  const [hoveredPassenger, setHoveredPassenger] = useState<CabinPassenger | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [turbulenceY, setTurbulenceY] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Flight subtle atmospheric turbulence simulation
  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      frame += 0.05;
      setTurbulenceY(Math.sin(frame) * 4);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
    setHoveredPassenger(null);
  };

  return (
    <section
      style={{
        position: "relative",
        padding: "40px 24px 64px 24px",
        overflow: "hidden",
        backgroundColor: "#FAF9F5",
        borderBottom: "1px solid #E6E5E3",
      }}
    >
      {/* Dynamic Animated Cloudscape Layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        {/* Cloud 1 */}
        <div
          className="animate-cloud-drift"
          style={{
            position: "absolute",
            top: "10%",
            left: "5%",
            width: "320px",
            height: "110px",
            background: "#FFFFFF",
            borderRadius: "100px",
            boxShadow: "0 10px 30px rgba(43, 42, 40, 0.03)",
            opacity: 0.85,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-45px",
              left: "50px",
              width: "110px",
              height: "110px",
              background: "#FFFFFF",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "-60px",
              left: "120px",
              width: "130px",
              height: "130px",
              background: "#FFFFFF",
              borderRadius: "50%",
            }}
          />
        </div>

        {/* Cloud 2 */}
        <div
          className="animate-cloud-drift"
          style={{
            position: "absolute",
            top: "18%",
            right: "8%",
            width: "380px",
            height: "120px",
            background: "#FFFFFF",
            borderRadius: "100px",
            boxShadow: "0 10px 30px rgba(43, 42, 40, 0.03)",
            opacity: 0.9,
            animationDuration: "25s",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-55px",
              left: "70px",
              width: "130px",
              height: "130px",
              background: "#FFFFFF",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "-40px",
              left: "170px",
              width: "110px",
              height: "110px",
              background: "#FFFFFF",
              borderRadius: "50%",
            }}
          />
        </div>

        {/* Cloud 3 (Lower Horizon) */}
        <div
          className="animate-cloud-drift"
          style={{
            position: "absolute",
            bottom: "12%",
            left: "-50px",
            width: "440px",
            height: "140px",
            background: "#FFFFFF",
            borderRadius: "100px",
            opacity: 0.7,
            animationDuration: "35s",
          }}
        />
      </div>

      <div
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Top Header Eyebrow & Display Headline (Faithful to Sample Video Layout) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "32px",
            alignItems: "flex-end",
            marginBottom: "36px",
          }}
        >
          {/* Left Column: Brand Tagline & Big Display Headline */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#FF6B35",
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#FF6B35",
                  boxShadow: "0 0 8px #FF6B35",
                  display: "inline-block",
                }}
              />
              <span>High-velocity seat allocations for you</span>
            </div>

            <h1
              style={{
                fontSize: "clamp(34px, 4.6vw, 62px)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-1.8px",
                color: "#2B2A28",
                margin: "0 0 24px 0",
              }}
            >
              Let transactional AI engines do the work for you.
            </h1>

            {/* Pill CTA button matching sample video download button */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <button
                onClick={onGoToBooking}
                className="btn-dark"
                style={{
                  padding: "12px 26px",
                  fontSize: "14px",
                  backgroundColor: "#2B2A28",
                  color: "#FFFFFF",
                }}
              >
                <Zap size={16} color="#FF6B35" fill="#FF6B35" />
                <span>Claim Flash Seat</span>
              </button>

              <button
                onClick={onExploreEvents}
                className="btn-secondary"
                style={{
                  padding: "12px 22px",
                  fontSize: "14px",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <Plane size={16} color="#2B2A28" />
                <span>View Flight Drops</span>
              </button>
            </div>
          </div>

          {/* Right Column: Explanatory Subtitle & Telemetry Counter */}
          <div style={{ maxWidth: "480px" }}>
            <p
              style={{
                fontSize: "16px",
                lineHeight: 1.6,
                color: "#5C5B57",
                margin: "0 0 20px 0",
              }}
            >
              Choose from a fleet of high-velocity flash allocations, each protected by an in-memory
              transactional Redis Lua broker with sub-second holding locks, automatic 60s TTL revocation,
              and verified zero double-allocations.
            </p>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                backgroundColor: "#FFFFFF",
                padding: "8px 16px",
                borderRadius: "9999px",
                border: "1px solid #E6E5E3",
                boxShadow: "0 4px 12px rgba(43, 42, 40, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10B981" }} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#2B2A28" }}>5,000+ Req/s Armed</span>
              </div>
              <span style={{ color: "#E6E5E3" }}>|</span>
              <span style={{ fontSize: "12px", color: "#FF6B35", fontWeight: 700 }}>0ms Database Deadlock</span>
            </div>
          </div>
        </div>

        {/* THE CUSTOM ANIMATED AIRPLANE CABIN CENTERPIECE */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="perspective-container"
          style={{
            position: "relative",
            width: "100%",
            borderRadius: "32px",
            overflow: "hidden",
            boxShadow: "0 30px 80px -20px rgba(43, 42, 40, 0.16)",
            border: "2px solid #2B2A28",
            backgroundColor: "#FFFFFF",
          }}
        >
          {/* Main Flight Stage */}
          <div
            style={{
              position: "relative",
              minHeight: "520px",
              background: "linear-gradient(180deg, #F9F8F5 0%, #FFFFFF 65%, #F0EFEA 100%)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "24px 32px 0 32px",
              transform: `rotateY(${mousePos.x * 6}deg) rotateX(${-mousePos.y * 6}deg) translateY(${turbulenceY}px)`,
              transition: "transform 0.15s ease-out",
            }}
          >
            {/* Top Atmosphere Strip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                zIndex: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    backgroundColor: "#2B2A28",
                    color: "#FFFFFF",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                  }}
                >
                  FLIGHT TW-2026
                </div>
                <span style={{ fontSize: "12px", color: "#8E8D88", fontWeight: 600 }}>
                  Altitude: 36,000 FT &bull; Airspeed: 5,400 REQ/SEC
                </span>
              </div>

              {/* Sound indicator toggle */}
              <button
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                title={isAudioMuted ? "Cabin Audio Muted" : "Cabin Ambience Playing"}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E6E5E3",
                  borderRadius: "9999px",
                  padding: "6px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#2B2A28",
                }}
              >
                {isAudioMuted ? <VolumeX size={14} color="#8E8D88" /> : <Volume2 size={14} color="#FF6B35" />}
                <span>{isAudioMuted ? "Cabin Mute" : "Jet Audio Active"}</span>
              </button>
            </div>

            {/* AIRCRAFT CABIN FUSELAGE WITH PASSENGER WINDOWS */}
            <div
              style={{
                position: "relative",
                margin: "40px auto 0 auto",
                width: "100%",
                maxWidth: "1040px",
                zIndex: 5,
              }}
            >
              {/* Aircraft Outer Shell Line */}
              <div
                style={{
                  position: "relative",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "28px",
                  padding: "20px 24px",
                  border: "2px solid #2B2A28",
                  boxShadow: "0 16px 36px rgba(43, 42, 40, 0.08)",
                }}
              >
                {/* Horizontal Passenger Window Strip */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(8, 1fr)",
                    gap: "14px",
                    alignItems: "center",
                  }}
                >
                  {PASSENGERS.map((p, idx) => {
                    const isHovered = hoveredPassenger?.id === p.id;
                    const isHeld = p.status === "HELD";
                    const isConfirmed = p.status === "CONFIRMED";

                    return (
                      <div
                        key={p.id}
                        onMouseEnter={() => setHoveredPassenger(p)}
                        style={{
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        {/* Seat Code Indicator */}
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            color: isHovered ? "#FF6B35" : "#8E8D88",
                            marginBottom: "6px",
                            transition: "color 0.2s ease",
                          }}
                        >
                          {p.seatNumber}
                        </span>

                        {/* Oval Airplane Window matching the sample video */}
                        <div
                          style={{
                            width: "100%",
                            maxWidth: "96px",
                            aspectRatio: "3 / 4.4",
                            borderRadius: "44px",
                            backgroundColor: "#FFFFFF",
                            border: isHovered
                              ? "3px solid #FF6B35"
                              : "2.5px solid #2B2A28",
                            boxShadow: isHovered
                              ? "0 0 16px rgba(255, 107, 53, 0.5), inset 0 2px 8px rgba(0,0,0,0.06)"
                              : "inset 0 2px 6px rgba(43, 42, 40, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            position: "relative",
                            transform: isHovered ? "translateY(-6px) scale(1.05)" : "translateY(0) scale(1)",
                            transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        >
                          {/* Inner Bezel Ring */}
                          <div
                            style={{
                              position: "absolute",
                              inset: "4px",
                              borderRadius: "40px",
                              border: "1.5px solid #E6E5E3",
                              pointerEvents: "none",
                              zIndex: 3,
                            }}
                          />

                          {/* Sun Glare / Glass Reflection Diagonal */}
                          <div
                            style={{
                              position: "absolute",
                              top: "-30%",
                              left: "-30%",
                              width: "160%",
                              height: "160%",
                              background: "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 45%)",
                              pointerEvents: "none",
                              zIndex: 4,
                            }}
                          />

                          {/* Illustrated Passenger Avatar (Matching the character art in sample video) */}
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              paddingBottom: "4px",
                              position: "relative",
                              zIndex: 2,
                            }}
                          >
                            {/* Head & Hair */}
                            <div
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "50%",
                                backgroundColor: "#F7D8C5",
                                border: "1.5px solid #2B2A28",
                                position: "relative",
                                marginBottom: "-4px",
                                transform: isHovered ? "scale(1.08)" : "scale(1)",
                                transition: "transform 0.2s ease",
                              }}
                            >
                              {/* Hair / Accessory rendering */}
                              {p.accessory === "cap" && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: "-4px",
                                    left: "-3px",
                                    width: "48px",
                                    height: "18px",
                                    backgroundColor: "#FF6B35",
                                    borderRadius: "14px 14px 0 0",
                                    border: "1.5px solid #2B2A28",
                                  }}
                                >
                                  {/* Cap Visor */}
                                  <div
                                    style={{
                                      position: "absolute",
                                      bottom: "-2px",
                                      right: "-6px",
                                      width: "18px",
                                      height: "5px",
                                      backgroundColor: "#FF6B35",
                                      border: "1.5px solid #2B2A28",
                                      borderRadius: "0 6px 6px 0",
                                    }}
                                  />
                                </div>
                              )}

                              {p.accessory === "beanie" && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: "-6px",
                                    left: "-1px",
                                    width: "44px",
                                    height: "22px",
                                    backgroundColor: "#2B2A28",
                                    borderRadius: "16px 16px 4px 4px",
                                  }}
                                />
                              )}

                              {p.accessory === "bun" && (
                                <>
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: "-10px",
                                      left: "14px",
                                      width: "14px",
                                      height: "14px",
                                      backgroundColor: p.hairColor,
                                      borderRadius: "50%",
                                      border: "1.5px solid #2B2A28",
                                    }}
                                  />
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: "-2px",
                                      left: "0",
                                      width: "42px",
                                      height: "14px",
                                      backgroundColor: p.hairColor,
                                      borderRadius: "12px 12px 0 0",
                                    }}
                                  />
                                </>
                              )}

                              {p.accessory === "headphones" && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: "6px",
                                    left: "-4px",
                                    width: "50px",
                                    height: "24px",
                                    borderTop: "3px solid #2B2A28",
                                    borderRadius: "18px 18px 0 0",
                                  }}
                                >
                                  <div style={{ position: "absolute", top: "8px", left: "0", width: "8px", height: "14px", backgroundColor: "#FF6B35", borderRadius: "4px" }} />
                                  <div style={{ position: "absolute", top: "8px", right: "0", width: "8px", height: "14px", backgroundColor: "#FF6B35", borderRadius: "4px" }} />
                                </div>
                              )}

                              {/* Eyes */}
                              <div
                                style={{
                                  position: "absolute",
                                  top: "16px",
                                  left: "10px",
                                  display: "flex",
                                  gap: "12px",
                                }}
                              >
                                <span style={{ width: "3.5px", height: "3.5px", borderRadius: "50%", backgroundColor: "#2B2A28" }} />
                                <span style={{ width: "3.5px", height: "3.5px", borderRadius: "50%", backgroundColor: "#2B2A28" }} />
                              </div>

                              {/* Glasses */}
                              {p.accessory === "glasses" && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: "13px",
                                    left: "6px",
                                    width: "30px",
                                    height: "9px",
                                    border: "1.5px solid #2B2A28",
                                    borderRadius: "3px",
                                  }}
                                />
                              )}

                              {/* Smile */}
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: "8px",
                                  left: "16px",
                                  width: "10px",
                                  height: "5px",
                                  borderBottom: "1.5px solid #2B2A28",
                                  borderRadius: "0 0 10px 10px",
                                }}
                              />
                            </div>

                            {/* Torso / Clothes */}
                            <div
                              style={{
                                width: "48px",
                                height: "24px",
                                backgroundColor: p.avatarColor,
                                borderRadius: "16px 16px 0 0",
                                border: "1.5px solid #2B2A28",
                                position: "relative",
                              }}
                            >
                              {p.accessory === "tie" && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: "0",
                                    left: "21px",
                                    width: "6px",
                                    height: "14px",
                                    backgroundColor: "#2B2A28",
                                    clipPath: "polygon(0 0, 100% 0, 75% 100%, 25% 100%)",
                                  }}
                                />
                              )}
                            </div>
                          </div>

                          {/* Status Badge Tag */}
                          <div
                            style={{
                              position: "absolute",
                              bottom: "4px",
                              right: "4px",
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              backgroundColor: isConfirmed ? "#2B2A28" : isHeld ? "#FF6B35" : "#10B981",
                              border: "1.5px solid #FFFFFF",
                              zIndex: 6,
                            }}
                          />
                        </div>

                        {/* Status Label */}
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 700,
                            color: isConfirmed ? "#5C5B57" : isHeld ? "#FF6B35" : "#10B981",
                            marginTop: "6px",
                          }}
                        >
                          {p.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AIRCRAFT WING & WINGTIP WITH ORANGE ACCENTS (Matching video) */}
            <div
              style={{
                position: "relative",
                width: "110%",
                left: "-5%",
                height: "120px",
                marginTop: "16px",
                overflow: "hidden",
                zIndex: 2,
              }}
            >
              <svg
                viewBox="0 0 1200 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: "100%", height: "100%" }}
              >
                {/* Airplane Wing Silhouette */}
                <path
                  d="M0 160C280 140 680 70 1140 10L1200 40C720 110 320 160 0 160Z"
                  fill="#EAE8E2"
                  stroke="#2B2A28"
                  strokeWidth="2.5"
                />

                {/* Aerodynamic Flap Slat Lines */}
                <path
                  d="M200 150C420 130 760 75 1080 25"
                  stroke="#2B2A28"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                />

                {/* Vibrant Orange Wingtip Detail (10% Brand Accent) */}
                <path
                  d="M1060 22C1110 14 1160 5 1195 0L1200 35C1165 42 1115 52 1060 22Z"
                  fill="#FF6B35"
                  stroke="#2B2A28"
                  strokeWidth="2"
                />

                {/* Engine Contrail subtle air pulse */}
                <circle cx="850" cy="55" r="4" fill="#FF6B35" opacity="0.8" />
                <line x1="850" y1="55" x2="650" y2="75" stroke="#FF6B35" strokeWidth="1.5" strokeOpacity="0.4" />
              </svg>
            </div>
          </div>

          {/* Interactive Passenger Details Popover */}
          {hoveredPassenger && (
            <div
              style={{
                position: "absolute",
                bottom: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "#2B2A28",
                color: "#FFFFFF",
                borderRadius: "14px",
                padding: "12px 20px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                boxShadow: "0 14px 30px rgba(43, 42, 40, 0.3)",
                border: "1.5px solid #FF6B35",
                zIndex: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    backgroundColor: "#FFF0EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Users size={16} color="#FF6B35" />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 800 }}>
                    {hoveredPassenger.name} &bull; Seat {hoveredPassenger.seatNumber}
                  </div>
                  <div style={{ fontSize: "11px", color: "#8E8D88" }}>
                    Role: {hoveredPassenger.role}
                  </div>
                </div>
              </div>

              <div style={{ height: "24px", width: "1px", backgroundColor: "rgba(255, 255, 255, 0.2)" }} />

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    backgroundColor: hoveredPassenger.status === "CONFIRMED" ? "#3A3936" : hoveredPassenger.status === "HELD" ? "#FF6B35" : "#10B981",
                    color: "#FFFFFF",
                    padding: "3px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {hoveredPassenger.status}
                </span>

                <button
                  onClick={onGoToBooking}
                  className="btn-primary"
                  style={{ padding: "6px 14px", fontSize: "11px" }}
                >
                  <span>Lock Seat</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
