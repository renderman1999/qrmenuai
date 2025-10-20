'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Video, FileVideo } from 'lucide-react'
import toast from 'react-hot-toast'

interface VideoUploaderProps {
  onVideoUpload: (file: File) => void
  onVideoRemove: () => void
  currentVideo?: string
  disabled?: boolean
}

export default function VideoUploader({ 
  onVideoUpload, 
  onVideoRemove, 
  currentVideo, 
  disabled = false 
}: VideoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Seleziona un file video valido')
      return
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Il file video è troppo grande (max 50MB)')
      return
    }

    setIsUploading(true)
    try {
      // Upload file to server
      const formData = new FormData()
      formData.append('video', file)

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore durante il caricamento')
      }

      const result = await response.json()
      await onVideoUpload(result.url)
      toast.success('Video caricato con successo!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Errore durante il caricamento del video')
    } finally {
      setIsUploading(false)
    }
  }, [onVideoUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm']
    },
    multiple: false,
    disabled: disabled || isUploading
  })

  return (
    <div className="space-y-4">
      {currentVideo ? (
        <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Video className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Video caricato</p>
                <p className="text-sm text-green-600">{currentVideo}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onVideoRemove()
              }}
              disabled={disabled}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600">Caricamento in corso...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <FileVideo className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {isDragActive ? 'Rilascia il video qui' : 'Carica un video'}
                </p>
                <p className="text-xs text-gray-500">
                  MP4, AVI, MOV, WMV, FLV, WebM (max 50MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
