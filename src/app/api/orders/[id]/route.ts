import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']).optional(),
  kitchenNotes: z.string().optional(),
  estimatedTime: z.number().min(0).optional(),
  notes: z.string().optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateOrderSchema.parse(body)

    const order = await prisma.order.update({
      where: { id },
      data: validatedData,
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
    console.error('Error updating order:', error)
    
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            dish: true
          }
        },
        restaurant: true
      }
    })

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Ordine non trovato'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      order
    })

  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.order.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Ordine eliminato con successo'
    })

  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 })
  }
}
