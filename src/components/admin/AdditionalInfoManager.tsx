'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, GripVertical, Type, Video, Youtube, MoveUp, MoveDown } from 'lucide-react'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('./RichTextEditorClient'), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-300 rounded-md p-3 min-h-[120px] bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Caricamento editor...</div>
    </div>
  )
})
import VideoUploader from './VideoUploader'
import YouTubeEmbedder from './YouTubeEmbedder'
import toast from 'react-hot-toast'

export interface AdditionalInfoSection {
  id: string
  type: 'text' | 'video' | 'youtube'
  title: string
  content: string
  videoFile?: string
  youtubeId?: string
  order: number
}

interface AdditionalInfoManagerProps {
  sections: AdditionalInfoSection[]
  onChange: (sections: AdditionalInfoSection[]) => void
  disabled?: boolean
}

export default function AdditionalInfoManager({ 
  sections, 
  onChange, 
  disabled = false 
}: AdditionalInfoManagerProps) {
  const [localSections, setLocalSections] = useState<AdditionalInfoSection[]>(sections)

  useEffect(() => {
    setLocalSections(sections)
  }, [sections])

  const addSection = (type: 'text' | 'video' | 'youtube') => {
    const newSection: AdditionalInfoSection = {
      id: `section_${Date.now()}`,
      type,
      title: '',
      content: '',
      order: localSections.length
    }
    
    const updatedSections = [...localSections, newSection]
    setLocalSections(updatedSections)
    onChange(updatedSections)
    toast.success('Sezione aggiunta!')
  }

  const removeSection = (id: string) => {
    const updatedSections = localSections.filter(section => section.id !== id)
    setLocalSections(updatedSections)
    onChange(updatedSections)
    toast.success('Sezione rimossa!')
  }

  const updateSection = (id: string, updates: Partial<AdditionalInfoSection>) => {
    const updatedSections = localSections.map(section =>
      section.id === id ? { ...section, ...updates } : section
    )
    setLocalSections(updatedSections)
    onChange(updatedSections)
  }

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const currentIndex = localSections.findIndex(section => section.id === id)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= localSections.length) return

    const updatedSections = [...localSections]
    const [movedSection] = updatedSections.splice(currentIndex, 1)
    updatedSections.splice(newIndex, 0, movedSection)

    // Update order numbers
    const reorderedSections = updatedSections.map((section, index) => ({
      ...section,
      order: index
    }))

    setLocalSections(reorderedSections)
    onChange(reorderedSections)
  }

  const handleVideoUpload = (id: string, videoUrl: string) => {
    updateSection(id, { videoFile: videoUrl })
  }

  const handleVideoRemove = (id: string) => {
    updateSection(id, { videoFile: undefined })
  }

  const handleYouTubeSet = (id: string, videoId: string) => {
    updateSection(id, { youtubeId: videoId })
  }

  const handleYouTubeRemove = (id: string) => {
    updateSection(id, { youtubeId: undefined })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Informazioni Aggiuntive</h3>
        {!disabled && (
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                addSection('text')
              }}
              className="cursor-pointer flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Type className="h-4 w-4" />
              <span>Testo</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                addSection('video')
              }}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Video className="h-4 w-4" />
              <span>Video</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                addSection('youtube')
              }}
              className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <Youtube className="h-4 w-4" />
              <span>YouTube</span>
            </button>
          </div>
        )}
      </div>

      {localSections.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Nessuna informazione aggiuntiva</p>
          <p className="text-sm">Aggiungi sezioni per arricchire le informazioni del piatto</p>
        </div>
      ) : (
        <div className="space-y-4">
          {localSections
            .sort((a, b) => a.order - b.order)
            .map((section, index) => (
            <div key={section.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                  <div className="flex items-center space-x-2">
                    {section.type === 'text' && <Type className="h-4 w-4 text-blue-600" />}
                    {section.type === 'video' && <Video className="h-4 w-4 text-green-600" />}
                    {section.type === 'youtube' && <Youtube className="h-4 w-4 text-red-600" />}
                    <span className="font-medium text-gray-700">
                      Sezione {index + 1} - {section.type === 'text' ? 'Testo' : section.type === 'video' ? 'Video' : 'YouTube'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      moveSection(section.id, 'up')
                    }}
                    disabled={index === 0 || disabled}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MoveUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      moveSection(section.id, 'down')
                    }}
                    disabled={index === localSections.length - 1 || disabled}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MoveDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      removeSection(section.id)
                    }}
                    disabled={disabled}
                    className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titolo Sezione
                  </label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                    placeholder="Inserisci un titolo per questa sezione"
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>

                {section.type === 'text' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contenuto Testo
                    </label>
                    <RichTextEditor
                      content={section.content}
                      onChange={(content) => updateSection(section.id, { content })}
                      placeholder="Inserisci il contenuto della sezione..."
                      disabled={disabled}
                    />
                  </div>
                )}

                {section.type === 'video' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Video Locale
                    </label>
                    <VideoUploader
                      onVideoUpload={(videoUrl) => handleVideoUpload(section.id, videoUrl)}
                      onVideoRemove={() => handleVideoRemove(section.id)}
                      currentVideo={section.videoFile}
                      disabled={disabled}
                    />
                  </div>
                )}

                {section.type === 'youtube' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Video YouTube
                    </label>
                    <YouTubeEmbedder
                      onYouTubeSet={(videoId) => handleYouTubeSet(section.id, videoId)}
                      onYouTubeRemove={() => handleYouTubeRemove(section.id)}
                      currentVideoId={section.youtubeId}
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
