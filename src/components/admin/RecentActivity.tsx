'use client'

import { Clock, ShoppingCart, CheckCircle } from 'lucide-react'

interface RecentActivityProps {
  orders: any[]
}

export default function RecentActivity({ orders }: RecentActivityProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'CONFIRMED':
      case 'PREPARING':
        return <ShoppingCart className="h-4 w-4 text-blue-500" />
      case 'READY':
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800'
      case 'READY':
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No recent orders</p>
          <p className="text-sm text-gray-500">Orders will appear here once customers start placing them</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(order.status)}
              <div>
                <p className="font-medium text-gray-900">
                  Order #{order.orderNumber}
                </p>
                <p className="text-sm text-gray-600">
                  {order.restaurant.name} • {order.items.length} items
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
              <p className="text-sm font-medium text-gray-900 mt-1">
                €{order.totalAmount}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {orders.length >= 5 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <a
            href="/admin/orders"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View all orders →
          </a>
        </div>
      )}
    </div>
  )
}
