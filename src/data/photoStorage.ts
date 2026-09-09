// Image Storage Utility for Route X Profile Photos using IndexedDB (Binary blob/data URL storage)
// IndexedDB avoids bloating localStorage and supports persistent binary storage up to multiple gigabytes safely across sessions and page refreshes.
import { useState, useEffect } from 'react';
import { User } from '../types';

/**
 * Empty default avatar. The application uses gold (#FFB800) initials by default instead of any placeholder images.
 */
export const DEFAULT_AVATAR = '';

export const PROFILE_PHOTO_EVENT = 'routex_profile_photo_changed';

/**
 * Validates whether a photo URL is an authentic uploaded image (e.g. data URL or blob)
 * and strictly filters out any legacy robot / AI placeholder images or corrupt empty circle placeholders.
 */
export const isCustomPhotoUrl = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string' || !url.trim()) return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed === 'null' || trimmed === 'undefined' || trimmed === 'none' || trimmed === '') {
    return false;
  }
  // Exclude legacy AI/robot placeholder images
  if (trimmed.includes('aida-public') || trimmed.includes('lh3.googleusercontent.com')) {
    return false;
  }
  // Exclude legacy corrupt/empty gray circle placeholders
  if (
    trimmed.includes('hozj4n') ||
    trimmed.includes('ivborw0kggoaaaansuheugaaa9ka') ||
    trimmed.length > 500000
  ) {
    return false;
  }
  // Must be a data image, blob URL, or valid http/https image URL
  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return true;
  }
  return false;
};

/**
 * Fast synchronous localStorage cache reader for instant rendering
 */
export const getCachedProfilePhoto = (userId: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(`routex_avatar_${userId}`);
    if (cached && isCustomPhotoUrl(cached)) {
      return cached;
    }
    // Clean up any stale legacy AI placeholder avatars from localStorage
    if (cached && !isCustomPhotoUrl(cached)) {
      localStorage.removeItem(`routex_avatar_${userId}`);
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Broadcast photo update to all components across the entire application immediately
 */
export const notifyProfilePhotoChanged = (userId: string, photoUrl: string | null) => {
  if (typeof window !== 'undefined') {
    const validUrl = isCustomPhotoUrl(photoUrl) ? photoUrl! : null;
    try {
      if (validUrl) {
        localStorage.setItem(`routex_avatar_${userId}`, validUrl);
      } else {
        localStorage.removeItem(`routex_avatar_${userId}`);
      }
    } catch {}
    window.dispatchEvent(
      new CustomEvent(PROFILE_PHOTO_EVENT, {
        detail: { userId, photoUrl: validUrl },
      })
    );
  }
};

/**
 * Unified React hook providing real-time synchronized profile photo
 * used simultaneously by both Navbar (top-right) and ProfileScreen (center).
 * Returns null if no custom photo has been uploaded, triggering the gold initials badge.
 */
export const useProfilePhoto = (user: User | null): string | null => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(() => {
    if (!user) return null;
    const cached = getCachedProfilePhoto(user.id);
    if (isCustomPhotoUrl(cached)) return cached;
    if (isCustomPhotoUrl(user.avatarUrl)) return user.avatarUrl;
    return null;
  });

  useEffect(() => {
    if (!user?.id) {
      setPhotoUrl(null);
      return;
    }

    // 1. Sync from user prop if updated
    if (isCustomPhotoUrl(user.avatarUrl) && user.avatarUrl !== photoUrl) {
      setPhotoUrl(user.avatarUrl);
    } else if (!isCustomPhotoUrl(user.avatarUrl) && !photoUrl) {
      setPhotoUrl(null);
    }

    // 2. Sync from fast local cache
    const cached = getCachedProfilePhoto(user.id);
    if (isCustomPhotoUrl(cached) && cached !== photoUrl) {
      setPhotoUrl(cached);
    }

    // 3. Sync from persistent IndexedDB
    let isMounted = true;
    getUserProfilePhoto(user.id)
      .then((stored) => {
        if (isMounted) {
          if (stored && isCustomPhotoUrl(stored)) {
            setPhotoUrl(stored);
            try {
              localStorage.setItem(`routex_avatar_${user.id}`, stored);
            } catch {}
          } else if (!stored && !isCustomPhotoUrl(user.avatarUrl)) {
            setPhotoUrl(null);
          }
        }
      })
      .catch(() => {});

    // 4. Real-time event listener: immediately updates whenever a new photo is uploaded or removed
    const handlePhotoChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string; photoUrl: string | null }>;
      if (customEvent.detail && customEvent.detail.userId === user.id) {
        const newUrl = customEvent.detail.photoUrl;
        setPhotoUrl(isCustomPhotoUrl(newUrl) ? newUrl : null);
      }
    };

    window.addEventListener(PROFILE_PHOTO_EVENT, handlePhotoChanged);
    return () => {
      isMounted = false;
      window.removeEventListener(PROFILE_PHOTO_EVENT, handlePhotoChanged);
    };
  }, [user?.id, user?.avatarUrl]);

  return photoUrl;
};

const DB_NAME = 'routex_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'profile_photos';

interface PhotoRecord {
  userId: string;
  photoDataUrl: string;
  updatedAt: number;
  fileName?: string;
  mimeType?: string;
}

const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open database'));
    };
  });
};

/**
 * Save user profile photo directly to persistent IndexedDB
 */
export const saveUserProfilePhoto = async (
  userId: string,
  photoDataUrl: string,
  fileName?: string,
  mimeType?: string
): Promise<void> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: PhotoRecord = {
        userId,
        photoDataUrl,
        updatedAt: Date.now(),
        fileName,
        mimeType,
      };

      const putRequest = store.put(record);

      putRequest.onsuccess = () => {
        notifyProfilePhotoChanged(userId, photoDataUrl);
        resolve();
      };

      putRequest.onerror = () => {
        reject(putRequest.error || new Error('Failed to save profile photo'));
      };

      tx.oncomplete = () => {
        db.close();
      };
    });
  } catch (err) {
    console.error('Error saving profile photo to storage:', err);
    throw err;
  }
};

/**
 * Retrieve user profile photo data URL from persistent storage
 */
export const getUserProfilePhoto = async (userId: string): Promise<string | null> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(userId);

      getRequest.onsuccess = () => {
        const record = getRequest.result as PhotoRecord | undefined;
        if (record && isCustomPhotoUrl(record.photoDataUrl)) {
          resolve(record.photoDataUrl);
        } else {
          if (record) {
            removeUserProfilePhoto(userId).catch(() => {});
          }
          resolve(null);
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error || new Error('Failed to read profile photo'));
      };

      tx.oncomplete = () => {
        db.close();
      };
    });
  } catch (err) {
    console.warn('Error reading profile photo from storage:', err);
    return null;
  }
};

/**
 * Delete a user profile photo from persistent storage
 */
export const removeUserProfilePhoto = async (userId: string): Promise<void> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const deleteRequest = store.delete(userId);

      deleteRequest.onsuccess = () => {
        notifyProfilePhotoChanged(userId, null);
        resolve();
      };

      deleteRequest.onerror = () => {
        reject(deleteRequest.error || new Error('Failed to delete profile photo'));
      };

      tx.oncomplete = () => {
        db.close();
      };
    });
  } catch (err) {
    console.error('Error removing profile photo from storage:', err);
    notifyProfilePhotoChanged(userId, null);
  }
};
