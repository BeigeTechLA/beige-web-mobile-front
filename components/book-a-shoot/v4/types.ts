import type { SelectedStudio } from "../v3/studioData";

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

export type V4ServiceType = "photography" | "videography" | "editing" | "studio" | "livestream";

export type BookingDataV4 = {
  bookingId?: number;
  projectName?: string;
  
  // Step 0 - Email Onboarding
  email: string;
  fullName: string;
  phone: string;

  // Step 1 - Services (What do you need?)
  services: V4ServiceType[];
  contentType: ("studio" | "videographer" | "photographer" | "cinematographer" | "editing" | "livestream")[];
  
  // Step 2 - Shoot Details & Scheduling
  shootType: string;
  bookingType: 'single_day' | 'multi_day';
  bookingDays: {
    date: string;
    startTime?: string;
    endTime?: string;
    durationHours?: number;
    timeZone?: string;
  }[];
  startDate: string;
  endDate: string;
  expectedDeliveryDate?: string;
  
  // Edits
  editsNeeded: boolean;
  videoEditTypes: string[];
  photoEditTypes: string[];
  
  // Step 3 - Location, Crew & Notes
  teamIncluded: string[];
  extraRoleSelections?: Record<string, number>;
  addTeamMembers: boolean;
  crewCount: number;
  location: string;
  locationDetails: LocationDetails;
  specialInstructions: string;
  referenceLinks: string[];
  
  // Step 4 & 5 - Studios & Creatives
  matchingMethod: 'ai_matchmaker' | 'manual';
  selectedCrewIds: number[];
  selectedCrewRoles?: SelectedCrewRoles;
  selectedStudioIds?: string[];
  selectedStudios?: SelectedStudio[];
  selectedStudioImage?: string;
  selectedStudioName?: string;
  roleCounts?: {
    videographer?: number;
    photographer?: number;
    cinematographer?: number;
    editor?: number;
  };
  videographyCount?: number;
  photographyCount?: number;

  // Payment
  paymentMethod: 'card' | 'stripe';
  budgetMin: number;
  budgetMax: number;
  isBrowsingCreators?: boolean;
};

export const initialDataV4: BookingDataV4 = {
  email: "",
  fullName: "",
  phone: "",
  services: ["photography"],
  contentType: ["photographer"],
  shootType: "commercial",
  projectName: "",
  bookingType: "single_day",
  bookingDays: [],
  startDate: "",
  endDate: "",
  expectedDeliveryDate: "",
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
  paymentMethod: 'card',
  extraRoleSelections: {},
  budgetMin: 100,
  budgetMax: 20000,
  isBrowsingCreators: false,
};
