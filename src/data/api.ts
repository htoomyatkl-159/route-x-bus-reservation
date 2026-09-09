import { User, TripSchedule, Booking, PaymentMethod, CityName, Bus, Route, SearchParams, SeatLock } from '../types';

const getAuthToken = (): string | null => {
  return localStorage.getItem('routex_token') || localStorage.getItem('routex_admin_token') || null;
};

export const getClientSessionId = (): string => {
  let sessionId = sessionStorage.getItem('routex_client_session_id');
  if (!sessionId) {
    sessionId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('routex_client_session_id', sessionId);
  }
  return sessionId;
};

const getHeaders = (includeAuth = true): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-client-session-id': getClientSessionId(),
  };
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

// Safe JSON parser that catches non-JSON/HTML error pages
async function parseJsonResponse<T = any>(res: Response, defaultError = 'Request failed'): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  let json: any = null;

  if (contentType.includes('application/json')) {
    try {
      json = await res.json();
    } catch {
      json = null;
    }
  } else {
    const text = await res.text();
    // Catch common HTML error pages from Vercel / serverless routing
    if (text.startsWith('<') || text.includes('The page') || text.includes('404')) {
      throw new Error(
        'Backend server returned an HTML page instead of JSON. Please verify that serverless functions are configured correctly.'
      );
    }
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(defaultError);
    }
  }

  if (!res.ok) {
    const errorMsg = json?.message || json?.error || `${defaultError} (${res.status})`;
    throw new Error(errorMsg);
  }

  return json as T;
}

