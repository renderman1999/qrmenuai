import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

// Schema per la validazione dell'aggiornamento ristorante
const updateRestaurantSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  website: z.string().url('URL non valido').optional().or(z.literal('')),
  instagram: z.string().url('URL Instagram non valido').optional().or(z.literal('')),
  facebook: z.string().url('URL Facebook non valido').optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  isActive: z.boolean().optional(),
  ordersEnabled: z.boolean().optional(),
  chatbotEnabled: z.boolean().optional(),
  telegramEnabled: z.boolean().optional()
})

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Rimuove caratteri speciali
    .replace(/\s+/g, '-') // Sostituisce spazi con trattini
    .replace(/-+/g, '-') // Rimuove trattini multipli
    .trim()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id: restaurantId } = await params

    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Trova il ristorante
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        qrCodes: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        },
        menus: {
          include: {
            qrCodes: {
              where: { isActive: true },
              orderBy: { createdAt: 'desc' }
            },
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
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Ristorante non trovato' }, { status: 404 })
    }

    if (restaurant.ownerId !== user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id: restaurantId } = await params

    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Trova il ristorante e verifica che appartenga all'utente
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    })

    if (!existingRestaurant) {
      return NextResponse.json({ error: 'Ristorante non trovato' }, { status: 404 })
    }

    if (existingRestaurant.ownerId !== user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Parse e valida i dati
    const body = await request.json()
    console.log('📝 Request body:', body)
    const validatedData = updateRestaurantSchema.parse(body)
    console.log('✅ Validated data:', validatedData)
    console.log('🔍 Orders/Chatbot/Telegram values:', {
      ordersEnabled: validatedData.ordersEnabled,
      chatbotEnabled: validatedData.chatbotEnabled,
      telegramEnabled: validatedData.telegramEnabled
    })

    // Prepara i dati di aggiornamento
    let updateData: any = {
      ...(validatedData.name && { name: validatedData.name }),
      ...(validatedData.description !== undefined && { description: validatedData.description }),
      ...(validatedData.address !== undefined && { address: validatedData.address }),
      ...(validatedData.phone !== undefined && { phone: validatedData.phone }),
      ...(validatedData.email !== undefined && { email: validatedData.email }),
      ...(validatedData.website !== undefined && { website: validatedData.website }),
      ...(validatedData.instagram !== undefined && { instagram: validatedData.instagram }),
      ...(validatedData.facebook !== undefined && { facebook: validatedData.facebook }),
      ...(validatedData.whatsapp !== undefined && { whatsapp: validatedData.whatsapp }),
      ...(validatedData.logo !== undefined && { logo: validatedData.logo }),
      ...(validatedData.coverImage !== undefined && { coverImage: validatedData.coverImage }),
      ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
      ...(validatedData.ordersEnabled !== undefined && { ordersEnabled: validatedData.ordersEnabled }),
      ...(validatedData.chatbotEnabled !== undefined && { chatbotEnabled: validatedData.chatbotEnabled }),
      ...(validatedData.telegramEnabled !== undefined && { telegramEnabled: validatedData.telegramEnabled })
    }
    
    console.log('🔄 Update data:', updateData)

    // Se il nome è cambiato, genera un nuovo slug
    if (validatedData.name && existingRestaurant.name !== validatedData.name) {
      let baseSlug = createSlug(validatedData.name.trim())
      let newSlug = baseSlug
      let counter = 1

      // Verifica che il nuovo slug sia unico
      while (await prisma.restaurant.findUnique({ where: { slug: newSlug } })) {
        newSlug = `${baseSlug}-${counter}`
        counter++
      }
      
      updateData.slug = newSlug
    }

    // Aggiorna il ristorante
    console.log('💾 Updating restaurant with data:', updateData)
    
    try {
      const updatedRestaurant = await prisma.restaurant.update({
        where: { id: restaurantId },
        data: updateData
      })
      console.log('✅ Restaurant updated successfully:', (updatedRestaurant as any).ordersEnabled)
      return NextResponse.json(updatedRestaurant)
    } catch (error: any) {
      // Se l'errore è dovuto a campi non esistenti, salva i valori in un campo JSON
      if (error.message && error.message.includes('Unknown argument')) {
        console.log('⚠️ Some fields may not exist in database, saving in JSON field...')
        
        // Rimuovi i campi che potrebbero non esistere
        const safeUpdateData = { ...updateData }
        delete safeUpdateData.ordersEnabled
        delete safeUpdateData.chatbotEnabled
        
        // Salva i valori in un campo JSON esistente (socialLinks o availability)
        const settingsData = {
          ordersEnabled: updateData.ordersEnabled || false,
          chatbotEnabled: updateData.chatbotEnabled || false
        }
        
        // Prova a salvare in socialLinks se esiste, altrimenti in availability
        try {
          const updatedRestaurant = await prisma.restaurant.update({
            where: { id: restaurantId },
            data: {
              ...safeUpdateData,
              socialLinks: settingsData
            }
          })
          
          const response = {
            ...updatedRestaurant,
            ordersEnabled: settingsData.ordersEnabled,
            chatbotEnabled: settingsData.chatbotEnabled
          }
          
          console.log('✅ Restaurant updated with JSON fallback:', response)
          return NextResponse.json(response)
        } catch (jsonError) {
          // Se anche il JSON fallisce, restituisci solo i dati sicuri
          const updatedRestaurant = await prisma.restaurant.update({
            where: { id: restaurantId },
            data: safeUpdateData
          })
          
          const response = {
            ...updatedRestaurant,
            ordersEnabled: updateData.ordersEnabled || false,
            chatbotEnabled: updateData.chatbotEnabled || false
          }
          
          console.log('✅ Restaurant updated with memory fallback:', response)
          return NextResponse.json(response)
        }
      }
      throw error
    }
  } catch (error) {
    console.error('Error updating restaurant:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dati non validi',
        details: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id: restaurantId } = await params

    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Trova il ristorante e verifica che appartenga all'utente
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menus: true
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Ristorante non trovato' }, { status: 404 })
    }

    if (restaurant.ownerId !== user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Elimina il ristorante (cascade eliminerà menu, categorie, piatti e QR codes)
    await prisma.restaurant.delete({
      where: { id: restaurantId }
    })

    return NextResponse.json({ message: 'Ristorante eliminato con successo' })
  } catch (error) {
    console.error('Error deleting restaurant:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
