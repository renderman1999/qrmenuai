'use client'

import { useState } from 'react'
import { X, Move, Check } from 'lucide-react'

interface Category {
  id: string
  name: string
  description?: string
}

interface MoveDishModalProps {
  isOpen: boolean
  onClose: () => void
  dish: {
    id: string
    name: string
    description?: string
  } | null
  categories: Category[]
  onMove: (categoryId: string) => void
  isMoving?: boolean
}

export default function MoveDishModal({ 
  isOpen, 
  onClose, 
  dish, 
  categories, 
  onMove, 
  isMoving = false 
}: MoveDishModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

  const handleMove = () => {
    if (selectedCategoryId) {
      onMove(selectedCategoryId)
    }
  }

  const handleClose = () => {
    setSelectedCategoryId('')
    onClose()
  }

  if (!isOpen || !dish) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-purple-600 text-white rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <Move className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Sposta Piatto</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-purple-700 rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Dish Info */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Piatto da spostare:</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{dish.name}</h4>
              {dish.description && (
                <p className="text-sm text-gray-600 mt-1">{dish.description}</p>
              )}
            </div>
          </div>

          {/* Category Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Seleziona categoria di destinazione:</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCategoryId === category.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={category.id}
                    checked={selectedCategoryId === category.id}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">{category.name}</span>
                      {selectedCategoryId === category.id && (
                        <Check className="h-4 w-4 text-purple-600 ml-2" />
                      )}
                    </div>
                    {category.description && (
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleMove}
              disabled={!selectedCategoryId || isMoving}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isMoving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Spostamento...
                </>
              ) : (
                <>
                  <Move className="h-4 w-4 mr-2" />
                  Sposta Piatto
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
