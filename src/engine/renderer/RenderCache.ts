interface CachedRender {
  canvas: OffscreenCanvas;
  context: OffscreenCanvasRenderingContext2D;
  timestamp: number;
  hitCount: number;
}

/**
 * Cache for rendered UI elements
 * Stores pre-rendered canvases to avoid re-rendering static content every frame
 */
class RenderCache {
  private cache = new Map<string, CachedRender>();
  private readonly maxCacheSize = 100;
  private readonly maxAge = 5000; // 5 seconds

  /**
   * Get a cached render if available and valid
   */
  get(key: string): OffscreenCanvas | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Update hit count for LRU tracking
    cached.hitCount++;
    cached.timestamp = performance.now();

    return cached.canvas;
  }

  /**
   * Store a rendered canvas in the cache
   * Creates a permanent canvas copy (not from the pool)
   */
  set(
    key: string,
    sourceCanvas: OffscreenCanvas | HTMLCanvasElement,
    width: number,
    height: number
  ): void {
    // Evict old entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU();
    }

    // Create a permanent canvas for long-term storage
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to create cache canvas context');
    }

    context.imageSmoothingEnabled = false;
    context.drawImage(sourceCanvas, 0, 0);

    this.cache.set(key, {
      canvas,
      context,
      timestamp: performance.now(),
      hitCount: 0,
    });
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cached renders
   * Note: Cached canvases are permanent allocations and will be GC'd when cleared
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    let lowestHits = Infinity;

    for (const [key, cached] of this.cache) {
      // Prioritize entries with low hit count and old timestamp
      const age = performance.now() - cached.timestamp;

      if (age > this.maxAge) {
        // Evict old entries immediately
        this.cache.delete(key);
        return;
      }

      // LRU with hit count weighting
      const score = age / (cached.hitCount + 1);
      if (score > oldestTime / (lowestHits + 1)) {
        oldestKey = key;
        oldestTime = age;
        lowestHits = cached.hitCount;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Generate cache key for an element
   * Includes identifying information that would affect rendering
   */
  static generateKey(
    elementId: string,
    width: number,
    height: number,
    ...additionalProps: (string | number | boolean)[]
  ): string {
    return `${elementId}:${width}x${height}:${additionalProps.join(':')}`;
  }

  /**
   * Render content and cache the result
   * Uses a temporary pooled canvas for rendering, then copies to permanent cache storage
   *
   * @param key Cache key
   * @param width Canvas width
   * @param height Canvas height
   * @param renderFn Function that renders content to the provided context
   * @param pooledCanvas Optional pre-rendered pooled canvas to cache directly
   * @returns Cached canvas (permanent, not pooled)
   */
  renderAndCache(
    key: string,
    width: number,
    height: number,
    pooledCanvas: OffscreenCanvas
  ): OffscreenCanvas {
    // Check if we have a cached version
    const cached = this.get(key);
    if (cached) {
      return cached;
    }

    // Store the pooled canvas content (creates permanent copy)
    this.set(key, pooledCanvas, width, height);

    // Return the newly cached canvas
    const newCached = this.cache.get(key);
    if (!newCached) {
      throw new Error('Failed to retrieve newly cached canvas');
    }

    return newCached.canvas;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    totalHits: number;
    averageAge: number;
  } {
    let totalHits = 0;
    let totalAge = 0;
    const now = performance.now();

    for (const cached of this.cache.values()) {
      totalHits += cached.hitCount;
      totalAge += now - cached.timestamp;
    }

    return {
      size: this.cache.size,
      totalHits,
      averageAge: this.cache.size > 0 ? totalAge / this.cache.size : 0,
    };
  }
}

// Global singleton instance
export const globalRenderCache = new RenderCache();
