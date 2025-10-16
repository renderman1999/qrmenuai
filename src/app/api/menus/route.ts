import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createMenuSchema = z.object({
  name: z.string().min(1, 'Nome menu richiesto'),
  description: z.string().optional(),
  restaurantId: z.string().min(1, 'Restaurant ID richiesto'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, restaurantId } = createMenuSchema.parse(body)

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

    // Verifica che il ristorante esista e appartenga all'utente
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Ristorante non trovato' }, { status: 404 })
    }

    if (restaurant.ownerId !== user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Crea il menu
    const menu = await prisma.menu.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: true,
        restaurantId: restaurantId,
      }
    })

    // Crea automaticamente un QR Code per il menu
    const qrCode = await prisma.qRCode.create({
      data: {
        code: `QR${Date.now()}`, // Codice unico basato su timestamp
        menuId: menu.id,
        restaurantId: restaurantId,
        isActive: true,
      }
    })

    return NextResponse.json({ 
      menu: {
        ...menu,
        qrCode: qrCode.code
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', details: error.errors }, { status: 400 })
    }

    console.error('Error creating menu:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID richiesto' }, { status: 400 })
    }

    const menus = await prisma.menu.findMany({
      where: {
        restaurantId: restaurantId
      },
      include: {
        categories: {
          include: {
            dishes: true
          }
        },
        qrCodes: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ menus })
  } catch (error) {
    console.error('Error fetching menus:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}