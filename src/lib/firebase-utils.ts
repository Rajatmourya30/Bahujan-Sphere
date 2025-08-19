/**
 * Enhanced Firebase utility functions for secure and efficient operations
 */

import { DocumentSnapshot, query, collection, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Safe wrapper for Firestore operations with comprehensive error handling
 */
export async function safeFirestoreOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    console.error(errorMessage, error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : errorMessage 
    };
  }
}

/**
 * Create optimized paginated queries for large collections
 */
export function createPaginatedQuery(
  collectionName: string,
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
) {
  let q = query(
    collection(db, collectionName),
    where("status", "==", "approved"),
    orderBy("uploadedAt", "desc"),
    limit(pageSize)
  );
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  return q;
}

/**
 * Client-side caching for frequently accessed data
 */
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getCachedData<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return Promise.resolve(cached.data);
  }
  
  return fetcher().then(data => {
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  });
}

/**
 * Clear cache for a specific key or all cache
 */
export function clearCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * Validate user role for access control
 */
export function validateUserRole(userRole: string | null, requiredRoles: string[]): boolean {
  return userRole !== null && requiredRoles.includes(userRole);
}

/**
 * Check if user is a team member with any role
 */
export function isTeamMember(userRole: string | null): boolean {
  return validateUserRole(userRole, ['Admin', 'Manager', 'Editor', 'Reviewer', 'Contributor']);
}

/**
 * Check if user has reviewer or admin privileges
 */
export function isReviewerOrAdmin(userRole: string | null): boolean {
  return validateUserRole(userRole, ['Admin', 'Manager', 'Editor', 'Reviewer']);
}

/**
 * Generate unique filename with timestamp to prevent collisions
 */
export function generateUniqueFileName(originalName: string, userId?: string): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
  
  if (userId) {
    return `${userId}_${timestamp}_${sanitizedName}.${extension}`;
  }
  
  return `${timestamp}_${sanitizedName}.${extension}`;
}

/**
 * Validate file type and size
 */
export function validateFile(
  file: File, 
  allowedTypes: string[], 
  maxSizeMB: number = 10
): { isValid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${maxSizeMB}MB`
    };
  }
  
  return { isValid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Retry mechanism for failed operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError!;
}
