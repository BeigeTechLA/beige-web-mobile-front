export type BookingDataV3 = {
  // Service & Content
  contentType: ("videographer" | "photographer" | "cinematographer" | "editing")[];
  shootType: string;
  
  // Date & Time
  startDate: string;
  endDate: string;
  
  // Edits
  editsNeeded: boolean;
  videoEditTypes: string[];
  photoEditTypes: string[];
  
  // Step 2 Details
  teamIncluded: string[]; // e.g. ["Videographer x1"]
  addTeamMembers: boolean;
  crewCount: number; // Total number of crew members (base + extra)
  location: string;
  locationDetails: any; // Mapbox object
  specialInstructions: string;
  referenceLinks: string;
  
  // Step 3 & 4
  matchingMethod: 'ai_matchmaker' | 'manual';
  selectedCrewIds: number[];
  
  // Contact & Payment
  fullName: string;
  email: string;
  phone: string;
  paymentMethod: 'card' | 'stripe';
  
  // Budget (kept for compatibility)
  budgetMin: number;
  budgetMax: number;
};

export const initialDataV3: BookingDataV3 = {
  contentType: [],
  shootType: "",
  startDate: "",
  endDate: "",
  editsNeeded: false,
  videoEditTypes: [],
  photoEditTypes: [],
  teamIncluded: [],
  addTeamMembers: false,
  crewCount: 0,
  location: "",
  locationDetails: null,
  specialInstructions: "",
  referenceLinks: "",
  matchingMethod: 'ai_matchmaker',
  selectedCrewIds: [],
  fullName: "",
  email: "",
  phone: "",
  paymentMethod: 'card',
  budgetMin: 100,
  budgetMax: 20000,
};