export const api = {
  // Auth: Sign Up (Supports /api/signup and /api/auth/signup)
  async signup(data: { name: string; email: string; phone: string; password: string }): Promise<{ user: User; token: string; message?: string }> {
    let res: Response;
    try {
      res = await fetch('/api/signup', {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify(data),
      });
      // If 404 on /api/signup, try /api/auth/signup fallback
      if (res.status === 404) {
        res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: getHeaders(false),
          body: JSON.stringify(data),
        });
      }
    } catch (networkErr: any) {
      throw new Error(networkErr.message || 'Unable to connect to the server. Please check your internet connection.');
    }

    const json = await parseJsonResponse<{ user: User; token: string; message?: string }>(res, 'Signup failed. Please try again.');
    if (json.token) {
      localStorage.setItem('routex_token', json.token);
    }
    return json;
  },

  // Auth: Login (Supports /api/login and /api/auth/login)
  async login(data: { emailOrPhone: string; password: string }): Promise<{ user: User; token: string; message?: string }> {
    let res: Response;
    try {
      res = await fetch('/api/login', {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify({ email: data.emailOrPhone, emailOrPhone: data.emailOrPhone, password: data.password }),
      });
      if (res.status === 404) {
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: getHeaders(false),
          body: JSON.stringify(data),
        });
      }
    } catch (networkErr: any) {
      throw new Error(networkErr.message || 'Unable to connect to the server. Please check your internet connection.');
    }

    const json = await parseJsonResponse<{ user: User; token: string; message?: string }>(res, 'Login failed. Please check your credentials.');
    if (json.token) {
      localStorage.setItem('routex_token', json.token);
    }
    return json;
  },

  // Profile: Get user profile
  async getProfile(userId?: string): Promise<User | null> {
    try {
      const url = userId ? `/api/profile/${encodeURIComponent(userId)}` : '/api/profile';
      const res = await fetch(url, {
        headers: getHeaders(true),
      });
      if (!res.ok) return null;
      const json = await parseJsonResponse<{ user: User }>(res);
      return json.user || null;
    } catch {
      return null;
    }
  },

  async adminLogin(data: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Admin login failed');
    localStorage.setItem('routex_token', json.token);
    localStorage.setItem('routex_admin_token', json.token);
    return json;
  },

  async getMe(): Promise<User | null> {
    const token = getAuthToken();
    if (!token) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: getHeaders(true),
      });
      if (!res.ok) {
        return null;
      }
      const json = await res.json();
      return json.user;
    } catch {
      return null;
    }
  },

  async ensureSession(): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/session/ensure', {
      method: 'POST',
      headers: getHeaders(true),
    });
    const json = await res.json();
    if (json.token) {
      localStorage.setItem('routex_token', json.token);
    }
    return json;
  },

  async updateProfile(updates: { name?: string; phone?: string; avatarUrl?: string }): Promise<User> {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update profile');
    return json.user;
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getHeaders(true),
      });
    } finally {
      localStorage.removeItem('routex_token');
      localStorage.removeItem('routex_admin_token');
      localStorage.removeItem('routex_passenger_session');
      localStorage.removeItem('routex_admin_session');
    }
  },

  // Trips & Search
  async getTrips(params?: Partial<SearchParams> & { busType?: string }): Promise<TripSchedule[]> {
    const query = new URLSearchParams();
    if (params?.fromCity) query.append('fromCity', params.fromCity);
    if (params?.toCity) query.append('toCity', params.toCity);
    if (params?.travelDate) query.append('travelDate', params.travelDate);
    if (params?.busType && params.busType !== 'All') query.append('busType', params.busType);

    const res = await fetch(`/api/trips?${query.toString()}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load trips');
    return json.trips || [];
  },

  async getTrip(id: string): Promise<TripSchedule> {
    const res = await fetch(`/api/trips/${id}`, {
      headers: getHeaders(false),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load trip');
    return json.trip;
  },

  async getTripLocks(tripId: string): Promise<SeatLock[]> {
    const res = await fetch(`/api/trips/${tripId}/locks`, {
      headers: getHeaders(false),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load trip locks');
    return json.locks || [];
  },

  async lockSeats(
    tripId: string,
    seatNumbers: number[],
    durationSeconds = 300
  ): Promise<{ success: boolean; lock?: SeatLock; error?: string; lockedSeats?: number[]; conflictSeats?: number[] }> {
    const res = await fetch(`/api/trips/${tripId}/lock`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ seatNumbers, durationSeconds }),
    });
    const json = await res.json();
    return json;
  },

  async verifySeats(
    tripId: string,
    seatNumbers: number[],
    lockId?: string
  ): Promise<{
    available: boolean;
    lockValid?: boolean;
    remainingSeconds?: number;
    conflictSeats?: number[];
    error?: string;
    reason?: string;
  }> {
    const res = await fetch(`/api/trips/${tripId}/verify-seats`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ seatNumbers, lockId }),
    });
    const json = await res.json();
    return json;
  },

  async releaseSeatLock(tripId: string, lockId?: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`/api/trips/${tripId}/release-lock`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ lockId }),
      });
      const json = await res.json();
      return json;
    } catch {
      return { success: false };
    }
  },

  // Bookings
  async getBookings(): Promise<Booking[]> {
    const res = await fetch('/api/bookings', {
      headers: getHeaders(true),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load bookings');
    return json.bookings || [];
  },

  async createBooking(bookingData: {
    tripId: string;
    seatNumbers: number[];
    passengers: any[];
    contactPhone: string;
    contactEmail: string;
    paymentMethod: PaymentMethod;
    totalPriceMMK: number;
  }): Promise<Booking> {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(bookingData),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to create booking');
    }
    if (json.token) {
      localStorage.setItem('routex_token', json.token);
    }
    return json.booking;
  },

  async cancelBooking(bookingId: string): Promise<void> {
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: getHeaders(true),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to cancel booking');
  },

  // Admin APIs
  async getAdminStats(): Promise<any> {
    const res = await fetch('/api/admin/stats', {
      headers: getHeaders(true),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load stats');
    return json.stats;
  },

  async getAdminBookings(): Promise<Booking[]> {
    const res = await fetch('/api/admin/bookings', {
      headers: getHeaders(true),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load admin bookings');
    return json.bookings || [];
  },

  async updateAdminBookingStatus(bookingId: string, status: Booking['status']): Promise<Booking> {
    const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update booking status');
    return json.booking;
  },

  async getAdminTrips(): Promise<TripSchedule[]> {
    const res = await fetch('/api/admin/trips', {
      headers: getHeaders(true),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load admin trips');
    return json.trips || [];
  },

  async createAdminTrip(trip: TripSchedule): Promise<TripSchedule> {
    const res = await fetch('/api/admin/trips', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(trip),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create trip');
    return json.trip;
  },

  async updateAdminTrip(id: string, updates: Partial<TripSchedule>): Promise<TripSchedule> {
    const res = await fetch(`/api/admin/trips/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update trip');
    return json.trip;
  },

  async deleteAdminTrip(id: string): Promise<void> {
    const res = await fetch(`/api/admin/trips/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete trip');
  },

  async getAdminUsers(): Promise<User[]> {
    const res = await fetch('/api/admin/users', {
      headers: getHeaders(true),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load users');
    return json.users || [];
  },

  async updateAdminUserStatus(userId: string, status: 'Active' | 'Suspended' | 'Inactive'): Promise<User> {
    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update user status');
    return json.user;
  },

  async updateAdminCities(cities: CityName[]): Promise<CityName[]> {
    const res = await fetch('/api/admin/cities', {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ cities }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update cities');
    return json.cities;
  },

  async updateAdminBuses(buses: Bus[]): Promise<Bus[]> {
    const res = await fetch('/api/admin/buses', {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ buses }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update buses');
    return json.buses;
  },

  async updateAdminRoutes(routes: Route[]): Promise<Route[]> {
    const res = await fetch('/api/admin/routes', {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ routes }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update routes');
    return json.routes;
  },
};
