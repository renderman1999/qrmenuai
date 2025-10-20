'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { X, Save, Loader2, Image as ImageIcon, Images } from 'lucide-react'
import ImageDropzone from './ImageDropzone'
import ImageGallery from './ImageGallery'
import DishGalleryManager from './DishGalleryManager'
import AdditionalInfoManager, { AdditionalInfoSection } from './AdditionalInfoManager'

interface DishFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  categoryId: string
  restaurantId?: string
  dish?: {
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
    galleryEnabled?: boolean
    galleryImages?: Array<{url: string, alt?: string, order: number}>
    additionalInfo?: {
      sections: AdditionalInfoSection[]
    }
  } | null
}


export default function DishFormModal({
  isOpen,
  onClose,
  onSave,
  categoryId,
  restaurantId,
  dish
}: DishFormModalProps) {
  const { data: session } = useSession()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    allergenIds: [] as string[],
    ingredientIds: [] as string[],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
    image: '',
    galleryEnabled: false,
    galleryImages: [] as Array<{url: string, alt?: string, order: number}>,
    additionalInfo: {
      sections: [] as AdditionalInfoSection[]
    }
  })
  const [availableAllergens, setAvailableAllergens] = useState<any[]>([])
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showImageGallery, setShowImageGallery] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadAllergensAndIngredients()
      
      if (dish) {
        setFormData({
          name: dish.name,
          description: dish.description || '',
          price: typeof dish.price === 'string' ? parseFloat(dish.price) : dish.price,
          allergenIds: dish.dishAllergens?.map((a: any) => a.allergenId) || [],
          ingredientIds: dish.dishIngredients?.map((i: any) => i.ingredientId) || [],
          isVegetarian: dish.isVegetarian,
          isVegan: dish.isVegan,
          isGlutenFree: dish.isGlutenFree,
          isSpicy: dish.isSpicy,
          image: dish.image || '',
          galleryEnabled: dish.galleryEnabled || false,
          galleryImages: dish.galleryImages || [],
          additionalInfo: dish.additionalInfo || { sections: [] }
        })
      } else {
        setFormData({
          name: '',
          description: '',
          price: 0,
          allergenIds: [],
          ingredientIds: [],
          isVegetarian: false,
          isVegan: false,
          isGlutenFree: false,
          isSpicy: false,
          image: '',
          galleryEnabled: false,
          galleryImages: [],
          additionalInfo: { sections: [] }
        })
      }
      setError('')
    }
  }, [isOpen, dish])

  const loadAllergensAndIngredients = async () => {
    setIsLoadingData(true)
    try {
      const [allergensResponse, ingredientsResponse] = await Promise.all([
        fetch('/api/allergens'),
        fetch('/api/ingredients')
      ])

      if (allergensResponse.ok) {
        const allergensData = await allergensResponse.json()
        setAvailableAllergens(allergensData.allergens)
      }

      if (ingredientsResponse.ok) {
        const ingredientsData = await ingredientsResponse.json()
        setAvailableIngredients(ingredientsData.ingredients)
      }
    } catch (error) {
      console.error('Error loading allergens and ingredients:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }))
  }

  const toggleAllergen = (allergenId: string) => {
    setFormData(prev => ({
      ...prev,
      allergenIds: prev.allergenIds.includes(allergenId)
        ? prev.allergenIds.filter(id => id !== allergenId)
        : [...prev.allergenIds, allergenId]
    }))
  }

  const toggleIngredient = (ingredientId: string) => {
    setFormData(prev => ({
      ...prev,
      ingredientIds: prev.ingredientIds.includes(ingredientId)
        ? prev.ingredientIds.filter(id => id !== ingredientId)
        : [...prev.ingredientIds, ingredientId]
    }))
  }

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image: imageUrl }))
  }

  const handleGallerySelect = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image: imageUrl }))
    setShowImageGallery(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      if (!session?.user?.email) {
        setError('Sessione scaduta. Effettua nuovamente il login.')
        return
      }

      const url = dish ? `/api/dishes/${dish.id}` : '/api/dishes'
      const method = dish ? 'PUT' : 'POST'

      const price = parseFloat(formData.price.toString())
      
      // Validazione del prezzo
      if (isNaN(price) || price < 0) {
        setError('Prezzo non valido')
        return
      }

      // Validazione del nome
      if (!formData.name || formData.name.trim() === '') {
        setError('Nome piatto richiesto')
        return
      }

      // Filtra gli ID validi per allergeni e ingredienti
      const validAllergenIds = formData.allergenIds.filter(id => id && typeof id === 'string' && id.trim() !== '')
      const validIngredientIds = formData.ingredientIds.filter(id => id && typeof id === 'string' && id.trim() !== '')

      const requestData = dish ? {
        // Per aggiornamento piatto esistente
        name: formData.name.trim(),
        description: formData.description || null,
        price,
        allergenIds: validAllergenIds,
        ingredientIds: validIngredientIds,
        isVegetarian: formData.isVegetarian || false,
        isVegan: formData.isVegan || false,
        isGlutenFree: formData.isGlutenFree || false,
        isSpicy: formData.isSpicy || false,
        image: formData.image || null,
        galleryEnabled: formData.galleryEnabled || false,
        galleryImages: formData.galleryImages || [],
        additionalInfo: formData.additionalInfo || { sections: [] }
      } : {
        // Per creazione nuovo piatto
        name: formData.name.trim(),
        description: formData.description || null,
        price,
        categoryId,
        allergenIds: validAllergenIds,
        ingredientIds: validIngredientIds,
        isVegetarian: formData.isVegetarian || false,
        isVegan: formData.isVegan || false,
        isGlutenFree: formData.isGlutenFree || false,
        isSpicy: formData.isSpicy || false,
        image: formData.image || null,
        galleryEnabled: formData.galleryEnabled || false,
        galleryImages: formData.galleryImages || [],
        additionalInfo: formData.additionalInfo || { sections: [] }
      }

      console.log('Sending dish data:', requestData)
      console.log('Additional info being sent:', formData.additionalInfo)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (response.ok) {
        onSave()
      } else {
        try {
          const data = await response.json()
          console.error('API Error:', data)
          console.error('Error type:', data.type)
          console.error('Error details:', data.details)
          
          if (data.details && Array.isArray(data.details)) {
            console.error('Validation details:', data.details)
            const errorMessages = data.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join(', ')
            setError(`Errore di validazione: ${errorMessages}`)
          } else if (data.details) {
            console.error('Error details:', data.details)
            setError(`Errore: ${data.error} - ${data.details}`)
          } else {
            setError(data.error || 'Errore durante il salvataggio')
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError)
          setError('Errore durante il salvataggio')
        }
      }
    } catch (err) {
      console.error('Error saving dish:', err)
      setError('Errore di rete o del server')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          disabled={isSaving}
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {dish ? 'Modifica Piatto' : 'Aggiungi Nuovo Piatto'}
          </h3>
          <p className="text-gray-600">Compila i dettagli del piatto</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome Piatto *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Prezzo (€) *
              </label>
              <input
                type="number"
                name="price"
                id="price"
                value={formData.price}
                onChange={handleNumberChange}
                step="0.01"
                min="0"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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
            />
          </div>

          {/* Gestione Immagini */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Immagine del Piatto
            </label>
            
            {formData.image ? (
              <div className="mb-4">
                <div className="relative inline-block">
                  <img
                    src={formData.image}
                    alt="Anteprima"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Immagine selezionata
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <ImageDropzone
                  onImageUpload={handleImageUpload}
                  multiple={false}
                  className="mb-3"
                  userType="dish"
                  userId={restaurantId || categoryId} // Usa restaurantId se disponibile, altrimenti categoryId
                  dishId={dish?.id}
                />
                <div className="text-center">
                  <span className="text-sm text-gray-500">oppure</span>
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowImageGallery(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                <Images className="h-4 w-4 mr-2" />
                Scegli dalla Galleria
              </button>
              {!formData.image && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                  className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Carica Nuova
                </button>
              )}
            </div>
          </div>

          {/* Allergeni */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allergeni
            </label>
            {isLoadingData ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Caricamento allergeni...</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mb-2">
                {availableAllergens.map(allergen => (
                  <button
                    key={allergen.id}
                    type="button"
                    onClick={() => toggleAllergen(allergen.id)}
                    className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                      formData.allergenIds.includes(allergen.id)
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {allergen.icon} {allergen.name}
                  </button>
                ))}
              </div>
            )}
            {formData.allergenIds.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Allergeni selezionati:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.allergenIds.map(allergenId => {
                    const allergen = availableAllergens.find(a => a.id === allergenId)
                    return allergen ? (
                      <span
                        key={allergenId}
                        className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        {allergen.icon} {allergen.name}
                        <button
                          type="button"
                          onClick={() => toggleAllergen(allergenId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </span>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Ingredienti */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ingredienti
            </label>
            {isLoadingData ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Caricamento ingredienti...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(
                  availableIngredients.reduce((acc, ingredient) => {
                    const category = ingredient.category || 'Altro'
                    if (!acc[category]) acc[category] = []
                    acc[category].push(ingredient)
                    return acc
                  }, {} as Record<string, any[]>)
                ).map(([category, ingredients]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {ingredients.map(ingredient => (
                        <button
                          key={ingredient.id}
                          type="button"
                          onClick={() => toggleIngredient(ingredient.id)}
                          className={`px-3 py-1 rounded-full text-sm ${
                            formData.ingredientIds.includes(ingredient.id)
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {ingredient.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {formData.ingredientIds.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Ingredienti selezionati:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.ingredientIds.map(ingredientId => {
                    const ingredient = availableIngredients.find(i => i.id === ingredientId)
                    return ingredient ? (
                      <span
                        key={ingredientId}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        {ingredient.name}
                        <button
                          type="button"
                          onClick={() => toggleIngredient(ingredientId)}
                          className="text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Caratteristiche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Caratteristiche
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isVegetarian"
                  checked={formData.isVegetarian}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm">🌱 Vegetariano</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isVegan"
                  checked={formData.isVegan}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm">🌿 Vegano</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isGlutenFree"
                  checked={formData.isGlutenFree}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm">🌾 Senza Glutine</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isSpicy"
                  checked={formData.isSpicy}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm">🌶️ Piccante</span>
              </label>
            </div>
          </div>

          {/* Galleria Immagini */}
          <div className="border-t pt-6">
            <DishGalleryManager
              dishId={dish?.id || ''}
              initialGalleryEnabled={dish?.galleryEnabled || formData.galleryEnabled}
              initialGalleryImages={dish?.galleryImages || formData.galleryImages}
              onUpdate={(enabled, images) => {
                // Aggiorna il formData con i nuovi valori della galleria
                setFormData(prev => ({
                  ...prev,
                  galleryEnabled: enabled,
                  galleryImages: images
                }))
                console.log('Gallery updated:', { enabled, images })
              }}
              restaurantId={restaurantId || categoryId}
            />
          </div>

          {/* Informazioni Aggiuntive */}
          <div className="border-t pt-6">
            <AdditionalInfoManager
              sections={formData.additionalInfo.sections}
              onChange={(sections) => {
                setFormData(prev => ({
                  ...prev,
                  additionalInfo: {
                    sections: sections
                  }
                }))
              }}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isSaving}
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={20} />
                  {dish ? 'Aggiorna Piatto' : 'Crea Piatto'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Image Gallery Modal */}
        <ImageGallery
          isOpen={showImageGallery}
          onClose={() => setShowImageGallery(false)}
          onSelectImage={handleGallerySelect}
          selectedImage={formData.image}
        />
      </div>
    </div>
  )
}
