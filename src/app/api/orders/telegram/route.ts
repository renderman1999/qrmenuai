import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { sendTelegramMessage } from '@/lib/services/telegram'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, tableNumber: tableNumberFromClient } = body as { orderId?: string, tableNumber?: string }
    if (!orderId) return NextResponse.json({ error: 'orderId richiesto' }, { status: 400 })

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: true,
        items: {
          include: { dish: true }
        }
      }
    })
    if (!order) return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 })

    const restaurant = order.restaurant as any
    if (!restaurant.telegramEnabled || !restaurant.sendOrdersToTelegram || !restaurant.telegramChannelId) {
      // Non considerare errore: silenziosamente OK per non disturbare UX
      return NextResponse.json({ success: true, skipped: true })
    }

    const tableNumber = tableNumberFromClient || (order as any).tableNumber || (order.customerInfo as any)?.tableNumber
    const lines = [
      `🧾 Nuovo ordine #${order.orderNumber}`,
      `Ristorante: ${restaurant.name}`,
      tableNumber ? `Tavolo: ${tableNumber}` : undefined,
      order.customerInfo?.name ? `Cliente: ${order.customerInfo.name}` : undefined,
      order.customerInfo?.phone ? `Tel: ${order.customerInfo.phone}` : undefined,
      order.notes ? `Note: ${order.notes}` : undefined,
      '---',
      ...order.items.map((it) => `• ${it.quantity} x ${it.dish.name} - €${Number(it.price).toFixed(2)}`),
      '---',
      `Totale: €${Number(order.totalAmount).toFixed(2)}`
    ].filter(Boolean)

    const text = lines.join('\n')
    const token = restaurant.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || ''
    const result = await sendTelegramMessage(restaurant.telegramChannelId, text, token)
    if (!result.ok) return NextResponse.json({ success: false, error: result.description || 'Invio fallito' }, { status: 200 })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Order telegram send error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


