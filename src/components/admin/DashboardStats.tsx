'use client'

import { Users, QrCode, ShoppingCart, DollarSign } from 'lucide-react'

interface DashboardStatsProps {
  totalRestaurants: number
  totalScans: number
  totalOrders: number
  totalRevenue: number
}

export default function DashboardStats({
  totalRestaurants,
  totalScans,
  totalOrders,
  totalRevenue
}: DashboardStatsProps) {
  const stats = [
    {
      name: 'Restaurants',
      value: totalRestaurants,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      name: 'QR Scans',
      value: totalScans.toLocaleString(),
      icon: QrCode,
      color: 'bg-green-500'
    },
    {
      name: 'Total Orders',
      value: totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: 'bg-purple-500'
    },
    {
      name: 'Revenue',
      value: `€${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-yellow-500'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
