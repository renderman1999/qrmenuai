no import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demorestaurant.com' },
    update: {},
    create: {
      email: 'admin@demorestaurant.com',
      name: 'Admin Demo',
      role: 'RESTAURANT_OWNER',
    },
  })

  // Create ristorante1 user
  const ristorante1User = await prisma.user.upsert({
    where: { email: 'ristorante1@example.com' },
    update: {},
    create: {
      email: 'ristorante1@example.com',
      name: 'Ristorante1 Owner',
      role: 'RESTAURANT_OWNER',
    },
  })

  console.log('✅ Admin user created:', adminUser.email)
  console.log('✅ Ristorante1 user created:', ristorante1User.email)

  // Create ristorante1 restaurant with empty menu
  const ristorante1Restaurant = await prisma.restaurant.upsert({
    where: { id: 'ristorante1-restaurant' },
    update: {},
    create: {
      id: 'ristorante1-restaurant',
      name: 'Ristorante1',
      description: 'Un ristorante per la gestione completa del menu',
      address: 'Via Ristorante1, 123',
      phone: '+39-123-456-7890',
      email: 'info@ristorante1.com',
      isActive: true,
      licenseTier: 'BASIC',
      ownerId: ristorante1User.id,
    },
  })

  console.log('✅ Ristorante1 restaurant created:', ristorante1Restaurant.name)

  // Create empty menu for ristorante1
  const ristorante1Menu = await prisma.menu.upsert({
    where: { id: 'ristorante1-menu' },
    update: {},
    create: {
      id: 'ristorante1-menu',
      name: 'Menu Ristorante1',
      description: 'Menu vuoto pronto per essere personalizzato',
      isActive: true,
      restaurantId: ristorante1Restaurant.id,
    },
  })

  console.log('✅ Ristorante1 empty menu created:', ristorante1Menu.name)

  // Create QR Code for ristorante1 menu
  const ristorante1QRCode = await prisma.qRCode.upsert({
    where: { code: 'RISTORANTE1' },
    update: {},
    create: {
      code: 'RISTORANTE1',
      menuId: ristorante1Menu.id,
      restaurantId: ristorante1Restaurant.id,
      isActive: true,
    },
  })
  console.log('✅ Ristorante1 QR Code created:', ristorante1QRCode.code)

  console.log('🎉 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })