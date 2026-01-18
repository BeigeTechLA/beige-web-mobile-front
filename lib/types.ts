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
  required_count?: number; // Minimum creators to find (enables auto radius expansion)
  page?: number;
  limit?: number;
}

// Search metadata returned by the API
export interface SearchMeta {
  requestedCount: number;
  foundCount: number;
  initialRadius: number | null;
  actualRadius: number | null;
  radiusExpanded: boolean;
  radiusUnlimited: boolean;
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

// Project Types - CMS Approval States
export type ProjectState =
  | 'RAW_UPLOADED'
  | 'RAW_TECH_QC_PENDING'
  | 'RAW_TECH_QC_REJECTED'
  | 'RAW_TECH_QC_APPROVED'
  | 'COVERAGE_REVIEW_PENDING'
  | 'COVERAGE_REJECTED'
  | 'EDIT_APPROVAL_PENDING'
  | 'EDIT_IN_PROGRESS'
  | 'INTERNAL_EDIT_REVIEW_PENDING'
  | 'CLIENT_PREVIEW_READY'
  | 'CLIENT_FEEDBACK_RECEIVED'
  | 'FEEDBACK_INTERNAL_REVIEW'
  | 'REVISION_IN_PROGRESS'
  | 'REVISION_QC_PENDING'
  | 'FINAL_EXPORT_PENDING'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED'
  | 'PROJECT_CLOSED';

export interface Project {
  project_id: number;
  booking_id: number;
  project_code: string;
  project_name: string;
  current_state: ProjectState;
  client_user_id: number;
  assigned_creator_id?: number;
  assigned_editor_id?: number;
  created_at: string;
  updated_at: string;
  state_changed_at: string;
}

export type FileCategory =
  | 'RAW_FOOTAGE'
  | 'RAW_AUDIO'
  | 'EDIT_DRAFT'
  | 'EDIT_FINAL'
  | 'CLIENT_DELIVERABLE';

export interface ProjectFile {
  file_id: number;
  project_id: number;
  file_category: FileCategory;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  upload_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  upload_progress: number;
  validation_status: 'PENDING' | 'PASSED' | 'FAILED';
  created_at: string;
}

export interface ProjectStateHistory {
  history_id: number;
  project_id: number;
  from_state: ProjectState | null;
  to_state: ProjectState;
  transitioned_by: number;
  transition_reason?: string;
  created_at: string;
}

export interface ProjectFeedback {
  feedback_id: number;
  project_id: number;
  feedback_type: 'CLIENT' | 'INTERNAL_QC';
  feedback_text: string;
  video_timestamps?: string;
  created_by: number;
  created_at: string;
}

// Project API Request/Response Types
export interface CreateProjectData {
  booking_id: number;
  project_name: string;
  client_user_id: number;
  assigned_creator_id?: number;
}

export interface TransitionStateData {
  to_state: ProjectState;
  transition_reason?: string;
}

export interface InitiateUploadData {
  file_name: string;
  file_size: number;
  file_type: string;
  file_category: FileCategory;
}

export interface UploadSession {
  upload_session_id: string;
  file_id: number;
  chunk_size: number;
  total_chunks: number;
}

export interface ChunkUploadResult {
  chunk_index: number;
  uploaded: boolean;
  message: string;
}

export interface CompleteUploadData {
  upload_session_id: string;
}

export interface SubmitFeedbackData {
  feedback_type: 'CLIENT' | 'INTERNAL_QC';
  feedback_text: string;
  video_timestamps?: string;
}

export interface GetProjectsByUserParams {
  user_id?: number;
  role: 'client' | 'creator' | 'editor' | 'admin';
  status?: ProjectState;
  state?: ProjectState;
  dateRange?: 'all' | 'today' | 'week' | 'month';
  search?: string;
  page?: number;
  limit?: number;
}

export interface DownloadUrlResponse {
  download_url: string;
  expires_at: string;
}
