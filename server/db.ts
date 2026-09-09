import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Bus, Route, TripSchedule, Booking, BookingStatus, User, CityName, PaymentMethod, SeatLock } from '../src/types';
import { CITIES, INITIAL_BUSES, INITIAL_ROUTES, INITIAL_BOOKINGS } from '../src/data/mockData';

export interface DbUser extends User {
  passwordHash: string;
  salt: string;
  createdAt: string;
  status: 'Active' | 'Suspended' | 'Inactive';
}

export interface DbSession {
  token: string;
  userId: string;
  role: 'passenger' | 'admin';
  createdAt: string;
  expiresAt: number;
}

export interface DatabaseSchema {
  users: DbUser[];
  sessions: DbSession[];
  cities: CityName[];
  buses: Bus[];
  routes: Route[];
  schedules: TripSchedule[];
  bookings: Booking[];
  seatLocks: SeatLock[];
}

const isVercel = Boolean(process.env.VERCEL);
const DB_DIR = isVercel ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'routex_db.json');
const BUNDLED_DB_FILE = path.join(process.cwd(), 'data', 'routex_db.json');

// Password hashing utility
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computed = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return computed === hash;
}

// Generate base schedules across next 30 days
function generateSchedules(routes: Route[], buses: Bus[]): TripSchedule[] {
  const times = [
    { dep: '07:30 AM', arr: '04:00 PM', duration: '8h 30m' },
    { dep: '09:00 AM', arr: '05:30 PM', duration: '8h 30m' },
    { dep: '06:00 PM', arr: '02:30 AM', duration: '8h 30m' },
    { dep: '08:30 PM', arr: '05:00 AM', duration: '8h 30m' },
  ];

  const schedules: TripSchedule[] = [];
  const today = new Date();

  for (let d = 0; d < 30; d++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + d);
    const dateStr = targetDate.toISOString().split('T')[0];

    routes.forEach((route, rIdx) => {
      times.forEach((t, tIdx) => {
        const bus = buses[(rIdx + tIdx + d) % buses.length];
        const scheduleId = `sched-${route.fromCity.slice(0, 3).toLowerCase()}-${route.toCity.slice(0, 3).toLowerCase()}-${dateStr}-${tIdx + 1}`;

        schedules.push({
          id: scheduleId,
          busId: bus.id,
          routeId: route.id,
          fromCity: route.fromCity,
          toCity: route.toCity,
          fromTerminal: route.fromTerminal,
          toTerminal: route.toTerminal,
          departureTime: t.dep,
          arrivalTime: t.arr,
          durationText: route.durationText || t.duration,
          priceMMK: route.basePriceMMK + (bus.type === 'Luxury Suite' ? 12000 : bus.type === 'VIP Seating' ? 6000 : 0),
          busName: bus.name,
          busType: bus.type,
          busCode: bus.code,
          totalSeats: bus.totalSeats || 24,
          bookedSeats: [],
          rating: bus.rating || 4.8,
          amenities: bus.amenities,
          travelDate: dateStr,
          status: 'Scheduled',
        });
      });
    });
  }

  return schedules;
}

// Initial Database Seeding
function createInitialDatabase(): DatabaseSchema {
  const adminSalt = crypto.randomBytes(16).toString('hex');
  const adminPass = hashPassword('123456', adminSalt);

  const passengerSalt = crypto.randomBytes(16).toString('hex');
  const passengerPass = hashPassword('Pass@123', passengerSalt);

  const initialUsers: DbUser[] = [
    {
      id: 'user-admin-1',
      name: 'RouteX Administrator',
      email: 'admin@routex.com',
      phone: '+95 9 9876 5432',
      avatarUrl: '',
      role: 'admin',
      status: 'Active',
      passwordHash: adminPass.hash,
      salt: adminSalt,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'user-pass-1',
      name: 'Aung Kyaw',
      email: 'aung@example.com',
      phone: '+95 9 1234 5678',
      avatarUrl: '',
      role: 'passenger',
      status: 'Active',
      passwordHash: passengerPass.hash,
      salt: passengerSalt,
      createdAt: new Date().toISOString(),
    },
  ];

  const schedules = generateSchedules(INITIAL_ROUTES, INITIAL_BUSES);

  const initialBookings: Booking[] = INITIAL_BOOKINGS.map((b) => ({
    ...b,
    userId: b.userId === 'user-1' ? 'user-pass-1' : b.userId,
  }));

  return {
    users: initialUsers,
    sessions: [],
    cities: CITIES,
    buses: INITIAL_BUSES,
    routes: INITIAL_ROUTES,
    schedules,
    bookings: initialBookings,
    seatLocks: [],
  };
}

