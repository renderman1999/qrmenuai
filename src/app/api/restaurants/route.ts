import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createRestaurantSchema = z.object({
  name: z.string().min(1, 'Nome ristorante richiesto'),
  description: z.string().optional(),
  address: z.string().min(1, 'Indirizzo richiesto'),
  phone: z.string().min(1, 'Telefono richiesto'),
  email: z.string().email('Email non valida'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, address, phone, email } = createRestaurantSchema.parse(body)

    // Leggi l'email dell'utente dall'header della richiesta
    const userEmail = request.headers.get('x-user-email')
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Email utente non fornita' }, { status: 400 })
    }

    // Trova l'utente nel database
    const owner = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!owner) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Crea il ristorante
    const restaurant = await prisma.restaurant.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        isActive: true,
        licenseTier: 'BASIC', // Default tier
        ownerId: owner.id,
      }
    })

    return NextResponse.json({ restaurant })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', details: error.errors }, { status: 400 })
    }

    console.error('Error creating restaurant:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
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

    // Trova i ristoranti dell'utente
    const restaurants = await prisma.restaurant.findMany({
      where: {
        ownerId: user.id
      },
      include: {
        menus: {
          include: {
            categories: {
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
            },
            qrCodes: {
              where: {
                isActive: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ restaurants })
  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}