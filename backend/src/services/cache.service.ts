/**
 * Simple in-memory cache with per-key TTL.
 * Drop-in replacement for Redis when you don't need persistence or distribution.
 * Default TTL: 20 minutes.
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

const DEFAULT_TTL_MS = 20 * 60 * 1000; // 20 minutes

class MemoryCache {
    private store = new Map<string, CacheEntry<any>>();
    private cleanupInterval: ReturnType<typeof setInterval>;

    constructor() {
        // Sweep expired keys every 5 minutes
        this.cleanupInterval = setInterval(() => this.sweep(), 5 * 60 * 1000);
    }

    /** Get a cached value. Returns undefined if missing or expired. */
    get<T>(key: string): T | undefined {
        const entry = this.store.get(key);
        if (!entry) return undefined;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return undefined;
        }
        return entry.data as T;
    }

    /** Set a value with optional TTL in ms (default 20 min). */
    set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
        this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
    }

    /** Delete a specific key. */
    del(key: string): void {
        this.store.delete(key);
    }

    /** Delete all keys matching a prefix. */
    delPrefix(prefix: string): void {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) this.store.delete(key);
        }
    }

    /** Clear the entire cache. */
    clear(): void {
        this.store.clear();
    }

    /** Remove all expired entries. */
    private sweep(): void {
        const now = Date.now();
        for (const [key, entry] of this.store) {
            if (now > entry.expiresAt) this.store.delete(key);
        }
    }

    /** Get remaining TTL in seconds for a key (for debugging). */
    ttl(key: string): number {
        const entry = this.store.get(key);
        if (!entry) return -1;
        const remaining = Math.max(0, entry.expiresAt - Date.now());
        return Math.round(remaining / 1000);
    }

    /** Get cache stats. */
    stats(): { size: number; keys: string[] } {
        return { size: this.store.size, keys: [...this.store.keys()] };
    }
}

// Singleton instance
export const cache = new MemoryCache();
