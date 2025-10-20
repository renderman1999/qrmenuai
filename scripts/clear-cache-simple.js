// Simple script to clear cache using the existing Redis client
const { redis } = require('../src/lib/redis/redis');

async function clearCache() {
  try {
    console.log('🗑️ Clearing Redis cache...');
    
    // Clear all menu caches
    const menuKeys = await redis.keys('menu:*');
    if (menuKeys.length > 0) {
      await redis.del(menuKeys);
      console.log(`🗑️ Cleared ${menuKeys.length} menu cache entries`);
    }
    
    // Clear all restaurant caches  
    const restaurantKeys = await redis.keys('restaurant:*');
    if (restaurantKeys.length > 0) {
      await redis.del(restaurantKeys);
      console.log(`🗑️ Cleared ${restaurantKeys.length} restaurant cache entries`);
    }
    
    console.log('✅ Cache cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  } finally {
    await redis.quit();
    console.log('🔌 Disconnected from Redis');
  }
}

clearCache();
