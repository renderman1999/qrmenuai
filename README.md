# 🍽️ QR Menu AI - Sistema di Menu Digitale Intelligente

Sistema completo per la gestione di menu digitali per ristoranti con QR code, chatbot AI e pannello amministrativo.

## 🚀 Caratteristiche Principali

- **Menu Digitali QR Code**: I clienti scansionano un QR code e accedono al menu completo
- **Chatbot AI Intelligente**: Assistente virtuale powered by OpenAI che risponde a domande sul menu
- **Gestione Multi-Ristorante**: Supporto per più ristoranti con gestione separata
- **Admin Dashboard**: Pannello completo per gestione menu, piatti, categorie e ordini
- **Sistema Ordini**: I clienti possono ordinare direttamente dal menu digitale
- **Gestione Allergeni e Ingredienti**: Database completo con associazioni automatiche
- **Analytics**: Statistiche su scansioni QR, piatti più visualizzati, etc.
- **Landing Page Personalizzate**: Ogni ristorante ha la sua landing page con articoli e recensioni
- **Cache Avanzato**: Sistema di cache con Redis per performance ottimali
- **Responsive Design**: Ottimizzato per mobile, tablet e desktop

## 🛠️ Stack Tecnologico

### Frontend
- **Next.js 15.5.5** - React framework con App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons
- **TipTap** - Rich text editor per articoli

### Backend
- **Next.js API Routes** - Backend API
- **Prisma 6.17** - ORM
- **MySQL** - Database principale
- **Redis (Upstash)** - Caching layer
- **NextAuth 5** - Autenticazione

### AI & ML
- **OpenAI GPT-4** - Chatbot intelligente
- **AI Analysis** - Analisi automatica piatti

### Tools & Services
- **QR Code Generation** - Generazione QR codes
- **Sharp** - Image processing
- **Winston** - Logging
- **Zod** - Schema validation
- **Swagger** - API documentation

## 📁 Struttura Progetto

```
qrmenu/
├── prisma/
│   ├── schema.prisma              # Schema database
│   ├── migrations/                # Migration database
│   └── seed.ts                    # Seed data
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (admin)/              # Admin routes
│   │   ├── (customer)/           # Customer-facing routes
│   │   ├── admin-dashboard/      # Dashboard principale
│   │   ├── api/                  # API routes
│   │   │   ├── dishes/          # Gestione piatti
│   │   │   ├── menus/           # Gestione menu
│   │   │   ├── restaurants/     # Gestione ristoranti
│   │   │   ├── orders/          # Sistema ordini
│   │   │   ├── ai/              # AI chatbot
│   │   │   └── ...
│   │   └── page.tsx             # Landing page principale
│   ├── components/               # React components
│   │   ├── MenuDisplay.tsx      # Visualizzazione menu
│   │   ├── RestaurantLanding.tsx # Landing ristorante
│   │   ├── Chatbot.tsx          # AI chatbot
│   │   ├── DishDetailModal.tsx  # Dettaglio piatto
│   │   └── ...
│   ├── lib/
│   │   ├── db/                  # Database utilities
│   │   ├── ai/                  # AI integration
│   │   ├── cache/               # Cache system
│   │   └── auth/                # Authentication
│   └── types/                   # TypeScript types
├── public/                       # Static files
└── scripts/                      # Utility scripts
```

## 🗄️ Schema Database

### Entità Principali

- **Users**: Utenti del sistema (admin, restaurant owners)
- **Restaurants**: Ristoranti registrati
- **Menus**: Menu dei ristoranti (un ristorante può avere più menu)
- **Categories**: Categorie dei menu (Antipasti, Primi, etc.)
- **Dishes**: Piatti con descrizione, prezzo, allergeni, ingredienti
- **Allergens**: Database allergeni
- **Ingredients**: Database ingredienti
- **QRCodes**: QR codes generati per menu/ristoranti
- **Orders**: Ordini effettuati dai clienti
- **Articles**: Articoli/blog per landing page ristorante
- **Reviews**: Recensioni clienti
- **Analytics**: Dati analitici

### Relazioni

```
Restaurant → Menus → Categories → Dishes
Dishes ↔ Allergens (many-to-many)
Dishes ↔ Ingredients (many-to-many)
Restaurant → QRCodes
Restaurant → Orders → OrderItems → Dishes
Restaurant → Articles
Restaurant → Reviews
```

## 🚀 Setup e Installazione

### Prerequisiti

- Node.js 20+
- MySQL 8.0+
- Redis (optional, per cache)
- Account OpenAI con API key

### Installazione

1. **Clone repository**
```bash
git clone <repository-url>
cd qrmenu
```

2. **Installa dipendenze**
```bash
npm install
```

3. **Configura variabili ambiente**

Crea file `.env` nella root del progetto:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/qrmenu"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-min-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-your-openai-api-key"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

4. **Setup database**
```bash
# Genera Prisma client
npx prisma generate

# Crea/aggiorna tabelle database
npx prisma db push

# Popola database con dati iniziali
npx prisma db seed
```

