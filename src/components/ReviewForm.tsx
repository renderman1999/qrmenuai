'use client'

import { useState } from 'react'
import { Star, Send } from 'lucide-react'

interface ReviewFormProps {
  restaurantId: string
  onReviewSubmitted: () => void
}

export default function ReviewForm({ restaurantId, onReviewSubmitted }: ReviewFormProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    rating: 0,
    comment: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hoveredStar, setHoveredStar] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customerName || formData.rating === 0) {
      alert('Inserisci il tuo nome e seleziona una valutazione')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        // Reset form
        setFormData({
          customerName: '',
          rating: 0,
          comment: ''
        })
        
        // Show success message
        const toast = document.createElement('div')
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50'
        toast.textContent = 'Recensione inviata! Verrà pubblicata dopo l\'approvazione.'
        document.body.appendChild(toast)
        setTimeout(() => {
          document.body.removeChild(toast)
        }, 5000)
        
        onReviewSubmitted()
      } else {
        const error = await response.json()
        alert(error.error || 'Errore nell\'invio della recensione')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Errore di connessione')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        className={`w-8 h-8 ${
          i < (hoveredStar || formData.rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        } transition-colors`}
        onClick={() => setFormData(prev => ({ ...prev, rating: i + 1 }))}
        onMouseEnter={() => setHoveredStar(i + 1)}
        onMouseLeave={() => setHoveredStar(0)}
      >
        <Star className="w-full h-full" />
      </button>
    ))
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Lascia una Recensione</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Il tuo nome *
          </label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
            placeholder="Come ti chiami?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valutazione *
          </label>
          <div className="flex space-x-1">
            {renderStars()}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {formData.rating > 0 && `${formData.rating} stelle`}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Commento (opzionale)
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            rows={4}
            placeholder="Condividi la tua esperienza..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || formData.rating === 0}
          className="cursor-pointer w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Invio in corso...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Invia Recensione
            </>
          )}
        </button>
      </form>
    </div>
  )
}
