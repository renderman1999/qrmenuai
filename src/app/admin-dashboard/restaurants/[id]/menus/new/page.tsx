'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Plus } from 'lucide-react'

interface NewMenuPageProps {
  params: {
    id: string
  }
}

export default function NewMenuPage({ params }: NewMenuPageProps) {
  const { id: restaurantId } = params
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
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
    loadRestaurant(restaurantId, userObj.email)
    setIsLoading(false)
  }, [router, restaurantId])

  const loadRestaurant = async (restId: string, userEmail: string) => {
    try {
      const response = await fetch(`/api/restaurants?id=${restId}`, {
        headers: {
          'x-user-email': userEmail
        }
      })
      if (response.ok) {
        const data = await response.json()
        setRestaurant(data.restaurants[0])
      } else {
        router.push('/admin-dashboard')
      }
    } catch (error) {
      console.error('Errore nel caricamento del ristorante:', error)
      router.push('/admin-dashboard')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      const response = await fetch('/api/menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify({
          ...formData,
          restaurantId: restaurantId
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to restaurant detail page
        router.push(`/admin-dashboard/restaurants/${restaurantId}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Errore durante la creazione del menu.')
      }
    } catch (err) {
      console.error('Error creating menu:', err)
      setError('Errore di rete o del server.')
    } finally {
      setIsSaving(false)
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

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">
          <p>Ristorante non trovato.</p>
          <button onClick={() => router.push('/admin-dashboard')} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
            Torna alla Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Crea Nuovo Menu</h1>
            <p className="text-gray-600 mt-2">
              Aggiungi un nuovo menu per <strong>{restaurant.name}</strong>
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

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome Menu
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="es. Menu Pranzo, Menu Cena, Menu Speciale"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descrizione
              </label>
              <textarea
                name="description"
                id="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descrizione del menu (opzionale)"
              ></textarea>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push(`/admin-dashboard/restaurants/${restaurantId}`)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isSaving}
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creazione...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Crea Menu</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">i</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Cosa succede dopo?
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Dopo aver creato il menu, potrai:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Aggiungere categorie (es. Antipasti, Primi, Secondi, Dolci)</li>
                  <li>Aggiungere piatti a ogni categoria</li>
                  <li>Configurare allergeni e ingredienti</li>
                  <li>Generare un QR code per il menu</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
