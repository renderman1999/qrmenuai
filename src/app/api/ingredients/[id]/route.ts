import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params

    const ingredient = await prisma.ingredient.findUnique({
      where: { id }
    })

    if (!ingredient) {
      return NextResponse.json({ error: 'Ingrediente non trovato' }, { status: 404 })
    }

    return NextResponse.json({ ingredient })
  } catch (error) {
    console.error('Error fetching ingredient:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Verifica che l'utente sia admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accesso negato. Solo gli admin possono modificare gli ingredienti.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, category, isActive } = body

    // Verifica se l'ingrediente esiste
    const existingIngredient = await prisma.ingredient.findUnique({
      where: { id }
    })

    if (!existingIngredient) {
      return NextResponse.json({ error: 'Ingrediente non trovato' }, { status: 404 })
    }

    // Se si sta cambiando il nome, verifica che non esista già
    if (name && name !== existingIngredient.name) {
      const duplicateIngredient = await prisma.ingredient.findUnique({
        where: { name }
      })

      if (duplicateIngredient) {
        return NextResponse.json({ error: 'Un ingrediente con questo nome esiste già' }, { status: 409 })
      }
    }

    const updatedIngredient = await prisma.ingredient.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json({ 
      ingredient: updatedIngredient,
      message: 'Ingrediente aggiornato con successo' 
    })
  } catch (error) {
    console.error('Error updating ingredient:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Verifica che l'utente sia admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accesso negato. Solo gli admin possono eliminare gli ingredienti.' }, { status: 403 })
    }

    const { id } = await params

    // Verifica se l'ingrediente esiste
    const existingIngredient = await prisma.ingredient.findUnique({
      where: { id },
      include: {
        dishIngredients: true
      }
    })

    if (!existingIngredient) {
      return NextResponse.json({ error: 'Ingrediente non trovato' }, { status: 404 })
    }

    // Verifica se l'ingrediente è utilizzato in qualche piatto
    if (existingIngredient.dishIngredients.length > 0) {
      return NextResponse.json({ 
        error: 'Impossibile eliminare l\'ingrediente perché è utilizzato in alcuni piatti. Disattivalo invece di eliminarlo.' 
      }, { status: 409 })
    }

    await prisma.ingredient.delete({
      where: { id }
    })

    return NextResponse.json({ 
      message: 'Ingrediente eliminato con successo' 
    })
  } catch (error) {
    console.error('Error deleting ingredient:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
