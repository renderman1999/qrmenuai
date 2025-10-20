'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, ChefHat, Clock, TrendingUp } from 'lucide-react'
import KitchenOrders from '@/components/admin/KitchenOrders'

interface OrdersPageProps {
  params: Promise<{
    id: string
  }>
}

export default function OrdersPage({ params }: OrdersPageProps) {
  const { data: session, status } = useSession()
  const { id: restaurantId } = use(params)
  const [restaurant, setRestaurant] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/admin-login')
      return
    }
    
    if (session?.user?.email) {
      loadRestaurantData(restaurantId, session.user.email)
      setIsLoading(false)
    }
  }, [session, status, router, restaurantId])

  const loadRestaurantData = async (restId: string, userEmail: string) => {
    try {
      const response = await fetch(`/api/restaurants?id=${restId}`, {
        headers: { 'x-user-email': userEmail }
      })
      
      if (response.ok) {
        const data = await response.json()
        setRestaurant(data.restaurant)
      }
    } catch (error) {
      console.error('Error loading restaurant:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Il redirect è gestito nel useEffect
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/admin-dashboard/restaurants/${restaurantId}`)}
            className="cursor-pointer flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Torna all'attività
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ChefHat className="h-8 w-8 mr-3 text-blue-600" />
                Gestione Ordini
              </h1>
              <p className="text-gray-600 mt-2">
                Monitora e gestisci gli ordini in tempo reale
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Ristorante</p>
                <p className="font-semibold">{restaurant?.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Attesa</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <ChefHat className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Preparazione</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pronti</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totale Oggi</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kitchen Orders Component */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Ordini in Tempo Reale</h2>
            <p className="text-gray-600 mt-1">
              Gli ordini si aggiornano automaticamente ogni 30 secondi
            </p>
          </div>
          
          <div className="p-6">
            <KitchenOrders restaurantId={restaurantId} />
          </div>
        </div>
      </div>
    </div>
  )
}
