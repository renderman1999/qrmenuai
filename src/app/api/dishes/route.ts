import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { invalidateMenuCache, invalidateRestaurantCache } from '@/lib/cache/menu-cache'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateDishRequest:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - categoryId
 *       properties:
 *         name:
 *           type: string
 *           description: Nome del piatto
 *         description:
 *           type: string
 *           description: Descrizione del piatto
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Prezzo del piatto
 *         categoryId:
 *           type: string
 *           description: ID della categoria
 *         allergenIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista degli ID degli allergeni
 *         ingredientIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista degli ID degli ingredienti
 *         isVegetarian:
 *           type: boolean
 *           description: Se il piatto è vegetariano
 *         isVegan:
 *           type: boolean
 *           description: Se il piatto è vegano
 *         isGlutenFree:
 *           type: boolean
 *           description: Se il piatto è senza glutine
 *         isSpicy:
 *           type: boolean
 *           description: Se il piatto è piccante
 *         image:
 *           type: string
 *           description: URL dell'immagine del piatto
 *         galleryEnabled:
 *           type: boolean
 *           description: Se la galleria immagini è abilitata
 *         galleryImages:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               alt:
 *                 type: string
 *               order:
 *                 type: number
 *           description: Immagini della galleria
 *     Dish:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *           format: decimal
 *         categoryId:
 *           type: string
 *         menuId:
 *           type: string
 *         isVegetarian:
 *           type: boolean
 *         isVegan:
 *           type: boolean
 *         isGlutenFree:
 *           type: boolean
 *         isSpicy:
 *           type: boolean
 *         image:
 *           type: string
 *         galleryEnabled:
 *           type: boolean
 *         galleryImages:
 *           type: array
 *           items:
 *             type: object
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
 *         dishAllergens:
 *           type: array
 *           items:
 *             type: object
 *         dishIngredients:
 *           type: array
 *           items:
 *             type: object
 */

const createDishSchema = z.object({
  name: z.string().min(1, 'Nome piatto richiesto'),
  description: z.string().optional().nullable(),
  price: z.number().positive('Prezzo deve essere positivo'),
  categoryId: z.string().min(1, 'Category ID richiesto'),
  allergenIds: z.array(z.string()).default([]),
  ingredientIds: z.array(z.string()).default([]),
  isVegetarian: z.boolean().optional().default(false),
  isVegan: z.boolean().optional().default(false),
  isGlutenFree: z.boolean().optional().default(false),
  isSpicy: z.boolean().optional().default(false),
  image: z.string().optional().nullable(),
  galleryEnabled: z.boolean().optional().default(false),
  galleryImages: z.array(z.object({
    url: z.string(),
    alt: z.string().optional(),
    order: z.number()
  })).optional(),
})

/**
 * @swagger
 * /api/dishes:
 *   post:
 *     summary: Crea un nuovo piatto
 *     description: Crea un nuovo piatto con allergeni e ingredienti associati
 *     tags: [Dishes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDishRequest'
 *     responses:
 *       200:
 *         description: Piatto creato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dish:
 *                   $ref: '#/components/schemas/Dish'
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
 *         description: Non autorizzato per questa categoria
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Utente o categoria non trovata
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
    console.log('POST /api/dishes called')
    console.log('Request URL:', request.url)
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    
    const body = await request.json()
    console.log('Received dish data:', body)
    
    const data = createDishSchema.parse(body)
    console.log('Validated dish data:', data)

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

    // Verifica che la categoria appartenga all'utente
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
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

    // Validare che gli ID esistano prima di creare le relazioni
    const validAllergenIds = data.allergenIds.length > 0 
      ? await prisma.allergen.findMany({
          where: { id: { in: data.allergenIds } },
          select: { id: true }
        }).then(results => results.map(r => r.id))
      : []

    const validIngredientIds = data.ingredientIds.length > 0
      ? await prisma.ingredient.findMany({
          where: { id: { in: data.ingredientIds } },
          select: { id: true }
        }).then(results => results.map(r => r.id))
      : []

    console.log('Valid allergen IDs:', validAllergenIds)
    console.log('Valid ingredient IDs:', validIngredientIds)

    // Crea il piatto con le relazioni
    const dish = await prisma.dish.create({
      data: {
        name: data.name,
        description: data.description || null,
        price: new Decimal(data.price),
        menuId: category.menu.id,
        categoryId: data.categoryId,
        isVegetarian: data.isVegetarian,
        isVegan: data.isVegan,
        isGlutenFree: data.isGlutenFree,
        isSpicy: data.isSpicy,
        image: data.image || null,
        galleryEnabled: data.galleryEnabled || false,
        galleryImages: data.galleryImages || null,
        sortOrder: 0,
        isActive: true,
        // Crea le relazioni solo con ID validati
        dishAllergens: {
          create: validAllergenIds.map(id => ({ allergenId: id }))
        },
        dishIngredients: {
          create: validIngredientIds.map(id => ({ ingredientId: id }))
        }
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

    // Invalida la cache del menu e del ristorante
    await Promise.all([
      invalidateMenuCache(category.menu.id),
      invalidateRestaurantCache(category.menu.restaurantId)
    ])

    return NextResponse.json({ dish })
  } catch (error: any) {
    console.log('Error caught in POST /api/dishes:', error)
    console.log('Error type:', typeof error)
    console.log('Error constructor:', error.constructor.name)
    
    if (error instanceof z.ZodError) {
      console.log('Validation errors:', error.errors)
      return NextResponse.json({ error: 'Dati non validi', details: error.errors }, { status: 400 })
    }

    console.error('Error creating dish:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    // Assicurati di restituire sempre una risposta JSON valida
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message || 'Unknown error',
      type: error.constructor.name 
    }, { status: 500 })
  }
}

/**
 * @swagger
 * /api/dishes:
 *   get:
 *     summary: Recupera i piatti di una categoria
 *     description: Recupera tutti i piatti attivi di una categoria specifica
 *     tags: [Dishes]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID della categoria
 *     responses:
 *       200:
 *         description: Lista dei piatti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dishes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Dish'
 *       400:
 *         description: Category ID richiesto
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
    const categoryId = searchParams.get('categoryId')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID richiesto' }, { status: 400 })
    }

    const dishes = await prisma.dish.findMany({
      where: {
        categoryId: categoryId,
        ...(includeInactive ? {} : { isActive: true })
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
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    return NextResponse.json({ dishes })
  } catch (error) {
    console.error('Error fetching dishes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}