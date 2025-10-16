import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import QRCode from 'qrcode'
import { z } from 'zod'

const generateQRSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  restaurantId: z.string().min(1),
  menuId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
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
