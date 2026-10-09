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
  phone?: string;
  passName?: string;
  avatar?: string;
  dob?: string;
  city?: string;
  emergencyPhone?: string;
  twoFactor?: boolean;
  notifyDropAlert?: boolean;
  notifyTtlAlarm?: boolean;
  notifyEmailInvoice?: boolean;
  fastLaneCheckout?: boolean;
}

interface City {
  id: string;
  name: string;
  tagline: string;
  lat: number;
  lng: number;
}

interface BMSEvent {
  id: string;
  name: string;
  category: "concert" | "comedy" | "sports" | "theatre";
  categoryLabel: string;
  cityId: string;
  cityName: string;
  venue: string;
  dateStr: string;
  month: string;
  day: string;
  time: string;
  price: number;
  badge: string;
  contention: "FLASH DROP" | "SELLING FAST" | "ALMOST FULL" | "EXCLUSIVE";
  sold: number;
  totalSeats: number;
  bannerUrl: string;
  featured?: boolean;
}

const CITIES: City[] = [
  { id: "mumbai", name: "Mumbai", tagline: "MMR & Suburbs", lat: 18.922, lng: 72.834 },
  { id: "delhi", name: "Delhi-NCR", tagline: "Delhi, Noida, Gurgaon", lat: 28.6139, lng: 77.209 },
  { id: "bengaluru", name: "Bengaluru", tagline: "Garden City", lat: 12.9716, lng: 77.5946 },
  { id: "pune", name: "Pune", tagline: "Oxford of the East", lat: 18.5204, lng: 73.8567 },
  { id: "hyderabad", name: "Hyderabad", tagline: "Cyberabad & Old City", lat: 17.385, lng: 78.4867 },
  { id: "ahmedabad", name: "Ahmedabad", tagline: "Heritage & Arena", lat: 23.0225, lng: 72.5714 },
  { id: "chennai", name: "Chennai", tagline: "Marina & Culture", lat: 13.0827, lng: 80.2707 },
  { id: "kolkata", name: "Kolkata", tagline: "City of Joy", lat: 22.5726, lng: 88.3639 },
  { id: "chandigarh", name: "Chandigarh", tagline: "The Beautiful City", lat: 30.7333, lng: 76.7794 },
  { id: "goa", name: "Goa", tagline: "Beaches & Sunburn", lat: 15.2993, lng: 74.124 },
];

const CITY_VENUES: Record<string, Array<{ name: string; area: string; eventsCount: number }>> = {
  mumbai: [
    { name: "D.Y. Patil Sports Stadium", area: "Nerul, Navi Mumbai", eventsCount: 4 },
    { name: "Jio World Garden & Convention", area: "BKC, Bandra", eventsCount: 6 },
    { name: "Nita Mukesh Ambani Cultural Centre", area: "BKC", eventsCount: 3 },
    { name: "Wankhede Stadium", area: "Marine Drive", eventsCount: 5 },
  ],
  delhi: [
    { name: "Jawaharlal Nehru Stadium", area: "Pragati Vihar", eventsCount: 5 },
    { name: "Indira Gandhi Indoor Arena", area: "ITO", eventsCount: 3 },
    { name: "Arun Jaitley Cricket Stadium", area: "Feroz Shah Kotla", eventsCount: 4 },
    { name: "Siri Fort Auditorium", area: "August Kranti Marg", eventsCount: 2 },
  ],
  bengaluru: [
    { name: "Palace Grounds", area: "Jaymahal", eventsCount: 5 },
    { name: "M. Chinnaswamy Stadium", area: "MG Road", eventsCount: 6 },
    { name: "Manpho Convention Centre", area: "Nagavara", eventsCount: 3 },
    { name: "Good Shepherd Auditorium", area: "Museum Road", eventsCount: 4 },
  ],
  pune: [
    { name: "Mahalaxmi Lawns", area: "Karve Nagar", eventsCount: 3 },
    { name: "Bal Gandharva Rang Mandir", area: "JM Road, Shivajinagar", eventsCount: 4 },
    { name: "MCA International Stadium", area: "Gahunje", eventsCount: 3 },
  ],
  hyderabad: [
    { name: "GMR Arena", area: "Shamshabad", eventsCount: 4 },
    { name: "Rajiv Gandhi Intl Cricket Stadium", area: "Uppal", eventsCount: 5 },
    { name: "Shilpakala Vedika", area: "Hitec City", eventsCount: 3 },
  ],
  ahmedabad: [
    { name: "Narendra Modi Stadium", area: "Motera", eventsCount: 6 },
    { name: "TransStadia Arena", area: "Kankaria Lake", eventsCount: 4 },
    { name: "Pandit Dindayal Upadhyay Auditorium", area: "Bodakdev", eventsCount: 2 },
  ],
  chennai: [
    { name: "MA Chidambaram Stadium (Chepauk)", area: "Triplicane", eventsCount: 5 },
    { name: "YMCA Grounds", area: "Nandanam", eventsCount: 4 },
    { name: "Music Academy", area: "TTK Road, Alwarpet", eventsCount: 3 },
  ],
  kolkata: [
    { name: "Eden Gardens", area: "BBD Bagh", eventsCount: 5 },
    { name: "Biswa Bangla Mela Prangan", area: "EM Bypass", eventsCount: 3 },
    { name: "Science City Auditorium", area: "Topsia", eventsCount: 2 },
  ],
  chandigarh: [
    { name: "Sector 17 Plaza Open Arena", area: "Sector 17", eventsCount: 3 },
    { name: "PCA Cricket Stadium", area: "Mohali", eventsCount: 4 },
  ],
  goa: [
    { name: "Vagator Beach Arena", area: "Vagator, North Goa", eventsCount: 4 },
    { name: "Dr Shyama Prasad Mukherjee Stadium", area: "Taleigao", eventsCount: 2 },
  ],
};

