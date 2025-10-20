import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/auth'

/**
 * @swagger
 * components:
 *   schemas:
 *     Allergen:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         icon:
 *           type: string
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateAllergenRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Nome dell'allergene
 *         description:
 *           type: string
 *           description: Descrizione dell'allergene
 *         icon:
 *           type: string
 *           description: Icona dell'allergene
 */

/**
 * @swagger
 * /api/allergens:
 *   get:
 *     summary: Recupera gli allergeni
 *     description: Recupera la lista degli allergeni
 *     tags: [Allergens]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Includi allergeni inattivi
 *     responses:
 *       200:
 *         description: Lista degli allergeni
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allergens:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Allergen'
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
    const includeInactive = searchParams.get('includeInactive') === 'true'

    console.log('Fetching allergens...')
    const allergens = await prisma.allergen.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true })
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log('Found allergens:', allergens.length)
    return NextResponse.json({ allergens })
  } catch (error: any) {
    console.error('Error fetching allergens:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

/**
 * @swagger
 * /api/allergens:
 *   post:
 *     summary: Crea un nuovo allergene
 *     description: Crea un nuovo allergene (solo per admin)
 *     tags: [Allergens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAllergenRequest'
 *     responses:
 *       201:
 *         description: Allergene creato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allergen:
 *                   $ref: '#/components/schemas/Allergen'
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
 *         description: Allergene già esistente
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
      return NextResponse.json({ error: 'Accesso negato. Solo gli admin possono gestire gli allergeni.' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, icon } = body

    if (!name) {
      return NextResponse.json({ error: 'Il nome è obbligatorio' }, { status: 400 })
    }

    // Verifica se l'allergene esiste già
    const existingAllergen = await prisma.allergen.findUnique({
      where: { name }
    })

    if (existingAllergen) {
      return NextResponse.json({ error: 'Un allergene con questo nome esiste già' }, { status: 409 })
    }

    const allergen = await prisma.allergen.create({
      data: {
        name,
        description,
        icon,
        isActive: true
      }
    })

    return NextResponse.json({ 
      allergen,
      message: 'Allergene creato con successo' 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating allergen:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
