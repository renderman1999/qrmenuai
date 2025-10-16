'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'

interface ImageDropzoneProps {
  onImageUpload: (imageUrl: string) => void
  onImagesUpload: (images: Array<{ imageUrl: string; filename: string }>) => void
  multiple?: boolean
  maxFiles?: number
  className?: string
  userType?: 'client' | 'restaurant' | 'dish'
  userId?: string
  dishId?: string
  currentImage?: string
}

export default function ImageDropzone({
  onImageUpload,
  onImagesUpload,
  multiple = false,
  maxFiles = 1,
  className = '',
  userType = 'dish',
  userId,
  dishId,
  currentImage
}: ImageDropzoneProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      
      if (multiple) {
        // Upload multiplo per galleria
        acceptedFiles.forEach(file => {
          formData.append('files', file)
        })

        const response = await fetch('/api/upload/gallery', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          onImagesUpload(data.images)
        } else {
          const error = await response.json()
          alert(error.error || 'Errore durante l\'upload')
        }
      } else {
        // Upload singolo con organizzazione per profilo
        formData.append('file', acceptedFiles[0])
        formData.append('userType', userType)
        if (userId) formData.append('userId', userId)
        if (dishId) formData.append('dishId', dishId)

        const response = await fetch('/api/upload/profile-image', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          onImageUpload(data.imageUrl)
        } else {
          const error = await response.json()
          alert(error.error || 'Errore durante l\'upload')
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Errore durante l\'upload')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [multiple, onImageUpload, onImagesUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles,
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple
  })

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
        ${isDragActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
        }
        ${isUploading ? 'pointer-events-none opacity-50' : ''}
        ${className}
      `}
    >
      <input {...getInputProps()} />
      
      {isUploading ? (
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">
            {multiple ? 'Caricamento immagini...' : 'Caricamento immagine...'}
          </p>
          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      ) : currentImage ? (
        <div className="relative">
          <img
            src={currentImage}
            alt="Anteprima immagine"
            className="w-full h-32 object-cover rounded-lg"
          />
          <div className="absolute inset-0  bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
            <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
              <Upload className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-500">Clicca per cambiare immagine</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          {isDragActive ? (
            <Upload className="h-8 w-8 text-blue-600" />
          ) : (
            <ImageIcon className="h-8 w-8 text-gray-400" />
          )}
          
          <div className="text-sm text-gray-600">
            {isDragActive ? (
              <p>Rilascia le immagini qui...</p>
            ) : (
              <div>
                <p className="font-medium">
                  {multiple ? 'Trascina le immagini qui' : 'Trascina un\'immagine qui'}
                </p>
                <p className="text-xs mt-1">
                  o clicca per selezionare
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, GIF, WebP (max 10MB)
                </p>
                {multiple && (
                  <p className="text-xs text-gray-500">
                    Massimo {maxFiles} immagini
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
