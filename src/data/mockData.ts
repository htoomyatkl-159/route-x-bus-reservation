import { Bus, Route, TripSchedule, Booking, User, CityName } from '../types';

export const CITIES: CityName[] = ['Yangon', 'Mandalay', 'Bago', 'Myeik', 'Taunggyi'];

export const CITY_TERMINALS: Record<CityName, string> = {
  Yangon: 'Aung Mingalar Highway Station',
  Mandalay: 'Chan Mya Shwe Pyi Terminal',
  Bago: 'Bago Central Bus Gate',
  Myeik: 'Myeik Highway Express Station',
  Taunggyi: 'Taunggyi Ayetharyar Terminal',
};

export const INITIAL_BUSES: Bus[] = [
  {
    id: 'bus-1',
    code: 'RX-001',
    name: 'Scania Super VIP',
    type: 'VIP Seating',
    totalSeats: 24,
    rating: 4.9,
    amenities: ['VIP 2+1 Seating', 'Free High-Speed Wi-Fi', 'Complimentary Meal & Water', 'USB Charging Port', 'Personal TV Screen'],
    plateNumber: 'YGN 3K-8821',
  },
  {
    id: 'bus-2',
    code: 'RX-002',
    name: 'Volvo 9900 Luxury',
    type: 'VIP Seating',
    totalSeats: 24,
    rating: 4.8,
    amenities: ['Ergonomic Recliner', 'Air Suspension', 'Free Snacks & Drinks', 'AC & Reading Light', 'Blanket & Pillow'],
    plateNumber: 'MDY 9A-4040',
  },
  {
    id: 'bus-3',
    code: 'RX-003',
    name: 'Express Elite',
    type: 'VIP Seating',
    totalSeats: 24,
    rating: 4.9,
    amenities: ['VIP Seating', 'Wi-Fi Included', 'Meals & Refreshments', 'Extra Legroom', 'Onboard Attendant'],
    plateNumber: 'YGN 7B-1199',
  },
  {
    id: 'bus-4',
    code: 'RX-004',
    name: 'Comfort Cruiser',
    type: 'Standard AC',
    totalSeats: 24,
    rating: 4.7,
    amenities: ['Standard AC', 'Charging Ports', 'Spacious Luggage Compartment', 'Bottled Mineral Water'],
    plateNumber: 'BGO 2D-5531',
  },
  {
    id: 'bus-5',
    code: 'RX-005',
    name: 'Royal High Class',
    type: 'Luxury Suite',
    totalSeats: 24,
    rating: 4.95,
    amenities: ['Zero Gravity Seat', 'Private Curtain', 'Hot Snack & Coffee', 'Noise-Cancelling Headsets', 'High-Speed Wi-Fi'],
    plateNumber: 'TGI 5C-7788',
  },
];

export const INITIAL_ROUTES: Route[] = [
  {
    id: 'route-1',
    fromCity: 'Yangon',
    toCity: 'Mandalay',
    fromTerminal: 'Aung Mingalar Highway Station',
    toTerminal: 'Chan Mya Shwe Pyi Terminal',
    distanceKm: 630,
    durationText: '8h 30m',
    basePriceMMK: 35000,
  },
  {
    id: 'route-2',
    fromCity: 'Mandalay',
    toCity: 'Yangon',
    fromTerminal: 'Chan Mya Shwe Pyi Terminal',
    toTerminal: 'Aung Mingalar Highway Station',
    distanceKm: 630,
    durationText: '8h 30m',
    basePriceMMK: 35000,
  },
  {
    id: 'route-3',
    fromCity: 'Yangon',
    toCity: 'Taunggyi',
    fromTerminal: 'Aung Mingalar Highway Station',
    toTerminal: 'Taunggyi Ayetharyar Terminal',
    distanceKm: 640,
    durationText: '11h 00m',
    basePriceMMK: 42000,
  },
  {
    id: 'route-4',
    fromCity: 'Taunggyi',
    toCity: 'Yangon',
    fromTerminal: 'Taunggyi Ayetharyar Terminal',
    toTerminal: 'Aung Mingalar Highway Station',
    distanceKm: 640,
    durationText: '11h 00m',
    basePriceMMK: 42000,
  },
  {
    id: 'route-5',
    fromCity: 'Yangon',
    toCity: 'Bago',
    fromTerminal: 'Aung Mingalar Highway Station',
    toTerminal: 'Bago Central Bus Gate',
    distanceKm: 85,
    durationText: '2h 00m',
    basePriceMMK: 12000,
  },
  {
    id: 'route-6',
    fromCity: 'Bago',
    toCity: 'Yangon',
    fromTerminal: 'Bago Central Bus Gate',
    toTerminal: 'Aung Mingalar Highway Station',
    distanceKm: 85,
    durationText: '2h 00m',
    basePriceMMK: 12000,
  },
  {
    id: 'route-7',
    fromCity: 'Yangon',
    toCity: 'Myeik',
    fromTerminal: 'Aung Mingalar Highway Station',
    toTerminal: 'Myeik Highway Express Station',
    distanceKm: 860,
    durationText: '16h 00m',
    basePriceMMK: 48000,
  },
  {
    id: 'route-8',
    fromCity: 'Myeik',
    toCity: 'Yangon',
    fromTerminal: 'Myeik Highway Express Station',
    toTerminal: 'Aung Mingalar Highway Station',
    distanceKm: 860,
    durationText: '16h 00m',
    basePriceMMK: 48000,
  },
  {
    id: 'route-9',
    fromCity: 'Mandalay',
    toCity: 'Taunggyi',
    fromTerminal: 'Chan Mya Shwe Pyi Terminal',
    toTerminal: 'Taunggyi Ayetharyar Terminal',
    distanceKm: 275,
    durationText: '6h 30m',
    basePriceMMK: 28000,
  },
  {
    id: 'route-10',
    fromCity: 'Taunggyi',
    toCity: 'Mandalay',
    fromTerminal: 'Taunggyi Ayetharyar Terminal',
    toTerminal: 'Chan Mya Shwe Pyi Terminal',
    distanceKm: 275,
    durationText: '6h 30m',
    basePriceMMK: 28000,
  },
];

