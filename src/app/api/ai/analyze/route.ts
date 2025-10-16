import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { analyzeDish } from '@/lib/ai/openai'
import { redis } from '@/lib/redis/redis'
import { z } from 'zod'

const analyzeSchema = z.object({
  dishId: z.string().min(1),
  description: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { dishId, description } = analyzeSchema.parse(body)

    // Verify dish ownership
    const dish = await prisma.dish.findFirst({
      where: {
        id: dishId,
        menu: {
          restaurant: {
            ownerId: session.user.id
          }
        }
      }
    })

    if (!dish) {
      return NextResponse.json({ error: 'Dish not found or access denied' }, { status: 404 })
    }

    // Check cache first
    const cacheKey = `ai_analysis_${dishId}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return NextResponse.json(JSON.parse(cached))
    }

    // Analyze with AI
    const analysis = await analyzeDish(description)

    // Update dish with AI analysis
    const updatedDish = await prisma.dish.update({
      where: { id: dishId },
      data: {
        aiAnalyzed: true,
        aiAllergens: analysis.allergens,
        aiIngredients: analysis.ingredients,
        isVegetarian: analysis.isVegetarian,
        isVegan: analysis.isVegan,
        isGlutenFree: analysis.isGlutenFree,
        isSpicy: analysis.isSpicy,
        allergens: analysis.allergens,
        ingredients: analysis.ingredients,
      },
      include: {
        category: true,
        menu: {
          include: {
            restaurant: true
          }
        }
      }
    })

    // Cache the result for 7 days
    await redis.setex(cacheKey, 7 * 24 * 60 * 60, JSON.stringify(analysis))

    return NextResponse.json({
      dish: updatedDish,
      analysis
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    
    console.error('Error analyzing dish:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
