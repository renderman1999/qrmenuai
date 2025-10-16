import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateMultipleSortOrderSchema = z.object({
  dishes: z.array(z.object({
    id: z.string(),
    sortOrder: z.number().int().min(0)
  }))
})

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { dishes } = updateMultipleSortOrderSchema.parse(body)

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

    // Verifica che tutti i piatti appartengano all'utente
    const dishIds = dishes.map(d => d.id)
    const existingDishes = await prisma.dish.findMany({
      where: {
        id: { in: dishIds }
      },
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

    // Verifica che tutte le categorie esistano e appartengano all'utente
    for (const dish of existingDishes) {
      if (dish.category.menu.restaurant.ownerId !== user.id) {
        return NextResponse.json({ error: 'Non autorizzato per uno o più piatti' }, { status: 403 })
      }
    }

    if (existingDishes.length !== dishes.length) {
      return NextResponse.json({ error: 'Uno o più piatti non trovati' }, { status: 404 })
    }

    // Aggiorna tutte le categorie in una transazione
    const updatePromises = dishes.map(dish =>
      prisma.dish.update({
        where: { id: dish.id },
        data: { sortOrder: dish.sortOrder }
      })
    )

    await prisma.$transaction(updatePromises)

    return NextResponse.json({ message: 'Ordinamento piatti aggiornato con successo' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', details: error.errors }, { status: 400 })
    }

    console.error('Error updating multiple dishes sort order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
