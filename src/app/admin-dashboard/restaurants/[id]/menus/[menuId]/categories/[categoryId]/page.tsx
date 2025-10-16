'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit, Trash2, Save, GripVertical } from 'lucide-react'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import DishFormModal from '@/components/admin/DishFormModal'
import SortableDishes from '@/components/admin/SortableDishes'
import MoveDishModal from '@/components/admin/MoveDishModal'

interface DishManagementPageProps {
  params: Promise<{
    id: string // restaurantId
    menuId: string
    categoryId: string
  }>
}

interface Dish {
  id: string
  name: string
  description: string | null
  price: number | string
  allergens: (string | { id: string; name: string; icon?: string })[]
  ingredients: (string | { id: string; name: string; category?: string })[]
  isVegetarian: boolean
  isVegan: boolean
  isGlutenFree: boolean
  isSpicy: boolean
  image: string | null
  sortOrder: number
  isActive: boolean
}

export default function DishManagementPage({ params }: DishManagementPageProps) {
  const { id: restaurantId, menuId, categoryId } = use(params)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<any>(null)
  const [menu, setMenu] = useState<any>(null)
  const [category, setCategory] = useState<any>(null)
  const [dishes, setDishes] = useState<Dish[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [showDeleteDish, setShowDeleteDish] = useState<string | null>(null)
  const [showDishForm, setShowDishForm] = useState(false)
  const [showMoveDish, setShowMoveDish] = useState<Dish | null>(null)
  const [editingDish, setEditingDish] = useState<Dish | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    const userData = localStorage.getItem('adminUser')

    if (!isLoggedIn || !userData) {
      router.push('/admin-login')
      return
    }

    const userObj = JSON.parse(userData)
    setUser(userObj)
    loadCategoryData(restaurantId, menuId, categoryId, userObj.email)
  }, [router, restaurantId, menuId, categoryId])

  const loadCategoryData = async (currentRestaurantId: string, currentMenuId: string, currentCategoryId: string, userEmail: string) => {
    setIsLoading(true)
    try {
      // Fetch restaurant data
      const restaurantResponse = await fetch(`/api/restaurants?id=${currentRestaurantId}`, {
        headers: { 'x-user-email': userEmail }
      })
      if (!restaurantResponse.ok) throw new Error('Failed to fetch restaurant')
      const restaurantData = await restaurantResponse.json()
      const fetchedRestaurant = restaurantData.restaurants[0]
      setRestaurant(fetchedRestaurant)

      // Find the specific menu within the fetched restaurant
      const fetchedMenu = fetchedRestaurant?.menus?.find((m: any) => m.id === currentMenuId)
      if (!fetchedMenu) throw new Error('Menu not found or not authorized')
      setMenu(fetchedMenu)

      // Find the specific category within the menu
      const fetchedCategory = fetchedMenu.categories?.find((c: any) => c.id === currentCategoryId)
      if (!fetchedCategory) throw new Error('Category not found or not authorized')
      setCategory(fetchedCategory)

      // Load dishes for this category
      await loadDishes(currentCategoryId, userEmail)
      
      // Load all categories for this menu
      await loadCategories(currentMenuId, userEmail)

    } catch (error) {
      console.error('Error loading category data:', error)
      alert('Errore nel caricamento dei dati della categoria. Potrebbe non esistere o non sei autorizzato.')
      router.push(`/admin-dashboard/restaurants/${restaurantId}/menus/${menuId}`)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDishes = async (currentCategoryId: string, userEmail: string) => {
    try {
      const response = await fetch(`/api/dishes?categoryId=${currentCategoryId}`, {
        headers: { 'x-user-email': userEmail }
      })
      if (response.ok) {
        const data = await response.json()
        setDishes(data.dishes.sort((a: any, b: any) => a.sortOrder - b.sortOrder))
      } else {
        console.error('Errore nel caricamento dei piatti:', response.statusText)
        setDishes([])
      }
    } catch (error) {
      console.error('Errore nel caricamento dei piatti:', error)
      setDishes([])
    }
  }

  const loadCategories = async (currentMenuId: string, userEmail: string) => {
    try {
      const response = await fetch(`/api/categories?menuId=${currentMenuId}`, {
        headers: { 'x-user-email': userEmail }
      })
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      } else {
        console.error('Errore nel caricamento delle categorie:', response.statusText)
        setCategories([])
      }
    } catch (error) {
      console.error('Errore nel caricamento delle categorie:', error)
      setCategories([])
    }
  }

  const handleMoveDish = (dish: Dish) => {
    setShowMoveDish(dish)
  }

  const moveDish = async (targetCategoryId: string) => {
    if (!showMoveDish) return
    
    setIsMoving(true)
    try {
      const response = await fetch(`/api/dishes/${showMoveDish.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify({
          categoryId: targetCategoryId
        })
      })

      if (response.ok) {
        // Rimuovi il piatto dalla lista locale
        setDishes(prevDishes => prevDishes.filter(dish => dish.id !== showMoveDish.id))
        setShowMoveDish(null)
        
        // Ricarica i piatti per assicurarsi che tutto sia sincronizzato
        await loadDishes(categoryId, user.email)
        
        alert('Piatto spostato con successo!')
      } else {
        const data = await response.json()
        alert(data.error || 'Errore nello spostamento del piatto')
      }
    } catch (error) {
      console.error('Errore nello spostamento del piatto:', error)
      alert('Errore di connessione')
    } finally {
      setIsMoving(false)
    }
  }

  const deleteDish = async (dishId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/dishes/${dishId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': user.email
        }
      })

      if (response.ok) {
        // Rimuovi il piatto dalla lista locale immediatamente per un feedback visivo più veloce
        setDishes(prevDishes => prevDishes.filter(dish => dish.id !== dishId))
        setShowDeleteDish(null)
        
        // Ricarica i dati per assicurarsi che tutto sia sincronizzato
        await loadDishes(categoryId, user.email)
      } else {
        const data = await response.json()
        alert(data.error || 'Errore nell\'eliminazione del piatto')
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione del piatto:', error)
      alert('Errore di connessione')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDishesReorder = (reorderedDishes: Dish[]) => {
    setDishes(reorderedDishes)
    setHasUnsavedChanges(true)
  }

  const saveDishesOrder = async () => {
    setIsSavingOrder(true)
    try {
      const response = await fetch('/api/dishes/sort', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify({
          dishes: dishes.map((dish, index) => ({
            id: dish.id,
            sortOrder: index
          }))
        })
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
        alert('Ordinamento piatti salvato con successo!')
      } else {
        const data = await response.json()
        alert(data.error || 'Errore nel salvataggio dell\'ordinamento')
      }
    } catch (error) {
      console.error('Errore nel salvataggio dell\'ordinamento:', error)
      alert('Errore di connessione')
    } finally {
      setIsSavingOrder(false)
    }
  }

  const handleEditDish = (dish: Dish) => {
    setEditingDish(dish)
    setShowDishForm(true)
  }

  const handleAddDish = () => {
    setEditingDish(null)
    setShowDishForm(true)
  }

  const handleDishSaved = async () => {
    await loadDishes(categoryId, user.email)
    setShowDishForm(false)
    setEditingDish(null)
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!category || !menu || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">
          <p>Categoria non trovata o non autorizzato.</p>
          <button onClick={() => router.push(`/admin-dashboard/restaurants/${restaurantId}/menus/${menuId}`)} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
            Torna al Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push(`/admin-dashboard/restaurants/${restaurantId}/menus/${menuId}`)}
            className="mb-4 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <ArrowLeft size={20} />
            <span>Torna al Menu</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Gestione Piatti</h1>
          <p className="text-gray-600 mt-2">Categoria: {category.name}</p>
          <p className="text-gray-600 mt-1">Menu: {menu.name} - {restaurant.name}</p>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Azioni Rapide</h2>
          <div className="flex space-x-4">
            <button
              onClick={handleAddDish}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Aggiungi Piatto</span>
            </button>
            {hasUnsavedChanges && (
              <button
                onClick={saveDishesOrder}
                disabled={isSavingOrder}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Save size={20} />
                <span>{isSavingOrder ? 'Salvataggio...' : 'Salva Ordinamento'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Dishes Management */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Piatti della Categoria</h2>
              <p className="text-sm text-gray-600 mt-1">
                Trascina i piatti per riordinarli. L'ordinamento influenzerà la visualizzazione nel menu cliente.
              </p>
            </div>
            <button
              onClick={handleAddDish}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Piatto
            </button>
          </div>

          {dishes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Nessun piatto trovato in questa categoria.</p>
              <button
                onClick={handleAddDish}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Aggiungi Primo Piatto
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <SortableDishes
                dishes={dishes}
                onDishesReorder={handleDishesReorder}
                onEditDish={handleEditDish}
                onDeleteDish={setShowDeleteDish}
                onMoveDish={handleMoveDish}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal di conferma eliminazione piatto */}
      {showDeleteDish && (
        <DeleteConfirmModal
          isOpen={!!showDeleteDish}
          onClose={() => setShowDeleteDish(null)}
          onConfirm={() => deleteDish(showDeleteDish)}
          title="Elimina Piatto"
          message={`Sei sicuro di voler eliminare questo piatto? Questa azione non può essere annullata.`}
          itemName={dishes.find(d => d.id === showDeleteDish)?.name || ''}
          isDeleting={isDeleting}
        />
      )}

      {/* Modal per aggiungere/modificare piatto */}
      <DishFormModal
        isOpen={showDishForm}
        onClose={() => {
          setShowDishForm(false)
          setEditingDish(null)
        }}
        onSave={handleDishSaved}
        categoryId={categoryId}
        restaurantId={restaurantId}
        dish={editingDish}
      />

      {/* Modal per spostare piatto */}
      <MoveDishModal
        isOpen={!!showMoveDish}
        onClose={() => setShowMoveDish(null)}
        dish={showMoveDish}
        categories={categories.filter(cat => cat.id !== categoryId)}
        onMove={moveDish}
        isMoving={isMoving}
      />
    </div>
  )
}
