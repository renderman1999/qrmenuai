import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { id: restaurantId, reviewId } = await params
    const body = await request.json()
    
    const { customerName, rating, comment, isApproved } = body

    const review = await prisma.review.update({
      where: { 
        id: reviewId,
        restaurantId 
      },
      data: {
        customerName,
        rating,
        comment,
        isApproved
      }
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { id: restaurantId, reviewId } = await params

    await prisma.review.delete({
      where: { 
        id: reviewId,
        restaurantId 
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
