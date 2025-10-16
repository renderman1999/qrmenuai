'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Check } from 'lucide-react'

interface PresetCategory {
  name: string
  description: string
  sortOrder: number
}

interface AddCategoriesModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedCategories: string[]) => void
  menuId: string
  restaurantId: string
  isAdding?: boolean
}

export default function AddCategoriesModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  menuId,
  restaurantId,
  isAdding = false
}: AddCategoriesModalProps) {
  const [presetCategories, setPresetCategories] = useState<PresetCategory[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadPresetCategories()
    }
  }, [isOpen])

  const loadPresetCategories = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/categories/presets')
      if (response.ok) {
        const data = await response.json()
        setPresetCategories(data.categories)
      }
    } catch (error) {
      console.error('Errore nel caricamento delle categorie predefinite:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCategoryToggle = (categoryName: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    )
  }

  const handleConfirm = () => {
    if (selectedCategories.length > 0) {
      onConfirm(selectedCategories)
      setSelectedCategories([])
    }
  }

  const handleClose = () => {
    setSelectedCategories([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-full">
              <Plus className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Aggiungi Categorie
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isAdding}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Caricamento categorie...</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Seleziona le categorie che vuoi aggiungere al menu. Puoi selezionare più categorie contemporaneamente.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {presetCategories.map((category, index) => (
                  <label
                    key={`${category.name}-${category.sortOrder}-${index}`}
                    className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedCategories.includes(category.name) 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                        selectedCategories.includes(category.name)
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedCategories.includes(category.name) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {category.name}
                        </h4>
                        <span className="text-xs text-gray-500">
                          #{category.sortOrder}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {category.description}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.name)}
                      onChange={() => handleCategoryToggle(category.name)}
                      className="sr-only"
                    />
                  </label>
                ))}
              </div>

              {selectedCategories.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 mb-2">
                    Categorie selezionate ({selectedCategories.length}):
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.map((categoryName) => (
                      <span
                        key={categoryName}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {categoryName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
            disabled={isAdding}
          >
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors flex items-center space-x-2 disabled:opacity-50"
            disabled={isAdding || selectedCategories.length === 0}
          >
            {isAdding ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Aggiungendo...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Aggiungi {selectedCategories.length} Categorie</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
