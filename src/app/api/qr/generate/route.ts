import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import QRCode from 'qrcode'
import { z } from 'zod'

/**
 * @swagger
 * components:
 *   schemas:
 *     GenerateQRRequest:
 *       type: object
 *       required:
 *         - name
 *         - restaurantId
 *       properties:
 *         name:
 *           type: string
 *           description: Nome del QR code
 *         description:
 *           type: string
 *           description: Descrizione del QR code
 *         restaurantId:
 *           type: string
 *           description: ID del ristorante
 *         menuId:
 *           type: string
 *           description: ID del menu (opzionale)
 *     GenerateQRResponse:
 *       type: object
 *       properties:
 *         qrCode:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             code:
 *               type: string
 *             name:
 *               type: string
 *             description:
 *               type: string
 *             restaurantId:
 *               type: string
 *             menuId:
 *               type: string
 *             isActive:
 *               type: boolean
 *             restaurant:
 *               type: object
 *             menu:
 *               type: object
 *         qrCodeImage:
 *           type: string
 *           description: Data URL dell'immagine QR code
 *         qrCodeURL:
 *           type: string
 *           description: URL del QR code
 */

const generateQRSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  restaurantId: z.string().min(1),
  menuId: z.string().optional(),
})

/**
 * @swagger
 * /api/qr/generate:
 *   post:
 *     summary: Genera un QR code
 *     description: Genera un nuovo QR code per un ristorante o menu
 *     tags: [QR Code]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateQRRequest'
 *     responses:
 *       200:
 *         description: QR code generato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenerateQRResponse'
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
 *         description: Ristorante non trovato o accesso negato
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, restaurantId, menuId } = generateQRSchema.parse(body)

    // Verify restaurant ownership
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        ownerId: session.user.id
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found or access denied' }, { status: 404 })
    }

    // Generate unique QR code
    const qrCode = `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Generate QR code image
    const qrCodeDataURL = await QRCode.toDataURL(qrCode, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // Save to database
    const savedQRCode = await prisma.qRCode.create({
      data: {
        code: qrCode,
        name,
        description,
        restaurantId,
        menuId,
        isActive: true
      },
      include: {
        restaurant: true,
        menu: true
      }
    })

    return NextResponse.json({
      qrCode: savedQRCode,
      qrCodeImage: qrCodeDataURL,
      qrCodeURL: `${process.env.NEXTAUTH_URL}/menu/${qrCode}`
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    
    console.error('Error generating QR code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
