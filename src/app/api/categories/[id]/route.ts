import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params
    const userEmail = request.headers.get('x-user-email')
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Email utente non fornita' }, { status: 400 })
    }

    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Trova la categoria e verifica che appartenga all'utente
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        menu: {
          include: {
            restaurant: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Categoria non trovata' }, { status: 404 })
    }

    if (category.menu.restaurant.ownerId !== user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Elimina la categoria (cascade eliminerà i piatti)
    await prisma.category.delete({
      where: { id: categoryId }
    })

    return NextResponse.json({ message: 'Categoria eliminata con successo' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
