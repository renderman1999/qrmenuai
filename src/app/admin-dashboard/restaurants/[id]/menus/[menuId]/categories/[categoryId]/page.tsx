'use client'

import { useState, useEffect, use, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Plus, Save } from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
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
  const { data: session, status } = useSession()
  const { id: restaurantId, menuId, categoryId } = use(params)
  
  // Memoizza i parametri per evitare re-render inutili
  const memoizedParams = useMemo(() => ({
    restaurantId,
    menuId,
    categoryId
  }), [restaurantId, menuId, categoryId])
  const [isLoading, setIsLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<{ name: string; id: string } | null>(null)
  const [menu, setMenu] = useState<{ name: string; id: string } | null>(null)
  const [category, setCategory] = useState<{ name: string; id: string } | null>(null)
  const [dishes, setDishes] = useState<Dish[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [showDeleteDish, setShowDeleteDish] = useState<string | null>(null)
  const [showDishForm, setShowDishForm] = useState(false)
  const [showMoveDish, setShowMoveDish] = useState<Dish | null>(null)
  const [editingDish, setEditingDish] = useState<Dish | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [togglingDish, setTogglingDish] = useState<string | null>(null)
  const router = useRouter()

  // Flag per evitare ricaricamenti multipli
  const [hasLoaded, setHasLoaded] = useState(false)
  // const [isTabVisible, setIsTabVisible] = useState(true)

  const loadCategoryData = useCallback(async (currentRestaurantId: string, currentMenuId: string, currentCategoryId: string) => {
    setIsLoading(true)
    try {
      // Fetch restaurant data
      const restaurantResponse = await fetch(`/api/restaurants?id=${currentRestaurantId}`)
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
      await loadDishes(currentCategoryId)
      
      // Load all categories for this menu
      await loadCategories(currentMenuId)

    } catch (error) {
      console.error('Error loading category data:', error)
      alert('Errore nel caricamento dei dati della categoria. Potrebbe non esistere o non sei autorizzato.')
      router.push(`/admin-dashboard/restaurants/${restaurantId}/menus/${menuId}`)
    } finally {
      setIsLoading(false)
    }
  }, [restaurantId, menuId, categoryId])

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/admin-login')
      return
    }
    
    // Evita ricaricamenti multipli se i dati sono già stati caricati
    if (session?.user?.email && !hasLoaded) {
      loadCategoryData(restaurantId, menuId, categoryId)
      setHasLoaded(true)
    }
  }, [session, status, router, memoizedParams, hasLoaded, loadCategoryData])

  // Gestisce la visibilità del tab per evitare ricaricamenti
  // useEffect(() => {
  //   const handleVisibilityChange = () => {
  //     setIsTabVisible(!document.hidden)
  //   }

  //   document.addEventListener('visibilitychange', handleVisibilityChange)
  //   return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  // }, [])

  const loadDishes = async (currentCategoryId: string) => {
    try {
      // Includi anche i piatti nascosti per la gestione admin
      const response = await fetch(`/api/dishes?categoryId=${currentCategoryId}&includeInactive=true`)
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

  const loadCategories = async (currentMenuId: string) => {
    try {
      const response = await fetch(`/api/categories?menuId=${currentMenuId}`)
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
          'Content-Type': 'application/json'
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
        await loadDishes(categoryId)
        
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
        headers: {}
      })

      if (response.ok) {
        // Rimuovi il piatto dalla lista locale immediatamente per un feedback visivo più veloce
        setDishes(prevDishes => prevDishes.filter(dish => dish.id !== dishId))
        setShowDeleteDish(null)
        
        // Ricarica i dati per assicurarsi che tutto sia sincronizzato
        await loadDishes(categoryId)
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
          'Content-Type': 'application/json'
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
    await loadDishes(categoryId)
    setShowDishForm(false)
    setEditingDish(null)
  }

  const toggleDishVisibility = async (dishId: string, currentStatus: boolean) => {
    setTogglingDish(dishId)
    try {
      const response = await fetch(`/api/dishes/${dishId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      })

      if (response.ok) {
        // Aggiorna lo stato locale immediatamente per feedback visivo
        setDishes(prevDishes => 
          prevDishes.map(dish => 
            dish.id === dishId 
              ? { ...dish, isActive: !currentStatus }
              : dish
          )
        )
        
        // Mostra toast di conferma
        const dishName = dishes.find(d => d.id === dishId)?.name || 'Piatto'
        if (!currentStatus) {
          toast.success(`${dishName} pubblicato con successo!`)
        } else {
          toast.success(`${dishName} nascosto dal menu!`)
        }
      } else {
        const data = await response.json()
        toast.error(data.error || 'Errore nell\'aggiornamento dello stato del piatto')
      }
    } catch (error) {
      console.error('Errore nel toggle visibilità piatto:', error)
      toast.error('Errore di connessione')
    } finally {
      setTogglingDish(null)
    }
  }

  if (status === 'loading' || isLoading) {
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

  if (!category || !menu || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center text-gray-600 max-w-md">
          <p className="text-sm sm:text-base mb-4">Categoria non trovata o non autorizzato.</p>
          <button 
            onClick={() => router.push(`/admin-dashboard/restaurants/${restaurantId}/menus/${menuId}`)} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm sm:text-base w-full sm:w-auto"
          >
            Torna al Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.push(`/admin-dashboard/restaurants/${restaurantId}/menus/${menuId}`)}
            className="cursor-pointer mb-4 bg-gray-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 text-sm sm:text-base"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Torna al Menu</span>
            <span className="sm:hidden">Indietro</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestione Piatti</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Categoria: {category.name}</p>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Menu: {menu.name} - {restaurant.name}</p>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">Azioni Rapide</h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleAddDish}
              className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <Plus size={18} className="sm:w-5 sm:h-5" />
              <span>Aggiungi Piatto</span>
            </button>
            {hasUnsavedChanges && (
              <button
                onClick={saveDishesOrder}
                disabled={isSavingOrder}
                className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base"
              >
                <Save size={18} className="sm:w-5 sm:h-5" />
                <span>{isSavingOrder ? 'Salvataggio...' : 'Salva Ordinamento'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Dishes Management */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Piatti della Categoria</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Trascina i piatti per riordinarli. L'ordinamento influenzerà la visualizzazione nel menu cliente.
              </p>
            </div>
            <button
              onClick={handleAddDish}
              className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm sm:text-base w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Piatto
            </button>
          </div>

          {dishes.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-gray-600 mb-4 text-sm sm:text-base">Nessun piatto trovato in questa categoria.</p>
              <button
                onClick={handleAddDish}
                className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
              >
                Aggiungi Primo Piatto
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <SortableDishes
                dishes={dishes}
                onDishesReorder={handleDishesReorder}
                onEditDish={handleEditDish}
                onDeleteDish={setShowDeleteDish}
                onMoveDish={handleMoveDish}
                onToggleVisibility={toggleDishVisibility}
                togglingDish={togglingDish}
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
        dish={showMoveDish ? {
          id: showMoveDish.id,
          name: showMoveDish.name,
          description: showMoveDish.description || undefined
        } : null}
        categories={categories.filter(cat => cat.id !== categoryId)}
        onMove={moveDish}
        isMoving={isMoving}
      />
      <Toaster position="top-right" />
    </div>
  )
}
