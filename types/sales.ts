// Sales Lead Types

export type LeadType = 'self_serve' | 'sales_assisted';

export type LeadStatus =
  | 'in_progress_self_serve'
  | 'in_progress_sales_assisted'
  | 'payment_link_sent'
  | 'discount_applied'
  | 'booked'
  | 'abandoned';

export interface SalesLead {
  lead_id: number;
  booking_id?: number;
  user_id?: number;
  guest_email?: string;
  client_name?: string;
  lead_type: LeadType;
  lead_status: LeadStatus;
  assigned_sales_rep_id?: number;
  assigned_sales_rep?: {
    id: number;
    name: string;
    email: string;
  };
  booking?: {
    stream_project_booking_id: number;
    project_name: string;
    event_date?: string;
    event_type?: string;
    budget?: number;
  };
  last_activity_at: string;
  contacted_sales_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SalesLeadDetails extends SalesLead {
  booking: {
    stream_project_booking_id: number;
    project_name: string;
    event_date?: string;
    event_type?: string;
    event_location?: string;
    duration_hours?: number;
    budget?: number;
    description?: string;
  };
  discount_codes?: DiscountCode[];
  payment_links?: PaymentLink[];
  activities?: SalesLeadActivity[];
}

export interface SalesLeadActivity {
  activity_id: number;
  lead_id: number;
  activity_type:
    | 'created'
    | 'status_changed'
    | 'assigned'
    | 'contacted_sales'
    | 'payment_link_generated'
    | 'discount_code_generated'
    | 'payment_link_opened'
    | 'discount_applied'
    | 'payment_completed';
  activity_data?: any;
  performed_by_user_id?: number;
  performed_by?: {
    id: number;
    name: string;
  };
  created_at: string;
}

// Discount Code Types

export type DiscountType = 'percentage' | 'fixed_amount';
export type UsageType = 'one_time' | 'multi_use';

export interface DiscountCode {
  discount_code_id: number;
  code: string;
  lead_id?: number;
  booking_id?: number;
  discount_type: DiscountType;
  discount_value: number;
  usage_type: UsageType;
  max_uses?: number;
  current_uses: number;
  expires_at?: string;
  created_by_user_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiscountCodeValidation {
  valid: boolean;
  message?: string;
  data?: {
    discount_code_id: number;
    code: string;
    discount_type: DiscountType;
    discount_value: number;
    usage_type: UsageType;
    current_uses: number;
    max_uses?: number;
    expires_at?: string;
  };
}

export interface DiscountCodeUsage {
  usage_id: number;
  discount_code_id: number;
  booking_id?: number;
  user_id?: number;
  guest_email?: string;
  discount_amount: number;
  original_amount: number;
  final_amount: number;
  used_at: string;
}

export interface DiscountCodeDetails extends DiscountCode {
  lead?: {
    lead_id: number;
    client_name?: string;
    guest_email?: string;
    lead_status: LeadStatus;
  };
  statistics?: {
    total_uses: number;
    total_revenue: number;
    total_discount_given: number;
    average_order_value: number;
  };
}

// Payment Link Types

export interface PaymentLink {
  payment_link_id: number;
  link_token: string;
  url?: string;
  lead_id?: number;
  booking_id: number;
  discount_code_id?: number;
  discount_code?: DiscountCode;
  created_by_user_id: number;
  expires_at: string;
  is_used: boolean;
  used_at?: string;
  created_at: string;
}

export interface PaymentLinkDetails {
  payment_link_id: number;
  booking: {
    stream_project_booking_id: number;
    project_name: string;
    event_type?: string;
    event_date?: string;
    event_location?: string;
    duration_hours?: number;
    budget?: number;
    description?: string;
    guest_email?: string;
  };
  discount_code?: {
    discount_code_id: number;
    code: string;
    discount_type: DiscountType;
    discount_value: number;
    expires_at?: string;
  };
  expires_at: string;
}

// Dashboard Types

export interface DashboardStats {
  period: '7days' | '30days' | '90days';
  overview: {
    total_leads: number;
    self_serve_leads: number;
    sales_assisted_leads: number;
    booked_leads: number;
    conversion_rate: number;
    total_revenue: number;
    completed_bookings: number;
  };
  leads_by_status: Record<LeadStatus, number>;
  discount_codes: {
    total: number;
    active: number;
  };
  payment_links: {
    total: number;
    used: number;
    conversion_rate: number;
  };
}

export interface SalesRepWorkload {
  rep_id: number;
  rep_name: string;
  rep_email: string;
  total_assigned: number;
  active_leads: number;
  in_progress: number;
  payment_link_sent: number;
  discount_applied: number;
}

export interface SalesRepStats {
  rep_info: SalesRepWorkload;
  performance: {
    total_leads: number;
    booked_leads: number;
    conversion_rate: number;
    avg_time_to_close_hours: number;
  };
}

export interface FunnelData {
  funnel: Array<{
    stage: string;
    count: number;
  }>;
}

// API Request/Response Types

export interface CreateDiscountCodeRequest {
  lead_id?: number;
  booking_id?: number;
  discount_type: DiscountType;
  discount_value: number;
  usage_type: UsageType;
  max_uses?: number;
  expires_at?: string;
}

export interface CreatePaymentLinkRequest {
  lead_id?: number;
  booking_id: number;
  discount_code_id?: number;
  expiry_hours?: number;
}

export interface AssignLeadRequest {
  sales_rep_id: number;
}

export interface UpdateLeadStatusRequest {
  status: LeadStatus;
}

export interface TrackBookingStartRequest {
  booking_id: number;
  user_id?: number;
  guest_email?: string;
  client_name?: string;
}

export interface ApplyDiscountCodeRequest {
  quote_id: number;
  booking_id?: number;
  user_id?: number;
  guest_email?: string;
}

// Pagination Types

export interface PaginatedLeadsResponse {
  leads: SalesLead[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Lead Status Display Helpers

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  in_progress_self_serve: 'In Progress (Self-Serve)',
  in_progress_sales_assisted: 'In Progress (Sales Assisted)',
  payment_link_sent: 'Payment Link Sent',
  discount_applied: 'Discount Applied',
  booked: 'Booked',
  abandoned: 'Abandoned',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  in_progress_self_serve: 'bg-blue-100 text-blue-800',
  in_progress_sales_assisted: 'bg-purple-100 text-purple-800',
  payment_link_sent: 'bg-yellow-100 text-yellow-800',
  discount_applied: 'bg-orange-100 text-orange-800',
  booked: 'bg-green-100 text-green-800',
  abandoned: 'bg-gray-100 text-gray-800',
};

export const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  self_serve: 'Self-Serve',
  sales_assisted: 'Sales Assisted',
};

export const ACTIVITY_TYPE_LABELS: Record<SalesLeadActivity['activity_type'], string> = {
  created: 'Lead Created',
  status_changed: 'Status Changed',
  assigned: 'Assigned to Rep',
  contacted_sales: 'Contacted Sales',
  payment_link_generated: 'Payment Link Generated',
  discount_code_generated: 'Discount Code Generated',
  payment_link_opened: 'Payment Link Opened',
  discount_applied: 'Discount Applied',
  payment_completed: 'Payment Completed',
};
