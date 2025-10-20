const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateUserRole() {
  try {
    console.log('🔄 Aggiornamento ruolo utente...')
    
    // Trova l'utente con email admin@demorestaurant.com
    const user = await prisma.user.findUnique({
      where: { email: 'admin@demorestaurant.com' }
    })

    if (!user) {
      console.error('❌ Utente admin@demorestaurant.com non trovato!')
      return
    }

    console.log(`👤 Utente trovato: ${user.name} (${user.email})`)
    console.log(`📊 Ruolo attuale: ${user.role}`)

    if (user.role === 'ADMIN') {
      console.log('✅ L\'utente è già un ADMIN!')
      return
    }

    // Aggiorna il ruolo a ADMIN
    const updatedUser = await prisma.user.update({
      where: { email: 'admin@demorestaurant.com' },
      data: { role: 'ADMIN' }
    })

    console.log('✅ Ruolo aggiornato con successo!')
    console.log(`📊 Nuovo ruolo: ${updatedUser.role}`)
    console.log(`🆔 ID utente: ${updatedUser.id}`)

  } catch (error) {
    console.error('❌ Errore durante l\'aggiornamento:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateUserRole()
