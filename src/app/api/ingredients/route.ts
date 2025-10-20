import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/auth'

/**
 * @swagger
 * components:
 *   schemas:
 *     Ingredient:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateIngredientRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Nome dell'ingrediente
 *         description:
 *           type: string
 *           description: Descrizione dell'ingrediente
 *         category:
 *           type: string
 *           description: Categoria dell'ingrediente
 */

/**
 * @swagger
 * /api/ingredients:
 *   get:
 *     summary: Recupera gli ingredienti
 *     description: Recupera la lista degli ingredienti con filtri opzionali
 *     tags: [Ingredients]
 *     parameters:
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *         description: Filtra per categoria
 *       - in: query
 *         name: includeInactive
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Includi ingredienti inattivi
 *     responses:
 *       200:
 *         description: Lista degli ingredienti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ingredients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ingredient'
 *                 groupedIngredients:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Ingredient'
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
    const category = searchParams.get('category')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const whereClause = {
      ...(includeInactive ? {} : { isActive: true }),
      ...(category && { category })
    }

    const ingredients = await prisma.ingredient.findMany({
      where: whereClause,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    // Raggruppa per categoria
    const groupedIngredients = ingredients.reduce((acc, ingredient) => {
      const cat = ingredient.category || 'Altro'
      if (!acc[cat]) {
        acc[cat] = []
      }
      acc[cat].push(ingredient)
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({ 
      ingredients,
      groupedIngredients 
    })
  } catch (error) {
    console.error('Error fetching ingredients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * @swagger
 * /api/ingredients:
 *   post:
 *     summary: Crea un nuovo ingrediente
 *     description: Crea un nuovo ingrediente (solo per admin)
 *     tags: [Ingredients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateIngredientRequest'
 *     responses:
 *       201:
 *         description: Ingrediente creato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ingredient:
 *                   $ref: '#/components/schemas/Ingredient'
 *                 message:
 *                   type: string
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
 *         description: Accesso negato (solo admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Ingrediente già esistente
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
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Verifica che l'utente sia admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accesso negato. Solo gli admin possono gestire gli ingredienti.' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, category } = body

    if (!name) {
      return NextResponse.json({ error: 'Il nome è obbligatorio' }, { status: 400 })
    }

    // Verifica se l'ingrediente esiste già
    const existingIngredient = await prisma.ingredient.findUnique({
      where: { name }
    })

    if (existingIngredient) {
      return NextResponse.json({ error: 'Un ingrediente con questo nome esiste già' }, { status: 409 })
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        description,
        category,
        isActive: true
      }
    })

    return NextResponse.json({ 
      ingredient,
      message: 'Ingrediente creato con successo' 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating ingredient:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
