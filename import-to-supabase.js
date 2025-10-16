require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function importData() {
  console.log('🔄 Importing data to Supabase...')
  
  try {
    // Read exported data
    const exportPath = path.join(__dirname, 'mysql-export.json')
    const data = JSON.parse(fs.readFileSync(exportPath, 'utf8'))
    
    console.log('📊 Importing data:')
    
    // Import in correct order (respecting foreign key constraints)
    const tables = [
      { name: 'users', data: data.users },
      { name: 'allergens', data: data.allergens },
      { name: 'ingredients', data: data.ingredients },
      { name: 'restaurants', data: data.restaurants },
      { name: 'categories', data: data.categories },
      { name: 'dishes', data: data.dishes },
      { name: 'menus', data: data.menus },
      { name: 'dish_allergens', data: data.dishAllergens },
      { name: 'dish_ingredients', data: data.dishIngredients },
      { name: 'orders', data: data.orders },
      { name: 'order_items', data: data.orderItems },
    ]
    
    for (const table of tables) {
      if (table.data.length === 0) {
        console.log(`⏭️  Skipping ${table.name} (no data)`)
        continue
      }
      
      console.log(`📥 Importing ${table.data.length} records to ${table.name}...`)
      
      const { error } = await supabase
        .from(table.name)
        .insert(table.data)
      
      if (error) {
        console.error(`❌ Error importing ${table.name}:`, error)
      } else {
        console.log(`✅ Successfully imported ${table.name}`)
      }
    }
    
    console.log('🎉 Data import completed!')
    
  } catch (error) {
    console.error('❌ Error importing data:', error)
  }
}

importData()