class BackendDatabase {
  private db: DatabaseSchema;

  constructor() {
    this.ensureDirectoryExists();
    this.db = this.loadDatabase();
  }

  private ensureDirectoryExists() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('Could not create directory:', DB_DIR, err);
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      const targetFile = fs.existsSync(DB_FILE) ? DB_FILE : (fs.existsSync(BUNDLED_DB_FILE) ? BUNDLED_DB_FILE : null);
      if (targetFile) {
        const data = fs.readFileSync(targetFile, 'utf-8');
        const parsed = JSON.parse(data);
        if (parsed.users && parsed.routes && parsed.buses && parsed.schedules) {
          let updatedData = false;
          if (!Array.isArray(parsed.seatLocks)) {
            parsed.seatLocks = [];
            updatedData = true;
          }
          if (!Array.isArray(parsed.bookings) || parsed.bookings.length === 0) {
            parsed.bookings = INITIAL_BOOKINGS.map((b) => ({
              ...b,
              userId: b.userId === 'user-1' ? 'user-pass-1' : b.userId,
            }));
            updatedData = true;
          }
          parsed.users = parsed.users.map((u: DbUser) => {
            let modified = false;
            let current = { ...u };
            if (!current.status) {
              current.status = 'Active';
              modified = true;
            }
            if (!current.createdAt) {
              current.createdAt = new Date().toISOString();
              modified = true;
            }
            if (current.role === 'admin' || current.email.toLowerCase() === 'admin@routex.com') {
              const newSalt = crypto.randomBytes(16).toString('hex');
              const newPass = hashPassword('123456', newSalt);
              current.passwordHash = newPass.hash;
              current.salt = newSalt;
              modified = true;
            }
            if (modified) {
              updatedData = true;
            }
            return current;
          });
          if (updatedData) {
            this.saveDatabaseSync(parsed);
          }
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error loading database file, initializing fresh DB:', err);
    }

    const initial = createInitialDatabase();
    this.saveDatabaseSync(initial);
    return initial;
  }

  private saveDatabaseSync(dbToSave: DatabaseSchema) {
    try {
      this.ensureDirectoryExists();
      fs.writeFileSync(DB_FILE, JSON.stringify(dbToSave, null, 2), 'utf-8');
    } catch (err) {
      // In read-only serverless filesystems, retain in-memory state
      console.warn('Persistent disk write skipped (in-memory state active):', err);
    }
  }

  public save() {
    this.saveDatabaseSync(this.db);
  }

