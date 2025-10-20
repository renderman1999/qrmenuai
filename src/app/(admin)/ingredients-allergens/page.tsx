import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faLeaf, 
  faExclamationTriangle, 
  faPlus,
  faEdit,
  faList
} from '@fortawesome/free-solid-svg-icons'

export default async function IngredientsAllergensPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/admin-login')
  }

  // Verifica che l'utente sia admin
  if (session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestione Ingredienti e Allergeni</h1>
          <p className="text-gray-600 mt-2">
            Gestisci gli ingredienti e gli allergeni disponibili nel sistema per tutti i ristoranti
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ingredienti Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FontAwesomeIcon icon={faLeaf} className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Ingredienti</h3>
                  <p className="text-sm text-gray-600">Gestisci gli ingredienti</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Link
                href="/admin/ingredients"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faList} className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Visualizza tutti gli ingredienti</span>
                </div>
                <FontAwesomeIcon icon={faEdit} className="h-4 w-4 text-gray-400" />
              </Link>
              
              <Link
                href="/admin/ingredients"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faPlus} className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Aggiungi nuovo ingrediente</span>
                </div>
                <FontAwesomeIcon icon={faEdit} className="h-4 w-4 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Allergeni Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Allergeni</h3>
                  <p className="text-sm text-gray-600">Gestisci gli allergeni</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Link
                href="/admin/allergens"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faList} className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Visualizza tutti gli allergeni</span>
                </div>
                <FontAwesomeIcon icon={faEdit} className="h-4 w-4 text-gray-400" />
              </Link>
              
              <Link
                href="/admin/allergens"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faPlus} className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Aggiungi nuovo allergene</span>
                </div>
                <FontAwesomeIcon icon={faEdit} className="h-4 w-4 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* Informazioni */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Informazioni</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>Ingredienti:</strong> Gestisci gli ingredienti disponibili per i piatti. Organizzati per categorie (Verdure, Carne, Pesce, etc.)</p>
            <p>• <strong>Allergeni:</strong> Gestisci gli allergeni con icone emoji per una visualizzazione chiara nei menu</p>
            <p>• <strong>Sicurezza:</strong> Non è possibile eliminare ingredienti/allergeni utilizzati nei piatti. Disattivali invece</p>
            <p>• <strong>Accesso:</strong> Solo gli amministratori possono gestire ingredienti e allergeni</p>
          </div>
        </div>
      </div>
    </div>
  )
}
