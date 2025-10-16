import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
        // Leggi l'email dell'utente dall'header della richiesta
        const userEmail = request.headers.get('x-user-email')
        
        if (!userEmail) {
          return NextResponse.json({ error: 'Email utente non fornita' }, { status: 400 })
        }
        
        // Cerchiamo l'utente nel database
        const targetUser = await prisma.user.findUnique({
          where: { email: userEmail }
        })
        
        if (!targetUser) {
          return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
        }
    
    
        
        const restaurants = await prisma.restaurant.findMany({
          where: {
            ownerId: targetUser.id
          },
      include: {
        menus: {
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
            }
          }
        }
      }
    })

    if (restaurants.length === 0) {
      return NextResponse.json({ error: 'Nessun ristorante trovato per questo utente' }, { status: 404 })
    }

    // Prendi il primo ristorante e il suo primo menu
    const restaurant = restaurants[0]
    const menu = restaurant.menus[0]

    if (!menu) {
      return NextResponse.json({ error: 'Nessun menu trovato per questo ristorante' }, { status: 404 })
    }

    // Converti i dati per il frontend
    const categories = menu.categories.map(category => ({
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
        id: menu.id,
        name: menu.name,
        description: menu.description,
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          description: restaurant.description
        }
      },
      categories
    })
  } catch (error) {
    console.error('Errore nel caricamento dei menu dell\'utente:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
