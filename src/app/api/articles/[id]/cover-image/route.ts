import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large. Maximum size is 5MB' }, { status: 400 })
    }

    // Convert file to base64 for storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Create a smaller, compressed version for storage
    let base64 = buffer.toString('base64')
    
    // Limit to 500KB base64 to ensure it fits in the database
    if (base64.length > 500000) {
      base64 = base64.substring(0, 500000)
    }
    
    const dataUrl = `data:${file.type};base64,${base64}`

    // Update article with cover image
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: { 
        coverImage: dataUrl
      },
      include: {
        restaurant: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      article: updatedArticle 
    })
  } catch (error) {
    console.error('Error updating article cover image:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params

    // Remove cover image from article
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: { 
        coverImage: null
      },
      include: {
        restaurant: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      article: updatedArticle 
    })
  } catch (error) {
    console.error('Error removing article cover image:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
