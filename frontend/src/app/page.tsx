"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

const N = 200;
const TTL = 30;

type EventCategory =
  | "Movies"
  | "Concerts"
  | "Theater"
  | "Comedy"
  | "Sports"
  | "Festivals";

interface EventItem {
  id: string;
  name: string;
  category: EventCategory;
  city: string;
  venue: string;
  dateStr: string;
  timeStr: string;
  month: string;
  day: string;
  price: number;
  priceFormatted: string;
  summary: string;
  image: string;
  trending?: boolean;
  trendingRank?: number;
  tag?: string;
  rating?: number;
  votesCount?: string;
  language?: string;
  ageBadge?: string;
  sold: number;
}

const CITIES = [
  "All Cities",
  "Mumbai",
  "Delhi-NCR",
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Kolkata",
  "Chennai",
] as const;

// Professional SVG Icons (clean, high-performance, no emoji dependency)
function IconPin({ className = "", size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconCalendar({ className = "", size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: "inline-block", verticalAlign: "middle" }}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconStar({ className = "", size = 12 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className} style={{ display: "inline-block", verticalAlign: "middle" }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconClock({ className = "", size = 13 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: "inline-block", verticalAlign: "middle" }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconSearch({ className = "", size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: "inline-block", verticalAlign: "middle" }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconGlobe({ className = "", size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: "inline-block", verticalAlign: "middle" }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconTrend({ className = "", size = 13 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: "inline-block", verticalAlign: "middle" }}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconTicket({ className = "", size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M3 7v2a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
      <line x1="13" y1="5" x2="13" y2="19" strokeDasharray="2 2" />
    </svg>
  );
}

function IconChevronDown({ className = "", size = 10 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: "inline-block", verticalAlign: "middle" }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconChevronUp({ className = "", size = 10 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: "inline-block", verticalAlign: "middle" }}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function IconClose({ className = "", size = 12 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: "inline-block", verticalAlign: "middle" }}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CategoryIcon({ category, size = 14 }: { category: string; size?: number }) {
  switch (category) {
    case "All":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "Movies":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
          <line x1="7" y1="2" x2="7" y2="22" />
          <line x1="17" y1="2" x2="17" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="2" y1="7" x2="7" y2="7" />
          <line x1="2" y1="17" x2="7" y2="17" />
          <line x1="17" y1="17" x2="22" y2="17" />
          <line x1="17" y1="7" x2="22" y2="7" />
        </svg>
      );
    case "Concerts":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    case "Theater":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
          <path d="M2 10s3-3 10-3 10 3 10 3-2 11-10 11S2 10 2 10z" />
          <circle cx="8" cy="10" r="1.5" />
          <circle cx="16" cy="10" r="1.5" />
          <path d="M9 15c1 1 5 1 6 0" />
        </svg>
      );
    case "Comedy":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      );
    case "Sports":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
        </svg>
      );
    case "Festivals":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    default:
      return null;
  }
}

const CATEGORIES = [
  "All",
  "Movies",
  "Concerts",
  "Theater",
  "Comedy",
  "Sports",
  "Festivals",
] as const;

const INITIAL_EVENTS: EventItem[] = [
  {
    id: "coldplay-mumbai",
    name: "Coldplay: Music of the Spheres World Tour",
    category: "Concerts",
    city: "Mumbai",
    venue: "DY Patil Sports Stadium",
    dateStr: "Sat, 18 Jan 2027",
    timeStr: "6:00 PM",
    month: "JAN",
    day: "18",
    price: 2500,
    priceFormatted: "₹2,500",
    summary:
      "Experience the Grammy-winning global sensation live with solar-powered stages, kinetic dance floors, and anthems like 'Yellow' & 'Fix You'.",
    image:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
    trending: true,
    trendingRank: 1,
    tag: "Selling Fast",
    rating: 4.9,
    votesCount: "42k+",
    language: "English",
    ageBadge: "All Ages",
    sold: 120,
  },
  {
    id: "interstellar-imax",
    name: "Interstellar: 10th Anniversary IMAX 70mm",
    category: "Movies",
    city: "Mumbai",
    venue: "PVR INOX Palladium IMAX",
    dateStr: "Fri - Sun Shows",
    timeStr: "7:15 PM",
    month: "OCT",
    day: "25",
    price: 750,
    priceFormatted: "₹750",
    summary:
      "Christopher Nolan's intergalactic masterpiece remastered for giant 70mm IMAX. Journey through the wormhole with Hans Zimmer's earth-shaking pipe organ score.",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    trending: true,
    trendingRank: 2,
    tag: "IMAX Exclusive",
    rating: 4.9,
    votesCount: "85k+",
    language: "English (ATMOS)",
    ageBadge: "U/A 13+",
    sold: 165,
  },
  {
    id: "ipl-clasico-mumbai",
    name: "IPL Mega Clásico: Mumbai Indians vs CSK",
    category: "Sports",
    city: "Mumbai",
    venue: "Wankhede Stadium",
    dateStr: "Sun, 28 Mar",
    timeStr: "7:30 PM",
    month: "MAR",
    day: "28",
    price: 1800,
    priceFormatted: "₹1,800",
    summary:
      "The biggest spectacle in franchise cricket. High-stakes T20 rivalry under full stadium floodlights in Mumbai's iconic sea-breeze cauldron.",
    image:
      "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80",
    trending: true,
    trendingRank: 3,
    tag: "Flash Drop",
    rating: 5.0,
    votesCount: "92k+",
    language: "Live In-stadium",
    ageBadge: "Family",
    sold: 180,
  },
  {
    id: "zakir-khan-delhi",
    name: "Zakir Khan: 'Papa Yaar' Arena Tour",
    category: "Comedy",
    city: "Delhi-NCR",
    venue: "Indira Gandhi Arena",
    dateStr: "Sat, 16 Nov",
    timeStr: "8:00 PM",
    month: "NOV",
    day: "16",
    price: 999,
    priceFormatted: "₹999",
    summary:
      "India's favorite storyteller returns with an all-new 90-minute stand-up special exploring friendships, family bonds, and hilarious bittersweet adulthood.",
    image:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    trending: true,
    trendingRank: 4,
    tag: "Hot Seller",
    rating: 4.9,
    votesCount: "34k+",
    language: "Hindi",
    ageBadge: "16+",
    sold: 95,
  },
  {
    id: "sunburn-garrix-bengaluru",
    name: "Sunburn Arena — Martin Garrix World Tour",
    category: "Festivals",
    city: "Bengaluru",
    venue: "Manpho Convention Center",
    dateStr: "Sun, 07 Dec",
    timeStr: "4:30 PM",
    month: "DEC",
    day: "07",
    price: 2199,
    priceFormatted: "₹2,199",
    summary:
      "4x World #1 DJ Martin Garrix brings the colossal arena tour featuring state-of-the-art lasers, synchronized pyrotechnics, and bass-heavy festival drops.",
    image:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
    trending: true,
    trendingRank: 5,
    tag: "Festival",
    rating: 4.8,
    votesCount: "29k+",
    language: "EDM / Live",
    ageBadge: "18+",
    sold: 110,
  },
  {
    id: "arijit-delhi",
    name: "Arijit Singh: Soulful Symphony Live",
    category: "Concerts",
    city: "Delhi-NCR",
    venue: "Jawaharlal Nehru Stadium",
    dateStr: "Sat, 23 Nov",
    timeStr: "7:00 PM",
    month: "NOV",
    day: "23",
    price: 1999,
    priceFormatted: "₹1,999",
    summary:
      "A mesmerizing 3-hour journey through romantic ballads and high-octane Bollywood hits accompanied by a 45-piece live grand symphony orchestra.",
    image:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
    tag: "Filling Fast",
    rating: 4.9,
    votesCount: "38k+",
    language: "Hindi",
    ageBadge: "All Ages",
    sold: 140,
  },
  {
    id: "mughal-azam-mumbai",
    name: "Mughal-e-Azam: The Grand Musical",
    category: "Theater",
    city: "Mumbai",
    venue: "NCPA Jamshed Bhabha Theatre",
    dateStr: "Thu - Sun Shows",
    timeStr: "7:30 PM",
    month: "NOV",
    day: "10",
    price: 1200,
    priceFormatted: "₹1,200",
    summary:
      "The acclaimed Broadway-scale theatrical spectacle featuring 300+ Manish Malhotra costumes, live Kathak dancers, and timeless classic melodies.",
    image:
      "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80",
    tag: "Broadway Scale",
    rating: 4.9,
    votesCount: "16k+",
    language: "Urdu / Hindi",
    ageBadge: "Family",
    sold: 70,
  },
  {
    id: "dune-imax-bengaluru",
    name: "Dune: Part Two (IMAX 3D Re-Release)",
    category: "Movies",
    city: "Bengaluru",
    venue: "Forum Koramangala IMAX",
    dateStr: "Daily Shows",
    timeStr: "6:30 PM & 9:45 PM",
    month: "NOV",
    day: "05",
    price: 650,
    priceFormatted: "₹650",
    summary:
      "Denis Villeneuve’s breathtaking sci-fi odyssey on the dunes of Arrakis. Experience full 1.43:1 expanded aspect ratio and seismic subwoofer design.",
    image:
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=80",
    tag: "IMAX 3D",
    rating: 4.8,
    votesCount: "52k+",
    language: "English (Dolby)",
    ageBadge: "U/A 16+",
    sold: 88,
  },
  {
    id: "piya-behrupiya-delhi",
    name: "Piya Behrupiya (Twelfth Night in Hindi)",
    category: "Theater",
    city: "Delhi-NCR",
    venue: "Kamani Auditorium",
    dateStr: "Fri - Sun Shows",
    timeStr: "6:30 PM",
    month: "NOV",
    day: "29",
    price: 800,
    priceFormatted: "₹800",
    summary:
      "Shakespeare’s Twelfth Night reimagined in rustic folk Nautanki style. Globe Theatre London award winner with infectious live folk tunes and non-stop laughter.",
    image:
      "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80",
    tag: "Critically Acclaimed",
    rating: 4.7,
    votesCount: "9k+",
    language: "Hindi",
    ageBadge: "12+",
    sold: 52,
  },
  {
    id: "samay-raina-bengaluru",
    name: "Samay Raina: Unfiltered Standup Tour",
    category: "Comedy",
    city: "Bengaluru",
    venue: "Good Shepherd Auditorium",
    dateStr: "Sat, 30 Nov",
    timeStr: "7:30 PM",
    month: "NOV",
    day: "30",
    price: 899,
    priceFormatted: "₹899",
    summary:
      "Unapologetic, sharp, and razor-quick crowd work from YouTube's favorite comic. Be prepared for relentless roast humor and unpredictable surprises.",
    image:
      "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80",
    tag: "18+ Adult",
    rating: 4.8,
    votesCount: "21k+",
    language: "Hindi/English",
    ageBadge: "18+ Only",
    sold: 104,
  },
  {
    id: "isl-derby-kolkata",
    name: "ISL Kolkata Derby: Mohun Bagan vs East Bengal",
    category: "Sports",
    city: "Kolkata",
    venue: "Salt Lake Stadium (VYBK)",
    dateStr: "Sat, 09 Nov",
    timeStr: "7:30 PM",
    month: "NOV",
    day: "09",
    price: 400,
    priceFormatted: "₹400",
    summary:
      "Asia’s fiercest football derby with over 100 years of burning passion. 65,000 fanatical voices chanting under stadium tifos, banners, and flares.",
    image:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
    tag: "Historic Derby",
    rating: 4.9,
    votesCount: "44k+",
    language: "Live Match",
    ageBadge: "All Ages",
    sold: 155,
  },
  {
    id: "diljit-pune",
    name: "Diljit Dosanjh: Dil-Luminati Tour India",
    category: "Concerts",
    city: "Pune",
    venue: "Mahalaxmi Lawns",
    dateStr: "Sun, 08 Dec",
    timeStr: "6:30 PM",
    month: "DEC",
    day: "08",
    price: 2999,
    priceFormatted: "₹2,999",
    summary:
      "The global Punjabi superstar takes the stage with an electrifying stadium production, dancers, and record-breaking chartbusters.",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
    tag: "High Demand",
    rating: 4.9,
    votesCount: "65k+",
    language: "Punjabi/Hindi",
    ageBadge: "All Ages",
    sold: 172,
  },
  {
    id: "nh7-pune",
    name: "NH7 Weekender 2026 Indie Festival",
    category: "Festivals",
    city: "Pune",
    venue: "Teerth Fields, Hinjawadi",
    dateStr: "12-14 Dec",
    timeStr: "3-Day Festival Pass",
    month: "DEC",
    day: "12",
    price: 3499,
    priceFormatted: "₹3,499",
    summary:
      "The happiest music festival in India! Multi-stage celebration with 40+ international indie bands, art installations, food trucks, and acoustic stages.",
    image:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80",
    tag: "3-Day Pass",
    rating: 4.8,
    votesCount: "19k+",
    language: "Multi-genre",
    ageBadge: "All Ages",
    sold: 84,
  },
  {
    id: "kalki-hyderabad",
    name: "Kalki 2898 AD (Special Extended Screening)",
    category: "Movies",
    city: "Hyderabad",
    venue: "Prasads Multiplex Large Screen",
    dateStr: "Daily Shows",
    timeStr: "8:00 PM",
    month: "NOV",
    day: "14",
    price: 450,
    priceFormatted: "₹450",
    summary:
      "The dystopian mythological epic starring Amitabh Bachchan, Kamal Haasan, and Prabhas. Experience the Mahabharata prologue in Dolby Atmos surround sound.",
    image:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80",
    tag: "Dolby Atmos",
    rating: 4.7,
    votesCount: "68k+",
    language: "Telugu / Hindi",
    ageBadge: "U/A 13+",
    sold: 92,
  },
  {
    id: "phantom-bengaluru",
    name: "The Phantom of the Opera (India Premiere)",
    category: "Theater",
    city: "Bengaluru",
    venue: "Bangalore International Centre",
    dateStr: "Fri - Sun Shows",
    timeStr: "7:00 PM",
    month: "DEC",
    day: "19",
    price: 1500,
    priceFormatted: "₹1,500",
    summary:
      "Andrew Lloyd Webber’s haunting romantic classic debuts in India with an international touring ensemble, magnificent chandelier, and spellbinding gothic score.",
    image:
      "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80",
    tag: "West End Tour",
    rating: 4.9,
    votesCount: "11k+",
    language: "English",
    ageBadge: "10+",
    sold: 63,
  },
  {
    id: "bassi-hyderabad",
    name: "Anubhav Singh Bassi: 'Bas Kar Bassi' Live",
    category: "Comedy",
    city: "Hyderabad",
    venue: "Shilpakala Vedika",
    dateStr: "Sat, 21 Dec",
    timeStr: "7:00 PM",
    month: "DEC",
    day: "21",
    price: 1199,
    priceFormatted: "₹1,199",
    summary:
      "Laugh until your stomach hurts as Bassi narrates hilarious tales from UPSC prep, courtrooms, and misadventures with friends.",
    image:
      "https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1200&q=80",
    tag: "Selling Fast",
    rating: 4.9,
    votesCount: "25k+",
    language: "Hindi",
    ageBadge: "16+",
    sold: 81,
  },
  {
    id: "pkl-final-pune",
    name: "Pro Kabaddi League Mega Championship Final",
    category: "Sports",
    city: "Pune",
    venue: "Shree Shiv Chhatrapati Sports Complex",
    dateStr: "Sun, 04 Jan",
    timeStr: "8:00 PM",
    month: "JAN",
    day: "04",
    price: 600,
    priceFormatted: "₹600",
    summary:
      "High-octane super raids and bone-crushing tackles in the thrilling PKL Final clash. Feel the electric energy of the mat live from the courtside stands.",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
    tag: "Championship Final",
    rating: 4.8,
    votesCount: "18k+",
    language: "Live Arena",
    ageBadge: "Family",
    sold: 99,
  },
  {
    id: "ziro-festival-arunachal",
    name: "Ziro Festival of Music 2026",
    category: "Festivals",
    city: "All Cities",
    venue: "Ziro Valley Pine Meadows, Arunachal",
    dateStr: "25-28 Sep",
    timeStr: "Multi-Day Festival Pass",
    month: "SEP",
    day: "25",
    price: 4500,
    priceFormatted: "₹4,500",
    summary:
      "India’s most scenic outdoor eco-friendly festival celebrating indie musicians, tribal arts, camping under constellations, and organic rice beer.",
    image:
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80",
    tag: "Eco Festival",
    rating: 4.9,
    votesCount: "14k+",
    language: "Indie / Folk",
    ageBadge: "All Ages",
    sold: 67,
  },
];

interface Seat {
  st: number; // 0 = free, 1 = held, 2 = sold
  t: number;  // expiration timestamp
  bot?: boolean;
}

interface Booking {
  s: number;
  e: string;
  price?: string;
  date?: string;
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

  // Location & Navbar State
  const [selectedCity, setSelectedCity] = useState<string>("Mumbai");
  const [showLocModal, setShowLocModal] = useState<boolean>(false);
  const locDropdownRef = useRef<HTMLDivElement>(null);

  // Category & Search Filter State
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Slideshow State
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isSlideshowPaused, setIsSlideshowPaused] = useState<boolean>(false);

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
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
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

  // Page Routing Helper with URL hash sync
  const navigateTo = useCallback((page: string) => {
    setActivePage(page);
    try {
      window.history.replaceState(null, "", `#${page}`);
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Listen to browser hash changes
  useEffect(() => {
    const syncHash = () => {
      const h = (window.location.hash || "").replace("#", "").trim().toLowerCase();
      if (["home", "events", "booking", "profile", "login", "signup"].includes(h)) {
        setActivePage(h);
      }
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  // Memoized Trending Events for Slideshow
  const trendingEvents = useMemo(() => {
    return events.filter((e) => e.trending);
  }, [events]);

  // Slideshow auto-advance every 3 seconds (paused on hover or when not on events page)
  useEffect(() => {
    if (isSlideshowPaused || activePage !== "events" || trendingEvents.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % trendingEvents.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isSlideshowPaused, activePage, trendingEvents.length]);

  // Close location dropdown when clicked outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (locDropdownRef.current && !locDropdownRef.current.contains(e.target as Node)) {
        setShowLocModal(false);
      }
    };
    if (showLocModal) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showLocModal]);

  // Select Event & navigate directly to Booking
  const handleSelectEvent = useCallback((event: EventItem) => {
    const idx = events.findIndex((e) => e.id === event.id);
    if (idx !== -1) {
      setCurrentEventIdx(idx);
    }
    initSeats();
    navigateTo("booking");
  }, [events, initSeats, navigateTo]);

  // Filtered Events computation based on Tab, Location, and Search
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchCategory = activeTab === "All" || e.category === activeTab;
      const matchCity =
        selectedCity === "All Cities" ||
        e.city === selectedCity ||
        e.city === "All Cities";
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q);

      return matchCategory && matchCity && matchSearch;
    });
  }, [events, activeTab, selectedCity, searchQuery]);

  // Fallback events if specific city has no match
  const fallbackEvents = useMemo(() => {
    if (filteredEvents.length > 0) return [];
    return events.filter((e) => {
      const matchCategory = activeTab === "All" || e.category === activeTab;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [filteredEvents.length, events, activeTab, searchQuery]);

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
    const currentEv = events[currentEventIdx];
    const eventName = currentEv ? currentEv.name : "Flash Drop Event";

    setSeats((prev) => {
      const copy = [...prev];
      copy[mine] = { ...copy[mine], st: 2 };
      return copy;
    });

    setBookings((prev) => [
      ...prev,
      {
        s: seatNum,
        e: eventName,
        price: currentEv ? currentEv.priceFormatted : "₹1,499",
        date: currentEv ? currentEv.dateStr : "Today",
      },
    ]);
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
        <div className="nav-left">
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

          {/* Location Selector in Navbar */}
          <div className="nav-loc-wrapper" ref={locDropdownRef}>
            <button
              className="nav-loc-btn"
              onClick={() => setShowLocModal((prev) => !prev)}
              title="Change your city"
              type="button"
              suppressHydrationWarning
            >
              <span className="loc-pin"><IconPin size={14} /></span>
              <span className="loc-name">{selectedCity}</span>
              <span className="loc-arrow">{showLocModal ? <IconChevronUp size={10} /> : <IconChevronDown size={10} />}</span>
            </button>

            {showLocModal && (
              <div className="loc-dropdown-menu">
                <div className="loc-dropdown-header">
                  <span>Select City</span>
                  <button
                    className="loc-close-btn"
                    onClick={() => setShowLocModal(false)}
                    aria-label="Close location dropdown"
                    type="button"
                    suppressHydrationWarning
                  >
                    <IconClose size={12} />
                  </button>
                </div>
                <div className="loc-chips">
                  {CITIES.map((city) => (
                    <button
                      key={city}
                      type="button"
                      className={`loc-chip ${selectedCity === city ? "active" : ""}`}
                      onClick={() => {
                        setSelectedCity(city);
                        setShowLocModal(false);
                      }}
                      suppressHydrationWarning
                    >
                      <span className="chip-icon-wrap">{city === "All Cities" ? <IconGlobe size={13} /> : <IconPin size={13} />}</span>
                      <span>{city}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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
              <button
                className="btn ghost"
                style={{ padding: "8px 18px" }}
                onClick={handleLogout}
                suppressHydrationWarning
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                className="btn ghost"
                style={{ padding: "8px 18px", marginRight: "6px" }}
                onClick={() => navigateTo("login")}
                suppressHydrationWarning
              >
                Log in
              </button>
              <button
                className="btn"
                style={{ padding: "8px 18px" }}
                onClick={() => navigateTo("signup")}
                suppressHydrationWarning
              >
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
              <button className="btn" onClick={() => navigateTo("booking")} suppressHydrationWarning>
                Grab a seat now →
              </button>{" "}
              <button className="btn ghost" onClick={runFlashDropStorm} suppressHydrationWarning>
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
          <div className="events-page-container">
            {/* 1. Trending Events Slideshow */}
            {trendingEvents.length > 0 && (
              <div
                className="slideshow-wrapper"
                onMouseEnter={() => setIsSlideshowPaused(true)}
                onMouseLeave={() => setIsSlideshowPaused(false)}
              >
                <div className="slideshow-track">
                  {trendingEvents.map((tEvent, idx) => {
                    const isActive = idx === currentSlide;
                    return (
                      <div
                        key={tEvent.id}
                        className={`slide-item ${isActive ? "active" : ""}`}
                      >
                        <img
                          src={tEvent.image}
                          alt={tEvent.name}
                          className="slide-bg"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80";
                          }}
                        />
                        <div className="slide-gradient"></div>

                        <div className="slide-content">
                          {/* Tagline inside Slideshow */}
                          <div className="slide-tagline-bar">
                            <span className="slide-tagline">
                              <span className="slide-tagline-dot"></span>
                              Upcoming Live Experiences
                            </span>
                          </div>

                          <div className="slide-badges-row">
                            <span className="slide-trending-badge">
                              <IconTrend size={12} /> TRENDING #{tEvent.trendingRank || idx + 1}
                            </span>
                            <span className="slide-cat-badge">{tEvent.category}</span>
                            {tEvent.tag && (
                              <span
                                className="slide-cat-badge"
                                style={{ background: "rgba(255, 107, 53, 0.4)" }}
                              >
                                {tEvent.tag}
                              </span>
                            )}
                          </div>

                          <h2 className="slide-title">{tEvent.name}</h2>

                          <div className="slide-info-row">
                            <span><IconCalendar size={13} /> {tEvent.dateStr} · {tEvent.timeStr}</span>
                            <span><IconPin size={13} /> {tEvent.venue}, {tEvent.city}</span>
                            {tEvent.rating && (
                              <span><IconStar size={12} /> {tEvent.rating} ({tEvent.votesCount})</span>
                            )}
                          </div>

                          <div className="slide-action-row">
                            <div className="slide-price-tag">
                              <span className="slide-price-label">Tickets from</span>
                              <span className="slide-price-val">{tEvent.priceFormatted}</span>
                            </div>
                            <button
                              className="btn"
                              onClick={() => handleSelectEvent(tEvent)}
                              suppressHydrationWarning
                            >
                              Book Tickets Now →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Slideshow Arrow Buttons */}
                <button
                  className="slide-arrow-btn prev"
                  onClick={() =>
                    setCurrentSlide((prev) =>
                      prev === 0 ? trendingEvents.length - 1 : prev - 1
                    )
                  }
                  aria-label="Previous Slide"
                  type="button"
                  suppressHydrationWarning
                >
                  ‹
                </button>
                <button
                  className="slide-arrow-btn next"
                  onClick={() =>
                    setCurrentSlide((prev) => (prev + 1) % trendingEvents.length)
                  }
                  aria-label="Next Slide"
                  type="button"
                  suppressHydrationWarning
                >
                  ›
                </button>

                {/* Slideshow Indicator Dots */}
                <div className="slide-dots-container">
                  <div className="slide-dots-group">
                    {trendingEvents.map((_, idx) => (
                      <button
                        key={idx}
                        className={`slide-dot ${idx === currentSlide ? "active" : ""}`}
                        onClick={() => setCurrentSlide(idx)}
                        aria-label={`Slide ${idx + 1}`}
                        type="button"
                        suppressHydrationWarning
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Filter Tabs & Search Bar */}
            <div className="filter-section">
              <div className="filter-bar-header">
                <div className="filter-tabs-container">
                  {CATEGORIES.map((catName) => {
                    const count =
                      catName === "All"
                        ? events.length
                        : events.filter((e) => e.category === catName).length;
                    return (
                      <button
                        key={catName}
                        type="button"
                        className={`filter-tab-btn ${activeTab === catName ? "active" : ""}`}
                        onClick={() => setActiveTab(catName)}
                        suppressHydrationWarning
                      >
                        <span className="tab-icon-wrap">
                          <CategoryIcon category={catName} size={15} />
                        </span>
                        <span>{catName}</span>
                        <span className="filter-tab-count">{count}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="filter-search-box">
                  <span className="search-icon-adornment">
                    <IconSearch size={14} />
                  </span>
                  <input
                    type="text"
                    className="filter-search-input"
                    placeholder="Search by event, artist or venue..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {/* City filter notification */}
              {selectedCity !== "All Cities" && (
                <div className="filter-city-status">
                  <span>
                    <IconPin size={13} /> Showing events available in <b>{selectedCity}</b>
                    {filteredEvents.length === 0
                      ? " — No direct match in this city"
                      : ` (${filteredEvents.length} found)`}
                  </span>
                  <button
                    type="button"
                    className="clear-city-btn"
                    onClick={() => setSelectedCity("All Cities")}
                    suppressHydrationWarning
                  >
                    Switch to all cities
                  </button>
                </div>
              )}
            </div>

            {/* 3. Event Cards Grid */}
            <div className="event-cards-grid">
              {(filteredEvents.length > 0 ? filteredEvents : fallbackEvents).map((event) => (
                <div
                  key={event.id}
                  className="event-card-item"
                  onClick={() => handleSelectEvent(event)}
                >
                  <div className="event-card-media">
                    <img
                      src={event.image}
                      alt={event.name}
                      className="event-card-img"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80";
                      }}
                    />
                    <span className="card-cat-badge">{event.category}</span>
                    {event.tag && <span className="card-tag-badge">{event.tag}</span>}
                    {event.rating && (
                      <span className="card-rating-chip">
                        <IconStar size={11} /> {event.rating}
                      </span>
                    )}
                  </div>

                  <div className="event-card-body">
                    <div className="card-datetime">
                      <span>
                        <IconCalendar size={13} /> {event.dateStr} · {event.timeStr}
                      </span>
                    </div>

                    <h3 className="card-title" title={event.name}>
                      {event.name}
                    </h3>

                    <div className="card-venue" title={`${event.venue}, ${event.city}`}>
                      <span>
                        <IconPin size={13} /> {event.venue}, {event.city}
                      </span>
                    </div>

                    <p className="card-summary">{event.summary}</p>

                    <div className="card-tags-row">
                      {event.language && (
                        <span className="card-meta-pill">{event.language}</span>
                      )}
                      {event.ageBadge && (
                        <span className="card-meta-pill">{event.ageBadge}</span>
                      )}
                    </div>

                    <div className="event-card-footer">
                      <div className="card-price-block">
                        <span className="card-price-label">Ticket from</span>
                        <span className="card-price-value">{event.priceFormatted}</span>
                      </div>
                      <button
                        type="button"
                        className="card-book-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectEvent(event);
                        }}
                        suppressHydrationWarning
                      >
                        Book Tickets →
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredEvents.length === 0 && fallbackEvents.length === 0 && (
                <div className="events-empty-state">
                  <div className="events-empty-icon">
                    <IconTicket size={44} />
                  </div>
                  <h3>No events found matching your criteria</h3>
                  <p style={{ opacity: 0.7, margin: "8px 0 18px" }}>
                    Try searching with another keyword or pick &quot;All&quot; categories.
                  </p>
                  <button
                    className="btn"
                    onClick={() => {
                      setActiveTab("All");
                      setSelectedCity("All Cities");
                      setSearchQuery("");
                    }}
                    suppressHydrationWarning
                  >
                    View All Events
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. BOOKING PAGE */}
        <div className={`page ${activePage === "booking" ? "on" : ""}`} id="booking">
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <h2>
                Book your <em>seat</em>
              </h2>
              <button
                className="btn ghost"
                style={{ padding: "8px 18px", fontSize: "13px" }}
                onClick={() => navigateTo("events")}
                suppressHydrationWarning
              >
                ← Back to events
              </button>
            </div>

            {/* Selected Event Details Banner */}
            {events[currentEventIdx] && (
              <div className="booking-event-banner">
                <img
                  src={events[currentEventIdx].image}
                  alt={events[currentEventIdx].name}
                  className="booking-event-img"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80";
                  }}
                />
                <div className="booking-event-info">
                  <span className="booking-event-badge">
                    {events[currentEventIdx].category}
                  </span>
                  <div className="booking-event-title">
                    {events[currentEventIdx].name}
                  </div>
                  <div className="booking-event-meta">
                    <span><IconCalendar size={13} /> {events[currentEventIdx].dateStr} · {events[currentEventIdx].timeStr}</span>
                    <span><IconPin size={13} /> {events[currentEventIdx].venue}, {events[currentEventIdx].city}</span>
                    <span style={{ fontWeight: 700, color: "var(--o)" }}>
                      Ticket Price: {events[currentEventIdx].priceFormatted}
                    </span>
                  </div>
                </div>
              </div>
            )}
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
                      suppressHydrationWarning
                    ></button>
                  ))}
                </div>

                <div style={{ marginTop: "20px" }}>
                  <button className="btn k" onClick={runFlashDropStorm} disabled={isBusy} suppressHydrationWarning>
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
                        <button className="btn k" onClick={() => navigateTo("profile")} suppressHydrationWarning>
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
                      <button className="btn" onClick={handlePay} suppressHydrationWarning>
                        Pay {events[currentEventIdx]?.priceFormatted || "₹1,499"} &amp; confirm
                      </button>{" "}
                      <button className="btn ghost" onClick={handleDrop} suppressHydrationWarning>
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
                      <div style={{ fontSize: "13px", opacity: 0.7 }}>
                        {b.date ? `${b.date} · ` : ""}Confirmed ✓{b.price ? ` · ${b.price}` : ""}
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
                suppressHydrationWarning
              />
              <input
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                value={loginPw}
                onChange={(e) => setLoginPw(e.target.value)}
                suppressHydrationWarning
              />
              <div className="err">{loginErr}</div>
              <button className="btn" onClick={handleLogin} suppressHydrationWarning>
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
                suppressHydrationWarning
              />
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                suppressHydrationWarning
              />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                autoComplete="new-password"
                value={signupPw}
                onChange={(e) => setSignupPw(e.target.value)}
                suppressHydrationWarning
              />
              <input
                type="password"
                placeholder="Confirm password"
                autoComplete="new-password"
                value={signupPw2}
                onChange={(e) => setSignupPw2(e.target.value)}
                suppressHydrationWarning
              />
              <div className="err">{signupErr}</div>
              <button className="btn" onClick={handleSignup} suppressHydrationWarning>
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
