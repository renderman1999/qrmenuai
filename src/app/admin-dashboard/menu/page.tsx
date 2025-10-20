'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Plus, Edit, Trash2, Eye, QrCode, ChevronDown, ChevronUp } from 'lucide-react'
import AddCategoryModal from '@/components/admin/AddCategoryModal'

interface Dish {
  id: string
  name: string
  description: string
  price: number
  isVegetarian: boolean
  isVegan: boolean
  isGlutenFree: boolean
  isSpicy: boolean
  allergens: string[]
  ingredients: string[]
  isActive: boolean
}

interface Category {
  id: string
  name: string
  description: string
  dishes: Dish[]
}

export default function MenuManagementPage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [menuInfo, setMenuInfo] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showAddDish, setShowAddDish] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/admin-login')
      return
    }
    
    if (session?.user?.email) {
      loadMenuData(session.user.email)
      setIsLoading(false)
    }
  }, [session, status, router])

      const loadMenuData = async (userEmail: string) => {
        try {
          // Carica i menu dell'utente autenticato
          const response = await fetch('/api/menus/user', {
            headers: {
              'x-user-email': userEmail
            }
          })
          if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
        setMenuInfo(data.menu)
      } else {
        console.error('Errore nel caricamento dei menu dell\'utente')
        // Fallback ai dati mock se il database non è disponibile
        setCategories([])
      }
    } catch (error) {
      console.error('Errore nel caricamento del menu:', error)
      setCategories([])
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Il redirect è gestito nel useEffect
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestione Menu</h1>
            <p className="text-gray-600 mt-2">
              Gestisci il menu del tuo ristorante, {session?.user?.name}
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/admin-dashboard')}
              className="cursor-pointer bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Torna alla Dashboard
            </button>
            <button
              onClick={() => setShowAddCategory(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Categoria
            </button>
            <button
              onClick={() => setShowAddDish(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Piatto
            </button>
          </div>
        </div>

        {/* Menu QR Code Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                {menuInfo ? menuInfo.name : 'Menu Demo Attivo'}
              </h3>
              <p className="text-blue-700">QR Code: <strong>DEMO123</strong></p>
              <p className="text-sm text-blue-600">
                {menuInfo ? menuInfo.description : 'I clienti possono accedere al menu tramite questo QR code'}
              </p>
              {menuInfo && (
                <p className="text-sm text-blue-600 mt-1">
                  Ristorante: <strong>{menuInfo.restaurant?.name}</strong>
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <a
                href="/menu/DEMO123"
                target="_blank"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                Vedi Menu
              </a>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
                <QrCode className="h-4 w-4 mr-2" />
                Genera QR
              </button>
            </div>
          </div>
        </div>

        {/* Categories and Dishes */}
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
                <p className="text-gray-600">{category.description}</p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {category.dishes.map((dish) => (
                  <div key={dish.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{dish.name}</h3>
                        <div className="flex space-x-1">
                          {dish.isVegetarian && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Veg</span>
                          )}
                          {dish.isVegan && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Vegan</span>
                          )}
                          {dish.isGlutenFree && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">GF</span>
                          )}
                          {dish.isSpicy && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Piccante</span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 mt-1">{dish.description}</p>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span className="font-semibold text-green-600">€{dish.price.toFixed(2)}</span>
                        {dish.allergens.length > 0 && (
                          <span>Allergeni: {dish.allergens.join(', ')}</span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          dish.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {dish.isActive ? 'Attivo' : 'Disattivo'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 p-2">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800 p-2">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add Category Modal */}
        {showAddCategory && menuInfo && (
          <AddCategoryModal
            isOpen={showAddCategory}
            onClose={() => setShowAddCategory(false)}
            onCategoryAdded={() => {
              // Ricarica i dati del menu
              loadMenuData(session?.user?.email || '')
            }}
            menuId={menuInfo.id}
            restaurantId={menuInfo.restaurant.id}
          />
        )}

        {/* Add Dish Modal */}
        {showAddDish && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Aggiungi Nuovo Piatto</h3>
              <p className="text-gray-600 mb-4">
                Funzionalità in sviluppo. Presto potrai aggiungere nuovi piatti al tuo menu!
              </p>
              <button
                onClick={() => setShowAddDish(false)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Chiudi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
