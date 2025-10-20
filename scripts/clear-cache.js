const { createClient } = require('redis');

async function clearCache() {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  try {
    await client.connect();
    console.log('🔗 Connected to Redis');
    
    // Clear all menu caches
    const menuKeys = await client.keys('menu:*');
    if (menuKeys.length > 0) {
      await client.del(menuKeys);
      console.log(`🗑️ Cleared ${menuKeys.length} menu cache entries`);
    }
    
    // Clear all restaurant caches
    const restaurantKeys = await client.keys('restaurant:*');
    if (restaurantKeys.length > 0) {
      await client.del(restaurantKeys);
      console.log(`🗑️ Cleared ${restaurantKeys.length} restaurant cache entries`);
    }
    
    console.log('✅ Cache cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  } finally {
    await client.disconnect();
    console.log('🔌 Disconnected from Redis');
  }
}

clearCache();
