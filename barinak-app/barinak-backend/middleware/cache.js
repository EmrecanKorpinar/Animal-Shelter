const { redisClient } = require('../config');

let cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  errors: 0
};

const cacheMiddleware = (keyGenerator, ttl = 300) => {
  return async (req, res, next) => {
    try {
      const cacheKey = typeof keyGenerator === 'function' ? keyGenerator(req) : keyGenerator;

      // Önce cache'den veriyi kontrol et
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        cacheStats.hits++;
        console.log(`Cache hit for key: ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }

      // Cache'de yoksa, orijinal veriyi al ve cache'e kaydet
      cacheStats.misses++;
      console.log(`Cache miss for key: ${cacheKey}`);

      // Response'u intercept etmek için
      const originalSend = res.json;
      res.json = function(data) {
        // Sadece başarılı response'ları cache'e
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setex(cacheKey, ttl, JSON.stringify(data));
          cacheStats.sets++;
          console.log(`Cached data for key: ${cacheKey}, TTL: ${ttl}s`);
        }
        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      cacheStats.errors++;
      console.error('Cache middleware error:', error);
      // Redis hatası durumunda normal flow'a devam et
      next();
    }
  };
};

const invalidateCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Invalidated cache keys: ${keys.join(', ')}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

// Cache statistics
const getCacheStats = () => {
  const total = cacheStats.hits + cacheStats.misses;
  const hitRate = total > 0 ? (cacheStats.hits / total * 100).toFixed(2) : 0;

  return {
    ...cacheStats,
    hitRate: `${hitRate}%`,
    totalRequests: total
  };
};

// Cache'i temizle ve stats'ı sıfırla
const clearCacheStats = () => {
  cacheStats = { hits: 0, misses: 0, sets: 0, errors: 0 };
};

// Cache warming - sık kullanılan verileri önceden cache'e yükle
const warmCache = async () => {
  try {
    const Animal = require('../models/animalModel');
    const animals = await Animal.getAll();
    const cacheKey = 'animals:list';

    await redisClient.setex(cacheKey, 300, JSON.stringify(animals));
    console.log(`Cache warmed for key: ${cacheKey}`);
  } catch (error) {
    console.error('Cache warming error:', error);
  }
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  getCacheStats,
  clearCacheStats,
  warmCache
};
