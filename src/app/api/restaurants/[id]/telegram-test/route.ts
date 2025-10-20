import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { sendTelegramMessage } from '@/lib/services/telegram'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id: restaurantId } = await params

    // Verifica proprietà ristorante
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
    if (!restaurant) return NextResponse.json({ error: 'Ristorante non trovato' }, { status: 404 })
    if (restaurant.ownerId !== user.id) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })

    if (!restaurant.telegramEnabled) {
      return NextResponse.json({ error: 'Telegram non abilitato' }, { status: 400 })
    }

    if (!restaurant.telegramChannelId) {
      return NextResponse.json({ error: 'ID canale Telegram non impostato' }, { status: 400 })
    }

    const message = `Test QRMenu: invio riuscito per "${restaurant.name}" (${restaurant.slug}).`
    const token = (restaurant as any).telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || ''
    const result = await sendTelegramMessage(restaurant.telegramChannelId, message, token)

    if (!result.ok) {
      return NextResponse.json({ error: `Invio fallito: ${result.description}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, result: result.result })
  } catch (error) {
    console.error('Error sending Telegram test:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


