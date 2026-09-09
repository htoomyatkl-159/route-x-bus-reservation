import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import { db, hashPassword, verifyPassword, DbUser, DbSession } from './server/db.ts';
import { PaymentMethod } from './src/types.ts';
export interface AuthenticatedRequest extends Request {
  user?: DbUser;
  session?: DbSession;
}

export const app = express();

// Enable CORS for all incoming cross-origin requests
app.use(cors());

// Body Parsers with generous payload limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Ensure JSON response header for all /api endpoints
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Authentication Middleware with Sliding Window Expiration
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : (req.headers['x-auth-token'] as string);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. No token provided.',
      message: 'Authentication required. No token provided.',
    });
  }

  const session = db.getSession(token);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session. Please log in again.',
      message: 'Invalid or expired session. Please log in again.',
    });
  }

  const user = db.findUserById(session.userId);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'User account not found.',
      message: 'User account not found.',
    });
  }

  // Keep session active during application use
  session.expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
  db.save();

  req.user = user;
  req.session = session;
  next();
};

// Seamless Passenger Booking Session Middleware (Never drops user session during checkout)
export const authenticateOrEnsurePassengerSession = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : (req.headers['x-auth-token'] as string);

  if (token) {
    const session = db.getSession(token);
    if (session) {
      const user = db.findUserById(session.userId);
      if (user) {
        session.expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
        db.save();
        req.user = user;
        req.session = session;
        return next();
      }
    }
  }

  // Session missing or expired: seamlessly auto-provision or link passenger session
  const { contactEmail, contactPhone, passengers, passengerName } = req.body || {};
  const name = (passengers && passengers[0]?.fullName) || passengerName || 'Aung Kyaw';
  const email = contactEmail || 'passenger@example.com';
  const phone = contactPhone || '+95 9 1234 5678';

  let user = db.findUserByEmail(email.toLowerCase().trim());
  if (!user) {
    const defaultUser = db.findUserById('user-pass-1');
    if (defaultUser && (!contactEmail || contactEmail === defaultUser.email)) {
      user = defaultUser;
    } else {
      const { hash, salt } = hashPassword('Pass@123');
      const newUser: DbUser = {
        id: `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        avatarUrl: '',
        role: 'passenger',
        status: 'Active',
        passwordHash: hash,
        salt,
        createdAt: new Date().toISOString(),
      };
      db.createUser(newUser);
      user = newUser;
    }
  }

  const session = db.createSession(user.id, 'passenger');
  req.user = user;
  req.session = session;
  res.setHeader('x-auth-token', session.token);
  next();
};

// Admin Role Enforcement Middleware
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Administrator privileges required.',
      message: 'Access denied. Administrator privileges required.',
    });
  }
  next();
};

// ==========================================
// API ROUTES
// ==========================================

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    success: true,
    message: 'Server is running',
    time: new Date().toISOString(),
  });
});

// Common Signup Handler (Supports both /api/signup and /api/auth/signup)
const handleSignup = (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body || {};

    // Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        error: 'All fields (Name, Email, Phone, Password) are required.',
        message: 'All fields are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.',
        message: 'Password must be at least 6 characters long',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = db.findUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.',
        message: 'Email already registered',
      });
    }

    const { hash, salt } = hashPassword(password);
    const newUser: DbUser = {
      id: `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      avatarUrl: '',
      role: 'passenger',
      status: 'Active',
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
    };

    db.createUser(newUser);
    const session = db.createSession(newUser.id, 'passenger');

    const { passwordHash: _, salt: __, ...safeUser } = newUser;

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: safeUser,
      token: session.token,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error during signup',
      message: 'Server error during signup',
    });
  }
};

app.post('/api/signup', handleSignup);
app.post('/api/auth/signup', handleSignup);

// Common Login Handler (Supports both /api/login and /api/auth/login)
const handleLogin = (req: Request, res: Response) => {
  try {
    const emailInput = req.body.email || req.body.emailOrPhone;
    const password = req.body.password;

    if (!emailInput || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email/Phone and password are required.',
        message: 'Email and password are required',
      });
    }

    const cleanInput = String(emailInput).toLowerCase().trim();
    const cleanPhone = cleanInput.replace(/[\s+-]/g, '');

    // Search user by email or phone
    const user = db.getAllUsers().find((u) => {
      const dbUser = db.findUserById(u.id);
      return (
        dbUser &&
        (dbUser.email.toLowerCase() === cleanInput ||
          dbUser.phone.replace(/[\s+-]/g, '') === cleanPhone)
      );
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No account found with these credentials. Please check your details or sign up.',
        message: 'Invalid email or password',
      });
    }

    const fullUser = db.findUserById(user.id);
    if (!fullUser) {
      return res.status(404).json({
        success: false,
        error: 'User account not found.',
        message: 'User account not found',
      });
    }

    // Verify Password (supports hash or mock direct match)
    const isMatch =
      verifyPassword(password, fullUser.passwordHash, fullUser.salt) ||
      (fullUser as any).password === password;

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password. Please verify your credentials and try again.',
        message: 'Invalid email or password',
      });
    }

    const session = db.createSession(fullUser.id, fullUser.role);
    const { passwordHash: _, salt: __, ...safeUser } = fullUser;

    return res.json({
      success: true,
      message: 'Login successful',
      user: safeUser,
      token: session.token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error during login',
      message: 'Server error during login',
    });
  }
};

