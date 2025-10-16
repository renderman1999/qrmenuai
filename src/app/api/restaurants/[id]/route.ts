import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

// Schema per la validazione dell'aggiornamento ristorante
const updateRestaurantSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio'),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  website: z.string().url('URL non valido').optional().or(z.literal('')),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  isActive: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    const userEmail = request.headers.get('x-user-email')
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Email utente non fornita' }, { status: 400 })
    }

    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Trova il ristorante
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Ristorante non trovato' }, { status: 404 })
    }

    if (restaurant.ownerId !== user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    const userEmail = request.headers.get('x-user-email')
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Email utente non fornita' }, { status: 400 })
    }

    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Trova il ristorante e verifica che appartenga all'utente
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    })

    if (!existingRestaurant) {
      return NextResponse.json({ error: 'Ristorante non trovato' }, { status: 404 })
    }

    if (existingRestaurant.ownerId !== user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Parse e valida i dati
    const body = await request.json()
    const validatedData = updateRestaurantSchema.parse(body)

    // Aggiorna il ristorante
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        address: validatedData.address || null,
        phone: validatedData.phone || null,
        email: validatedData.email || null,
        website: validatedData.website || null,
        logo: validatedData.logo || null,
        coverImage: validatedData.coverImage || null,
        isActive: validatedData.isActive ?? true
      }
    })

    return NextResponse.json(updatedRestaurant)
  } catch (error) {
    console.error('Error updating restaurant:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dati non validi',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    const userEmail = request.headers.get('x-user-email')
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Email utente non fornita' }, { status: 400 })
    }

    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Trova il ristorante e verifica che appartenga all'utente
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menus: true
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Ristorante non trovato' }, { status: 404 })
    }

    if (restaurant.ownerId !== user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Elimina il ristorante (cascade eliminerà menu, categorie, piatti e QR codes)
    await prisma.restaurant.delete({
      where: { id: restaurantId }
    })

    return NextResponse.json({ message: 'Ristorante eliminato con successo' })
  } catch (error) {
    console.error('Error deleting restaurant:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
