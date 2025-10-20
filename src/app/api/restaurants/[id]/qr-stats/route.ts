import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id: restaurantId } = await params

    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Verifica che l'utente sia il proprietario del ristorante
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Ristorante non trovato' }, { status: 404 })
    }

    if (restaurant.ownerId !== user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Ottieni tutti i QR codes del ristorante e dei suoi menu
    const restaurantQRCodes = await prisma.qRCode.findMany({
      where: {
        restaurantId: restaurantId,
        isActive: true
      }
    })

    const menuQRCodes = await prisma.qRCode.findMany({
      where: {
        menu: {
          restaurantId: restaurantId
        },
        isActive: true
      }
    })

    const allQRCodeIds = [...restaurantQRCodes, ...menuQRCodes].map(qr => qr.id)

    // Ottieni tutte le scansioni per questi QR codes
    const scans = await prisma.qRScan.findMany({
      where: {
        qrCodeId: {
          in: allQRCodeIds
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filtra scansioni con dati di geolocalizzazione validi
    const scansWithLocation = scans.filter(scan => scan.location !== null)

    // Calcola statistiche generali
    const totalScans = scans.length
    const scansWithLocationCount = scansWithLocation.length

    // Aggrega statistiche per paese
    const countryStats: Record<string, number> = {}
    const cityStats: Record<string, number> = {}
    const organizationStats: Record<string, number> = {}
    const deviceStats: Record<string, number> = {}
    const connectionStats: Record<string, number> = {}

    scansWithLocation.forEach(scan => {
      const location = scan.location as any
      
      // Paese
      if (location.country) {
        countryStats[location.country] = (countryStats[location.country] || 0) + 1
      }
      
      // Città
      if (location.city && location.city !== 'Unknown') {
        const cityKey = `${location.city}${location.region ? `, ${location.region}` : ''}`
        cityStats[cityKey] = (cityStats[cityKey] || 0) + 1
      }
      
      // Organizzazione
      if (location.organization) {
        organizationStats[location.organization] = (organizationStats[location.organization] || 0) + 1
      }
      
      // Tipo di dispositivo (da user agent)
      const userAgent = scan.userAgent || ''
      if (userAgent.includes('Mobile')) {
        deviceStats['Mobile'] = (deviceStats['Mobile'] || 0) + 1
      } else if (userAgent.includes('Tablet')) {
        deviceStats['Tablet'] = (deviceStats['Tablet'] || 0) + 1
      } else {
        deviceStats['Desktop'] = (deviceStats['Desktop'] || 0) + 1
      }
      
      // Tipo di connessione
      if (location.isMobile) {
        connectionStats['Mobile'] = (connectionStats['Mobile'] || 0) + 1
      }
      if (location.isHosting) {
        connectionStats['Hosting'] = (connectionStats['Hosting'] || 0) + 1
      }
      if (location.isAnonymous) {
        connectionStats['Anonymous'] = (connectionStats['Anonymous'] || 0) + 1
      }
    })

    // Top paesi
    const topCountries = Object.entries(countryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }))

    // Top città
    const topCities = Object.entries(cityStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }))

    // Top organizzazioni
    const topOrganizations = Object.entries(organizationStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([organization, count]) => ({ organization, count }))

    // Statistiche dispositivi
    const deviceStatsArray = Object.entries(deviceStats)
      .map(([device, count]) => ({ device, count }))

    // Statistiche connessioni
    const connectionStatsArray = Object.entries(connectionStats)
      .map(([connection, count]) => ({ connection, count }))

    // Scansioni recenti (ultime 20)
    const recentScans = scansWithLocation.slice(0, 20).map(scan => {
      const location = scan.location as any
      return {
        id: scan.id,
        qrCodeId: scan.qrCodeId,
        ipAddress: scan.ipAddress,
        userAgent: scan.userAgent,
        scannedAt: scan.createdAt,
        location: {
          country: location.country || 'Unknown',
          city: location.city || 'Unknown',
          region: location.region || 'Unknown',
          organization: location.organization || 'Unknown',
          isMobile: location.isMobile || false,
          isHosting: location.isHosting || false,
          isAnonymous: location.isAnonymous || false
        }
      }
    })

    return NextResponse.json({
      totalScans,
      scansWithLocation: scansWithLocationCount,
      topCountries,
      topCities,
      topOrganizations,
      deviceStats: deviceStatsArray,
      connectionStats: connectionStatsArray,
      recentScans
    })

  } catch (error) {
    console.error('Error fetching restaurant QR stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