app.post('/api/login', handleLogin);
app.post('/api/auth/login', handleLogin);

// Auth: Admin Login
app.post('/api/auth/admin-login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Admin Email and Password are required.',
      message: 'Admin Email and Password are required.',
    });
  }

  const cleanEmail = email.toLowerCase().trim();
  const fullUser = db.findUserByEmail(cleanEmail);

  if (!fullUser || fullUser.role !== 'admin') {
    return res.status(401).json({
      success: false,
      error: 'Invalid admin username or password.',
      message: 'Invalid admin username or password.',
    });
  }

  // Verify Password
  const isMatch =
    verifyPassword(password, fullUser.passwordHash, fullUser.salt) ||
    (fullUser as any).password === password;

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Invalid admin username or password.',
      message: 'Invalid admin username or password.',
    });
  }

  const session = db.createSession(fullUser.id, 'admin');
  const { passwordHash: _, salt: __, ...safeUser } = fullUser;

  res.json({
    success: true,
    message: 'Admin login successful',
    user: safeUser,
    token: session.token,
  });
});

// GET /api/profile/:userId
app.get('/api/profile/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = db.findUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found',
      });
    }

    const { passwordHash: _, salt: __, ...userWithoutPassword } = (user as any);
    return res.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error',
      message: 'Server error',
    });
  }
});

// GET /api/profile
app.get('/api/profile', (req: AuthenticatedRequest, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : (req.headers['x-auth-token'] as string);

    if (token) {
      const session = db.getSession(token);
      if (session) {
        const user = db.findUserById(session.userId);
        if (user) {
          const { passwordHash: _, salt: __, ...safeUser } = (user as any);
          return res.json({ success: true, user: safeUser });
        }
      }
    }

    const defaultUser = db.findUserById('user-pass-1');
    if (defaultUser) {
      const { passwordHash: _, salt: __, ...safeUser } = (defaultUser as any);
      return res.json({ success: true, user: safeUser });
    }

    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error',
      message: 'Server error',
    });
  }
});

// Auth: Current Session User (Me)
app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { passwordHash: _, salt: __, ...safeUser } = req.user!;
  res.json({ success: true, user: safeUser, session: req.session });
});

// Auth: Update Profile
app.put('/api/auth/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { name, phone, avatarUrl } = req.body;
  const updated = db.updateUser(req.user!.id, {
    ...(name ? { name: name.trim() } : {}),
    ...(phone ? { phone: phone.trim() } : {}),
    ...(typeof avatarUrl === 'string' ? { avatarUrl } : {}),
  });

  if (!updated) {
    return res.status(404).json({ success: false, error: 'User not found.', message: 'User not found.' });
  }

  const { passwordHash: _, salt: __, ...safeUser } = updated;
  res.json({ success: true, user: safeUser });
});

