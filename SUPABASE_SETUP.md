# 🚀 Setup Supabase per QR Menu AI

## 1. Crea un progetto Supabase

1. Vai su [supabase.com](https://supabase.com)
2. Clicca "Start your project"
3. Crea un nuovo progetto
4. Scegli un nome: `qrmenu-ai`
5. Scegli una password sicura per il database
6. Scegli una regione (preferibilmente Europa per performance)

## 2. Configura le variabili d'ambiente

Nel file `.env`, aggiungi:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Dove trovare le chiavi:

1. **NEXT_PUBLIC_SUPABASE_URL**: Dashboard → Settings → API → Project URL
2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Dashboard → Settings → API → Project API keys → anon public
3. **SUPABASE_SERVICE_ROLE_KEY**: Dashboard → Settings → API → Project API keys → service_role

## 3. Crea le tabelle in Supabase

1. Vai su Dashboard → SQL Editor
2. Esegui questo script SQL (basato sul tuo schema Prisma):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  isActive BOOLEAN NOT NULL DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allergens table
CREATE TABLE allergens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  isActive BOOLEAN NOT NULL DEFAULT true,
  availability JSON,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ingredients table
CREATE TABLE ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  isActive BOOLEAN NOT NULL DEFAULT true,
  availability JSON,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurants table
CREATE TABLE restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo TEXT,
  coverImage TEXT,
  isActive BOOLEAN NOT NULL DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  restaurantId TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  isActive BOOLEAN NOT NULL DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dishes table
CREATE TABLE dishes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image TEXT,
  galleryEnabled BOOLEAN NOT NULL DEFAULT false,
  galleryImages JSON,
  isActive BOOLEAN NOT NULL DEFAULT true,
  availability JSON,
  isVegetarian BOOLEAN NOT NULL DEFAULT false,
  isVegan BOOLEAN NOT NULL DEFAULT false,
  isGlutenFree BOOLEAN NOT NULL DEFAULT false,
  isSpicy BOOLEAN NOT NULL DEFAULT false,
  nutrition JSON,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  aiAnalyzed BOOLEAN NOT NULL DEFAULT false,
  aiRecommendations JSON,
  menuId TEXT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  categoryId TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menus table
CREATE TABLE menus (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  restaurantId TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  isActive BOOLEAN NOT NULL DEFAULT true,
  availability JSON,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dish Allergens junction table
CREATE TABLE dish_allergens (
  id TEXT PRIMARY KEY,
  dishId TEXT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  allergenId TEXT NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dish Ingredients junction table
CREATE TABLE dish_ingredients (
  id TEXT PRIMARY KEY,
  dishId TEXT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  ingredientId TEXT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  restaurantId TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  menuId TEXT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  tableNumber TEXT,
  customerName TEXT,
  customerPhone TEXT,
  totalAmount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  kitchenNotes TEXT,
  estimatedTime INTEGER,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items table
CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  dishId TEXT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_categories_restaurant ON categories(restaurantId);
CREATE INDEX idx_dishes_menu ON dishes(menuId);
CREATE INDEX idx_dishes_category ON dishes(categoryId);
CREATE INDEX idx_menus_restaurant ON menus(restaurantId);
CREATE INDEX idx_orders_restaurant ON orders(restaurantId);
CREATE INDEX idx_order_items_order ON order_items(orderId);
```

## 4. Importa i dati

Dopo aver configurato le variabili d'ambiente:

```bash
node import-to-supabase.js
```

## 5. Aggiorna DATABASE_URL per Vercel

Per Vercel, aggiorna la `DATABASE_URL` con la stringa di connessione Supabase:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

La stringa di connessione si trova in:
Dashboard → Settings → Database → Connection string → URI