// Generate schedules for a specific date
export const generateSchedulesForDate = (dateStr: string): TripSchedule[] => {
  const schedules: TripSchedule[] = [];

  const timeSlots = [
    { dep: '08:00 AM', arr: '05:00 PM', dur: '9h 00m', timeCategory: 'Morning' },
    { dep: '01:30 PM', arr: '10:00 PM', dur: '8h 30m', timeCategory: 'Afternoon' },
    { dep: '08:00 PM', arr: '05:00 AM', dur: '9h 00m', timeCategory: 'Evening' },
    { dep: '09:30 PM', arr: '06:00 AM', dur: '8h 30m', timeCategory: 'Night' },
  ];

  INITIAL_ROUTES.forEach((route, rIndex) => {
    timeSlots.forEach((slot, slotIndex) => {
      const bus = INITIAL_BUSES[(rIndex + slotIndex) % INITIAL_BUSES.length];

      // Simulate booked seats
      let bookedSeats: number[] = [4, 6, 10, 13, 20];
      if (slot.dep === '09:30 PM') {
        bookedSeats = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 16, 17, 18, 19, 20, 21, 22]; // only 4 seats left
      } else if (slotIndex % 2 === 0) {
        bookedSeats = [3, 4, 7, 8, 15, 16, 23, 24];
      }

      // Create a deterministic unique ID
      const sanitizedDep = slot.dep.replace(/[^a-zA-Z0-9]/g, '');
      const uniqueId = `trip-${route.id}-${bus.id}-${sanitizedDep}-${dateStr}`;

      schedules.push({
        id: uniqueId,
        busId: bus.id,
        routeId: route.id,
        busCode: bus.code,
        busName: bus.name,
        busType: bus.type,
        fromCity: route.fromCity,
        toCity: route.toCity,
        fromTerminal: route.fromTerminal,
        toTerminal: route.toTerminal,
        departureTime: slot.dep,
        arrivalTime: slot.arr,
        travelDate: dateStr,
        durationText: route.durationText,
        priceMMK: route.basePriceMMK + (bus.type === 'VIP Seating' ? 3000 : bus.type === 'Luxury Suite' ? 10000 : 0),
        totalSeats: 24,
        bookedSeats,
        rating: bus.rating,
        amenities: bus.amenities,
        status: 'Scheduled',
      });
    });
  });

  return schedules;
};

// Deduplication key based on the exact rule:
// Bus ID, Route, Departure date, Departure time, Arrival time, Bus type, Ticket price
export const getTripDeduplicationKey = (trip: Partial<TripSchedule>): string => {
  const busKey = (trip.busId || trip.busCode || trip.busName || '').trim().toLowerCase();
  const fromKey = (trip.fromCity || '').trim().toLowerCase();
  const toKey = (trip.toCity || '').trim().toLowerCase();
  const dateKey = (trip.travelDate || '').trim();
  const depKey = (trip.departureTime || '').trim().toLowerCase();
  const arrKey = (trip.arrivalTime || '').trim().toLowerCase();
  const typeKey = (trip.busType || '').trim().toLowerCase();
  const priceKey = String(trip.priceMMK || 0);

  return `${busKey}|${fromKey}|${toKey}|${dateKey}|${depKey}|${arrKey}|${typeKey}|${priceKey}`;
};

// Deduplicate an array of trips
export const deduplicateSchedules = (trips: TripSchedule[]): TripSchedule[] => {
  if (!Array.isArray(trips)) return [];
  const seenKeys = new Set<string>();
  const seenIds = new Set<string>();
  const result: TripSchedule[] = [];

  for (const trip of trips) {
    if (!trip) continue;

    // Check ID uniqueness
    if (trip.id && seenIds.has(trip.id)) {
      continue;
    }

    // Check composite attribute uniqueness
    const key = getTripDeduplicationKey(trip);
    if (seenKeys.has(key)) {
      continue;
    }

    seenKeys.add(key);
    if (trip.id) {
      seenIds.add(trip.id);
    }
    result.push(trip);
  }

  return result;
};