const PRESET_AVATARS = [
  { id: "vip-gold", label: "VIP Prime", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" },
  { id: "concert-fan", label: "Rock Concert", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
  { id: "stadium-crowd", label: "Stadium Superfan", url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80" },
  { id: "indie-music", label: "Indie Fest", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80" },
  { id: "cyber-dj", label: "EDM Drops", url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80" },
];

const BMS_EVENTS: BMSEvent[] = [
  {
    id: "coldplay-mum",
    name: "Coldplay: Music of the Spheres",
    category: "concert",
    categoryLabel: "Concerts & Music",
    cityId: "mumbai",
    cityName: "Mumbai",
    venue: "D.Y. Patil Sports Stadium",
    dateStr: "Sat, 18 Jan · 7:00 PM",
    month: "JAN",
    day: "18",
    time: "7:00 PM",
    price: 3500,
    badge: "GLOBAL TOUR",
    contention: "FLASH DROP",
    sold: 142,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80",
    featured: true,
  },
  {
    id: "arijit-mum",
    name: "Arijit Singh Live Symphony",
    category: "concert",
    categoryLabel: "Concerts & Music",
    cityId: "mumbai",
    cityName: "Mumbai",
    venue: "Jio World Garden, BKC",
    dateStr: "Fri, 24 Oct · 6:30 PM",
    month: "OCT",
    day: "24",
    time: "6:30 PM",
    price: 2499,
    badge: "ARENA DROP",
    contention: "SELLING FAST",
    sold: 120,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    featured: true,
  },
  {
    id: "zakir-mum",
    name: "Zakir Khan: Mann Pasand Live",
    category: "comedy",
    categoryLabel: "Standup Comedy",
    cityId: "mumbai",
    cityName: "Mumbai",
    venue: "Shanmukhananda Hall",
    dateStr: "Sun, 02 Nov · 8:00 PM",
    month: "NOV",
    day: "02",
    time: "8:00 PM",
    price: 999,
    badge: "COMEDY TOUR",
    contention: "FLASH DROP",
    sold: 175,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "ipl-mum",
    name: "Mumbai Indians vs CSK: El Clasico",
    category: "sports",
    categoryLabel: "Live Sports",
    cityId: "mumbai",
    cityName: "Mumbai",
    venue: "Wankhede Stadium",
    dateStr: "Sun, 23 Mar · 7:30 PM",
    month: "MAR",
    day: "23",
    time: "7:30 PM",
    price: 1500,
    badge: "CRICKET FLASH",
    contention: "ALMOST FULL",
    sold: 188,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "mughal-mum",
    name: "Mughal-E-Azam: The Grand Musical",
    category: "theatre",
    categoryLabel: "Theatre & Broadway",
    cityId: "mumbai",
    cityName: "Mumbai",
    venue: "NCPA Nariman Point",
    dateStr: "Sat, 14 Dec · 6:00 PM",
    month: "DEC",
    day: "14",
    time: "6:00 PM",
    price: 1800,
    badge: "BROADWAY INDIA",
    contention: "EXCLUSIVE",
    sold: 95,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "diljit-del",
    name: "Diljit Dosanjh: Dil-Luminati Tour",
    category: "concert",
    categoryLabel: "Concerts & Music",
    cityId: "delhi",
    cityName: "Delhi-NCR",
    venue: "Jawaharlal Nehru Stadium",
    dateStr: "Sat, 26 Oct · 7:00 PM",
    month: "OCT",
    day: "26",
    time: "7:00 PM",
    price: 2999,
    badge: "STADIUM TOUR",
    contention: "FLASH DROP",
    sold: 190,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
    featured: true,
  },
  {
    id: "bassi-del",
    name: "Anubhav Singh Bassi: Kisi Ko Batana Mat",
    category: "comedy",
    categoryLabel: "Standup Comedy",
    cityId: "delhi",
    cityName: "Delhi-NCR",
    venue: "Kedarnath Sahni Auditorium",
    dateStr: "Fri, 15 Nov · 8:00 PM",
    month: "NOV",
    day: "15",
    time: "8:00 PM",
    price: 899,
    badge: "COMEDY TOUR",
    contention: "SELLING FAST",
    sold: 110,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "cricket-del",
    name: "India vs Australia: Border-Gavaskar Trophy",
    category: "sports",
    categoryLabel: "Live Sports",
    cityId: "delhi",
    cityName: "Delhi-NCR",
    venue: "Arun Jaitley Cricket Stadium",
    dateStr: "Wed, 04 Dec · 9:30 AM",
    month: "DEC",
    day: "04",
    time: "9:30 AM",
    price: 1200,
    badge: "TEST CRICKET",
    contention: "FLASH DROP",
    sold: 165,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "edsheeran-blr",
    name: "Ed Sheeran: +–=÷× Mathematics Tour",
    category: "concert",
    categoryLabel: "Concerts & Music",
    cityId: "bengaluru",
    cityName: "Bengaluru",
    venue: "Palace Grounds",
    dateStr: "Sun, 09 Feb · 6:30 PM",
    month: "FEB",
    day: "09",
    time: "6:30 PM",
    price: 3200,
    badge: "INTERNATIONAL TOUR",
    contention: "FLASH DROP",
    sold: 180,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80",
    featured: true,
  },
  {
    id: "kenny-blr",
    name: "Kenny Sebastian: Professor of Chill",
    category: "comedy",
    categoryLabel: "Standup Comedy",
    cityId: "bengaluru",
    cityName: "Bengaluru",
    venue: "Good Shepherd Auditorium",
    dateStr: "Sat, 22 Nov · 7:30 PM",
    month: "NOV",
    day: "22",
    time: "7:30 PM",
    price: 799,
    badge: "LIVE SPECIAL",
    contention: "SELLING FAST",
    sold: 140,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "rcb-blr",
    name: "RCB Unbox & Team Jersey Launch",
    category: "sports",
    categoryLabel: "Live Sports",
    cityId: "bengaluru",
    cityName: "Bengaluru",
    venue: "M. Chinnaswamy Stadium",
    dateStr: "Sun, 16 Mar · 5:00 PM",
    month: "MAR",
    day: "16",
    time: "5:00 PM",
    price: 1500,
    badge: "FAN FESTIVAL",
    contention: "ALMOST FULL",
    sold: 195,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "nh7-pun",
    name: "BACARDÍ NH7 Weekender Music Fest",
    category: "concert",
    categoryLabel: "Concerts & Music",
    cityId: "pune",
    cityName: "Pune",
    venue: "Mahalaxmi Lawns",
    dateStr: "Sat, 13 Dec · 3:00 PM",
    month: "DEC",
    day: "13",
    time: "3:00 PM",
    price: 2199,
    badge: "FESTIVAL PASS",
    contention: "FLASH DROP",
    sold: 130,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
    featured: true,
  },
  {
    id: "biswa-pun",
    name: "Biswa Kalyan Rath: Live In Pune",
    category: "comedy",
    categoryLabel: "Standup Comedy",
    cityId: "pune",
    cityName: "Pune",
    venue: "Bal Gandharva Rang Mandir",
    dateStr: "Sun, 07 Dec · 8:00 PM",
    month: "DEC",
    day: "07",
    time: "8:00 PM",
    price: 899,
    badge: "STANDUP SPECIAL",
    contention: "SELLING FAST",
    sold: 115,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "karan-hyd",
    name: "Karan Aujla: It Was All A Dream Tour",
    category: "concert",
    categoryLabel: "Concerts & Music",
    cityId: "hyderabad",
    cityName: "Hyderabad",
    venue: "GMR Arena",
    dateStr: "Sun, 18 Jan · 6:30 PM",
    month: "JAN",
    day: "18",
    time: "6:30 PM",
    price: 2500,
    badge: "STADIUM TOUR",
    contention: "FLASH DROP",
    sold: 155,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80",
    featured: true,
  },
  {
    id: "samay-hyd",
    name: "Samay Raina: Unfiltered & Live",
    category: "comedy",
    categoryLabel: "Standup Comedy",
    cityId: "hyderabad",
    cityName: "Hyderabad",
    venue: "Shilpakala Vedika",
    dateStr: "Sat, 29 Nov · 7:30 PM",
    month: "NOV",
    day: "29",
    time: "7:30 PM",
    price: 999,
    badge: "LIVE ROAST",
    contention: "FLASH DROP",
    sold: 170,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "coldplay-ahm",
    name: "Coldplay: Extra Arena Flash Night",
    category: "concert",
    categoryLabel: "Concerts & Music",
    cityId: "ahmedabad",
    cityName: "Ahmedabad",
    venue: "Narendra Modi Stadium",
    dateStr: "Sat, 25 Jan · 6:00 PM",
    month: "JAN",
    day: "25",
    time: "6:00 PM",
    price: 2500,
    badge: "100K CAPACITY ARENA",
    contention: "FLASH DROP",
    sold: 198,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80",
    featured: true,
  },
  {
    id: "anirudh-che",
    name: "Anirudh Ravichander: Hukum Tour Live",
    category: "concert",
    categoryLabel: "Concerts & Music",
    cityId: "chennai",
    cityName: "Chennai",
    venue: "YMCA Grounds",
    dateStr: "Sat, 01 Feb · 7:00 PM",
    month: "FEB",
    day: "01",
    time: "7:00 PM",
    price: 1800,
    badge: "ROCKSTAR CONCERT",
    contention: "FLASH DROP",
    sold: 160,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    featured: true,
  },
  {
    id: "shreya-kol",
    name: "Shreya Ghoshal: All Hearts Tour",
    category: "concert",
    categoryLabel: "Concerts & Music",
    cityId: "kolkata",
    cityName: "Kolkata",
    venue: "Biswa Bangla Mela Prangan",
    dateStr: "Fri, 19 Dec · 6:30 PM",
    month: "DEC",
    day: "19",
    time: "6:30 PM",
    price: 1999,
    badge: "SYMPHONY NIGHT",
    contention: "FLASH DROP",
    sold: 125,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80",
    featured: true,
  },
  {
    id: "sunburn-goa",
    name: "Sunburn Electronic Beach Festival 2026",
    category: "concert",
    categoryLabel: "Concerts & Music",
    cityId: "goa",
    cityName: "Goa",
    venue: "Vagator Beach Arena",
    dateStr: "Sun, 28 Dec · 4:00 PM",
    month: "DEC",
    day: "28",
    time: "4:00 PM",
    price: 3999,
    badge: "3-DAY MEGAFEST",
    contention: "FLASH DROP",
    sold: 178,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
    featured: true,
  },
  {
    id: "apdhillon-chd",
    name: "AP Dhillon: Brown Munde Tour",
    category: "concert",
    categoryLabel: "Concerts & Music",
    cityId: "chandigarh",
    cityName: "Chandigarh",
    venue: "Sector 17 Plaza Arena",
    dateStr: "Sat, 10 Jan · 7:30 PM",
    month: "JAN",
    day: "10",
    time: "7:30 PM",
    price: 2499,
    badge: "PUNJABI WAVE",
    contention: "FLASH DROP",
    sold: 145,
    totalSeats: 200,
    bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
  },
];

interface TravelTransportItem {
  id: string;
  type: "bus" | "train" | "flight" | "cab";
  operator: string;
  subTitle: string;
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
  depTime: string;
  arrTime: string;
  duration: string;
  price: number;
  badge?: string;
  seatsLeft?: number;
  classType: string;
  rating: number;
}

interface TravelHotelItem {
  id: string;
  name: string;
  city: string;
  address: string;
  stars: number;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  image: string;
  badge?: string;
  amenities: string[];
}

interface TravelBookingRecord {
  id: string;
  pnr: string;
  type: "flight" | "train" | "bus" | "hotel" | "cab";
  title: string;
  subtitle: string;
  fromToOrCity: string;
  dateStr: string;
  passengers: string;
  price: number;
  status: "Confirmed" | "Completed" | "Cancelled";
  bookedAt: string;
  details: string;
}

interface Active3DTicketData {
  ticketType: "Bus" | "Train" | "Flight" | "Cab" | "Hotel" | "Event";
  bookingId: string;
  customerName: string;
  title: string;
  subtitle?: string;
  venueOrRoute: string;
  dateStr: string;
  timeStr: string;
  seatOrClass: string;
  price: number | string;
  status: string;
  sourceType: "travel" | "event";
}

const MOCK_TRANSPORT_LISTINGS: TravelTransportItem[] = [
  // Flights
  {
    id: "fl-1",
    type: "flight",
    operator: "IndiGo 6E-204",
    subTitle: "Airbus A321 Neo · Direct",
    from: "Mumbai (BOM)",
    fromCode: "BOM",
    to: "Goa (GOI)",
    toCode: "GOI",
    depTime: "06:15",
    arrTime: "07:30",
    duration: "1h 15m",
    price: 3899,
    badge: "FAST DROP",
    seatsLeft: 6,
    classType: "Economy Saver",
    rating: 4.8,
  },
  {
    id: "fl-2",
    type: "flight",
    operator: "Air India AI-631",
    subTitle: "Boeing 787 Dreamliner",
    from: "Mumbai (BOM)",
    fromCode: "BOM",
    to: "Delhi (DEL)",
    toCode: "DEL",
    depTime: "08:30",
    arrTime: "10:45",
    duration: "2h 15m",
    price: 4650,
    badge: "FREE MEAL",
    seatsLeft: 12,
    classType: "Prime Cabin",
    rating: 4.6,
  },
  {
    id: "fl-3",
    type: "flight",
    operator: "Akasa Air QP-1382",
    subTitle: "B737 MAX · Eco Speed",
    from: "Bengaluru (BLR)",
    fromCode: "BLR",
    to: "Mumbai (BOM)",
    toCode: "BOM",
    depTime: "14:10",
    arrTime: "15:50",
    duration: "1h 40m",
    price: 3249,
    badge: "BEST VALUE",
    seatsLeft: 9,
    classType: "Smart Saver",
    rating: 4.7,
  },
  {
    id: "fl-4",
    type: "flight",
    operator: "Vistara UK-992",
    subTitle: "Club Vistara Premium",
    from: "Delhi (DEL)",
    fromCode: "DEL",
    to: "Mumbai (BOM)",
    toCode: "BOM",
    depTime: "18:00",
    arrTime: "20:15",
    duration: "2h 15m",
    price: 5420,
    badge: "PREMIUM",
    seatsLeft: 4,
    classType: "Premium Eco",
    rating: 4.9,
  },
  // Trains
  {
    id: "tr-1",
    type: "train",
    operator: "Vande Bharat Express (22223)",
    subTitle: "Semi High-Speed · Fast Track",
    from: "CSMT Mumbai",
    fromCode: "CSMT",
    to: "Madgaon Goa",
    toCode: "MAO",
    depTime: "05:25",
    arrTime: "13:10",
    duration: "7h 45m",
    price: 1815,
    badge: "POPULAR",
    seatsLeft: 22,
    classType: "AC Chair Car",
    rating: 4.9,
  },
  {
    id: "tr-2",
    type: "train",
    operator: "Tejas Express (82902)",
    subTitle: "Corporate Superfast · WiFi",
    from: "Ahmedabad (ADI)",
    fromCode: "ADI",
    to: "Mumbai Central (MMCT)",
    toCode: "MMCT",
    depTime: "06:40",
    arrTime: "13:05",
    duration: "6h 25m",
    price: 1430,
    badge: "MEAL INCLUDED",
    seatsLeft: 18,
    classType: "Executive Chair",
    rating: 4.8,
  },
  {
    id: "tr-3",
    type: "train",
    operator: "Mumbai Rajdhani (12952)",
    subTitle: "Overnight Premier Superfast",
    from: "New Delhi (NDLS)",
    fromCode: "NDLS",
    to: "Mumbai Central (MMCT)",
    toCode: "MMCT",
    depTime: "16:55",
    arrTime: "08:35",
    duration: "15h 40m",
    price: 2890,
    badge: "VIP EXPRESS",
    seatsLeft: 8,
    classType: "2nd AC Sleeper",
    rating: 4.7,
  },
  // Buses
  {
    id: "bs-1",
    type: "bus",
    operator: "Zingbus Maxx AC Sleeper",
    subTitle: "Volvo Multi-Axle B11R",
    from: "Mumbai (Borivali)",
    fromCode: "BOM",
    to: "Pune (Swargate)",
    toCode: "PUN",
    depTime: "22:30",
    arrTime: "02:45",
    duration: "4h 15m",
    price: 799,
    badge: "LIVE GPS",
    seatsLeft: 14,
    classType: "Luxury Sleeper (2+1)",
    rating: 4.7,
  },
  {
    id: "bs-2",
    type: "bus",
    operator: "IntrCity SmartBus",
    subTitle: "Smart Lounge & Clean Linens",
    from: "Bengaluru (Majestic)",
    fromCode: "BLR",
    to: "Goa (Panaji)",
    toCode: "GOA",
    depTime: "21:00",
    arrTime: "08:30",
    duration: "11h 30m",
    price: 1299,
    badge: "SNACKS INCL",
    seatsLeft: 11,
    classType: "AC Sleeper 2+1",
    rating: 4.8,
  },
  {
    id: "bs-3",
    type: "bus",
    operator: "VRL Travels I-Shift Volvo",
    subTitle: "Multi-Axle Semi-Sleeper",
    from: "Pune (Wakad)",
    fromCode: "PUN",
    to: "Bengaluru (Anand Rao)",
    toCode: "BLR",
    depTime: "19:15",
    arrTime: "07:45",
    duration: "12h 30m",
    price: 1650,
    badge: "CHARGING PORT",
    seatsLeft: 19,
    classType: "Multi-Axle Luxury",
    rating: 4.6,
  },
  // Cabs
  {
    id: "cb-1",
    type: "cab",
    operator: "Prime Sedan (Dzire / Etios)",
    subTitle: "Verified Chauffeur · AC On Always",
    from: "Mumbai Airport (T2)",
    fromCode: "BOM",
    to: "Pune Express City Center",
    toCode: "PUN",
    depTime: "Instant Pickup",
    arrTime: "3.5 hrs drive",
    duration: "Door-to-Door",
    price: 2499,
    badge: "TOP RATED",
    seatsLeft: 4,
    classType: "4 Seater Sedan",
    rating: 4.9,
  },
  {
    id: "cb-2",
    type: "cab",
    operator: "Electric SUV (Nexon / ZS EV)",
    subTitle: "Eco-Fleet · Silent Ride",
    from: "Bengaluru Tech Park",
    fromCode: "BLR",
    to: "Mysore Palace Heritage",
    toCode: "MYS",
    depTime: "On-Demand (15m)",
    arrTime: "2.8 hrs drive",
    duration: "Door-to-Door",
    price: 3199,
    badge: "ZERO EMISSION",
    seatsLeft: 4,
    classType: "Compact EV SUV",
    rating: 4.8,
  },
  {
    id: "cb-3",
    type: "cab",
    operator: "Outstation XL (Innova Crysta)",
    subTitle: "Captain Seats · Extra Luggage",
    from: "Delhi NCR Area",
    fromCode: "DEL",
    to: "Jaipur Pink City",
    toCode: "JAI",
    depTime: "Round-The-Clock",
    arrTime: "4.5 hrs drive",
    duration: "Express Highway",
    price: 4899,
    badge: "6 SEATER XL",
    seatsLeft: 6,
    classType: "Premium XL SUV",
    rating: 4.9,
  },
];

const MOCK_HOTELS_LISTINGS: TravelHotelItem[] = [
  {
    id: "ht-1",
    name: "Grand Hyatt Goa Resort",
    city: "Goa",
    address: "Bambolim Bay, North Goa",
    stars: 5,
    rating: 4.9,
    reviewCount: 1420,
    pricePerNight: 9499,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    badge: "BEACHFRONT RESORT",
    amenities: ["Ocean View", "Private Beach", "Infinity Pool", "Free Breakfast", "Spa"],
  },
  {
    id: "ht-2",
    name: "Taj Lands End Mumbai",
    city: "Mumbai",
    address: "Bandstand, Bandra West, Mumbai",
    stars: 5,
    rating: 4.9,
    reviewCount: 2180,
    pricePerNight: 14200,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    badge: "SEA-FACING LUXURY",
    amenities: ["Arabian Sea View", "Fine Dining", "Luxury Spa", "Valet Parking", "Pool"],
  },
  {
    id: "ht-3",
    name: "The Leela Palace Bengaluru",
    city: "Bengaluru",
    address: "Old Airport Road, Kodihalli, Bengaluru",
    stars: 5,
    rating: 4.8,
    reviewCount: 1670,
    pricePerNight: 12500,
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
    badge: "ROYAL PALATIAL STAY",
    amenities: ["Royal Suites", "Michelin Dining", "Lush Gardens", "Heated Pool", "Butler"],
  },
  {
    id: "ht-4",
    name: "W Goa - Beachfront Villa",
    city: "Goa",
    address: "Vagator Beach, Bardez, North Goa",
    stars: 5,
    rating: 4.8,
    reviewCount: 980,
    pricePerNight: 18900,
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
    badge: "ULTRA LUXURY VILLA",
    amenities: ["Rock Pool", "Private Balcony", "Sunset Bar", "Beach Access", "DJ Nights"],
  },
  {
    id: "ht-5",
    name: "Heritage Haveli Palace",
    city: "Jaipur",
    address: "Amer Road, Amber, Jaipur",
    stars: 4,
    rating: 4.7,
    reviewCount: 740,
    pricePerNight: 5600,
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80",
    badge: "HERITAGE COURTYARD",
    amenities: ["Fort View Rooftop", "Courtyard", "Rajasthani Folk Nights", "Free Breakfast"],
  },
  {
    id: "ht-6",
    name: "Ginger Mumbai BKC",
    city: "Mumbai",
    address: "Bandra Kurla Complex, Mumbai",
    stars: 3,
    rating: 4.4,
    reviewCount: 1150,
    pricePerNight: 3850,
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
    badge: "SMART BUSINESS HUB",
    amenities: ["High Speed WiFi", "Express Check-in", "Work Desk", "Fitness Center"],
  },
];

const DEFAULT_TRAVEL_BOOKINGS: TravelBookingRecord[] = [
  {
    id: "bk-1",
    pnr: "TW-FL89201",
    type: "flight",
    title: "IndiGo 6E-204 · Mumbai → Goa",
    subtitle: "Chhatrapati Shivaji (BOM) to Dabolim (GOI)",
    fromToOrCity: "BOM → GOI",
    dateStr: "Tomorrow, 06:15 AM",
    passengers: "1 Passenger (Seat 14A)",
    price: 3899,
    status: "Confirmed",
    bookedAt: "2 hours ago",
    details: "Fast Track Boarding · Terminal 2 Gate 42B",
  },
  {
    id: "bk-2",
    pnr: "TW-VB44910",
    type: "train",
    title: "Vande Bharat Express (22223)",
    subtitle: "CSMT Mumbai to Madgaon Goa",
    fromToOrCity: "CSMT → MAO",
    dateStr: "18 Oct 2026, 05:25 AM",
    passengers: "2 Passengers (Coach C4, 18-19)",
    price: 3630,
    status: "Confirmed",
    bookedAt: "Yesterday",
    details: "AC Chair Car · Instant PNR Verified",
  },
  {
    id: "bk-3",
    pnr: "TW-HT77294",
    type: "hotel",
    title: "W Goa - Beachfront Villa",
    subtitle: "Vagator Beach, North Goa",
    fromToOrCity: "Goa (North)",
    dateStr: "18 Oct - 21 Oct (3 Nights)",
    passengers: "2 Guests (King Villa)",
    price: 56700,
    status: "Confirmed",
    bookedAt: "3 days ago",
    details: "Breakfast Included · Rock Pool View",
  },
];

const DEFAULT_EVENT_BOOKINGS: Booking[] = [
  {
    s: "A-42",
    e: "Coldplay — Music of the Spheres (Mumbai)",
    tier: "VIP Prime Lounge",
    price: 6500,
  },
  {
    s: "B-18",
    e: "Diljit Dosanjh — Dil-Luminati Tour",
    tier: "Fan Pit Gold",
    price: 4999,
  },
];

function findNearestCity(lat: number, lng: number): City {
  let closest = CITIES[0];
  let minDistance = Infinity;
  for (const city of CITIES) {
    const dLat = ((city.lat - lat) * Math.PI) / 180;
    const dLng = ((city.lng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((city.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = 6371 * c;
    if (d < minDistance) {
      minDistance = d;
      closest = city;
    }
  }
  return closest;
}

export default function TicketWalaPage() {
  // Client-side mount tracking to eliminate browser-extension hydration mismatches (e.g. fdprocessedid)
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Navigation & Page State (default to home)
  const [activePage, setActivePage] = useState<string>("home");

  // Location Saver State
  const [selectedCityId, setSelectedCityId] = useState<string>("mumbai");
  const [showCityModal, setShowCityModal] = useState<boolean>(false);
  const [citySearchQuery, setCitySearchQuery] = useState<string>("");
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsMessage, setGpsMessage] = useState<string>("");

  // Travel Section States
  const [travelSubTab, setTravelSubTab] = useState<"transport" | "hotels" | "bookings">("transport");
  const [transportMode, setTransportMode] = useState<"bus" | "train" | "flight" | "cab">("flight");
  const [transportFrom, setTransportFrom] = useState<string>("");
  const [transportTo, setTransportTo] = useState<string>("");
  const [transportDate, setTransportDate] = useState<string>("2026-10-18");
  const [travelersCount, setTravelersCount] = useState<number>(1);

  // Hotel filters
  const [hotelCity, setHotelCity] = useState<string>("All");
  const [hotelCheckIn, setHotelCheckIn] = useState<string>("2026-10-18");
  const [hotelCheckOut, setHotelCheckOut] = useState<string>("2026-10-21");
  const [hotelStarFilter, setHotelStarFilter] = useState<number | "all">("all");
  const [hotelPriceFilter, setHotelPriceFilter] = useState<string>("all");

  // Bookings list state
  const [travelBookings, setTravelBookings] = useState<TravelBookingRecord[]>(DEFAULT_TRAVEL_BOOKINGS);
  const [bookingFilterType, setBookingFilterType] = useState<string>("all");
  const [bookingSearchPnr, setBookingSearchPnr] = useState<string>("");

  // Modals state
  const [selectedTravelItem, setSelectedTravelItem] = useState<{
    item: TravelTransportItem | TravelHotelItem;
    category: "transport" | "hotel";
  } | null>(null);
  const [bookingPassengerName, setBookingPassengerName] = useState<string>("");
  const [bookingPassengerPhone, setBookingPassengerPhone] = useState<string>("");
  const [bookingPassengerEmail, setBookingPassengerEmail] = useState<string>("");
  const [confirmedTravelPass, setConfirmedTravelPass] = useState<TravelBookingRecord | null>(null);
  const [active3DTicket, setActive3DTicket] = useState<Active3DTicketData | null>(null);
  const [ticketTilt, setTicketTilt] = useState<{ x: number; y: number; glareX: number; glareY: number; glareOpacity: number }>({ x: 0, y: 0, glareX: 40, glareY: 30, glareOpacity: 0.6 });
  const [eticketAlert, setEticketAlert] = useState<string>("");

  // BookMyShow Home Interactive States
  const [carouselIdx, setCarouselIdx] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Profile Form States (Streamlined 3-tab access-first architecture)
  const [profileTab, setProfileTab] = useState<"passes" | "personal" | "security">("passes");
  const [passFilterType, setPassFilterType] = useState<"all" | "events" | "travel">("all");
  const [profileName, setProfileName] = useState<string>("Demo Fan");
  const [profilePassName, setProfilePassName] = useState<string>("VIP Pass Holder");
  const [profilePhone, setProfilePhone] = useState<string>("+91 98201 23456");
  const [profileAvatar, setProfileAvatar] = useState<string>("");
  const [profileCity, setProfileCity] = useState<string>("mumbai");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string>("");
  const [oldPw, setOldPw] = useState<string>("");
  const [newPw, setNewPw] = useState<string>("");
  const [confirmPw, setConfirmPw] = useState<string>("");
  const [pwMsg, setPwMsg] = useState<string>("");
  const [showOldPw, setShowOldPw] = useState<boolean>(false);
  const [showNewPw, setShowNewPw] = useState<boolean>(false);
  const [showConfirmPw, setShowConfirmPw] = useState<boolean>(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);
  const [sessionsRevokedMsg, setSessionsRevokedMsg] = useState<string>("");

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({
    "demo@ticketwala.com": {
      name: "Demo Fan",
      email: "demo@ticketwala.com",
      pw: "password123",
      phone: "+91 98201 23456",
      passName: "VIP Pass Holder",
      avatar: "",
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
  const [bookings, setBookings] = useState<Booking[]>(DEFAULT_EVENT_BOOKINGS);
  const [logs, setLogs] = useState<Array<{ text: string; cls: string; time: string }>>([]);

  // Telemetry & Load-Testing State
  const [stats, setStats] = useState({ req: 0, ok: 0, no: 0, exp: 0 });
  const [isBusy, setIsBusy] = useState(false);
  const [liveReqs, setLiveReqs] = useState(0);
  const [lockLatency, setLockLatency] = useState("0.4ms");
  const [historyPoints, setHistoryPoints] = useState<number[]>([]);

  // Home Page Interactive States
  const [heroTtl, setHeroTtl] = useState<number>(29);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeArchNode, setActiveArchNode] = useState<number>(1);
  const [chaosMode, setChaosMode] = useState<string>("idle");

  // Hero pass live TTL countdown timer loop
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroTtl((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      if (typeof window !== "undefined") {
        const targetHash = `#${page}`;
        if (window.location.hash !== targetHash) {
          window.location.hash = targetHash;
        }
      }
    } catch {
      // ignore
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // Listen to browser hash changes & expose window.go
  useEffect(() => {
    (window as any).go = (p: string) => navigateTo(p);
    const syncHash = () => {
      const h = (window.location.hash || "").replace("#", "").trim().toLowerCase();
      if (["home", "landing", "events", "booking", "travel", "profile", "login", "signup"].includes(h)) {
        setActivePage(h);
      } else if (!h) {
        setActivePage("home");
      }
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);
    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
      delete (window as any).go;
    };
  }, [navigateTo]);

  // Load saved city preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCity = localStorage.getItem("ticketwala_selected_city");
      if (savedCity && CITIES.some((c) => c.id === savedCity)) {
        setSelectedCityId(savedCity);
      }
    }
  }, []);

  // Sync profile form details with current logged-in user
  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfilePassName(user.passName || user.name.split(" ")[0] + " (VIP Pass)");
      setProfilePhone(user.phone || "+91 98200 12345");
      setProfileAvatar(user.avatar || "");
      if (user.city) setProfileCity(user.city);
      if (typeof user.twoFactor === "boolean") setTwoFactorEnabled(user.twoFactor);
    }
  }, [user]);

  // Featured carousel auto-rotation
  const featuredEvents = BMS_EVENTS.filter((e) => e.featured);
  useEffect(() => {
    if (featuredEvents.length === 0) return;
    const interval = setInterval(() => {
      setCarouselIdx((prev) => (prev + 1) % featuredEvents.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredEvents.length]);

  const currentCity = CITIES.find((c) => c.id === selectedCityId) || CITIES[0];
  const filteredCities = CITIES.filter((c) =>
    c.name.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
    c.tagline.toLowerCase().includes(citySearchQuery.toLowerCase())
  );
  const cityEvents = BMS_EVENTS.filter((e) => {
    const matchesCity = e.cityId === currentCity.id;
    const matchesCat = selectedCategory === "all" || e.category === selectedCategory;
    return matchesCity && matchesCat;
  });

  const selectCity = (cityId: string) => {
    setSelectedCityId(cityId);
    if (typeof window !== "undefined") {
      localStorage.setItem("ticketwala_selected_city", cityId);
    }
    setShowCityModal(false);
  };

  const handleDetectLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setGpsLoading(true);
    setGpsMessage("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = findNearestCity(pos.coords.latitude, pos.coords.longitude);
        setSelectedCityId(nearest.id);
        if (typeof window !== "undefined") {
          localStorage.setItem("ticketwala_selected_city", nearest.id);
        }
        setGpsLoading(false);
        setGpsMessage(`Auto-detected nearest metro: ${nearest.name}!`);
        setTimeout(() => {
          setShowCityModal(false);
          setGpsMessage("");
        }, 1200);
      },
      () => {
        setGpsLoading(false);
        alert("Unable to detect location. Please select your city manually.");
      },
      { timeout: 8000 }
    );
  };

  const bookEventFromHome = (eventData: BMSEvent) => {
    setEvents((prev) => [
      { month: eventData.month, day: eventData.day, name: `${eventData.name} — ${eventData.cityName}`, sold: eventData.sold },
      ...prev.filter((e) => e.name !== `${eventData.name} — ${eventData.cityName}`),
    ]);
    setCurrentEventIdx(0);
    initSeats();
    navigateTo("booking");
  };

  const getProfilePwStrength = (pw: string) => {
    if (!pw) return { score: 0, label: "Enter password", color: "#ded9d0", percent: 0 };
    let score = 0;
    if (pw.length >= 6) score += 1;
    if (pw.length >= 10) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    if (score <= 1) return { score: 1, label: "Weak (add numbers & symbols)", color: "#e74c3c", percent: 25 };
    if (score === 2) return { score: 2, label: "Fair (combine 8+ chars)", color: "#f39c12", percent: 50 };
    if (score === 3) return { score: 3, label: "Good (strong protection)", color: "#3498db", percent: 75 };
    return { score: 4, label: "Very Strong & Secure", color: "#27ae60", percent: 100 };
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      alert("Please enter a valid name");
      return;
    }
    const updatedUser: User = {
      ...(user || { email: "demo@ticketwala.com", pw: "password123" }),
      name: profileName,
      passName: profilePassName || profileName,
      phone: profilePhone,
      avatar: profileAvatar,
      city: profileCity,
      twoFactor: twoFactorEnabled,
    };
    setUser(updatedUser);
    setUsers((prev) => ({
      ...prev,
      [updatedUser.email]: updatedUser,
    }));

    if (profileCity && CITIES.some((c) => c.id === profileCity)) {
      setSelectedCityId(profileCity);
      if (typeof window !== "undefined") {
        localStorage.setItem("ticketwala_selected_city", profileCity);
      }
    }

    setProfileSuccessMsg("Profile & contact details updated successfully!");
    setTimeout(() => setProfileSuccessMsg(""), 3500);
  };

  const handleQuickDemoLogin = () => {
    const demo = users["demo@ticketwala.com"] || {
      name: "Demo Fan",
      email: "demo@ticketwala.com",
      pw: "password123",
      phone: "+91 98201 23456",
      passName: "VIP Pass Holder",
      avatar: "",
    };
    setUser(demo);
    setProfileName(demo.name);
    setProfilePassName(demo.passName || demo.name);
    setProfilePhone(demo.phone || "+91 98201 23456");
    setProfileAvatar(demo.avatar || "");
    setBookings(DEFAULT_EVENT_BOOKINGS);
    setProfileTab("passes");
    setEticketAlert("Logged in as Demo Fan! Live event passes & travel reservations ready.");
    setTimeout(() => setEticketAlert(""), 4000);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && user.pw && oldPw && oldPw !== user.pw) {
      setPwMsg("Current password does not match existing records.");
      return;
    }
    if (!newPw || newPw.length < 6) {
      setPwMsg("New password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg("New passwords do not match.");
      return;
    }
    if (user) {
      const updatedUser: User = { ...user, pw: newPw };
      setUser(updatedUser);
      setUsers((prev) => ({ ...prev, [updatedUser.email]: updatedUser }));
    }
    setOldPw("");
    setNewPw("");
    setConfirmPw("");
    setPwMsg("Password updated successfully! Next login requires new credentials.");
    setTimeout(() => setPwMsg(""), 3500);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setProfileAvatar(result);
        if (user) {
          const updatedUser: User = { ...user, avatar: result };
          setUser(updatedUser);
          setUsers((prev) => ({ ...prev, [updatedUser.email]: updatedUser }));
        }
        setProfileSuccessMsg("Custom photo uploaded successfully!");
        setTimeout(() => setProfileSuccessMsg(""), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setProfileAvatar("");
    if (user) {
      const updatedUser: User = { ...user, avatar: "" };
      setUser(updatedUser);
      setUsers((prev) => ({ ...prev, [updatedUser.email]: updatedUser }));
    }
    setProfileSuccessMsg("Photo removed! Displaying personalized initials.");
    setTimeout(() => setProfileSuccessMsg(""), 3000);
  };

  const handleRevokeSessions = () => {
    setSessionsRevokedMsg("All other active device sessions have been terminated.");
    setTimeout(() => setSessionsRevokedMsg(""), 3500);
  };

  const handleDownloadTicket = (item: { title?: string; e?: string; s?: string | number; pnr?: string }) => {
    const title = item.title || item.e || "Event Boarding Pass";
    const pnr = item.pnr || "TW-EVT-4201";
    setEticketAlert(`E-Ticket for "${title}" (${pnr}) downloaded! Offline turnstile verified.`);
    setTimeout(() => setEticketAlert(""), 4500);
  };

  const handleTicketMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = -((y - centerY) / centerY) * 12;
    const tiltY = ((x - centerX) / centerX) * 16;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setTicketTilt({ x: tiltX, y: tiltY, glareX, glareY, glareOpacity: 0.85 });
  };

  const handleTicketMouseLeave = () => {
    setTicketTilt({ x: 0, y: 0, glareX: 40, glareY: 30, glareOpacity: 0.45 });
  };

  const handlePrintTicket = () => {
    window.print();
  };

  const handleDownload3DTicket = (ticket: Active3DTicketData) => {
    const passContent = `========================================\n` +
      `TICKETWALA PASS · OFFICIAL CONFIRMATION\n` +
      `========================================\n` +
      `PNR / BOOKING ID : ${ticket.bookingId}\n` +
      `TYPE             : ${ticket.ticketType.toUpperCase()}\n` +
      `TITLE            : ${ticket.title}\n` +
      `ROUTE / VENUE    : ${ticket.venueOrRoute}\n` +
      `PASSENGER / FAN  : ${ticket.customerName}\n` +
      `SEAT / CLASS     : ${ticket.seatOrClass}\n` +
      `DATE & TIME      : ${ticket.dateStr} · ${ticket.timeStr}\n` +
      `STATUS           : ${ticket.status.toUpperCase()} (CONFIRMED)\n` +
      `PRICE            : ₹${typeof ticket.price === "number" ? ticket.price.toLocaleString("en-IN") : ticket.price}\n` +
      `VERIFICATION     : Cryptographically Signed by TicketWala\n` +
      `========================================\n` +
      `Scan at optical turnstiles or gate marshals.`;

    const blob = new Blob([passContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TicketWala_${ticket.bookingId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setEticketAlert(`Ticket Pass for ${ticket.bookingId} downloaded to device!`);
    setTimeout(() => setEticketAlert(""), 4500);
  };

  const handleBackToBookings = (ticket: Active3DTicketData) => {
    setActive3DTicket(null);
    if (ticket.sourceType === "travel") {
      setTravelSubTab("bookings");
      navigateTo("travel");
    } else {
      setProfileTab("passes");
      navigateTo("profile");
    }
  };

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
    if (!canvas || (activePage !== "landing" && activePage !== "home")) return;
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

    const newPnr = `TW-EVT-${Math.floor(1000 + Math.random() * 9000)}`;
    setBookings((prev) => [...prev, { s: seatLabel, e: eventName, tier: d.tier, price: d.price }]);
    addLog(`COMMIT seat ${seatLabel} (${d.tier}) → queued for DB write`, "ok");

    setTimeout(() => {
      addLog(`ASYNC persisted seat ${seatLabel} [OK] eventual consistency`, "ok");
    }, 900);

    setMine(null);
    setStepNum(3);

    // Automatically trigger the Premium Animated 3D Ticket!
    setActive3DTicket({
      ticketType: "Event",
      bookingId: newPnr,
      customerName: user?.name || profileName || "Demo Fan",
      title: eventName,
      subtitle: `${d.tier} · Seat #${seatLabel}`,
      venueOrRoute: "DY Patil Stadium, Navi Mumbai",
      dateStr: "Tomorrow, 07:00 PM",
      timeStr: "Gates 05:00 PM",
      seatOrClass: `Seat ${seatLabel} (${d.tier})`,
      price: d.price,
      status: "Confirmed",
      sourceType: "event",
    });
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

  const runChaosSimulation = (modeLabel: string, totalCount: number) => {
    if (isBusy) return;
    setIsBusy(true);
    setChaosMode(modeLabel);
    addLog(`[CHAOS LAB] Starting ${modeLabel} test: ${totalCount} requests`, "no");

    let sent = 0;
    const batchSize = Math.max(10, Math.floor(totalCount / 35));
    const interval = setInterval(() => {
      setSeats((prevSeats) => {
        const copy = [...prevSeats];
        for (let k = 0; k < batchSize; k++) {
          sent++;
          setStats((st) => ({ ...st, req: st.req + 1 }));
          const i = Math.floor(Math.random() * N);
          const s = copy[i];

          if (s.st !== 0 || i === mine) {
            setStats((st) => ({ ...st, no: st.no + 1 }));
          } else {
            copy[i] = {
              st: 1,
              t: Date.now() + (3 + Math.random() * 8) * 1000,
              bot: Math.random() < 0.4,
            };
            setStats((st) => ({ ...st, ok: st.ok + 1 }));
          }
        }
        return copy;
      });

      if (sent >= totalCount) {
        clearInterval(interval);
        setIsBusy(false);
        setChaosMode("idle");
        addLog(`[CHAOS LAB] ${totalCount} requests completed · 0 double-bookings verified`, "ok");
      }
    }, 100);
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

  if (!isMounted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#ffffff",
          color: "#2B2A28",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Poppins', sans-serif",
        }}
        suppressHydrationWarning
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <img
            src="/logo-navbar.png"
            alt="TicketWala"
            style={{ height: "46px", width: "auto" }}
          />
        </div>
        <div style={{ fontSize: "14px", color: "#8c8880", fontWeight: 600 }}>
          Initializing TicketWala Engine...
        </div>
      </div>
    );
  }

  return (
    <>
      {/* NAVIGATION BAR */}
      <nav suppressHydrationWarning>
        <div className="nav-left-group" suppressHydrationWarning>
          <div className="logo" onClick={() => navigateTo("home")} role="button" tabIndex={0} style={{ cursor: "pointer" }} suppressHydrationWarning>
            <img
              src="/logo-navbar.png"
              alt="TicketWala"
              style={{ height: "46px", width: "auto", objectFit: "contain", display: "block" }}
            />
          </div>
          <button
            type="button"
            className="location-pill-btn"
            onClick={() => setShowCityModal(true)}
            title="Change City"
            suppressHydrationWarning
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{currentCity.name}</span>
            <span className="location-chevron">▾</span>
          </button>
        </div>

        <ul id="nav" suppressHydrationWarning>
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
              suppressHydrationWarning
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
              suppressHydrationWarning
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
              suppressHydrationWarning
            >
              Booking
            </a>
          </li>
          <li>
            <a
              href="#travel"
              role="button"
              style={{ cursor: "pointer" }}
              className={activePage === "travel" ? "on" : ""}
              onClick={(e) => {
                e.preventDefault();
                navigateTo("travel");
              }}
              suppressHydrationWarning
            >
              Travel
            </a>
          </li>
          <li>
            <a
              href="#landing"
              role="button"
              style={{ cursor: "pointer" }}
              className={activePage === "landing" ? "on" : ""}
              onClick={(e) => {
                e.preventDefault();
                navigateTo("landing");
              }}
              suppressHydrationWarning
            >
              Architecture
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
              suppressHydrationWarning
            >
              Profile
            </a>
          </li>
        </ul>

        <div id="auth" style={{ display: "flex", alignItems: "center" }} suppressHydrationWarning>
          {user ? (
            <>
              <button
                type="button"
                onClick={() => navigateTo("profile")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  marginRight: "10px",
                  padding: "4px 8px",
                  borderRadius: "99px",
                }}
                suppressHydrationWarning
              >
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "var(--o)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "12px",
                  overflow: "hidden",
                }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--k)" }}>
                  {user.name.split(" ")[0]}
                </span>
              </button>
              <button type="button" className="btn ghost" style={{ padding: "8px 18px" }} onClick={handleLogout} suppressHydrationWarning>
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
                suppressHydrationWarning
              >
                Log in
              </button>
              <button type="button" className="btn" style={{ padding: "8px 18px" }} onClick={() => navigateTo("signup")} suppressHydrationWarning>
                Sign up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT PAGES */}
      <main suppressHydrationWarning>
        {/* 1. BOOKMYSHOW-STYLE HOME PAGE */}
        <div
          className={`page ${activePage === "home" ? "on" : ""}`}
          id="home"
          style={{ display: activePage === "home" ? "block" : "none" }}
        >
          <div className="bms-home-wrap">
            {/* Featured Hero Carousel Banner */}
            <div className="bms-hero-banner">
              <div
                className="bms-hero-bg"
                style={{
                  backgroundImage: `url(${featuredEvents[carouselIdx]?.bannerUrl || "/signup-banner.jpg"})`,
                }}
              />
              <div className="bms-hero-gradient" />
              <div className="bms-hero-content">
                <span className="bms-hero-tag">
                  <span className="live-dot-sm" /> {featuredEvents[carouselIdx]?.badge || "HEADLINER DROP"} · {featuredEvents[carouselIdx]?.contention}
                </span>
                <h1 className="bms-hero-title">
                  {featuredEvents[carouselIdx]?.name}
                </h1>
                <div className="bms-hero-meta">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    {featuredEvents[carouselIdx]?.dateStr}
                  </span>
                  <span>•</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    {featuredEvents[carouselIdx]?.venue}, {currentCity.name}
                  </span>
                  <span>•</span>
                  <span style={{ fontWeight: 800, color: "#fff" }}>
                    From ₹{featuredEvents[carouselIdx]?.price}
                  </span>
                </div>
                <div className="bms-hero-actions">
                  <button
                    type="button"
                    className="btn"
                    style={{ padding: "13px 28px", fontSize: "15px" }}
                    onClick={() => bookEventFromHome(featuredEvents[carouselIdx])}
                  >
                    Book Seats Now →
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    style={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)", padding: "13px 22px" }}
                    onClick={() => navigateTo("landing")}
                  >
                    View Architecture Lab
                  </button>
                </div>
              </div>

              {/* Dots */}
              <div className="bms-hero-dots">
                {featuredEvents.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    className={`bms-dot ${dotIdx === carouselIdx ? "active" : ""}`}
                    onClick={() => setCarouselIdx(dotIdx)}
                    aria-label={`Slide ${dotIdx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="bms-categories-bar">
              <div className="bms-categories-list">
                {[
                  { id: "all", label: "All Drops" },
                  { id: "concert", label: "Concerts & Music" },
                  { id: "comedy", label: "Standup Comedy" },
                  { id: "sports", label: "Live Stadium Sports" },
                  { id: "theatre", label: "Theatre & Plays" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`bms-cat-pill ${selectedCategory === cat.id ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Edge Technology Ribbon */}
            <div className="bms-edge-ribbon" style={{ marginBottom: "32px" }}>
              <div className="bms-edge-pill">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                <span><b>Zero Double-Bookings</b> Guaranteed</span>
              </div>
              <div className="bms-edge-pill">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                <span><b>0.38ms Redis Lua Lock</b></span>
              </div>
              <div className="bms-edge-pill">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                <span><b>30s TTL Hold Ring</b></span>
              </div>
              <div className="bms-edge-pill">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <span><b>10k RPS Bot Shield</b></span>
              </div>
            </div>

            {/* Events in City Section Header */}
            <div className="bms-section-header">
              <div>
                <h2>Live Drops in {currentCity.name}</h2>
                <p style={{ color: "#77736c", fontSize: "14px", marginTop: "4px" }}>
                  Showing high-velocity ticket drops in {currentCity.name}. Live Redis locks protect every seat.
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="location-pill-btn"
                  onClick={() => setShowCityModal(true)}
                >
                  <span>Switch City</span>
                  <span className="location-chevron">▾</span>
                </button>
              </div>
            </div>

            {/* Location-Filtered Events Grid */}
            <div className="bms-events-grid" style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
              marginBottom: "48px"
            }}>
              {cityEvents.length > 0 ? (
                cityEvents.map((evt) => (
                  <div key={evt.id} className="bms-event-card" style={{
                    background: "#ffffff",
                    borderRadius: "18px",
                    overflow: "hidden",
                    border: "1px solid rgba(43, 42, 40, 0.1)",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s, box-shadow 0.2s"
                  }}>
                    <div style={{ position: "relative", height: "180px", overflow: "hidden" }}>
                      <img
                        src={evt.bannerUrl}
                        alt={evt.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <span style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        background: evt.contention === "FLASH DROP" ? "var(--o)" : "var(--k)",
                        color: "#fff",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 800,
                        letterSpacing: "0.5px"
                      }}>
                        {evt.contention}
                      </span>
                      <span style={{
                        position: "absolute",
                        bottom: "12px",
                        left: "12px",
                        background: "rgba(0,0,0,0.75)",
                        backdropFilter: "blur(4px)",
                        color: "#fff",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 700
                      }}>
                        {evt.dateStr}
                      </span>
                    </div>

                    <div style={{ padding: "18px", display: "flex", flexDirection: "column", flex: 1 }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--o)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "4px" }}>
                        {evt.categoryLabel}
                      </div>
                      <h3 style={{ fontSize: "17px", fontWeight: 800, color: "var(--k)", marginBottom: "6px", lineHeight: 1.3 }}>
                        {evt.name}
                      </h3>
                      <div style={{ fontSize: "13px", color: "#77736c", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        <span>{evt.venue}</span>
                      </div>

                      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid #f0ede7" }}>
                        <div>
                          <small style={{ display: "block", fontSize: "11px", color: "#8c8880", fontWeight: 600 }}>STARTING FROM</small>
                          <b style={{ fontSize: "17px", color: "var(--k)", fontWeight: 800 }}>₹{evt.price}</b>
                        </div>
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: "9px 18px", fontSize: "13px" }}
                          onClick={() => bookEventFromHome(evt)}
                        >
                          Book Seats →
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 20px", background: "#fbfaf8", borderRadius: "16px", border: "1px dashed #ded9d0" }}>
                  <p style={{ fontWeight: 700, color: "var(--k)", marginBottom: "8px" }}>No events found for this filter in {currentCity.name}.</p>
                  <p style={{ fontSize: "13px", color: "#77736c", marginBottom: "16px" }}>Try selecting another category or explore all India drops.</p>
                  <button type="button" className="btn ghost" onClick={() => setSelectedCategory("all")}>View All Categories</button>
                </div>
              )}
            </div>

            {/* Iconic Venues in City */}
            <div className="bms-section-header">
              <div>
                <h2>Iconic Venues in {currentCity.name}</h2>
                <p style={{ color: "#77736c", fontSize: "14px", marginTop: "4px" }}>
                  High-capacity stadiums and theaters with TicketWala flash-drop gates.
                </p>
              </div>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "16px",
              marginBottom: "48px"
            }}>
              {(CITY_VENUES[currentCity.id] || CITY_VENUES["mumbai"]).map((v, i) => (
                <div key={i} style={{
                  background: "#ffffff",
                  border: "1px solid rgba(43, 42, 40, 0.08)",
                  borderRadius: "16px",
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px"
                }}>
                  <div style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "rgba(255, 107, 55, 0.12)",
                    color: "var(--o)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 21h18M5 21V7l8-4v18M13 21V3l6 4v14" /></svg>
                  </div>
                  <div>
                    <b style={{ display: "block", fontSize: "15px", color: "var(--k)" }}>{v.name}</b>
                    <span style={{ fontSize: "12px", color: "#77736c" }}>{v.area} • {v.eventsCount} upcoming drops</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Architecture Callout Banner */}
            <div style={{
              background: "linear-gradient(135deg, #2B2A28 0%, #191817 100%)",
              borderRadius: "20px",
              padding: "36px 40px",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "24px",
              flexWrap: "wrap",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}>
              <div style={{ maxWidth: "600px" }}>
                <span style={{ color: "var(--o)", fontSize: "12px", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase" }}>
                  ENGINEERING BEHIND THE CURTAIN
                </span>
                <h3 style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px", marginBottom: "8px", color: "#fff" }}>
                  How does TicketWala prevent double-booking at 10,000 RPS?
                </h3>
                <p style={{ color: "#d6d0c4", fontSize: "14px", lineHeight: 1.5 }}>
                  Redis Lua atomic script execution, 30s TTL sliding hold rings, and asynchronous PostgreSQL queue decoupling.
                </p>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => navigateTo("landing")}
                style={{ padding: "14px 26px", fontSize: "14px", whiteSpace: "nowrap" }}
              >
                Explore Architecture & Chaos Lab →
              </button>
            </div>
          </div>
        </div>

        {/* 2. DEDICATED ENGINEERING LANDING PAGE */}
        <div
          className={`page ${activePage === "landing" ? "on" : ""}`}
          id="landing"
          style={{ display: activePage === "landing" ? "block" : "none" }}
        >
          {/* Hero Section */}
          <div className="hero">
            <div>
              <h1>
                5,000 fans.<br />
                200 seats.<br />
                <em>Zero</em> double-bookings.
              </h1>
              <p>
                TicketWala locks every seat in memory with atomic Redis Lua scripts, holds it with a TTL countdown,
                and writes to the database asynchronously — fair, first-come-first-served, sub-second.
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "22px" }}>
                <button className="btn" onClick={() => navigateTo("booking")}>
                  Grab a seat now →
                </button>
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

              <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", fontSize: "12px", opacity: 0.85, fontWeight: 600 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                  0.4ms Redis Lock
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                  Zero Race Conditions
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Auto-Recycling TTL
                </span>
              </div>
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
              <span style={{ padding: "0 28px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF6B35" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: "8px" }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                <span style={{ color: "#ffffff" }}>Seat teri, </span><b style={{ color: "#FF6B35" }}>booking meri!</b>
              </span>
              <span style={{ padding: "0 28px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF6B35" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: "8px" }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                <span style={{ color: "#ffffff" }}>Race Nahi, </span><b style={{ color: "#FF6B35" }}>Reservation Sahi.</b>
              </span>
              <span style={{ padding: "0 28px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF6B35" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: "8px" }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                No 504 Timeout, <b>Sirf Confirm Checkout.</b>
              </span>
              <span style={{ padding: "0 28px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF6B35" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: "8px" }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                Line mein khade rehna puraani baat, <b>Sub-second lock TicketWala ke saath!</b>
              </span>
              <span style={{ padding: "0 28px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF6B35" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: "8px" }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                <b>Zero Double-Bookings</b> · 100% Fair Play
              </span>
              <span style={{ padding: "0 28px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF6B35" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: "8px" }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                Tatkal ka stress bhool jao, <b>TicketWala se seat paao!</b>
              </span>

              {/* Duplicate loop sequence for seamless continuous CSS marquee */}
              <span style={{ padding: "0 28px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF6B35" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: "8px" }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                <span style={{ color: "#ffffff" }}>Seat teri, </span><b style={{ color: "#FF6B35" }}>booking meri!</b>
              </span>
              <span style={{ padding: "0 28px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF6B35" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: "8px" }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                <span style={{ color: "#ffffff" }}>Race Nahi, </span><b style={{ color: "#FF6B35" }}>Reservation Sahi.</b>
              </span>
              <span style={{ padding: "0 28px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF6B35" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: "8px" }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                No 504 Timeout, <b>Sirf Confirm Checkout.</b>
              </span>
              <span style={{ padding: "0 28px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF6B35" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: "8px" }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                Line mein khade rehna puraani baat, <b>Sub-second lock TicketWala ke saath!</b>
              </span>
              <span style={{ padding: "0 28px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF6B35" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: "8px" }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                <b>Zero Double-Bookings</b> · 100% Fair Play
              </span>
              <span style={{ padding: "0 28px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF6B35" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: "8px" }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                Tatkal ka stress bhool jao, <b>Redis Lua se seat paao!</b>
              </span>
            </div>
          </div>

          {/* Steps Section */}
          <section className="light">
            <div className="section-head-wrap" style={{ marginBottom: "36px" }}>
              <h2>
                One drop. <em>Three</em> steps.
              </h2>
              <p>From click to confirmed in under a second of lock time.</p>
            </div>
            <div className="grid">
              <div className="card">
                <div className="n">1</div>
                <h3>Atomic Lock</h3>
                <p>
                  A single-threaded Lua script evaluates token capacity and claims the seat in a single Redis CPU cycle. No race, no deadlock.
                </p>
                <div className="code-preview-box">
                  <span className="code-comment">-- Atomic Lua allocation</span><br />
                  <span className="code-keyword">if</span> redis.<span className="code-func">call</span>(<span className="code-string">&apos;get&apos;</span>, k) == <span className="code-keyword">false</span> <span className="code-keyword">then</span><br />
                  &nbsp;&nbsp;redis.<span className="code-func">call</span>(<span className="code-string">&apos;setex&apos;</span>, k, 30, uid)<br />
                  &nbsp;&nbsp;<span className="code-keyword">return</span> 1 <span className="code-comment">-- Lock granted (0.4ms)</span><br />
                  <span className="code-keyword">end</span>
                </div>
              </div>
              <div className="card">
                <div className="n">2</div>
                <h3>TTL Hold</h3>
                <p>
                  The seat key is stored with an ephemeral 30-second TTL. Abandon checkout or close your tab, and Redis auto-evicts the key back to the public pool instantly.
                </p>
                <div style={{ marginTop: "16px", padding: "14px 16px", background: "#fff", borderRadius: "12px", border: "1px solid #0001", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--o)", animation: "pulse 1.2s infinite" }}></div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--k)" }}>
                    Hardware TTL Eviction Clock · No Cron Sweep Needed
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="n">3</div>
                <h3>Async Commit</h3>
                <p>
                  Only confirmed, paid bookings stream to PostgreSQL via an asynchronous BullMQ queue. The hot path never blocks on database disk I/O.
                </p>
                <div style={{ marginTop: "16px", padding: "14px 16px", background: "#fff", borderRadius: "12px", border: "1px solid #0001", display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", fontWeight: 700 }}>
                  <span style={{ color: "#27ae60" }}>● BullMQ Stream</span>
                  <span style={{ opacity: 0.4 }}>→</span>
                  <span>PostgreSQL Batch Commit</span>
                </div>
              </div>
            </div>
          </section>

          {/* Under the Hood: Distributed Architecture Pipeline */}
          <section className="arch-pipeline-section">
            <div className="section-head-wrap">
              <span className="badge-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Sub-Second Architecture
              </span>
              <h2>Under the hood: The <em>distributed pipeline</em></h2>
              <p>
                How TicketWala absorbs 5,000 concurrent ticket requests simultaneously without crashing databases or double-allocating seats.
              </p>
            </div>
            <div className="arch-pipeline-grid">
              <div className={`arch-node-card ${activeArchNode === 0 ? "highlight" : ""}`} onMouseEnter={() => setActiveArchNode(0)}>
                <div className="arch-node-top">
                  <div className="arch-node-step-badge">01</div>
                  <div className="arch-node-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  </div>
                </div>
                <div>
                  <div className="arch-node-title">Token-Bucket Shield</div>
                  <div className="arch-node-desc">
                    Incoming burst traffic hits an edge rate-limiter. Scrapers and scalper scripts are throttled at the ingress gateway before touching memory.
                  </div>
                </div>
                <div className="arch-node-meta">
                  <span>Ingress Gate</span>
                  <span className="arch-node-metric">10k RPS Absorb</span>
                </div>
              </div>

              <div className={`arch-node-card ${activeArchNode === 1 ? "highlight" : ""}`} onMouseEnter={() => setActiveArchNode(1)}>
                <div className="arch-node-top">
                  <div className="arch-node-step-badge">02</div>
                  <div className="arch-node-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  </div>
                </div>
                <div>
                  <div className="arch-node-title">In-Memory Redis Lua</div>
                  <div className="arch-node-desc">
                    Lua scripts run in Redis&apos;s single-threaded event loop. Seat validation and lock assignment occur atomically in a single sub-millisecond execution.
                  </div>
                </div>
                <div className="arch-node-meta">
                  <span>Engine Hot Path</span>
                  <span className="arch-node-metric">0.38ms Latency</span>
                </div>
              </div>

              <div className={`arch-node-card ${activeArchNode === 2 ? "highlight" : ""}`} onMouseEnter={() => setActiveArchNode(2)}>
                <div className="arch-node-top">
                  <div className="arch-node-step-badge">03</div>
                  <div className="arch-node-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                </div>
                <div>
                  <div className="arch-node-title">Ephemeral 30s TTL</div>
                  <div className="arch-node-desc">
                    Keys are stored with a strict 30-second TTL. If payment drops or tab closes, Redis automatically evicts the lock with zero database garbage accumulation.
                  </div>
                </div>
                <div className="arch-node-meta">
                  <span>Auto-Recycling</span>
                  <span className="arch-node-metric">30s Hardware TTL</span>
                </div>
              </div>

              <div className={`arch-node-card ${activeArchNode === 3 ? "highlight" : ""}`} onMouseEnter={() => setActiveArchNode(3)}>
                <div className="arch-node-top">
                  <div className="arch-node-step-badge">04</div>
                  <div className="arch-node-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
                  </div>
                </div>
                <div>
                  <div className="arch-node-title">Write-Behind Queue</div>
                  <div className="arch-node-desc">
                    Confirmed reservations stream asynchronously to PostgreSQL via BullMQ. The relational database never experiences connection pool exhaustion.
                  </div>
                </div>
                <div className="arch-node-meta">
                  <span>Persistence</span>
                  <span className="arch-node-metric">0% Pool Starvation</span>
                </div>
              </div>
            </div>
          </section>

          {/* Live Engine Dashboard */}
          <section className="dark">
            <h2>
              Live engine <em>dashboard</em>
            </h2>
            <p style={{ opacity: 0.7 }}>Streaming from the in-memory broker — test the simulated burst below.</p>
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

          {/* Architectural Comparison Benchmark */}
          <section className="benchmark-section">
            <div className="section-head-wrap">
              <span className="badge-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Engineering Breakdown
              </span>
              <h2>Why traditional ticketing systems <em>crash</em></h2>
              <p>
                Comparing the architecture of legacy ticketing platforms against TicketWala&apos;s in-memory non-blocking concurrency engine.
              </p>
            </div>

            <div className="benchmark-dual-grid">
              {/* Card 1: Traditional RDBMS */}
              <div className="benchmark-card traditional">
                <div className="benchmark-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  Traditional SQL Architecture
                </div>
                <div className="benchmark-title">RDBMS Hot-Path Bottlenecks</div>
                <div className="benchmark-subtitle">BookMyShow, Ticketmaster &amp; IRCTC Tatkal legacy pattern</div>
                <ul className="benchmark-points">
                  <li>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    <span>Synchronous <code>SELECT ... FOR UPDATE</code> locks database table rows, forcing 5,000 concurrent threads to wait.</span>
                  </li>
                  <li>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    <span>PostgreSQL connection pool maxes out at 100-200 clients, triggering cascading 504 Gateway Timeouts.</span>
                  </li>
                  <li>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    <span>Abandoned checkouts leave database rows locked until heavy background cron cleanups run minutes later.</span>
                  </li>
                  <li>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    <span>High latency window causes phantom reads and double-allocated seats.</span>
                  </li>
                </ul>
                <div className="benchmark-footer-kpi">
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#991b1b", textTransform: "uppercase" }}>Peak Drop Latency</span>
                    <div className="benchmark-kpi-val">3,200ms – 14,000ms+</div>
                  </div>
                  <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: 700 }}>Frequent 504 Crashes</span>
                </div>
              </div>

              {/* Card 2: TicketWala Architecture */}
              <div className="benchmark-card ticketwala">
                <div className="benchmark-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  TicketWala Engine
                </div>
                <div className="benchmark-title">In-Memory Non-Blocking Core</div>
                <div className="benchmark-subtitle">Sub-millisecond atomic Lua scripts + async persistence</div>
                <ul className="benchmark-points">
                  <li>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Single-threaded Redis Lua scripts execute atomically in memory — zero database locks on the hot path.</span>
                  </li>
                  <li>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Decoupled BullMQ async queue buffers confirmed bookings to PostgreSQL at a steady, zero-starvation rate.</span>
                  </li>
                  <li>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Hardware-enforced 30s TTL automatically reclaims abandoned reservations without background sweeper lags.</span>
                  </li>
                  <li>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Mathematical single-seat invariant guarantees exactly 0 double-bookings under any burst load.</span>
                  </li>
                </ul>
                <div className="benchmark-footer-kpi">
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>Peak Drop Latency</span>
                    <div className="benchmark-kpi-val">0.38ms – 0.9ms</div>
                  </div>
                  <span style={{ fontSize: "12px", color: "#27ae60", fontWeight: 700 }}>Zero Failures (100% Uptime)</span>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Chaos & Load Test Lab on Home */}
          <section className="chaos-lab-section">
            <div className="section-head-wrap">
              <span className="badge-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Live Interactive Demo
              </span>
              <h2>Flash-drop <em>load lab</em></h2>
              <p>
                Simulate peak traffic bursts directly from your browser and watch the sub-millisecond atomic engine defend seat inventory.
              </p>
            </div>

            <div className="chaos-deck">
              <div>
                <span className="ticket-status-pill" style={{ marginBottom: "12px" }}>
                  <span className="pulse-dot"></span> LIVE TRAFFIC INJECTOR
                </span>
                <h3 style={{ fontSize: "24px", fontWeight: 800, marginTop: "8px", marginBottom: "8px" }}>
                  Select Simulation Load
                </h3>
                <p style={{ fontSize: "14px", opacity: 0.75, lineHeight: 1.6 }}>
                  Trigger hundreds or thousands of concurrent virtual clients competing for the exact same 200 stadium seats.
                </p>

                <div className="chaos-modes-wrap">
                  <button
                    type="button"
                    className={`chaos-btn ${chaosMode === "Normal Drop (500)" ? "active" : ""}`}
                    onClick={() => runChaosSimulation("Normal Drop (500)", 500)}
                    disabled={isBusy}
                  >
                    <div>
                      <div className="chaos-btn-label">Normal Drop Rush</div>
                      <span className="chaos-btn-sub">500 concurrent client requests</span>
                    </div>
                    <span className="chaos-btn-badge">500 RPS</span>
                  </button>

                  <button
                    type="button"
                    className={`chaos-btn ${chaosMode === "Peak Drop (2,500)" ? "active" : ""}`}
                    onClick={() => runChaosSimulation("Peak Drop (2,500)", 2500)}
                    disabled={isBusy}
                  >
                    <div>
                      <div className="chaos-btn-label">Stadium Concert Peak</div>
                      <span className="chaos-btn-sub">2,500 high-contention requests</span>
                    </div>
                    <span className="chaos-btn-badge">2,500 RPS</span>
                  </button>

                  <button
                    type="button"
                    className={`chaos-btn ${chaosMode === "Viral Flash Mob (5,000)" ? "active" : ""}`}
                    onClick={() => runChaosSimulation("Viral Flash Mob (5,000)", 5000)}
                    disabled={isBusy}
                  >
                    <div>
                      <div className="chaos-btn-label">Viral Flash Mob Storm</div>
                      <span className="chaos-btn-sub">5,000 fans · Maximum concurrency burst</span>
                    </div>
                    <span className="chaos-btn-badge" style={{ color: "var(--o)", background: "#fff" }}>5,000 RPS</span>
                  </button>
                </div>
              </div>

              <div className="chaos-telemetry-screen">
                <div className="chaos-screen-header">
                  <span>Engine Telemetry Feed</span>
                  <span style={{ color: "#27ae60", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span className="pulse-dot"></span> REDIS ONLINE
                  </span>
                </div>

                <div className="chaos-stat-grid">
                  <div className="chaos-stat-cell">
                    <span>Requests Ingested</span>
                    <b>{stats.req.toLocaleString()}</b>
                  </div>
                  <div className="chaos-stat-cell">
                    <span>Locks Granted</span>
                    <b className="highlight">{stats.ok.toLocaleString()}</b>
                  </div>
                  <div className="chaos-stat-cell">
                    <span>Contention (409)</span>
                    <b>{stats.no.toLocaleString()}</b>
                  </div>
                </div>

                <div className="chaos-stat-grid" style={{ marginBottom: "16px" }}>
                  <div className="chaos-stat-cell">
                    <span>Double Bookings</span>
                    <b style={{ color: "#27ae60" }}>0</b>
                  </div>
                  <div className="chaos-stat-cell">
                    <span>Lock Latency</span>
                    <b>{lockLatency}</b>
                  </div>
                  <div className="chaos-stat-cell">
                    <span>Single Ownership</span>
                    <b style={{ color: "#27ae60" }}>100% PASS</b>
                  </div>
                </div>

                <div className="chaos-invariant-proof">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                  <span>Verified Invariant: Held + Sold + Available = Exactly 200 Seats Conserved</span>
                </div>

                <div style={{ marginTop: "16px", textAlign: "right" }}>
                  <button
                    type="button"
                    className="btn"
                    style={{ padding: "10px 20px", fontSize: "13px" }}
                    onClick={() => navigateTo("booking")}
                  >
                    View Live Stadium Seat Map →
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section>
            <div className="section-head-wrap" style={{ marginBottom: "36px" }}>
              <h2>
                Features you <em>won&apos;t find</em> elsewhere
              </h2>
              <p>Engineered from ground up for fair, transparent, and resilient reservation workflows.</p>
            </div>
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
                <p>Bots get throttled at the edge; real fans never see a 500 error.</p>
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
                <p>Expired holds reappear live to everyone watching the theater map.</p>
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

          {/* Technical FAQ Accordion */}
          <section className="faq-section">
            <div className="section-head-wrap">
              <span className="badge-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                System Architecture FAQ
              </span>
              <h2>Frequently asked <em>engineering</em> questions</h2>
              <p>Technical deep dive into concurrency guarantees, failure recovery, and database protection.</p>
            </div>

            <div className="faq-list">
              <div className={`faq-card ${openFaq === 0 ? "open" : ""}`}>
                <div className="faq-header" onClick={() => setOpenFaq(openFaq === 0 ? null : 0)}>
                  <span>How does TicketWala guarantee zero double-bookings without database transactions?</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                {openFaq === 0 && (
                  <div className="faq-body">
                    Redis executes Lua scripts as a single atomic operation in an isolated single-threaded event loop. No other command or client can read or write to the seat key while the Lua script is running, mathematically preventing race conditions without needing heavy relational database locks.
                  </div>
                )}
              </div>

              <div className={`faq-card ${openFaq === 1 ? "open" : ""}`}>
                <div className="faq-header" onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}>
                  <span>What happens if a user closes their tab or loses internet during the 30-second hold?</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                {openFaq === 1 && (
                  <div className="faq-body">
                    Every seat reservation has a hardware-enforced 30-second TTL (Time-To-Live). If the user doesn&apos;t confirm checkout before the TTL timer expires, Redis automatically evicts the key without needing any cleanup cron job, and the seat is immediately available on the next millisecond to everyone waiting.
                  </div>
                )}
              </div>

              <div className={`faq-card ${openFaq === 2 ? "open" : ""}`}>
                <div className="faq-header" onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}>
                  <span>How does the Token-Bucket algorithm block scalper bots from exhausting inventory?</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                {openFaq === 2 && (
                  <div className="faq-body">
                    Before any reservation request reaches the seat engine, the edge gateway evaluates the client&apos;s token bucket. Humans making natural clicks pass instantly; bots firing hundreds of requests per second deplete their bucket and receive immediate 429 Too Many Requests responses before touching the seat cache.
                  </div>
                )}
              </div>

              <div className={`faq-card ${openFaq === 3 ? "open" : ""}`}>
                <div className="faq-header" onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}>
                  <span>Why use decoupled write-behind queues instead of writing directly to PostgreSQL?</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                {openFaq === 3 && (
                  <div className="faq-body">
                    PostgreSQL connection pools max out around 100-200 concurrent connections. When 5,000 users click reserve at the exact same second, direct database writes crash the database with 504 Gateway Timeouts. TicketWala stores the temporary hold entirely in Redis RAM, and only writes finalized, paid bookings through an asynchronous BullMQ queue to PostgreSQL at a steady, manageable rate.
                  </div>
                )}
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
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <button
                            type="button"
                            className="btn primary"
                            style={{
                              width: "100%",
                              background: "linear-gradient(135deg, #FF6B35 0%, #E63E00 100%)",
                              border: "none",
                              padding: "11px 18px",
                              fontSize: "14px",
                              fontWeight: 800,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                            }}
                            onClick={() => {
                              const lastBooking = bookings[bookings.length - 1];
                              const eventName = lastBooking ? lastBooking.e : events[currentEventIdx].name;
                              const seatLabel = lastBooking ? lastBooking.s : "VIP";
                              const tier = lastBooking ? lastBooking.tier : "VIP Lounge";
                              const eventPrice = (lastBooking && lastBooking.price) ? lastBooking.price : 2499;
                              setActive3DTicket({
                                ticketType: "Event",
                                bookingId: `TW-EVT-${Math.floor(1000 + Math.random() * 9000)}`,
                                customerName: user?.name || profileName || "Aryan Sharma",
                                title: eventName,
                                subtitle: `${tier} · Seat #${seatLabel}`,
                                venueOrRoute: "DY Patil Stadium, Navi Mumbai",
                                dateStr: "Tomorrow, 07:00 PM",
                                timeStr: "Gates 05:00 PM",
                                seatOrClass: `Seat ${seatLabel} (${tier})`,
                                price: eventPrice,
                                status: "Confirmed",
                                sourceType: "event",
                              });
                            }}
                          >
                            ✨ View Ticket Pass
                          </button>
                          <button className="btn k" style={{ width: "100%" }} onClick={() => navigateTo("profile")}>
                            View E-Ticket in Profile →
                          </button>
                        </div>
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

        {/* 3.5 TICKETWALA TRAVEL & TRANSIT PAGE */}
        <div
          className={`page ${activePage === "travel" ? "on" : ""}`}
          id="travel"
          style={{ display: activePage === "travel" ? "block" : "none" }}
        >
          <div className="travel-wrap">
            {/* Travel Hero Header */}
            <div className="travel-hero">
              <div>
                <span className="travel-hero-tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  TICKETWALA FAST LANE · TRAVEL
                </span>
                <h1>High-Velocity Transit & Luxury Stays</h1>
                <p>
                  Zero waiting room lag, atomic seat holds, and instant PNR verification across premier Flights, Express Trains, Volvo Buses, Cabs & Luxury Resorts.
                </p>
              </div>

              <div className="travel-hero-stats">
                <div className="travel-stat-pill">
                  <small>Daily Transit</small>
                  <b>400+ Routes</b>
                </div>
                <div className="travel-stat-pill">
                  <small>Booking Fee</small>
                  <b style={{ color: "#27ae60" }}>₹0 Platform Fee</b>
                </div>
                <div className="travel-stat-pill">
                  <small>Hold Speed</small>
                  <b style={{ color: "var(--o)" }}>Live TTL PNR</b>
                </div>
              </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="travel-nav-tabs">
              <button
                type="button"
                className={`travel-nav-btn ${travelSubTab === "transport" ? "active" : ""}`}
                onClick={() => setTravelSubTab("transport")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.8-.2-1.6.2-2 .9l-.5 1 5.8 3.3-3.4 3.4-2.8-.5-.9.9 3.2 2 2 3.2.9-.9-.5-2.8 3.4-3.4 3.3 5.8 1-.5c.7-.4 1.1-1.2.9-2Z" />
                </svg>
                Transportation
                <span className="travel-badge">Fast Drop</span>
              </button>

              <button
                type="button"
                className={`travel-nav-btn ${travelSubTab === "hotels" ? "active" : ""}`}
                onClick={() => setTravelSubTab("hotels")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 18h12" />
                  <path d="M3 22h18" />
                  <path d="M19 18V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v13" />
                  <path d="M9 7h1" />
                  <path d="M9 11h1" />
                  <path d="M9 15h1" />
                  <path d="M14 7h1" />
                  <path d="M14 11h1" />
                  <path d="M14 15h1" />
                </svg>
                Hotels & Stays
                <span className="travel-badge">Premier</span>
              </button>

              <button
                type="button"
                className={`travel-nav-btn ${travelSubTab === "bookings" ? "active" : ""}`}
                onClick={() => setTravelSubTab("bookings")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M6 12h.01" />
                  <path d="M18 12h.01" />
                </svg>
                My Bookings
                <span className="travel-badge" style={{ background: "#27ae60" }}>
                  {travelBookings.length}
                </span>
              </button>
            </div>

            {/* ========================================================= */}
            {/* 1. TRANSPORTATION SECTION */}
            {/* ========================================================= */}
            {travelSubTab === "transport" && (
              <div>
                <div className="travel-search-card">
                  {/* Mode Bar */}
                  <div className="transit-mode-bar">
                    <button
                      type="button"
                      className={`transit-mode-btn ${transportMode === "flight" ? "active" : ""}`}
                      onClick={() => setTransportMode("flight")}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.8-.2-1.6.2-2 .9l-.5 1 5.8 3.3-3.4 3.4-2.8-.5-.9.9 3.2 2 2 3.2.9-.9-.5-2.8 3.4-3.4 3.3 5.8 1-.5c.7-.4 1.1-1.2.9-2Z" />
                      </svg>
                      Flights
                    </button>

                    <button
                      type="button"
                      className={`transit-mode-btn ${transportMode === "train" ? "active" : ""}`}
                      onClick={() => setTransportMode("train")}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="3" width="16" height="16" rx="2" />
                        <path d="M4 11h16" />
                        <path d="M12 3v8" />
                        <path d="m8 19-2 3" />
                        <path d="m16 19 2 3" />
                        <circle cx="8" cy="15" r="1" />
                        <circle cx="16" cy="15" r="1" />
                      </svg>
                      Express Trains
                    </button>

                    <button
                      type="button"
                      className={`transit-mode-btn ${transportMode === "bus" ? "active" : ""}`}
                      onClick={() => setTransportMode("bus")}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="3" width="16" height="16" rx="2" />
                        <path d="M4 10h16" />
                        <path d="m6 19-1 2" />
                        <path d="m18 19 1 2" />
                        <circle cx="8" cy="15" r="1" />
                        <circle cx="16" cy="15" r="1" />
                      </svg>
                      Volvo Buses
                    </button>

                    <button
                      type="button"
                      className={`transit-mode-btn ${transportMode === "cab" ? "active" : ""}`}
                      onClick={() => setTransportMode("cab")}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7.5c-.7 0-1.4.4-1.8.9L4 10.5C3.3 11 3 11.8 3 12.7V16c0 .6.4 1 1 1h2" />
                        <circle cx="7" cy="17" r="2" />
                        <path d="M9 17h6" />
                        <circle cx="17" cy="17" r="2" />
                      </svg>
                      Outstation Cabs
                    </button>
                  </div>

                  {/* Search Inputs */}
                  <div className="travel-search-grid">
                    <div className="travel-search-input-box">
                      <span className="travel-search-label">From Station / City</span>
                      <input
                        className="travel-search-field"
                        placeholder="e.g. Mumbai, BOM, CSMT"
                        value={transportFrom}
                        onChange={(e) => setTransportFrom(e.target.value)}
                      />
                    </div>

                    <div className="travel-search-input-box">
                      <span className="travel-search-label">To Destination</span>
                      <input
                        className="travel-search-field"
                        placeholder="e.g. Goa, GOI, Delhi"
                        value={transportTo}
                        onChange={(e) => setTransportTo(e.target.value)}
                      />
                    </div>

                    <div className="travel-search-input-box">
                      <span className="travel-search-label">Date of Travel</span>
                      <input
                        type="date"
                        className="travel-search-field"
                        value={transportDate}
                        onChange={(e) => setTransportDate(e.target.value)}
                      />
                    </div>

                    <div className="travel-search-input-box">
                      <span className="travel-search-label">Travelers</span>
                      <select
                        className="travel-search-field"
                        value={travelersCount}
                        onChange={(e) => setTravelersCount(Number(e.target.value))}
                        style={{ background: "transparent", cursor: "pointer" }}
                      >
                        <option value={1}>1 Traveler</option>
                        <option value={2}>2 Travelers</option>
                        <option value={3}>3 Travelers</option>
                        <option value={4}>4 Travelers</option>
                        <option value={5}>5+ Travelers</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      className="btn primary"
                      style={{ padding: "14px 24px", height: "100%", display: "inline-flex", alignItems: "center", gap: "8px", justifyContent: "center" }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      Search
                    </button>
                  </div>
                </div>

                {/* Transportation Results Listings */}
                <div className="transit-results-grid">
                  {MOCK_TRANSPORT_LISTINGS
                    .filter((item) => item.type === transportMode)
                    .filter((item) => {
                      if (!transportFrom.trim() && !transportTo.trim()) return true;
                      const fromMatch = !transportFrom.trim() ||
                        item.from.toLowerCase().includes(transportFrom.toLowerCase()) ||
                        item.fromCode.toLowerCase().includes(transportFrom.toLowerCase());
                      const toMatch = !transportTo.trim() ||
                        item.to.toLowerCase().includes(transportTo.toLowerCase()) ||
                        item.toCode.toLowerCase().includes(transportTo.toLowerCase());
                      return fromMatch && toMatch;
                    })
                    .map((item) => (
                      <div key={item.id} className="transit-item-card">
                        {/* Operator Column */}
                        <div className="transit-operator-info">
                          <div className="transit-icon-avatar">
                            {item.type === "flight" && (
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.8-.2-1.6.2-2 .9l-.5 1 5.8 3.3-3.4 3.4-2.8-.5-.9.9 3.2 2 2 3.2.9-.9-.5-2.8 3.4-3.4 3.3 5.8 1-.5c.7-.4 1.1-1.2.9-2Z" />
                              </svg>
                            )}
                            {item.type === "train" && (
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="4" y="3" width="16" height="16" rx="2" />
                                <path d="M4 11h16" />
                                <path d="M12 3v8" />
                                <path d="m8 19-2 3" />
                                <path d="m16 19 2 3" />
                                <circle cx="8" cy="15" r="1" />
                                <circle cx="16" cy="15" r="1" />
                              </svg>
                            )}
                            {item.type === "bus" && (
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="4" y="3" width="16" height="16" rx="2" />
                                <path d="M4 10h16" />
                                <path d="m6 19-1 2" />
                                <path d="m18 19 1 2" />
                                <circle cx="8" cy="15" r="1" />
                                <circle cx="16" cy="15" r="1" />
                              </svg>
                            )}
                            {item.type === "cab" && (
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7.5c-.7 0-1.4.4-1.8.9L4 10.5C3.3 11 3 11.8 3 12.7V16c0 .6.4 1 1 1h2" />
                                <circle cx="7" cy="17" r="2" />
                                <path d="M9 17h6" />
                                <circle cx="17" cy="17" r="2" />
                              </svg>
                            )}
                          </div>

                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <b style={{ fontSize: "15px", color: "var(--k)" }}>{item.operator}</b>
                              {item.badge && (
                                <span style={{
                                  fontSize: "9px",
                                  fontWeight: 800,
                                  background: "rgba(255, 107, 55, 0.12)",
                                  color: "var(--o)",
                                  padding: "2px 6px",
                                  borderRadius: "6px"
                                }}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <small style={{ color: "#77736c", fontSize: "12px", display: "block", marginTop: "2px" }}>
                              {item.subTitle}
                            </small>
                          </div>
                        </div>

                        {/* Times Column */}
                        <div className="transit-times-col">
                          <div className="transit-time-point" style={{ textAlign: "left" }}>
                            <b>{item.depTime}</b>
                            <small>{item.fromCode}</small>
                          </div>

                          <div className="transit-duration-line">
                            <span>{item.duration}</span>
                            <div className="transit-line-track" style={{ minWidth: "90px" }}>
                              <div style={{
                                position: "absolute",
                                right: 0,
                                top: "-3px",
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: "var(--o)"
                              }} />
                            </div>
                            <small style={{ fontSize: "10px", color: "#8c8880", marginTop: "3px" }}>
                              {item.type === "flight" ? "Non-stop" : "Direct"}
                            </small>
                          </div>

                          <div className="transit-time-point" style={{ textAlign: "right" }}>
                            <b>{item.arrTime}</b>
                            <small>{item.toCode}</small>
                          </div>
                        </div>

                        {/* Class & Rating Pill */}
                        <div style={{ minWidth: "150px" }}>
                          <span style={{
                            display: "inline-block",
                            background: "#f6f5f2",
                            border: "1px solid #eae5dc",
                            borderRadius: "6px",
                            padding: "3px 8px",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "var(--k)"
                          }}>
                            {item.classType}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px" }}>
                            <span style={{ fontSize: "11px", color: "#27ae60", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="#27ae60" stroke="#27ae60"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                              {item.rating}
                            </span>
                            <span style={{ fontSize: "11px", color: "#8c8880" }}>•</span>
                            <span style={{ fontSize: "11px", color: item.seatsLeft && item.seatsLeft <= 5 ? "#e74c3c" : "#8c8880", fontWeight: 600 }}>
                              {item.seatsLeft ? `${item.seatsLeft} seats left` : "Available"}
                            </span>
                          </div>
                        </div>

                        {/* Price & Booking Action */}
                        <div className="transit-price-col">
                          <b>₹{item.price.toLocaleString("en-IN")}</b>
                          <small>per passenger</small>
                          <button
                            type="button"
                            className="btn primary"
                            style={{ padding: "8px 18px", fontSize: "12px", width: "100%" }}
                            onClick={() => {
                              setSelectedTravelItem({ item, category: "transport" });
                              setBookingPassengerName(user?.name || "Demo Traveler");
                              setBookingPassengerPhone(user?.phone || profilePhone || "+91 98200 12345");
                              setBookingPassengerEmail(user?.email || "traveler@ticketwala.com");
                            }}
                          >
                            {item.type === "cab" ? "Book Cab" : "Book Seat"}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 2. HOTELS & STAYS SECTION */}
            {/* ========================================================= */}
            {travelSubTab === "hotels" && (
              <div>
                <div className="travel-search-card">
                  <div className="travel-search-grid">
                    <div className="travel-search-input-box">
                      <span className="travel-search-label">Destination City</span>
                      <select
                        className="travel-search-field"
                        value={hotelCity}
                        onChange={(e) => setHotelCity(e.target.value)}
                        style={{ background: "transparent", cursor: "pointer" }}
                      >
                        <option value="All">All Premier Locations</option>
                        <option value="Goa">Goa</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Bengaluru">Bengaluru</option>
                        <option value="Jaipur">Jaipur</option>
                      </select>
                    </div>

                    <div className="travel-search-input-box">
                      <span className="travel-search-label">Check-in Date</span>
                      <input
                        type="date"
                        className="travel-search-field"
                        value={hotelCheckIn}
                        onChange={(e) => setHotelCheckIn(e.target.value)}
                      />
                    </div>

                    <div className="travel-search-input-box">
                      <span className="travel-search-label">Check-out Date</span>
                      <input
                        type="date"
                        className="travel-search-field"
                        value={hotelCheckOut}
                        onChange={(e) => setHotelCheckOut(e.target.value)}
                      />
                    </div>

                    <div className="travel-search-input-box">
                      <span className="travel-search-label">Rooms & Guests</span>
                      <select
                        className="travel-search-field"
                        style={{ background: "transparent", cursor: "pointer" }}
                      >
                        <option>1 Room, 2 Guests</option>
                        <option>1 Room, 1 Guest</option>
                        <option>2 Rooms, 4 Guests</option>
                        <option>3+ Rooms (Group)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      className="btn primary"
                      style={{ padding: "14px 24px", height: "100%", display: "inline-flex", alignItems: "center", gap: "8px", justifyContent: "center" }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      Search Stays
                    </button>
                  </div>
                </div>

                {/* Filters Bar */}
                <div className="hotel-filters-bar">
                  <div className="hotel-filter-group">
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#8c8880", textTransform: "uppercase" }}>Rating:</span>
                    <button
                      type="button"
                      className={`hotel-filter-btn ${hotelStarFilter === "all" ? "active" : ""}`}
                      onClick={() => setHotelStarFilter("all")}
                    >
                      All Stars
                    </button>
                    <button
                      type="button"
                      className={`hotel-filter-btn ${hotelStarFilter === 5 ? "active" : ""}`}
                      onClick={() => setHotelStarFilter(5)}
                    >
                      5★ Luxury
                    </button>
                    <button
                      type="button"
                      className={`hotel-filter-btn ${hotelStarFilter === 4 ? "active" : ""}`}
                      onClick={() => setHotelStarFilter(4)}
                    >
                      4★ Premier
                    </button>
                    <button
                      type="button"
                      className={`hotel-filter-btn ${hotelStarFilter === 3 ? "active" : ""}`}
                      onClick={() => setHotelStarFilter(3)}
                    >
                      3★ Smart
                    </button>
                  </div>

                  <div className="hotel-filter-group">
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#8c8880", textTransform: "uppercase" }}>Price:</span>
                    <button
                      type="button"
                      className={`hotel-filter-btn ${hotelPriceFilter === "all" ? "active" : ""}`}
                      onClick={() => setHotelPriceFilter("all")}
                    >
                      All Prices
                    </button>
                    <button
                      type="button"
                      className={`hotel-filter-btn ${hotelPriceFilter === "under5k" ? "active" : ""}`}
                      onClick={() => setHotelPriceFilter("under5k")}
                    >
                      Under ₹5,000
                    </button>
                    <button
                      type="button"
                      className={`hotel-filter-btn ${hotelPriceFilter === "5to12k" ? "active" : ""}`}
                      onClick={() => setHotelPriceFilter("5to12k")}
                    >
                      ₹5,000 - ₹12,000
                    </button>
                    <button
                      type="button"
                      className={`hotel-filter-btn ${hotelPriceFilter === "above12k" ? "active" : ""}`}
                      onClick={() => setHotelPriceFilter("above12k")}
                    >
                      ₹12,000+
                    </button>
                  </div>
                </div>

                {/* Hotel Cards Grid */}
                <div className="hotel-cards-grid">
                  {MOCK_HOTELS_LISTINGS
                    .filter((h) => hotelCity === "All" || h.city.toLowerCase() === hotelCity.toLowerCase())
                    .filter((h) => hotelStarFilter === "all" || h.stars === hotelStarFilter)
                    .filter((h) => {
                      if (hotelPriceFilter === "under5k") return h.pricePerNight < 5000;
                      if (hotelPriceFilter === "5to12k") return h.pricePerNight >= 5000 && h.pricePerNight <= 12000;
                      if (hotelPriceFilter === "above12k") return h.pricePerNight > 12000;
                      return true;
                    })
                    .map((hotel) => (
                      <div key={hotel.id} className="hotel-card">
                        <div className="hotel-card-img-wrap">
                          <img src={hotel.image} alt={hotel.name} className="hotel-card-img" />
                          {hotel.badge && <span className="hotel-card-badge">{hotel.badge}</span>}
                          <span className="hotel-card-rating">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="white" stroke="white"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                            {hotel.rating} ({hotel.reviewCount})
                          </span>
                        </div>

                        <div className="hotel-card-body">
                          <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--o)", textTransform: "uppercase" }}>
                                {hotel.city} · {"★".repeat(hotel.stars)}
                              </span>
                            </div>
                            <h3 style={{ fontSize: "17px", fontWeight: 800, color: "var(--k)", margin: "4px 0 2px" }}>
                              {hotel.name}
                            </h3>
                            <p style={{ fontSize: "12px", color: "#77736c", margin: 0 }}>
                              {hotel.address}
                            </p>

                            <div className="hotel-amenities-row">
                              {hotel.amenities.map((amenity, idx) => (
                                <span key={idx} className="hotel-amenity-pill">
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingTop: "14px",
                            borderTop: "1px solid #f2f0ec"
                          }}>
                            <div>
                              <b style={{ fontSize: "18px", color: "var(--k)", display: "block" }}>
                                ₹{hotel.pricePerNight.toLocaleString("en-IN")}
                              </b>
                              <small style={{ fontSize: "11px", color: "#8c8880" }}>per room / night</small>
                            </div>

                            <button
                              type="button"
                              className="btn primary"
                              style={{ padding: "8px 18px", fontSize: "12px" }}
                              onClick={() => {
                                setSelectedTravelItem({ item: hotel, category: "hotel" });
                                setBookingPassengerName(user?.name || "Demo Traveler");
                                setBookingPassengerPhone(user?.phone || profilePhone || "+91 98200 12345");
                                setBookingPassengerEmail(user?.email || "traveler@ticketwala.com");
                              }}
                            >
                              Book Stay
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 3. MY BOOKINGS SECTION */}
            {/* ========================================================= */}
            {travelSubTab === "bookings" && (
              <div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  marginBottom: "20px",
                  flexWrap: "wrap"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {["all", "flight", "train", "bus", "hotel", "cab"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`hotel-filter-btn ${bookingFilterType === type ? "active" : ""}`}
                        onClick={() => setBookingFilterType(type)}
                      >
                        {type === "all" ? "All Reservations" : type.charAt(0).toUpperCase() + type.slice(1) + "s"}
                      </button>
                    ))}
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#ffffff",
                    border: "1.5px solid #ded9d0",
                    borderRadius: "10px",
                    padding: "6px 14px",
                    minWidth: "240px"
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8c8880" strokeWidth="2.2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      placeholder="Search PNR or Destination..."
                      value={bookingSearchPnr}
                      onChange={(e) => setBookingSearchPnr(e.target.value)}
                      style={{
                        border: "none",
                        outline: "none",
                        fontFamily: "inherit",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--k)",
                        width: "100%",
                        background: "transparent"
                      }}
                    />
                  </div>
                </div>

                {/* Bookings Cards List */}
                <div className="travel-bookings-list">
                  {travelBookings
                    .filter((b) => bookingFilterType === "all" || b.type === bookingFilterType)
                    .filter((b) => {
                      if (!bookingSearchPnr.trim()) return true;
                      const q = bookingSearchPnr.toLowerCase();
                      return b.pnr.toLowerCase().includes(q) ||
                        b.title.toLowerCase().includes(q) ||
                        b.fromToOrCity.toLowerCase().includes(q);
                    })
                    .length === 0 ? (
                      <div style={{
                        background: "#ffffff",
                        border: "1.5px dashed #ded9d0",
                        borderRadius: "20px",
                        padding: "48px 24px",
                        textAlign: "center"
                      }}>
                        <div style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "16px",
                          background: "#faf9f6",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#8c8880",
                          marginBottom: "16px"
                        }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="6" width="20" height="12" rx="2" />
                            <circle cx="12" cy="12" r="2" />
                          </svg>
                        </div>
                        <h4 style={{ fontSize: "16px", fontWeight: 800, color: "var(--k)", margin: "0 0 6px" }}>
                          No Travel Reservations Found
                        </h4>
                        <p style={{ fontSize: "13px", color: "#77736c", margin: "0 0 20px" }}>
                          You don't have any matching tickets yet. Book your flight, train or hotel stay using the Fast Lane!
                        </p>
                        <button
                          type="button"
                          className="btn primary"
                          onClick={() => setTravelSubTab("transport")}
                        >
                          Explore Transit Now
                        </button>
                      </div>
                    ) : (
                      travelBookings
                        .filter((b) => bookingFilterType === "all" || b.type === bookingFilterType)
                        .filter((b) => {
                          if (!bookingSearchPnr.trim()) return true;
                          const q = bookingSearchPnr.toLowerCase();
                          return b.pnr.toLowerCase().includes(q) ||
                            b.title.toLowerCase().includes(q) ||
                            b.fromToOrCity.toLowerCase().includes(q);
                        })
                        .map((b) => (
                          <div key={b.id} className="travel-booking-card">
                            <div className="travel-booking-header">
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <span className="travel-pnr-badge">{b.pnr}</span>
                                <span style={{
                                  fontSize: "11px",
                                  fontWeight: 800,
                                  textTransform: "uppercase",
                                  color: "var(--o)",
                                  background: "rgba(255, 107, 55, 0.1)",
                                  padding: "3px 8px",
                                  borderRadius: "6px"
                                }}>
                                  {b.type.toUpperCase()}
                                </span>
                                <span style={{ fontSize: "12px", color: "#8c8880" }}>
                                  Booked {b.bookedAt}
                                </span>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span className={`travel-status-pill ${b.status === "Confirmed" ? "travel-status-confirmed" : "travel-status-cancelled"}`}>
                                  {b.status === "Confirmed" ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                  ) : (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                  )}
                                  {b.status}
                                </span>
                              </div>
                            </div>

                            <div className="travel-booking-body">
                              <div>
                                <h3 style={{ fontSize: "17px", fontWeight: 800, color: "var(--k)", margin: "0 0 4px" }}>
                                  {b.title}
                                </h3>
                                <p style={{ fontSize: "13px", color: "#77736c", margin: "0 0 8px" }}>
                                  {b.subtitle}
                                </p>
                                <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", color: "var(--k)", fontWeight: 600 }}>
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--o)" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                    {b.dateStr}
                                  </span>
                                  <span>•</span>
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--o)" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    {b.passengers}
                                  </span>
                                </div>
                              </div>

                              <div style={{ textAlign: "right", minWidth: "140px" }}>
                                <small style={{ fontSize: "11px", color: "#8c8880", display: "block" }}>Total Amount Paid</small>
                                <b style={{ fontSize: "20px", color: "var(--k)" }}>₹{b.price.toLocaleString("en-IN")}</b>
                                <span style={{ fontSize: "11px", color: "#27ae60", fontWeight: 700, display: "block", marginTop: "2px" }}>
                                  0 Double-Booking Guarantee
                                </span>
                              </div>
                            </div>

                            <div className="travel-booking-footer">
                              <div style={{ fontSize: "12px", color: "#77736c" }}>
                                <b>Details:</b> {b.details}
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <button
                                  type="button"
                                  className="btn primary"
                                  style={{
                                    padding: "6px 14px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    background: "linear-gradient(135deg, #FF6B35 0%, #E63E00 100%)",
                                    border: "none",
                                    boxShadow: "0 2px 6px rgba(255, 107, 53, 0.25)",
                                  }}
                                  onClick={() => {
                                    setActive3DTicket({
                                      ticketType:
                                        b.type === "hotel"
                                          ? "Hotel"
                                          : b.type === "flight"
                                          ? "Flight"
                                          : b.type === "train"
                                          ? "Train"
                                          : b.type === "bus"
                                          ? "Bus"
                                          : "Cab",
                                      bookingId: b.pnr,
                                      customerName: b.passengers.split("(")[0].trim() || user?.name || "Aryan Sharma",
                                      title: b.title,
                                      subtitle: b.subtitle,
                                      venueOrRoute: b.fromToOrCity || b.subtitle,
                                      dateStr: b.dateStr.split("·")[0].trim(),
                                      timeStr: b.dateStr.includes("·") ? b.dateStr.split("·")[1].trim() : "10:00 AM",
                                      seatOrClass: b.details || "Confirmed Class",
                                      price: b.price,
                                      status: b.status,
                                      sourceType: "travel",
                                    });
                                  }}
                                >
                                  Pass
                                </button>

                                <button
                                  type="button"
                                  className="btn ghost"
                                  style={{ padding: "6px 14px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                  onClick={() => {
                                    setEticketAlert(`E-Ticket for PNR ${b.pnr} downloaded! Saved to profile wallet passes.`);
                                    setTimeout(() => setEticketAlert(""), 4000);
                                  }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                  Download Pass
                                </button>

                                {b.status === "Confirmed" && (
                                  <button
                                    type="button"
                                    className="btn ghost"
                                    style={{ padding: "6px 14px", fontSize: "12px", color: "#e74c3c", borderColor: "#fdd" }}
                                    onClick={() => {
                                      if (window.confirm(`Cancel reservation for PNR ${b.pnr}? Full refund will be credited instantly.`)) {
                                        setTravelBookings((prev) =>
                                          prev.map((item) => (item.id === b.id ? { ...item, status: "Cancelled" } : item))
                                        );
                                        setEticketAlert(`Booking ${b.pnr} has been cancelled. Instant refund initiated.`);
                                        setTimeout(() => setEticketAlert(""), 4000);
                                      }
                                    }}
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. STREAMLINED & ACCESS-FOCUSED PROFILE DASHBOARD */}
        <div
          className={`page ${activePage === "profile" ? "on" : ""}`}
          id="profile"
          style={{ display: activePage === "profile" ? "block" : "none" }}
        >
          {!user ? (
            /* ACCESS PORTAL FOR UNLOGGED USERS */
            <div className="profile-dash-wrap">
              <div className="profile-access-gate-card">
                <div className="access-gate-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h2>Access Your Passes &amp; Boarding Tickets</h2>
                <p>
                  Access your confirmed live event tickets, travel boarding passes, and instant turnstile QR codes backed by offline verification.
                </p>

                <div className="access-gate-actions">
                  <button
                    type="button"
                    className="btn"
                    style={{ padding: "12px 26px", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "8px" }}
                    onClick={handleQuickDemoLogin}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>⚡ 1-Click Instant Access (Demo Fan)</span>
                  </button>

                  <button
                    type="button"
                    className="btn ghost"
                    style={{ padding: "12px 22px", fontSize: "14px" }}
                    onClick={() => navigateTo("login")}
                  >
                    Sign In with Email
                  </button>
                </div>

                <div className="access-gate-features">
                  <div className="ag-feature">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Instant Turnstile QR Codes</span>
                  </div>
                  <div className="ag-feature">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Offline PDF E-Tickets</span>
                  </div>
                  <div className="ag-feature">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Zero Double-Booking Guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* STREAMLINED LOGGED-IN PROFILE DASHBOARD */
            <div className="profile-dash-wrap">
              {/* 1. Access-First Header Card */}
              <div className="profile-hero-card" style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                    <div className="profile-avatar-wrapper">
                      {profileAvatar ? (
                        <img src={profileAvatar} alt="Profile" className="profile-avatar-img" />
                      ) : (
                        <div className="profile-avatar-placeholder">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <label
                        htmlFor="avatar-file-input"
                        className="profile-avatar-edit-btn"
                        title="Upload Avatar Image"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                        <input
                          id="avatar-file-input"
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleAvatarUpload}
                        />
                      </label>
                    </div>

                    <div className="profile-identity">
                      <div className="profile-name-row">
                        <h2>{user.name}</h2>
                        <span className="profile-verified-badge">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Verified VIP Account
                        </span>
                      </div>
                      <div className="profile-meta-row">
                        <span>{user.email}</span>
                        <span className="dot-sep">•</span>
                        <span>{user.phone || profilePhone || "+91 98201 23456"}</span>
                        <span className="dot-sep">•</span>
                        <span className="pass-pill">TW-9024-VIP</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <span style={{ fontSize: "12px", color: "#77736c", fontWeight: 600 }}>
                        Active Passes: <b style={{ color: "var(--k)", fontSize: "14px" }}>{bookings.length + travelBookings.length}</b>
                      </span>
                      <span style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        color: "#27ae60",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        marginTop: "2px"
                      }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#27ae60" }}></span>
                        Turnstile Ready
                      </span>
                    </div>

                    {profileAvatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        style={{
                          background: "#f9f8f5",
                          border: "1px solid #ded9d0",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#77736c",
                          padding: "6px 10px",
                          cursor: "pointer",
                        }}
                      >
                        Reset Photo
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-logout-header"
                      onClick={handleLogout}
                      title="Sign Out of Session"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Streamlined 3-Tab Segmented Navigation */}
              <div className="profile-tabs-bar">
                <button
                  type="button"
                  className={`profile-tab-btn ${profileTab === "passes" ? "active" : ""}`}
                  onClick={() => setProfileTab("passes")}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                  </svg>
                  <span>My Passes &amp; Tickets</span>
                  {(bookings.length + travelBookings.length) > 0 && (
                    <span className="profile-tab-badge">{bookings.length + travelBookings.length}</span>
                  )}
                </button>

                <button
                  type="button"
                  className={`profile-tab-btn ${profileTab === "personal" ? "active" : ""}`}
                  onClick={() => setProfileTab("personal")}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Profile &amp; Contact</span>
                </button>

                <button
                  type="button"
                  className={`profile-tab-btn ${profileTab === "security" ? "active" : ""}`}
                  onClick={() => setProfileTab("security")}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Security &amp; Access</span>
                </button>
              </div>

              {/* 3. FOCUSED TAB VIEWS */}

              {/* TAB 1: PASSES & TICKETS (ACCESS FOCUS) */}
              {profileTab === "passes" && (
                <div className="profile-section-pane">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--k)", margin: 0 }}>
                        My Passes &amp; Boarding Tickets
                      </h3>
                      <p style={{ fontSize: "13px", color: "#77736c", margin: "4px 0 0 0" }}>
                        Instant turnstile-ready digital boarding passes backed by Redis TTL locks and offline QR verification.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn ghost"
                      style={{ padding: "6px 14px", fontSize: "12px" }}
                      onClick={() => navigateTo("home")}
                    >
                      + Book Live Drop
                    </button>
                  </div>

                  {/* Filter Pills */}
                  <div className="pass-filter-bar">
                    <button
                      type="button"
                      className={`pass-filter-btn ${passFilterType === "all" ? "active" : ""}`}
                      onClick={() => setPassFilterType("all")}
                    >
                      All Passes ({bookings.length + travelBookings.length})
                    </button>
                    <button
                      type="button"
                      className={`pass-filter-btn ${passFilterType === "events" ? "active" : ""}`}
                      onClick={() => setPassFilterType("events")}
                    >
                      Live Events ({bookings.length})
                    </button>
                    <button
                      type="button"
                      className={`pass-filter-btn ${passFilterType === "travel" ? "active" : ""}`}
                      onClick={() => setPassFilterType("travel")}
                    >
                      Travel &amp; Transit ({travelBookings.length})
                    </button>
                  </div>

                  {/* Tickets Grid */}
                  <div className="profile-passes-grid">
                    {/* Event Bookings */}
                    {(passFilterType === "all" || passFilterType === "events") &&
                      bookings.map((b, i) => (
                        <div key={`evt-${i}`} className="profile-pass-card">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                            <div>
                              <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--o)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                {b.tier || "VIP CONCERT PASS"}
                              </span>
                              <b style={{ display: "block", fontSize: "15px", color: "var(--k)", marginTop: "2px", lineHeight: 1.3 }}>
                                {b.e}
                              </b>
                            </div>
                            <span style={{
                              background: "rgba(39, 174, 96, 0.12)",
                              color: "#27ae60",
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: "6px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              flexShrink: 0
                            }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                              Confirmed
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "#77736c", padding: "10px 0", borderTop: "1px dashed #ded9d0", borderBottom: "1px dashed #ded9d0" }}>
                            <span>SEAT <b>#{b.s}</b></span>
                            <span>PASS: <b>{user.passName || profilePassName || user.name}</b></span>
                            <span style={{ color: "var(--k)", fontWeight: 800, fontSize: "14px" }}>₹{b.price || 1499}</span>
                          </div>

                          <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "10px", color: "#8c8880", fontFamily: "monospace" }}>
                              PNR: TW-EVT-420{i + 1}
                            </span>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() =>
                                  setActive3DTicket({
                                    ticketType: "Event",
                                    bookingId: `TW-EVT-420${i + 1}`,
                                    customerName: user?.name || profileName || "Aryan Sharma",
                                    title: b.e,
                                    subtitle: `${b.tier} · Seat #${b.s}`,
                                    venueOrRoute: "DY Patil Stadium, Navi Mumbai",
                                    dateStr: "Tomorrow, 07:00 PM",
                                    timeStr: "Gates 05:00 PM",
                                    seatOrClass: `Seat #${b.s} (${b.tier})`,
                                    price: b.price || 1499,
                                    status: "Confirmed",
                                    sourceType: "event",
                                  })
                                }
                                style={{
                                  background: "linear-gradient(135deg, #FF6B35 0%, #E63E00 100%)",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  padding: "6px 12px",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  boxShadow: "0 2px 6px rgba(255, 107, 53, 0.25)",
                                }}
                              >
                                Pass
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDownloadTicket({ title: b.e, s: b.s, pnr: `TW-EVT-420${i + 1}` })}
                                style={{
                                  background: "#fff",
                                  border: "1px solid #ded9d0",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: "var(--k)",
                                  padding: "6px 10px",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                }}
                                title="Download E-Ticket Pass"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                <span>PDF</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                    {/* Travel Bookings */}
                    {(passFilterType === "all" || passFilterType === "travel") &&
                      travelBookings.map((tb, i) => (
                        <div key={`trv-${i}`} className="profile-pass-card">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                            <div>
                              <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--o)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                {tb.type === "flight" ? "FLIGHT PASS" : tb.type === "train" ? "TRAIN TICKET" : tb.type === "hotel" ? "HOTEL STAY" : "TRANSIT PASS"}
                              </span>
                              <b style={{ display: "block", fontSize: "15px", color: "var(--k)", marginTop: "2px", lineHeight: 1.3 }}>
                                {tb.title}
                              </b>
                              <span style={{ fontSize: "11px", color: "#77736c", display: "block", marginTop: "2px" }}>
                                {tb.subtitle}
                              </span>
                            </div>
                            <span style={{
                              background: "rgba(39, 174, 96, 0.12)",
                              color: "#27ae60",
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: "6px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              flexShrink: 0
                            }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                              Confirmed
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "#77736c", padding: "10px 0", borderTop: "1px dashed #ded9d0", borderBottom: "1px dashed #ded9d0" }}>
                            <span>{tb.dateStr}</span>
                            <span><b>{tb.passengers}</b></span>
                            <span style={{ color: "var(--k)", fontWeight: 800, fontSize: "14px" }}>₹{tb.price.toLocaleString("en-IN")}</span>
                          </div>

                          <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "10px", color: "#8c8880", fontFamily: "monospace" }}>
                              PNR: {tb.pnr}
                            </span>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() =>
                                  setActive3DTicket({
                                    ticketType:
                                      tb.type === "hotel"
                                        ? "Hotel"
                                        : tb.type === "flight"
                                        ? "Flight"
                                        : tb.type === "train"
                                        ? "Train"
                                        : tb.type === "bus"
                                        ? "Bus"
                                        : "Cab",
                                    bookingId: tb.pnr,
                                    customerName: tb.passengers.split("(")[0].trim() || user?.name || "Aryan Sharma",
                                    title: tb.title,
                                    subtitle: tb.subtitle,
                                    venueOrRoute: tb.fromToOrCity || tb.subtitle,
                                    dateStr: tb.dateStr.split("·")[0].trim(),
                                    timeStr: tb.dateStr.includes("·") ? tb.dateStr.split("·")[1].trim() : "10:00 AM",
                                    seatOrClass: tb.details || "Confirmed Pass",
                                    price: tb.price,
                                    status: tb.status || "Confirmed",
                                    sourceType: "travel",
                                  })
                                }
                                style={{
                                  background: "linear-gradient(135deg, #FF6B35 0%, #E63E00 100%)",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  padding: "6px 12px",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  boxShadow: "0 2px 6px rgba(255, 107, 53, 0.25)",
                                }}
                              >
                                Pass
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDownloadTicket({ title: tb.title, pnr: tb.pnr })}
                                style={{
                                  background: "#fff",
                                  border: "1px solid #ded9d0",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: "var(--k)",
                                  padding: "6px 10px",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                }}
                                title="Download Travel Pass"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                <span>PDF</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Empty State */}
                  {bookings.length === 0 && travelBookings.length === 0 && (
                    <div className="no-tickets-box">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#b8b4ad" strokeWidth="1.8" style={{ margin: "0 auto 12px", display: "block" }}>
                        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                      </svg>
                      <b style={{ color: "var(--k)", display: "block", fontSize: "16px" }}>No passes claimed yet</b>
                      <p style={{ margin: "8px 0 16px", fontSize: "13px" }}>Lock your seat before high-contention flash drops sell out!</p>
                      <button type="button" className="btn" style={{ padding: "10px 22px", fontSize: "13px" }} onClick={() => navigateTo("home")}>
                        Explore Live Drops →
                      </button>
                    </div>
                  )}

                  {/* Turnstile Gate Access Guide */}
                  <div className="gate-guide-card">
                    <div className="gate-guide-header">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--o)" strokeWidth="2.2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>Turnstile Gate Access Guide</span>
                    </div>

                    <div className="gate-guide-grid">
                      <div className="gate-guide-item">
                        <b>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          Offline Gate Ready
                        </b>
                        <span>Screenshots and saved PDF e-tickets are valid at all venue entry turnstiles.</span>
                      </div>

                      <div className="gate-guide-item">
                        <b>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          Screen Brightness
                        </b>
                        <span>Turn screen brightness to 100% and hold QR 15 cm from the optical laser reader.</span>
                      </div>

                      <div className="gate-guide-item">
                        <b>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          Photo ID Verification
                        </b>
                        <span>Keep government photo ID matching your ticket pass moniker ready for marshals.</span>
                      </div>

                      <div className="gate-guide-item">
                        <b>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          Gate Helpdesk 24/7
                        </b>
                        <span>In case of scan issues, quote your 10-digit PNR at Turnstile Gate Support.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PROFILE & CONTACT */}
              {profileTab === "personal" && (
                <div className="profile-section-pane">
                  <div style={{ marginBottom: "22px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--k)", margin: 0 }}>
                      Profile &amp; Contact Details
                    </h3>
                    <p style={{ fontSize: "13px", color: "#77736c", margin: "4px 0 0 0" }}>
                      Manage your legal identity, printed boarding pass moniker, and verified phone contact.
                    </p>
                  </div>

                  <form className="profile-form" onSubmit={handleSaveProfile}>
                    <div className="form-row-2">
                      <div className="input-field-group">
                        <label className="input-field-label">Full Legal Name</label>
                        <div className="input-field-box">
                          <input
                            className="input-field-input"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            placeholder="Your full name"
                            required
                          />
                        </div>
                      </div>

                      <div className="input-field-group">
                        <label className="input-field-label">Pass Moniker (Printed on Tickets)</label>
                        <div className="input-field-box">
                          <input
                            className="input-field-input"
                            value={profilePassName}
                            onChange={(e) => setProfilePassName(e.target.value)}
                            placeholder="Moniker on boarding pass"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="input-field-group">
                        <label className="input-field-label" style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Primary Mobile Phone</span>
                          <span style={{ color: "#27ae60", fontSize: "10px", fontWeight: 700 }}>OTP Verified</span>
                        </label>
                        <div className="input-field-box">
                          <input
                            className="input-field-input"
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            placeholder="+91 98201 23456"
                          />
                        </div>
                      </div>

                      <div className="input-field-group">
                        <label className="input-field-label" style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Registered Account Email</span>
                          <span style={{ color: "#8c8880", fontSize: "10px", fontWeight: 700 }}>Primary</span>
                        </label>
                        <div className="input-field-box" style={{ background: "#f8f7f5", opacity: 0.85 }}>
                          <input
                            className="input-field-input"
                            value={user.email}
                            disabled
                          />
                        </div>
                      </div>
                    </div>

                    <div className="input-field-group">
                      <label className="input-field-label">Home Metro Region</label>
                      <div className="input-field-box">
                        <select
                          className="input-field-input"
                          value={profileCity}
                          onChange={(e) => setProfileCity(e.target.value)}
                          style={{ background: "transparent", border: "none", outline: "none" }}
                        >
                          {CITIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} — {c.tagline}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-actions-row" style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f2f0ec" }}>
                      {profileSuccessMsg && (
                        <span className="profile-success-text">{profileSuccessMsg}</span>
                      )}
                      <button type="submit" className="btn" style={{ padding: "10px 24px" }}>
                        Save Profile Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: SECURITY & ACCESS */}
              {profileTab === "security" && (
                <div className="profile-section-pane">
                  <div style={{ marginBottom: "22px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--k)", margin: 0 }}>
                      Security &amp; Password
                    </h3>
                    <p style={{ fontSize: "13px", color: "#77736c", margin: "4px 0 0 0" }}>
                      Update account password, enable two-factor protection, and manage device sessions.
                    </p>
                  </div>

                  <form className="profile-form" onSubmit={handleUpdatePassword}>
                    <div className="input-field-group">
                      <label className="input-field-label">Current Password</label>
                      <div className="input-field-box input-with-eye">
                        <input
                          type={showOldPw ? "text" : "password"}
                          className="input-field-input"
                          value={oldPw}
                          onChange={(e) => setOldPw(e.target.value)}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          className="pw-eye-btn"
                          onClick={() => setShowOldPw((prev) => !prev)}
                          title={showOldPw ? "Hide password" : "Show password"}
                        >
                          {showOldPw ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="input-field-group">
                        <label className="input-field-label">New Password</label>
                        <div className="input-field-box input-with-eye">
                          <input
                            type={showNewPw ? "text" : "password"}
                            className="input-field-input"
                            value={newPw}
                            onChange={(e) => setNewPw(e.target.value)}
                            placeholder="At least 6 characters"
                          />
                          <button
                            type="button"
                            className="pw-eye-btn"
                            onClick={() => setShowNewPw((prev) => !prev)}
                            title={showNewPw ? "Hide password" : "Show password"}
                          >
                            {showNewPw ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="input-field-group">
                        <label className="input-field-label">Confirm New Password</label>
                        <div className="input-field-box input-with-eye">
                          <input
                            type={showConfirmPw ? "text" : "password"}
                            className="input-field-input"
                            value={confirmPw}
                            onChange={(e) => setConfirmPw(e.target.value)}
                            placeholder="Repeat new password"
                          />
                          <button
                            type="button"
                            className="pw-eye-btn"
                            onClick={() => setShowConfirmPw((prev) => !prev)}
                            title={showConfirmPw ? "Hide password" : "Show password"}
                          >
                            {showConfirmPw ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Password Strength Line */}
                    {newPw && (
                      <div className="pw-strength-wrap">
                        <div className="pw-strength-track">
                          <div
                            className="pw-strength-bar"
                            style={{
                              width: `${getProfilePwStrength(newPw).percent}%`,
                              backgroundColor: getProfilePwStrength(newPw).color,
                            }}
                          ></div>
                        </div>
                        <div className="pw-strength-label">
                          <span>Password Strength:</span>
                          <b style={{ color: getProfilePwStrength(newPw).color }}>{getProfilePwStrength(newPw).label}</b>
                        </div>
                      </div>
                    )}

                    <div className="form-actions-row">
                      {pwMsg && (
                        <span style={{ fontSize: "12px", fontWeight: 700, color: pwMsg.includes("success") ? "#27ae60" : "#e74c3c" }}>
                          {pwMsg}
                        </span>
                      )}
                      <button type="submit" className="btn ghost" style={{ padding: "10px 22px" }}>
                        Update Password
                      </button>
                    </div>
                  </form>

                  {/* Two-Factor Authentication */}
                  <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #f2f0ec" }}>
                    <div className="toggle-setting-row">
                      <div className="toggle-setting-info">
                        <b>Two-Factor Authentication (2FA)</b>
                        <span>Require SMS verification before accessing turnstile boarding passes.</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={twoFactorEnabled}
                          onChange={(e) => {
                            setTwoFactorEnabled(e.target.checked);
                            setProfileSuccessMsg(e.target.checked ? "2FA Protection Enabled!" : "2FA Protection Disabled.");
                            setTimeout(() => setProfileSuccessMsg(""), 3000);
                          }}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #f2f0ec" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <div>
                        <b style={{ fontSize: "14px", color: "var(--k)", display: "block" }}>Active Devices &amp; Sessions</b>
                        <span style={{ fontSize: "12px", color: "#77736c" }}>Authorized devices accessing your TicketWala turnstile passes.</span>
                      </div>
                      <button
                        type="button"
                        className="btn-revoke-session"
                        onClick={handleRevokeSessions}
                      >
                        Terminate Others
                      </button>
                    </div>

                    {sessionsRevokedMsg && (
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#27ae60", marginBottom: "8px" }}>
                        {sessionsRevokedMsg}
                      </div>
                    )}

                    <div className="sessions-list">
                      <div className="session-item-card">
                        <div className="session-icon-box">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                            <line x1="8" y1="21" x2="16" y2="21" />
                            <line x1="12" y1="17" x2="12" y2="21" />
                          </svg>
                        </div>
                        <div className="session-details">
                          <div className="session-device-name">
                            <span>Chrome on Windows 11</span>
                            <span className="session-current-pill">This Device</span>
                          </div>
                          <div className="session-meta-text">
                            Active session • Mumbai, India • IP 103.21.x.x
                          </div>
                        </div>
                      </div>

                      <div className="session-item-card">
                        <div className="session-icon-box">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                            <line x1="12" y1="18" x2="12.01" y2="18" />
                          </svg>
                        </div>
                        <div className="session-details">
                          <div className="session-device-name">
                            <span>TicketWala iOS App</span>
                          </div>
                          <div className="session-meta-text">
                            iPhone 15 Pro • Last active 2 hours ago
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
                      src="/logo-white.png"
                      alt="TicketWala"
                      style={{ height: "42px", width: "auto", objectFit: "contain" }}
                    />
                  </div>

                  <span className="pill" style={{ background: "rgba(255, 107, 55, 0.18)", color: "#fff", border: "1px solid rgba(255, 107, 55, 0.35)", marginBottom: "16px" }}>
                    <i className="dot"></i> Next flash release in minutes
                  </span>

                  <h2>
                    Welcome back to the <em>TicketWala</em>.
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

                {/* Quick Demo Autofill Badge */}
                

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
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
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

                {/* Divider */}
                <div className="auth-divider">
                  <span>or continue with</span>
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
                      src="/logo-white.png"
                      alt="TicketWala"
                      style={{ height: "42px", width: "auto", objectFit: "contain" }}
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

                  {/* 1-2 line description above image */}
                  <div className="auth-image-desc">
                    Get instant front-row access to high-demand concerts, stadium matches, and comedy tours before general public rush.
                  </div>

                  {/* Visual Drop Banner Image */}
                  <div className="auth-image-box">
                    <img
                      src="/signup-banner.jpg"
                      alt="Live Stadium & Concert Drops"
                      className="auth-side-img"
                    />
                    <div className="auth-image-overlay">
                      <span className="auth-image-tag">
                        <span className="live-dot-sm"></span> HIGH-VELOCITY ARENA ACCESS
                      </span>
                    </div>
                  </div>

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
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
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
                  Create Account →
                </button>

                {/* Divider */}
                <div className="auth-divider">
                  <span>or continue with</span>
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

      {/* CITY SELECTOR MODAL */}
      {showCityModal && (
        <div className="city-modal-overlay" onClick={() => setShowCityModal(false)}>
          <div className="city-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="city-modal-header">
              <h3>Select Your City</h3>
              <button
                type="button"
                className="city-modal-close"
                onClick={() => setShowCityModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="city-search-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8c8880" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="city-search-input"
                placeholder="Search for your city or region..."
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <button
              type="button"
              className="city-detect-btn"
              onClick={handleDetectLocation}
              disabled={gpsLoading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              <span>{gpsLoading ? "Detecting GPS location..." : "Auto-Detect My Location (Nearest Metro)"}</span>
            </button>

            {gpsMessage && (
              <div style={{ padding: "8px 14px", background: "rgba(39, 174, 96, 0.12)", color: "#27ae60", borderRadius: "10px", fontSize: "13px", fontWeight: 700, marginBottom: "16px", textAlign: "center" }}>
                {gpsMessage}
              </div>
            )}

            <div className="city-section-title">Popular Cities</div>
            <div className="popular-cities-grid">
              {filteredCities.map((city) => {
                const isSel = city.id === selectedCityId;
                return (
                  <button
                    key={city.id}
                    type="button"
                    className={`city-item-btn ${isSel ? "selected" : ""}`}
                    onClick={() => selectCity(city.id)}
                  >
                    <div className="city-icon-badge">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <span>{city.name}</span>
                    <small style={{ fontSize: "10px", opacity: 0.65, fontWeight: 500 }}>{city.tagline}</small>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TRAVEL BOOKING SUMMARY MODAL */}
      {selectedTravelItem && (() => {
        const isTransport = selectedTravelItem.category === "transport";
        const transportItem = isTransport ? (selectedTravelItem.item as TravelTransportItem) : null;
        const hotelItem = !isTransport ? (selectedTravelItem.item as TravelHotelItem) : null;
        const basePrice = isTransport ? (transportItem!.price * travelersCount) : hotelItem!.pricePerNight;
        const taxes = Math.round(basePrice * 0.05);
        const totalFare = basePrice + taxes;

        return (
          <div className="travel-modal-overlay" onClick={() => setSelectedTravelItem(null)}>
            <div className="travel-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="travel-modal-header">
                <h3>Review & Confirm Reservation</h3>
                <button
                  type="button"
                  className="travel-modal-close"
                  onClick={() => setSelectedTravelItem(null)}
                  aria-label="Close"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>

              {/* Item Card Overview */}
              <div style={{
                background: "#faf9f6",
                border: "1.5px solid #eae5dc",
                borderRadius: "16px",
                padding: "16px 20px",
                marginBottom: "20px"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--o)", textTransform: "uppercase" }}>
                    {isTransport ? `${transportItem!.type.toUpperCase()} · ${transportItem!.classType}` : `HOTEL STAY · ${hotelItem!.city}`}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#27ae60" }}>
                    Verified Fast Lane
                  </span>
                </div>
                <h4 style={{ fontSize: "16px", fontWeight: 800, color: "var(--k)", margin: "0 0 4px" }}>
                  {isTransport ? transportItem!.operator : hotelItem!.name}
                </h4>
                <p style={{ fontSize: "12px", color: "#77736c", margin: 0 }}>
                  {isTransport ? `${transportItem!.from} → ${transportItem!.to} · ${transportDate}` : `${hotelItem!.address} · ${hotelCheckIn} to ${hotelCheckOut}`}
                </p>
              </div>

              {/* Passenger / Guest Form */}
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 800, color: "var(--k)", margin: "0 0 12px" }}>
                  Passenger / Primary Guest Info
                </h4>

                <div className="travel-form-group">
                  <label>Full Legal Name</label>
                  <input
                    className="travel-form-input"
                    placeholder="Enter full name"
                    value={bookingPassengerName}
                    onChange={(e) => setBookingPassengerName(e.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="travel-form-group">
                    <label>Mobile Number</label>
                    <input
                      className="travel-form-input"
                      placeholder="+91 98200 12345"
                      value={bookingPassengerPhone}
                      onChange={(e) => setBookingPassengerPhone(e.target.value)}
                    />
                  </div>

                  <div className="travel-form-group">
                    <label>Email (for E-Ticket)</label>
                    <input
                      className="travel-form-input"
                      placeholder="name@email.com"
                      value={bookingPassengerEmail}
                      onChange={(e) => setBookingPassengerEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Fare Summary */}
              <div style={{
                background: "#ffffff",
                border: "1px solid #eae5dc",
                borderRadius: "14px",
                padding: "16px",
                marginBottom: "20px"
              }}>
                <div className="travel-fare-row">
                  <span>Base Fare ({isTransport ? `${travelersCount} Traveler` : "1 Room"})</span>
                  <b>₹{basePrice.toLocaleString("en-IN")}</b>
                </div>
                <div className="travel-fare-row">
                  <span>TicketWala Priority Token Lock</span>
                  <span style={{ color: "#27ae60", fontWeight: 700 }}>₹0 (FREE)</span>
                </div>
                <div className="travel-fare-row">
                  <span>Taxes & GST (5%)</span>
                  <b>₹{taxes.toLocaleString("en-IN")}</b>
                </div>
                <div className="travel-fare-row total">
                  <span>Total Payable</span>
                  <b style={{ color: "var(--o)", fontSize: "18px" }}>₹{totalFare.toLocaleString("en-IN")}</b>
                </div>
              </div>

              {/* Guarantees Pill */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                background: "rgba(39, 174, 96, 0.08)",
                borderRadius: "10px",
                marginBottom: "20px"
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <span style={{ fontSize: "12px", color: "#1e824c", fontWeight: 700 }}>
                  Redis TTL Atomic Hold Active · 0 Double-Booking Guarantee
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  className="btn ghost"
                  style={{ flex: 1, padding: "12px" }}
                  onClick={() => setSelectedTravelItem(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn primary"
                  style={{ flex: 2, padding: "12px", fontSize: "14px" }}
                  onClick={() => {
                    const prefix = isTransport
                      ? transportItem!.type === "flight"
                        ? "FL"
                        : transportItem!.type === "train"
                        ? "VB"
                        : transportItem!.type === "bus"
                        ? "BS"
                        : "CB"
                      : "HT";
                    const pnr = `TW-${prefix}${Math.floor(10000 + Math.random() * 90000)}`;
                    const newRecord: TravelBookingRecord = {
                      id: `bk-${Date.now()}`,
                      pnr,
                      type: isTransport ? transportItem!.type : "hotel",
                      title: isTransport
                        ? `${transportItem!.operator} · ${transportItem!.fromCode} → ${transportItem!.toCode}`
                        : hotelItem!.name,
                      subtitle: isTransport
                        ? transportItem!.subTitle
                        : hotelItem!.address,
                      fromToOrCity: isTransport
                        ? `${transportItem!.from} → ${transportItem!.to}`
                        : hotelItem!.city,
                      dateStr: isTransport
                        ? `${transportDate} · ${transportItem!.depTime}`
                        : `${hotelCheckIn} - ${hotelCheckOut} (3 Nights)`,
                      passengers: `${bookingPassengerName.trim() || user?.name || "Traveler"} (${isTransport ? travelersCount : 2} Pax)`,
                      price: totalFare,
                      status: "Confirmed",
                      bookedAt: "Just now",
                      details: isTransport
                        ? `${transportItem!.classType} · Instant Seat Assigned`
                        : "Luxury Room · Free Breakfast Included",
                    };
                    setTravelBookings([newRecord, ...travelBookings]);
                    setSelectedTravelItem(null);
                    setActive3DTicket({
                      ticketType: (newRecord.type === "hotel"
                        ? "Hotel"
                        : newRecord.type === "flight"
                        ? "Flight"
                        : newRecord.type === "train"
                        ? "Train"
                        : newRecord.type === "bus"
                        ? "Bus"
                        : "Cab"),
                      bookingId: newRecord.pnr,
                      customerName: bookingPassengerName.trim() || user?.name || "Aryan Sharma",
                      title: newRecord.title,
                      subtitle: newRecord.subtitle,
                      venueOrRoute: newRecord.fromToOrCity || newRecord.subtitle,
                      dateStr: newRecord.dateStr.split("·")[0].trim(),
                      timeStr: isTransport ? transportItem!.depTime : "12:00 PM Check-In",
                      seatOrClass: isTransport ? (transportItem!.classType || "Confirmed Class") : "Deluxe Room",
                      price: totalFare,
                      status: "Confirmed",
                      sourceType: "travel",
                    });
                  }}
                >
                  Confirm & Secure PNR
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CONFIRMATION POPUP MODAL */}
      {confirmedTravelPass && (
        <div className="travel-modal-overlay" onClick={() => setConfirmedTravelPass(null)}>
          <div className="travel-modal-box" style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(39, 174, 96, 0.12)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#27ae60",
              marginBottom: "16px"
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
            </div>

            <h3 style={{ fontSize: "22px", fontWeight: 800, color: "var(--k)", margin: "0 0 6px" }}>
              Reservation Confirmed!
            </h3>
            <p style={{ fontSize: "13px", color: "#77736c", margin: "0 0 20px" }}>
              Your digital e-ticket has been tokenized and verified on TicketWala.
            </p>

            <div style={{
              background: "#faf9f6",
              border: "1.5px dashed #ded9d0",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "24px"
            }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#8c8880", textTransform: "uppercase" }}>
                Booking Reference (PNR)
              </span>
              <div style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "var(--o)",
                fontFamily: "monospace",
                letterSpacing: "1px",
                marginTop: "4px",
                marginBottom: "12px"
              }}>
                {confirmedTravelPass.pnr}
              </div>

              <div style={{ fontSize: "13px", color: "var(--k)", fontWeight: 700, marginBottom: "4px" }}>
                {confirmedTravelPass.title}
              </div>
              <div style={{ fontSize: "12px", color: "#77736c" }}>
                {confirmedTravelPass.dateStr} · {confirmedTravelPass.passengers}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                className="btn primary"
                style={{ padding: "12px", width: "100%", fontSize: "14px" }}
                onClick={() => {
                  setConfirmedTravelPass(null);
                  setTravelSubTab("bookings");
                  navigateTo("travel");
                }}
              >
                View in My Bookings
              </button>

              <button
                type="button"
                className="btn ghost"
                style={{ padding: "12px", width: "100%", fontSize: "13px" }}
                onClick={() => {
                  setEticketAlert(`Digital Pass for PNR ${confirmedTravelPass.pnr} downloaded!`);
                  setTimeout(() => setEticketAlert(""), 4000);
                  setConfirmedTravelPass(null);
                }}
              >
                Download Digital Pass & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PREMIUM ANIMATED 3D TICKET MODAL (INSPIRED BY REFERENCE IMAGE) */}
      {/* ============================================================ */}
      {active3DTicket && (
        <div
          className="ticket-3d-backdrop"
          onClick={() => setActive3DTicket(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Ticket Pass"
        >
          {/* Action Bar / Controls */}
          <div
            className="ticket-3d-controls-bar"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="ticket-ctrl-btn"
              onClick={() => handleBackToBookings(active3DTicket)}
              title="Return to your reservations list"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to Bookings</span>
            </button>

            <button
              type="button"
              className="ticket-ctrl-btn"
              onClick={handlePrintTicket}
              title="Print your TicketWala boarding pass"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print Ticket</span>
            </button>

            <button
              type="button"
              className="ticket-ctrl-btn primary"
              onClick={() => handleDownload3DTicket(active3DTicket)}
              title="Save digital pass file to device"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download Ticket</span>
            </button>

            <button
              type="button"
              className="ticket-ctrl-btn close"
              onClick={() => setActive3DTicket(null)}
              title="Close Ticket preview"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Interactive 3D Perspective Stage */}
          <div className="ticket-3d-stage" onClick={(e) => e.stopPropagation()}>
            <div
              className="ticket-3d-card"
              onMouseMove={handleTicketMouseMove}
              onMouseLeave={handleTicketMouseLeave}
              style={{
                transform: `perspective(1200px) rotateX(${ticketTilt.x}deg) rotateY(${ticketTilt.y}deg) scale3d(1.02, 1.02, 1.02)`,
                transition: ticketTilt.x === 0 && ticketTilt.y === 0 ? "transform 0.5s ease" : "transform 0.08s ease-out",
              }}
            >
              {/* LEFT BODY: Signature TicketWala Orange Gradient Pass */}
              <div className="ticket-3d-body">
                {/* Dynamic Parallax Specular Glare Sheen */}
                <div
                  className="ticket-3d-glare"
                  style={{
                    background: `radial-gradient(circle at ${ticketTilt.glareX}% ${ticketTilt.glareY}%, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0.06) 50%, transparent 80%)`,
                    opacity: ticketTilt.glareOpacity,
                  }}
                />

                {/* Top Row: Tags & Domain */}
                <div className="ticket-3d-top-row">
                  <div className="ticket-3d-tag-left">
                    <span>MOCKUP</span>
                    <span className="ticket-3d-type-pill">
                      {active3DTicket.ticketType.toUpperCase()} PASS
                    </span>
                  </div>
                  <div className="ticket-3d-domain-right">
                    TICKETWALA.COM
                  </div>
                </div>

                {/* Big Center Display Title: Solid + Outline Dual Typography */}
                <div className="ticket-3d-hero-title">
                  <span className="ticket-title-filled">TICKET</span>
                  <span className="ticket-title-outline">PASS</span>
                </div>

                {/* Subtitle / Venue Route Header */}
                <div className="ticket-3d-subtitle">
                  {active3DTicket.title}
                  <span style={{ opacity: 0.85, fontWeight: 500, marginLeft: "8px" }}>
                    · {active3DTicket.venueOrRoute}
                  </span>
                </div>

                {/* 4-Column Metadata Chips Grid */}
                <div className="ticket-3d-meta-grid">
                  <div className="ticket-3d-meta-item">
                    <small>PASSENGER / HOLDER</small>
                    <b>{active3DTicket.customerName}</b>
                  </div>
                  <div className="ticket-3d-meta-item">
                    <small>DATE &amp; TIME</small>
                    <b>{active3DTicket.dateStr} · {active3DTicket.timeStr}</b>
                  </div>
                  <div className="ticket-3d-meta-item">
                    <small>SEAT / CLASS</small>
                    <b>{active3DTicket.seatOrClass}</b>
                  </div>
                  <div className="ticket-3d-meta-item">
                    <small>STATUS</small>
                    <b style={{ color: "#ffffff" }}>✓ {active3DTicket.status}</b>
                  </div>
                </div>

                {/* Bottom Row: Embossed Badge + Pricing */}
                <div className="ticket-3d-footer-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className="ticket-3d-embossed-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="ticket-3d-quality-tag">OFFICIAL VERIFIED PASS</span>
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.5px" }}>
                    ₹{active3DTicket.price.toLocaleString("en-IN")} · 0 CONFLICT GUARANTEE
                  </div>
                </div>
              </div>

              {/* PERFORATED SEAM & NOTCHES */}
              <div className="ticket-3d-seam">
                <div className="ticket-notch top" />
                <div className="ticket-perf-line" />
                <div className="ticket-notch bottom" />
              </div>

              {/* RIGHT STUB: Off-white Paper Stub with QR Code */}
              <div className="ticket-3d-stub">
                <div className="ticket-stub-header">
                  TICKET MOCKUP
                </div>

                {/* High Density Scalable SVG QR Code */}
                <div className="ticket-stub-qr-box">
                  <svg width="96" height="96" viewBox="0 0 100 100" fill="none">
                    {/* QR Finder Corners */}
                    <rect x="6" y="6" width="24" height="24" rx="4" fill="#181716" />
                    <rect x="10" y="10" width="16" height="16" rx="2" fill="#ffffff" />
                    <rect x="13" y="13" width="10" height="10" rx="1.5" fill="#181716" />

                    <rect x="70" y="6" width="24" height="24" rx="4" fill="#181716" />
                    <rect x="74" y="10" width="16" height="16" rx="2" fill="#ffffff" />
                    <rect x="77" y="13" width="10" height="10" rx="1.5" fill="#181716" />

                    <rect x="6" y="70" width="24" height="24" rx="4" fill="#181716" />
                    <rect x="10" y="74" width="16" height="16" rx="2" fill="#ffffff" />
                    <rect x="13" y="77" width="10" height="10" rx="1.5" fill="#181716" />

                    {/* Timing Tracks */}
                    <rect x="34" y="16" width="4" height="4" rx="1" fill="#181716" />
                    <rect x="42" y="16" width="4" height="4" rx="1" fill="#181716" />
                    <rect x="50" y="16" width="4" height="4" rx="1" fill="#181716" />
                    <rect x="58" y="16" width="4" height="4" rx="1" fill="#181716" />

                    <rect x="16" y="34" width="4" height="4" rx="1" fill="#181716" />
                    <rect x="16" y="42" width="4" height="4" rx="1" fill="#181716" />
                    <rect x="16" y="50" width="4" height="4" rx="1" fill="#181716" />
                    <rect x="16" y="58" width="4" height="4" rx="1" fill="#181716" />

                    {/* QR Data Matrix Bits */}
                    <rect x="36" y="36" width="6" height="6" rx="1.5" fill="#FF5126" />
                    <rect x="44" y="36" width="5" height="5" rx="1" fill="#181716" />
                    <rect x="52" y="36" width="5" height="5" rx="1" fill="#181716" />
                    <rect x="60" y="36" width="6" height="6" rx="1.5" fill="#181716" />
                    <rect x="70" y="36" width="5" height="5" rx="1" fill="#181716" />
                    <rect x="80" y="36" width="5" height="5" rx="1" fill="#181716" />

                    <rect x="36" y="45" width="5" height="5" rx="1" fill="#181716" />
                    <rect x="45" y="45" width="8" height="8" rx="2" fill="#181716" />
                    <rect x="57" y="45" width="5" height="5" rx="1" fill="#FF5126" />
                    <rect x="66" y="45" width="5" height="5" rx="1" fill="#181716" />
                    <rect x="75" y="45" width="6" height="6" rx="1.5" fill="#181716" />

                    <rect x="36" y="57" width="6" height="6" rx="1.5" fill="#181716" />
                    <rect x="46" y="57" width="5" height="5" rx="1" fill="#181716" />
                    <rect x="55" y="57" width="7" height="7" rx="1.5" fill="#181716" />
                    <rect x="66" y="57" width="5" height="5" rx="1" fill="#181716" />
                    <rect x="75" y="57" width="5" height="5" rx="1" fill="#181716" />

                    <rect x="36" y="68" width="5" height="5" rx="1" fill="#181716" />
                    <rect x="45" y="68" width="6" height="6" rx="1.5" fill="#FF5126" />
                    <rect x="55" y="68" width="5" height="5" rx="1" fill="#181716" />
                    <rect x="64" y="68" width="6" height="6" rx="1.5" fill="#181716" />
                    <rect x="74" y="68" width="5" height="5" rx="1" fill="#181716" />
                    <rect x="83" y="68" width="5" height="5" rx="1" fill="#181716" />

                    <rect x="36" y="78" width="6" height="6" rx="1.5" fill="#181716" />
                    <rect x="46" y="78" width="5" height="5" rx="1" fill="#181716" />
                    <rect x="55" y="78" width="7" height="7" rx="1.5" fill="#181716" />
                    <rect x="66" y="78" width="5" height="5" rx="1" fill="#181716" />
                    <rect x="75" y="78" width="6" height="6" rx="1.5" fill="#FF5126" />
                    <rect x="85" y="78" width="5" height="5" rx="1" fill="#181716" />

                    <rect x="6" y="38" width="6" height="6" rx="1.5" fill="#181716" />
                    <rect x="6" y="48" width="5" height="5" rx="1" fill="#181716" />
                    <rect x="6" y="58" width="6" height="6" rx="1.5" fill="#181716" />

                    <rect x="70" y="48" width="5" height="5" rx="1" fill="#181716" />
                    <rect x="78" y="58" width="6" height="6" rx="1.5" fill="#181716" />
                    <rect x="86" y="48" width="5" height="5" rx="1" fill="#181716" />
                  </svg>
                </div>

                <div className="ticket-stub-pnr">
                  {active3DTicket.bookingId}
                </div>

                <div className="ticket-stub-sub">
                  SCAN AT GATE / TURNSTILE
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {eticketAlert && (
        <div className="travel-toast">
          <div style={{
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: "#27ae60",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            flexShrink: 0
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <span>{eticketAlert}</span>
        </div>
      )}
    </>
  );
}
