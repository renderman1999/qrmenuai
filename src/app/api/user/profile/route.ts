import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         name:
 *           type: string
 *         image:
 *           type: string
 *         role:
 *           type: string
 *           enum: [ADMIN, RESTAURANT_OWNER, CUSTOMER]
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phone:
 *           type: string
 *         company:
 *           type: string
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         postalCode:
 *           type: string
 *         country:
 *           type: string
 *         bio:
 *           type: string
 *         website:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           maxLength: 50
 *         lastName:
 *           type: string
 *           maxLength: 50
 *         phone:
 *           type: string
 *           maxLength: 20
 *         company:
 *           type: string
 *           maxLength: 100
 *         address:
 *           type: string
 *           maxLength: 200
 *         city:
 *           type: string
 *           maxLength: 50
 *         postalCode:
 *           type: string
 *           maxLength: 10
 *         country:
 *           type: string
 *           maxLength: 50
 *         bio:
 *           type: string
 *           maxLength: 1000
 *         website:
 *           type: string
 *           maxLength: 200
 */

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Recupera il profilo utente
 *     description: Recupera le informazioni del profilo dell'utente autenticato
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profilo utente recuperato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
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
// GET - Ottieni profilo utente
export async function GET(request: NextRequest) {
  try {
    // Prova prima con NextAuth
    const session = await auth()
    let userEmail = session?.user?.email

    // Se non c'è sessione NextAuth, prova con header personalizzato (per dashboard admin)
    if (!userEmail) {
      const emailHeader = request.headers.get('x-user-email')
      if (emailHeader) {
        userEmail = emailHeader
      }
    }
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        company: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        bio: true,
        website: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Errore nel recupero del profilo:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Aggiorna il profilo utente
 *     description: Aggiorna le informazioni del profilo dell'utente autenticato
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profilo aggiornato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
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
 *       500:
 *         description: Errore interno del server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PUT - Aggiorna profilo utente
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      phone,
      company,
      address,
      city,
      postalCode,
      country,
      bio,
      website
    } = body

    // Validazione dei dati
    if (firstName && firstName.length > 50) {
      return NextResponse.json({ error: 'Nome troppo lungo' }, { status: 400 })
    }
    if (lastName && lastName.length > 50) {
      return NextResponse.json({ error: 'Cognome troppo lungo' }, { status: 400 })
    }
    if (phone && phone.length > 20) {
      return NextResponse.json({ error: 'Telefono troppo lungo' }, { status: 400 })
    }
    if (company && company.length > 100) {
      return NextResponse.json({ error: 'Azienda troppo lunga' }, { status: 400 })
    }
    if (address && address.length > 200) {
      return NextResponse.json({ error: 'Indirizzo troppo lungo' }, { status: 400 })
    }
    if (city && city.length > 50) {
      return NextResponse.json({ error: 'Città troppo lunga' }, { status: 400 })
    }
    if (postalCode && postalCode.length > 10) {
      return NextResponse.json({ error: 'CAP troppo lungo' }, { status: 400 })
    }
    if (country && country.length > 50) {
      return NextResponse.json({ error: 'Paese troppo lungo' }, { status: 400 })
    }
    if (bio && bio.length > 1000) {
      return NextResponse.json({ error: 'Bio troppo lunga' }, { status: 400 })
    }
    if (website && website.length > 200) {
      return NextResponse.json({ error: 'Sito web troppo lungo' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        company: company || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        country: country || null,
        bio: bio || null,
        website: website || null
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        company: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        bio: true,
        website: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ 
      user: updatedUser,
      message: 'Profilo aggiornato con successo' 
    })
  } catch (error) {
    console.error('Errore nell\'aggiornamento del profilo:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
