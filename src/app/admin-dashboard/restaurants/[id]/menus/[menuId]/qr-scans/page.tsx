'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, BarChart3, MapPin, Clock, Users, Globe } from 'lucide-react'

interface QRScanData {
  id: string
  ipAddress: string
  userAgent: string
  scannedAt: string
  location: {
    city: string
    region: string
    country: string
    latitude: number
    longitude: number
    timezone: string
    organization: string
  } | null
}

interface MenuQRStats {
  totalScans: number
  uniqueIPs: number
  countries: { [key: string]: number }
  cities: { [key: string]: number }
  regions: { [key: string]: number }
  timezones: { [key: string]: number }
  organizations: { [key: string]: number }
  scansByDay: { [key: string]: number }
  recentScans: QRScanData[]
}

interface MenuQRScansPageProps {
  params: Promise<{
    id: string
    menuId: string
  }>
}

export default function MenuQRScansPage({ params }: MenuQRScansPageProps) {
  const { data: session, status } = useSession()
  const { id: restaurantId, menuId } = use(params)
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<any>(null)
  const [menu, setMenu] = useState<any>(null)
  const [stats, setStats] = useState<MenuQRStats | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/admin-login')
      return
    }
    
    if (session?.user?.email) {
      loadData()
    }
  }, [status, session, restaurantId, menuId])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Load restaurant data
      const restaurantRes = await fetch(`/api/restaurants/${restaurantId}`)
      if (restaurantRes.ok) {
        const restaurantData = await restaurantRes.json()
        setRestaurant(restaurantData)
        
        // Find menu in restaurant data
        const menu = restaurantData.menus?.find((m: any) => m.id === menuId)
        if (menu) {
          setMenu(menu)
        }
      }
      
      // Load stats
      const statsRes = await fetch(`/api/restaurants/${restaurantId}/menus/${menuId}/qr-stats`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento scansioni QR...</p>
        </div>
      </div>
    )
  }

  if (!restaurant || !menu) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Menu non trovato</h1>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Torna indietro
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.back()}
              className="cursor-pointer mr-4 p-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Scansioni QR</h1>
              <p className="text-gray-600 mt-1">
                {restaurant.name} - {menu.name}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Scansioni Totali</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalScans}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">IP Unici</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.uniqueIPs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Globe className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Paesi</p>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.countries).length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Città</p>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.cities).length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Countries Chart */}
          {stats && Object.keys(stats.countries).length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scansioni per Paese</h3>
              <div className="space-y-3">
                {Object.entries(stats.countries)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([country, count]) => (
                    <div key={country} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{country}</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(count / Math.max(...Object.values(stats.countries))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Cities Chart */}
          {stats && Object.keys(stats.cities).length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scansioni per Città</h3>
              <div className="space-y-3">
                {Object.entries(stats.cities)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([city, count]) => (
                    <div key={city} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{city}</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(count / Math.max(...Object.values(stats.cities))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Scans */}
        {stats && stats.recentScans.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Scansioni Recenti</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Località
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organizzazione
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentScans.slice(0, 20).map((scan) => (
                    <tr key={scan.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(scan.scannedAt).toLocaleString('it-IT')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {scan.ipAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {scan.location ? (
                          <div>
                            <div className="font-medium">{scan.location.city}, {scan.location.region}</div>
                            <div className="text-xs text-gray-400">{scan.location.country}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {scan.location?.organization || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
