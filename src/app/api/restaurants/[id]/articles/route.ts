import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params

    const articles = await prisma.article.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(articles)
  } catch (error) {
    console.error('Error fetching articles:', error)
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
    
    const { title, content, excerpt, coverImage, buttonText, buttonUrl, isPublished } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' }, 
        { status: 400 }
      )
    }

    const article = await prisma.article.create({
      data: {
        title,
        content,
        excerpt,
        coverImage,
        buttonText,
        buttonUrl,
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
        restaurantId
      }
    })

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
