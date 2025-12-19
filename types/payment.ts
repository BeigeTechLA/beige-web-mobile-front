export interface Creator {
  id: string;
  name: string;
  role: string;
  hourly_rate: number;
  location: string;
  profile_image: string;
  rating: number;
  reviews_count: number;
  bio?: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  reviewer_image?: string;
  created_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  price: number;
  location: string;
  description?: string;
  image?: string;
}

export interface BookingFormData {
  hours: number;
  shoot_date: string;
  location: string;
  shoot_type: string;
  special_requests?: string;
  selected_equipment_ids: string[];
}

export interface PricingBreakdown {
  cp_cost: number;
  equipment_cost: number;
  subtotal: number;
  discount: number;
  total_amount: number;
}

export interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
}

export interface BookingResponse {
  booking_id: string;
  confirmation_number: string;
  status: string;
  payment_status: string;
}

export type ShootType =
  | "Event"
  | "Product"
  | "Portrait"
  | "Wedding"
  | "Commercial"
  | "Fashion"
  | "Real Estate"
  | "Other";
