const { invalidateMenuCache } = require('../src/lib/cache/menu-cache.ts');

async function main() {
  try {
    console.log('🗑️ Invalidating menu cache...');
    await invalidateMenuCache('ristorante1-menu');
    console.log('✅ Cache invalidated successfully');
  } catch (error) {
    console.error('❌ Error invalidating cache:', error);
  }
}

main();
