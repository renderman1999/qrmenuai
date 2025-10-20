import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { ownerId: string } }
) {
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

    const { ownerId } = await params

    // Carica i dettagli del proprietario con tutti i suoi ristoranti e menu
    const owner = await prisma.user.findUnique({
      where: { 
        id: ownerId,
        role: 'RESTAURANT_OWNER'
      },
      include: {
        restaurants: {
          include: {
            menus: {
              include: {
                categories: {
                  include: {
                    dishes: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              }
            },
            qrCodes: {
              where: {
                isActive: true
              },
              orderBy: {
                createdAt: 'desc'
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!owner) {
      return NextResponse.json({ error: 'Proprietario non trovato' }, { status: 404 })
    }

    return NextResponse.json({ owner })
  } catch (error) {
    console.error('Error fetching owner details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
