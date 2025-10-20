'use client'

import { useState } from 'react'
import { Youtube, ExternalLink, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface YouTubeEmbedderProps {
  onYouTubeSet: (videoId: string) => void
  onYouTubeRemove: () => void
  currentVideoId?: string
  disabled?: boolean
}

export default function YouTubeEmbedder({ 
  onYouTubeSet, 
  onYouTubeRemove, 
  currentVideoId, 
  disabled = false 
}: YouTubeEmbedderProps) {
  const [inputValue, setInputValue] = useState('')
  const [isValidating, setIsValidating] = useState(false)

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    
    return null
  }

  const handleSubmit = async () => {
    if (!inputValue.trim()) {
      toast.error('Inserisci un URL YouTube valido')
      return
    }

    setIsValidating(true)
    
    try {
      const videoId = extractYouTubeId(inputValue)
      
      if (!videoId) {
        toast.error('URL YouTube non valido')
        return
      }

      // Test if video exists by trying to fetch thumbnail
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      const response = await fetch(thumbnailUrl, { method: 'HEAD' })
      
      if (!response.ok) {
        toast.error('Video YouTube non trovato')
        return
      }

      onYouTubeSet(videoId)
      setInputValue('')
      toast.success('Video YouTube aggiunto con successo!')
    } catch (error) {
      toast.error('Errore durante la validazione del video')
    } finally {
      setIsValidating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="space-y-4">
      {currentVideoId ? (
        <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Youtube className="h-8 w-8 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Video YouTube</p>
                <p className="text-sm text-red-600">ID: {currentVideoId}</p>
                <a
                  href={`https://youtube.com/watch?v=${currentVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-red-500 hover:text-red-700 flex items-center space-x-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Apri su YouTube</span>
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onYouTubeRemove()
              }}
              disabled={disabled}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Youtube className="h-5 w-5 text-red-600" />
            <label className="text-sm font-medium text-gray-700">
              URL Video YouTube
            </label>
          </div>
          
          <div className="flex space-x-2">
            <input
              type="url"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="https://youtube.com/watch?v=..."
              disabled={disabled || isValidating}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSubmit()
              }}
              disabled={disabled || isValidating || !inputValue.trim()}
              className="cpx-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isValidating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Aggiungi'
              )}
            </button>
          </div>
          
          <p className="text-xs text-gray-500">
            Inserisci l'URL completo del video YouTube
          </p>
        </div>
      )}
    </div>
  )
}
