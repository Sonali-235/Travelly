// ---- Plan tiers ----
export type PlanTier = "explorer" | "plus";

export const PLAN_PRICES: Record<PlanTier, number> = {
  explorer: 49,
  plus: 99,
};

export const PLAN_LABELS: Record<PlanTier, string> = {
  explorer: "Explorer",
  plus: "Travelly Plus",
};

// ---- Trip planner form ----
export type BudgetStyle = "budget" | "mid-range" | "luxury";
export type TravelPace = "relaxed" | "balanced" | "packed";
export type TravelMode = "train" | "bus" | "car" | "flight" | "self-drive" | "bike";

export interface TripRequest {
  destinationId: string;
  departureCity: string;
  days: number;
  startDate: string; // ISO date
  adults: number;
  children: number;
  infants: number;
  budgetStyle: BudgetStyle;
  pace: TravelPace;
  travelMode: TravelMode;
  mustVisit: string;
  placesToAvoid: string;
  additionalPreferences: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
}

// ---- Verified (admin-owned) destination data ----
export interface VerifiedHotel {
  name: string;
  category: BudgetStyle;
  pricePerNight: string;
  contact: string;
  mapsQuery: string;
}

export interface VerifiedRestaurant {
  name: string;
  cuisine: string;
  priceRange: string;
  mapsQuery: string;
}

export interface VerifiedAttraction {
  name: string;
  entryFee: string;
  openingHours: string;
  mapsQuery: string;
  photographyAllowed: boolean;
  notes?: string;
}

export interface EmergencyContact {
  label: string;
  number: string;
}

export interface SmartWarning {
  type: string;
  message: string;
}

export interface ShoppingSpot {
  name: string;
  specialty: string;
}

export interface Destination {
  id: string;
  name: string;
  state: string;
  tagline: string;
  bestSeason: string;
  accentEmoji: string;
  overview: string;
  verified: {
    hotels: VerifiedHotel[];
    restaurants: VerifiedRestaurant[];
    attractions: VerifiedAttraction[];
    emergencyContacts: EmergencyContact[];
    localFood: string[];
    shopping: ShoppingSpot[];
    smartWarnings: SmartWarning[];
    permits?: string;
    transportTips: string;
    lastVerifiedOn: string;
    isSampleData: boolean; // true = placeholder, must be replaced before launch
  };
}

// ---- AI-generated itinerary ----
export interface DayPlan {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  whyThisPlan: string;
}

export interface GeneratedItinerary {
  tripOverview: string;
  days: DayPlan[];
  estimatedBudget: {
    category: string;
    amount: string;
  }[];
  packingChecklist: string[];
  travelTips: string[];
  photographySuggestions: string[];
}

export interface OrderRecord {
  tripRequest: TripRequest;
  customer: CustomerInfo;
  plan: PlanTier;
  status:
    | "awaiting_payment"
    | "payment_successful"
    | "ai_processing"
    | "ready"
    | "delivered";
  paymentId?: string;
}
