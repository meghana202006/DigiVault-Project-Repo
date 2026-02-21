/**
 * Cache utility for storing and retrieving files and folders from localStorage
 * Only fetches from server if changes are detected
 * Cache is user-specific to prevent data leakage between users
 */

const CACHE_PREFIX = 'digivault_cache_';
const CACHE_VERSION = '1.0';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Get user ID from JWT token
 * Returns null if token is invalid or doesn't contain user ID
 */
const getUserIdFromToken = () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Try to get user ID from different possible fields
    return payload.id || payload.userId || payload.sub || null;
  } catch (error) {
    console.warn('Error extracting user ID from token:', error);
    return null;
  }
};

/**
 * Generate cache key for a section (user-specific)
 */
const getCacheKey = (type, sectionType) => {
  const userId = getUserIdFromToken();
  if (!userId) {
    // If no user ID, use a default key (shouldn't happen when logged in)
    console.warn('No user ID found in token, using default cache key');
    return `${CACHE_PREFIX}${type}_${sectionType}`;
  }
  return `${CACHE_PREFIX}${userId}_${type}_${sectionType}`;
};

/**
 * Get cached data
 */
export const getCachedData = (type, sectionType) => {
  try {
    const cacheKey = getCacheKey(type, sectionType);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      return null;
    }
    
    const parsed = JSON.parse(cached);
    
    // Check if cache is expired
    const now = Date.now();
    if (parsed.expiry && now > parsed.expiry) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return parsed.data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

/**
 * Set cached data
 */
export const setCachedData = (type, sectionType, data) => {
  try {
    const cacheKey = getCacheKey(type, sectionType);
    const cacheData = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + CACHE_EXPIRY,
      version: CACHE_VERSION
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing cache:', error);
    // If quota exceeded, clear old cache
    if (error.name === 'QuotaExceededError') {
      clearOldCache();
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (retryError) {
        console.error('Failed to write cache after cleanup:', retryError);
      }
    }
  }
};

/**
 * Invalidate cache for a section
 */
export const invalidateCache = (type, sectionType) => {
  try {
    const cacheKey = getCacheKey(type, sectionType);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
};

/**
 * Invalidate all caches for the current user
 */
export const invalidateAllCache = () => {
  try {
    const userId = getUserIdFromToken();
    const keys = Object.keys(localStorage);
    
    if (userId) {
      // Clear only current user's cache
      const userCachePrefix = `${CACHE_PREFIX}${userId}_`;
      keys.forEach(key => {
        if (key.startsWith(userCachePrefix)) {
          localStorage.removeItem(key);
        }
      });
    } else {
      // If no user ID, clear all cache (fallback for logout)
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

/**
 * Clear old/expired cache entries
 */
const clearOldCache = () => {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.expiry && now > parsed.expiry) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          // Remove invalid cache entries
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Error clearing old cache:', error);
  }
};

/**
 * Compare two arrays to detect changes
 * Returns true if there are changes, false if identical
 */
export const hasChanges = (oldData, newData) => {
  if (!oldData || !newData) {
    return true; // If either is null, consider it changed
  }
  
  if (oldData.length !== newData.length) {
    return true; // Different lengths = changed
  }
  
  // Create maps for quick lookup
  const oldMap = new Map(oldData.map(item => [item._id, item]));
  const newMap = new Map(newData.map(item => [item._id, item]));
  
  // Check if all IDs match
  for (const id of oldMap.keys()) {
    if (!newMap.has(id)) {
      return true; // Item removed
    }
  }
  
  for (const id of newMap.keys()) {
    if (!oldMap.has(id)) {
      return true; // Item added
    }
    
    // Check if item was modified (compare updatedAt if available)
    const oldItem = oldMap.get(id);
    const newItem = newMap.get(id);
    
    if (oldItem.updatedAt && newItem.updatedAt) {
      if (new Date(oldItem.updatedAt).getTime() !== new Date(newItem.updatedAt).getTime()) {
        return true; // Item modified
      }
    }
  }
  
  return false; // No changes detected
};

/**
 * Get cache timestamp
 */
export const getCacheTimestamp = (type, sectionType) => {
  try {
    const cacheKey = getCacheKey(type, sectionType);
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    return parsed.timestamp;
  } catch (error) {
    return null;
  }
};

