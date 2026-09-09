import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActiveScreen,
  User,
  TripSchedule,
  SearchParams,
  PassengerDetail,
  PaymentMethod,
  Booking,
  ThemeMode,
  Bus,
  SeatLock,
} from './types';
import { storage } from './data/storage';
import { api } from './data/api';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { SplashScreen } from './components/SplashScreen';
import { LoginScreen } from './components/LoginScreen';
import { SignUpScreen } from './components/SignUpScreen';
import { HomeScreen } from './components/HomeScreen';
import { BusSearchScreen } from './components/BusSearchScreen';
import { BusTimetablesScreen } from './components/BusTimetablesScreen';
import { HelpCenterScreen } from './components/HelpCenterScreen';
import { SeatSelectionScreen } from './components/SeatSelectionScreen';
import { PassengerInfoScreen } from './components/PassengerInfoScreen';
import { PaymentScreen } from './components/PaymentScreen';
import { ConfirmationScreen } from './components/ConfirmationScreen';
import { DigitalTicketScreen } from './components/DigitalTicketScreen';
import { MyBookingsScreen } from './components/MyBookingsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginScreen } from './components/AdminLoginScreen';
import { getUserProfilePhoto, isCustomPhotoUrl } from './data/photoStorage';

export const App: React.FC = () => {
  // Screen Router
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('splash');
  const [previousScreen, setPreviousScreen] = useState<ActiveScreen>('home');

  // Application Data States
  const [users, setUsers] = useState<User[]>([]);
  const [passengerUser, setPassengerUser] = useState<User | null>(() => {
    const stored = storage.getStoredPassengerUser();
    if (stored) {
      if (!isCustomPhotoUrl(stored.avatarUrl)) {
        stored.avatarUrl = '';
      }
      return stored;
    }
    return null;
  });
  const [adminUser, setAdminUser] = useState<User | null>(() => {
    const stored = storage.getStoredAdminUser();
    if (stored) {
      if (!isCustomPhotoUrl(stored.avatarUrl)) {
        stored.avatarUrl = '';
      }
      return stored;
    }
    return null;
  });
  const [buses, setBuses] = useState<Bus[]>(() => storage.getBuses());
  const [routes, setRoutes] = useState(() => storage.getRoutes());
  const [schedules, setSchedules] = useState<TripSchedule[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cities, setCities] = useState(() => storage.getCities());

  // Error Alert State for booking / seat collisions
  const [alertError, setAlertError] = useState<string | null>(null);

  // Theme state
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => storage.getTheme());

  // Active booking flow state
  const [searchParams, setSearchParams] = useState<SearchParams>({
    fromCity: 'Yangon',
    toCity: 'Mandalay',
    travelDate: new Date().toISOString().split('T')[0],
    preferredTime: 'Any Time',
    passengerCount: 2,
  });

  const [selectedTrip, setSelectedTrip] = useState<TripSchedule | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [seatLock, setSeatLock] = useState<SeatLock | null>(null);
  const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [passengers, setPassengers] = useState<PassengerDetail[]>([]);
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  // System Theme Listener & Application
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      const isDark =
        themeMode === 'dark' ||
        (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    storage.saveTheme(themeMode);

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themeMode]);

  // Load Initial Backend Data
  const refreshBackendData = useCallback(async () => {
    try {
      // 1. Verify Active User Session
      let me = await api.getMe();
      if (!me) {
        try {
          const sessionRes = await api.ensureSession();
          if (sessionRes && sessionRes.user) {
            me = sessionRes.user;
          }
        } catch {}
      }

      if (me) {
        if (!isCustomPhotoUrl(me.avatarUrl)) {
          me.avatarUrl = '';
        }
        if (me.role === 'admin') {
          setAdminUser(me);
          storage.setStoredAdminUser(me);
        } else {
          setPassengerUser(me);
          storage.setStoredPassengerUser(me);
        }
      }

      // 2. Fetch Trips
      const trips = await api.getTrips();
      if (trips && trips.length > 0) {
        setSchedules(trips);
      }

      // 3. Fetch User Bookings (if logged in)
      if (me) {
        if (me.role === 'admin') {
          const allB = await api.getAdminBookings().catch(() => []);
          setBookings(allB);
          const allU = await api.getAdminUsers().catch(() => []);
          setUsers(allU);
        } else {
          const userB = await api.getBookings().catch(() => []);
          setBookings(userB);
        }
      }
    } catch (err) {
      console.warn('Initial data sync with server:', err);
    }
  }, []);

  useEffect(() => {
    refreshBackendData();
  }, [refreshBackendData]);

  // Restore stored user photo if present in IndexedDB on user change
  useEffect(() => {
    if (passengerUser?.id) {
      getUserProfilePhoto(passengerUser.id)
        .then((savedPhoto) => {
          if (savedPhoto && isCustomPhotoUrl(savedPhoto) && savedPhoto !== passengerUser.avatarUrl) {
            setPassengerUser((prev) => (prev ? { ...prev, avatarUrl: savedPhoto } : null));
          }
        })
        .catch(() => {});
    }
  }, [passengerUser?.id]);

  // Handle Screen Navigation
  const navigateTo = (screen: ActiveScreen) => {
    if (screen === 'admin') {
      if (!adminUser || adminUser.role !== 'admin') {
        setPreviousScreen(currentScreen);
        setCurrentScreen('admin_login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      // Re-fetch users whenever entering the Admin Dashboard
      handleRefreshAdminUsers().catch(() => {});
    }

    setPreviousScreen(currentScreen);
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefreshAdminUsers = async (): Promise<void> => {
    try {
      const freshUsers = await api.getAdminUsers();
      if (Array.isArray(freshUsers)) {
        setUsers(freshUsers);
      }
    } catch (err) {
      console.warn('Failed to refresh admin users:', err);
    }
  };

  const handleUpdateUserStatus = async (
    userId: string,
    status: 'Active' | 'Suspended' | 'Inactive'
  ): Promise<void> => {
    try {
      const updatedUser = await api.updateAdminUserStatus(userId, status);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: updatedUser.status } : u)));
    } catch (err: any) {
      setAlertError(err.message || 'Failed to update user status');
    }
  };

  // Auth Handlers
  const handleLoginSuccess = async (user: User) => {
    setPassengerUser(user);
    // Refresh user's bookings from database
    try {
      const userBookings = await api.getBookings();
      setBookings(userBookings);
    } catch {
      // ignore
    }
    navigateTo('home');
  };

  const handleAdminLoginSuccess = async (admin: User) => {
    setAdminUser(admin);
    try {
      const [allB, allT, allU] = await Promise.all([
        api.getAdminBookings(),
        api.getAdminTrips(),
        api.getAdminUsers(),
      ]);
      setBookings(allB);
      setSchedules(allT);
      setUsers(allU);
    } catch {
      // ignore
    }
    setCurrentScreen('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturnToPassengerApp = () => {
    api.logout().catch(() => {});
    setAdminUser(null);
    setCurrentScreen('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogout = async () => {
    await api.logout();
    setAdminUser(null);
    setCurrentScreen('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignUpSuccess = async (newUser: User) => {
    setPassengerUser(newUser);
    navigateTo('home');
  };

  const handleLogout = async () => {
    await api.logout();
    setPassengerUser(null);
    setAdminUser(null);
    setBookings([]);
    setCurrentScreen('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Search Flow Handlers
  const handlePerformSearch = async (params: SearchParams) => {
    setSearchParams(params);
    try {
      const trips = await api.getTrips(params);
      setSchedules(trips);
    } catch (err) {
      console.error('Failed to search trips:', err);
    }
    navigateTo('search_results');
  };

  const handleUpdateSearchParams = async (newParams: SearchParams) => {
    setSearchParams(newParams);
    try {
      const trips = await api.getTrips(newParams);
      setSchedules(trips);
    } catch (err) {
      console.error('Failed to update trip search:', err);
    }
  };

  const handleSelectTrip = async (trip: TripSchedule) => {
    try {
      // Refresh live seats and locks for selected trip directly from server
      const liveTrip = await api.getTrip(trip.id);
      setSelectedTrip(liveTrip);
    } catch {
      setSelectedTrip(trip);
    }
    setSeatLock(null);
    setLockExpiresAt(null);
    setSelectedSeats([]);
    navigateTo('seat_selection');
  };

  const handleCancelSeatLock = async () => {
    if (selectedTrip && seatLock) {
      await api.releaseSeatLock(selectedTrip.id, seatLock.id).catch(() => {});
    }
    setSeatLock(null);
    setLockExpiresAt(null);
    if (selectedTrip) {
      try {
        const refreshed = await api.getTrip(selectedTrip.id);
        setSelectedTrip(refreshed);
      } catch {}
    }
  };

  const handleSeatsSelected = async (seats: number[], price: number) => {
    if (!selectedTrip) return;
    setAlertError(null);

    // Atomically lock seats on the backend for 5 minutes (300 seconds)
    const lockResult = await api.lockSeats(selectedTrip.id, seats, 300);

    if (!lockResult.success) {
      const errMsg = lockResult.error || 'Selected seats are currently locked by another passenger.';
      setAlertError(errMsg);
      // Refresh trip to display newly occupied / locked seats
      try {
        const refreshed = await api.getTrip(selectedTrip.id);
        setSelectedTrip(refreshed);
      } catch {}
      throw new Error(errMsg);
    }

    // Lock successfully acquired
    if (lockResult.lock) {
      setSeatLock(lockResult.lock);
      setLockExpiresAt(lockResult.lock.expiresAt);
    } else {
      setLockExpiresAt(Date.now() + 300 * 1000);
    }

    const effectivePrice = price > 0 ? price : seats.length * (selectedTrip.priceMMK || 35000);
    setSelectedSeats(seats);
    setTotalPrice(effectivePrice);
    navigateTo('passenger_info');
  };

  const handlePassengerInfoComplete = (
    passengerList: PassengerDetail[],
    phone: string,
    email: string
  ) => {
    setPassengers(passengerList);
    setContactPhone(phone);
    setContactEmail(email);
    navigateTo('payment');
  };

  const handleLockExpired = async () => {
    setAlertError('Your 5-minute seat lock has expired. Please select your seats again.');
    await handleCancelSeatLock();
    navigateTo('seat_selection');
  };

  // Payment Confirmation & Server-Authoritative Atomic Booking Creation
  const handleConfirmPayment = async (method: PaymentMethod, _simulatedDetails: any) => {
    if (!selectedTrip) return;
    setAlertError(null);

    const calculatedTotal = (totalPrice && totalPrice > 0)
      ? totalPrice
      : (selectedSeats.length || 1) * (selectedTrip.priceMMK || 35000);

    try {
      const createdBooking = await api.createBooking({
        tripId: selectedTrip.id,
        seatNumbers: selectedSeats,
        passengers,
        contactPhone: contactPhone || passengerUser?.phone || '+95 9 1234 5678',
        contactEmail: contactEmail || passengerUser?.email || 'passenger@example.com',
        paymentMethod: method,
        totalPriceMMK: calculatedTotal,
      });

      // Clear seat lock state upon successful reservation
      setSeatLock(null);
      setLockExpiresAt(null);

      // Update local state and trips
      setBookings((prev) => [createdBooking, ...prev]);
      setActiveBookingId(createdBooking.id);

      // Refresh trip list to update booked seats across results
      const trips = await api.getTrips();
      setSchedules(trips);

      navigateTo('confirmation');
    } catch (err: any) {
      setAlertError(err.message || 'Seat double-booking detected or transaction failed.');
      // Refresh current trip seats
      try {
        const refreshed = await api.getTrip(selectedTrip.id);
        setSelectedTrip(refreshed);
      } catch {}
      // Return user to seat selection with error alert
      setSeatLock(null);
      setLockExpiresAt(null);
      navigateTo('seat_selection');
    }
  };

  // Cancel Booking on Server
  const handleCancelBooking = async (bookingId: string) => {
    try {
      await api.cancelBooking(bookingId);
      // Refresh bookings and trips
      const [updatedBookings, updatedTrips] = await Promise.all([
        api.getBookings(),
        api.getTrips(),
      ]);
      setBookings(updatedBookings);
      setSchedules(updatedTrips);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  // Admin Management Handlers
  const handleAddBus = async (busData: Omit<Bus, 'id'>) => {
    const newBus: Bus = {
      ...busData,
      id: `bus-${Date.now()}`,
    };
    const updated = [...buses, newBus];
    setBuses(updated);
    await api.updateAdminBuses(updated).catch(() => {});
  };

  const handleUpdateBus = async (updatedBus: Bus) => {
    const updated = buses.map((b) => (b.id === updatedBus.id ? updatedBus : b));
    setBuses(updated);
    await api.updateAdminBuses(updated).catch(() => {});
  };

  const handleDeleteBus = async (busId: string) => {
    const updated = buses.filter((b) => b.id !== busId);
    setBuses(updated);
    await api.updateAdminBuses(updated).catch(() => {});
  };

  const handleAddSchedule = async (schData: Omit<TripSchedule, 'id'>) => {
    const newSchedule: TripSchedule = {
      ...schData,
      id: `sch-${Date.now()}`,
    };
    const created = await api.createAdminTrip(newSchedule);
    setSchedules((prev) => [created, ...prev]);
  };

  const handleUpdateSchedule = async (updatedSch: TripSchedule) => {
    const updated = await api.updateAdminTrip(updatedSch.id, updatedSch);
    setSchedules((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteSchedule = async (schId: string) => {
    await api.deleteAdminTrip(schId);
    setSchedules((prev) => prev.filter((s) => s.id !== schId));
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: Booking['status']) => {
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
    try {
      await api.updateAdminBookingStatus(bookingId, status);
    } catch {
      // Local state is already updated
    }
  };

  const handleAddCity = async (cityName: string) => {
    const updated = Array.from(new Set([...cities, cityName as any]));
    setCities(updated);
    await api.updateAdminCities(updated).catch(() => {});
  };

  const handleResetData = async () => {
    storage.clearAll();
    await refreshBackendData();
  };

  // Find active booking for confirmation / ticket view
  const currentBooking = useMemo(() => {
    if (activeBookingId) {
      return bookings.find((b) => b.id === activeBookingId) || bookings[0];
    }
    return bookings[0];
  }, [activeBookingId, bookings]);

  // Determine whether to show Top Navbar and Bottom Navigation
  const showNav =
    currentScreen !== 'splash' &&
    currentScreen !== 'login' &&
    currentScreen !== 'signup' &&
    currentScreen !== 'admin_login';

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 text-on-background flex flex-col font-sans transition-colors duration-200 selection:bg-secondary selection:text-white">
      {/* Top Navbar */}
      {showNav && (
        <Navbar
          currentUser={passengerUser || adminUser}
          currentScreen={currentScreen}
          themeMode={themeMode}
          onNavigate={navigateTo}
          onThemeChange={setThemeMode}
          onLogout={handleLogout}
          bookings={bookings}
        />
      )}

      {/* Global Alert Notification for Seat/Booking Conflicts */}
      {alertError && (
        <div className="bg-error-container text-on-error-container p-4 text-xs md:text-sm font-semibold flex items-center justify-between shadow-md border-b border-error/30">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <span className="material-symbols-outlined text-error text-lg shrink-0">error</span>
            <span>{alertError}</span>
          </div>
          <button
            onClick={() => setAlertError(null)}
            className="text-on-error-container font-bold text-xs hover:underline cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Screen Content Router */}
      <main className="flex-1 flex flex-col w-full">
        {currentScreen === 'splash' && (
          <SplashScreen
            onFinish={() => {
              if (passengerUser) {
                navigateTo('home');
              } else {
                navigateTo('login');
              }
            }}
          />
        )}

        {currentScreen === 'login' && (
          <LoginScreen
            allUsers={users}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToSignUp={() => navigateTo('signup')}
          />
        )}

        {currentScreen === 'admin_login' && (
          <AdminLoginScreen
            allUsers={users}
            onAdminLoginSuccess={handleAdminLoginSuccess}
            onReturnToPassengerApp={() => navigateTo('home')}
          />
        )}

        {currentScreen === 'signup' && (
          <SignUpScreen
            onSignUpSuccess={handleSignUpSuccess}
            onNavigateToLogin={() => navigateTo('login')}
          />
        )}

        {currentScreen === 'home' && (
          <HomeScreen
            onSearch={handlePerformSearch}
            buses={buses}
            cities={cities}
            currentUser={passengerUser}
            onNavigateToBookings={() => navigateTo('my_bookings')}
            onNavigateToTimetables={() => navigateTo('timetables')}
            onNavigateToHelp={() => navigateTo('help')}
            onNavigateToTicket={(bookingId) => {
              setActiveBookingId(bookingId);
              navigateTo('ticket');
            }}
            recentBookings={bookings}
          />
        )}

        {currentScreen === 'timetables' && (
          <BusTimetablesScreen
            routes={routes}
            schedules={schedules}
            onSelectTrip={handleSelectTrip}
            onSearchRoute={(from, to, date) => {
              handlePerformSearch({
                fromCity: from,
                toCity: to,
                travelDate: date || new Date().toISOString().split('T')[0],
                preferredTime: 'Any Time',
                passengerCount: 1,
              });
            }}
            onBack={() => navigateTo('home')}
          />
        )}

        {(currentScreen === 'help' || currentScreen === 'help_center') && (
          <HelpCenterScreen
            currentUser={passengerUser}
            onBack={() => navigateTo('home')}
            onNavigateToBookings={() => navigateTo('my_bookings')}
            onNavigateToTimetables={() => navigateTo('timetables')}
          />
        )}

        {currentScreen === 'search_results' && (
          <BusSearchScreen
            searchParams={searchParams}
            schedules={schedules}
            cities={cities}
            onSelectTrip={handleSelectTrip}
            onUpdateSearchParams={handleUpdateSearchParams}
            onBack={() => navigateTo('home')}
          />
        )}

        {currentScreen === 'seat_selection' && selectedTrip && (
          <SeatSelectionScreen
            trip={selectedTrip}
            onContinue={handleSeatsSelected}
            onBack={() => {
              handleCancelSeatLock();
              navigateTo('search_results');
            }}
          />
        )}

        {currentScreen === 'passenger_info' && selectedTrip && (
          <PassengerInfoScreen
            trip={selectedTrip}
            selectedSeats={selectedSeats}
            totalPrice={totalPrice}
            currentUser={passengerUser}
            onProceedToPayment={handlePassengerInfoComplete}
            onBack={async () => {
              await handleCancelSeatLock();
              navigateTo('seat_selection');
            }}
          />
        )}

        {currentScreen === 'payment' && (
          <PaymentScreen
            trip={selectedTrip}
            selectedSeats={selectedSeats}
            totalAmount={totalPrice}
            lockExpiresAt={lockExpiresAt}
            lockId={seatLock?.id}
            onConfirmPayment={handleConfirmPayment}
            onExpired={handleLockExpired}
            onBack={async () => {
              await handleCancelSeatLock();
              navigateTo('seat_selection');
            }}
          />
        )}

        {currentScreen === 'confirmation' && currentBooking && (
          <ConfirmationScreen
            booking={currentBooking}
            onViewTicket={(bId) => {
              setActiveBookingId(bId);
              navigateTo('ticket');
            }}
            onNavigateToBookings={() => navigateTo('my_bookings')}
            onReturnHome={() => navigateTo('home')}
          />
        )}

        {currentScreen === 'ticket' && currentBooking && (
          <DigitalTicketScreen
            booking={currentBooking}
            onBack={() => navigateTo('my_bookings')}
            onNavigateHome={() => navigateTo('home')}
          />
        )}

        {(currentScreen === 'my_bookings' || currentScreen === 'bookings') && (
          <MyBookingsScreen
            bookings={bookings}
            onViewTicket={(bId) => {
              setActiveBookingId(bId);
              navigateTo('ticket');
            }}
            onCancelBooking={handleCancelBooking}
            onNewSearch={() => navigateTo('home')}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen
            currentUser={passengerUser || adminUser}
            bookings={bookings}
            onNavigateToBookings={() => navigateTo('my_bookings')}
            onUpdateUser={async (updated) => {
              if (updated.role === 'admin') {
                setAdminUser({ ...updated });
                storage.setStoredAdminUser(updated);
              } else {
                setPassengerUser({ ...updated });
                storage.setStoredPassengerUser(updated);
              }
              try {
                const user = await api.updateProfile(updated);
                if (user) {
                  if (user.role === 'admin') {
                    setAdminUser(user);
                    storage.setStoredAdminUser(user);
                  } else {
                    setPassengerUser(user);
                    storage.setStoredPassengerUser(user);
                  }
                }
              } catch (err: any) {
                console.warn('Background profile update:', err);
              }
            }}
            onLogout={handleLogout}
            onNavigateToAdmin={() => navigateTo('admin')}
            onNavigateToSettings={() => navigateTo('settings')}
            onNavigateToHelp={() => navigateTo('help')}
          />
        )}

        {currentScreen === 'settings' && (
          <SettingsScreen
            themeMode={themeMode}
            onThemeChange={setThemeMode}
            onResetData={handleResetData}
            onBack={() => navigateTo(previousScreen || 'home')}
            onNavigateToHelp={() => navigateTo('help')}
          />
        )}

        {currentScreen === 'admin' &&
          (adminUser?.role === 'admin' ? (
            <AdminDashboard
              buses={buses}
              routes={routes}
              schedules={schedules}
              bookings={bookings}
              users={users}
              cities={cities}
              onAddBus={handleAddBus}
              onUpdateBus={handleUpdateBus}
              onDeleteBus={handleDeleteBus}
              onAddSchedule={handleAddSchedule}
              onUpdateSchedule={handleUpdateSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              onAddCity={handleAddCity}
              onReturnToPassengerApp={handleReturnToPassengerApp}
              onAdminLogout={handleAdminLogout}
              onRefreshUsers={handleRefreshAdminUsers}
              onUpdateUserStatus={handleUpdateUserStatus}
            />
          ) : (
            <AdminLoginScreen
              allUsers={users}
              onAdminLoginSuccess={handleAdminLoginSuccess}
              onReturnToPassengerApp={() => navigateTo('home')}
            />
          ))}
      </main>

      {/* Mobile Floating Bottom Navigation */}
      {showNav && (
        <BottomNav
          currentScreen={currentScreen}
          onNavigate={navigateTo}
          activeBookingsCount={bookings.filter((b) => b.status === 'Upcoming').length}
        />
      )}
    </div>
  );
};

export default App;
