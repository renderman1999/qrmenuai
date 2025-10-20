'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, MapPin, Globe, TrendingUp, Users, Eye, BarChart3 } from 'lucide-react'

interface QRStats {
  totalScans: number
  countryStats: Array<{
    country: string
    region: string
    city: string
    count: number
  }>
  cityStats: Array<{
    city: string
    region: string
    country: string
    count: number
  }>
  recentScans: Array<{
    id: string
    ipAddress: string
    createdAt: string
    location: any
    qrCode: {
      id: string
      code: string
      restaurant: {
        id: string
        name: string
      }
    }
  }>
  topRestaurants: Array<{
    restaurantId: string
    _count: {
      scans: number
    }
  }>
}

export default function QRAnalyticsPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<QRStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/admin-login')
      return
    }
    
    if (session?.user?.email) {
      loadQRStats()
    }
  }, [session, status, router])

  const loadQRStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/qr-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Errore nel caricamento delle statistiche QR:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento statistiche...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Errore nel caricamento</h1>
          <button
            onClick={() => router.push('/admin-dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Torna alla Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center">
          <button
            onClick={() => router.push('/admin-dashboard')}
            className="cursor-pointer mr-4 p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics QR Code</h1>
            <p className="text-gray-600 mt-1">Statistiche delle scansioni QR code</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scansioni Totali</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalScans.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paesi</p>
                <p className="text-2xl font-bold text-gray-900">{stats.countryStats.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Città</p>
                <p className="text-2xl font-bold text-gray-900">{stats.cityStats.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scansioni Recenti</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentScans.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Countries */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Top Paesi</h3>
            </div>
            <div className="p-6">
              {stats.countryStats.slice(0, 10).map((country, index) => (
                <div key={country.country} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{country.country}</p>
                      <p className="text-xs text-gray-500">{country.region}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{country.count}</p>
                    <p className="text-xs text-gray-500">scansioni</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Cities */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Top Città</h3>
            </div>
            <div className="p-6">
              {stats.cityStats.slice(0, 10).map((city, index) => (
                <div key={`${city.city}-${city.region}-${index}`} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{city.city}</p>
                      <p className="text-xs text-gray-500">{city.region}, {city.country}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{city.count}</p>
                    <p className="text-xs text-gray-500">scansioni</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Stats */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Tipi di Connessione</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Mobile</span>
                  <span className="text-sm font-semibold text-green-600">
                    {stats.recentScans.filter(scan => scan.location?.isMobile).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Hosting</span>
                  <span className="text-sm font-semibold text-orange-600">
                    {stats.recentScans.filter(scan => scan.location?.isHosting).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">VPN/Proxy</span>
                  <span className="text-sm font-semibold text-red-600">
                    {stats.recentScans.filter(scan => scan.location?.anonymous?.isVpn || scan.location?.anonymous?.isProxy).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Satellite</span>
                  <span className="text-sm font-semibold text-purple-600">
                    {stats.recentScans.filter(scan => scan.location?.isSatellite).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Top ASN</h3>
            </div>
            <div className="p-6">
              {Object.entries(
                stats.recentScans
                  .filter(scan => scan.location?.asn)
                  .reduce((acc, scan) => {
                    const asn = scan.location?.asn
                    if (asn) {
                      acc[asn] = (acc[asn] || 0) + 1
                    }
                    return acc
                  }, {} as Record<string, number>)
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([asn, count]) => (
                  <div key={asn} className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">{asn}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Continenti</h3>
            </div>
            <div className="p-6">
              {Object.entries(
                stats.recentScans
                  .filter(scan => scan.location?.continent)
                  .reduce((acc, scan) => {
                    const continent = scan.location?.continent
                    if (continent) {
                      acc[continent] = (acc[continent] || 0) + 1
                    }
                    return acc
                  }, {} as Record<string, number>)
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([continent, count]) => (
                  <div key={continent} className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">{continent}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Scansioni Recenti</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ristorante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posizione
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentScans.slice(0, 20).map((scan) => (
                  <tr key={scan.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {scan.qrCode.restaurant.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {scan.qrCode.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {scan.location ? (
                        <div>
                          <div className="text-sm text-gray-900">
                            {scan.location.city}, {scan.location.region}
                          </div>
                          <div className="text-sm text-gray-500">
                            {scan.location.country}
                            {scan.location.asn && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {scan.location.asn}
                              </span>
                            )}
                            {scan.location.isMobile && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Mobile
                              </span>
                            )}
                            {scan.location.isHosting && (
                              <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                Hosting
                              </span>
                            )}
                            {scan.location.anonymous?.isVpn && (
                              <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                VPN
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {scan.ipAddress}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(scan.createdAt).toLocaleString('it-IT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