5. **Avvia sviluppo**
```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

## 📝 Script Disponibili

```bash
npm run dev          # Sviluppo (porta 3000)
npm run build        # Build production con Turbopack
npm run start        # Avvia production
npm run lint         # Linting
npm run db:generate  # Genera Prisma client
npm run db:push      # Push schema a database
npm run db:seed      # Seed database
npm run db:studio    # Apri Prisma Studio (GUI database)
```

## 🎯 Utilizzo

### Per Amministratori/Proprietari Ristorante

1. **Accesso Admin Dashboard**
   - Vai su `/admin-login`
   - Effettua login con credenziali

2. **Gestione Ristorante**
   - Crea/modifica informazioni ristorante
   - Upload logo e immagine copertina
   - Configura social links e contatti
   - Abilita/disabilita ordini e chatbot

3. **Gestione Menu**
   - Crea menu (un ristorante può avere più menu: pranzo, cena, drinks, etc.)
   - Organizza categorie (Antipasti, Primi, Secondi, etc.)
   - Aggiungi piatti con:
     - Nome, descrizione, prezzo
     - Immagini (singola o galleria)
     - Allergeni e ingredienti
     - Caratteristiche dietetiche (vegetariano, vegano, gluten-free, piccante)

4. **QR Codes**
   - Genera QR codes per ogni menu
   - Scarica e stampa per i tavoli
   - Monitora scansioni e analytics

5. **Gestione Ordini**
   - Ricevi ordini in tempo reale
   - Cambia stato ordine (in preparazione, pronto, etc.)
   - Visualizza storico ordini

6. **Contenuti**
   - Pubblica articoli/news sul ristorante
   - Gestisci recensioni clienti
   - Visualizza analytics e statistiche

### Per Clienti

1. **Accesso Menu**
   - Scansiona QR code dal tavolo
   - Oppure accedi via URL diretto `/menu/{slug-ristorante}`

2. **Navigazione Menu**
   - Visualizza categorie e piatti
   - Filtra per caratteristiche (vegetariano, senza glutine, etc.)
   - Cerca piatti specifici
   - Vedi dettagli completi piatto (ingredienti, allergeni, galleria foto)

3. **Chatbot AI**
   - Chiedi consigli: "Cosa mi consigli per chi è vegetariano?"
   - Informazioni: "Quali piatti contengono arachidi?"
   - Suggerimenti: "Qual è il piatto più piccante?"

4. **Ordini** (se abilitato)
   - Aggiungi piatti al carrello
   - Inserisci numero tavolo
   - Invia ordine alla cucina
   - Ricevi conferma ordine

5. **Recensioni**
   - Lascia recensioni e rating
   - Condividi esperienza

## 🤖 Chatbot AI

Il chatbot è un assistente virtuale intelligente con context awareness completo:

### Funzionalità
- ✅ Conosce tutti i piatti del menu in tempo reale
- ✅ Suggerisce piatti basandosi su preferenze dietetiche
- ✅ Risponde a domande su allergeni e ingredienti
- ✅ Gestisce richieste personalizzate
- ✅ Può aggiungere piatti al carrello (se ordini abilitati)
- ✅ Tono friendly e professionale

### Esempi Domande
```
"Cosa mi consigli se sono vegetariano?"
"Ci sono piatti senza glutine?"
"Qual è il vostro piatto più piccante?"
"Quali primi avete oggi?"
"Ho allergia alle arachidi, cosa posso mangiare?"
```

### Tecnologia
- Powered by OpenAI GPT-4
- Context injection con menu completo
- Cache delle risposte per performance
- Configurabile on/off per ristorante

## 🔐 Autenticazione e Autorizzazione

### Sistema NextAuth 5

**Ruoli Utente:**
- `ADMIN`: Accesso completo sistema
- `RESTAURANT_OWNER`: Gestione propri ristoranti
- `CUSTOMER`: Accesso pubblico menu

**Features:**
- Login con email/password (bcrypt hashing)
- Session management sicuro
- Protected API routes
- CSRF protection

### Sicurezza
- Password hashin con bcrypt
- Session tokens sicuri
- Rate limiting su API critiche
- Input validation con Zod
- SQL injection protection (Prisma ORM)

## 📊 Analytics e Statistiche

Dashboard analytics include:

- **QR Code Scans**
  - Numero scansioni per periodo
  - Distribuzione oraria/giornaliera
  - IP e location (se disponibile)

- **Menu Performance**
  - Piatti più visualizzati
  - Click su dettagli piatto
  - Tempo medio di permanenza

- **Ordini**
  - Ordini per periodo
  - Piatti più ordinati
  - Revenue tracking
  - Orari di maggior traffico

- **Chatbot**
  - Domande più frequenti
  - Piatti più menzionati
  - Engagement rate

## 🎨 Personalizzazione Ristorante

Ogni ristorante può personalizzare:

### Brand Identity
- Logo (header e favicon)
- Immagine copertina
- Nome e descrizione
- Colori tema (futuro)

### Contenuti
- Articoli e news
- Gallerie foto
- Video promozionali (YouTube embed)
- Recensioni clienti

### Funzionalità
- ✅/❌ Abilita/disabilita ordini online
- ✅/❌ Abilita/disabilita chatbot AI
- ✅/❌ Abilita/disabilita Telegram notifications
- Orari di disponibilità menu
- Informazioni allergeni

### Social & Contatti
- Instagram, Facebook, WhatsApp links
- Indirizzo completo
- Telefono
- Email
- Sito web

## 🚢 Deploy in Produzione

### Vercel (Configurazione Attuale)

1. **Setup Repository**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

2. **Deploy su Vercel**
   - Vai su [vercel.com](https://vercel.com)
   - Importa repository GitHub
   - Configura variabili ambiente
   - Deploy automatico

3. **Variabili Ambiente Vercel**
   - Vai su Project Settings → Environment Variables
   - Aggiungi tutte le variabili da `.env`:
     ```
     DATABASE_URL
     NEXTAUTH_SECRET
     NEXTAUTH_URL (es: https://your-domain.vercel.app)
     OPENAI_API_KEY
     UPSTASH_REDIS_REST_URL
     UPSTASH_REDIS_REST_TOKEN
     ```

### Database MySQL

Il progetto supporta:
- **Sviluppo**: MySQL locale
- **Produzione**: Supabase MySQL hosted (configurazione attuale)

**Setup Supabase:**
1. Crea progetto su [supabase.com](https://supabase.com)
2. Ottieni connection string MySQL
3. Aggiorna `DATABASE_URL` in Vercel
4. Esegui migrations: `npx prisma db push`

### Redis Cache

**Upstash Redis** (configurazione attuale):
1. Crea database su [upstash.com](https://upstash.com)
2. Copia REST URL e Token
3. Aggiungi a variabili ambiente

## 📚 API Documentation

API documentation completa disponibile su:
- **Development**: `http://localhost:3000/api-docs`
- **Production**: `https://your-domain.vercel.app/api-docs`

Swagger UI interattivo con tutti gli endpoints documentati.

### Principali Endpoints

```
POST   /api/restaurants        # Crea ristorante
GET    /api/restaurants/:id    # Dettagli ristorante
PUT    /api/restaurants/:id    # Aggiorna ristorante

POST   /api/menus              # Crea menu
GET    /api/menus/:id          # Dettagli menu
PUT    /api/menus/:id          # Aggiorna menu

POST   /api/dishes             # Crea piatto
GET    /api/dishes/:id         # Dettagli piatto
PUT    /api/dishes/:id         # Aggiorna piatto

POST   /api/orders             # Crea ordine
GET    /api/orders/:id         # Dettagli ordine
PUT    /api/orders/:id         # Aggiorna stato ordine

POST   /api/ai/chat            # Chat con AI
POST   /api/ai/analyze         # Analizza piatto con AI

GET    /api/allergens          # Lista allergeni
GET    /api/ingredients        # Lista ingredienti
```

## 🔄 Roadmap - Prossime Features

### In Development
- [ ] **Sistema Multilingua** (IT/EN/ES)
  - Traduzioni automatiche con AI
  - Gestione manuale traduzioni
  - Language selector automatico

### Planned
- [ ] Temi colore personalizzabili per ristorante
- [ ] Integrazione pagamenti online (Stripe)
- [ ] App mobile nativa (React Native)
- [ ] Sistema prenotazioni tavoli
- [ ] Programma fedeltà/loyalty
- [ ] Notifiche push per ordini
- [ ] WhatsApp integration per ordini
- [ ] Export dati analytics (PDF/Excel)
- [ ] Multi-currency support
- [ ] Menu allergen scanner (foto riconoscimento)

## 🐛 Troubleshooting

### Errori Comuni

**Errore: "Database connection failed"**
```bash
# Verifica DATABASE_URL sia corretto
echo $DATABASE_URL

# Testa connessione
npx prisma db push
```

**Errore: "OpenAI API key invalid"**
```bash
# Verifica API key
echo $OPENAI_API_KEY

# Deve iniziare con "sk-"
```

**Errore: "Redis connection timeout"**
```bash
# L'app funziona anche senza Redis (usa fallback)
# Ma per production è raccomandato
```

**Problema: Immagini non si caricano**
- Verifica Sharp sia installato: `npm install sharp`
- Check permissions cartella `/public/uploads`

## 📄 Licenza

Questo progetto è proprietario. Tutti i diritti riservati.

## 👥 Team

**Developer:** Alessandro Lanciotti

## 🙏 Credits & Ringraziamenti

- [OpenAI](https://openai.com) - GPT-4 API
- [Vercel](https://vercel.com) - Hosting e deployment
- [Next.js](https://nextjs.org) - React framework
- [Prisma](https://prisma.io) - Database ORM
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Upstash](https://upstash.com) - Redis serverless
- [Supabase](https://supabase.com) - Database hosting

---

