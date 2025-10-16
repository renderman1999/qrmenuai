import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { invalidateMenuCache, invalidateRestaurantCache } from '@/lib/cache/menu-cache'
import { z } from 'zod'

// Schema per la validazione dell'aggiornamento menu
const updateMenuSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  availability: z.record(z.object({
    lunch: z.boolean(),
    dinner: z.boolean()
  })).optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: menuId } = await params
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

    // Trova il menu e verifica che appartenga all'utente
    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        restaurant: true
      }
    })

    if (!menu) {
      return NextResponse.json({ error: 'Menu non trovato' }, { status: 404 })
    }

    if (menu.restaurant.ownerId !== user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Valida i dati
    const body = await request.json()
    const validatedData = updateMenuSchema.parse(body)

    // Aggiorna il menu
    const updatedMenu = await prisma.menu.update({
      where: { id: menuId },
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        isActive: validatedData.isActive ?? true,
        availability: validatedData.availability || {}
      }
    })

    // Invalida la cache del menu e del ristorante
    await Promise.all([
      invalidateMenuCache(menuId),
      invalidateRestaurantCache(menu.restaurant.id)
    ])

    return NextResponse.json(updatedMenu)
  } catch (error) {
    console.error('Errore nell\'aggiornamento del menu:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dati non validi',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 })
    }

    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: menuId } = await params
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

    // Trova il menu e verifica che appartenga all'utente
    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        restaurant: true
      }
    })

    if (!menu) {
      return NextResponse.json({ error: 'Menu non trovato' }, { status: 404 })
    }

    if (menu.restaurant.ownerId !== user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Elimina il menu (cascade eliminerà categorie, piatti e QR codes)
    await prisma.menu.delete({
      where: { id: menuId }
    })

    // Invalida la cache del menu e del ristorante
    await Promise.all([
      invalidateMenuCache(menuId),
      invalidateRestaurantCache(menu.restaurant.id)
    ])

    return NextResponse.json({ message: 'Menu eliminato con successo' })
  } catch (error) {
    console.error('Error deleting menu:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
