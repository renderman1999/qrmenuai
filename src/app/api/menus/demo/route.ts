import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    // Per ora, per semplicità, carichiamo il menu demo
    // In futuro qui potremmo aggiungere l'autenticazione per caricare i menu dell'utente specifico
    const qrCode = await prisma.qRCode.findUnique({
      where: {
        code: 'DEMO123'
      },
      include: {
        menu: {
          include: {
            categories: {
              include: {
                dishes: {
                  where: {
                    isActive: true
                  },
                  orderBy: {
                    sortOrder: 'asc'
                  }
                }
              },
              orderBy: {
                sortOrder: 'asc'
              }
            },
            restaurant: true
          }
        }
      }
    })

    if (!qrCode || !qrCode.menu) {
      return NextResponse.json({ error: 'Menu demo non trovato' }, { status: 404 })
    }

    // Converti i dati per il frontend
    const categories = qrCode.menu.categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description || '',
      dishes: category.dishes.map(dish => ({
        id: dish.id,
        name: dish.name,
        description: dish.description || '',
        price: Number(dish.price), // Converti Decimal a Number
        isVegetarian: dish.isVegetarian,
        isVegan: dish.isVegan,
        isGlutenFree: dish.isGlutenFree,
        isSpicy: dish.isSpicy,
        allergens: Array.isArray(dish.allergens) ? dish.allergens : [],
        ingredients: Array.isArray(dish.ingredients) ? dish.ingredients : [],
        isActive: dish.isActive
      }))
    }))

    return NextResponse.json({
      menu: {
        id: qrCode.menu.id,
        name: qrCode.menu.name,
        description: qrCode.menu.description,
        restaurant: qrCode.menu.restaurant
      },
      categories
    })
  } catch (error) {
    console.error('Errore nel caricamento del menu demo:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
