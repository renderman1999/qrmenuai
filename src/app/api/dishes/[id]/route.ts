import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { invalidateMenuCache, invalidateRestaurantCache } from '@/lib/cache/menu-cache'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const updateDishSchema = z.object({
  name: z.string().min(1, 'Nome piatto richiesto').optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive('Prezzo deve essere positivo').optional(),
  categoryId: z.string().optional(),
  allergenIds: z.array(z.string()).optional(),
  ingredientIds: z.array(z.string()).optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  isSpicy: z.boolean().optional(),
  image: z.string().nullable().optional(),
  galleryEnabled: z.boolean().optional(),
  galleryImages: z.array(z.object({
    url: z.string(),
    alt: z.string().optional(),
    order: z.number()
  })).optional(),
  isActive: z.boolean().optional(),
  additionalInfo: z.object({
    sections: z.array(z.object({
      id: z.string(),
      type: z.enum(['text', 'video', 'youtube']),
      title: z.string(),
      content: z.string(),
      videoFile: z.string().optional(),
      youtubeId: z.string().optional(),
      order: z.number()
    }))
  }).optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    
    console.log('PUT /api/dishes/[id] called')
    console.log('Dish ID:', id)
    console.log('Request body:', body)
    
    let data
    try {
      data = updateDishSchema.parse(body)
      console.log('Validated data:', data)
      console.log('Validation successful')
    } catch (validationError) {
      console.error('Validation error details:', validationError)
      if (validationError instanceof z.ZodError) {
        console.error('Zod validation errors:', validationError.issues)
        return NextResponse.json({ 
          error: 'Dati non validi', 
          details: validationError.issues,
          type: 'validation_error'
        }, { status: 400 })
      }
      throw validationError
    }

    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Trova l'utente nel database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
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

    // Aggiorna il piatto
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
        ...(data.additionalInfo !== undefined && { additionalInfo: data.additionalInfo })
      }
    })

    // Gestisci le relazioni separatamente se necessario
    if (data.allergenIds !== undefined) {
      // Rimuovi tutte le relazioni esistenti
      await prisma.dishAllergen.deleteMany({
        where: { dishId: id }
      })
      
      // Rimuovi duplicati e crea le nuove relazioni solo se ci sono allergeni
      const uniqueAllergenIds = [...new Set(data.allergenIds)]
      if (uniqueAllergenIds.length > 0) {
        await prisma.dishAllergen.createMany({
          data: uniqueAllergenIds.map(allergenId => ({
            dishId: id,
            allergenId: allergenId
          }))
        })
      }
    }

    if (data.ingredientIds !== undefined) {
      // Rimuovi tutte le relazioni esistenti
      await prisma.dishIngredient.deleteMany({
        where: { dishId: id }
      })
      
      // Rimuovi duplicati e crea le nuove relazioni solo se ci sono ingredienti
      const uniqueIngredientIds = [...new Set(data.ingredientIds)]
      if (uniqueIngredientIds.length > 0) {
        await prisma.dishIngredient.createMany({
          data: uniqueIngredientIds.map(ingredientId => ({
            dishId: id,
            ingredientId: ingredientId
          }))
        })
      }
    }

    // Recupera il piatto aggiornato con le relazioni
    const finalDish = await prisma.dish.findUnique({
      where: { id },
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

    return NextResponse.json({ dish: finalDish })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues)
      return NextResponse.json({ 
        error: 'Dati non validi', 
        details: error.issues,
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
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
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
