import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params

    const reviews = await prisma.review.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    const body = await request.json()
    
    const { customerName, rating, comment } = body

    if (!customerName || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Customer name and valid rating (1-5) are required' }, 
        { status: 400 }
      )
    }

    const review = await prisma.review.create({
      data: {
        customerName,
        rating,
        comment,
        isApproved: false, // Reviews need approval by default
        restaurantId
      }
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
