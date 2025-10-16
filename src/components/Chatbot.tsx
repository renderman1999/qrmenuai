'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, User, X } from 'lucide-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUtensils } from '@fortawesome/free-solid-svg-icons'
import DishCard from './DishCard'
import DishDetailModal from './DishDetailModal'

interface ChatbotProps {
  restaurantId: string
  menuId: string
  dishes: any[]
  onAddToCart?: (dish: any, quantity: number) => void
}

interface Message {
  id: string
  type: 'user' | 'bot' | 'dish'
  content: string
  timestamp: Date
  dish?: any
}

export default function Chatbot({ restaurantId, menuId, dishes, onAddToCart }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Ciao! Sono il tuo assistente AI per il menu. Posso aiutarti a trovare piatti, rispondere a domande su allergeni, ingredienti o darti raccomandazioni personalizzate. Cosa vorresti sapere?',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [clickedQuestion, setClickedQuestion] = useState<string | null>(null)
  const [selectedDish, setSelectedDish] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const questionsContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Funzioni per gestire lo swipe
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!questionsContainerRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - questionsContainerRef.current.offsetLeft)
    setScrollLeft(questionsContainerRef.current.scrollLeft)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !questionsContainerRef.current) return
    e.preventDefault()
    const x = e.pageX - questionsContainerRef.current.offsetLeft
    const walk = (x - startX) * 2
    questionsContainerRef.current.scrollLeft = scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  // Touch events per mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!questionsContainerRef.current) return
    setIsDragging(true)
    setStartX(e.touches[0].pageX - questionsContainerRef.current.offsetLeft)
    setScrollLeft(questionsContainerRef.current.scrollLeft)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !questionsContainerRef.current) return
    const x = e.touches[0].pageX - questionsContainerRef.current.offsetLeft
    const walk = (x - startX) * 2
    questionsContainerRef.current.scrollLeft = scrollLeft - walk
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleDishView = (dish: any) => {
    setSelectedDish(dish)
    setIsModalOpen(true)
  }

  const handleDishAddToOrder = (dish: any, quantity: number) => {
    // TODO: Implementare logica carrello
    console.log(`Aggiunto al carrello: ${quantity}x ${dish.name}`)
    
    // Aggiungi messaggio di conferma
    const confirmationMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: `Perfetto! Ho aggiunto ${quantity}x ${dish.name} al tuo ordine.`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, confirmationMessage])
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDish(null)
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          restaurantId,
          menuId
        })
      })

      const data = await response.json()
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])

      // Add dish cards if any dishes were mentioned
      if (data.mentionedDishes && data.mentionedDishes.length > 0) {
        data.mentionedDishes.forEach((dish: any) => {
          const dishMessage: Message = {
            id: (Date.now() + Math.random()).toString(),
            type: 'dish',
            content: '',
            timestamp: new Date(),
            dish: dish
          }
          setMessages(prev => [...prev, dishMessage])
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Mi dispiace, ho avuto un problema nel rispondere. Riprova tra un momento.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const suggestedQuestions = [
    "Quali piatti sono vegetariani?",
    "Hai qualcosa senza glutine?",
    "Cosa mi consigli per un pranzo leggero?",
    "Quali sono i piatti più popolari?",
    "Hai bevande analcoliche?",
    "Cosa mi consigli per un vegano?",
    "Quali sono i prezzi più bassi?",
    "Hai qualcosa di piccante?"
  ]

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-15 h-15 fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors z-50"
        aria-label="Apri chatbot"
      >
        <FontAwesomeIcon icon={faUtensils} className="h-6 w-6" />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-opacity-0 flex items-end justify-end z-50"
          onClick={(e) => {
            // Chiudi solo se si clicca sul backdrop, non sul contenuto
            if (e.target === e.currentTarget) {
              setIsOpen(false)
            }
          }}
        >
          <div 
            className="bg-white rounded-t-lg shadow-xl w-full max-w-md h-[600px] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faUtensils} className="h-5 w-5" />
                <span className="font-semibold">Assistente AI</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'dish' ? (
                    <div className="w-full max-w-sm">
                      <DishCard
                        dish={message.dish}
                        onView={handleDishView}
                        onAddToOrder={handleDishAddToOrder}
                      />
                    </div>
                  ) : (
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === 'bot' && (
                          <FontAwesomeIcon icon={faUtensils} className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        )}
                        {message.type === 'user' && (
                          <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FontAwesomeIcon icon={faUtensils} className="h-4 w-4" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions - Always visible */}
            <div className="p-4 border-t bg-gray-50">
              <p className="text-sm text-gray-600 mb-3">💡 Domande suggerite:</p>
              <div 
                ref={questionsContainerRef}
                className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ 
                  scrollbarWidth: 'none', 
                  msOverflowStyle: 'none',
                  scrollBehavior: isDragging ? 'auto' : 'smooth'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      if (isDragging) {
                        e.preventDefault()
                        return
                      }
                      setClickedQuestion(question)
                      // Invia direttamente senza mostrare nell'input
                      const userMessage: Message = {
                        id: Date.now().toString(),
                        type: 'user',
                        content: question,
                        timestamp: new Date()
                      }
                      setMessages(prev => [...prev, userMessage])
                      setIsLoading(true)
                      
                      // Invia la domanda direttamente
                      fetch('/api/ai/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          message: question,
                          restaurantId,
                          menuId
                        })
                      })
                      .then(response => response.json())
                      .then(data => {
                        const botMessage: Message = {
                          id: (Date.now() + 1).toString(),
                          type: 'bot',
                          content: data.response,
                          timestamp: new Date()
                        }
                        setMessages(prev => [...prev, botMessage])

                        // Add dish cards if any dishes were mentioned
                        if (data.mentionedDishes && data.mentionedDishes.length > 0) {
                          data.mentionedDishes.forEach((dish: any) => {
                            const dishMessage: Message = {
                              id: (Date.now() + Math.random()).toString(),
                              type: 'dish',
                              content: '',
                              timestamp: new Date(),
                              dish: dish
                            }
                            setMessages(prev => [...prev, dishMessage])
                          })
                        }
                      })
                      .catch(error => {
                        console.error('Error sending message:', error)
                        const errorMessage: Message = {
                          id: (Date.now() + 1).toString(),
                          type: 'bot',
                          content: 'Mi dispiace, ho avuto un problema nel rispondere. Riprova tra un momento.',
                          timestamp: new Date()
                        }
                        setMessages(prev => [...prev, errorMessage])
                      })
                      .finally(() => {
                        setIsLoading(false)
                        setClickedQuestion(null)
                      })
                    }}
                    className={`flex-shrink-0 text-xs px-3 py-2 rounded-full border transition-all duration-200 shadow-sm hover:shadow-md ${
                      clickedQuestion === question
                        ? 'bg-green-200 text-green-800 border-green-300 scale-95'
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200 hover:border-blue-300 hover:scale-105'
                    }`}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Scrivi la tua domanda..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal dettaglio piatto - usa lo stesso del menu pubblico */}
      <DishDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        dish={selectedDish}
        onAddToCart={onAddToCart}
      />
    </>
  )
}
