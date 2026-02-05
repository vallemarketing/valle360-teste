/**
 * Short-Term Memory (Redis)
 * Cache para contexto durante execução de crews (minutos/horas)
 * Redis é OPCIONAL - funciona sem ele (usando cache em memória como fallback)
 */

import Redis from 'ioredis';

// Lazy-load Redis connection - só conecta quando usado
let redis: Redis | null = null;
let redisConnectionAttempted = false;

// Fallback: cache em memória quando Redis não está disponível
const memoryCache = new Map<string, { value: string; expires: number }>();

function getRedis(): Redis | null {
  // Durante build time ou SSG, não tenta conectar
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
    return null;
  }
  
  if (redis) return redis;
  if (redisConnectionAttempted) return null;
  
  redisConnectionAttempted = true;
  
  // Só conecta se REDIS_URL estiver definido ou em desenvolvimento
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl && process.env.NODE_ENV === 'production') {
    console.log('[Redis] REDIS_URL not configured, using memory cache fallback');
    return null;
  }
  
  try {
    redis = new Redis(redisUrl || 'redis://localhost:6379', {
      retryStrategy: (times) => {
        if (times > 3) {
          console.log('[Redis] Max retries reached, using memory cache fallback');
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      },
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('[Redis] Error:', err.message);
      // Don't throw, just log
    });

    redis.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });
    
    return redis;
  } catch (error) {
    console.error('[Redis] Failed to initialize:', error);
    return null;
  }
}

export interface MemoryContext {
  [key: string]: any;
}

/**
 * Short-Term Memory Service
 * Armazena contexto temporário de agentes e crews no Redis
 */
export const shortTermMemory = {
  /**
   * Set a value in memory with TTL
   */
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    const serialized = JSON.stringify(value);
    const redisClient = getRedis();
    
    if (redisClient) {
      try {
        await redisClient.setex(key, ttl, serialized);
        return;
      } catch (error) {
        console.warn(`[ShortTermMemory] Redis error, using memory fallback:`, error);
      }
    }
    
    // Fallback: use memory cache
    memoryCache.set(key, { 
      value: serialized, 
      expires: Date.now() + (ttl * 1000) 
    });
  },
  
  /**
   * Get a value from memory
   */
  async get<T = any>(key: string): Promise<T | null> {
    const redisClient = getRedis();
    
    if (redisClient) {
      try {
        const data = await redisClient.get(key);
        if (!data) return null;
        return JSON.parse(data) as T;
      } catch (error) {
        console.warn(`[ShortTermMemory] Redis error, using memory fallback:`, error);
      }
    }
    
    // Fallback: use memory cache
    const cached = memoryCache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expires) {
      memoryCache.delete(key);
      return null;
    }
    
    try {
      const data = cached.value;
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`[ShortTermMemory] Error getting ${key}:`, error);
      return null;
    }
  },
  
  /**
   * Append to existing value (merge objects or concat arrays)
   */
  async append(key: string, newData: any): Promise<void> {
    try {
      const existing = await this.get(key);
      if (!existing) {
        await this.set(key, newData);
        return;
      }
      
      let updated: any;
      if (Array.isArray(existing) && Array.isArray(newData)) {
        updated = [...existing, ...newData];
      } else if (typeof existing === 'object' && typeof newData === 'object') {
        updated = { ...existing, ...newData };
      } else {
        updated = newData;
      }
      
      // Preserve remaining TTL
      const redisClient = getRedis();
      const ttl = redisClient ? await redisClient.ttl(key) : 3600;
      await this.set(key, updated, ttl > 0 ? ttl : 3600);
    } catch (error) {
      console.error(`[ShortTermMemory] Error appending to ${key}:`, error);
      // Don't throw, just log
    }
  },
  
  /**
   * Delete a key
   */
  async delete(key: string): Promise<void> {
    const redisClient = getRedis();
    if (redisClient) {
      try {
        await redisClient.del(key);
      } catch (error) {
        console.error(`[ShortTermMemory] Error deleting ${key}:`, error);
      }
    }
    // Always delete from memory cache too
    memoryCache.delete(key);
  },
  
  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const redisClient = getRedis();
    if (redisClient) {
      try {
        const result = await redisClient.exists(key);
        return result === 1;
      } catch (error) {
        console.error(`[ShortTermMemory] Error checking existence of ${key}:`, error);
      }
    }
    // Fallback to memory cache
    const cached = memoryCache.get(key);
    return cached ? Date.now() <= cached.expires : false;
  },
  
  /**
   * Get TTL of a key
   */
  async ttl(key: string): Promise<number> {
    const redisClient = getRedis();
    if (redisClient) {
      try {
        return await redisClient.ttl(key);
      } catch (error) {
        console.error(`[ShortTermMemory] Error getting TTL of ${key}:`, error);
      }
    }
    // Fallback to memory cache
    const cached = memoryCache.get(key);
    if (!cached) return -1;
    return Math.floor((cached.expires - Date.now()) / 1000);
  },
  
  /**
   * Get all keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    const redisClient = getRedis();
    if (redisClient) {
      try {
        return await redisClient.keys(pattern);
      } catch (error) {
        console.error(`[ShortTermMemory] Error getting keys for pattern ${pattern}:`, error);
      }
    }
    // Fallback: return matching keys from memory cache
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(memoryCache.keys()).filter(k => regex.test(k));
  },
  
  /**
   * Get multiple values at once
   */
  async mget(keys: string[]): Promise<(any | null)[]> {
    const redisClient = getRedis();
    if (redisClient) {
      try {
        const values = await redisClient.mget(...keys);
        return values.map(v => v ? JSON.parse(v) : null);
      } catch (error) {
        console.error('[ShortTermMemory] Error getting multiple keys:', error);
      }
    }
    // Fallback to memory cache
    return keys.map(key => {
      const cached = memoryCache.get(key);
      if (!cached || Date.now() > cached.expires) return null;
      try { return JSON.parse(cached.value); } catch { return null; }
    });
  },
  
  /**
   * Increment a counter
   */
  async increment(key: string, by: number = 1): Promise<number> {
    const redisClient = getRedis();
    if (redisClient) {
      try {
        return await redisClient.incrby(key, by);
      } catch (error) {
        console.error(`[ShortTermMemory] Error incrementing ${key}:`, error);
      }
    }
    // Fallback: increment in memory
    const cached = memoryCache.get(key);
    const current = cached ? parseInt(cached.value, 10) || 0 : 0;
    const newVal = current + by;
    memoryCache.set(key, { value: String(newVal), expires: Date.now() + 3600000 });
    return newVal;
  },
  
  /**
   * Set with expiration at specific timestamp
   */
  async setAt(key: string, value: any, expiresAt: Date): Promise<void> {
    const serialized = JSON.stringify(value);
    const expiresInSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    if (expiresInSeconds <= 0) {
      console.warn('Expiration time must be in the future');
      return;
    }
    
    const redisClient = getRedis();
    if (redisClient) {
      try {
        await redisClient.setex(key, expiresInSeconds, serialized);
        return;
      } catch (error) {
        console.error(`[ShortTermMemory] Error setting ${key} with expiration:`, error);
      }
    }
    // Fallback to memory cache
    memoryCache.set(key, { value: serialized, expires: expiresAt.getTime() });
  },
  
  /**
   * Clear all keys matching pattern
   */
  async clear(pattern: string = '*'): Promise<number> {
    let count = 0;
    const redisClient = getRedis();
    if (redisClient) {
      try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          count = await redisClient.del(...keys);
        }
      } catch (error) {
        console.error(`[ShortTermMemory] Error clearing pattern ${pattern}:`, error);
      }
    }
    // Also clear from memory cache
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
        count++;
      }
    }
    return count;
  },
  
  /**
   * Get memory stats
   */
  async stats(): Promise<any> {
    const redisClient = getRedis();
    if (redisClient) {
      try {
        const info = await redisClient.info('memory');
        return info;
      } catch (error) {
        console.error('[ShortTermMemory] Error getting stats:', error);
      }
    }
    // Fallback: return memory cache stats
    return {
      source: 'memory-cache',
      keys: memoryCache.size,
      approximateSize: Array.from(memoryCache.values()).reduce((acc, v) => acc + v.value.length, 0),
    };
  },
};

