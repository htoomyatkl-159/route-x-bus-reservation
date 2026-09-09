export type CityName = 'Yangon' | 'Mandalay' | 'Bago' | 'Myeik' | 'Taunggyi';

export type PreferredTime = 'Any Time' | 'Morning' | 'Afternoon' | 'Evening' | 'Night';

export type BusType = 'VIP Seating' | 'Executive' | 'Standard AC' | 'Luxury Suite';

export interface Bus {
  id: string;
  code: string;
  name: string;
  type: BusType;
  totalSeats: number; // 24 seats
  rating: number;
  amenities: string[];
  plateNumber: string;
  status?: 'Active' | 'Maintenance' | 'Inactive';
  imageUrl?: string;
}

export interface Route {
  id: string;
  fromCity: CityName;
  toCity: CityName;
  fromTerminal: string;
  toTerminal: string;
  distanceKm: number;
  durationText: string;
  basePriceMMK: number;
}

export type RouteItem = Route;

export interface SeatLock {
  id: string;
  tripId: string;
  userId: string;
  seatNumbers: number[];
  expiresAt: number; // Timestamp in milliseconds
  createdAt: string;
}

export interface TripSchedule {
  id: string;
  busId: string;
  routeId: string;
  busCode: string;
  busName: string;
  busType: BusType;
  fromCity: CityName;
  toCity: CityName;
  fromTerminal: string;
  toTerminal: string;
  departureTime: string;
  arrivalTime: string;
  travelDate: string; // YYYY-MM-DD
  durationText: string;
  priceMMK: number;
  totalSeats: number;
  bookedSeats: number[];
  lockedSeats?: number[];
  rating: number;
  amenities: string[];
  status: 'Scheduled' | 'On Time' | 'Delayed' | 'Completed' | 'Cancelled';
}

export interface PassengerDetail {
  seatNumber: number;
  fullName: string;
  phone: string;
  nrc?: string;
  gender: 'Male' | 'Female' | 'Other';
}

export type PaymentMethod =
  | 'KBZPay'
  | 'Wave Pay'
  | 'CB Pay'
  | 'AYA Pay'
  | 'Cash at Terminal'
  | 'Cash on Boarding';
export type PaymentStatus = 'Paid' | 'Pending' | 'Refunded';
export type BookingStatus = 'Upcoming' | 'Completed' | 'Cancelled';

export interface Booking {
  id: string;
  tripId: string;
  busId?: string;
  userId: string;
  passengerName: string;
  contactPhone: string;
  contactEmail: string;
  fromCity: CityName;
  toCity: CityName;
  fromTerminal: string;
  toTerminal: string;
  travelDate: string;
  departureTime: string;
  arrivalTime: string;
  durationText: string;
  busName: string;
  busCode: string;
  seatNumbers: number[];
  passengers: PassengerDetail[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalPriceMMK: number;
  createdAt?: string;
  bookingDate?: string;
  status: BookingStatus;
  qrToken?: string;

  // Normalized Database Table Columns
  booking_id?: string;
  user_id?: string;
  route?: string;
  date?: string;
  seat_number?: string | number;
  passenger_name?: string;
  passenger_phone?: string;
  total_price?: number;
  booking_status?: BookingStatus;
  created_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  role: 'passenger' | 'admin';
  status?: 'Active' | 'Suspended' | 'Inactive';
  createdAt?: string;
  savedRoutes?: Array<{ from: CityName; to: CityName }>;
  membershipTier?: string;
  completedBookingsCount?: number;
}

export type Language = 'en' | 'my';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ActiveScreen =
  | 'splash'
  | 'login'
  | 'signup'
  | 'home'
  | 'search_results'
  | 'timetables'
  | 'help'
  | 'help_center'
  | 'seat_selection'
  | 'passenger_info'
  | 'payment'
  | 'confirmation'
  | 'ticket'
  | 'bookings'
  | 'my_bookings'
  | 'profile'
  | 'settings'
  | 'admin'
  | 'admin_login';

export interface SearchParams {
  fromCity: CityName | '';
  toCity: CityName | '';
  travelDate: string;
  preferredTime: PreferredTime;
  passengerCount: number;
}
