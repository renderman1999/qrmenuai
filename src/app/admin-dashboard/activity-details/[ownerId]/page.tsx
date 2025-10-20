'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, User, Mail, Calendar, MapPin, Phone, Globe, Eye, ChefHat, QrCode, Download, Copy, Check } from 'lucide-react'
import QRCode from 'qrcode'

interface Owner {
  id: string
  name: string
  email: string
  createdAt: string
  restaurants: Array<{
    id: string
    name: string
    description: string | null
    address: string
    phone: string | null
    email: string | null
    website: string | null
    logo: string | null
    isActive: boolean
    createdAt: string
    menus: Array<{
      id: string
      name: string
      description: string | null
      isActive: boolean
      createdAt: string
      categories: Array<{
        id: string
        name: string
        dishes: Array<{
          id: string
          name: string
        }>
      }>
    }>
    qrCodes: Array<{
      id: string
      code: string
      name: string | null
      description: string | null
      isActive: boolean
      scanCount: number
      lastScanned: string | null
      createdAt: string
      menuId: string | null
    }>
  }>
}

export default function ActivityDetailsPage({ params }: { params: Promise<{ ownerId: string }> }) {
  const { data: session, status } = useSession()
  const [ownerId, setOwnerId] = useState<string>('')
  const [owner, setOwner] = useState<Owner | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [qrCodeImages, setQrCodeImages] = useState<Record<string, string>>({})
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})
  const router = useRouter()

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setOwnerId(resolvedParams.ownerId)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (status === 'loading' || !ownerId) return
    
    if (status === 'unauthenticated') {
      router.push('/admin-login')
      return
    }
    
    if (session?.user?.email) {
      loadOwnerDetails(ownerId)
    }
  }, [session, status, ownerId, router])

  const generateQRCode = async (qrCode: string, qrId: string) => {
    try {
      // Usa le stesse impostazioni del QRCodeGenerator
      const qrCodeDataURL = await QRCode.toDataURL(qrCode, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1f2937', // gray-800 - stesso colore del QRCodeGenerator
          light: '#ffffff'
        }
      })
      setQrCodeImages(prev => ({
        ...prev,
        [qrId]: qrCodeDataURL
      }))
    } catch (error) {
      console.error('Errore nella generazione del QR code:', error)
    }
  }

  const downloadQRCode = (qrCodeDataUrl: string, menuName: string) => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a')
      link.download = `qr-menu-${menuName.toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = qrCodeDataUrl
      link.click()
    }
  }

  const copyUrl = async (url: string, qrId: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedStates(prev => ({
        ...prev,
        [qrId]: true
      }))
      setTimeout(() => {
        setCopiedStates(prev => ({
          ...prev,
          [qrId]: false
        }))
      }, 2000)
    } catch (error) {
      console.error('Error copying URL:', error)
    }
  }

  const loadOwnerDetails = async (ownerId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/owner-details/${ownerId}`)
      if (response.ok) {
        const data = await response.json()
        setOwner(data.owner)
        
        // Genera QR codes per tutti i menu
        if (data.owner?.restaurants) {
          data.owner.restaurants.forEach((restaurant: any) => {
            if (restaurant.qrCodes) {
              restaurant.qrCodes.forEach((qr: any) => {
                generateQRCode(qr.code, qr.id)
              })
            }
          })
        }
      } else {
        router.push('/admin-dashboard')
      }
    } catch (error) {
      console.error('Errore nel caricamento dei dettagli del proprietario:', error)
      router.push('/admin-dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento dettagli...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Il redirect è gestito nel useEffect
  }

  if (!owner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Proprietario non trovato</h1>
          <button
            onClick={() => router.push('/admin-dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Torna alla Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center">
          <button
            onClick={() => router.push('/admin-dashboard')}
            className="cursor-pointer mr-4 p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dettagli Proprietario</h1>
            <p className="text-gray-600 mt-1">Gestione completa dell'attività</p>
          </div>
        </div>

        {/* Owner Info */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Informazioni Proprietario</h2>
          </div>
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-2xl font-medium text-gray-700">
                    {owner.name?.charAt(0) || owner.email?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nome</p>
                      <p className="text-sm text-gray-900">{owner.name || 'Non disponibile'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">{owner.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Registrato il</p>
                      <p className="text-sm text-gray-900">
                        {new Date(owner.createdAt).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <ChefHat className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Ristoranti</p>
                      <p className="text-sm text-gray-900">{owner.restaurants.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Restaurants List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Ristoranti ({owner.restaurants.length})</h2>
          
          {owner.restaurants.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun ristorante</h3>
              <p className="text-gray-600">Questo proprietario non ha ancora creato ristoranti.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {owner.restaurants.map((restaurant) => (
                <div key={restaurant.id} className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {restaurant.logo ? (
                          <img 
                            src={restaurant.logo} 
                            alt={restaurant.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500 text-lg">🍽️</span>
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
                          <p className="text-sm text-gray-600">
                            {restaurant.description || 'Nessuna descrizione'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          restaurant.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {restaurant.isActive ? 'Attivo' : 'Inattivo'}
                        </span>
                        <button
                          onClick={() => router.push(`/admin-dashboard/restaurants/${restaurant.id}`)}
                          className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Gestisci
                        </button>
                        {restaurant.website && (
                          <a
                            href={restaurant.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cursor-pointer bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors flex items-center"
                          >
                            <Globe className="h-4 w-4 mr-1" />
                            Sito
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{restaurant.address}</span>
                      </div>
                      {restaurant.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{restaurant.phone}</span>
                        </div>
                      )}
                      {restaurant.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{restaurant.email}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Menus */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Menu ({restaurant.menus.length})
                      </h4>
                      {restaurant.menus.length === 0 ? (
                        <p className="text-sm text-gray-500">Nessun menu creato</p>
                      ) : (
                        <div className="space-y-3">
                          {restaurant.menus.map((menu) => {
                            // Trova il QR code associato a questo menu
                            const menuQRCode = restaurant.qrCodes.find(qr => qr.menuId === menu.id)
                            
                            return (
                              <div key={menu.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-medium text-gray-900">{menu.name}</h5>
                                  <div className="flex items-center space-x-2">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      menu.isActive 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {menu.isActive ? 'Attivo' : 'Inattivo'}
                                    </span>
                                    {menuQRCode && (
                                      <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded">
                                        <QrCode className="h-3 w-3 text-blue-600" />
                                        <span className="text-xs text-blue-600 font-medium">
                                          {menuQRCode.scanCount} scansioni
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {menu.description && (
                                  <p className="text-sm text-gray-600 mb-3">{menu.description}</p>
                                )}
                                <div className="flex justify-between items-end">
                                  <div className="text-sm text-gray-500">
                                    <p>Categorie: {menu.categories.length}</p>
                                    <p>Piatti: {menu.categories.reduce((total, cat) => total + cat.dishes.length, 0)}</p>
                                    <p>Creato: {new Date(menu.createdAt).toLocaleDateString('it-IT')}</p>
                                  </div>
                                  {menuQRCode && (
                                    <div className="text-right">
                                      <div className="bg-white border border-gray-200 rounded-lg p-3 inline-block">
                                        <div className="text-xs text-gray-500 mb-2 text-center">QR Code</div>
                                        {qrCodeImages[menuQRCode.id] ? (
                                          <div className="flex flex-col items-center">
                                            <img 
                                              src={qrCodeImages[menuQRCode.id]} 
                                              alt={`QR Code for ${menu.name}`}
                                              className="border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                              onClick={() => {
                                                const url = `${window.location.origin}/menu/${menuQRCode.code}?menuId=${menu.id}`
                                                window.open(url, '_blank')
                                              }}
                                              title="Clicca per aprire il menu"
                                            />
                                            <div className="text-xs text-gray-600 mt-2 text-center">
                                              I clienti scansionano questo QR code per accedere al menu
                                            </div>
                                            <div className="text-xs font-mono text-gray-500 mt-1 text-center">
                                              {menuQRCode.code}
                                            </div>
                                            <div className="flex flex-col gap-2 mt-3">
                                              <button
                                                onClick={() => {
                                                  const url = `${window.location.origin}/menu/${menuQRCode.code}?menuId=${menu.id}`
                                                  window.open(url, '_blank')
                                                }}
                                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                                              >
                                                Apri Menu
                                              </button>
                                              
                                              <div className="flex gap-2">
                                                <button
                                                  onClick={() => downloadQRCode(qrCodeImages[menuQRCode.id], menu.name)}
                                                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                                >
                                                  <Download className="h-3 w-3" />
                                                  Scarica
                                                </button>
                                                
                                                <button
                                                  onClick={() => {
                                                    const url = `${window.location.origin}/menu/${menuQRCode.code}?menuId=${menu.id}`
                                                    copyUrl(url, menuQRCode.id)
                                                  }}
                                                  className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                                                >
                                                  {copiedStates[menuQRCode.id] ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                  {copiedStates[menuQRCode.id] ? 'Copiato!' : 'Copia URL'}
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-center h-48">
                                            <div className="text-center">
                                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                              <p className="mt-2 text-sm text-gray-600">Generazione QR Code...</p>
                                            </div>
                                          </div>
                                        )}
                                        {menuQRCode.lastScanned && (
                                          <div className="text-xs text-gray-400 mt-2 text-center">
                                            Ultima scansione: {new Date(menuQRCode.lastScanned).toLocaleDateString('it-IT')}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
