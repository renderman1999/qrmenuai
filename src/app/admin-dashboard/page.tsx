'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [showDeleteRestaurant, setShowDeleteRestaurant] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    const userData = localStorage.getItem('adminUser')
    
    if (!isLoggedIn || !userData) {
      router.push('/admin-login')
      return
    }
    
    const userObj = JSON.parse(userData)
    setUser(userObj)
    loadUserRestaurants(userObj.email)
    setIsLoading(false)
  }, [router])

  const loadUserRestaurants = async (userEmail: string) => {
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
    }
  }

  const deleteRestaurant = async (restaurantId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': user.email
        }
      })

      if (response.ok) {
        // Ricarica la lista dei ristoranti
        await loadUserRestaurants(user.email)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
            <p className="text-gray-600 mt-2">
              Benvenuto nel pannello di controllo, {user.name}!
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('adminLoggedIn')
              localStorage.removeItem('adminUser')
              router.push('/admin-login')
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>

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
                    <dt className="text-sm font-medium text-gray-500 truncate">Ristoranti</dt>
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
                I tuoi Ristoranti
              </h3>
              <button
                onClick={() => router.push('/admin-dashboard/restaurants/new')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <span className="mr-2">+</span>
                Aggiungi Ristorante
              </button>
            </div>
            
            {restaurants.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Non hai ancora ristoranti.</p>
                <button
                  onClick={() => router.push('/admin-dashboard/restaurants/new')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Crea il tuo primo ristorante
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
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/admin-dashboard/restaurants/${restaurant.id}`)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Gestisci
                      </button>
                      <button
                        onClick={() => router.push(`/admin-dashboard/restaurants/${restaurant.id}/menus`)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Menu ({restaurant.menus?.length || 0})
                      </button>
                      {restaurant.menus && restaurant.menus.length > 0 && restaurant.menus[0].qrCodes && restaurant.menus[0].qrCodes.length > 0 && (
                        <a
                          href={`/menu/${restaurant.menus[0].qrCodes[0].code}`}
                          target="_blank"
                          className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                        >
                          Vedi Menu
                        </a>
                      )}
                      <button
                        onClick={() => setShowDeleteRestaurant(restaurant.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Elimina
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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