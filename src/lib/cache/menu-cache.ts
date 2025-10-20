import { redis } from '../redis/redis'
import { prisma } from '../db/prisma'

// Cache TTL in seconds
const CACHE_TTL = {
  MENU: 60 * 60, // 1 hour
  RESTAURANT: 24 * 60 * 60, // 24 hours
  DISHES: 30 * 60, // 30 minutes
}

export interface CachedMenu {
  id: string
  name: string
  description: string | null
  isActive: boolean
  availability: any
  restaurant: {
    id: string
    name: string
    description: string | null
    address: string
    phone: string | null
    email: string | null
    website: string | null
    logo: string | null
    coverImage: string | null
  }
  categories: Array<{
    id: string
    name: string
    description: string | null
    sortOrder: number
    dishes: Array<{
      id: string
      name: string
      description: string | null
      price: any
      image: string | null
      isVegetarian: boolean
      isVegan: boolean
      isGlutenFree: boolean
      isSpicy: boolean
      galleryEnabled: boolean
      galleryImages: any
      dishAllergens: Array<{
        allergen: {
          id: string
          name: string
          icon: string
        }
      }>
      dishIngredients: Array<{
        ingredient: {
          id: string
          name: string
        }
      }>
    }>
  }>
}

export interface CachedRestaurant {
  id: string
  name: string
  description: string | null
  address: string
  phone: string | null
  email: string | null
  website: string | null
  logo: string | null
  coverImage: string | null
  isActive: boolean
  licenseTier: string
  menus: Array<{
    id: string
    name: string
    description: string | null
    isActive: boolean
  }>
}

/**
 * Get cached menu data
 */
export async function getCachedMenu(menuId: string): Promise<CachedMenu | null> {
  try {
    const cacheKey = `menu:${menuId}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      console.log(`📦 Cache HIT for menu:${menuId}`)
      return JSON.parse(cached)
    }
    
    console.log(`❌ Cache MISS for menu:${menuId}`)
    return null
  } catch (error) {
    console.error('Error getting cached menu:', error)
    // Return null instead of throwing to allow fallback
    return null
  }
}

/**
 * Set cached menu data
 */
export async function setCachedMenu(menuId: string, menuData: CachedMenu): Promise<void> {
  try {
    const cacheKey = `menu:${menuId}`
    await redis.setex(cacheKey, CACHE_TTL.MENU, JSON.stringify(menuData))
    console.log(`💾 Cached menu:${menuId} for ${CACHE_TTL.MENU}s`)
  } catch (error) {
    console.error('Error caching menu:', error)
    // Don't throw error, just log it
  }
}

/**
 * Get cached restaurant data
 */
export async function getCachedRestaurant(restaurantId: string): Promise<CachedRestaurant | null> {
  try {
    const cacheKey = `restaurant:${restaurantId}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      console.log(`📦 Cache HIT for restaurant:${restaurantId}`)
      return JSON.parse(cached)
    }
    
    console.log(`❌ Cache MISS for restaurant:${restaurantId}`)
    return null
  } catch (error) {
    console.error('Error getting cached restaurant:', error)
    return null
  }
}

/**
 * Set cached restaurant data
 */
export async function setCachedRestaurant(restaurantId: string, restaurantData: CachedRestaurant): Promise<void> {
  try {
    const cacheKey = `restaurant:${restaurantId}`
    await redis.setex(cacheKey, CACHE_TTL.RESTAURANT, JSON.stringify(restaurantData))
    console.log(`💾 Cached restaurant:${restaurantId} for ${CACHE_TTL.RESTAURANT}s`)
  } catch (error) {
    console.error('Error caching restaurant:', error)
    // Don't throw error, just log it
  }
}

/**
 * Get menu data with cache fallback
 */
export async function getMenuWithCache(menuId: string): Promise<CachedMenu | null> {
  try {
    console.log('🔍 Getting menu with cache for:', menuId)
    
    // STEP 1: Try cache first
    console.log('📦 Checking cache...')
    const cached = await getCachedMenu(menuId)
    if (cached) {
      console.log('✅ Cache HIT for menu:', menuId)
      return cached
    }

    console.log('❌ Cache MISS, fetching from database...')
    
    // STEP 2: Fetch from database
    const menu = await getMenuFromDatabase(menuId)
    
    if (!menu) {
      console.log('❌ No menu found in database')
      return null
    }

    console.log('✅ Menu found in database:', menu.name)
    console.log('📊 Categories:', menu.categories?.length || 0)
    if (menu.categories) {
      const totalDishes = menu.categories.reduce((acc: number, cat: any) => acc + (cat.dishes?.length || 0), 0)
      console.log('🍽️ Total dishes:', totalDishes)
    }

    // STEP 3: Cache the result for next time
    try {
      console.log('💾 Caching menu for future requests...')
      await setCachedMenu(menuId, menu as CachedMenu)
      console.log('✅ Menu cached successfully')
    } catch (cacheError) {
      console.error('❌ Failed to cache menu:', cacheError)
    }
    
    return menu as CachedMenu
  } catch (error) {
    console.error('❌ Error getting menu with cache:', error)
    // Fallback to database
    return await getMenuFromDatabase(menuId)
  }
}

