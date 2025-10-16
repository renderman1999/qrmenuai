'use client'

import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'

interface MenuData {
  id: string
  name: string
  description: string | null
  isActive: boolean
  availability?: {
    [key: string]: {
      lunch: boolean
      dinner: boolean
    }
  }
}

interface EditMenuModalProps {
  isOpen: boolean
  onClose: () => void
  menu: MenuData | null
  onSave: (menuData: MenuData) => void
  isSaving?: boolean
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunedì' },
  { key: 'tuesday', label: 'Martedì' },
  { key: 'wednesday', label: 'Mercoledì' },
  { key: 'thursday', label: 'Giovedì' },
  { key: 'friday', label: 'Venerdì' },
  { key: 'saturday', label: 'Sabato' },
  { key: 'sunday', label: 'Domenica' }
]

export default function EditMenuModal({ isOpen, onClose, menu, onSave, isSaving = false }: EditMenuModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    availability: {} as { [key: string]: { lunch: boolean; dinner: boolean } }
  })

  // Inizializza i dati del form quando il modal si apre
  useEffect(() => {
    if (isOpen && menu) {
      setFormData({
        name: menu.name || '',
        description: menu.description || '',
        isActive: menu.isActive ?? true,
        availability: menu.availability || {}
      })
    }
  }, [isOpen, menu])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleDayAvailabilityChange = (day: string, timeSlot: 'lunch' | 'dinner', checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [timeSlot]: checked
        }
      }
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!menu) return

    const updatedMenu = {
      ...menu,
      name: formData.name,
      description: formData.description,
      isActive: formData.isActive,
      availability: formData.availability
    }

    onSave(updatedMenu)
  }

  if (!isOpen || !menu) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-blue-600 text-white rounded-t-2xl">
          <h2 className="text-xl font-semibold">Modifica Menu</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nome Menu */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nome Menu *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Inserisci il nome del menu"
            />
          </div>

          {/* Descrizione */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descrizione
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descrivi il menu..."
            />
          </div>

          {/* Disponibilità per Giorni */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Disponibilità del Menu
            </label>
            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.key} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{day.label}</h4>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.availability[day.key]?.lunch || false}
                          onChange={(e) => handleDayAvailabilityChange(day.key, 'lunch', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Pranzo</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.availability[day.key]?.dinner || false}
                          onChange={(e) => handleDayAvailabilityChange(day.key, 'dinner', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Cena</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stato Attivo */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Menu attivo
            </label>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salva Modifiche
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
