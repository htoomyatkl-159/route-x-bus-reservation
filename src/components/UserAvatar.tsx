import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { isCustomPhotoUrl } from '../data/photoStorage';

export const GOLD_COLOR = '#FFB800';

/**
 * Calculates user initials based on requirements:
 * - Single word (e.g. "Yoki") -> first two letters: "YO"
 * - Multiple words (e.g. "Aung Aung" -> "AA", "Aung Ko Ko" -> "AK") -> first letter of first word + first letter of last word
 * - Default fallback when empty: "AA"
 */
export function getUserInitials(name?: string): string {
  if (!name || typeof name !== 'string' || !name.trim()) return 'AA';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const single = parts[0];
    return single.length >= 2 ? single.slice(0, 2).toUpperCase() : single.toUpperCase();
  }
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return (first + last).toUpperCase();
}

export interface UserAvatarProps {
  user?: User | null;
  name?: string;
  photoUrl?: string | null;
  size?: number; // Explicit pixel size (default 48 for 48x48px circle)
  className?: string; // Container dimensions & classes
  textClassName?: string; // Font styling (default text-[18px] font-bold)
  alt?: string;
  id?: string;
}

/**
 * Unified UserAvatar component used across Route X (Navbar, ProfileScreen, AdminDashboard).
 *
 * Requirements:
 * 1. DEFAULT STATE (NO PHOTO):
 *    - User initials in a gold circle (#FFB800)
 *    - Name "Aung Aung" -> "AA"
 *    - Background: Gold (#FFB800)
 *    - Text: White, Bold, 18px (for 48x48px circle)
 *    - Circle size: 48x48px
 * 2. AFTER PHOTO UPLOAD:
 *    - Renders user's authentic custom uploaded photo
 * 3. REMOVE ALL EMPTY/PLACEHOLDER ICONS:
 *    - No empty gray circles
 *    - No AI/robot icons
 *    - Fallback is ALWAYS gold circle with bold white initials
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  name,
  photoUrl,
  size,
  className = '',
  textClassName = '',
  alt,
  id,
}) => {
  const [imageError, setImageError] = useState(false);
  const effectiveName = name || user?.name || 'Aung Aung';
  const effectivePhoto = photoUrl !== undefined ? photoUrl : user?.avatarUrl;
  const hasValidPhoto = Boolean(effectivePhoto && isCustomPhotoUrl(effectivePhoto) && !imageError);
  const initials = getUserInitials(effectiveName);

  // Reset error flag if photo prop changes
  useEffect(() => {
    setImageError(false);
  }, [effectivePhoto]);

  // Dimension styling: support explicit pixel size (e.g. size={48}) or CSS classes
  const sizeStyles = size
    ? { width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px` }
    : {};
  const hasDimensionClass = className.includes('w-') || className.includes('h-');
  const defaultSizeClass = !size && !hasDimensionClass ? 'w-12 h-12' : '';
  const defaultTextClass =
    textClassName ||
    (size && size < 36 ? 'text-xs font-bold' : 'text-[18px] font-bold');

  return (
    <div
      id={id}
      style={{
        backgroundColor: GOLD_COLOR,
        ...sizeStyles,
      }}
      className={`relative overflow-hidden shrink-0 rounded-full flex items-center justify-center select-none shadow-2xs ${defaultSizeClass} ${className}`}
      title={effectiveName}
    >
      {hasValidPhoto ? (
        <img
          src={effectivePhoto!}
          alt={alt || effectiveName || 'User Avatar'}
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
        />
      ) : (
        <span
          className={`w-full h-full flex items-center justify-center tracking-wider text-white uppercase select-none ${defaultTextClass}`}
          style={{ color: '#FFFFFF', fontWeight: 700 }}
        >
          {initials}
        </span>
      )}
    </div>
  );
};
