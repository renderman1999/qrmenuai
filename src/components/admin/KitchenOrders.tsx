'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle, ChefHat, Timer } from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
  totalAmount: number
  tableNumber?: string
  kitchenNotes?: string
  estimatedTime?: number
  notes?: string
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    price: number
    notes?: string
    dish: {
      id: string
      name: string
      image?: string
    }
  }>
}

interface KitchenOrdersProps {
  restaurantId: string
}

const statusConfig = {
  PENDING: { 
    label: 'In Attesa', 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: AlertCircle,
    bgColor: 'bg-yellow-50 border-yellow-200'
  },
  CONFIRMED: { 
    label: 'Confermato', 
    color: 'bg-blue-100 text-blue-800', 
    icon: CheckCircle,
    bgColor: 'bg-blue-50 border-blue-200'
  },
  PREPARING: { 
    label: 'In Preparazione', 
    color: 'bg-orange-100 text-orange-800', 
    icon: ChefHat,
    bgColor: 'bg-orange-50 border-orange-200'
  },
  READY: { 
    label: 'Pronto', 
    color: 'bg-green-100 text-green-800', 
    icon: CheckCircle,
    bgColor: 'bg-green-50 border-green-200'
  },
  DELIVERED: { 
    label: 'Consegnato', 
    color: 'bg-gray-100 text-gray-800', 
    icon: CheckCircle,
    bgColor: 'bg-gray-50 border-gray-200'
  },
  CANCELLED: { 
    label: 'Annullato', 
    color: 'bg-red-100 text-red-800', 
    icon: XCircle,
    bgColor: 'bg-red-50 border-red-200'
  }
}

export default function KitchenOrders({ restaurantId }: KitchenOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    loadOrders()
    // Aggiorna ogni 30 secondi
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [restaurantId])

  const loadOrders = async () => {
    try {
      const response = await fetch(`/api/orders?restaurantId=${restaurantId}`)
      const data = await response.json()
      
      if (data.success) {
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ))
      }
    } catch (error) {
      console.error('Error updating order:', error)
    } finally {
      setUpdating(null)
    }
  }

  const filteredOrders = orders.filter(order => {
    if (selectedStatus === 'ALL') return true
    return order.status === selectedStatus
  })

  const getStatusCounts = () => {
    const counts = {
      PENDING: 0,
      CONFIRMED: 0,
      PREPARING: 0,
      READY: 0,
      DELIVERED: 0,
      CANCELLED: 0
    }
    
    orders.forEach(order => {
      counts[order.status as keyof typeof counts]++
    })
    
    return counts
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Filter */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4">Filtri Stato</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === 'ALL' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tutti ({orders.length})
          </button>
          {Object.entries(statusCounts).map(([status, count]) => {
            const config = statusConfig[status as keyof typeof statusConfig]
            const Icon = config.icon
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedStatus === status 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {config.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nessun ordine trovato</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const config = statusConfig[order.status as keyof typeof statusConfig]
            const Icon = config.icon
            
            return (
              <div key={order.id} className={`rounded-lg border p-6 ${config.bgColor}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">Ordine #{order.orderNumber}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                        <Icon className="h-4 w-4 inline mr-1" />
                        {config.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {order.tableNumber && (
                        <span>🍽️ Tavolo {order.tableNumber}</span>
                      )}
                      <span>💰 €{Number(order.totalAmount).toFixed(2)}</span>
                      <span>🕒 {new Date(order.createdAt).toLocaleTimeString()}</span>
                      {order.estimatedTime && (
                        <span className="flex items-center gap-1">
                          <Timer className="h-4 w-4" />
                          {order.estimatedTime} min
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                        disabled={updating === order.id}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Conferma
                      </button>
                    )}
                    {order.status === 'CONFIRMED' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                        disabled={updating === order.id}
                        className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 disabled:opacity-50"
                      >
                        Inizia Preparazione
                      </button>
                    )}
                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'READY')}
                        disabled={updating === order.id}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        Pronto
                      </button>
                    )}
                    {order.status === 'READY' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                        disabled={updating === order.id}
                        className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 disabled:opacity-50"
                      >
                        Consegnato
                      </button>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-2">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        {item.dish.image && (
                          <img 
                            src={item.dish.image} 
                            alt={item.dish.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <h4 className="font-medium">{item.dish.name}</h4>
                          <p className="text-sm text-gray-600">x{item.quantity}</p>
                          {item.notes && (
                            <p className="text-sm text-blue-600">Note: {item.notes}</p>
                          )}
                        </div>
                      </div>
                      <span className="font-semibold">€{(Number(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Order Notes */}
                {(order.notes || order.kitchenNotes) && (
                  <div className="mt-4 p-3 bg-white rounded-lg">
                    {order.notes && (
                      <p className="text-sm"><strong>Note Cliente:</strong> {order.notes}</p>
                    )}
                    {order.kitchenNotes && (
                      <p className="text-sm"><strong>Note Cucina:</strong> {order.kitchenNotes}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