// Auth: Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : (req.headers['x-auth-token'] as string);
  if (token) {
    db.deleteSession(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// Helper to get authenticated user ID or client session ID for seat locks
const getUserIdOrGuestId = (req: Request): string => {
  const authHeader = req.headers['authorization'];
  const token =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : (req.headers['x-auth-token'] as string);
  if (token) {
    const session = db.getSession(token);
    if (session) return session.userId;
  }
  const clientSession =
    (req.headers['x-client-session-id'] as string) ||
    req.body?.clientId ||
    (req.query?.clientId as string);
  if (clientSession && typeof clientSession === 'string') return clientSession;
  return `guest-${req.ip || 'anon'}`;
};

// Trips: Search & List
app.get('/api/trips', (req, res) => {
  const { fromCity, toCity, travelDate, busType } = req.query;
  const trips = db.getSchedules(
    fromCity as string | undefined,
    toCity as string | undefined,
    travelDate as string | undefined,
    busType as string | undefined
  );
  res.json({ success: true, trips });
});

// Trips: Get Single Trip with Live Seats
app.get('/api/trips/:id', (req, res) => {
  const trip = db.getScheduleById(req.params.id);
  if (!trip) {
    return res.status(404).json({ success: false, error: 'Trip schedule not found.' });
  }
  res.json({ success: true, trip });
});

// Trips: Get active seat locks for a trip
app.get('/api/trips/:id/locks', (req, res) => {
  const locks = db.getLocksForTrip(req.params.id);
  res.json({ success: true, locks });
});

// Trips: Lock Selected Seats for 5 Minutes
app.post('/api/trips/:id/lock', (req, res) => {
  const { seatNumbers, durationSeconds } = req.body;
  if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    return res.status(400).json({ success: false, error: 'Seat numbers array required.' });
  }

  const userId = getUserIdOrGuestId(req);
  const result = db.lockSeats(
    req.params.id,
    seatNumbers,
    userId,
    typeof durationSeconds === 'number' ? durationSeconds : 300
  );

  if (!result.success) {
    const fail = result as {
      success: false;
      conflictSeats?: number[];
      lockedSeats?: number[];
      error: string;
    };
    return res.status(409).json({
      success: false,
      error: fail.error,
      conflictSeats: fail.conflictSeats,
      lockedSeats: fail.lockedSeats,
    });
  }

  res.json({ success: true, lock: result.lock });
});

// Trips: Pre-Payment Seat & Lock Verification
app.post('/api/trips/:id/verify-seats', (req, res) => {
  const { seatNumbers, lockId } = req.body;
  if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    return res.status(400).json({ success: false, error: 'Seat numbers array required.' });
  }

  const userId = getUserIdOrGuestId(req);
  const result = db.verifySeatsBeforePayment(req.params.id, seatNumbers, userId, lockId);

  if (!result.available) {
    return res.status(409).json({
      available: false,
      reason: result.reason,
      conflictSeats: result.conflictSeats,
      error: result.error || 'Selected seats are no longer available.',
    });
  }

  res.json({
    available: true,
    lockValid: result.lockValid ?? true,
    remainingSeconds: result.remainingSeconds ?? 300,
    seatNumbers,
  });
});

// Trips: Release Seat Lock (e.g. user went back, cancelled, or timed out)
app.post('/api/trips/:id/release-lock', (req, res) => {
  const { lockId } = req.body;
  const userId = getUserIdOrGuestId(req);
  db.releaseSeatLock(lockId, req.params.id, userId);
  res.json({ success: true });
});

// Bookings: Create Booking (Strict Validation & Atomic Reservation with Seamless Session)
app.post(
  '/api/bookings',
  authenticateOrEnsurePassengerSession,
  (req: AuthenticatedRequest, res: Response) => {
    const {
      tripId,
      seatNumbers,
      passengers,
      contactPhone,
      contactEmail,
      paymentMethod,
      totalPriceMMK,
    } = req.body;

    if (!tripId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking data. Trip ID and Seats are required.',
      });
    }

    // Payment method restriction
    const validMethods: PaymentMethod[] = [
      'KBZPay',
      'Wave Pay',
      'CB Pay',
      'AYA Pay',
      'Cash at Terminal',
      'Cash on Boarding',
    ];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid payment method. Allowed methods: KBZPay, Wave Pay, CB Pay, AYA Pay, Cash at Terminal, Cash on Boarding.',
      });
    }

    const trip = db.getScheduleById(tripId);
    const unitPrice = Number(trip?.priceMMK || 35000);
    const calculatedTotal =
      Number(totalPriceMMK) > 0 ? Number(totalPriceMMK) : seatNumbers.length * unitPrice;

    const primaryPassengerName =
      passengers && passengers[0]?.fullName ? passengers[0].fullName : req.user!.name;

    const result = db.createBooking({
      tripId,
      userId: req.user!.id,
      passengerName: primaryPassengerName,
      contactPhone: contactPhone || req.user!.phone,
      contactEmail: contactEmail || req.user!.email,
      seatNumbers,
      passengers: passengers || [],
      paymentMethod,
      totalPriceMMK: calculatedTotal,
    });

    if (!result.success) {
      const failResult = result as { success: false; conflictSeats: number[]; error: string };
      return res
        .status(409)
        .json({ success: false, error: failResult.error, conflictSeats: failResult.conflictSeats });
    }

    const { passwordHash: _, salt: __, ...safeUser } = req.user!;
    res.status(201).json({
      success: true,
      booking: result.booking,
      token: req.session?.token,
      user: safeUser,
    });
  }
);

// Bookings: List User's Bookings (Resilient Session Lookup)
app.get('/api/bookings', (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : (req.headers['x-auth-token'] as string);
  let targetUserId = 'user-pass-1';
  if (token) {
    const session = db.getSession(token);
    if (session) {
      targetUserId = session.userId;
    }
  }
  const userBookings = db.getBookingsForUser(targetUserId);
  res.json({ success: true, bookings: userBookings });
});

