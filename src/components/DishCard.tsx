'use client'

import { useState } from 'react'
import { Eye, Plus, ShoppingCart } from 'lucide-react'

interface DishCardProps {
  dish: any
  onView: (dish: any) => void
  onAddToOrder: (dish: any, quantity: number) => void
  ordersEnabled?: boolean
}

export default function DishCard({ dish, onView, onAddToOrder, ordersEnabled = true }: DishCardProps) {
  const [quantity, setQuantity] = useState(1)

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, quantity + change)
    setQuantity(newQuantity)
  }

  const handleAddToOrder = () => {
    onAddToOrder(dish, quantity)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-lg font-semibold text-gray-900">
                {dish.name}
              </h4>
              <div className="flex gap-1">
                {dish.isVegetarian && <span className="text-green-600 text-sm">🌱</span>}
                {dish.isVegan && <span className="text-green-600 text-sm">🌿</span>}
                {dish.isGlutenFree && <span className="text-blue-600 text-sm">🌾</span>}
                {dish.isSpicy && <span className="text-red-600 text-sm">🌶️</span>}
              </div>
            </div>
            
            {dish.description && (
              <p className="text-gray-600 text-sm mb-3 overflow-hidden" style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {dish.description}
              </p>
            )}
            
            {dish.dishAllergens && Array.isArray(dish.dishAllergens) && dish.dishAllergens.length > 0 && (
              <div className="mb-2">
                <span className="text-xs text-red-600 font-medium">⚠️ Allergeni: </span>
                <span className="text-xs text-red-600">
                  {dish.dishAllergens.map((da: any) => `${da.allergen.icon} ${da.allergen.name}`).join(', ')}
                </span>
              </div>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900 mb-2">
                €{dish.price}
              </div>
              {dish.image && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                  <img 
                    src={dish.image} 
                    alt={dish.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selettore quantità - solo se ordini abilitati */}
        {ordersEnabled && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Quantità:</span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <span className="text-sm">-</span>
                </button>
                <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <span className="text-sm">+</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pulsanti azione */}
        <div className="flex space-x-2">
          <button
            onClick={() => onView(dish)}
            className="flex-1 flex items-center justify-center px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Eye size={12} className="mr-1" />
            Vedi
          </button>
          {ordersEnabled && (
            <button
              onClick={handleAddToOrder}
              className="flex-1 flex items-center justify-center px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ShoppingCart size={12} className="mr-1" />
              Aggiungi all'ordine
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
