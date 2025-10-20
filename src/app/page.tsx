export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">🍽️ QR Menu AI</div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Caratteristiche</a>
              <a href="#benefits" className="text-gray-600 hover:text-blue-600 transition-colors">Vantaggi</a>
              <a href="#demo" className="text-gray-600 hover:text-blue-600 transition-colors">Demo</a>
            </nav>
            <div className="flex space-x-4">
              <a 
                href="/menu/RISTORANTE1" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Vedi Demo
              </a>
            </div>
          </div>
      </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Il Menu del Futuro
            <span className="block text-blue-600">è Arrivato</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Trasforma il tuo ristorante con menu digitali intelligenti. 
            I tuoi clienti scansionano un QR code e ricevono consigli personalizzati 
            da un assistente AI che conosce ogni piatto del tuo menu.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a 
              href="/menu/RISTORANTE1" 
              className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
            >
              🍽️ Prova il Menu Demo
            </a>
            <a 
              href="#features" 
              className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-all"
            >
              Scopri di Più
            </a>
          </div>
          
          {/* Hero Image Placeholder */}
          <div className="bg-gradient-to-r from-blue-100 to-green-100 rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-center space-x-4 mb-4">
           
                <div className="text-left">
                  <h3 className="text-lg font-semibold">Menu Interattivo</h3>
                  <p className="text-gray-600">Scansiona e scopri</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">🍝 Pasta alla Norma</h4>
                  <p className="text-sm text-gray-600">€18 - Piatto tradizionale siciliano</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Vegetariano</span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Senza glutine</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">🤖 Assistente AI</h4>
                  <p className="text-sm text-gray-600">"Ti consiglio la Pasta alla Norma, perfetta per chi ama i sapori mediterranei!"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Perché Scegliere QR Menu AI?
            </h2>
            <p className="text-xl text-gray-600">
              La tecnologia più avanzata per il tuo ristorante
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 hover:shadow-lg transition-all">
               <h3 className="text-2xl font-bold text-gray-900 mb-4">Assistente AI Intelligente</h3>
              <p className="text-gray-600 mb-4">
                I tuoi clienti possono chiedere consigli personalizzati. L'AI conosce ogni ingrediente, 
                allergene e caratteristica dei tuoi piatti.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• "Cosa mi consigli per chi è vegetariano?"</li>
                <li>• "Ci sono piatti senza glutine?"</li>
                <li>• "Qual è il piatto più piccante?"</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 hover:shadow-lg transition-all">
               <h3 className="text-2xl font-bold text-gray-900 mb-4">Menu Senza Contatto</h3>
              <p className="text-gray-600 mb-4">
                Un semplice QR code sul tavolo. I clienti scansionano con il telefono 
                e accedono al menu completo, sempre aggiornato.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Nessun menu da stampare</li>
                <li>• Aggiornamenti istantanei</li>
                <li>• Immagini ad alta qualità</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 hover:shadow-lg transition-all">
               <h3 className="text-2xl font-bold text-gray-900 mb-4">Super Veloce</h3>
              <p className="text-gray-600 mb-4">
                Risposte istantanee grazie alla tecnologia di cache avanzata. 
                I tuoi clienti non aspettano mai.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Caricamento in meno di 1 secondo</li>
                <li>• Funziona anche offline</li>
                <li>• Ottimizzato per tutti i dispositivi</li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 hover:shadow-lg transition-all">
               <h3 className="text-2xl font-bold text-gray-900 mb-4">Gestione Facile</h3>
              <p className="text-gray-600 mb-4">
                Aggiungi, modifica o rimuovi piatti in tempo reale. 
                Cambia prezzi, ingredienti e disponibilità all'istante.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Pannello di controllo intuitivo</li>
                <li>• Modifiche in tempo reale</li>
                <li>• Gestione allergeni automatica</li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-8 hover:shadow-lg transition-all">
               <h3 className="text-2xl font-bold text-gray-900 mb-4">Statistiche Avanzate</h3>
              <p className="text-gray-600 mb-4">
                Scopri quali piatti sono più popolari, quando i clienti visitano 
                il menu e molto altro per ottimizzare il tuo business.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Piatti più visualizzati</li>
                <li>• Orari di maggior traffico</li>
                <li>• Domande più frequenti</li>
              </ul>
            </div>
            
            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-8 hover:shadow-lg transition-all">
               <h3 className="text-2xl font-bold text-gray-900 mb-4">Sicuro e Affidabile</h3>
              <p className="text-gray-600 mb-4">
                I dati dei tuoi clienti sono protetti con crittografia avanzata. 
                Sistema sempre attivo, 24/7.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Crittografia end-to-end</li>
                <li>• Backup automatici</li>
                <li>• Conformità GDPR</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              I Vantaggi per il Tuo Ristorante
            </h2>
            <p className="text-xl text-gray-600">
              Risultati concreti che vedrai fin dal primo giorno
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Risparmia Tempo e Denaro
              </h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">Niente più stampa menu</h4>
                    <p className="text-gray-600">Risparmia centinaia di euro ogni mese in stampa e plastificazione</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">Aggiornamenti istantanei</h4>
                    <p className="text-gray-600">Cambia prezzi e disponibilità senza sprecare carta</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">Meno personale necessario</h4>
                    <p className="text-gray-600">L'AI risponde alle domande dei clienti, liberando il personale</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h4 className="text-2xl font-bold text-gray-900 mb-6 text-center">Calcola il Tuo Risparmio</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Menu stampati al mese:</span>
                  <span className="font-semibold">€150</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Tempo personale risparmiato:</span>
                  <span className="font-semibold">€200</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Aggiornamenti menu:</span>
                  <span className="font-semibold">€50</span>
                </div>
                <div className="flex justify-between items-center py-4 bg-green-50 rounded-lg">
                  <span className="text-lg font-bold text-green-600">Risparmio mensile:</span>
                  <span className="text-2xl font-bold text-green-600">€400</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Prova Subito il Menu Demo
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Scansiona il QR code o clicca il pulsante per vedere come funziona
          </p>
          
          <div className="bg-gradient-to-r from-blue-100 to-green-100 rounded-2xl p-8 max-w-2xl mx-auto mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl">📱</span>
              </div>
              <p className="text-gray-600 mb-4">QR Code per il menu demo</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/menu/RISTORANTE1" 
              className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
            >
              🍽️ Apri Menu Demo
            </a>
            <a 
              href="/admin-login" 
              className="bg-gray-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-700 transition-all"
            >
              🔧 Pannello Amministrazione
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-2xl font-bold mb-4">🍽️ QR Menu AI</div>
          <p className="text-gray-400 mb-6">
            Tecnologia innovativa per la ristorazione digitale
          </p>
          <div className="flex justify-center space-x-6">
            <a href="/menu/RISTORANTE1" className="text-gray-400 hover:text-white transition-colors">Demo</a>
            <a href="/admin-login" className="text-gray-400 hover:text-white transition-colors">Login</a>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-gray-400 text-sm">
            © 2024 QR Menu AI. Tutti i diritti riservati.
          </div>
        </div>
      </footer>
      </div>
  )
}