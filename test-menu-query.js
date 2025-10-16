const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testMenuQuery() {
  console.log('🔍 Testing menu query...')
  
  const menuId = 'ristorante1-menu'
  
  const menu = await prisma.menu.findUnique({
    where: { id: menuId },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          description: true,
          address: true,
          phone: true,
          email: true,
          website: true,
          logo: true,
          coverImage: true
        }
      },
      categories: {
        include: {
          dishes: {
            include: {
              dishAllergens: {
                include: {
                  allergen: true
                }
              },
              dishIngredients: {
                include: {
                  ingredient: true
                }
              }
            }
          }
        },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })
  
  if (!menu) {
    console.log('❌ No menu found')
    return
  }
  
  console.log('✅ Menu found:', menu.name)
  console.log('📊 Categories:', menu.categories.length)
  
  let totalDishes = 0
  menu.categories.forEach(category => {
    console.log(`- ${category.name}: ${category.dishes.length} dishes`)
    totalDishes += category.dishes.length
    
    category.dishes.forEach(dish => {
      console.log(`  - ${dish.name} (€${dish.price})`)
      if (dish.isVegetarian) console.log('    [Vegetariano]')
      if (dish.isVegan) console.log('    [Vegano]')
      if (dish.isGlutenFree) console.log('    [Senza glutine]')
      if (dish.isSpicy) console.log('    [Piccante]')
    })
  })
  
  console.log('🍽️ Total dishes:', totalDishes)
  
  await prisma.$disconnect()
}

testMenuQuery().catch(console.error)
