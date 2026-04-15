export type BookingDataV3 = {
   bookingId?: number; 
  bookingType?: 'single_day' | 'multi_day';
  bookingDays?: {
    date: string;
    startTime?: string;
    endTime?: string;
    durationHours?: number;
    timeZone?: string;
  }[];
  // Service & Content
  contentType: ("videographer" | "photographer" | "cinematographer" | "editing" | "studio")[];
  shootType: string;

  // Studio specific data
  bookingFor: "production" | "audio" | "event" | string;
  projectName: string;
  description: string;
  
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
  
    roleCounts: {
    videographer?: number;
    photographer?: number;
    cinematographer?: number;
  };
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
  bookingType: "single_day",
  bookingDays: [],
  startDate: "",
  endDate: "",
  editsNeeded: true,
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
  extraRoleSelections: {},
  budgetMin: 100,
  budgetMax: 20000,
};