// Helper functions for specific use cases

/**
 * Agent Memory helpers
 */
export const agentMemory = {
  async save(agentId: string, context: any, ttl: number = 3600) {
    await shortTermMemory.set(`agent:${agentId}:context`, context, ttl);
  },
  
  async load(agentId: string) {
    return await shortTermMemory.get(`agent:${agentId}:context`);
  },
  
  async update(agentId: string, updates: any) {
    await shortTermMemory.append(`agent:${agentId}:context`, updates);
  },
  
  async clear(agentId: string) {
    await shortTermMemory.delete(`agent:${agentId}:context`);
  },
};

/**
 * Crew Memory helpers
 */
export const crewMemory = {
  async save(crewId: string, context: any, ttl: number = 3600) {
    await shortTermMemory.set(`crew:${crewId}:context`, context, ttl);
  },
  
  async load(crewId: string) {
    return await shortTermMemory.get(`crew:${crewId}:context`);
  },
  
  async update(crewId: string, updates: any) {
    await shortTermMemory.append(`crew:${crewId}:context`, updates);
  },
  
  async clear(crewId: string) {
    await shortTermMemory.delete(`crew:${crewId}:context`);
  },
};

/**
 * Session Memory helpers (for user sessions)
 */
export const sessionMemory = {
  async save(sessionId: string, data: any, ttl: number = 1800) {
    await shortTermMemory.set(`session:${sessionId}`, data, ttl);
  },
  
  async load(sessionId: string) {
    return await shortTermMemory.get(`session:${sessionId}`);
  },
  
  async extend(sessionId: string, additionalTtl: number = 1800) {
    const existing = await this.load(sessionId);
    if (existing) {
      await this.save(sessionId, existing, additionalTtl);
    }
  },
  
  async clear(sessionId: string) {
    await shortTermMemory.delete(`session:${sessionId}`);
  },
};

export default shortTermMemory;
