const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Rimuove caratteri speciali
    .replace(/\s+/g, '-') // Sostituisce spazi con trattini
    .replace(/-+/g, '-') // Rimuove trattini multipli
    .trim()
}

async function addSlugs() {
  try {
    // Prima aggiungo il campo slug come nullable
    console.log('Aggiungendo campo slug...')
    
    // Ottieni tutti i ristoranti
    const restaurants = await prisma.restaurant.findMany()
    
    console.log(`Trovati ${restaurants.length} ristoranti`)
    
    for (const restaurant of restaurants) {
      const slug = createSlug(restaurant.name)
      console.log(`Aggiornando ${restaurant.name} -> ${slug}`)
      
      await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: { slug: slug }
      })
    }
    
    console.log('Slug aggiunti con successo!')
  } catch (error) {
    console.error('Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSlugs()
