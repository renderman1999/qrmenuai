import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const allergens = [
  { name: 'Glutine', description: 'Presente in grano, orzo, segale, avena', icon: '🌾' },
  { name: 'Latte', description: 'Latte e derivati del latte', icon: '🥛' },
  { name: 'Uova', description: 'Uova e prodotti contenenti uova', icon: '🥚' },
  { name: 'Soia', description: 'Soia e derivati della soia', icon: '🫘' },
  { name: 'Noci', description: 'Noci, mandorle, nocciole, pistacchi', icon: '🥜' },
  { name: 'Arachidi', description: 'Arachidi e derivati', icon: '🥜' },
  { name: 'Pesce', description: 'Pesce e derivati', icon: '🐟' },
  { name: 'Crostacei', description: 'Gamberi, granchi, aragoste', icon: '🦐' },
  { name: 'Sedano', description: 'Sedano e derivati', icon: '🥬' },
  { name: 'Senape', description: 'Senape e derivati', icon: '🌶️' },
  { name: 'Sesamo', description: 'Semi di sesamo e derivati', icon: '🌰' },
  { name: 'Solfiti', description: 'Anidride solforosa e solfiti', icon: '⚗️' },
  { name: 'Lupini', description: 'Lupini e derivati', icon: '🫘' },
  { name: 'Molluschi', description: 'Cozze, vongole, ostriche', icon: '🐚' }
]

