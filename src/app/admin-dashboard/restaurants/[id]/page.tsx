'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Edit, Plus, Eye, QrCode, Trash2, ChefHat, FileText, Star } from 'lucide-react'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import ArticleManager from '@/components/admin/ArticleManager'
import ReviewManager from '@/components/admin/ReviewManager'
import QRCodeGenerator from '@/components/admin/QRCodeGenerator'

interface Restaurant {
  id: string
  name: string
  slug: string
  description: string | null
  address: string
  phone: string
  email: string
  website: string | null
  instagram: string | null
  facebook: string | null
  whatsapp: string | null
  logo: string | null
  coverImage: string | null
  isActive: boolean
  ordersEnabled: boolean
  chatbotEnabled: boolean
  telegramEnabled: boolean
  telegramChannelId?: string | null
  telegramBotToken?: string | null
  licenseTier: string
  createdAt: string
  updatedAt: string
  qrCodes: Array<{
    id: string
    code: string
    isActive: boolean
    scanCount: number
    lastScanned: string | null
  }>
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
  const { data: session, status } = useSession()
  const { id: restaurantId } = use(params)
  const [isLoading, setIsLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [showDeleteRestaurant, setShowDeleteRestaurant] = useState(false)
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [articles, setArticles] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'articles' | 'reviews' | 'qr-scans'>('overview')
  
  // QR Stats states
  const [qrStats, setQrStats] = useState<any>(null)
  const [isLoadingQrStats, setIsLoadingQrStats] = useState(false)
  
  // Loading states for toggles
  const [isTogglingOrders, setIsTogglingOrders] = useState(false)
  const [isTogglingChatbot, setIsTogglingChatbot] = useState(false)
  const [isTogglingTelegram, setIsTogglingTelegram] = useState(false)
  const [isSavingTelegramChannel, setIsSavingTelegramChannel] = useState(false)
  const [telegramChannelInput, setTelegramChannelInput] = useState('')
  const [telegramChannelError, setTelegramChannelError] = useState<string | null>(null)
  const [isSendingTelegramTest, setIsSendingTelegramTest] = useState(false)
  const [telegramBotTokenInput, setTelegramBotTokenInput] = useState('')
  const [isTogglingSendOrders, setIsTogglingSendOrders] = useState(false)
  
  // Success feedback states
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()

  // Funzione per mostrare messaggi di successo
  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setShowSuccessMessage(true)
    setTimeout(() => {
      setShowSuccessMessage(false)
    }, 3000)
  }

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/admin-login')
      return
    }
    
    if (session?.user?.email && !restaurant) {
      loadRestaurant(restaurantId)
    }
  }, [session, status, restaurantId, router, restaurant])

  const loadRestaurant = async (restaurantId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/restaurants')
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Loaded restaurants data:', data)
        const foundRestaurant = data.restaurants.find((r: Restaurant) => r.id === restaurantId)
        if (foundRestaurant) {
          console.log('🍽️ Found restaurant:', foundRestaurant.name, 'ordersEnabled:', foundRestaurant.ordersEnabled)
          setRestaurant(foundRestaurant)
          setTelegramChannelInput(foundRestaurant.telegramChannelId || '')
          setTelegramBotTokenInput(foundRestaurant.telegramBotToken || '')
          // Carica anche articoli e recensioni
          loadArticles(restaurantId)
          loadReviews(restaurantId)
        } else {
          router.push('/admin-dashboard')
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento del ristorante:', error)
      router.push('/admin-dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  // Carica dati quando cambia tab
  useEffect(() => {
    if (restaurant && activeTab === 'articles') {
      loadArticles(restaurant.id)
    } else if (restaurant && activeTab === 'reviews') {
      loadReviews(restaurant.id)
    } else if (restaurant && activeTab === 'qr-scans') {
      loadQrStats(restaurant.id)
    }
  }, [activeTab, restaurant])

  const handleOrdersToggle = async () => {
    if (!restaurant || isTogglingOrders) return
    
    setIsTogglingOrders(true)
    try {
      console.log('🔄 Toggling orders for restaurant:', restaurant.id, 'Current value:', restaurant.ordersEnabled)
      
      const response = await fetch(`/api/restaurants/${restaurant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ordersEnabled: !restaurant.ordersEnabled
        })
      })

      if (response.ok) {
        const updatedRestaurant = await response.json()
        console.log('✅ Restaurant updated successfully:', updatedRestaurant.ordersEnabled)
        setRestaurant(prev => prev ? { ...prev, ordersEnabled: !prev.ordersEnabled } : null)
        showSuccess(restaurant.ordersEnabled ? 'Ordini disabilitati con successo' : 'Ordini abilitati con successo')
      } else {
        const errorData = await response.json()
        console.error('❌ Errore nell\'aggiornamento delle impostazioni ordini:', errorData)
        alert(`Errore: ${errorData.error || 'Errore sconosciuto'}`)
      }
    } catch (error) {
      console.error('❌ Errore nella richiesta:', error)
      alert('Errore di connessione. Riprova.')
    } finally {
      setIsTogglingOrders(false)
    }
  }

  const handleChatbotToggle = async () => {
    if (!restaurant || isTogglingChatbot) return
    
    setIsTogglingChatbot(true)
    try {
      console.log('🔄 Toggling chatbot for restaurant:', restaurant.id, 'Current value:', restaurant.chatbotEnabled)
      
      const response = await fetch(`/api/restaurants/${restaurant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatbotEnabled: !restaurant.chatbotEnabled
        })
      })

      if (response.ok) {
        const updatedRestaurant = await response.json()
        console.log('✅ Restaurant chatbot updated successfully:', updatedRestaurant.chatbotEnabled)
        setRestaurant(prev => prev ? { ...prev, chatbotEnabled: !prev.chatbotEnabled } : null)
        showSuccess(restaurant.chatbotEnabled ? 'Chatbot disabilitato con successo' : 'Chatbot abilitato con successo')
      } else {
        const errorData = await response.json()
        console.error('❌ Errore nell\'aggiornamento delle impostazioni chatbot:', errorData)
        alert(`Errore: ${errorData.error || 'Errore sconosciuto'}`)
      }
    } catch (error) {
      console.error('❌ Errore nella richiesta:', error)
      alert('Errore di connessione. Riprova.')
    } finally {
      setIsTogglingChatbot(false)
    }
  }

  const handleTelegramToggle = async () => {
    if (!restaurant || isTogglingTelegram) return
    
    setIsTogglingTelegram(true)
    try {
      console.log('🔄 Toggling telegram for restaurant:', restaurant.id, 'Current value:', restaurant.telegramEnabled)
      
      const response = await fetch(`/api/restaurants/${restaurant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telegramEnabled: !restaurant.telegramEnabled
        })
      })

      if (response.ok) {
        const updatedRestaurant = await response.json()
        console.log('✅ Restaurant telegram updated successfully:', updatedRestaurant.telegramEnabled)
        setRestaurant(prev => prev ? { ...prev, telegramEnabled: !prev.telegramEnabled } : null)
        showSuccess(restaurant.telegramEnabled ? 'Messaggistica Telegram disabilitata con successo' : 'Messaggistica Telegram abilitata con successo')
      } else {
        const errorData = await response.json()
        console.error('❌ Errore nell\'aggiornamento delle impostazioni telegram:', errorData)
        alert(`Errore: ${errorData.error || 'Errore sconosciuto'}`)
      }
    } catch (error) {
      console.error('❌ Errore nella richiesta:', error)
      alert('Errore di connessione. Riprova.')
    } finally {
      setIsTogglingTelegram(false)
    }
  }

  const handleSaveTelegramChannel = async () => {
    if (!restaurant || isSavingTelegramChannel) return
    // Validazione client-side rapida
    const v = telegramChannelInput.trim()
    if (
      v &&
      !( /^@[A-Za-z0-9_]{5,32}$/.test(v) || /^-?\d{5,20}$/.test(v) )
    ) {
      setTelegramChannelError('Formato non valido. Usa @nome_canale (5-32 chars) o ID numerico')
      return
    }
    setTelegramChannelError(null)
    setIsSavingTelegramChannel(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          telegramChannelId: telegramChannelInput.trim(),
          telegramBotToken: telegramBotTokenInput.trim()
        })
      })
      if (response.ok) {
        const updated = await response.json()
        setRestaurant(prev => prev ? { ...prev, telegramChannelId: updated.telegramChannelId, telegramBotToken: updated.telegramBotToken } : prev)
        showSuccess('ID canale Telegram salvato')
      } else {
        const err = await response.json()
        const msg = err.details?.[0]?.message || err.error || 'Impossibile salvare ID canale'
        setTelegramChannelError(typeof msg === 'string' ? msg : 'Formato non valido')
      }
    } catch (e) {
      alert('Errore di connessione')
    } finally {
      setIsSavingTelegramChannel(false)
    }
  }

  const handleSendTelegramTest = async () => {
    if (!restaurant || isSendingTelegramTest) return
    setIsSendingTelegramTest(true)
    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/telegram-test`, { method: 'POST' })
      if (res.ok) {
        showSuccess('Messaggio di test inviato su Telegram')
      } else {
        const err = await res.json()
        alert(err.error || 'Invio fallito')
      }
    } catch (e) {
      alert('Errore di connessione nell\'invio test')
    } finally {
      setIsSendingTelegramTest(false)
    }
  }

  const loadArticles = async (restaurantId: string) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/articles`)
      if (response.ok) {
        const data = await response.json()
        setArticles(data)
      }
    } catch (error) {
      console.error('Errore nel caricamento degli articoli:', error)
    }
  }

  const loadReviews = async (restaurantId: string) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reviews`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data)
      }
    } catch (error) {
      console.error('Errore nel caricamento delle recensioni:', error)
    }
  }

  const loadQrStats = async (restaurantId: string) => {
    setIsLoadingQrStats(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/qr-stats`)
      if (response.ok) {
        const data = await response.json()
        setQrStats(data)
      }
    } catch (error) {
      console.error('Errore nel caricamento delle statistiche QR:', error)
    } finally {
      setIsLoadingQrStats(false)
    }
  }

  const deleteMenu = async (menuId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/menus/${menuId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': session?.user?.email || ''
        }
      })

      if (response.ok) {
        // Ricarica i dati del ristorante
        await loadRestaurant(restaurantId)
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
          'x-user-email': session?.user?.email || ''
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
          <p className="mt-4 text-gray-600">Sto caricando l'attività...</p>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/admin-dashboard')}
              className="cursor-pointer mr-3 sm:mr-4 p-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{restaurant.name}</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                Gestisci i dettagli e i menu della tua attività
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => router.push(`/admin-dashboard/restaurants/${restaurant.id}/edit`)}
              className="cursor-pointer bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center w-full sm:w-auto"
              title="Modifica i dettagli della tua attività"
            >
              <Edit className="h-4 w-4 mr-2" />
              <span className="text-sm sm:text-base">Modifica Attività</span>
            </button>
           
            <button
              onClick={() => router.push(`/admin-dashboard/restaurants/${restaurant.id}/orders`)}
              className="cursor-pointer bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center w-full sm:w-auto"
            >
              <ChefHat className="h-4 w-4 mr-2" />
              <span className="text-sm sm:text-base">Gestisci Ordini</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-4 sm:mb-6">
          <nav className="-mb-px flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Panoramica
            </button>
            <button
              onClick={() => setActiveTab('articles')}
              className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'articles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Articoli
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'reviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Star className="w-4 h-4 mr-2" />
              Recensioni
            </button>
            <button
              onClick={() => setActiveTab('qr-scans')}
              className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'qr-scans'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <QrCode className="w-4 h-4 mr-2" />
              Scansioni QR
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Restaurant Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-white shadow rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Informazioni Attività</h2>
              <div className="space-y-3 sm:space-y-4">
                {/* Logo del Ristorante */}
                <div>
                   <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {restaurant.logo ? (
                        <img 
                          src={restaurant.logo} 
                          alt={`Logo ${restaurant.name}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      {restaurant.logo ? '' : 'Nessun logo caricato'}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-800 bold">Nome</label>
                  <p className="mt-1 text-xs sm:text-sm text-gray-900">{restaurant.name}</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Descrizione</label>
                  <p className="mt-1 text-xs sm:text-sm text-gray-900">
                    {restaurant.description || 'Nessuna descrizione'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Indirizzo</label>
                  <p className="mt-1 text-xs sm:text-sm text-gray-900">{restaurant.address}</p>
                </div>
                
                {/* Checkbox per abilitare ordini */}
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="ordersEnabled"
                        checked={restaurant.ordersEnabled || false}
                        onChange={handleOrdersToggle}
                        disabled={isTogglingOrders}
                        className="cursor-pointer h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                      />
                      {isTogglingOrders && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                    <label htmlFor="ordersEnabled" className="text-sm font-medium text-gray-700">
                      Abilita ordini dal menu
                      {isTogglingOrders && <span className="ml-2 text-blue-600">Aggiornamento...</span>}
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Quando abilitato, i clienti possono ordinare direttamente dal menu digitale
                  </p>
                </div>

                {/* Checkbox per abilitare chatbot */}
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="chatbotEnabled"
                        checked={restaurant.chatbotEnabled || false}
                        onChange={handleChatbotToggle}
                        disabled={isTogglingChatbot}
                        className="cursor-pointer h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                      />
                      {isTogglingChatbot && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                    <label htmlFor="chatbotEnabled" className="text-sm font-medium text-gray-700">
                      Abilita Chatbot nel menu
                      {isTogglingChatbot && <span className="ml-2 text-blue-600">Aggiornamento...</span>}
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Quando abilitato, i clienti possono interagire con il chatbot nel menu pubblico
                  </p>
                </div>

                {/* Checkbox per abilitare messaggistica Telegram */}
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="telegramEnabled"
                        checked={restaurant.telegramEnabled || false}
                        onChange={handleTelegramToggle}
                        disabled={isTogglingTelegram}
                        className="cursor-pointer h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                      />
                      {isTogglingTelegram && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                    <label htmlFor="telegramEnabled" className="text-sm font-medium text-gray-700">
                      Abilita messaggistica Telegram
                      {isTogglingTelegram && <span className="ml-2 text-blue-600">Aggiornamento...</span>}
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Quando abilitato, i clienti possono ricevere notifiche e messaggi tramite Telegram
                  </p>
                  {restaurant.telegramEnabled && (
                    <div className="mt-3 flex flex-col gap-2">
                      <input
                        type="text"
                        value={telegramChannelInput}
                        onChange={(e) => setTelegramChannelInput(e.target.value)}
                        placeholder="@nome_canale o ID numerico"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <input
                        type="password"
                        value={telegramBotTokenInput}
                        onChange={(e) => setTelegramBotTokenInput(e.target.value)}
                        placeholder="Telegram Bot Token (es. 123456:ABC...)"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <div className="flex items-center gap-2 pt-1">
                        <button
                        type="button"
                        onClick={handleSaveTelegramChannel}
                        disabled={isSavingTelegramChannel || !!telegramChannelError}
                        className="cursor-pointer bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                          {isSavingTelegramChannel ? 'Salvando...' : 'Salva'}
                        </button>
                        <button
                          type="button"
                          onClick={handleSendTelegramTest}
                          disabled={isSendingTelegramTest || !restaurant.telegramChannelId}
                          className="cursor-pointer bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                        >
                          {isSendingTelegramTest ? 'Inviando...' : 'Invia test'}
                        </button>
                      </div>
                      <div className="pt-2">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <input
                              type="checkbox"
                              id="sendOrdersToTelegram"
                              checked={restaurant.sendOrdersToTelegram || false}
                              onChange={async () => {
                                if (!restaurant) return
                                if (isTogglingSendOrders) return
                                setIsTogglingSendOrders(true)
                                try {
                                  const resp = await fetch(`/api/restaurants/${restaurant.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ sendOrdersToTelegram: !(restaurant.sendOrdersToTelegram || false) })
                                  })
                                  if (resp.ok) {
                                    setRestaurant(prev => prev ? { ...prev, sendOrdersToTelegram: !(prev.sendOrdersToTelegram || false) } : prev)
                                    showSuccess((restaurant.sendOrdersToTelegram ? 'Invio ordini su Telegram disabilitato' : 'Invio ordini su Telegram abilitato'))
                                  } else {
                                    const err = await resp.json()
                                    alert(err.error || 'Errore aggiornamento')
                                  }
                                } finally {
                                  setIsTogglingSendOrders(false)
                                }
                              }}
                              disabled={isTogglingSendOrders}
                              className="cursor-pointer h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                            />
                          </div>
                          <label htmlFor="sendOrdersToTelegram" className="text-sm font-medium text-gray-700">
                            Invia ordini su Telegram
                            {isTogglingSendOrders && <span className="ml-2 text-blue-600">Aggiornamento...</span>}
                          </label>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Se attivo, ogni nuovo ordine verrà inviato al canale Telegram configurato.</p>
                      </div>
                    </div>
                  )}
                  {restaurant.telegramEnabled && telegramChannelError && (
                    <p className="mt-2 text-xs text-red-600">{telegramChannelError}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">Telefono</label>
                    <p className="mt-1 text-xs sm:text-sm text-gray-900">{restaurant.phone}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-xs sm:text-sm text-gray-900">{restaurant.email}</p>
                  </div>
                </div>
                
                {/* Social Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">Instagram</label>
                    <p className="mt-1 text-xs sm:text-sm text-gray-900">
                      {restaurant.instagram ? (
                        <a 
                          href={restaurant.instagram} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {restaurant.instagram}
                        </a>
                      ) : (
                        'Non impostato'
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">Facebook</label>
                    <p className="mt-1 text-xs sm:text-sm text-gray-900">
                      {restaurant.facebook ? (
                        <a 
                          href={restaurant.facebook} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {restaurant.facebook}
                        </a>
                      ) : (
                        'Non impostato'
                      )}
                    </p>
                  </div>
                </div>
                
                {/* WhatsApp */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">WhatsApp</label>
                  <p className="mt-1 text-xs sm:text-sm text-gray-900">
                    {restaurant.whatsapp ? (
                      <a 
                        href={`https://wa.me/${restaurant.whatsapp.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800 underline"
                      >
                        {restaurant.whatsapp}
                      </a>
                    ) : (
                      'Non impostato'
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Stato</label>
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
            <div className="bg-white shadow rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3 sm:gap-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Tutti i menu ({restaurant.menus.length})</h2>
                <button
                  onClick={() => router.push(`/admin-dashboard/restaurants/${restaurant.id}/menus/new`)}
                  className="cursor-pointer bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="text-sm sm:text-base">Nuovo Menu</span>
                </button>
              </div>
              
              {restaurant.menus.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-sm sm:text-base text-gray-600 mb-4">Nessun menu creato per questo ristorante.</p>
                  <button
                    onClick={() => router.push(`/admin-dashboard/restaurants/${restaurant.id}/menus/new`)}
                    className="cursor-pointer bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
                  >
                    Crea il primo menu
                  </button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {restaurant.menus.map((menu) => (
                    <div key={menu.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{menu.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            {menu.description || 'Nessuna descrizione'}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                            <span>Categorie: {menu.categories.length}</span>
                            <span>Piatti: {menu.categories.reduce((total, cat) => total + cat.dishes.length, 0)}</span>
                            <span>Scansioni: {menu.qrCodes.reduce((total, qr) => total + qr.scanCount, 0)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
                          {restaurant.slug && (
                            <a
                              href={`/menu/${restaurant.slug}`}
                              target="_blank"
                              className="cursor-pointer bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors flex items-center justify-center w-full sm:w-auto"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              <span className="text-sm">Anteprima</span>
                            </a>
                          )}
                          <button
                            onClick={() => router.push(`/admin-dashboard/restaurants/${restaurant.id}/menus/${menu.id}`)}
                            className="cursor-pointer bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors w-full sm:w-auto"
                          >
                            <span className="text-sm">Gestisci Menu</span>
                          </button>
                          <button
                            onClick={() => setShowDeleteMenu(menu.id)}
                            className="cursor-pointer bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors flex items-center justify-center w-full sm:w-auto"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            <span className="text-sm">Elimina Menu</span>
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
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Stats */}
            <div className="bg-white shadow rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Statistiche</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Menu Totali</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">{restaurant.menus.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Categorie Totali</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                    {restaurant.menus.reduce((total, menu) => total + menu.categories.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Piatti Totali</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                    {restaurant.menus.reduce((total, menu) => 
                      total + menu.categories.reduce((catTotal, cat) => catTotal + cat.dishes.length, 0), 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Scansioni Totali</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                    {restaurant.menus.reduce((total, menu) => 
                      total + menu.qrCodes.reduce((qrTotal, qr) => qrTotal + qr.scanCount, 0), 0
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code Landing Page */}
            <div className="bg-white shadow rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">QR Attività</h3>
              <div className="text-center">
                {restaurant.qrCodes && restaurant.qrCodes.length > 0 ? (
                  <>
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">
                        <strong>Codice:</strong> {restaurant.qrCodes[0].code}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Scansioni:</strong> {restaurant.qrCodes[0].scanCount}
                      </p>
                      {restaurant.qrCodes[0].lastScanned && (
                        <p className="text-sm text-gray-600">
                          <strong>Ultima scansione:</strong> {new Date(restaurant.qrCodes[0].lastScanned).toLocaleString('it-IT')}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-center">
                      <QRCodeGenerator 
                        url={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/menu/${restaurant.slug}`}
                        menuName={`${restaurant.name} - Landing Page`}
                      />
                    </div>
                  </>
                ) : (
                  <div className="mb-3">
                     <div className="flex justify-center">
                      <QRCodeGenerator 
                        url={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/menu/${restaurant.slug}`}
                        menuName={`${restaurant.name} - Landing Page`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Azioni Rapide</h3>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => router.push(`/admin-dashboard/restaurants/${restaurant.id}/menus/new`)}
                  className="cursor-pointer w-full bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm sm:text-base"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Menu
                </button>
                <button
                  onClick={() => router.push(`/admin-dashboard/restaurants/${restaurant.id}/edit`)}
                  className="cursor-pointer w-full bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm sm:text-base"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifica Attività
                </button>
                <button
                  onClick={() => router.push('/admin-dashboard')}
                  className="cursor-pointer w-full bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
                >
                  Torna alla Dashboard
                </button>
                <button
                  onClick={() => setShowDeleteRestaurant(true)}
                  className="cursor-pointer w-full bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center text-sm sm:text-base"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina Attività
                </button>
              </div>
            </div>
          </div>
        </div>
          </>
        )}

        {activeTab === 'articles' && (
          <div className="mt-8">
            <ArticleManager
              restaurantId={restaurant.id}
              articles={articles}
              onArticlesUpdate={setArticles}
            />
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="mt-8">
            <ReviewManager
              restaurantId={restaurant.id}
              reviews={reviews}
              onReviewsUpdate={setReviews}
            />
          </div>
        )}

        {activeTab === 'qr-scans' && (
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Statistiche Scansioni QR</h2>
              
              {isLoadingQrStats ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Caricamento statistiche...</span>
                </div>
              ) : qrStats ? (
                <>
                  {/* Layout a due colonne */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Colonna sinistra - Statistiche Generali */}
                    <div className="lg:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiche Generali</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <QrCode className="h-8 w-8 text-blue-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-blue-600">Scansioni Totali</p>
                              <p className="text-2xl font-bold text-blue-900">{qrStats.totalScans}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-green-600">Con Geolocalizzazione</p>
                              <p className="text-2xl font-bold text-green-900">{qrStats.scansWithLocation}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 102 2v.5" />
                            </svg>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-purple-600">Paesi Unici</p>
                              <p className="text-2xl font-bold text-purple-900">{qrStats.topCountries.length}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-orange-600">Città Uniche</p>
                              <p className="text-2xl font-bold text-orange-900">{qrStats.topCities.length}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Colonna destra - QR Code Landing Page */}
                    <div className="lg:col-span-1">
                      {restaurant.qrCodes && restaurant.qrCodes.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code Landing Page</h3>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Codice: {restaurant.qrCodes[0].code}</p>
                              <p className="text-sm text-gray-600">
                                Scansioni: {restaurant.qrCodes[0].scanCount} | 
                                Ultima scansione: {restaurant.qrCodes[0].lastScanned ? 
                                  new Date(restaurant.qrCodes[0].lastScanned).toLocaleString('it-IT') : 
                                  'Mai'
                                }
                              </p>
                            </div>
                            <div className="flex justify-center">
                              <QRCodeGenerator 
                                url={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/menu/${restaurant.slug}`}
                                menuName={`${restaurant.name} - Landing Page`}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Grafici e Statistiche Dettagliate */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Top Paesi */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Paesi</h3>
                      {qrStats.topCountries.length > 0 ? (
                        <div className="space-y-2">
                          {qrStats.topCountries.slice(0, 5).map((country: any, index: number) => (
                            <div key={country.country} className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">{country.country}</span>
                              <div className="flex items-center">
                                <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${(country.count / qrStats.topCountries[0].count) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{country.count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Nessun dato disponibile</p>
                      )}
                    </div>

                    {/* Top Città */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Città</h3>
                      {qrStats.topCities.length > 0 ? (
                        <div className="space-y-2">
                          {qrStats.topCities.slice(0, 5).map((city: any, index: number) => (
                            <div key={city.city} className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">{city.city}</span>
                              <div className="flex items-center">
                                <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-green-600 h-2 rounded-full" 
                                    style={{ width: `${(city.count / qrStats.topCities[0].count) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{city.count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Nessun dato disponibile</p>
                      )}
                    </div>
                  </div>

                  {/* Statistiche Dispositivi e Connessioni */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Dispositivi */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Dispositivi</h3>
                      {qrStats.deviceStats.length > 0 ? (
                        <div className="space-y-2">
                          {qrStats.deviceStats.map((device: any) => (
                            <div key={device.device} className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">{device.device}</span>
                              <div className="flex items-center">
                                <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-purple-600 h-2 rounded-full" 
                                    style={{ width: `${(device.count / qrStats.totalScans) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{device.count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Nessun dato disponibile</p>
                      )}
                    </div>

                    {/* Connessioni */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipi di Connessione</h3>
                      {qrStats.connectionStats.length > 0 ? (
                        <div className="space-y-2">
                          {qrStats.connectionStats.map((connection: any) => (
                            <div key={connection.connection} className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">{connection.connection}</span>
                              <div className="flex items-center">
                                <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-orange-600 h-2 rounded-full" 
                                    style={{ width: `${(connection.count / qrStats.totalScans) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{connection.count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Nessun dato disponibile</p>
                      )}
                    </div>
                  </div>

                  {/* Scansioni Recenti */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Scansioni Recenti</h3>
                    {qrStats.recentScans.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paese</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Città</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizzazione</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispositivo</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {qrStats.recentScans.slice(0, 10).map((scan: any) => (
                              <tr key={scan.id}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(scan.scannedAt).toLocaleString('it-IT')}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {scan.ipAddress}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {scan.location.country}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {scan.location.city}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {scan.location.organization}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <div className="flex space-x-1">
                                    {scan.location.isMobile && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Mobile
                                      </span>
                                    )}
                                    {scan.location.isHosting && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        Hosting
                                      </span>
                                    )}
                                    {scan.location.isAnonymous && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Anonymous
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Nessuna scansione recente</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Errore nel caricamento delle statistiche</p>
                </div>
              )}


              {/* QR Codes Menu */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Codes Menu</h3>
                {restaurant.menus.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nessun menu disponibile</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {restaurant.menus.map((menu) => (
                      <div key={menu.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-center">
                          <h4 className="font-medium text-gray-900 mb-3">{menu.name}</h4>
                          {menu.qrCodes && menu.qrCodes.length > 0 ? (
                            <>
                              <div className="mb-3">
                                <p className="text-sm text-gray-600">
                                  <strong>Codice:</strong> {menu.qrCodes[0].code}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <strong>Scansioni:</strong> {menu.qrCodes[0].scanCount}
                                </p>
                              </div>
                              <div className="flex justify-center">
                                <QRCodeGenerator 
                                  url={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/menu/${menu.qrCodes[0].code}?menuId=${menu.id}`}
                                  menuName={menu.name}
                                />
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500"></p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messaggio di successo */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-right duration-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

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
