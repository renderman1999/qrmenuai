import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome categoria richiesto'),
  description: z.string().optional(),
  menuId: z.string().min(1, 'Menu ID richiesto'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, menuId } = createCategorySchema.parse(body)

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

    // Verifica che il menu appartenga all'utente
    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        restaurant: true
      }
    })

    if (!menu) {
      return NextResponse.json({ error: 'Menu non trovato' }, { status: 404 })
    }

    if (menu.restaurant.ownerId !== user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Verifica che la categoria non esista già per questo menu
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: name,
        menuId: menuId
      }
    })

    if (existingCategory) {
      return NextResponse.json({ 
        error: 'Una categoria con questo nome esiste già per questo menu' 
      }, { status: 400 })
    }

    // Crea la categoria
    const category = await prisma.category.create({
      data: {
        name: name,
        description: description || null,
        menuId: menuId,
        sortOrder: 0, // Per ora mettiamo 0, in futuro possiamo calcolare l'ordine
        isActive: true,
      },
      include: {
        dishes: true
      }
    })

    return NextResponse.json({ category })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', details: error.errors }, { status: 400 })
    }

    console.error('Error creating category:', error)
    console.error('Error details:', {
      name: name || 'undefined',
      description: description || 'undefined',
      menuId: menuId || 'undefined',
      error: error.message,
      stack: error.stack
    })
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const menuId = searchParams.get('menuId')

    if (!menuId) {
      return NextResponse.json({ error: 'Menu ID richiesto' }, { status: 400 })
    }

    const categories = await prisma.category.findMany({
      where: {
        menuId: menuId
      },
      include: {
        dishes: {
          orderBy: {
            sortOrder: 'asc'
          }
        }
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}