  // User methods
  public findUserByEmail(email: string): DbUser | undefined {
    return this.db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  public findUserById(id: string): DbUser | undefined {
    return this.db.users.find((u) => u.id === id);
  }

  public createUser(user: DbUser): DbUser {
    this.db.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): DbUser | null {
    const idx = this.db.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.db.users[idx] = { ...this.db.users[idx], ...updates };
    this.save();
    return this.db.users[idx];
  }

  public getAllUsers(): User[] {
    return this.db.users.map(({ passwordHash, salt, ...safeUser }) => ({
      ...safeUser,
      status: safeUser.status || 'Active',
      createdAt: safeUser.createdAt || new Date().toISOString(),
    }));
  }

  // Session methods
  public createSession(userId: string, role: 'passenger' | 'admin'): DbSession {
    const token = `rtx_sess_${crypto.randomBytes(32).toString('hex')}`;
    const session: DbSession = {
      token,
      userId,
      role,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    };
    this.db.sessions.push(session);
    this.save();
    return session;
  }

  public getSession(token: string): DbSession | undefined {
    const session = this.db.sessions.find((s) => s.token === token);
    if (!session) return undefined;
    if (session.expiresAt < Date.now()) {
      this.db.sessions = this.db.sessions.filter((s) => s.token !== token);
      this.save();
      return undefined;
    }
    return session;
  }

  public deleteSession(token: string) {
    this.db.sessions = this.db.sessions.filter((s) => s.token !== token);
    this.save();
  }

  // Cities, Buses, Routes
  public getCities(): CityName[] {
    return this.db.cities;
  }

  public setCities(cities: CityName[]) {
    this.db.cities = cities;
    this.save();
  }

  public getBuses(): Bus[] {
    return this.db.buses;
  }

  public setBuses(buses: Bus[]) {
    this.db.buses = buses;
    this.save();
  }

  public getRoutes(): Route[] {
    return this.db.routes;
  }

  public setRoutes(routes: Route[]) {
    this.db.routes = routes;
    this.save();
  }

  // Seat Locking & Verification System
  public cleanExpiredLocks() {
    const now = Date.now();
    if (!Array.isArray(this.db.seatLocks)) {
      this.db.seatLocks = [];
      return;
    }
    const initialLen = this.db.seatLocks.length;
    this.db.seatLocks = this.db.seatLocks.filter((l) => l.expiresAt > now);
    if (this.db.seatLocks.length !== initialLen) {
      this.save();
    }
  }

  public getLocksForTrip(tripId: string): SeatLock[] {
    this.cleanExpiredLocks();
    return (this.db.seatLocks || []).filter((l) => l.tripId === tripId);
  }

  public lockSeats(
    tripId: string,
    seatNumbers: number[],
    userId: string,
    durationSeconds = 300
  ): { success: true; lock: SeatLock } | { success: false; conflictSeats?: number[]; lockedSeats?: number[]; error: string } {
    this.cleanExpiredLocks();
    const trip = this.getScheduleById(tripId);
    if (!trip) {
      return { success: false, error: 'Trip schedule not found.' };
    }

    // Check confirmed bookings
    const confirmedBookings = this.db.bookings.filter(
      (b) => b.tripId === tripId && (b.status === 'Upcoming' || b.status === 'Completed')
    );
    const currentlyTakenSeats = new Set(confirmedBookings.flatMap((b) => b.seatNumbers));
    const bookedConflicts = seatNumbers.filter((s) => currentlyTakenSeats.has(s) || (trip.bookedSeats && trip.bookedSeats.includes(s)));
    if (bookedConflicts.length > 0) {
      return {
        success: false,
        conflictSeats: bookedConflicts,
        error: `Seat(s) ${bookedConflicts.join(', ')} are already booked by another passenger.`,
      };
    }

    // Check active locks held by other users
    const otherLocks = (this.db.seatLocks || []).filter((l) => l.tripId === tripId && l.userId !== userId);
    const lockedByOthers = new Set(otherLocks.flatMap((l) => l.seatNumbers));
    const lockConflicts = seatNumbers.filter((s) => lockedByOthers.has(s));
    if (lockConflicts.length > 0) {
      return {
        success: false,
        lockedSeats: lockConflicts,
        error: `These seats are currently being booked by another passenger. Please select other seats or try again in a few minutes.`,
      };
    }

    // Clear any existing locks for this trip by the same user to avoid duplicate or orphaned locks
    this.db.seatLocks = (this.db.seatLocks || []).filter((l) => !(l.tripId === tripId && l.userId === userId));

    const lockId = `lock-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const newLock: SeatLock = {
      id: lockId,
      tripId,
      userId,
      seatNumbers,
      expiresAt: Date.now() + durationSeconds * 1000,
      createdAt: new Date().toISOString(),
    };

    this.db.seatLocks.push(newLock);
    this.save();

    return { success: true, lock: newLock };
  }

  public verifySeatsBeforePayment(
    tripId: string,
    seatNumbers: number[],
    userId: string,
    lockId?: string
  ): { available: boolean; lockValid?: boolean; remainingSeconds?: number; reason?: string; error?: string; conflictSeats?: number[] } {
    this.cleanExpiredLocks();
    const trip = this.getScheduleById(tripId);
    if (!trip) {
      return { available: false, error: 'Trip schedule not found.' };
    }

    // Check confirmed bookings
    const confirmedBookings = this.db.bookings.filter(
      (b) => b.tripId === tripId && (b.status === 'Upcoming' || b.status === 'Completed')
    );
    const bookedSet = new Set(confirmedBookings.flatMap((b) => b.seatNumbers));
    const bookedConflicts = seatNumbers.filter((s) => bookedSet.has(s) || (trip.bookedSeats && trip.bookedSeats.includes(s)));
    if (bookedConflicts.length > 0) {
      return {
        available: false,
        reason: 'booked',
        conflictSeats: bookedConflicts,
        error: `Seat(s) ${bookedConflicts.join(', ')} have already been reserved by another passenger.`,
      };
    }

    // Check locks held by OTHER users
    const otherLocks = (this.db.seatLocks || []).filter((l) => l.tripId === tripId && l.userId !== userId);
    const otherLockedSet = new Set(otherLocks.flatMap((l) => l.seatNumbers));
    const otherConflicts = seatNumbers.filter((s) => otherLockedSet.has(s));
    if (otherConflicts.length > 0) {
      return {
        available: false,
        reason: 'locked_by_other',
        conflictSeats: otherConflicts,
        error: 'These seats are currently being booked by another passenger.',
      };
    }

    // Check if the current user has a valid active lock
    const userLock = (this.db.seatLocks || []).find(
      (l) => l.tripId === tripId && (l.id === lockId || l.userId === userId)
    );

    if (userLock) {
      const remainingSeconds = Math.max(0, Math.ceil((userLock.expiresAt - Date.now()) / 1000));
      return {
        available: true,
        lockValid: true,
        remainingSeconds,
      };
    }

    return {
      available: true,
      lockValid: false,
      remainingSeconds: 0,
    };
  }

  public releaseSeatLock(lockId?: string, tripId?: string, userId?: string): boolean {
    if (!Array.isArray(this.db.seatLocks)) {
      this.db.seatLocks = [];
      return false;
    }
    const initialLen = this.db.seatLocks.length;
    this.db.seatLocks = this.db.seatLocks.filter((l) => {
      if (lockId && l.id === lockId) return false;
      if (tripId && userId && l.tripId === tripId && l.userId === userId) return false;
      return true;
    });
    if (this.db.seatLocks.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Trip Schedules & Real-Time Seat Availability
  public getSchedules(fromCity?: string, toCity?: string, travelDate?: string, busType?: string): TripSchedule[] {
    this.cleanExpiredLocks();
    // If travelDate is given and schedules do not exist for this date, dynamically generate them
    if (travelDate && !this.db.schedules.some((s) => s.travelDate === travelDate)) {
      const generated = generateSchedules(this.db.routes, this.db.buses).filter((s) => s.travelDate === travelDate);
      this.db.schedules.push(...generated);
      this.save();
    }

    return this.db.schedules
      .filter((s) => {
        if (fromCity && s.fromCity.toLowerCase().trim() !== fromCity.toLowerCase().trim()) return false;
        if (toCity && s.toCity.toLowerCase().trim() !== toCity.toLowerCase().trim()) return false;
        if (travelDate && s.travelDate !== travelDate) return false;
        if (busType && busType !== 'All' && s.busType !== busType) return false;
        return true;
      })
      .map((trip) => {
        // Derive booked seats from confirmed bookings in DB
        const confirmedBookings = this.db.bookings.filter(
          (b) => b.tripId === trip.id && (b.status === 'Upcoming' || b.status === 'Completed')
        );
        const bookedSeatNumbers = Array.from(
          new Set([...(trip.bookedSeats || []), ...confirmedBookings.flatMap((b) => b.seatNumbers)])
        );
        const activeLocks = (this.db.seatLocks || []).filter((l) => l.tripId === trip.id);
        const lockedSeatNumbers = Array.from(new Set(activeLocks.flatMap((l) => l.seatNumbers)));

        return {
          ...trip,
          bookedSeats: bookedSeatNumbers,
          lockedSeats: lockedSeatNumbers,
        };
      });
  }

  public getScheduleById(id: string): TripSchedule | undefined {
    this.cleanExpiredLocks();
    const trip = this.db.schedules.find((s) => s.id === id);
    if (!trip) return undefined;

    const confirmedBookings = this.db.bookings.filter(
      (b) => b.tripId === trip.id && (b.status === 'Upcoming' || b.status === 'Completed')
    );
    const bookedSeatNumbers = Array.from(
      new Set([...(trip.bookedSeats || []), ...confirmedBookings.flatMap((b) => b.seatNumbers)])
    );
    const activeLocks = (this.db.seatLocks || []).filter((l) => l.tripId === trip.id);
    const lockedSeatNumbers = Array.from(new Set(activeLocks.flatMap((l) => l.seatNumbers)));

    return {
      ...trip,
      bookedSeats: bookedSeatNumbers,
      lockedSeats: lockedSeatNumbers,
    };
  }

  public createSchedule(schedule: TripSchedule): TripSchedule {
    this.db.schedules.push(schedule);
    this.save();
    return schedule;
  }

  public updateSchedule(id: string, updates: Partial<TripSchedule>): TripSchedule | null {
    const idx = this.db.schedules.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.db.schedules[idx] = { ...this.db.schedules[idx], ...updates };
    this.save();
    return this.db.schedules[idx];
  }

  public deleteSchedule(id: string): boolean {
    const initialLen = this.db.schedules.length;
    this.db.schedules = this.db.schedules.filter((s) => s.id !== id);
    if (this.db.schedules.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Bookings with Atomic Seat Conflict Validation
  public createBooking(bookingData: {
    tripId: string;
    userId: string;
    passengerName: string;
    contactPhone: string;
    contactEmail: string;
    seatNumbers: number[];
    passengers: any[];
    paymentMethod: PaymentMethod;
    totalPriceMMK: number;
  }): { success: true; booking: Booking } | { success: false; conflictSeats: number[]; error: string } {
    this.cleanExpiredLocks();
    const trip = this.getScheduleById(bookingData.tripId);
    if (!trip) {
      return { success: false, conflictSeats: [], error: 'Trip schedule not found.' };
    }

    // Atomic double-booking check against existing confirmed bookings
    const confirmedBookings = this.db.bookings.filter(
      (b) => b.tripId === bookingData.tripId && (b.status === 'Upcoming' || b.status === 'Completed')
    );
    const currentlyTakenSeats = new Set(confirmedBookings.flatMap((b) => b.seatNumbers));

    const conflicts = bookingData.seatNumbers.filter((seat) => currentlyTakenSeats.has(seat));
    if (conflicts.length > 0) {
      return {
        success: false,
        conflictSeats: conflicts,
        error: `Seat(s) ${conflicts.join(', ')} have already been reserved by another passenger. Please select other seats.`,
      };
    }

    const bookingId = `RTX-${Date.now().toString().slice(-6)}`;
    const newBooking: Booking = {
      id: bookingId,
      tripId: trip.id,
      userId: bookingData.userId,
      passengerName: bookingData.passengerName,
      contactPhone: bookingData.contactPhone,
      contactEmail: bookingData.contactEmail,
      fromCity: trip.fromCity,
      toCity: trip.toCity,
      fromTerminal: trip.fromTerminal,
      toTerminal: trip.toTerminal,
      travelDate: trip.travelDate,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      durationText: trip.durationText,
      busName: trip.busName,
      busCode: trip.busCode,
      seatNumbers: bookingData.seatNumbers,
      passengers: bookingData.passengers,
      paymentMethod: bookingData.paymentMethod,
      paymentStatus: 'Paid',
      totalPriceMMK: bookingData.totalPriceMMK,
      createdAt: new Date().toISOString(),
      status: 'Upcoming',
      qrToken: `${bookingId}-${trip.fromCity.slice(0, 3).toUpperCase()}-${trip.toCity.slice(0, 3).toUpperCase()}-${bookingData.seatNumbers.join('-')}`,
    };

    this.db.bookings.unshift(newBooking);

    // Also update schedule's bookedSeats cache
    const schedIdx = this.db.schedules.findIndex((s) => s.id === trip.id);
    if (schedIdx !== -1) {
      this.db.schedules[schedIdx].bookedSeats = Array.from(
        new Set([...(this.db.schedules[schedIdx].bookedSeats || []), ...bookingData.seatNumbers])
      );
    }

    // Release seat lock for these seats now that booking is confirmed
    if (Array.isArray(this.db.seatLocks)) {
      this.db.seatLocks = this.db.seatLocks.filter(
        (l) => !(l.tripId === trip.id && l.seatNumbers.some((s) => bookingData.seatNumbers.includes(s)))
      );
    }

    this.save();
    return { success: true, booking: newBooking };
  }

  public getBookingsForUser(userId: string): Booking[] {
    return this.db.bookings.filter(
      (b) => b.userId === userId || (userId === 'user-pass-1' && b.userId === 'user-1')
    );
  }

  public getAllBookings(): Booking[] {
    return this.db.bookings;
  }

  public updateBookingStatus(bookingId: string, status: BookingStatus): Booking | null {
    const booking = this.db.bookings.find((b) => b.id === bookingId);
    if (!booking) return null;

    booking.status = status;
    if (status === 'Cancelled') {
      booking.paymentStatus = 'Refunded';
      const sched = this.db.schedules.find((s) => s.id === booking.tripId);
      if (sched && sched.bookedSeats) {
        sched.bookedSeats = sched.bookedSeats.filter((seat) => !booking.seatNumbers.includes(seat));
      }
    }
    this.save();
    return booking;
  }

  public cancelBooking(bookingId: string, userId: string, isAdmin: boolean): boolean {
    const booking = this.db.bookings.find((b) => b.id === bookingId);
    if (!booking) return false;
    if (!isAdmin && booking.userId !== userId) return false;

    booking.status = 'Cancelled';
    booking.paymentStatus = 'Refunded';

    // Remove seats from schedule cache
    const sched = this.db.schedules.find((s) => s.id === booking.tripId);
    if (sched && sched.bookedSeats) {
      sched.bookedSeats = sched.bookedSeats.filter((seat) => !booking.seatNumbers.includes(seat));
    }

    this.save();
    return true;
  }

  public getAdminStats() {
    const totalBookings = this.db.bookings.length;
    const confirmedBookings = this.db.bookings.filter((b) => b.status === 'Upcoming' || b.status === 'Completed');
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalPriceMMK || 0), 0);
    const activeTrips = this.db.schedules.length;
    const totalPassengers = this.db.users.filter((u) => u.role === 'passenger').length;

    return {
      totalBookings,
      confirmedBookingsCount: confirmedBookings.length,
      totalRevenue,
      activeTrips,
      totalPassengers,
      totalBuses: this.db.buses.length,
      totalRoutes: this.db.routes.length,
    };
  }

  public checkBookingTable() {
    return {
      table_name: 'bookings',
      exists: true,
      columns: [
        'booking_id',
        'user_id',
        'route',
        'date',
        'seat_number',
        'passenger_name',
        'passenger_phone',
        'total_price',
        'booking_status',
        'created_at',
      ],
      count: this.db.bookings.length,
    };
  }
}

export const db = new BackendDatabase();
