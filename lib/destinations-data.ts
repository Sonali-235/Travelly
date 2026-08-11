import { Destination } from "./types";

/**
 * ============================================================================
 * THIS FILE IS NO LONGER USED AT RUNTIME.
 * ============================================================================
 * Since the database was added, the live app reads destinations from
 * Supabase via lib/destinations-db.ts, and you manage them from /admin.
 *
 * This file is kept only as the source that generated the seed data in
 * supabase/schema.sql. Editing this file has no effect on the live app —
 * edit destinations from the admin panel instead.
 * ============================================================================
 */

/**
 * ============================================================================
 * READ THIS BEFORE LAUNCH
 * ============================================================================
 * Every hotel, restaurant, price, phone number, and fee below is PLACEHOLDER
 * data — written to show you the correct shape/structure, not real facts.
 *
 * Travelly's entire trust model depends on "Verified" data actually being
 * verified by you. Before this destination goes live:
 *   1. Research real hotels, restaurants, entry fees, and contacts yourself
 *      (or from a source you trust — official tourism sites, direct calls, etc).
 *   2. Replace every field below with the real value.
 *   3. Set `isSampleData: false` — the app can use this flag later to warn
 *      you (or block launch) if placeholder data is still live.
 *
 * Add a new destination by copying one of the two objects below and filling
 * it in — no other code needs to change.
 * ============================================================================
 */

