import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createOrderSchema = z.object({
  restaurantId: z.string().min(1, 'Restaurant ID è obbligatorio'),
  tableNumber: z.string().optional(),
  notes: z.string().optional(),
  customerInfo: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional()
  }).optional(),
  items: z.array(z.object({
    dishId: z.string().min(1, 'Dish ID è obbligatorio'),
    quantity: z.number().min(1, 'Quantità deve essere almeno 1'),
    price: z.number().min(0, 'Prezzo non può essere negativo'),
    notes: z.string().optional()
  })).min(1, 'Almeno un piatto è richiesto')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createOrderSchema.parse(body)

    // Calcola il totale
    const totalAmount = validatedData.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity)
    }, 0)

    // Genera numero ordine unico
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Crea l'ordine
    const order = await prisma.order.create({
      data: {
        orderNumber,
        restaurantId: validatedData.restaurantId,
        tableNumber: validatedData.tableNumber,
        notes: validatedData.notes,
        customerInfo: validatedData.customerInfo,
        totalAmount,
        items: {
          create: validatedData.items.map(item => ({
            dishId: item.dishId,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes
          }))
        }
      },
      include: {
        items: {
          include: {
            dish: true
          }
        },
        restaurant: true
      }
    })

    return NextResponse.json({
      success: true,
      order
    })

  } catch (error) {
    console.error('Error creating order:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Dati non validi',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const status = searchParams.get('status')
    const tableNumber = searchParams.get('tableNumber')

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'Restaurant ID è obbligatorio'
      }, { status: 400 })
    }

    const where: any = {
      restaurantId
    }

    if (status) {
      where.status = status
    }

    if (tableNumber) {
      where.tableNumber = tableNumber
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            dish: true
          }
        },
        restaurant: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      orders
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 })
  }
}
