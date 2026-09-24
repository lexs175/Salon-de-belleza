export type Service = {
  id: number;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  image: string;
  active: number;
};

export type StaffMember = {
  id: number;
  name: string;
  role: string;
  phone?: string;
  avatar?: string;
  active: number;
  services?: number[];
  email?: string;
  password_hash?: string;
};

export type Booking = {
  id: number;
  service_id: number;
  service_name?: string;
  service_duration?: number;
  service_price?: number;
  staff_id?: number | null;
  staff_name?: string | null;
  promotion_id?: number | null;
  discount_applied?: number;
  name: string;
  phone: string;
  date: string;
  time: string;
  notes: string;
  status: "pendiente" | "confirmada" | "cancelada" | "completada";
  created_at: string;
};

export type Settings = {
  salon_name: string;
  slogan: string;
  description: string;
  address: string;
  phone: string;
  instagram: string;
  tiktok: string;
  currency: string;
  hours: string;
};

export type PromoType = "first_visit" | "general";

export type Promotion = {
  id: number;
  title: string;
  text: string;
  service_id: number | null;
  service_name?: string;
  service_price?: number;
  promo_type: PromoType;
  discount: number;
  starts_at?: string | null;
  ends_at?: string | null;
  max_uses?: number | null;
  current_uses?: number;
  price?: number;
  active: number;
  created_at: string;
};

export type ClientContact = {
  phone: string;
  name: string;
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_spent: number;
  last_visit: string;
  first_visit: string;
  favorite_service: string;
  services_used: string[];
  bookings: Booking[];
};