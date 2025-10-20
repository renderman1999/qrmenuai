'use client'

import { useState, useEffect } from 'react'

interface MenuLoaderProps {
  restaurant: {
    name: string
    logo?: string | null
  }
}

export default function MenuLoader({ restaurant }: MenuLoaderProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return ''
        return prev + '.'
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Logo del ristorante */}
        <div className="flex justify-center">
          {restaurant.logo ? (
            <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg">
              <img 
                src={restaurant.logo} 
                alt={`Logo ${restaurant.name}`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">
                {restaurant.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Nome del ristorante */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {restaurant.name}
          </h1>
          <p className="text-gray-600 text-lg">
            Stiamo caricando il menu{dots}
          </p>
        </div>

        {/* Spinner */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>

        {/* Barra di progresso animata */}
        <div className="w-64 mx-auto">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-full rounded-full animate-pulse w-full"></div>
          </div>
        </div>

        {/* Testo di caricamento aggiuntivo */}
        <div className="text-sm text-gray-500 animate-pulse">
          Preparando la tua esperienza culinaria...
        </div>
      </div>
    </div>
  )
}
