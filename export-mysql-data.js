const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function exportData() {
  console.log('🔄 Exporting data from MySQL...')
  
  try {
    // Export all data
    const data = {
      users: await prisma.user.findMany(),
      restaurants: await prisma.restaurant.findMany(),
      categories: await prisma.category.findMany(),
      dishes: await prisma.dish.findMany(),
      menus: await prisma.menu.findMany(),
      allergens: await prisma.allergen.findMany(),
      ingredients: await prisma.ingredient.findMany(),
      dishAllergens: await prisma.dishAllergen.findMany(),
      dishIngredients: await prisma.dishIngredient.findMany(),
      orders: await prisma.order.findMany(),
      orderItems: await prisma.orderItem.findMany(),
    }

    // Save to JSON file
    const exportPath = path.join(__dirname, 'mysql-export.json')
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2))
    
    console.log('✅ Data exported to mysql-export.json')
    console.log('📊 Exported:')
    console.log(`- Users: ${data.users.length}`)
    console.log(`- Restaurants: ${data.restaurants.length}`)
    console.log(`- Categories: ${data.categories.length}`)
    console.log(`- Dishes: ${data.dishes.length}`)
    console.log(`- Menus: ${data.menus.length}`)
    console.log(`- Allergens: ${data.allergens.length}`)
    console.log(`- Ingredients: ${data.ingredients.length}`)
    console.log(`- Orders: ${data.orders.length}`)
    
  } catch (error) {
    console.error('❌ Error exporting data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

exportData()
