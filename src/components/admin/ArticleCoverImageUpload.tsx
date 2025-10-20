'use client'

import { useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'

interface ArticleCoverImageUploadProps {
  articleId?: string
  currentImage?: string | null
  onImageChange: (imageUrl: string | null) => void
  disabled?: boolean
}

export default function ArticleCoverImageUpload({ 
  articleId,
  currentImage, 
  onImageChange,
  disabled = false
}: ArticleCoverImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || disabled) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Seleziona un file immagine valido')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'immagine è troppo grande. Dimensione massima: 5MB')
      return
    }

    setIsUploading(true)

    try {
      // Create preview immediately
      const reader = new FileReader()
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string
        setPreviewUrl(previewUrl)
        onImageChange(previewUrl)
      }
      reader.readAsDataURL(file)

      // If we have an articleId, also upload to server
      if (articleId) {
        const formData = new FormData()
        formData.append('image', file)

        const response = await fetch(`/api/articles/${articleId}/cover-image`, {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error('Errore durante l\'upload')
        }

        const result = await response.json()
        
        if (result.success) {
          // Show success message
          const toast = document.createElement('div')
          toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50'
          toast.textContent = 'Immagine di copertina aggiornata!'
          document.body.appendChild(toast)
          setTimeout(() => {
            document.body.removeChild(toast)
          }, 3000)
        }
      }
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Errore durante l\'elaborazione dell\'immagine')
      // Revert preview
      setPreviewUrl(currentImage || null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!confirm('Sei sicuro di voler rimuovere l\'immagine di copertina?')) {
      return
    }

    setIsUploading(true)

    try {
      setPreviewUrl(null)
      onImageChange(null)

      // If we have an articleId, also remove from server
      if (articleId) {
        const response = await fetch(`/api/articles/${articleId}/cover-image`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('Errore durante la rimozione')
        }

        const result = await response.json()
        
        if (result.success) {
          // Show success message
          const toast = document.createElement('div')
          toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50'
          toast.textContent = 'Immagine di copertina rimossa!'
          document.body.appendChild(toast)
          setTimeout(() => {
            document.body.removeChild(toast)
          }, 3000)
        }
      }
    } catch (error) {
      console.error('Error removing image:', error)
      alert('Errore durante la rimozione dell\'immagine')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Immagine di Copertina
      </label>
      
      {previewUrl ? (
        <div className="relative">
          <img 
            src={previewUrl} 
            alt="Cover preview" 
            className="w-full h-48 object-cover rounded-lg border"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          <div className="absolute top-2 right-2 flex space-x-2">
            <label className="bg-blue-600 text-white p-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled || isUploading}
              />
            </label>
            <button
              onClick={handleRemoveImage}
              disabled={disabled || isUploading}
              className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Nessuna immagine di copertina</p>
          <label className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
            <Upload className="w-4 h-4 inline mr-2" />
            Carica Immagine
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled || isUploading}
            />
          </label>
          {isUploading && (
            <div className="mt-4">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm text-gray-600 mt-2">Caricamento...</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
