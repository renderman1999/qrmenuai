export interface CategoryPreset {
  name: string
  description: string
  icon?: string
  sortOrder: number
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  // Italian Restaurant
  { name: 'Antipasti', description: 'Appetizers and starters', icon: '🥗', sortOrder: 1 },
  { name: 'Primi Piatti', description: 'First courses - pasta and risotto', icon: '🍝', sortOrder: 2 },
  { name: 'Secondi Piatti', description: 'Main courses - meat and fish', icon: '🥩', sortOrder: 3 },
  { name: 'Contorni', description: 'Side dishes', icon: '🥔', sortOrder: 4 },
  { name: 'Dolci', description: 'Desserts', icon: '🍰', sortOrder: 5 },
  { name: 'Bevande', description: 'Drinks', icon: '🍷', sortOrder: 6 },

  // American Restaurant
  { name: 'Appetizers', description: 'Starters and small plates', icon: '🥗', sortOrder: 1 },
  { name: 'Salads', description: 'Fresh salads', icon: '🥬', sortOrder: 2 },
  { name: 'Burgers', description: 'Gourmet burgers', icon: '🍔', sortOrder: 3 },
  { name: 'Main Courses', description: 'Steaks, chicken, seafood', icon: '🥩', sortOrder: 4 },
  { name: 'Sides', description: 'Side dishes', icon: '🍟', sortOrder: 5 },
  { name: 'Desserts', description: 'Sweet endings', icon: '🍰', sortOrder: 6 },
  { name: 'Beverages', description: 'Drinks and cocktails', icon: '🍹', sortOrder: 7 },

  // Asian Restaurant
  { name: 'Sushi & Sashimi', description: 'Fresh sushi and sashimi', icon: '🍣', sortOrder: 1 },
  { name: 'Ramen', description: 'Traditional ramen bowls', icon: '🍜', sortOrder: 2 },
  { name: 'Wok Dishes', description: 'Stir-fried specialties', icon: '🥘', sortOrder: 3 },
  { name: 'Appetizers', description: 'Small plates and starters', icon: '🥟', sortOrder: 4 },
  { name: 'Desserts', description: 'Asian desserts', icon: '🍮', sortOrder: 5 },
  { name: 'Beverages', description: 'Teas and drinks', icon: '🍵', sortOrder: 6 },

  // Pizza Restaurant
  { name: 'Pizza Margherita', description: 'Classic pizzas', icon: '🍕', sortOrder: 1 },
  { name: 'Pizza Speciali', description: 'Specialty pizzas', icon: '🍕', sortOrder: 2 },
  { name: 'Antipasti', description: 'Appetizers', icon: '🥗', sortOrder: 3 },
  { name: 'Insalate', description: 'Salads', icon: '🥬', sortOrder: 4 },
  { name: 'Dolci', description: 'Desserts', icon: '🍰', sortOrder: 5 },
  { name: 'Bevande', description: 'Drinks', icon: '🍺', sortOrder: 6 },

  // Cafe
  { name: 'Colazioni', description: 'Breakfast items', icon: '🥐', sortOrder: 1 },
  { name: 'Panini', description: 'Sandwiches and panini', icon: '🥪', sortOrder: 2 },
  { name: 'Insalate', description: 'Fresh salads', icon: '🥗', sortOrder: 3 },
  { name: 'Dolci', description: 'Pastries and desserts', icon: '🧁', sortOrder: 4 },
  { name: 'Caffè', description: 'Coffee and espresso', icon: '☕', sortOrder: 5 },
  { name: 'Tè', description: 'Tea selection', icon: '🍵', sortOrder: 6 },
  { name: 'Bevande Fredde', description: 'Cold drinks', icon: '🧊', sortOrder: 7 },

  // Bar
  { name: 'Cocktails', description: 'Signature cocktails', icon: '🍸', sortOrder: 1 },
  { name: 'Vini', description: 'Wine selection', icon: '🍷', sortOrder: 2 },
  { name: 'Birre', description: 'Beer selection', icon: '🍺', sortOrder: 3 },
  { name: 'Spirits', description: 'Premium spirits', icon: '🥃', sortOrder: 4 },
  { name: 'Analcolici', description: 'Non-alcoholic drinks', icon: '🥤', sortOrder: 5 },
  { name: 'Snacks', description: 'Bar snacks', icon: '🥜', sortOrder: 6 },

  // Fast Food
  { name: 'Combo', description: 'Meal deals', icon: '🍟', sortOrder: 1 },
  { name: 'Burgers', description: 'Burgers and sandwiches', icon: '🍔', sortOrder: 2 },
  { name: 'Chicken', description: 'Chicken specialties', icon: '🍗', sortOrder: 3 },
  { name: 'Sides', description: 'Fries and sides', icon: '🍟', sortOrder: 4 },
  { name: 'Desserts', description: 'Sweet treats', icon: '🍦', sortOrder: 5 },
  { name: 'Beverages', description: 'Drinks', icon: '🥤', sortOrder: 6 },

  // Fine Dining
  { name: 'Amuse Bouche', description: 'Chef\'s welcome', icon: '🍽️', sortOrder: 1 },
  { name: 'Antipasti', description: 'Appetizers', icon: '🦐', sortOrder: 2 },
  { name: 'Primi', description: 'First courses', icon: '🍝', sortOrder: 3 },
  { name: 'Secondi', description: 'Main courses', icon: '🥩', sortOrder: 4 },
  { name: 'Formaggi', description: 'Cheese selection', icon: '🧀', sortOrder: 5 },
  { name: 'Dolci', description: 'Desserts', icon: '🍰', sortOrder: 6 },
  { name: 'Vini', description: 'Wine pairing', icon: '🍷', sortOrder: 7 }
]

export function getCategoryPresetsByType(type: 'italian' | 'american' | 'asian' | 'pizza' | 'cafe' | 'bar' | 'fastfood' | 'finedining'): CategoryPreset[] {
  const typeMap = {
    italian: [0, 1, 2, 3, 4, 5], // Antipasti, Primi, Secondi, Contorni, Dolci, Bevande
    american: [6, 7, 8, 9, 10, 11, 12], // Appetizers, Salads, Burgers, Main, Sides, Desserts, Beverages
    asian: [13, 14, 15, 16, 17, 18], // Sushi, Ramen, Wok, Appetizers, Desserts, Beverages
    pizza: [19, 20, 21, 22, 23, 24], // Pizza Margherita, Speciali, Antipasti, Insalate, Dolci, Bevande
    cafe: [25, 26, 27, 28, 29, 30, 31], // Colazioni, Panini, Insalate, Dolci, Caffè, Tè, Bevande Fredde
    bar: [32, 33, 34, 35, 36, 37], // Cocktails, Vini, Birre, Spirits, Analcolici, Snacks
    fastfood: [38, 39, 40, 41, 42, 43], // Combo, Burgers, Chicken, Sides, Desserts, Beverages
    finedining: [44, 45, 46, 47, 48, 49, 50] // Amuse, Antipasti, Primi, Secondi, Formaggi, Dolci, Vini
  }
  
  return typeMap[type].map(index => CATEGORY_PRESETS[index])
}
