import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateOrderRequest:
 *       type: object
 *       required:
 *         - restaurantId
 *         - items
 *       properties:
 *         restaurantId:
 *           type: string
 *           description: ID del ristorante
 *         tableNumber:
 *           type: string
 *           description: Numero del tavolo (opzionale)
 *         notes:
 *           type: string
 *           description: Note aggiuntive per l'ordine
 *         customerInfo:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             phone:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - dishId
 *               - quantity
 *               - price
 *             properties:
 *               dishId:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *               price:
 *                 type: number
 *                 minimum: 0
 *               notes:
 *                 type: string
 */

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

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Crea un nuovo ordine
 *     description: Crea un nuovo ordine per un ristorante
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       200:
 *         description: Ordine creato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Dati non validi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Dati non validi"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Errore interno del server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Errore interno del server"
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📦 Creating order...')
    const body = await request.json()
    console.log('📦 Order data received:', body)
    const validatedData = createOrderSchema.parse(body)
    console.log('📦 Validated data:', validatedData)

    // Calcola il totale
    const totalAmount = validatedData.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity)
    }, 0)

    // Genera numero ordine unico
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Crea l'ordine
    console.log('📦 Creating order in database...')
    const order = await prisma.order.create({
      data: {
        orderNumber,
        restaurantId: validatedData.restaurantId,
        // ...(validatedData.tableNumber && { tableNumber: validatedData.tableNumber }),
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

    console.log('📦 Order created successfully:', order.id)
    return NextResponse.json({
      success: true,
      order
    })

  } catch (error) {
    console.error('❌ Error creating order:', error)
    console.error('❌ Error type:', typeof error)
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    if (error instanceof z.ZodError) {
      console.error('❌ Zod validation error:', error.issues)
      return NextResponse.json({
        success: false,
        error: 'Dati non validi',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Recupera gli ordini
 *     description: Recupera la lista degli ordini con filtri opzionali
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del ristorante
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PREPARING, READY, DELIVERED, CANCELLED]
 *         description: Stato dell'ordine
 *       - in: query
 *         name: tableNumber
 *         required: false
 *         schema:
 *           type: string
 *         description: Numero del tavolo
 *     responses:
 *       200:
 *         description: Lista degli ordini
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       400:
 *         description: Parametri mancanti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Restaurant ID è obbligatorio"
 *       500:
 *         description: Errore interno del server
 */
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