// Helper to generate dynamic schedules for today, tomorrow, day after, etc.
export const generateInitialSchedules = (): TripSchedule[] => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0];
  const threeDaysAfter = new Date(Date.now() + 259200000).toISOString().split('T')[0];

  const dates = [today, tomorrow, dayAfter, threeDaysAfter];
  const allSchedules: TripSchedule[] = [];

  dates.forEach((dateStr) => {
    const daySchedules = generateSchedulesForDate(dateStr);
    allSchedules.push(...daySchedules);
  });

  return deduplicateSchedules(allSchedules);
};

export const INITIAL_USER: User = {
  id: 'user-1',
  name: 'Aung Kyaw',
  email: 'aung@example.com',
  phone: '+95 9 1234 5678',
  avatarUrl: '',
  role: 'passenger',
  savedRoutes: [
    { from: 'Yangon', to: 'Mandalay' },
    { from: 'Yangon', to: 'Taunggyi' },
  ],
};

export const INITIAL_ADMIN_USER: User = {
  id: 'user-admin',
  name: 'Admin Manager',
  email: 'admin@routex.com',
  phone: '+95 9 9876 5432',
  avatarUrl: '',
  role: 'admin',
};

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'RX-98721',
    tripId: 'trip-3',
    userId: 'user-1',
    passengerName: 'Aung Kyaw',
    contactPhone: '+95 9 1234 5678',
    contactEmail: 'aung@example.com',
    fromCity: 'Yangon',
    toCity: 'Mandalay',
    fromTerminal: 'Aung Mingalar Highway Station',
    toTerminal: 'Chan Mya Shwe Pyi Terminal',
    travelDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    departureTime: '8:00 PM',
    arrivalTime: '5:00 AM',
    durationText: '9h 00m',
    busName: 'Express Elite',
    busCode: 'RX-003',
    seatNumbers: [12, 14],
    passengers: [
      { seatNumber: 12, fullName: 'Aung Kyaw', phone: '+95 9 1234 5678', gender: 'Male', nrc: '12/YAGANA(N)189283' },
      { seatNumber: 14, fullName: 'Su Su Hlaing', phone: '+95 9 2345 6789', gender: 'Female', nrc: '12/YAGANA(N)299104' },
    ],
    paymentMethod: 'KBZPay',
    paymentStatus: 'Paid',
    totalPriceMMK: 70000,
    createdAt: new Date().toISOString(),
    status: 'Upcoming',
    qrToken: 'RX-98721-YGN-MDL-12-14',
  },
  {
    id: 'RX-84920',
    tripId: 'trip-1',
    userId: 'user-1',
    passengerName: 'Aung Kyaw',
    contactPhone: '+95 9 1234 5678',
    contactEmail: 'aung@example.com',
    fromCity: 'Yangon',
    toCity: 'Bago',
    fromTerminal: 'Aung Mingalar Highway Station',
    toTerminal: 'Bago Central Bus Gate',
    travelDate: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    departureTime: '08:30 AM',
    arrivalTime: '10:30 AM',
    durationText: '2h 00m',
    busName: 'Comfort Cruiser',
    busCode: 'RX-004',
    seatNumbers: [5],
    passengers: [
      { seatNumber: 5, fullName: 'Aung Kyaw', phone: '+95 9 1234 5678', gender: 'Male' },
    ],
    paymentMethod: 'Wave Pay',
    paymentStatus: 'Paid',
    totalPriceMMK: 12000,
    createdAt: new Date(Date.now() - 250000000).toISOString(),
    status: 'Completed',
    qrToken: 'RX-84920-YGN-BGO-5',
  },
  {
    id: 'RX-77102',
    tripId: 'trip-7',
    userId: 'user-1',
    passengerName: 'Aung Kyaw',
    contactPhone: '+95 9 1234 5678',
    contactEmail: 'aung@example.com',
    fromCity: 'Yangon',
    toCity: 'Taunggyi',
    fromTerminal: 'Aung Mingalar Highway Station',
    toTerminal: 'Taunggyi Ayetharyar Terminal',
    travelDate: new Date(Date.now() - 600000000).toISOString().split('T')[0],
    departureTime: '06:30 PM',
    arrivalTime: '05:30 AM',
    durationText: '11h 00m',
    busName: 'Scania Super VIP',
    busCode: 'RX-001',
    seatNumbers: [9, 10],
    passengers: [
      { seatNumber: 9, fullName: 'Aung Kyaw', phone: '+95 9 1234 5678', gender: 'Male' },
      { seatNumber: 10, fullName: 'Myo Zaw', phone: '+95 9 8765 4321', gender: 'Male' },
    ],
    paymentMethod: 'Cash at Terminal',
    paymentStatus: 'Refunded',
    totalPriceMMK: 84000,
    createdAt: new Date(Date.now() - 650000000).toISOString(),
    status: 'Cancelled',
    qrToken: 'RX-77102-YGN-TGI-9-10',
  },
];
