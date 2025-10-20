const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function listUsers() {
  try {
    console.log('👥 Lista utenti nel sistema:')
    console.log('=' .repeat(50))
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'N/A'} (${user.email})`)
      console.log(`   Ruolo: ${user.role}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Creato: ${user.createdAt.toLocaleDateString()}`)
      console.log('')
    })

    console.log(`📊 Totale utenti: ${users.length}`)
    
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {})

    console.log('\n📈 Statistiche ruoli:')
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`)
    })

  } catch (error) {
    console.error('❌ Errore durante il recupero degli utenti:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function updateUserRole(email, newRole) {
  try {
    console.log(`🔄 Aggiornamento ruolo per ${email}...`)
    
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.error(`❌ Utente ${email} non trovato!`)
      return
    }

    console.log(`👤 Utente trovato: ${user.name} (${user.email})`)
    console.log(`📊 Ruolo attuale: ${user.role}`)

    if (user.role === newRole) {
      console.log(`✅ L'utente ha già il ruolo ${newRole}!`)
      return
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: newRole }
    })

    console.log('✅ Ruolo aggiornato con successo!')
    console.log(`📊 Nuovo ruolo: ${updatedUser.role}`)

  } catch (error) {
    console.error('❌ Errore durante l\'aggiornamento:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Esegui il comando basato sugli argomenti
const args = process.argv.slice(2)
const command = args[0]

switch (command) {
  case 'list':
    listUsers()
    break
  case 'update':
    const email = args[1]
    const role = args[2]
    if (!email || !role) {
      console.error('❌ Uso: node scripts/manage-user-roles.js update <email> <role>')
      console.error('   Ruoli disponibili: ADMIN, RESTAURANT_OWNER, CUSTOMER')
      process.exit(1)
    }
    updateUserRole(email, role)
    break
  default:
    console.log('🔧 Gestione ruoli utente')
    console.log('')
    console.log('Comandi disponibili:')
    console.log('  list                                    - Lista tutti gli utenti')
    console.log('  update <email> <role>                   - Aggiorna ruolo utente')
    console.log('')
    console.log('Esempi:')
    console.log('  node scripts/manage-user-roles.js list')
    console.log('  node scripts/manage-user-roles.js update admin@example.com ADMIN')
    console.log('  node scripts/manage-user-roles.js update user@example.com RESTAURANT_OWNER')
}
