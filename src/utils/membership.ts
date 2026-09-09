import { Booking, User } from '../types';

export type MembershipTierKey = 'new' | 'silver' | 'gold' | 'platinum' | 'admin';

export interface MembershipTierInfo {
  key: MembershipTierKey;
  label: string;
  shortLabel: string;
  minBookings: number;
  textColor: string;
  badgeBg: string;
  gradientBg: string;
  starColor: string;
  icon: string;
  description: string;
  perks: string[];
}

/**
 * Counts the number of completed bookings for a specific user.
 * If userId is provided, matches against booking.userId (including demo alias mapping).
 */
export function countCompletedBookings(bookings: Booking[] = [], userId?: string): number {
  if (!Array.isArray(bookings)) return 0;
  return bookings.filter((b) => {
    if (b.status !== 'Completed') return false;
    if (userId) {
      // If booking has a userId, verify ownership
      if (b.userId && b.userId !== userId) {
        // Alias mapping for default demo account between client and server id
        const isDemoAlias =
          (userId === 'user-pass-1' && b.userId === 'user-1') ||
          (userId === 'user-1' && b.userId === 'user-pass-1');
        if (!isDemoAlias) return false;
      }
    }
    return true;
  }).length;
}

/**
 * Determines the membership tier details based on completed booking count and user role.
 * Rules:
 * - 0 bookings: "New Member"
 * - 1-5 bookings: "Silver Member"
 * - 6-10 bookings: "Gold Member"
 * - 11+ bookings: "Platinum Member"
 */
export function getMembershipTier(
  completedCount: number,
  user?: User | null
): MembershipTierInfo {
  // If user is administrator
  if (user?.role === 'admin') {
    return {
      key: 'admin',
      label: 'Admin VIP',
      shortLabel: 'Admin',
      minBookings: 0,
      textColor: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
      gradientBg: 'from-amber-600 to-rose-600',
      starColor: 'bg-amber-500',
      icon: 'admin_panel_settings',
      description: 'System Administrator with full management permissions.',
      perks: ['System Access', 'Fleet Dispatch', 'User Auditing', 'Booking Controls'],
    };
  }

  // 11+ bookings: Platinum Member
  if (completedCount >= 11) {
    return {
      key: 'platinum',
      label: 'Platinum Member',
      shortLabel: 'Platinum',
      minBookings: 11,
      textColor: 'text-purple-600 dark:text-purple-400',
      badgeBg: 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
      gradientBg: 'from-purple-600 to-indigo-600',
      starColor: 'bg-purple-500',
      icon: 'diamond',
      description: 'Elite VIP tier: 15% discount, complimentary changes & VIP terminal lounge.',
      perks: ['15% VIP Fare Discount', 'Free Ticket Rescheduling', 'VIP Lounge Access', 'Priority Boarding'],
    };
  }

  // 6-10 bookings: Gold Member
  if (completedCount >= 6) {
    return {
      key: 'gold',
      label: 'Gold Member',
      shortLabel: 'Gold',
      minBookings: 6,
      textColor: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
      gradientBg: 'from-amber-500 to-amber-600',
      starColor: 'bg-amber-500',
      icon: 'stars',
      description: 'Frequent traveler: 10% discount, free seat choice & complimentary onboard snack.',
      perks: ['10% Ticket Discount', 'Free Seat Selection', 'Complimentary Snack Box', 'Priority Support'],
    };
  }

  // 1-5 bookings: Silver Member
  if (completedCount >= 1) {
    return {
      key: 'silver',
      label: 'Silver Member',
      shortLabel: 'Silver',
      minBookings: 1,
      textColor: 'text-slate-600 dark:text-slate-300',
      badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600',
      gradientBg: 'from-slate-500 to-slate-600',
      starColor: 'bg-slate-400',
      icon: 'military_tech',
      description: 'Loyal traveler: 5% discount on all routes and fast-track ticket inquiry desk.',
      perks: ['5% Ticket Discount', 'Fast-track Helpdesk', 'Earn Reward Points', 'Flexible Cancellation'],
    };
  }

  // 0 bookings: New Member
  return {
    key: 'new',
    label: 'New Member',
    shortLabel: 'New',
    minBookings: 0,
    textColor: 'text-emerald-700 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    gradientBg: 'from-emerald-500 to-teal-600',
    starColor: 'bg-emerald-500',
    icon: 'verified_user',
    description: 'Welcome aboard Route X! Complete 1 trip to unlock Silver Member status.',
    perks: ['Standard Booking', 'Instant E-Tickets', '24/7 Helpline Support'],
  };
}

/**
 * Calculates progress toward the next membership milestone.
 */
export function getTierMilestoneProgress(completedCount: number): {
  currentTier: string;
  nextTier: string | null;
  currentCount: number;
  targetCount: number;
  percentage: number;
  remainingCount: number;
  message: string;
} {
  if (completedCount >= 11) {
    return {
      currentTier: 'Platinum Member',
      nextTier: null,
      currentCount: completedCount,
      targetCount: 11,
      percentage: 100,
      remainingCount: 0,
      message: 'Highest tier achieved! Enjoy premium VIP perks on all journeys.',
    };
  }

  if (completedCount >= 6) {
    const target = 11;
    const remaining = target - completedCount;
    const progress = Math.min(100, Math.round(((completedCount - 6) / 5) * 100));
    return {
      currentTier: 'Gold Member',
      nextTier: 'Platinum Member',
      currentCount: completedCount,
      targetCount: target,
      percentage: progress,
      remainingCount: remaining,
      message: `${remaining} more completed ${remaining === 1 ? 'trip' : 'trips'} to reach Platinum Member`,
    };
  }

  if (completedCount >= 1) {
    const target = 6;
    const remaining = target - completedCount;
    const progress = Math.min(100, Math.round(((completedCount - 1) / 5) * 100));
    return {
      currentTier: 'Silver Member',
      nextTier: 'Gold Member',
      currentCount: completedCount,
      targetCount: target,
      percentage: progress,
      remainingCount: remaining,
      message: `${remaining} more completed ${remaining === 1 ? 'trip' : 'trips'} to reach Gold Member`,
    };
  }

  // 0 bookings
  return {
    currentTier: 'New Member',
    nextTier: 'Silver Member',
    currentCount: 0,
    targetCount: 1,
    percentage: 0,
    remainingCount: 1,
    message: 'Complete your first trip to unlock Silver Member status',
  };
}
