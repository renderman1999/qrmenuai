import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const whereClause = {
      isActive: true,
      ...(category && { category })
    }

    const ingredients = await prisma.ingredient.findMany({
      where: whereClause,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    // Raggruppa per categoria
    const groupedIngredients = ingredients.reduce((acc, ingredient) => {
      const cat = ingredient.category || 'Altro'
      if (!acc[cat]) {
        acc[cat] = []
      }
      acc[cat].push(ingredient)
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({ 
      ingredients,
      groupedIngredients 
    })
  } catch (error) {
    console.error('Error fetching ingredients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
