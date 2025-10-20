import { NextRequest, NextResponse } from 'next/server'
import { chatWithAI } from '@/lib/ai/ai-service'
import { getMenuWithCache, getRestaurantWithCache } from '@/lib/cache/menu-cache'
import { z } from 'zod'

const chatSchema = z.object({
  message: z.string().min(1),
  restaurantId: z.string().optional(),
  menuId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, restaurantId, menuId } = chatSchema.parse(body)

    // Get restaurant and menu context with cache (with fallback)
    let context: any = {}
    
    try {
      if (restaurantId) {
        console.log('🔍 Fetching restaurant data for:', restaurantId)
        const restaurant = await getRestaurantWithCache(restaurantId)
        context.restaurant = restaurant
        console.log('✅ Restaurant data loaded:', restaurant ? 'YES' : 'NO')
      }

      if (menuId) {
        console.log('🔍 Fetching menu data for:', menuId)
        const menu = await getMenuWithCache(menuId)
        context.menu = menu
        console.log('✅ Menu data loaded:', menu ? 'YES' : 'NO')
        if (menu && menu.categories) {
          console.log('📊 Menu has', menu.categories.length, 'categories')
          const totalDishes = menu.categories.reduce((acc: number, cat: any) => acc + (cat.dishes?.length || 0), 0)
          console.log('🍽️ Total dishes in menu:', totalDishes)
        }
      }
    } catch (cacheError) {
      console.error('❌ Cache error (continuing without cache):', cacheError)
      // Continue without cache if Redis fails
    }

    // Debug: Log context data
    console.log('📊 Context data received:')
    console.log('- Restaurant:', context.restaurant ? 'YES' : 'NO')
    console.log('- Menu:', context.menu ? 'YES' : 'NO')
    if (context.menu) {
      console.log('- Menu name:', context.menu.name)
      console.log('- Categories:', context.menu.categories?.length || 0)
      if (context.menu.categories) {
        const totalDishes = context.menu.categories.reduce((acc: number, cat: any) => acc + (cat.dishes?.length || 0), 0)
        console.log('- Total dishes:', totalDishes)
      }
    }

    // Get AI response
    const aiResponse = await chatWithAI(message, context)

    return NextResponse.json({ 
      response: aiResponse.response,
      mentionedDishes: aiResponse.mentionedDishes || []
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    
    console.error('Error in AI chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
