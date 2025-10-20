import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Verifica che l'utente sia admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    }

    // Carica tutti i proprietari di ristoranti
    const owners = await prisma.user.findMany({
      where: {
        role: 'RESTAURANT_OWNER'
      },
      include: {
        restaurants: {
          select: {
            id: true,
            name: true,
            isActive: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ owners })
  } catch (error) {
    console.error('Error fetching restaurant owners:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
