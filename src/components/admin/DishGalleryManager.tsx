'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, X, Image as ImageIcon, Trash2, Edit3, Save, Loader2 } from 'lucide-react'
import ImageDropzone from './ImageDropzone'

interface GalleryImage {
  url: string
  alt?: string
  order: number
}

interface DishGalleryManagerProps {
  dishId: string
  initialGalleryEnabled: boolean
  initialGalleryImages: GalleryImage[]
  onUpdate: (galleryEnabled: boolean, galleryImages: GalleryImage[]) => void
  restaurantId: string
}

export default function DishGalleryManager({
  dishId,
  initialGalleryEnabled,
  initialGalleryImages,
  onUpdate,
  restaurantId
}: DishGalleryManagerProps) {
  const { data: session } = useSession()
  const [galleryEnabled, setGalleryEnabled] = useState(initialGalleryEnabled)
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(initialGalleryImages || [])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Sincronizza i valori iniziali
  useEffect(() => {
    setGalleryEnabled(initialGalleryEnabled)
    setGalleryImages(initialGalleryImages)
  }, [initialGalleryEnabled, initialGalleryImages])

  const handleToggleGallery = async (enabled: boolean) => {
    setGalleryEnabled(enabled)
    
    if (!enabled) {
      // Se disabilitiamo la galleria, svuotiamo le immagini
      setGalleryImages([])
      await saveGallery(enabled, [])
    }
  }

  const handleAddImage = (imageUrl: string) => {
    const newImage: GalleryImage = {
      url: imageUrl,
      alt: '',
      order: galleryImages.length
    }
    
    const updatedImages = [...galleryImages, newImage]
    setGalleryImages(updatedImages)
    saveGallery(galleryEnabled, updatedImages)
  }

  const handleRemoveImage = async (index: number) => {
    const updatedImages = galleryImages.filter((_, i) => i !== index)
    // Riorganizza gli ordini
    const reorderedImages = updatedImages.map((img, i) => ({ ...img, order: i }))
    setGalleryImages(reorderedImages)
    await saveGallery(galleryEnabled, reorderedImages)
  }

  const handleUpdateImageAlt = (index: number, alt: string) => {
    const updatedImages = [...galleryImages]
    updatedImages[index] = { ...updatedImages[index], alt }
    setGalleryImages(updatedImages)
  }

  const handleReorderImages = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...galleryImages]
    const [movedImage] = updatedImages.splice(fromIndex, 1)
    updatedImages.splice(toIndex, 0, movedImage)
    
    // Riorganizza gli ordini
    const reorderedImages = updatedImages.map((img, i) => ({ ...img, order: i }))
    setGalleryImages(reorderedImages)
    saveGallery(galleryEnabled, reorderedImages)
  }

  const saveGallery = async (enabled: boolean, images: GalleryImage[]) => {
    // Se non c'è un dishId (nuovo piatto), non salvare ancora
    if (!dishId) {
      console.log('Gallery settings saved locally for new dish:', { enabled, images })
      onUpdate(enabled, images)
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/dishes/${dishId}/gallery`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          galleryEnabled: enabled,
          galleryImages: images
        })
      })

      if (response.ok) {
        onUpdate(enabled, images)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Errore durante il salvataggio')
      }
    } catch (err) {
      console.error('Error saving gallery:', err)
      setError('Errore di rete o del server')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Galleria Immagini</h3>
        <div className="flex items-center space-x-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={galleryEnabled}
              onChange={(e) => handleToggleGallery(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Abilita galleria</span>
          </label>
          {isSaving && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
        </div>
      </div>

      {galleryEnabled && (
        <div className="space-y-4">
          {/* Upload nuova immagine */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aggiungi Immagine
            </label>
            <ImageDropzone
              onImageUpload={handleAddImage}
              multiple={false}
              userType="dish"
              userId={restaurantId}
              dishId={dishId}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4"
            />
          </div>

          {/* Lista immagini esistenti */}
          {galleryImages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Immagini Galleria ({galleryImages.length})
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {galleryImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={image.url}
                        alt={image.alt || `Immagine ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Overlay con controlli */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                          title="Rimuovi immagine"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Input per alt text */}
                    <div className="mt-2">
                      <input
                        type="text"
                        value={image.alt || ''}
                        onChange={(e) => handleUpdateImageAlt(index, e.target.value)}
                        placeholder="Descrizione immagine (opzionale)"
                        className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>
      )}

      {!galleryEnabled && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>La galleria è disabilitata</p>
          <p className="text-sm">Abilita la galleria per aggiungere immagini al piatto</p>
        </div>
      )}
    </div>
  )
}
