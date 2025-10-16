const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDatabase() {
  console.log('🔍 Testing database data...')
  
  // Check restaurants
  const restaurants = await prisma.restaurant.findMany()
  console.log('📊 Restaurants:', restaurants.length)
  restaurants.forEach(r => console.log(`- ${r.id}: ${r.name}`))
  
  // Check menus
  const menus = await prisma.menu.findMany()
  console.log('📊 Menus:', menus.length)
  menus.forEach(m => console.log(`- ${m.id}: ${m.name} (restaurant: ${m.restaurantId})`))
  
  // Check categories
  const categories = await prisma.category.findMany()
  console.log('📊 Categories:', categories.length)
  categories.forEach(c => console.log(`- ${c.id}: ${c.name} (menu: ${c.menuId})`))
  
  // Check dishes
  const dishes = await prisma.dish.findMany()
  console.log('📊 Dishes:', dishes.length)
  dishes.forEach(d => console.log(`- ${d.id}: ${d.name} (category: ${d.categoryId})`))
  
  // Check QR codes
  const qrCodes = await prisma.qRCode.findMany()
  console.log('📊 QR Codes:', qrCodes.length)
  qrCodes.forEach(q => console.log(`- ${q.code}: menu ${q.menuId}`))
  
  await prisma.$disconnect()
}

testDatabase().catch(console.error)