const ingredients = [
  // Verdure
  { name: 'Pomodoro', description: 'Pomodoro fresco', category: 'Verdure' },
  { name: 'Cipolla', description: 'Cipolla fresca', category: 'Verdure' },
  { name: 'Aglio', description: 'Aglio fresco', category: 'Verdure' },
  { name: 'Basilico', description: 'Basilico fresco', category: 'Erbe' },
  { name: 'Prezzemolo', description: 'Prezzemolo fresco', category: 'Erbe' },
  { name: 'Oregano', description: 'Oregano secco', category: 'Erbe' },
  { name: 'Rosmarino', description: 'Rosmarino fresco', category: 'Erbe' },
  { name: 'Salvia', description: 'Salvia fresca', category: 'Erbe' },
  { name: 'Menta', description: 'Menta fresca', category: 'Erbe' },
  { name: 'Rucola', description: 'Rucola fresca', category: 'Verdure' },
  { name: 'Lattuga', description: 'Lattuga fresca', category: 'Verdure' },
  { name: 'Spinaci', description: 'Spinaci freschi', category: 'Verdure' },
  { name: 'Zucchine', description: 'Zucchine fresche', category: 'Verdure' },
  { name: 'Melanzane', description: 'Melanzane fresche', category: 'Verdure' },
  { name: 'Peperoni', description: 'Peperoni freschi', category: 'Verdure' },
  { name: 'Carote', description: 'Carote fresche', category: 'Verdure' },
  { name: 'Sedano', description: 'Sedano fresco', category: 'Verdure' },
  { name: 'Funghi', description: 'Funghi freschi', category: 'Verdure' },

  // Carne e Pesce
  { name: 'Pollo', description: 'Petto di pollo', category: 'Carne' },
  { name: 'Manzo', description: 'Carne di manzo', category: 'Carne' },
  { name: 'Maiale', description: 'Carne di maiale', category: 'Carne' },
  { name: 'Agnello', description: 'Carne di agnello', category: 'Carne' },
  { name: 'Salmone', description: 'Salmone fresco', category: 'Pesce' },
  { name: 'Tonno', description: 'Tonno fresco', category: 'Pesce' },
  { name: 'Branzino', description: 'Branzino fresco', category: 'Pesce' },
  { name: 'Gamberi', description: 'Gamberi freschi', category: 'Pesce' },
  { name: 'Cozze', description: 'Cozze fresche', category: 'Pesce' },
  { name: 'Vongole', description: 'Vongole fresche', category: 'Pesce' },

  // Latticini
  { name: 'Mozzarella', description: 'Mozzarella di bufala', category: 'Latticini' },
  { name: 'Parmigiano', description: 'Parmigiano Reggiano', category: 'Latticini' },
  { name: 'Pecorino', description: 'Pecorino Romano', category: 'Latticini' },
  { name: 'Gorgonzola', description: 'Gorgonzola DOP', category: 'Latticini' },
  { name: 'Ricotta', description: 'Ricotta fresca', category: 'Latticini' },
  { name: 'Burrata', description: 'Burrata fresca', category: 'Latticini' },
  { name: 'Stracchino', description: 'Stracchino fresco', category: 'Latticini' },

  // Pasta e Cereali
  { name: 'Pasta', description: 'Pasta di semola', category: 'Cereali' },
  { name: 'Riso', description: 'Riso Arborio', category: 'Cereali' },
  { name: 'Farro', description: 'Farro perlato', category: 'Cereali' },
  { name: 'Orzo', description: 'Orzo perlato', category: 'Cereali' },
  { name: 'Quinoa', description: 'Quinoa', category: 'Cereali' },
  { name: 'Pane', description: 'Pane fresco', category: 'Cereali' },
  { name: 'Focaccia', description: 'Focaccia', category: 'Cereali' },

  // Condimenti e Oli
  { name: 'Olio d\'oliva', description: 'Olio extravergine di oliva', category: 'Condimenti' },
  { name: 'Aceto balsamico', description: 'Aceto balsamico di Modena', category: 'Condimenti' },
  { name: 'Sale', description: 'Sale marino', category: 'Condimenti' },
  { name: 'Pepe', description: 'Pepe nero macinato', category: 'Condimenti' },
  { name: 'Olio di sesamo', description: 'Olio di sesamo', category: 'Condimenti' },
  { name: 'Salsa di soia', description: 'Salsa di soia', category: 'Condimenti' },
  { name: 'Worcestershire', description: 'Salsa Worcestershire', category: 'Condimenti' },

  // Frutta
  { name: 'Limone', description: 'Limone fresco', category: 'Frutta' },
  { name: 'Arancia', description: 'Arancia fresca', category: 'Frutta' },
  { name: 'Mela', description: 'Mela fresca', category: 'Frutta' },
  { name: 'Pera', description: 'Pera fresca', category: 'Frutta' },
  { name: 'Uva', description: 'Uva fresca', category: 'Frutta' },
  { name: 'Fichi', description: 'Fichi freschi', category: 'Frutta' },
  { name: 'Melograno', description: 'Melograno fresco', category: 'Frutta' },

  // Spezie
  { name: 'Cannella', description: 'Cannella in polvere', category: 'Spezie' },
  { name: 'Zenzero', description: 'Zenzero fresco', category: 'Spezie' },
  { name: 'Curcuma', description: 'Curcuma in polvere', category: 'Spezie' },
  { name: 'Cumino', description: 'Cumino in semi', category: 'Spezie' },
  { name: 'Coriandolo', description: 'Coriandolo fresco', category: 'Spezie' },
  { name: 'Cardamomo', description: 'Cardamomo in semi', category: 'Spezie' },
  { name: 'Chiodi di garofano', description: 'Chiodi di garofano', category: 'Spezie' }
]

async function main() {
  console.log('🌱 Seeding allergens and ingredients...')

  // Crea allergeni
  for (const allergen of allergens) {
    await prisma.allergen.upsert({
      where: { name: allergen.name },
      update: allergen,
      create: allergen
    })
  }

  // Crea ingredienti
  for (const ingredient of ingredients) {
    await prisma.ingredient.upsert({
      where: { name: ingredient.name },
      update: ingredient,
      create: ingredient
    })
  }

  console.log('✅ Allergens and ingredients seeded successfully!')
  console.log(`📊 Created ${allergens.length} allergens and ${ingredients.length} ingredients`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding allergens and ingredients:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
