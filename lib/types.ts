// API Response Types

export interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: boolean;
  message?: string;
  data?: T;
}

// Auth Types
export interface User {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  instagram_handle?: string;
  userTypeId: number;
  userRole: string;
  email_verified?: number;
  crew_member_id?: number | null;
  created_at?: string;
}

export interface AuthTokens {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone_number?: string;
  instagram_handle?: string;
  userType: number; // 1 = client, 2 = creator
}

export interface RegisterResponse {
  message: string;
  userId: number;
  verificationCode: string;
}

export interface QuickRegisterData {
  email: string;
  name: string;
  phone?: string;
}

export interface VerifyEmailData {
  email: string;
  verificationCode: string;
}

// Creator Registration Types
export interface CreatorRegistrationStep1Data {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  location?: string;
  password: string;
  working_distance?: number;
  profile_photo?: File;
}

export interface CreatorRegistrationStep1Response {
  message: string;
  crew_member_id: number;
  verificationCode: string;
}

export interface CreatorRegistrationStep2Data {
  crew_member_id: number;
  primary_role?: number;
  years_of_experience?: string;
  hourly_rate?: number;
  bio?: string;
  skills: string[]; // JSON array of skills/specialties
  equipment_ownership: string[]; // JSON array of equipment
}

export interface CreatorRegistrationStep3Data {
  crew_member_id: number;
  availability?: Record<string, unknown>;
  certifications?: string[];
  social_media_links?: {
    portfolio?: string;
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
}

// Investor Types
export interface InvestorData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  country?: string;
  investmentRounds?: string;
  investmentTiming?: string;
  investmentAmount?: string;
}

export interface InvestorResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  status: 'pending' | 'contacted' | 'converted' | 'declined';
}

// Creator Types
export interface Creator {
  crew_member_id: number;
  user_id?: number;
  name: string;
  email?: string;
  phone?: string;
  profile_image?: string;
  role_id: number;
  role_name?: string;
  hourly_rate?: number;
  rating?: number;
  total_reviews?: number;
  total_jobs?: number;
  bio?: string;
  location?: string;
  experience_years?: number;
  skills?: string | string[];
  equipment?: string | string[];
  is_available?: boolean;
  created_at?: string;
  matchScore?: number;
  matchingSkills?: string[];
}

export interface CreatorSearchParams {
  budget?: number;
  min_budget?: number;
  max_budget?: number;
  location?: string;
  maxDistance?: number;
  skills?: string;
  content_type?: number;
  content_types?: string;
  page?: number;
  limit?: number;
}

export interface CreatorProfile extends Creator {
  portfolio?: PortfolioItem[];
  reviews?: Review[];
  certifications?: string | string[];
  experience_years?: number;
}

export interface PortfolioItem {
  portfolio_id: number;
  crew_member_id: number;
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  project_type?: string;
  created_at: string;
}

export interface Review {
  review_id: number;
  booking_id: number;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

// Booking Types
export interface BookingData {
  order_name: string;
  project_type?: string;
  content_type?: string;
  shoot_type?: string;
  edit_type?: string;
  description?: string;
  event_type?: string;
  start_date_time: string;
  duration_hours: number;
  end_time?: string;
  budget_min?: number;
  budget_max?: number;
  expected_viewers?: number;
  stream_quality?: string;
  crew_size?: number;
  location?: string;
  streaming_platforms?: string[];
  crew_roles?: string[];
  skills_needed?: string[];
  equipments_needed?: string[];
  is_draft?: boolean;
}

export interface Booking extends BookingData {
  stream_project_booking_id: number;
  user_id: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface BookingResponse {
  booking: Booking;
  confirmation_number?: string;
}

// Waitlist Types
export interface WaitlistData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  city: string;
}

export interface WaitlistEntry extends WaitlistData {
  waitlist_id: number;
  status: 'pending' | 'contacted' | 'converted' | 'declined';
  created_at: string;
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Equipment Types
export interface Equipment {
  equipment_id: number;
  equipment_name: string;
  category_id: number;
  category_name?: string;
  description?: string;
  specs?: Record<string, unknown>;
}

// Pricing Types
export interface PricingPackage {
  package_id: number;
  name: string;
  description?: string;
  base_price: number;
  hourly_rate?: number;
  features?: string[];
}
