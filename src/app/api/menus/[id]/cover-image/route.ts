import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: menuId } = await params
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

    // Update menu with cover image
    const updatedMenu = await prisma.menu.update({
      where: { id: menuId },
      data: { 
        coverImage: dataUrl
      },
      include: {
        restaurant: true,
        categories: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      menu: updatedMenu 
    })
  } catch (error) {
    console.error('Error updating menu cover image:', error)
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
    const { id: menuId } = await params

    // Remove cover image from menu
    const updatedMenu = await prisma.menu.update({
      where: { id: menuId },
      data: { 
        coverImage: null
      },
      include: {
        restaurant: true,
        categories: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      menu: updatedMenu 
    })
  } catch (error) {
    console.error('Error removing menu cover image:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
