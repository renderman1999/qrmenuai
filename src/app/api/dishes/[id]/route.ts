import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { invalidateMenuCache, invalidateRestaurantCache } from '@/lib/cache/menu-cache'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const updateDishSchema = z.object({
  name: z.string().min(1, 'Nome piatto richiesto').optional(),
  description: z.string().optional(),
  price: z.number().positive('Prezzo deve essere positivo').optional(),
  categoryId: z.string().optional(),
  allergenIds: z.array(z.string()).optional(),
  ingredientIds: z.array(z.string()).optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  isSpicy: z.boolean().optional(),
  image: z.string().optional().nullable(),
  galleryEnabled: z.boolean().optional(),
  galleryImages: z.array(z.object({
    url: z.string(),
    alt: z.string().optional(),
    order: z.number()
  })).optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    
    console.log('PUT /api/dishes/[id] called')
    console.log('Dish ID:', id)
    console.log('Request body:', body)
    
    const data = updateDishSchema.parse(body)
    
    console.log('Validated data:', data)

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

    // Trova il piatto e verifica che appartenga all'utente
    const dish = await prisma.dish.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            menu: {
              include: {
                restaurant: true
              }
            }
          }
        }
      }
    })

    if (!dish) {
      return NextResponse.json({ error: 'Piatto non trovato' }, { status: 404 })
    }

    if (dish.category.menu.restaurant.ownerId !== user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Aggiorna il piatto con le relazioni
    const updatedDish = await prisma.dish.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price && { price: new Decimal(data.price) }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.isVegetarian !== undefined && { isVegetarian: data.isVegetarian }),
        ...(data.isVegan !== undefined && { isVegan: data.isVegan }),
        ...(data.isGlutenFree !== undefined && { isGlutenFree: data.isGlutenFree }),
        ...(data.isSpicy !== undefined && { isSpicy: data.isSpicy }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.galleryEnabled !== undefined && { galleryEnabled: data.galleryEnabled }),
        ...(data.galleryImages !== undefined && { galleryImages: data.galleryImages }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        // Aggiorna le relazioni per allergeni
        ...(data.allergenIds !== undefined && {
          dishAllergens: {
            deleteMany: {},
            create: data.allergenIds.map(allergenId => ({
              allergenId: allergenId
            }))
          }
        }),
        // Aggiorna le relazioni per ingredienti
        ...(data.ingredientIds !== undefined && {
          dishIngredients: {
            deleteMany: {},
            create: data.ingredientIds.map(ingredientId => ({
              ingredientId: ingredientId
            }))
          }
        })
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
      invalidateMenuCache(dish.category.menuId),
      invalidateRestaurantCache(dish.category.menu.restaurantId)
    ])

    return NextResponse.json({ dish: updatedDish })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
      return NextResponse.json({ 
        error: 'Dati non validi', 
        details: error.errors,
        type: 'validation_error'
      }, { status: 400 })
    }

    console.error('Error updating dish:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      type: 'server_error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userEmail = request.headers.get('x-user-email')

    if (!userEmail) {
      return NextResponse.json({ error: 'Email utente non fornita' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    const dish = await prisma.dish.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            menu: {
              include: {
                restaurant: true
              }
            }
          }
        }
      }
    })

    if (!dish) {
      return NextResponse.json({ error: 'Piatto non trovato' }, { status: 404 })
    }

    if (dish.category.menu.restaurant.ownerId !== user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    await prisma.dish.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Piatto eliminato con successo' })
  } catch (error) {
    console.error('Error deleting dish:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
