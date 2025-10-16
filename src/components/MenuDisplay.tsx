'use client'

import { useState } from 'react'
import { Search, Filter, Heart, Star, X, Minus, Plus } from 'lucide-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons'
import Chatbot from './Chatbot'
import DishDetailModal from './DishDetailModal'

interface MenuDisplayProps {
  menu: any
  restaurant: any
}

export default function MenuDisplay({ menu, restaurant }: MenuDisplayProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [dietaryFilters, setDietaryFilters] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    spicy: false
  })
  const [selectedDish, setSelectedDish] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cart, setCart] = useState<Array<{dish: any, quantity: number}>>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderData, setOrderData] = useState({
    tableNumber: '',
    customerName: '',
    customerPhone: '',
    notes: ''
  })
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)

  const filteredDishes = menu.categories
    .filter((category: any) => !selectedCategory || category.id === selectedCategory)
    .flatMap((category: any) => category.dishes)
    .filter((dish: any) => {
      const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           dish.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesDietary = (!dietaryFilters.vegetarian || dish.isVegetarian) &&
                            (!dietaryFilters.vegan || dish.isVegan) &&
                            (!dietaryFilters.glutenFree || dish.isGlutenFree) &&
                            (!dietaryFilters.spicy || dish.isSpicy)
      
      return matchesSearch && matchesDietary
    })

  const handleDishClick = (dish: any) => {
    setSelectedDish(dish)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDish(null)
  }

  const addToCart = (dish: any, quantity: number = 1) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.dish.id === dish.id)
      if (existingItem) {
        return prev.map(item => 
          item.dish.id === dish.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        return [...prev, { dish, quantity }]
      }
    })
    
    // Mostra notifica
    setNotificationMessage(`${quantity}x ${dish.name} aggiunto al carrello!`)
    setShowNotification(true)
    
    // Nascondi notifica dopo 3 secondi
    setTimeout(() => {
      setShowNotification(false)
    }, 3000)
  }

  const removeFromCart = (dishId: string) => {
    setCart(prev => prev.filter(item => item.dish.id !== dishId))
  }

  const updateQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(dishId)
    } else {
      setCart(prev => prev.map(item => 
        item.dish.id === dishId 
          ? { ...item, quantity }
          : item
      ))
    }
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (Number(item.dish.price) * item.quantity), 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const handleOrderSubmit = async () => {
    if (cart.length === 0) {
      alert('Il carrello è vuoto!')
      return
    }

    if (!orderData.tableNumber.trim()) {
      alert('Inserisci il numero del tavolo')
      return
    }

    setIsSubmittingOrder(true)
    
    try {
      const orderItems = cart.map(item => ({
        dishId: item.dish.id,
        quantity: item.quantity,
        price: Number(item.dish.price),
        notes: ''
      }))

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableNumber: orderData.tableNumber,
          notes: orderData.notes,
          customerInfo: {
            name: orderData.customerName,
            phone: orderData.customerPhone
          },
          items: orderItems
        })
      })

      const data = await response.json()

      if (data.success) {
        // Reset form and cart
        setCart([])
        setOrderData({
          tableNumber: '',
          customerName: '',
          customerPhone: '',
          notes: ''
        })
        setShowOrderForm(false)
        setIsCartOpen(false)
        
        // Show success notification
        setNotificationMessage(`Ordine #${data.order.orderNumber} inviato con successo!`)
        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 5000)
      } else {
        alert('Errore nell\'invio dell\'ordine: ' + (data.error || 'Errore sconosciuto'))
      }
    } catch (error) {
      console.error('Error submitting order:', error)
      alert('Errore di connessione. Riprova.')
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con ricerca */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            <input
              type="text"
                  placeholder="Cerca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                />
              </div>
            </div>
            
            <button 
              onClick={() => setShowOrderForm(true)}
              className="p-2 hover:bg-gray-100 rounded-lg relative"
            >
              <FontAwesomeIcon icon={faShoppingCart} className="w-6 h-6" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {restaurant.name}
            </h1>
            <h2 className="text-xl text-gray-700">
              {menu.name}
            </h2>
          </div>
        </div>
      </div>

      {/* Navigazione Categorie */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex overflow-x-auto py-4 space-x-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                !selectedCategory 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tutte le categorie
            </button>
            {menu.categories.map((category: any) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  selectedCategory === category.id 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
              <Filter size={16} />
              Filtri
            </button>
            
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>
        </div>

          {/* Filtri dietetici nascosti (si possono mostrare con toggle) */}
          <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={dietaryFilters.vegetarian}
              onChange={(e) => setDietaryFilters(prev => ({ ...prev, vegetarian: e.target.checked }))}
              className="mr-2"
            />
              <span className="text-sm">🌱 Vegetariano</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={dietaryFilters.vegan}
              onChange={(e) => setDietaryFilters(prev => ({ ...prev, vegan: e.target.checked }))}
              className="mr-2"
            />
              <span className="text-sm">🌿 Vegano</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={dietaryFilters.glutenFree}
              onChange={(e) => setDietaryFilters(prev => ({ ...prev, glutenFree: e.target.checked }))}
              className="mr-2"
            />
              <span className="text-sm">🌾 Senza Glutine</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={dietaryFilters.spicy}
              onChange={(e) => setDietaryFilters(prev => ({ ...prev, spicy: e.target.checked }))}
              className="mr-2"
            />
              <span className="text-sm">🌶️ Piccante</span>
          </label>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {menu.categories
          .filter((category: any) => !selectedCategory || category.id === selectedCategory)
          .map((category: any) => {
            const categoryDishes = category.dishes.filter((dish: any) => {
              const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   dish.description?.toLowerCase().includes(searchTerm.toLowerCase())
              
              const matchesDietary = (!dietaryFilters.vegetarian || dish.isVegetarian) &&
                                    (!dietaryFilters.vegan || dish.isVegan) &&
                                    (!dietaryFilters.glutenFree || dish.isGlutenFree) &&
                                    (!dietaryFilters.spicy || dish.isSpicy)
              
              return matchesSearch && matchesDietary
            })

            if (categoryDishes.length === 0) return null

            return (
              <div key={category.id} className="mb-12">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {category.name}
                  </h3>
                 
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categoryDishes.map((dish: any) => (
                    <div 
                      key={dish.id} 
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleDishClick(dish)}
                    >
                <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
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
                          
                            {dish.dishIngredients && Array.isArray(dish.dishIngredients) && dish.dishIngredients.length > 0 && (
                            <div className="mb-2">
                                <span className="text-xs text-gray-600 font-medium">🥘 Ingredienti: </span>
                                <span className="text-xs text-gray-600">
                                  {dish.dishIngredients.map((di: any) => di.ingredient.name).join(', ')}
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
                                <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                                  <img 
                                    src={dish.image} 
                                    alt={dish.name}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute bottom-1 right-1 bg-white rounded-full p-1 shadow-sm">
                                    <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )
          })}
      </div>

      {/* Footer */}
      <div className="text-center mt-12 py-8 border-t border-gray-200">
        <p className="text-gray-600">
          Powered by QR Menu AI
        </p>
      </div>

      {/* Chatbot */}
      <Chatbot 
        restaurantId={restaurant.id}
        menuId={menu.id}
        dishes={menu.categories.flatMap((category: any) => category.dishes)}
        onAddToCart={addToCart}
      />

      {/* Modal dettaglio piatto */}
      <DishDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        dish={selectedDish}
        onAddToCart={addToCart}
      />

      {/* Modal carrello */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0  bg-opacity-0 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />
          
          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-2xl">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faShoppingCart} className="h-5 w-5" />
                <span className="font-semibold">Carrello</span>
                {getTotalItems() > 0 && (
                  <span className="bg-white text-blue-600 text-xs px-2 py-1 rounded-full">
                    {getTotalItems()}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 hover:bg-blue-700 rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart content */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <FontAwesomeIcon icon={faShoppingCart} className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Il tuo carrello è vuoto</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.dish.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <img
                        src={item.dish.image || '/placeholder-dish.jpg'}
                        alt={item.dish.name}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.dish.name}</h4>
                        <p className="text-sm text-gray-500">€{Number(item.dish.price).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.dish.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.dish.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.dish.id)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Totale:</span>
                  <span className="text-lg font-bold text-blue-600">€{getTotalPrice().toFixed(2)}</span>
                </div>
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Procedi all'ordine
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowOrderForm(false)}
          />
          
          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faShoppingCart} className="h-5 w-5" />
                <span className="font-semibold text-lg">Completa Ordine</span>
              </div>
              <button
                onClick={() => setShowOrderForm(false)}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form content */}
            <div className="p-6 space-y-4">
              {/* Table Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numero Tavolo *
                </label>
                <input
                  type="text"
                  value={orderData.tableNumber}
                  onChange={(e) => setOrderData({...orderData, tableNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Es. 5, A1, Terrazza"
                  required
                />
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Cliente
                </label>
                <input
                  type="text"
                  value={orderData.customerName}
                  onChange={(e) => setOrderData({...orderData, customerName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome (opzionale)"
                />
              </div>

              {/* Customer Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefono
                </label>
                <input
                  type="tel"
                  value={orderData.customerPhone}
                  onChange={(e) => setOrderData({...orderData, customerPhone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Telefono (opzionale)"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note per la Cucina
                </label>
                <textarea
                  value={orderData.notes}
                  onChange={(e) => setOrderData({...orderData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Allergie, preferenze, note speciali..."
                  rows={3}
                />
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Riepilogo Ordine</h4>
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.dish.name} x{item.quantity}</span>
                      <span>€{(Number(item.dish.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Totale:</span>
                    <span>€{getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleOrderSubmit}
                disabled={isSubmittingOrder || cart.length === 0}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {isSubmittingOrder ? 'Invio in corso...' : `Invia Ordine (€${getTotalPrice().toFixed(2)})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifica */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-right duration-300">
          <FontAwesomeIcon icon={faShoppingCart} className="h-5 w-5" />
          <span className="font-medium">{notificationMessage}</span>
        </div>
      )}
    </div>
  )
}
