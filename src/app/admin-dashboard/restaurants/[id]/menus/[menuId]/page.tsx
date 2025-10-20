'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Plus, Edit, Trash2, Eye, QrCode, Save, BarChart3 } from 'lucide-react'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import AddCategoriesModal from '@/components/admin/AddCategoriesModal'
import SortableCategories from '@/components/admin/SortableCategories'
import EditMenuModal from '@/components/admin/EditMenuModal'
import QRCodeGenerator from '@/components/admin/QRCodeGenerator'
import MenuCoverImageUpload from '@/components/admin/MenuCoverImageUpload'

interface MenuManagementPageProps {
  params: Promise<{
    id: string
    menuId: string
  }>
}

export default function MenuManagementPage({ params }: MenuManagementPageProps) {
  const { data: session, status } = useSession()
  const { id: restaurantId, menuId } = use(params)
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
  const [isUploadingImage, setIsUploadingImage] = useState<string | null>(null)
  const [menuCoverImage, setMenuCoverImage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/admin-login')
      return
    }
    
    if (session?.user?.email) {
      loadMenuData(restaurantId, menuId)
      setIsLoading(false)
    }
  }, [session, status, router, restaurantId, menuId])

  const loadMenuData = async (restId: string, menuId: string) => {
    try {
      // Carica i dati del ristorante
      const restaurantResponse = await fetch(`/api/restaurants?id=${restId}`)
      
      if (restaurantResponse.ok) {
        const restaurantData = await restaurantResponse.json()
        setRestaurant(restaurantData.restaurants[0])
        
        // Trova il menu specifico
        const targetMenu = restaurantData.restaurants[0].menus.find((m: any) => m.id === menuId)
        if (targetMenu) {
          setMenu(targetMenu)
          setCategories(targetMenu.categories || [])
          setMenuCoverImage(targetMenu.coverImage || null)
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
          method: 'DELETE'
        })

      if (response.ok) {
        // Ricarica i dati del menu
        await loadMenuData(restaurantId, menuId)
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
            'Content-Type': 'application/json'
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
        await loadMenuData(restaurantId, menuId)
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
          'x-user-email': session?.user?.email || ''
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
            'Content-Type': 'application/json'
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

  const handleUpdateCategoryImage = async (categoryId: string, imageFile: File) => {
    setIsUploadingImage(categoryId)
    
    // Store original state for rollback
    const originalCategories = [...categories]
    
    // Create preview immediately for better UX
    const reader = new FileReader()
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string
      // Update immediately with preview
      setCategories(prevCategories => 
        prevCategories.map(cat => 
          cat.id === categoryId 
            ? { ...cat, coverImage: previewUrl }
            : cat
        )
      )
    }
    reader.readAsDataURL(imageFile)
    
    try {
      const formData = new FormData()
      formData.append('image', imageFile)

      const response = await fetch(`/api/categories/${categoryId}/cover-image`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Server response:', data) // Debug log
        
        // Update with final server response
        setCategories(prevCategories => 
          prevCategories.map(cat => 
            cat.id === categoryId 
              ? { ...cat, coverImage: data.category.coverImage } // Use proper coverImage field
              : cat
          )
        )
        
        // Show success message briefly
        const successMsg = document.createElement('div')
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
        successMsg.textContent = 'Immagine aggiornata!'
        document.body.appendChild(successMsg)
        setTimeout(() => successMsg.remove(), 2000)
        
        // Force a re-render by updating the state again
        setTimeout(() => {
          setCategories(prevCategories => 
            prevCategories.map(cat => 
              cat.id === categoryId 
                ? { ...cat, coverImage: data.category.coverImage } // Use proper coverImage field
                : cat
            )
          )
        }, 100)
        
      } else {
        const errorData = await response.json()
        console.error('Server error:', errorData)
        // Revert to original state on error
        setCategories(originalCategories)
        alert(errorData.error || 'Errore nell\'aggiornamento dell\'immagine')
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'immagine:', error)
      // Revert to original state on error
      setCategories(originalCategories)
      alert('Errore di connessione')
    } finally {
      setIsUploadingImage(null)
    }
  }

  if (isLoading || !session) {
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
          <button onClick={() => router.push('/admin-dashboard')} className="cursor-pointer mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
            Torna alla Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{menu.name}</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Gestisci le categorie e i piatti per <strong>{restaurant.name}</strong>
            </p>
          </div>
          <button
            onClick={() => router.push(`/admin-dashboard/restaurants/${restaurantId}`)}
            className="cursor-pointer bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Torna all'attività</span>
          </button>
        </div>

        {/* Menu Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Informazioni Menu */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Informazioni Menu</h2>
            <p className="text-sm sm:text-base text-gray-700 mb-2"><strong>Nome:</strong> {menu.name}</p>
            <p className="text-sm sm:text-base text-gray-700 mb-2"><strong>Descrizione Menu:</strong> {menu.description || 'Nessuna descrizione'}</p>
            <p className="text-sm sm:text-base text-gray-700 mb-2"><strong>QR Code Menu:</strong> {menu.qrCodes && menu.qrCodes.length > 0 ? menu.qrCodes[0].code : 'N/A'}</p>
            <p className="text-sm sm:text-base text-gray-700 mb-4"><strong>Categorie Menu:</strong> {categories.length}</p>
            
            {/* Menu Cover Image Upload */}
            <div className="mt-4 sm:mt-6 mb-4 sm:mb-6">
              <MenuCoverImageUpload
                menuId={menuId}
                currentImage={menuCoverImage}
                onImageUpdate={setMenuCoverImage}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <button 
                onClick={() => setShowEditMenu(true)}
                className="cursor-pointer bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center w-full sm:w-auto"
              >
                <Edit className="h-4 w-4 mr-2" />
                <span className="text-sm sm:text-base">Modifica Menu</span>
              </button>
              {restaurant.slug && (
                <a
                  href={`/menu/${restaurant.slug}`}
                  target="_blank"
                  className="bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center w-full sm:w-auto"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  <span className="text-sm sm:text-base">Vedi Menu</span>
                </a>
              )}
            </div>
          </div>

          {/* QR Code Generator */}
          <QRCodeGenerator 
            url={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/menu/${menu.qrCodes && menu.qrCodes.length > 0 ? menu.qrCodes[0].code : 'menu-' + menuId}?menuId=${menuId}`}
            menuName={menu.name}
          />
          
          {/* Scansioni QR Button */}
          <div className="mt-4">
            <button
              onClick={() => router.push(`/admin-dashboard/restaurants/${restaurantId}/menus/${menuId}/qr-scans`)}
              className="cursor-pointer w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Scansioni QR
            </button>
          </div>
        </div>

        {/* Categories Management */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Categorie</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Trascina le categorie per riordinarle. L'ordinamento influenzera la visualizzazione nel menu cliente.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {hasUnsavedChanges && (
                <button
                  onClick={saveCategoriesOrder}
                  disabled={isSavingOrder}
                  className="cursor-pointer bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  <span className="text-sm sm:text-base">{isSavingOrder ? 'Salvataggio...' : 'Salva Ordinamento'}</span>
                </button>
              )}
              <button
                onClick={() => setShowAddCategories(true)}
                className="cursor-pointer bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="text-sm sm:text-base">Aggiungi Categorie</span>
              </button>
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-sm sm:text-base text-gray-600 mb-4">Nessuna categoria trovata.</p>
              <button
                onClick={() => setShowAddCategories(true)}
                className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
              >
                Aggiungi Categorie
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <SortableCategories
                categories={categories}
                onCategoriesReorder={handleCategoriesReorder}
                onEditCategory={(categoryId) => {
                  router.push(`/admin-dashboard/restaurants/${restaurantId}/menus/${menuId}/categories/${categoryId}`)
                }}
                onDeleteCategory={setShowDeleteCategory}
                onUpdateCategoryImage={handleUpdateCategoryImage}
                isUploadingImage={isUploadingImage}
                onRefresh={() => loadMenuData(restaurantId, menuId)}
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
          message={`Sei sicuro di voler eliminare questa categoria? Questa azione eliminera anche tutti i piatti associati.`}
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
