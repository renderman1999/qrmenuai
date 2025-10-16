import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateSortOrderSchema = z.object({
  categoryId: z.string().min(1, 'Category ID richiesto'),
  newSortOrder: z.number().int().min(0, 'Sort order deve essere un numero positivo'),
})

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { categoryId, newSortOrder } = updateSortOrderSchema.parse(body)

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

    // Trova la categoria e verifica che appartenga all'utente
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
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

    // Aggiorna il sortOrder della categoria
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        sortOrder: newSortOrder
      },
      include: {
        dishes: true
      }
    })

    return NextResponse.json({ category: updatedCategory })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', details: error.errors }, { status: 400 })
    }

    console.error('Error updating category sort order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// API per aggiornare l'ordinamento di multiple categorie
const updateMultipleSortOrderSchema = z.object({
  categories: z.array(z.object({
    id: z.string(),
    sortOrder: z.number().int().min(0)
  }))
})

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { categories } = updateMultipleSortOrderSchema.parse(body)

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

    // Verifica che tutte le categorie appartengano all'utente
    const categoryIds = categories.map(c => c.id)
    const existingCategories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds }
      },
      include: {
        menu: {
          include: {
            restaurant: true
          }
        }
      }
    })

    // Verifica che tutte le categorie esistano e appartengano all'utente
    for (const category of existingCategories) {
      if (category.menu.restaurant.ownerId !== user.id) {
        return NextResponse.json({ error: 'Non autorizzato per una o più categorie' }, { status: 403 })
      }
    }

    if (existingCategories.length !== categories.length) {
      return NextResponse.json({ error: 'Una o più categorie non trovate' }, { status: 404 })
    }

    // Aggiorna tutte le categorie in una transazione
    const updatePromises = categories.map(category =>
      prisma.category.update({
        where: { id: category.id },
        data: { sortOrder: category.sortOrder }
      })
    )

    await prisma.$transaction(updatePromises)

    return NextResponse.json({ message: 'Ordinamento categorie aggiornato con successo' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', details: error.errors }, { status: 400 })
    }

    console.error('Error updating multiple categories sort order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
