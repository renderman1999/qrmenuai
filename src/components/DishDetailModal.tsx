'use client'

import { useState, useEffect } from 'react'
import { X, Minus, Plus, ChevronDown, ChevronUp, Type, Video, Youtube } from 'lucide-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons'

interface DishDetailModalProps {
  isOpen: boolean
  onClose: () => void
  dish: any
  onAddToCart?: (dish: any, quantity: number) => void
  ordersEnabled?: boolean
}

export default function DishDetailModal({ isOpen, onClose, dish, onAddToCart, ordersEnabled = true }: DishDetailModalProps) {
  const [quantity, setQuantity] = useState(0)
  const [isAdditionalInfoOpen, setIsAdditionalInfoOpen] = useState(false)

  // Reset quantità e stato accordion quando il modal si apre
  useEffect(() => {
    if (isOpen) {
      setQuantity(0)
      setIsAdditionalInfoOpen(false)
    }
  }, [isOpen])

  if (!isOpen || !dish) return null

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(0, quantity + change)
    setQuantity(newQuantity)
  }

  const handleAddToCart = () => {
    if (quantity > 0 && onAddToCart) {
      onAddToCart(dish, quantity)
      setQuantity(0) // Reset quantità
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0  bg-opacity-0 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header con freccia indietro */}
        <div className="bg-gray-50 px-6 py-4 border-b flex-shrink-0">
          <button
            onClick={onClose}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Indietro
          </button>
        </div>

        {/* Contenuto del modal - scrollabile */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
          {/* Nome del piatto */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {dish.name}
            </h2>
            <div className="text-sm text-gray-500">
              New entry
            </div>
          </div>

          {/* Immagine e prezzo */}
          <div className="flex items-center justify-between mb-6">
            {dish.image && (
              <div className="w-20 h-20 rounded-full overflow-hidden">
                <img 
                  src={dish.image} 
                  alt={dish.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="flex-1 ml-4">
              {ordersEnabled ? (
                <div className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center justify-between">
                  <span className="text-lg font-semibold">
                    €{dish.price}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="cursor-pointer w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-lg font-semibold min-w-[20px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="w-6 cursor-pointer h-6 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-500 text-white px-4 py-2 rounded-lg">
                  <span className="text-lg font-semibold">
                    €{dish.price}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Descrizione */}
          {dish.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Descrizione
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {dish.description}
              </p>
            </div>
          )}

          {/* Allergeni */}
          {dish.dishAllergens && Array.isArray(dish.dishAllergens) && dish.dishAllergens.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Allergeni
              </h3>
              <div className="flex flex-wrap gap-2">
                {dish.dishAllergens.map((da: any, index: number) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {da.allergen.icon} {da.allergen.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ingredienti */}
          {dish.dishIngredients && Array.isArray(dish.dishIngredients) && dish.dishIngredients.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Ingredienti
              </h3>
              <div className="flex flex-wrap gap-2">
                {dish.dishIngredients.map((di: any, index: number) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                  >
                    {di.ingredient.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Caratteristiche dietetiche - solo se presenti */}
          {(dish.isVegetarian || dish.isVegan || dish.isGlutenFree || dish.isSpicy) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Caratteristiche
              </h3>
              <div className="flex flex-wrap gap-2">
                {dish.isVegetarian && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    🌱 Vegetariano
                  </span>
                )}
                {dish.isVegan && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    🌿 Vegano
                  </span>
                )}
                {dish.isGlutenFree && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    🌾 Senza Glutine
                  </span>
                )}
                {dish.isSpicy && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    🌶️ Piccante
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Galleria immagini */}
          {dish.galleryEnabled && dish.galleryImages && dish.galleryImages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Galleria
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {dish.galleryImages.map((image: any, index: number) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden">
                    <img 
                      src={image.url} 
                      alt={image.alt || `Gallery image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informazioni Aggiuntive */}
          {dish.additionalInfo && dish.additionalInfo.sections && dish.additionalInfo.sections.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setIsAdditionalInfoOpen(!isAdditionalInfoOpen)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-900">
                  Vuoi sapere di più?
                </span>
                {isAdditionalInfoOpen ? (
                  <ChevronUp className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                )}
              </button>
              
              {isAdditionalInfoOpen && (
                <div className="mt-4 space-y-4">
                  {dish.additionalInfo.sections
                    .sort((a: any, b: any) => a.order - b.order)
                    .map((section: any, index: number) => (
                    <div key={section.id || index} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-center mb-3">
                        {section.type === 'text' && <Type className="h-5 w-5 text-blue-600 mr-2" />}
                        {section.type === 'video' && <Video className="h-5 w-5 text-green-600 mr-2" />}
                        {section.type === 'youtube' && <Youtube className="h-5 w-5 text-red-600 mr-2" />}
                        <h4 className="text-lg font-semibold text-gray-900">
                          {section.title}
                        </h4>
                      </div>
                      
                      {section.type === 'text' && section.content && (
                        <div 
                          className="prose prose-sm max-w-none text-gray-700"
                          dangerouslySetInnerHTML={{ __html: section.content }}
                        />
                      )}
                      
                      {section.type === 'video' && section.videoFile && (
                        <div className="space-y-2">
                          <video 
                            controls 
                            className="w-full rounded-lg"
                            src={section.videoFile}
                          >
                            Il tuo browser non supporta il tag video.
                          </video>
                        </div>
                      )}
                      
                      {section.type === 'youtube' && section.youtubeId && (
                        <div className="space-y-2">
                          <div className="aspect-video rounded-lg overflow-hidden">
                            <iframe
                              width="100%"
                              height="100%"
                              src={`https://www.youtube.com/embed/${section.youtubeId}`}
                              title={section.title || 'Video YouTube'}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Footer con pulsante carrello - solo se ordini abilitati */}
        {ordersEnabled && (
          <div className="p-6 border-t bg-gray-50 flex-shrink-0">
            <button
              onClick={handleAddToCart}
              disabled={quantity === 0}
              className={`cursor-pointer w-full py-3 px-6 rounded-lg font-semibold text-white flex items-center justify-center transition-colors ${
                quantity > 0 
                  ? 'bg-gray-800 hover:bg-gray-900' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              <FontAwesomeIcon icon={faShoppingCart} className="w-5 h-5 mr-2" />
              Aggiungi all'ordine
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
