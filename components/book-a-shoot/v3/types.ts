import type { SelectedStudio } from "./studioData";

export type LocationDetails = {
  coordinates?: {
    lat?: number;
    lng?: number;
  };
  lat?: number;
  lng?: number;
  center?: [number, number];
  context?: Array<{
    id?: string;
    text?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
} | null;

export type CrewRole = "video" | "photo";
export type SelectedCrewRoles = Record<number, CrewRole>;

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
  contentType: ("videographer" | "photographer" | "cinematographer" | "editing")[];
  shootType: string;
  
  // Date & Time
  startDate: string;
  endDate: string;
  expectedDeliveryDate?: string;

  projectName?: string;
  description?: string;
  
  // Edits
  editsNeeded: boolean;
  videoEditTypes: string[];
  photoEditTypes: string[];
  
  // Step 2 Details
  teamIncluded: string[]; // e.g. ["Videographer x1"]
  extraRoleSelections?: Record<string, number>;
  addTeamMembers: boolean;
  crewCount: number; // Total number of crew members (base + extra)
  location: string;
  locationDetails: LocationDetails;
  specialInstructions: string;
  referenceLinks: string[];
  browseStudios?: boolean;
  
  // Step 3 & 4
  matchingMethod: 'ai_matchmaker' | 'manual';
  selectedCrewIds: number[];
  selectedCrewRoles?: SelectedCrewRoles;
  selectedStudioIds?: string[];
  selectedStudios?: SelectedStudio[];
  selectedStudioImage?: string;
  selectedStudioName?: string;
  castAndCrew?: string;
  studioShootType?: string;


  roleCounts?: {
    videographer?: number;
    photographer?: number;
    cinematographer?: number;
    editor?: number;
    studio?: number;
  };
  videographyCount?: number;
  photographyCount?: number;
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
  expectedDeliveryDate: "",
  projectName: "",
  description: "",
  editsNeeded: true,
  videoEditTypes: [],
  photoEditTypes: [],
  teamIncluded: [],
  addTeamMembers: false,
  crewCount: 0,
  location: "",
  locationDetails: null,
  specialInstructions: "",
  referenceLinks: [],
  matchingMethod: 'ai_matchmaker',
  selectedCrewIds: [],
  selectedCrewRoles: {},
  selectedStudioIds: [],
  selectedStudios: [],
  fullName: "",
  email: "",
  phone: "",
  paymentMethod: 'card',
  extraRoleSelections: {},
  budgetMin: 100,
  budgetMax: 20000,
};
