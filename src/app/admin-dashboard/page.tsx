'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Trash2 } from 'lucide-react'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import ProfileManager from '@/components/admin/ProfileManager'
import AIConfigManager from '@/components/admin/AIConfigManager'

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true)
  const [showDeleteRestaurant, setShowDeleteRestaurant] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'system' | 'ai-config'>('dashboard')
  
  // System management states
  const [allRestaurants, setAllRestaurants] = useState<any[]>([])
  const [restaurantOwners, setRestaurantOwners] = useState<any[]>([])
  const [isLoadingSystemData, setIsLoadingSystemData] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/admin-login')
      return
    }
    
    if (session?.user?.email) {
      loadUserProfile()
      loadUserRestaurants(session.user.email)
    }
  }, [session, status, router])

  useEffect(() => {
    if (activeTab === 'system' && session?.user?.role === 'ADMIN') {
      loadSystemData()
    }
  }, [activeTab, session])

  const loadUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.user)
      }
    } catch (error) {
      console.error('Errore nel caricamento del profilo:', error)
    }
  }

  const loadUserRestaurants = async (userEmail: string) => {
    setIsLoadingRestaurants(true)
    try {
      const response = await fetch('/api/restaurants', {
        headers: {
          'x-user-email': userEmail
        }
      })
      if (response.ok) {
        const data = await response.json()
        setRestaurants(data.restaurants)
      }
    } catch (error) {
      console.error('Errore nel caricamento dei ristoranti:', error)
    } finally {
      setIsLoadingRestaurants(false)
    }
  }

  const loadSystemData = async () => {
    setIsLoadingSystemData(true)
    try {
      // Carica tutti i ristoranti
      const restaurantsResponse = await fetch('/api/admin/all-restaurants')
      if (restaurantsResponse.ok) {
        const restaurantsData = await restaurantsResponse.json()
        setAllRestaurants(restaurantsData.restaurants)
      }

      // Carica tutti i proprietari di ristoranti
      const ownersResponse = await fetch('/api/admin/restaurant-owners')
      if (ownersResponse.ok) {
        const ownersData = await ownersResponse.json()
        setRestaurantOwners(ownersData.owners)
      }
    } catch (error) {
      console.error('Errore nel caricamento dei dati del sistema:', error)
    } finally {
      setIsLoadingSystemData(false)
    }
  }

  const deleteRestaurant = async (restaurantId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': session?.user?.email || ''
        }
      })

      if (response.ok) {
        // Ricarica la lista dei ristoranti
        await loadUserRestaurants(session?.user?.email || '')
        setShowDeleteRestaurant(null)
      } else {
        const data = await response.json()
        alert(data.error || 'Errore nell\'eliminazione del ristorante')
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione del ristorante:', error)
      alert('Errore di connessione')
    } finally {
      setIsDeleting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Stiamo caricando la tua...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Il redirect è gestito nel useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Benvenuto nel pannello di controllo, {userProfile?.firstName || session?.user?.name}!
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/admin-login' })}
            className="cursor-pointer bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Il tuo profilo
            </button>
            {session?.user?.role === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('system')}
                className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'system'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Gestione Sistema
              </button>
            )}
            {session?.user?.role === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('ai-config')}
                className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'ai-config'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Configurazione AI
              </button>
            )}
            {session?.user?.role === 'ADMIN' && (
              <button
                onClick={() => router.push('/admin-dashboard/qr-analytics')}
                className="cursor-pointer py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
              >
                Analytics QR
              </button>
            )}
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">R</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Attività</dt>
                    <dd className="text-lg font-medium text-gray-900">{restaurants.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">M</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Menu Totali</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {restaurants.reduce((total, r) => total + (r.menus?.length || 0), 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">Q</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">QR Scans</dt>
                    <dd className="text-lg font-medium text-gray-900">0</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">€</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Ricavi</dt>
                    <dd className="text-lg font-medium text-gray-900">€0.00</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Restaurants List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Le tue attività
              </h3>
              <button
                onClick={() => router.push('/admin-dashboard/restaurants/new')}
                className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <span className="mr-2">+</span>
                Aggiungi Attività
              </button>
            </div>
            
            {isLoadingRestaurants ? (
              <div className="flex justify-center items-center py-12">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Caricamento attività...</p>
                </div>
              </div>
            ) : restaurants.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Non hai ancora attività.</p>
                <button
                  onClick={() => router.push('/admin-dashboard/restaurants/new')}
                  className="cursor-pointer bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Crea la tua prima attività
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant) => (
                  <div key={restaurant.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {restaurant.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {restaurant.description || 'Nessuna descrizione'}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      📍 {restaurant.address}<br />
                      📞 {restaurant.phone}<br />
                      ✉️ {restaurant.email}
                    </p>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => router.push(`/admin-dashboard/restaurants/${restaurant.id}`)}
                        className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                      >
                        Gestisci Attività
                      </button>
                     
                      {restaurant.menus && restaurant.menus.length > 0 && restaurant.menus[0].qrCodes && restaurant.menus[0].qrCodes.length > 0 && (
                        <a
                          href={`/menu/${restaurant.menus[0].qrCodes[0].code}`}
                          target="_blank"
                          className="cursor-pointer bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                        >
                          Apri Landing Page Attività                         </a>
                      )}
                      <button
                        onClick={() => setShowDeleteRestaurant(restaurant.id)}
                        className="cursor-pointer bg-red-600 text-white text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Elimina Attività
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Gestione Ingredienti e Allergeni - Solo per Admin */}
        {session?.user?.role === 'ADMIN' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Gestione Ingredienti e Allergeni
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <span className="text-green-600 text-lg">🥬</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Ingredienti</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Gestisci gli ingredienti disponibili per tutti i ristoranti
                  </p>
                  <button
                    onClick={() => router.push('/admin-dashboard/ingredients')}
                    className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Gestisci Ingredienti
                  </button>
                </div>

                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-red-100 rounded-lg mr-3">
                      <span className="text-red-600 text-lg">⚠️</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Allergeni</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Gestisci gli allergeni con icone per i menu
                  </p>
                  <button
                    onClick={() => router.push('/admin-dashboard/allergens')}
                    className="cursor-pointer bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Gestisci Allergeni
                  </button>
                </div>
              </div>

           
            </div>
          </div>
        )}
          </>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <ProfileManager />
          </div>
        )}

        {activeTab === 'ai-config' && session?.user?.role === 'ADMIN' && (
          <div className="space-y-6">
            <AIConfigManager />
          </div>
        )}

        {activeTab === 'system' && session?.user?.role === 'ADMIN' && (
          <div className="space-y-6">
            {/* System Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">R</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Ristoranti Totali</dt>
                        <dd className="text-lg font-medium text-gray-900">{allRestaurants.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">U</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Proprietari</dt>
                        <dd className="text-lg font-medium text-gray-900">{restaurantOwners.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">M</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Menu Totali</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {allRestaurants.reduce((total, r) => total + (r.menus?.length || 0), 0)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Restaurant Owners Management */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Gestione Proprietari
                </h3>
                
                {isLoadingSystemData ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <p className="mt-4 text-gray-600">Caricamento dati...</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nome
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ristoranti
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data Registrazione
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Azioni
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {restaurantOwners.map((owner) => (
                          <tr key={owner.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700">
                                      {owner.name?.charAt(0) || owner.email?.charAt(0) || 'U'}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {owner.name || 'Nome non disponibile'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {owner.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {owner.restaurants?.length || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(owner.createdAt).toLocaleDateString('it-IT')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => router.push(`/admin-dashboard/activity-details/${owner.id}`)}
                                className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Visualizza
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

          
          </div>
        )}
      </div>

      {/* Modal di conferma eliminazione ristorante */}
      {showDeleteRestaurant && (
        <DeleteConfirmModal
          isOpen={!!showDeleteRestaurant}
          onClose={() => setShowDeleteRestaurant(null)}
          onConfirm={() => deleteRestaurant(showDeleteRestaurant)}
          title="Elimina Ristorante"
          message={`Sei sicuro di voler eliminare il ristorante "${restaurants.find(r => r.id === showDeleteRestaurant)?.name}"? Questa azione eliminerà anche tutti i menu, categorie e piatti associati.`}
          itemName={restaurants.find(r => r.id === showDeleteRestaurant)?.name || ''}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}