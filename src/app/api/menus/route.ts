import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateMenuRequest:
 *       type: object
 *       required:
 *         - name
 *         - restaurantId
 *       properties:
 *         name:
 *           type: string
 *           description: Nome del menu
 *         description:
 *           type: string
 *           description: Descrizione del menu
 *         restaurantId:
 *           type: string
 *           description: ID del ristorante
 *     Menu:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         isActive:
 *           type: boolean
 *         restaurantId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         qrCode:
 *           type: string
 *           description: Codice QR generato automaticamente
 */

const createMenuSchema = z.object({
  name: z.string().min(1, 'Nome menu richiesto'),
  description: z.string().optional(),
  restaurantId: z.string().min(1, 'Restaurant ID richiesto'),
})

/**
 * @swagger
 * /api/menus:
 *   post:
 *     summary: Crea un nuovo menu
 *     description: Crea un nuovo menu per un ristorante e genera automaticamente un QR code
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMenuRequest'
 *     responses:
 *       200:
 *         description: Menu creato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 menu:
 *                   $ref: '#/components/schemas/Menu'
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
 *       403:
 *         description: Non autorizzato per questo ristorante
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
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, restaurantId } = createMenuSchema.parse(body)

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

/**
 * @swagger
 * /api/menus:
 *   get:
 *     summary: Recupera i menu di un ristorante
 *     description: Recupera tutti i menu di un ristorante specifico
 *     tags: [Menus]
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del ristorante
 *     responses:
 *       200:
 *         description: Lista dei menu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 menus:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Menu'
 *       400:
 *         description: Restaurant ID richiesto
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