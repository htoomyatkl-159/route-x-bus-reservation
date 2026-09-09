import React, { useState, useRef, useEffect } from 'react';
import { User, Booking } from '../types';
import {
  saveUserProfilePhoto,
  getUserProfilePhoto,
  removeUserProfilePhoto,
  useProfilePhoto,
  notifyProfilePhotoChanged,
  isCustomPhotoUrl,
} from '../data/photoStorage';
import { UserAvatar } from './UserAvatar';
import {
  getMembershipTier,
  countCompletedBookings,
  getTierMilestoneProgress,
} from '../utils/membership';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

interface ProfileScreenProps {
  currentUser: User | null;
  bookings: Booking[];
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToSettings: () => void;
  onNavigateToBookings?: () => void;
  onNavigateToHelp?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  currentUser,
  bookings,
  onUpdateUser,
  onLogout,
  onNavigateToAdmin,
  onNavigateToSettings,
  onNavigateToBookings,
  onNavigateToHelp,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const currentPhotoUrl = useProfilePhoto(currentUser);
  const [name, setName] = useState(currentUser?.name || 'Aung Aung');
  const [phone, setPhone] = useState(currentUser?.phone || '+95 9 1234 5678');
  const [email, setEmail] = useState(currentUser?.email || 'passenger@example.com');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Synchronize local form inputs when currentUser updates
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setName(currentUser.name);
      if (currentUser.phone) setPhone(currentUser.phone);
      if (currentUser.email) setEmail(currentUser.email);
    }
  }, [currentUser?.id, currentUser?.name, currentUser?.phone, currentUser?.email]);

  // Photo upload & preview states
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load custom photo from persistent storage if available
  useEffect(() => {
    let isMounted = true;
    if (currentUser?.id) {
      getUserProfilePhoto(currentUser.id)
        .then((storedPhoto) => {
          if (isMounted && storedPhoto && isCustomPhotoUrl(storedPhoto) && storedPhoto !== currentUser.avatarUrl) {
            onUpdateUser({
              ...currentUser,
              avatarUrl: storedPhoto,
            });
          }
        })
        .catch(() => {
          // ignore
        });
    }
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  const completedTrips = countCompletedBookings(bookings, currentUser?.id);
  const activeBookings = bookings.filter((b) => {
    if (b.status !== 'Upcoming') return false;
    if (currentUser?.id && b.userId && b.userId !== currentUser.id) {
      const isDemoAlias =
        (currentUser.id === 'user-pass-1' && b.userId === 'user-1') ||
        (currentUser.id === 'user-1' && b.userId === 'user-pass-1');
      if (!isDemoAlias) return false;
    }
    return true;
  }).length;

  const tierInfo = getMembershipTier(completedTrips, currentUser);
  const milestone = getTierMilestoneProgress(completedTrips);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const updated: User = {
      ...currentUser,
      name,
      phone,
      email,
    };
    onUpdateUser(updated);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate mime type
    if (!SUPPORTED_FORMATS.includes(file.type.toLowerCase())) {
      setPhotoError('Unsupported image format. Please upload JPG, PNG, or WebP.');
      return;
    }

    // Validate size (5MB max)
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setPhotoError(`File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    // Read and create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoPreview(event.target.result as string);
        setSelectedFile(file);
        setShowPhotoModal(true);
      }
    };
    reader.onerror = () => {
      setPhotoError('Failed to read selected image file.');
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be re-selected if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmSavePhoto = async () => {
    if (!currentUser || !photoPreview) return;

    try {
      setIsSavingPhoto(true);
      await saveUserProfilePhoto(
        currentUser.id,
        photoPreview,
        selectedFile?.name,
        selectedFile?.type
      );

      // Immediately broadcast to entire application (including top-right Navbar)
      notifyProfilePhotoChanged(currentUser.id, photoPreview);

      const updatedUser: User = {
        ...currentUser,
        avatarUrl: photoPreview,
      };
      onUpdateUser(updatedUser);

      setShowPhotoModal(false);
      setPhotoPreview(null);
      setSelectedFile(null);
      setIsSavingPhoto(false);
      setStatusMessage({ text: 'Profile photo updated successfully!', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setIsSavingPhoto(false);
      setPhotoError('Failed to save profile photo. Please try again.');
    }
  };

  const handleCancelPhotoPreview = () => {
    setShowPhotoModal(false);
    setPhotoPreview(null);
    setSelectedFile(null);
    setPhotoError(null);
  };

  const handleConfirmRemovePhoto = async () => {
    if (!currentUser) return;

    try {
      await removeUserProfilePhoto(currentUser.id);
      // Immediately broadcast removal to entire application (including top-right Navbar)
      notifyProfilePhotoChanged(currentUser.id, null);

      const updatedUser: User = {
        ...currentUser,
        avatarUrl: '',
      };
      onUpdateUser(updatedUser);
      setShowRemoveConfirm(false);
      setStatusMessage({ text: 'Profile photo reset to default name initials.', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'Failed to remove profile photo.', type: 'error' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const isCustomPhoto = isCustomPhotoUrl(currentPhotoUrl);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 md:px-8 py-5 pb-28 md:pb-12 space-y-6 font-sans animate-fade-in">
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload profile photo"
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary dark:text-white tracking-tight">
          My Profile
        </h1>
        <p className="text-xs md:text-sm text-on-surface-variant dark:text-slate-400">
          Manage your personal information, travel stats, and account settings
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-3 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
            statusMessage.type === 'success'
              ? 'bg-secondary-container text-on-secondary-container'
              : 'bg-error-container text-on-error-container'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {statusMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {photoError && !showPhotoModal && (
        <div className="p-3 bg-error-container text-on-error-container text-xs font-bold rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          <span>{photoError}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-3 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>Profile updated successfully!</span>
        </div>
      )}

      {/* Main Profile Info Card */}
      <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-surface-container-high dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar Area with Action Badges */}
          <div className="flex flex-col items-center gap-2.5">
            <div className="relative group">
              <UserAvatar
                user={currentUser}
                photoUrl={currentPhotoUrl}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 border-[#FFB800]/50 shadow-md"
                textClassName="text-2xl sm:text-3xl font-bold"
              />
              <span
                className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[11px] font-bold text-white shadow-xs ${
                  currentUser?.role === 'admin' ? 'bg-amber-600' : 'bg-secondary'
                }`}
                title={currentUser?.role === 'admin' ? 'Administrator' : 'Passenger Account'}
              >
                <span className="material-symbols-outlined text-xs">
                  {currentUser?.role === 'admin' ? 'admin_panel_settings' : 'person'}
                </span>
              </span>
            </div>

            {/* Photo Action Buttons */}
            <div className="flex items-center gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 text-[11px] font-bold text-secondary dark:text-teal-300 bg-secondary-container/40 dark:bg-teal-950/60 hover:bg-secondary-container rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Upload Profile Photo"
              >
                <span className="material-symbols-outlined text-sm">photo_camera</span>
                <span>{isCustomPhoto ? 'Change Photo' : 'Upload Photo'}</span>
              </button>

              {isCustomPhoto && (
                <button
                  type="button"
                  onClick={() => setShowRemoveConfirm(true)}
                  className="p-1 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors cursor-pointer"
                  title="Remove Custom Photo"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              )}
            </div>
          </div>

          {/* Profile Details Header */}
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-primary dark:text-white">
                  {currentUser?.name}
                </h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      currentUser?.role === 'admin'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
                        : 'bg-secondary-container dark:bg-teal-950 text-secondary dark:text-teal-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">
                      {currentUser?.role === 'admin' ? 'admin_panel_settings' : 'verified_user'}
                    </span>
                    {currentUser?.role === 'admin' ? 'Administrator' : 'Passenger'}
                  </span>

                  {/* Membership Tier Badge (Center of Screen / Profile Section) */}
                  <span
                    id="profile-membership-badge"
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs ${tierInfo.badgeBg}`}
                  >
                    <span className="material-symbols-outlined text-xs">{tierInfo.icon}</span>
                    <span>{tierInfo.label}</span>
                  </span>

                  <span className="text-xs text-on-surface-variant dark:text-slate-400 font-mono">
                    ID: {currentUser?.id}
                  </span>
                </div>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 rounded-xl border border-outline-variant hover:bg-surface-container text-xs font-semibold text-primary dark:text-slate-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            <p className="text-xs text-on-surface-variant dark:text-slate-400 pt-1">
              Member since {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'August 2024'}
            </p>
          </div>
        </div>

        {/* Edit Form or Readonly Information */}
        <div className="mt-6 pt-5 border-t border-outline-variant/30 dark:border-slate-800">
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-primary dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 bg-surface dark:bg-slate-800 border border-outline-variant rounded-xl text-primary dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-primary dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-surface dark:bg-slate-800 border border-outline-variant rounded-xl text-primary dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold text-primary dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-surface dark:bg-slate-800 border border-outline-variant rounded-xl text-primary dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant font-semibold text-on-surface dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-secondary text-white font-bold shadow-xs hover:bg-[#00504c] cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-surface-container-low dark:bg-slate-800 rounded-xl">
                <span className="text-on-surface-variant dark:text-slate-400 block mb-0.5">Phone Number</span>
                <span className="font-semibold text-primary dark:text-white">{currentUser?.phone}</span>
              </div>
              <div className="p-3 bg-surface-container-low dark:bg-slate-800 rounded-xl sm:col-span-2">
                <span className="text-on-surface-variant dark:text-slate-400 block mb-0.5">Email Address</span>
                <span className="font-semibold text-primary dark:text-white">{currentUser?.email}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Route X Membership & Loyalty Status Card (Center of Screen) */}
      <div
        id="profile-membership-card"
        className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-surface-container-high dark:border-slate-800 space-y-4 font-sans"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${tierInfo.gradientBg} shadow-sm shrink-0`}
            >
              <span className="material-symbols-outlined text-2xl">{tierInfo.icon}</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-primary dark:text-white">
                  {tierInfo.label}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${tierInfo.badgeBg}`}
                >
                  <span className="material-symbols-outlined text-[13px]">{tierInfo.icon}</span>
                  <span>
                    {completedTrips} {completedTrips === 1 ? 'Completed Booking' : 'Completed Bookings'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5">
                {tierInfo.description}
              </p>
            </div>
          </div>
        </div>

        {/* Milestone Progress to next tier (if not maximum tier and not admin) */}
        {currentUser?.role !== 'admin' && milestone.nextTier && (
          <div className="p-3.5 rounded-xl bg-surface-container-low dark:bg-slate-800/70 border border-outline-variant/30 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-primary dark:text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-secondary dark:text-teal-400">
                  trending_up
                </span>
                <span>Next Milestone: <strong className="text-secondary dark:text-teal-300">{milestone.nextTier}</strong></span>
              </span>
              <span className="text-on-surface-variant dark:text-slate-400 font-mono text-[11px]">
                {milestone.currentCount} / {milestone.targetCount} Completed ({milestone.percentage}%)
              </span>
            </div>
            <div className="w-full h-2 bg-surface-container-high dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${tierInfo.gradientBg}`}
                style={{ width: `${Math.max(4, milestone.percentage)}%` }}
              />
            </div>
            <p className="text-[11px] text-on-surface-variant dark:text-slate-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-secondary dark:text-teal-400">info</span>
              <span>{milestone.message}</span>
            </p>
          </div>
        )}

        {/* Membership Tier Ladder Reference */}
        <div className="pt-2 border-t border-outline-variant/30 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400 mb-2.5">
            Route X Membership Tiers (Based on Completed Bookings)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              {
                key: 'new',
                label: 'New Member',
                bookings: '0 bookings',
                icon: 'verified_user',
                badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                active: tierInfo.key === 'new',
              },
              {
                key: 'silver',
                label: 'Silver Member',
                bookings: '1–5 bookings',
                icon: 'military_tech',
                badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600',
                active: tierInfo.key === 'silver',
              },
              {
                key: 'gold',
                label: 'Gold Member',
                bookings: '6–10 bookings',
                icon: 'stars',
                badgeClass: 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
                active: tierInfo.key === 'gold',
              },
              {
                key: 'platinum',
                label: 'Platinum Member',
                bookings: '11+ bookings',
                icon: 'diamond',
                badgeClass: 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
                active: tierInfo.key === 'platinum',
              },
            ].map((tier) => (
              <div
                key={tier.key}
                className={`p-2.5 rounded-xl border transition-all ${
                  tier.active
                    ? `${tier.badgeClass} ring-2 ring-secondary dark:ring-teal-400 font-semibold shadow-2xs`
                    : 'bg-surface-container-low dark:bg-slate-800/50 border-outline-variant/30 dark:border-slate-800 text-on-surface-variant dark:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="material-symbols-outlined text-base">{tier.icon}</span>
                  {tier.active && (
                    <span className="text-[9px] uppercase tracking-wider bg-secondary text-white font-bold px-1.5 py-0.2 rounded">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold truncate">{tier.label}</p>
                <p className="text-[10px] opacity-80">{tier.bookings}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tier Benefits */}
        <div className="pt-2 border-t border-outline-variant/30 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400 mb-2">
            Your Tier Benefits ({tierInfo.label})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {tierInfo.perks.map((perk, pIdx) => (
              <div
                key={pIdx}
                className="p-2 rounded-xl bg-surface-container-low dark:bg-slate-800/70 flex items-center gap-1.5 text-xs text-primary dark:text-slate-200"
              >
                <span className="material-symbols-outlined text-sm text-secondary dark:text-teal-400 shrink-0">
                  check_circle
                </span>
                <span className="truncate text-[11px] font-medium">{perk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Travel Stats Quick Grid */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onNavigateToBookings}
          className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-surface-container-high dark:border-slate-800 flex items-center gap-3.5 hover:border-secondary/50 transition-colors text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-secondary-container dark:bg-teal-950 flex items-center justify-center text-secondary dark:text-teal-300 font-bold shrink-0">
            <span className="material-symbols-outlined">confirmation_number</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant dark:text-slate-400">Upcoming Trips</p>
            <p className="text-lg font-bold text-primary dark:text-white">{activeBookings}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onNavigateToBookings}
          className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-surface-container-high dark:border-slate-800 flex items-center gap-3.5 hover:border-emerald-500/50 transition-colors text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
            <span className="material-symbols-outlined">done_all</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant dark:text-slate-400">Completed Journeys</p>
            <p className="text-lg font-bold text-primary dark:text-white">{completedTrips}</p>
          </div>
        </button>
      </div>

      {/* Account Settings & Navigation List */}
      <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-2 shadow-xs border border-surface-container-high dark:border-slate-800 divide-y divide-outline-variant/30 dark:divide-slate-800 text-xs">
        {onNavigateToBookings && (
          <button
            onClick={onNavigateToBookings}
            className="w-full p-3.5 flex items-center justify-between hover:bg-surface-container-low dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-lg">confirmation_number</span>
              <div>
                <p className="font-semibold text-primary dark:text-white">My Bookings</p>
                <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                  View, track, and manage all your bus tickets
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>
        )}

        {onNavigateToHelp && (
          <button
            onClick={onNavigateToHelp}
            className="w-full p-3.5 flex items-center justify-between hover:bg-surface-container-low dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-lg">support_agent</span>
              <div>
                <p className="font-semibold text-primary dark:text-white">Help Center & Support</p>
                <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                  FAQs, Inquiries & 24/7 Helpline (+95 9 789 000 123)
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>
        )}

        <button
          onClick={onNavigateToSettings}
          className="w-full p-3.5 flex items-center justify-between hover:bg-surface-container-low dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-lg">settings</span>
            <div>
              <p className="font-semibold text-primary dark:text-white">Settings</p>
              <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                Appearance, Currency & Notification Preferences
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </button>

        {/* Portal Switch Option */}
        {currentUser?.role === 'admin' ? (
          <button
            onClick={onNavigateToAdmin}
            className="w-full p-3.5 flex items-center justify-between hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-600 text-lg">admin_panel_settings</span>
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">Admin Portal</p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/70">
                  Manage schedules, bookings, and fleet
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-amber-600">arrow_forward</span>
          </button>
        ) : (
          <button
            onClick={onNavigateToAdmin}
            className="w-full p-3.5 flex items-center justify-between hover:bg-surface-container-low dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-left opacity-80"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">admin_panel_settings</span>
              <div>
                <p className="font-semibold text-primary dark:text-white">Staff Admin Login</p>
                <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                  Switch to route manager or administrator account
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full p-3.5 flex items-center justify-between hover:bg-error-container/20 rounded-xl transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-lg">logout</span>
            <div>
              <p className="font-semibold text-error">Log Out</p>
              <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                End current session on this device
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-error">chevron_right</span>
        </button>
      </div>

      {/* Photo Preview & Save Modal */}
      {showPhotoModal && photoPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-surface-container-high dark:border-slate-800 text-center space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/30 dark:border-slate-800">
              <h3 className="font-bold text-base text-primary dark:text-white">
                Preview Profile Photo
              </h3>
              <button
                type="button"
                onClick={handleCancelPhotoPreview}
                className="p-1 text-on-surface-variant hover:text-primary dark:hover:text-white rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Circular Preview Container */}
            <div className="py-2 flex flex-col items-center justify-center">
              <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-secondary shadow-lg bg-slate-950">
                <img
                  src={photoPreview}
                  alt="Selected Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              {selectedFile && (
                <p className="text-[11px] text-on-surface-variant dark:text-slate-400 mt-3 truncate max-w-xs font-mono">
                  {selectedFile.name} • {(selectedFile.size / 1024).toFixed(0)} KB
                </p>
              )}
            </div>

            <p className="text-xs text-on-surface-variant dark:text-slate-300">
              Your photo will be saved and displayed across your tickets and account.
            </p>

            {photoError && (
              <div className="p-2.5 bg-error-container text-on-error-container text-xs rounded-xl flex items-center gap-1.5 text-left">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{photoError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isSavingPhoto}
                onClick={handleCancelPhotoPreview}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface dark:text-slate-300 hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingPhoto}
                onClick={handleConfirmSavePhoto}
                className="flex-1 py-2.5 bg-secondary hover:bg-[#00504c] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSavingPhoto ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">check</span>
                    <span>Save Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Photo Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-surface-container-high dark:border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>
            <h3 className="font-bold text-base text-primary dark:text-white">
              Remove Custom Photo?
            </h3>
            <p className="text-xs text-on-surface-variant dark:text-slate-300">
              Are you sure you want to remove your custom photo and restore your default name initials?
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRemoveConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemovePhoto}
                className="flex-1 py-2.5 bg-error hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
