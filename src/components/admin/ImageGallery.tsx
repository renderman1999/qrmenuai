'use client'

import { useState, useEffect } from 'react'
import { X, Trash2, Check, Image as ImageIcon, Loader2 } from 'lucide-react'
import ImageDropzone from './ImageDropzone'

interface ImageGalleryProps {
  isOpen: boolean
  onClose: () => void
  onSelectImage: (imageUrl: string) => void
  selectedImage?: string
}

interface GalleryImage {
  filename: string
  imageUrl: string
  name: string
}

export default function ImageGallery({
  isOpen,
  onClose,
  onSelectImage,
  selectedImage
}: ImageGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadImages()
    }
  }, [isOpen])

  const loadImages = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/upload/gallery')
      if (response.ok) {
        const data = await response.json()
        setImages(data.images)
      } else {
        console.error('Error loading gallery')
      }
    } catch (error) {
      console.error('Error loading gallery:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImagesUpload = async (uploadedImages: Array<{ imageUrl: string; filename: string }>) => {
    setIsUploading(true)
    try {
      // Aggiorna la lista delle immagini
      const newImages = uploadedImages.map(img => ({
        filename: img.filename,
        imageUrl: img.imageUrl,
        name: img.filename.replace('.webp', '')
      }))
      setImages(prev => [...newImages, ...prev])
    } finally {
      setIsUploading(false)
    }
  }

  const deleteImage = async (filename: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa immagine?')) return

    try {
      const response = await fetch(`/api/upload/gallery?filename=${filename}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setImages(prev => prev.filter(img => img.filename !== filename))
      } else {
        alert('Errore durante l\'eliminazione dell\'immagine')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Errore durante l\'eliminazione')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-auto max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-2xl font-bold text-gray-900">Galleria Immagini</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Upload Area */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Carica Nuove Immagini</h4>
            <ImageDropzone
              onImagesUpload={handleImagesUpload}
              multiple={true}
              maxFiles={10}
              className="mb-4"
            />
          </div>

          {/* Gallery */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              Immagini Disponibili ({images.length})
            </h4>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin mr-2" size={24} />
                <p className="text-gray-600">Caricamento galleria...</p>
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-8">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nessuna immagine nella galleria</p>
                <p className="text-sm text-gray-500 mt-1">
                  Carica delle immagini per iniziare
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div
                    key={image.filename}
                    className={`
                      relative group border-2 rounded-lg overflow-hidden cursor-pointer transition-all
                      ${selectedImage === image.imageUrl 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    onClick={() => onSelectImage(image.imageUrl)}
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.name}
                      className="w-full h-32 object-cover"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                      {selectedImage === image.imageUrl ? (
                        <div className="bg-blue-600 text-white p-2 rounded-full">
                          <Check size={20} />
                        </div>
                      ) : (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                            Seleziona
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteImage(image.filename)
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                    >
                      <Trash2 size={16} />
                    </button>

                    {/* Image Info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                      <p className="text-white text-xs truncate">
                        {image.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  )
}
