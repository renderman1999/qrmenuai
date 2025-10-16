import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { invalidateMenuCache, invalidateRestaurantCache } from '@/lib/cache/menu-cache'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createDishSchema = z.object({
  name: z.string().min(1, 'Nome piatto richiesto'),
  description: z.string().optional().nullable(),
  price: z.number().positive('Prezzo deve essere positivo'),
  categoryId: z.string().min(1, 'Category ID richiesto'),
  allergenIds: z.array(z.string()).default([]),
  ingredientIds: z.array(z.string()).default([]),
  isVegetarian: z.boolean().optional().default(false),
  isVegan: z.boolean().optional().default(false),
  isGlutenFree: z.boolean().optional().default(false),
  isSpicy: z.boolean().optional().default(false),
  image: z.string().optional().nullable(),
  galleryEnabled: z.boolean().optional().default(false),
  galleryImages: z.array(z.object({
    url: z.string(),
    alt: z.string().optional(),
    order: z.number()
  })).optional(),
})

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/dishes called')
    console.log('Request URL:', request.url)
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    
    const body = await request.json()
    console.log('Received dish data:', body)
    
    const data = createDishSchema.parse(body)
    console.log('Validated dish data:', data)

    // Leggi l'email dell'utente dall'header della richiesta
    const userEmail = request.headers.get('x-user-email')

    if (!userEmail) {
      return NextResponse.json({ error: 'Email utente non fornita' }, { status: 400 })
    }

    // Trova l'utente nel database
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Verifica che la categoria appartenga all'utente
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
      include: {
        menu: {
          include: {
            restaurant: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Categoria non trovata' }, { status: 404 })
    }

    if (category.menu.restaurant.ownerId !== user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Validare che gli ID esistano prima di creare le relazioni
    const validAllergenIds = data.allergenIds.length > 0 
      ? await prisma.allergen.findMany({
          where: { id: { in: data.allergenIds } },
          select: { id: true }
        }).then(results => results.map(r => r.id))
      : []

    const validIngredientIds = data.ingredientIds.length > 0
      ? await prisma.ingredient.findMany({
          where: { id: { in: data.ingredientIds } },
          select: { id: true }
        }).then(results => results.map(r => r.id))
      : []

    console.log('Valid allergen IDs:', validAllergenIds)
    console.log('Valid ingredient IDs:', validIngredientIds)

    // Crea il piatto con le relazioni
    const dish = await prisma.dish.create({
      data: {
        name: data.name,
        description: data.description || null,
        price: new Decimal(data.price),
        menuId: category.menu.id,
        categoryId: data.categoryId,
        isVegetarian: data.isVegetarian,
        isVegan: data.isVegan,
        isGlutenFree: data.isGlutenFree,
        isSpicy: data.isSpicy,
        image: data.image || null,
        galleryEnabled: data.galleryEnabled || false,
        galleryImages: data.galleryImages || null,
        sortOrder: 0,
        isActive: true,
        // Crea le relazioni solo con ID validati
        dishAllergens: {
          create: validAllergenIds.map(id => ({ allergenId: id }))
        },
        dishIngredients: {
          create: validIngredientIds.map(id => ({ ingredientId: id }))
        }
      },
      include: {
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
    })

    // Invalida la cache del menu e del ristorante
    await Promise.all([
      invalidateMenuCache(category.menu.id),
      invalidateRestaurantCache(category.menu.restaurantId)
    ])

    return NextResponse.json({ dish })
  } catch (error: any) {
    console.log('Error caught in POST /api/dishes:', error)
    console.log('Error type:', typeof error)
    console.log('Error constructor:', error.constructor.name)
    
    if (error instanceof z.ZodError) {
      console.log('Validation errors:', error.errors)
      return NextResponse.json({ error: 'Dati non validi', details: error.errors }, { status: 400 })
    }

    console.error('Error creating dish:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    // Assicurati di restituire sempre una risposta JSON valida
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message || 'Unknown error',
      type: error.constructor.name 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID richiesto' }, { status: 400 })
    }

    const dishes = await prisma.dish.findMany({
      where: {
        categoryId: categoryId,
        isActive: true
      },
      include: {
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
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    return NextResponse.json({ dishes })
  } catch (error) {
    console.error('Error fetching dishes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}