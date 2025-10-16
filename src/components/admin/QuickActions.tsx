'use client'

import Link from 'next/link'
import { Plus, QrCode, Menu, Settings } from 'lucide-react'

interface QuickActionsProps {
  restaurants: any[]
}

export default function QuickActions({ restaurants }: QuickActionsProps) {
  const actions = [
    {
      name: 'Add Restaurant',
      description: 'Create a new restaurant',
      href: '/admin/restaurants/new',
      icon: Plus,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'Generate QR Code',
      description: 'Create QR codes for menus',
      href: '/admin/qr/generate',
      icon: QrCode,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      name: 'Manage Menus',
      description: 'Edit menus and dishes',
      href: '/admin/menus',
      icon: Menu,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      name: 'Settings',
      description: 'Account and preferences',
      href: '/admin/settings',
      icon: Settings,
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className={`p-2 rounded-lg ${action.color} mr-3`}>
              <action.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{action.name}</p>
              <p className="text-sm text-gray-600">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {restaurants.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Your Restaurants</h4>
          <div className="space-y-2">
            {restaurants.slice(0, 3).map((restaurant) => (
              <Link
                key={restaurant.id}
                href={`/admin/restaurants/${restaurant.id}`}
                className="block p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">{restaurant.name}</p>
                <p className="text-sm text-gray-600">{restaurant.address}</p>
              </Link>
            ))}
            {restaurants.length > 3 && (
              <Link
                href="/admin/restaurants"
                className="block text-sm text-blue-600 hover:text-blue-800"
              >
                View all {restaurants.length} restaurants →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
