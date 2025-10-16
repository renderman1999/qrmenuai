# 🚀 Deployment su Vercel - QR Menu AI

## 1. Preparazione GitHub

Prima di tutto, assicurati che il codice sia su GitHub:

```bash
# Se non hai ancora fatto il push
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

## 2. Configurazione Vercel

### Opzione A: Vercel CLI (Raccomandato)

```bash
# Installa Vercel CLI
npm i -g vercel

# Login su Vercel
vercel login

# Deploy dal progetto
cd /home/alanciotti/qrmenu
vercel

# Segui le istruzioni:
# - Link to existing project? N
# - Project name: qrmenu-ai
# - Directory: ./
# - Override settings? N
```

### Opzione B: Dashboard Vercel

1. Vai su [vercel.com](https://vercel.com)
2. Clicca "New Project"
3. Importa da GitHub: `renderman1999/qrmenuai`
4. Configura le variabili d'ambiente

## 3. Variabili d'ambiente per Vercel

Nel dashboard Vercel, vai su Settings → Environment Variables e aggiungi:

### Database
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE-ROLE-KEY]
```

### Redis (Upstash)
```
UPSTASH_REDIS_REST_URL=https://bright-dove-17109.upstash.io
UPSTASH_REDIS_REST_TOKEN=AULVAAIncDJmNzQ1ZTA4NTFlMjQ0MWM5OTNkZmRlNmI0YTdiZmYyY3AyMTcxMDk
```

### NextAuth
```
NEXTAUTH_SECRET=[GENERA-UNA-CHIAVE-SICURA]
NEXTAUTH_URL=https://[TUO-DOMAIN].vercel.app
```

### OpenAI
```
OPENAI_API_KEY=[YOUR-OPENAI-API-KEY]
```

### Encryption
```
ENCRYPTION_KEY=[GENERA-UNA-CHIAVE-32-CARATTERI]
```

## 4. Configurazione Supabase per Produzione

1. **Crea le tabelle** usando lo script SQL in `SUPABASE_SETUP.md`
2. **Importa i dati** usando `node import-to-supabase.js`
3. **Configura RLS (Row Level Security)** se necessario

## 5. Test del Deployment

Dopo il deployment:

1. **Testa la homepage**: `https://[tuo-domain].vercel.app`
2. **Testa il menu pubblico**: `https://[tuo-domain].vercel.app/menu/RISTORANTE1`
3. **Testa il chatbot**: Verifica che risponda correttamente
4. **Testa l'admin**: `https://[tuo-domain].vercel.app/admin-dashboard`

## 6. Domini personalizzati (Opzionale)

Se hai un dominio personalizzato:

1. Vai su Vercel Dashboard → Project → Settings → Domains
2. Aggiungi il tuo dominio
3. Configura i DNS records come indicato

## 7. Monitoraggio

- **Vercel Analytics**: Abilita per monitorare le performance
- **Logs**: Dashboard → Functions → View Function Logs
- **Uptime**: Monitora la disponibilità del servizio

## 🎉 Completato!

Il tuo QR Menu AI è ora live su Vercel con:
- ✅ Database Supabase (PostgreSQL)
- ✅ Cache Redis (Upstash)
- ✅ AI Chatbot funzionante
- ✅ Sistema di gestione completo
- ✅ Performance ottimizzate
