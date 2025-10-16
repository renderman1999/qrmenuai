'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Plus, Eye, QrCode, Trash2, ChefHat } from 'lucide-react'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'

interface Restaurant {
  id: string
  name: string
  description: string | null
  address: string
  phone: string
  email: string
  website: string | null
  logo: string | null
  coverImage: string | null
  isActive: boolean
  licenseTier: string
  createdAt: string
  updatedAt: string
  menus: Array<{
    id: string
    name: string
    description: string | null
    isActive: boolean
    createdAt: string
    qrCodes: Array<{
      id: string
      code: string
      isActive: boolean
      scanCount: number
    }>
    categories: Array<{
      id: string
      name: string
      dishes: Array<{
        id: string
        name: string
      }>
    }>
  }>
}

export default function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: restaurantId } = use(params)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [showDeleteRestaurant, setShowDeleteRestaurant] = useState(false)
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null)
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
    loadRestaurant(restaurantId, userObj.email)
    setIsLoading(false)
  }, [restaurantId, router])

  const loadRestaurant = async (restaurantId: string, userEmail: string) => {
    try {
      const response = await fetch('/api/restaurants', {
        headers: {
          'x-user-email': userEmail
        }
      })
      if (response.ok) {
        const data = await response.json()
        const foundRestaurant = data.restaurants.find((r: Restaurant) => r.id === restaurantId)
        if (foundRestaurant) {
          setRestaurant(foundRestaurant)
        } else {
          router.push('/admin-dashboard')
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento del ristorante:', error)
      router.push('/admin-dashboard')
    }
  }

  const deleteMenu = async (menuId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/menus/${menuId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': user.email
        }
      })

      if (response.ok) {
        // Ricarica i dati del ristorante
        await loadRestaurant(restaurantId, user.email)
        setShowDeleteMenu(null)
      } else {
        const data = await response.json()
        alert(data.error || 'Errore nell\'eliminazione del menu')
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione del menu:', error)
      alert('Errore di connessione')
    } finally {
      setIsDeleting(false)
    }
  }

  const deleteRestaurant = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': user.email
        }
      })

      if (response.ok) {
        router.push('/admin-dashboard')
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

  if (!user || !restaurant) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <button
            onClick={() => router.push('/admin-dashboard')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
            <p className="text-gray-600 mt-2">
              Gestisci i dettagli e i menu del tuo ristorante
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push(`/admin-dashboard/restaurants/${restaurant.id}/edit`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifica
            </button>
            <button
              onClick={() => router.push(`/admin-dashboard/restaurants/${restaurant.id}/menus`)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Gestisci Menu
            </button>
            <button
              onClick={() => router.push(`/admin-dashboard/restaurants/${restaurant.id}/orders`)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
            >
              <ChefHat className="h-4 w-4 mr-2" />
              Gestisci Ordini
            </button>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informazioni Ristorante</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <p className="mt-1 text-sm text-gray-900">{restaurant.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrizione</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {restaurant.description || 'Nessuna descrizione'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Indirizzo</label>
                  <p className="mt-1 text-sm text-gray-900">{restaurant.address}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefono</label>
                    <p className="mt-1 text-sm text-gray-900">{restaurant.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{restaurant.email}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stato</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    restaurant.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {restaurant.isActive ? 'Attivo' : 'Inattivo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Menus */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Menu ({restaurant.menus.length})</h2>
                <button
                  onClick={() => router.push(`/admin-dashboard/restaurants/${restaurant.id}/menus/new`)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Menu
                </button>
              </div>
              
              {restaurant.menus.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Nessun menu creato per questo ristorante.</p>
                  <button
                    onClick={() => router.push(`/admin-dashboard/restaurants/${restaurant.id}/menus/new`)}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Crea il primo menu
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {restaurant.menus.map((menu) => (
                    <div key={menu.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{menu.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {menu.description || 'Nessuna descrizione'}
                          </p>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Categorie: {menu.categories.length}</span>
                            <span>Piatti: {menu.categories.reduce((total, cat) => total + cat.dishes.length, 0)}</span>
                            <span>Scansioni: {menu.qrCodes.reduce((total, qr) => total + qr.scanCount, 0)}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          {menu.qrCodes.length > 0 && (
                            <a
                              href={`/menu/${menu.qrCodes[0].code}`}
                              target="_blank"
                              className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Vedi
                            </a>
                          )}
                          <button
                            onClick={() => router.push(`/admin-dashboard/restaurants/${restaurant.id}/menus/${menu.id}`)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Gestisci
                          </button>
                          <button
                            onClick={() => setShowDeleteMenu(menu.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Elimina
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiche</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Menu Totali</span>
                  <span className="text-sm font-medium text-gray-900">{restaurant.menus.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Categorie Totali</span>
                  <span className="text-sm font-medium text-gray-900">
                    {restaurant.menus.reduce((total, menu) => total + menu.categories.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Piatti Totali</span>
                  <span className="text-sm font-medium text-gray-900">
                    {restaurant.menus.reduce((total, menu) => 
                      total + menu.categories.reduce((catTotal, cat) => catTotal + cat.dishes.length, 0), 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Scansioni Totali</span>
                  <span className="text-sm font-medium text-gray-900">
                    {restaurant.menus.reduce((total, menu) => 
                      total + menu.qrCodes.reduce((qrTotal, qr) => qrTotal + qr.scanCount, 0), 0
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Azioni Rapide</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/admin-dashboard/restaurants/${restaurant.id}/menus/new`)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Menu
                </button>
                <button
                  onClick={() => router.push(`/admin-dashboard/restaurants/${restaurant.id}/edit`)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifica Ristorante
                </button>
                <button
                  onClick={() => router.push('/admin-dashboard')}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Torna alla Dashboard
                </button>
                <button
                  onClick={() => setShowDeleteRestaurant(true)}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina Ristorante
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal di conferma eliminazione ristorante */}
      <DeleteConfirmModal
        isOpen={showDeleteRestaurant}
        onClose={() => setShowDeleteRestaurant(false)}
        onConfirm={deleteRestaurant}
        title="Elimina Ristorante"
        message={`Sei sicuro di voler eliminare il ristorante "${restaurant?.name}"? Questa azione eliminerà anche tutti i menu, categorie e piatti associati.`}
        itemName={restaurant?.name || ''}
        isDeleting={isDeleting}
      />

      {/* Modal di conferma eliminazione menu */}
      {showDeleteMenu && (
        <DeleteConfirmModal
          isOpen={!!showDeleteMenu}
          onClose={() => setShowDeleteMenu(null)}
          onConfirm={() => deleteMenu(showDeleteMenu)}
          title="Elimina Menu"
          message={`Sei sicuro di voler eliminare questo menu? Questa azione eliminerà anche tutte le categorie e i piatti associati.`}
          itemName={restaurant?.menus?.find(m => m.id === showDeleteMenu)?.name || ''}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}
