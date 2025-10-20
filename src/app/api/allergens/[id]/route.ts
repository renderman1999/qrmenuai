import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params

    const allergen = await prisma.allergen.findUnique({
      where: { id }
    })

    if (!allergen) {
      return NextResponse.json({ error: 'Allergene non trovato' }, { status: 404 })
    }

    return NextResponse.json({ allergen })
  } catch (error) {
    console.error('Error fetching allergen:', error)
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
      return NextResponse.json({ error: 'Accesso negato. Solo gli admin possono modificare gli allergeni.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, icon, isActive } = body

    // Verifica se l'allergene esiste
    const existingAllergen = await prisma.allergen.findUnique({
      where: { id }
    })

    if (!existingAllergen) {
      return NextResponse.json({ error: 'Allergene non trovato' }, { status: 404 })
    }

    // Se si sta cambiando il nome, verifica che non esista già
    if (name && name !== existingAllergen.name) {
      const duplicateAllergen = await prisma.allergen.findUnique({
        where: { name }
      })

      if (duplicateAllergen) {
        return NextResponse.json({ error: 'Un allergene con questo nome esiste già' }, { status: 409 })
      }
    }

    const updatedAllergen = await prisma.allergen.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json({ 
      allergen: updatedAllergen,
      message: 'Allergene aggiornato con successo' 
    })
  } catch (error) {
    console.error('Error updating allergen:', error)
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
      return NextResponse.json({ error: 'Accesso negato. Solo gli admin possono eliminare gli allergeni.' }, { status: 403 })
    }

    const { id } = await params

    // Verifica se l'allergene esiste
    const existingAllergen = await prisma.allergen.findUnique({
      where: { id },
      include: {
        dishAllergens: true
      }
    })

    if (!existingAllergen) {
      return NextResponse.json({ error: 'Allergene non trovato' }, { status: 404 })
    }

    // Verifica se l'allergene è utilizzato in qualche piatto
    if (existingAllergen.dishAllergens.length > 0) {
      return NextResponse.json({ 
        error: 'Impossibile eliminare l\'allergene perché è utilizzato in alcuni piatti. Disattivalo invece di eliminarlo.' 
      }, { status: 409 })
    }

    await prisma.allergen.delete({
      where: { id }
    })

    return NextResponse.json({ 
      message: 'Allergene eliminato con successo' 
    })
  } catch (error) {
    console.error('Error deleting allergen:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
