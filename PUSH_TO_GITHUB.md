# 📤 Push su GitHub - QR Menu AI

## 🚀 Istruzioni per il Push

Il repository è già configurato, ma serve l'autenticazione. Ecco come procedere:

### Opzione 1: Token di Accesso Personale (Raccomandato)

1. **Crea un token GitHub**:
   - Vai su GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Clicca "Generate new token (classic)"
   - Seleziona scopes: `repo` (full control of private repositories)
   - Copia il token generato

2. **Configura l'autenticazione**:
   ```bash
   cd /home/alanciotti/qrmenu
   git config --global user.name "renderman1999"
   git config --global user.email "renderman1999@gmail.com"
   ```

3. **Fai il push**:
   ```bash
   git push -u origin main
   ```
   - Username: `renderman1999`
   - Password: `[il-token-che-hai-generato]`

### Opzione 2: SSH Key (Alternativa)

1. **Genera una SSH key**:
   ```bash
   ssh-keygen -t ed25519 -C "renderman1999@gmail.com"
   ```

2. **Aggiungi la chiave a GitHub**:
   - Copia il contenuto di `~/.ssh/id_ed25519.pub`
   - Vai su GitHub → Settings → SSH and GPG keys → New SSH key
   - Incolla la chiave pubblica

3. **Cambia l'URL del remote**:
   ```bash
   git remote set-url origin git@github.com:renderman1999/qrmenuai.git
   git push -u origin main
   ```

### Opzione 3: GitHub CLI (Più semplice)

1. **Installa GitHub CLI**:
   ```bash
   curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
   sudo apt update
   sudo apt install gh
   ```

2. **Login e push**:
   ```bash
   gh auth login
   git push -u origin main
   ```

## 📁 File Pronti per il Push

Tutti i file sono già committati e pronti:
- ✅ Codice sorgente completo
- ✅ Configurazione Supabase
- ✅ Script di migrazione
- ✅ Configurazione Vercel
- ✅ Documentazione completa

## 🎯 Dopo il Push

Una volta fatto il push, potrai:
1. **Deploy su Vercel** direttamente da GitHub
2. **Configurare Supabase** seguendo `SUPABASE_SETUP.md`
3. **Importare i dati** con `node import-to-supabase.js`
4. **Configurare le variabili** in Vercel

## 🚀 Repository URL

https://github.com/renderman1999/qrmenuai
