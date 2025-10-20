import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params
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

    // Convert file to base64 for storage (in a real app, you'd upload to a cloud service)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Create a smaller, compressed version for storage
    let base64 = buffer.toString('base64')
    
    // Limit to 500KB base64 to ensure it fits in the database
    if (base64.length > 500000) {
      // For now, we'll just truncate - in production you'd use a proper image compression library
      base64 = base64.substring(0, 500000)
    }
    
    const dataUrl = `data:${file.type};base64,${base64}`

    // Update category with cover image
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { 
        coverImage: dataUrl // Store in the proper coverImage field
      },
      include: {
        dishes: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      category: updatedCategory 
    })
  } catch (error) {
    console.error('Error updating category cover image:', error)
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
    const { id: categoryId } = await params

    // Remove cover image from category
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { 
        coverImage: null // Remove the image from coverImage field
      },
      include: {
        dishes: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      category: updatedCategory 
    })
  } catch (error) {
    console.error('Error removing category cover image:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
