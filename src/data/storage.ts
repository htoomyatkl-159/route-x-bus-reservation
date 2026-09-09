import { Bus, Route, TripSchedule, Booking, User, ThemeMode, CityName, Language } from '../types';
import { isCustomPhotoUrl } from './photoStorage';
import {
  CITIES,
  INITIAL_BUSES,
  INITIAL_ROUTES,
  generateInitialSchedules,
  deduplicateSchedules,
  INITIAL_USER,
  INITIAL_ADMIN_USER,
  INITIAL_BOOKINGS,
} from './mockData';

const STORAGE_KEYS = {
  THEME: 'routex_theme',
  LANGUAGE: 'routex_language',
  PASSENGER_SESSION: 'routex_passenger_session',
  ADMIN_SESSION: 'routex_admin_session',
  ALL_USERS: 'routex_users',
  BUSES: 'routex_buses',
  ROUTES: 'routex_routes',
  SCHEDULES: 'routex_schedules',
  BOOKINGS: 'routex_bookings',
  CITIES: 'routex_cities',
};

// Clean up any ambiguous legacy keys on load
try {
  localStorage.removeItem('routex_current_user');
  localStorage.removeItem('routex_user');
} catch {
  // ignore
}

export const getStoredLanguage = (): Language => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as Language | null;
    if (saved === 'en' || saved === 'my') {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'en';
};

export const setStoredLanguage = (lang: Language): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  } catch {
    // ignore
  }
};

export const getStoredTheme = (): ThemeMode => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode | null;
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'light';
};

export const setStoredTheme = (theme: ThemeMode): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {
    // ignore
  }
};

export const getStoredPassengerUser = (): User | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PASSENGER_SESSION);
    if (saved) {
      const parsed: User = JSON.parse(saved);
      if (parsed && parsed.role === 'passenger') {
        if (!isCustomPhotoUrl(parsed.avatarUrl)) {
          parsed.avatarUrl = '';
        }
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
};

export const setStoredPassengerUser = (user: User | null): void => {
  try {
    if (user && user.role === 'passenger') {
      const cleanUser = {
        ...user,
        avatarUrl: isCustomPhotoUrl(user.avatarUrl) ? user.avatarUrl : '',
      };
      localStorage.setItem(STORAGE_KEYS.PASSENGER_SESSION, JSON.stringify(cleanUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.PASSENGER_SESSION);
    }
  } catch {
    // ignore
  }
};

export const clearPassengerSession = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.PASSENGER_SESSION);
  } catch {
    // ignore
  }
};

export const getStoredAdminUser = (): User | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
    if (saved) {
      const parsed: User = JSON.parse(saved);
      if (parsed && parsed.role === 'admin') {
        if (!isCustomPhotoUrl(parsed.avatarUrl)) {
          parsed.avatarUrl = '';
        }
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
};

export const setStoredAdminUser = (admin: User | null): void => {
  try {
    if (admin && admin.role === 'admin') {
      const cleanAdmin = {
        ...admin,
        avatarUrl: isCustomPhotoUrl(admin.avatarUrl) ? admin.avatarUrl : '',
      };
      localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(cleanAdmin));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
    }
  } catch {
    // ignore
  }
};

export const clearAdminSession = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  } catch {
    // ignore
  }
};

export const getStoredAllUsers = (): User[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [];
};

export const setStoredAllUsers = (users: User[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users));
  } catch {
    // ignore
  }
};

export const getStoredCities = (): CityName[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CITIES);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return CITIES;
};

export const setStoredCities = (cities: CityName[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CITIES, JSON.stringify(cities));
  } catch {
    // ignore
  }
};

export const getStoredBuses = (): Bus[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.BUSES);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return INITIAL_BUSES;
};

export const setStoredBuses = (buses: Bus[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.BUSES, JSON.stringify(buses));
  } catch {
    // ignore
  }
};

export const getStoredRoutes = (): Route[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ROUTES);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return INITIAL_ROUTES;
};

export const setStoredRoutes = (routes: Route[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(routes));
  } catch {
    // ignore
  }
};

export const getStoredSchedules = (): TripSchedule[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    if (saved) {
      const parsed: TripSchedule[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return deduplicateSchedules(parsed);
      }
    }
  } catch {
    // ignore
  }
  const defaultSchedules = generateInitialSchedules();
  try {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(defaultSchedules));
  } catch {
    // ignore
  }
  return defaultSchedules;
};

export const setStoredSchedules = (schedules: TripSchedule[]): void => {
  try {
    const cleanSchedules = deduplicateSchedules(schedules);
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(cleanSchedules));
  } catch {
    // ignore
  }
};

export const getStoredBookings = (): Booking[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return INITIAL_BOOKINGS;
};

export const setStoredBookings = (bookings: Booking[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  } catch {
    // ignore
  }
};

export const storage = {
  getLanguage: getStoredLanguage,
  saveLanguage: setStoredLanguage,
  getTheme: getStoredTheme,
  saveTheme: setStoredTheme,
  getPassengerUser: getStoredPassengerUser,
  savePassengerUser: setStoredPassengerUser,
  getStoredPassengerUser,
  setStoredPassengerUser,
  clearPassengerSession,
  getAdminUser: getStoredAdminUser,
  saveAdminUser: setStoredAdminUser,
  getStoredAdminUser,
  setStoredAdminUser,
  clearAdminSession,
  getUsers: getStoredAllUsers,
  saveUsers: setStoredAllUsers,
  getCities: getStoredCities,
  saveCities: setStoredCities,
  getBuses: getStoredBuses,
  saveBuses: setStoredBuses,
  getRoutes: getStoredRoutes,
  saveRoutes: setStoredRoutes,
  getSchedules: getStoredSchedules,
  saveSchedules: setStoredSchedules,
  getBookings: getStoredBookings,
  saveBookings: setStoredBookings,
  clearAll: () => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
  },
};
