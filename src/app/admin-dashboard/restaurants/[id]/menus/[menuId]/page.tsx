'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit, Trash2, Eye, QrCode, Save } from 'lucide-react'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import AddCategoriesModal from '@/components/admin/AddCategoriesModal'
import SortableCategories from '@/components/admin/SortableCategories'
import EditMenuModal from '@/components/admin/EditMenuModal'
import QRCodeGenerator from '@/components/admin/QRCodeGenerator'

interface MenuManagementPageProps {
  params: Promise<{
    id: string
    menuId: string
  }>
}

export default function MenuManagementPage({ params }: MenuManagementPageProps) {
  const { id: restaurantId, menuId } = use(params)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<any>(null)
  const [menu, setMenu] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [showDeleteCategory, setShowDeleteCategory] = useState<string | null>(null)
  const [showAddCategories, setShowAddCategories] = useState(false)
  const [showEditMenu, setShowEditMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [isSavingMenu, setIsSavingMenu] = useState(false)
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
    loadMenuData(restaurantId, menuId, userObj.email)
    setIsLoading(false)
  }, [router, restaurantId, menuId])

  const loadMenuData = async (restId: string, menuId: string, userEmail: string) => {
    try {
      // Carica i dati del ristorante
      const restaurantResponse = await fetch(`/api/restaurants?id=${restId}`, {
        headers: {
          'x-user-email': userEmail
        }
      })
      
      if (restaurantResponse.ok) {
        const restaurantData = await restaurantResponse.json()
        setRestaurant(restaurantData.restaurants[0])
        
        // Trova il menu specifico
        const targetMenu = restaurantData.restaurants[0].menus.find((m: any) => m.id === menuId)
        if (targetMenu) {
          setMenu(targetMenu)
          setCategories(targetMenu.categories || [])
        } else {
          router.push(`/admin-dashboard/restaurants/${restId}`)
        }
      } else {
        router.push('/admin-dashboard')
      }
    } catch (error) {
      console.error('Errore nel caricamento del menu:', error)
      router.push('/admin-dashboard')
    }
  }

  const deleteCategory = async (categoryId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': user.email
        }
      })

      if (response.ok) {
        // Ricarica i dati del menu
        await loadMenuData(restaurantId, menuId, user.email)
        setShowDeleteCategory(null)
      } else {
        const data = await response.json()
        alert(data.error || 'Errore nell\'eliminazione della categoria')
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione della categoria:', error)
      alert('Errore di connessione')
    } finally {
      setIsDeleting(false)
    }
  }

  const addCategories = async (selectedCategories: string[]) => {
    setIsAdding(true)
    try {
      const promises = selectedCategories.map(categoryName =>
        fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': user.email
          },
          body: JSON.stringify({
            name: categoryName,
            description: `Categoria ${categoryName}`,
            menuId: menuId
          })
        })
      )

      const responses = await Promise.all(promises)
      const allSuccessful = responses.every(response => response.ok)

      if (allSuccessful) {
        // Ricarica i dati del menu
        await loadMenuData(restaurantId, menuId, user.email)
        setShowAddCategories(false)
      } else {
        alert('Errore nell\'aggiunta di alcune categorie')
      }
    } catch (error) {
      console.error('Errore nell\'aggiunta delle categorie:', error)
      alert('Errore di connessione')
    } finally {
      setIsAdding(false)
    }
  }

  const handleCategoriesReorder = (reorderedCategories: any[]) => {
    setCategories(reorderedCategories)
    setHasUnsavedChanges(true)
  }

  const saveCategoriesOrder = async () => {
    setIsSavingOrder(true)
    try {
      const response = await fetch('/api/categories/sort', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify({
          categories: categories.map((category, index) => ({
            id: category.id,
            sortOrder: index
          }))
        })
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
        alert('Ordinamento categorie salvato con successo!')
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

  const handleSaveMenu = async (menuData: any) => {
    setIsSavingMenu(true)
    try {
      const response = await fetch(`/api/menus/${menuId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify(menuData)
      })

      if (response.ok) {
        const updatedMenu = await response.json()
        setMenu(updatedMenu)
        setShowEditMenu(false)
        alert('Menu aggiornato con successo!')
      } else {
        const data = await response.json()
        alert(data.error || 'Errore nell\'aggiornamento del menu')
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento del menu:', error)
      alert('Errore di connessione')
    } finally {
      setIsSavingMenu(false)
    }
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

  if (!restaurant || !menu) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">
          <p>Menu non trovato.</p>
          <button onClick={() => router.push('/admin-dashboard')} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
            Torna alla Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{menu.name}</h1>
            <p className="text-gray-600 mt-2">
              Gestisci le categorie e i piatti per <strong>{restaurant.name}</strong>
            </p>
          </div>
          <button
            onClick={() => router.push(`/admin-dashboard/restaurants/${restaurantId}`)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <ArrowLeft size={20} />
            <span>Torna al Ristorante</span>
          </button>
        </div>

        {/* Menu Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Informazioni Menu */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Informazioni Menu</h2>
            <p className="text-gray-700 mb-2"><strong>Nome:</strong> {menu.name}</p>
            <p className="text-gray-700 mb-2"><strong>Descrizione:</strong> {menu.description || 'Nessuna descrizione'}</p>
            <p className="text-gray-700 mb-2"><strong>QR Code:</strong> {menu.qrCodes && menu.qrCodes.length > 0 ? menu.qrCodes[0].code : 'N/A'}</p>
            <p className="text-gray-700 mb-4"><strong>Categorie:</strong> {categories.length}</p>
            
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowEditMenu(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifica Menu
              </button>
              {menu.qrCodes && menu.qrCodes.length > 0 && (
                <a
                  href={`/menu/${menu.qrCodes[0].code}`}
                  target="_blank"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Vedi Cliente
                </a>
              )}
            </div>
          </div>

          {/* QR Code Generator */}
          <QRCodeGenerator 
            url={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/menu/${restaurant?.name || 'RISTORANTE1'}`}
            menuName={menu.name}
          />
        </div>

        {/* Categories Management */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Categorie</h2>
              <p className="text-sm text-gray-600 mt-1">
                Trascina le categorie per riordinarle. L'ordinamento influenzerà la visualizzazione nel menu cliente.
              </p>
            </div>
            <div className="flex space-x-2">
              {hasUnsavedChanges && (
                <button
                  onClick={saveCategoriesOrder}
                  disabled={isSavingOrder}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingOrder ? 'Salvataggio...' : 'Salva Ordinamento'}
                </button>
              )}
              <button
                onClick={() => setShowAddCategories(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Categorie
              </button>
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Nessuna categoria trovata.</p>
              <button
                onClick={() => setShowAddCategories(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Aggiungi Categorie
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <SortableCategories
                categories={categories}
                onCategoriesReorder={handleCategoriesReorder}
                onEditCategory={(categoryId) => {
                  router.push(`/admin-dashboard/restaurants/${restaurantId}/menus/${menuId}/categories/${categoryId}`)
                }}
                onDeleteCategory={setShowDeleteCategory}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal di conferma eliminazione categoria */}
      {showDeleteCategory && (
        <DeleteConfirmModal
          isOpen={!!showDeleteCategory}
          onClose={() => setShowDeleteCategory(null)}
          onConfirm={() => deleteCategory(showDeleteCategory)}
          title="Elimina Categoria"
          message={`Sei sicuro di voler eliminare questa categoria? Questa azione eliminerà anche tutti i piatti associati.`}
          itemName={categories.find(c => c.id === showDeleteCategory)?.name || ''}
          isDeleting={isDeleting}
        />
      )}

      {/* Modal per aggiungere categorie */}
      <AddCategoriesModal
        isOpen={showAddCategories}
        onClose={() => setShowAddCategories(false)}
        onConfirm={addCategories}
        menuId={menuId}
        restaurantId={restaurantId}
        isAdding={isAdding}
      />

      {/* Modal per modificare menu */}
      <EditMenuModal
        isOpen={showEditMenu}
        onClose={() => setShowEditMenu(false)}
        menu={menu}
        onSave={handleSaveMenu}
        isSaving={isSavingMenu}
      />
    </div>
  )
}
