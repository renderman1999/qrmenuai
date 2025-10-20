import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; articleId: string }> }
) {
  try {
    const { id: restaurantId, articleId } = await params
    const body = await request.json()
    
    const { title, content, excerpt, coverImage, buttonText, buttonUrl, isPublished, publishedAt } = body

    const article = await prisma.article.update({
      where: { 
        id: articleId,
        restaurantId 
      },
      data: {
        title,
        content,
        excerpt,
        coverImage,
        buttonText,
        buttonUrl,
        isPublished,
        publishedAt: publishedAt ? new Date(publishedAt) : null
      }
    })

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; articleId: string }> }
) {
  try {
    const { id: restaurantId, articleId } = await params

    await prisma.article.delete({
      where: { 
        id: articleId,
        restaurantId 
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
