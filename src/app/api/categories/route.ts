import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateCategoryRequest:
 *       type: object
 *       required:
 *         - name
 *         - menuId
 *       properties:
 *         name:
 *           type: string
 *           description: Nome della categoria
 *         description:
 *           type: string
 *           description: Descrizione della categoria
 *         menuId:
 *           type: string
 *           description: ID del menu
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         menuId:
 *           type: string
 *         sortOrder:
 *           type: number
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         dishes:
 *           type: array
 *           items:
 *             type: object
 */

const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome categoria richiesto'),
  description: z.string().optional(),
  menuId: z.string().min(1, 'Menu ID richiesto'),
})

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Crea una nuova categoria
 *     description: Crea una nuova categoria per un menu
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *     responses:
 *       200:
 *         description: Categoria creata con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Dati non validi o categoria già esistente
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
 *         description: Non autorizzato per questo menu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Utente o menu non trovato
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
    const { name, description, menuId } = createCategorySchema.parse(body)

    // Trova l'utente nel database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
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

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Recupera le categorie di un menu
 *     description: Recupera tutte le categorie di un menu specifico
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: menuId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del menu
 *     responses:
 *       200:
 *         description: Lista delle categorie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       400:
 *         description: Menu ID richiesto
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