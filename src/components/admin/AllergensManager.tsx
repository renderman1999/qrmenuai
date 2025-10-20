'use client'

import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faPlus, 
  faEdit, 
  faTrash, 
  faSearch, 
  faCheck,
  faTimes
} from '@fortawesome/free-solid-svg-icons'

interface Allergen {
  id: string
  name: string
  description?: string
  icon?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface AllergenFormData {
  name: string
  description: string
  icon: string
}

const COMMON_ICONS = [
  '🌾', '🥛', '🥚', '🫘', '🥜', '🐟', '🦐', '🥬', '🌶️', '🌰', '⚗️', '🐚',
  '🍞', '🧀', '🥩', '🍗', '🐄', '🐷', '🐑', '🦀', '🦞', '🐙', '🦑'
]

export default function AllergensManager() {
  const [allergens, setAllergens] = useState<Allergen[]>([])
  const [filteredAllergens, setFilteredAllergens] = useState<Allergen[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAllergen, setEditingAllergen] = useState<Allergen | null>(null)
  const [formData, setFormData] = useState<AllergenFormData>({
    name: '',
    description: '',
    icon: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Carica allergeni
  const fetchAllergens = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/allergens?includeInactive=${showInactive}`)
      const data = await response.json()
      
      if (response.ok) {
        setAllergens(data.allergens)
        setFilteredAllergens(data.allergens)
      } else {
        setError(data.error || 'Errore nel caricamento degli allergeni')
      }
    } catch (error) {
      setError('Errore di connessione')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllergens()
  }, [showInactive])

  // Filtra allergeni
  useEffect(() => {
    let filtered = allergens

    if (searchTerm) {
      filtered = filtered.filter(allergen =>
        allergen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        allergen.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredAllergens(filtered)
  }, [allergens, searchTerm])

  // Gestione form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const url = editingAllergen 
        ? `/api/allergens/${editingAllergen.id}`
        : '/api/allergens'
      
      const method = editingAllergen ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setIsModalOpen(false)
        setEditingAllergen(null)
        setFormData({ name: '', description: '', icon: '' })
        fetchAllergens()
      } else {
        setError(data.error || 'Errore nell\'operazione')
      }
    } catch (error) {
      setError('Errore di connessione')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Modifica allergene
  const handleEdit = (allergen: Allergen) => {
    setEditingAllergen(allergen)
    setFormData({
      name: allergen.name,
      description: allergen.description || '',
      icon: allergen.icon || ''
    })
    setIsModalOpen(true)
  }

  // Elimina allergene
  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo allergene?')) {
      return
    }

    try {
      const response = await fetch(`/api/allergens/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        fetchAllergens()
      } else {
        setError(data.error || 'Errore nell\'eliminazione')
      }
    } catch (error) {
      setError('Errore di connessione')
    }
  }

  // Toggle stato attivo
  const handleToggleActive = async (allergen: Allergen) => {
    try {
      const response = await fetch(`/api/allergens/${allergen.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: !allergen.isActive
        })
      })

      if (response.ok) {
        setSuccess(`Allergene ${!allergen.isActive ? 'attivato' : 'disattivato'} con successo`)
        fetchAllergens()
      } else {
        const data = await response.json()
        setError(data.error || 'Errore nell\'aggiornamento')
      }
    } catch (error) {
      setError('Errore di connessione')
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({ name: '', description: '', icon: '' })
    setEditingAllergen(null)
    setIsModalOpen(false)
    setError('')
    setSuccess('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestione Allergeni</h2>
          <p className="text-gray-600">Gestisci gli allergeni disponibili nel sistema</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          Nuovo Allergene
        </button>
      </div>

      {/* Filtri */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cerca</label>
            <div className="relative">
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca allergeni..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Mostra disattivati</span>
            </label>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setShowInactive(false)
              }}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Reset filtri
            </button>
          </div>
        </div>
      </div>

      {/* Messaggi */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Tabella allergeni */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Icona
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrizione
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAllergens.map((allergen) => (
                <tr key={allergen.id} className={!allergen.isActive ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-2xl">{allergen.icon || '❓'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {allergen.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {allergen.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      allergen.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {allergen.isActive ? 'Attivo' : 'Disattivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(allergen)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      onClick={() => handleToggleActive(allergen)}
                      className={`${allergen.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                    >
                      <FontAwesomeIcon icon={allergen.isActive ? faTimes : faCheck} />
                    </button>
                    <button
                      onClick={() => handleDelete(allergen.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={resetForm}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingAllergen ? 'Modifica Allergene' : 'Nuovo Allergene'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icona
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="Inserisci emoji o testo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="text-sm text-gray-500">
                      Icone comuni:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_ICONS.map(icon => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon })}
                          className={`p-2 border rounded-lg hover:bg-gray-50 ${
                            formData.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                          }`}
                        >
                          <span className="text-lg">{icon}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrizione
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Salvando...' : (editingAllergen ? 'Aggiorna' : 'Crea')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