async function getMenuFromDatabase(menuId: string) {
  return await prisma.menu.findUnique({
    where: { id: menuId },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          description: true,
          address: true,
          phone: true,
          email: true,
          website: true,
          logo: true,
          coverImage: true
        }
      },
      categories: {
        select: {
          id: true,
          name: true,
          description: true,
          sortOrder: true,
          dishes: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              image: true,
              isVegetarian: true,
              isVegan: true,
              isGlutenFree: true,
              isSpicy: true,
              galleryEnabled: true,
              galleryImages: true,
              dishAllergens: {
                include: {
                  allergen: true
                }
              },
              dishIngredients: {
                include: {
                  ingredient: true
                }
              }
            }
          }
        },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })
}

/**
 * Get restaurant data with cache fallback
 */
export async function getRestaurantWithCache(restaurantId: string): Promise<CachedRestaurant | null> {
  try {
    console.log('🔍 Getting restaurant with cache for:', restaurantId)
    
    // STEP 1: Try cache first
    console.log('📦 Checking cache...')
    const cached = await getCachedRestaurant(restaurantId)
    if (cached) {
      console.log('✅ Cache HIT for restaurant:', restaurantId)
      return cached
    }

    console.log('❌ Cache MISS, fetching from database...')
    
    // STEP 2: Fetch from database
    const restaurant = await getRestaurantFromDatabase(restaurantId)
    
    if (!restaurant) {
      console.log('❌ No restaurant found in database')
      return null
    }

    console.log('✅ Restaurant found in database:', restaurant.name)

    // STEP 3: Cache the result for next time
    try {
      console.log('💾 Caching restaurant for future requests...')
      await setCachedRestaurant(restaurantId, restaurant as CachedRestaurant)
      console.log('✅ Restaurant cached successfully')
    } catch (cacheError) {
      console.error('❌ Failed to cache restaurant:', cacheError)
    }
    
    return restaurant as CachedRestaurant
  } catch (error) {
    console.error('❌ Error getting restaurant with cache:', error)
    // Fallback to database
    return await getRestaurantFromDatabase(restaurantId)
  }
}

async function getRestaurantFromDatabase(restaurantId: string) {
  return await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      menus: {
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true
        }
      }
    }
  })
}

/**
 * Invalidate menu cache
 */
export async function invalidateMenuCache(menuId: string): Promise<void> {
  try {
    const cacheKey = `menu:${menuId}`
    await redis.del(cacheKey)
    console.log(`🗑️ Invalidated cache for menu:${menuId}`)
  } catch (error) {
    console.error('Error invalidating menu cache:', error)
    // Don't throw error, just log it
  }
}

/**
 * Invalidate restaurant cache
 */
export async function invalidateRestaurantCache(restaurantId: string): Promise<void> {
  try {
    const cacheKey = `restaurant:${restaurantId}`
    await redis.del(cacheKey)
    console.log(`🗑️ Invalidated cache for restaurant:${restaurantId}`)
  } catch (error) {
    console.error('Error invalidating restaurant cache:', error)
    // Don't throw error, just log it
  }
}

/**
 * Invalidate all caches for a restaurant (menus, dishes, etc.)
 */
export async function invalidateAllRestaurantCaches(restaurantId: string): Promise<void> {
  try {
    // Get all menu IDs for this restaurant
    const menus = await prisma.menu.findMany({
      where: { restaurantId },
      select: { id: true }
    })

    // Invalidate restaurant cache
    await invalidateRestaurantCache(restaurantId)

    // Invalidate all menu caches
    const pipeline = redis.multi()
    for (const menu of menus) {
      pipeline.del(`menu:${menu.id}`)
    }
    await pipeline.exec()

    console.log(`🗑️ Invalidated all caches for restaurant:${restaurantId}`)
  } catch (error) {
    console.error('Error invalidating all restaurant caches:', error)
  }
}