export const destinations: Destination[] = [
  {
    id: "jaipur",
    name: "Jaipur",
    state: "Rajasthan",
    tagline: "The Pink City — forts, bazaars, and Rajasthani royalty",
    bestSeason: "October to March",
    accentEmoji: "🏰",
    overview:
      "Jaipur pairs hilltop forts and a walled old city painted in terracotta pink with some of India's best palace architecture, block-print textiles, and street food. It's compact enough to cover well in 3-4 days.",
    verified: {
      isSampleData: true,
      lastVerifiedOn: "REPLACE — e.g. 2026-08-01",
      hotels: [
        {
          name: "[Add real budget hotel name]",
          category: "budget",
          pricePerNight: "₹1,200 – ₹2,000 (placeholder)",
          contact: "+91-90000-00001 (placeholder)",
          mapsQuery: "Budget hotel near Hawa Mahal Jaipur",
        },
        {
          name: "[Add real mid-range hotel name]",
          category: "mid-range",
          pricePerNight: "₹3,500 – ₹5,500 (placeholder)",
          contact: "+91-90000-00002 (placeholder)",
          mapsQuery: "Mid-range hotel Jaipur city center",
        },
        {
          name: "[Add real luxury hotel/heritage property]",
          category: "luxury",
          pricePerNight: "₹12,000+ (placeholder)",
          contact: "+91-90000-00003 (placeholder)",
          mapsQuery: "Heritage luxury hotel Jaipur",
        },
      ],
      restaurants: [
        {
          name: "[Add real local restaurant — Rajasthani thali]",
          cuisine: "Rajasthani thali",
          priceRange: "₹300 – ₹500 for two (placeholder)",
          mapsQuery: "Rajasthani thali restaurant Jaipur",
        },
        {
          name: "[Add real street food spot]",
          cuisine: "Street food",
          priceRange: "₹100 – ₹200 for two (placeholder)",
          mapsQuery: "Famous street food Jaipur",
        },
      ],
      attractions: [
        {
          name: "Amber Fort",
          entryFee: "₹REPLACE (Indian) / ₹REPLACE (Foreign) — verify current fee",
          openingHours: "8:00 AM – 5:30 PM (verify)",
          mapsQuery: "Amber Fort Jaipur",
          photographyAllowed: true,
          notes: "Verify elephant/jeep ride pricing separately if offering it.",
        },
        {
          name: "Hawa Mahal",
          entryFee: "₹REPLACE — verify current fee",
          openingHours: "9:00 AM – 4:30 PM (verify)",
          mapsQuery: "Hawa Mahal Jaipur",
          photographyAllowed: true,
        },
        {
          name: "City Palace",
          entryFee: "₹REPLACE — verify current fee",
          openingHours: "9:30 AM – 5:00 PM (verify)",
          mapsQuery: "City Palace Jaipur",
          photographyAllowed: true,
        },
      ],
      emergencyContacts: [
        { label: "Tourist Police Helpline", number: "REPLACE with real number" },
        { label: "Local Police Station", number: "REPLACE with real number" },
        { label: "Nearest Hospital", number: "REPLACE with real number" },
      ],
      localFood: ["Dal Baati Churma", "Pyaaz Kachori", "Ghewar", "Laal Maas"],
      shopping: [
        { name: "Johari Bazaar", specialty: "Jewellery" },
        { name: "Bapu Bazaar", specialty: "Textiles & juttis" },
      ],
      smartWarnings: [
        {
          type: "Cash Recommended",
          message: "Carry cash for smaller shops and street food stalls — verify current card acceptance.",
        },
        {
          type: "Heat Wave",
          message: "Summers (Apr–Jun) get extremely hot — verify seasonal advisory before recommending this period.",
        },
      ],
      permits: undefined,
      transportTips:
        "Auto-rickshaws and app cabs are widely available. Verify current typical fare ranges before publishing.",
    },
  },
  {
    id: "munnar",
    name: "Munnar",
    state: "Kerala",
    tagline: "Tea-carpeted hills and misty Western Ghats mornings",
    bestSeason: "September to May",
    accentEmoji: "🌄",
    overview:
      "Munnar's rolling tea estates, cool climate, and slow pace make it a favourite hill-station escape — good for both relaxed sightseeing and short treks, with easy indoor alternatives on rainy days.",
    verified: {
      isSampleData: true,
      lastVerifiedOn: "REPLACE — e.g. 2026-08-01",
      hotels: [
        {
          name: "[Add real budget homestay/hotel]",
          category: "budget",
          pricePerNight: "₹1,500 – ₹2,500 (placeholder)",
          contact: "+91-90000-00004 (placeholder)",
          mapsQuery: "Budget homestay Munnar",
        },
        {
          name: "[Add real mid-range resort]",
          category: "mid-range",
          pricePerNight: "₹4,000 – ₹6,500 (placeholder)",
          contact: "+91-90000-00005 (placeholder)",
          mapsQuery: "Mid-range resort Munnar",
        },
        {
          name: "[Add real luxury plantation stay]",
          category: "luxury",
          pricePerNight: "₹15,000+ (placeholder)",
          contact: "+91-90000-00006 (placeholder)",
          mapsQuery: "Luxury plantation stay Munnar",
        },
      ],
      restaurants: [
        {
          name: "[Add real Kerala-cuisine restaurant]",
          cuisine: "Kerala meals",
          priceRange: "₹250 – ₹450 for two (placeholder)",
          mapsQuery: "Kerala meals restaurant Munnar",
        },
      ],
      attractions: [
        {
          name: "Eravikulam National Park",
          entryFee: "₹REPLACE — verify current fee, note permit/timing rules",
          openingHours: "7:00 AM – 4:00 PM (verify, seasonal closures possible)",
          mapsQuery: "Eravikulam National Park Munnar",
          photographyAllowed: true,
          notes: "Verify Nilgiri Tahr viewing rules and vehicle-shuttle costs.",
        },
        {
          name: "Tea Museum",
          entryFee: "₹REPLACE — verify current fee",
          openingHours: "9:00 AM – 4:30 PM (verify)",
          mapsQuery: "Tea Museum Munnar",
          photographyAllowed: false,
          notes: "Verify current photography policy inside the museum.",
        },
      ],
      emergencyContacts: [
        { label: "Tourist Police Helpline", number: "REPLACE with real number" },
        { label: "Local Police Station", number: "REPLACE with real number" },
        { label: "Nearest Hospital", number: "REPLACE with real number" },
      ],
      localFood: ["Kerala Sadya", "Appam with Stew", "Karimeen Pollichathu"],
      shopping: [{ name: "Local tea estate shops", specialty: "Tea & spices" }],
      smartWarnings: [
        {
          type: "Heavy Rain",
          message: "Monsoon (Jun–Aug) brings heavy rain and landslide risk on hill roads — verify current advisories.",
        },
        {
          type: "Mobile Network Issues",
          message: "Signal can be patchy in estate areas — verify which networks work best currently.",
        },
      ],
      permits: "Some park areas may require entry permits — verify current rules.",
      transportTips:
        "Roads are winding hill roads; self-drive is doable but verify current road conditions in monsoon.",
    },
  },
];

export function getDestinationById(id: string): Destination | undefined {
  return destinations.find((d) => d.id === id);
}
