import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id: categoryId } = await params

    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
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
