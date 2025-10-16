'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faSave, faSpinner } from '@fortawesome/free-solid-svg-icons'
import ImageDropzone from '@/components/admin/ImageDropzone'

interface Restaurant {
  id: string
  name: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  image: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function EditRestaurantPage() {
  const params = useParams()
  const router = useRouter()
  const restaurantId = params.id as string

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    coverImage: '',
    isActive: true
  })

  // Carica i dati del ristorante
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setLoading(true)
        
        // Check if user is logged in
        const isLoggedIn = localStorage.getItem('adminLoggedIn')
        const userData = localStorage.getItem('adminUser')
        
        if (!isLoggedIn || !userData) {
          router.push('/admin-login')
          return
        }
        
        const user = JSON.parse(userData)
        
        const response = await fetch(`/api/restaurants/${restaurantId}`, {
          headers: {
            'x-user-email': user.email
          }
        })
        
        if (!response.ok) {
          throw new Error('Errore nel caricamento del ristorante')
        }
        
        const data = await response.json()
        setRestaurant(data)
        
        // Popola il form con i dati esistenti
        setFormData({
          name: data.name || '',
          description: data.description || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          logo: data.logo || '',
          coverImage: data.coverImage || '',
          isActive: data.isActive ?? true
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore nel caricamento')
      } finally {
        setLoading(false)
      }
    }

    if (restaurantId) {
      fetchRestaurant()
    }
  }, [restaurantId, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleImageUpload = (imageUrl: string, type: 'logo' | 'coverImage' = 'coverImage') => {
    setFormData(prev => ({
      ...prev,
      [type]: imageUrl
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Get user data for authentication
      const userData = localStorage.getItem('adminUser')
      if (!userData) {
        setError('Sessione scaduta. Effettua nuovamente il login.')
        return
      }
      
      const user = JSON.parse(userData)

      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nel salvataggio')
      }

      setSuccess('Ristorante aggiornato con successo!')
      
      // Redirect dopo 2 secondi
      setTimeout(() => {
        router.push(`/admin-dashboard/restaurants/${restaurantId}`)
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel salvataggio')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Caricamento ristorante...</p>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Ristorante non trovato</p>
          <button
            onClick={() => router.push('/admin-dashboard/restaurants')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Torna alla lista
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.push(`/admin-dashboard/restaurants/${restaurantId}`)}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Modifica Ristorante</h1>
          </div>
          <p className="text-gray-600">Aggiorna le informazioni del ristorante</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome Ristorante *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Inserisci il nome del ristorante"
              />
            </div>

            {/* Descrizione */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descrivi il ristorante..."
              />
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo del Ristorante
              </label>
              <ImageDropzone
                onImageUpload={(imageUrl) => handleImageUpload(imageUrl, 'logo')}
                currentImage={formData.logo}
                userType="restaurant"
                userId={restaurantId}
                dishId={undefined}
              />
            </div>

            {/* Immagine di Copertina */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Immagine di Copertina
              </label>
              <ImageDropzone
                onImageUpload={(imageUrl) => handleImageUpload(imageUrl, 'coverImage')}
                currentImage={formData.coverImage}
                userType="restaurant"
                userId={restaurantId}
                dishId={undefined}
              />
            </div>

            {/* Indirizzo */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Indirizzo
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Via, Città, CAP"
              />
            </div>

            {/* Telefono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Telefono
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+39 123 456 7890"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ristorante@example.com"
              />
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                Sito Web
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://www.ristorante.com"
              />
            </div>

            {/* Stato Attivo */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Ristorante attivo
              </label>
            </div>

            {/* Messaggi di errore/successo */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                {success}
              </div>
            )}

            {/* Pulsanti */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push(`/admin-dashboard/restaurants/${restaurantId}`)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {saving ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin mr-2" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="h-4 w-4 mr-2" />
                    Salva Modifiche
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
