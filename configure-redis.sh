#!/bin/bash

# Script per configurare Redis con password per sicurezza
echo "🔐 Configurando Redis con password per sicurezza..."

# Configura password temporaneamente
redis-cli CONFIG SET requirepass "S@miro2006"

# Salva configurazione permanentemente
redis-cli CONFIG REWRITE

echo "✅ Redis configurato con password: S@miro2006"
echo "🔒 La password è salvata nel file .env del progetto"
echo "⚠️  IMPORTANTE: La password è temporanea, per produzione usa una password più sicura"

# Test connessione
echo "🧪 Testando connessione..."
redis-cli -a "S@miro2006" ping

echo "✅ Configurazione completata!"
