import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateGallerySchema = z.object({
  galleryEnabled: z.boolean(),
  galleryImages: z.array(z.object({
    url: z.string(),
    alt: z.string().optional(),
    order: z.number()
  })).optional()
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateGallerySchema.parse(body)

    const userEmail = request.headers.get('x-user-email')
    if (!userEmail) {
      return NextResponse.json({ error: 'Email utente non fornita' }, { status: 400 })
    }

    // Verifica che l'utente esista
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Verifica che il piatto esista e appartenga all'utente
    const dish = await prisma.dish.findUnique({
      where: { id },
      include: {
        menu: {
          include: {
            restaurant: true
          }
        }
      }
    })

    if (!dish) {
      return NextResponse.json({ error: 'Piatto non trovato' }, { status: 404 })
    }

    if (dish.menu.restaurant.ownerId !== user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Aggiorna la galleria
    const updatedDish = await prisma.dish.update({
      where: { id },
      data: {
        galleryEnabled: data.galleryEnabled,
        galleryImages: data.galleryImages || null
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

    return NextResponse.json({ dish: updatedDish })
  } catch (error: any) {
    console.error('Error updating dish gallery:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const dish = await prisma.dish.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        galleryEnabled: true,
        galleryImages: true
      }
    })

    if (!dish) {
      return NextResponse.json({ error: 'Piatto non trovato' }, { status: 404 })
    }

    return NextResponse.json({ dish })
  } catch (error) {
    console.error('Error fetching dish gallery:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