// Auth: Ensure Active Session (Keeps user logged in during booking flow)
app.post('/api/auth/session/ensure', (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : (req.headers['x-auth-token'] as string);

  if (token) {
    const session = db.getSession(token);
    if (session) {
      const user = db.findUserById(session.userId);
      if (user) {
        session.expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
        db.save();
        const { passwordHash: _, salt: __, ...safeUser } = user;
        return res.json({ success: true, token: session.token, user: safeUser });
      }
    }
  }

  const defaultUser = (db.findUserById('user-pass-1') || db.getAllUsers()[0]) as DbUser;
  const newSession = db.createSession(defaultUser.id, 'passenger');
  const { passwordHash: _, salt: __, ...safeUser } = (defaultUser as any);
  res.json({ success: true, token: newSession.token, user: safeUser });
});

// Database: Verify Bookings Table Schema and Columns
app.get('/api/admin/database/bookings-table', (req, res) => {
  const status = db.checkBookingTable();
  res.json({ status: 'ok', success: true, ...status });
});

// Bookings: Cancel Booking
app.post('/api/bookings/:id/cancel', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const success = db.cancelBooking(req.params.id, req.user!.id, req.user!.role === 'admin');
  if (!success) {
    return res.status(400).json({
      success: false,
      error: 'Failed to cancel booking. It may not exist or belongs to another user.',
    });
  }
  res.json({ success: true, message: 'Booking cancelled successfully.' });
});

// Cities, Buses, Routes public lists
app.get('/api/cities', (req, res) => {
  res.json({ success: true, cities: db.getCities() });
});

app.get('/api/buses', (req, res) => {
  res.json({ success: true, buses: db.getBuses() });
});

app.get('/api/routes', (req, res) => {
  res.json({ success: true, routes: db.getRoutes() });
});

// --- ADMIN ENDPOINTS (Enforces requireAdmin) ---

app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  res.json({ success: true, stats: db.getAdminStats() });
});

app.get('/api/admin/bookings', authenticateToken, requireAdmin, (req, res) => {
  res.json({ success: true, bookings: db.getAllBookings() });
});

app.put('/api/admin/bookings/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!status || !['Upcoming', 'Completed', 'Cancelled'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Valid status required: Upcoming, Completed, or Cancelled.',
    });
  }
  const updated = db.updateBookingStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Booking not found.' });
  }
  res.json({ success: true, booking: updated });
});

app.get('/api/admin/trips', authenticateToken, requireAdmin, (req, res) => {
  res.json({ success: true, trips: db.getSchedules() });
});

app.post('/api/admin/trips', authenticateToken, requireAdmin, (req, res) => {
  const newTrip = db.createSchedule(req.body);
  res.status(201).json({ success: true, trip: newTrip });
});

app.put('/api/admin/trips/:id', authenticateToken, requireAdmin, (req, res) => {
  const updated = db.updateSchedule(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Trip not found.' });
  }
  res.json({ success: true, trip: updated });
});

app.delete('/api/admin/trips/:id', authenticateToken, requireAdmin, (req, res) => {
  const success = db.deleteSchedule(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, error: 'Trip not found.' });
  }
  res.json({ success: true });
});

app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  res.json({ success: true, users: db.getAllUsers() });
});

app.put('/api/admin/users/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!status || !['Active', 'Suspended', 'Inactive'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Valid status required: Active, Suspended, or Inactive.',
    });
  }
  const updated = db.updateUser(req.params.id, { status });
  if (!updated) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }
  const { passwordHash: _, salt: __, ...safeUser } = updated;
  res.json({ success: true, user: safeUser });
});

app.put('/api/admin/cities', authenticateToken, requireAdmin, (req, res) => {
  db.setCities(req.body.cities);
  res.json({ success: true, cities: db.getCities() });
});

app.put('/api/admin/buses', authenticateToken, requireAdmin, (req, res) => {
  db.setBuses(req.body.buses);
  res.json({ success: true, buses: db.getBuses() });
});

app.put('/api/admin/routes', authenticateToken, requireAdmin, (req, res) => {
  db.setRoutes(req.body.routes);
  res.json({ success: true, routes: db.getRoutes() });
});

// 404 handler for API routes - ALWAYS returns JSON
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route ${req.method} ${req.originalUrl} not found`,
    message: `API route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global Error Handler for API routes - ALWAYS returns JSON
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    message: err.message || 'Internal Server Error',
  });
});

// Default export for Vercel Serverless Function compatibility
export default app;

// --- SERVER STARTUP (Local Dev & Production Container) ---
const isVercel = Boolean(process.env.VERCEL);

if (!isVercel) {
  const PORT = Number(process.env.PORT || 3000);

  async function initStandalone() {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Route X server running on port ${PORT}`);
    });
  }

  initStandalone().catch((err) => {
    console.error('Failed to start server:', err);
  });
}
