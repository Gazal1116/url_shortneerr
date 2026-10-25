/**
 * Simple in-memory LRU-ish cache for hot code → URL lookups.
 * Swap for Redis (Upstash) in production for multi-instance deployments.
 */
class MemoryCache {
  constructor({ maxSize = 5000, ttlMs = 5 * 60 * 1000 } = {}) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.map = new Map();
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    // refresh LRU order
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    if (this.map.size > this.maxSize) {
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest);
    }
  }

  delete(key) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }
}

const urlCache = new MemoryCache();

module.exports = { urlCache, MemoryCache };
