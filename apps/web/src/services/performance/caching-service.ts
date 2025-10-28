import {
  AuthenticatedUser,
  UserPreferences,
  ModuleAccess,
} from "@/types/unified-auth";

/**
 * Caching service for user permissions, preferences, and frequently accessed data
 * Implements intelligent caching with TTL and invalidation strategies
 */
export class CachingService {
  private static instance: CachingService;
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly PREFERENCES_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly PERMISSIONS_TTL = 10 * 60 * 1000; // 10 minutes

  private constructor() {
    // Clean up expired entries every minute
    setInterval(() => this.cleanupExpiredEntries(), 60 * 1000);
  }

  public static getInstance(): CachingService {
    if (!CachingService.instance) {
      CachingService.instance = new CachingService();
    }
    return CachingService.instance;
  }

  /**
   * Cache user permissions with TTL
   */
  cacheUserPermissions(userId: string, permissions: ModuleAccess[]): void {
    const key = `permissions:${userId}`;
    this.set(key, permissions, this.PERMISSIONS_TTL);
  }

  /**
   * Get cached user permissions
   */
  getCachedUserPermissions(userId: string): ModuleAccess[] | null {
    const key = `permissions:${userId}`;
    return this.get(key);
  }

  /**
   * Cache user preferences with longer TTL
   */
  cacheUserPreferences(userId: string, preferences: UserPreferences): void {
    const key = `preferences:${userId}`;
    this.set(key, preferences, this.PREFERENCES_TTL);
  }

  /**
   * Get cached user preferences
   */
  getCachedUserPreferences(userId: string): UserPreferences | null {
    const key = `preferences:${userId}`;
    return this.get(key);
  }

  /**
   * Cache module-specific data
   */
  cacheModuleData(moduleType: string, userId: string, data: any): void {
    const key = `module:${moduleType}:${userId}`;
    this.set(key, data, this.DEFAULT_TTL);
  }

  /**
   * Get cached module data
   */
  getCachedModuleData(moduleType: string, userId: string): any | null {
    const key = `module:${moduleType}:${userId}`;
    return this.get(key);
  }

  /**
   * Cache API responses with custom TTL
   */
  cacheApiResponse(
    endpoint: string,
    params: Record<string, any>,
    response: any,
    ttl?: number
  ): void {
    const key = this.generateApiCacheKey(endpoint, params);
    this.set(key, response, ttl || this.DEFAULT_TTL);
  }

  /**
   * Get cached API response
   */
  getCachedApiResponse(
    endpoint: string,
    params: Record<string, any>
  ): any | null {
    const key = this.generateApiCacheKey(endpoint, params);
    return this.get(key);
  }

  /**
   * Cache user session data
   */
  cacheUserSession(user: AuthenticatedUser): void {
    const key = `session:${user.id}`;
    const sessionData = {
      id: user.id,
      username: user.username,
      role: user.role,
      moduleAccess: user.moduleAccess,
      lastCached: new Date().toISOString(),
    };
    this.set(key, sessionData, this.PERMISSIONS_TTL);
  }

  /**
   * Get cached user session
   */
  getCachedUserSession(userId: string): Partial<AuthenticatedUser> | null {
    const key = `session:${userId}`;
    return this.get(key);
  }

  /**
   * Invalidate user-specific cache entries
   */
  invalidateUserCache(userId: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(userId)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
    console.log(
      `🗑️ Invalidated ${keysToDelete.length} cache entries for user ${userId}`
    );
  }

  /**
   * Invalidate module-specific cache
   */
  invalidateModuleCache(moduleType: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(`module:${moduleType}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
    console.log(
      `🗑️ Invalidated ${keysToDelete.length} cache entries for module ${moduleType}`
    );
  }

  /**
   * Invalidate API cache for specific endpoint
   */
  invalidateApiCache(endpoint: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(`api:${endpoint}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
    console.log(
      `🗑️ Invalidated ${keysToDelete.length} API cache entries for ${endpoint}`
    );
  }

  /**
   * Generic cache set method
   */
  private set(key: string, value: any, ttl: number): void {
    const entry: CacheEntry = {
      value,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
    };

    this.cache.set(key, entry);
  }

  /**
   * Generic cache get method
   */
  private get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Generate cache key for API responses
   */
  private generateApiCacheKey(
    endpoint: string,
    params: Record<string, any>
  ): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");

    return `api:${endpoint}:${sortedParams}`;
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    let activeEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      } else {
        activeEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      activeEntries,
      expiredEntries,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estimate memory usage of cache
   */
  private estimateMemoryUsage(): string {
    const entries = Array.from(this.cache.entries());
    const jsonString = JSON.stringify(entries);
    const bytes = new Blob([jsonString]).size;

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ Cleared all ${size} cache entries`);
  }

  /**
   * Warm up cache with user data
   */
  async warmUpUserCache(user: AuthenticatedUser): Promise<void> {
    try {
      // Cache user session
      this.cacheUserSession(user);

      // Cache user permissions
      this.cacheUserPermissions(user.id, user.moduleAccess);

      // Cache user preferences
      this.cacheUserPreferences(user.id, user.preferences);

      console.log(`🔥 Warmed up cache for user ${user.username}`);
    } catch (error) {
      console.warn("Failed to warm up user cache:", error);
    }
  }
}

interface CacheEntry {
  value: any;
  expiresAt: number;
  createdAt: number;
}

// Export singleton instance
export const cachingService = CachingService.getInstance();
