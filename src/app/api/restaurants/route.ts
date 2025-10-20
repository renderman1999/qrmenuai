import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateRestaurantRequest:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - phone
 *         - email
 *       properties:
 *         name:
 *           type: string
 *           description: Nome del ristorante
 *         description:
 *           type: string
 *           description: Descrizione del ristorante
 *         address:
 *           type: string
 *           description: Indirizzo del ristorante
 *         phone:
 *           type: string
 *           description: Numero di telefono
 *         email:
 *           type: string
 *           format: email
 *           description: Email del ristorante
 */

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Rimuove caratteri speciali
    .replace(/\s+/g, '-') // Sostituisce spazi con trattini
    .replace(/-+/g, '-') // Rimuove trattini multipli
    .trim()
}

const createRestaurantSchema = z.object({
  name: z.string().min(1, 'Nome ristorante richiesto'),
  description: z.string().optional(),
  address: z.string().min(1, 'Indirizzo richiesto'),
  phone: z.string().min(1, 'Telefono richiesto'),
  email: z.string().email('Email non valida'),
})

/**
 * @swagger
 * /api/restaurants:
 *   post:
 *     summary: Crea un nuovo ristorante
 *     description: Crea un nuovo ristorante per l'utente autenticato
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRestaurantRequest'
 *     responses:
 *       200:
 *         description: Ristorante creato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 restaurant:
 *                   $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Dati non validi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Non autorizzato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Utente non trovato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Errore interno del server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, address, phone, email } = createRestaurantSchema.parse(body)

    // Trova l'utente nel database
    const owner = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!owner) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Genera lo slug
    let baseSlug = createSlug(name.trim())
    let slug = baseSlug
    let counter = 1

    // Verifica che lo slug sia unico
    while (await prisma.restaurant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Crea il ristorante
    const restaurant = await prisma.restaurant.create({
      data: {
        name: name.trim(),
        slug: slug,
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

/**
 * @swagger
 * /api/restaurants:
 *   get:
 *     summary: Recupera i ristoranti
 *     description: Recupera i ristoranti dell'utente autenticato o un ristorante specifico
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: false
 *         schema:
 *           type: string
 *         description: ID del ristorante specifico da recuperare
 *     responses:
 *       200:
 *         description: Lista dei ristoranti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 restaurants:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Restaurant'
 *       401:
 *         description: Non autorizzato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Utente o ristorante non trovato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Errore interno del server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Controlla se è richiesto un ristorante specifico
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('id')

    if (restaurantId) {
      // Trova un ristorante specifico
      const restaurant = await prisma.restaurant.findFirst({
        where: {
          id: restaurantId,
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
        }
      })

      if (!restaurant) {
        return NextResponse.json({ error: 'Ristorante non trovato' }, { status: 404 })
      }

      return NextResponse.json({ restaurants: [restaurant] })
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