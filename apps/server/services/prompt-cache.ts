import { ModuleType } from "../../../packages/db/schema";

/**
 * In-memory cache for prompt sections to improve performance
 * This cache reduces database queries for frequently accessed prompts
 */
export class PromptCache {
  private cache = new Map<string, any>();
  private cacheTimestamps = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly MAX_CACHE_SIZE = 1000; // Maximum number of cached items

  /**
   * Generate cache key for prompt sections
   */
  private getCacheKey(
    moduleType: ModuleType,
    promptType?: string,
    pathwayType?: string
  ): string {
    return `prompts:${moduleType}:${promptType || "all"}:${
      pathwayType || "all"
    }`;
  }

  /**
   * Check if cache entry is still valid
   */
  private isValidCacheEntry(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;

    return Date.now() - timestamp < this.CACHE_TTL;
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      if (now - timestamp >= this.CACHE_TTL) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
    }
  }

  /**
   * Ensure cache doesn't exceed maximum size
   */
  private enforceMaxSize(): void {
    if (this.cache.size <= this.MAX_CACHE_SIZE) return;

    // Remove oldest entries first
    const entries = Array.from(this.cacheTimestamps.entries()).sort(
      ([, a], [, b]) => a - b
    );

    const entriesToRemove = entries.slice(
      0,
      this.cache.size - this.MAX_CACHE_SIZE
    );

    for (const [key] of entriesToRemove) {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
    }
  }

  /**
   * Get cached prompt sections
   */
  public get(
    moduleType: ModuleType,
    promptType?: string,
    pathwayType?: string
  ): any[] | null {
    const key = this.getCacheKey(moduleType, promptType, pathwayType);

    if (!this.isValidCacheEntry(key)) {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
      return null;
    }

    return this.cache.get(key) || null;
  }

  /**
   * Set cached prompt sections
   */
  public set(
    moduleType: ModuleType,
    data: any[],
    promptType?: string,
    pathwayType?: string
  ): void {
    this.cleanupExpiredEntries();
    this.enforceMaxSize();

    const key = this.getCacheKey(moduleType, promptType, pathwayType);
    this.cache.set(key, data);
    this.cacheTimestamps.set(key, Date.now());
  }

  /**
   * Invalidate cache for specific module
   */
  public invalidateModule(moduleType: ModuleType): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(`prompts:${moduleType}:`)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
    }
  }

  /**
   * Clear all cached data
   */
  public clear(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  public getStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    const memoryUsage = JSON.stringify(Array.from(this.cache.entries())).length;

    return {
      size: this.cache.size,
      hitRate: this.hitCount / Math.max(this.totalRequests, 1),
      memoryUsage,
    };
  }

  // Performance tracking
  private hitCount = 0;
  private totalRequests = 0;

  /**
   * Track cache hit for statistics
   */
  public trackHit(): void {
    this.hitCount++;
    this.totalRequests++;
  }

  /**
   * Track cache miss for statistics
   */
  public trackMiss(): void {
    this.totalRequests++;
  }
}

// Export singleton instance
export const promptCache = new PromptCache();
