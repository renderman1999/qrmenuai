'use client'

import { useState, useEffect } from 'react'
import { Star, Trash2, Check, X, Eye, EyeOff } from 'lucide-react'

interface Review {
  id: string
  customerName: string
  rating: number
  comment?: string
  isApproved: boolean
  createdAt: string
}

interface ReviewManagerProps {
  restaurantId: string
  reviews: Review[]
  onReviewsUpdate: (reviews: Review[]) => void
}

export default function ReviewManager({ restaurantId, reviews, onReviewsUpdate }: ReviewManagerProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleApproveReview = async (reviewId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isApproved: true })
      })

      if (response.ok) {
        const updatedReview = await response.json()
        onReviewsUpdate(reviews.map(review => 
          review.id === reviewId ? updatedReview : review
        ))
      } else {
        const error = await response.json()
        alert(error.error || 'Errore nell\'approvazione della recensione')
      }
    } catch (error) {
      console.error('Error approving review:', error)
      alert('Errore di connessione')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRejectReview = async (reviewId: string) => {
    if (!confirm('Sei sicuro di voler rifiutare questa recensione?')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isApproved: false })
      })

      if (response.ok) {
        const updatedReview = await response.json()
        onReviewsUpdate(reviews.map(review => 
          review.id === reviewId ? updatedReview : review
        ))
      } else {
        const error = await response.json()
        alert(error.error || 'Errore nel rifiuto della recensione')
      }
    } catch (error) {
      console.error('Error rejecting review:', error)
      alert('Errore di connessione')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa recensione?')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reviews/${reviewId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onReviewsUpdate(reviews.filter(review => review.id !== reviewId))
      } else {
        const error = await response.json()
        alert(error.error || 'Errore nell\'eliminazione della recensione')
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Errore di connessione')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const approvedReviews = reviews.filter(review => review.isApproved)
  const pendingReviews = reviews.filter(review => !review.isApproved)
  const averageRating = approvedReviews.length > 0 
    ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) / approvedReviews.length 
    : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestione Recensioni</h2>
          <div className="mt-2 flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">Rating medio:</span>
              <div className="flex">
                {renderStars(Math.round(averageRating))}
              </div>
              <span className="ml-2 text-sm text-gray-600">
                {averageRating.toFixed(1)} ({approvedReviews.length} recensioni)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recensioni in Attesa di Approvazione ({pendingReviews.length})
          </h3>
          <div className="space-y-4">
            {pendingReviews.map((review) => (
              <div key={review.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{review.customerName}</h4>
                      <div className="flex">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 mb-2">{review.comment}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleApproveReview(review.id)}
                      disabled={isLoading}
                      className="cursor-pointer bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approva
                    </button>
                    <button
                      onClick={() => handleRejectReview(review.id)}
                      disabled={isLoading}
                      className="cursor-pointer bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Rifiuta
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      disabled={isLoading}
                      className="cursor-pointer bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Reviews */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recensioni Approvate ({approvedReviews.length})
        </h3>
        {approvedReviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nessuna recensione approvata</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedReviews.map((review) => (
              <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{review.customerName}</h4>
                      <div className="flex">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 mb-2">{review.comment}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleRejectReview(review.id)}
                      disabled={isLoading}
                      className="bg-orange-600 text-white px-3 py-1 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
                    >
                      <EyeOff className="w-4 h-4 mr-1" />
                      Nascondi
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      disabled={isLoading}
                      className="bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
