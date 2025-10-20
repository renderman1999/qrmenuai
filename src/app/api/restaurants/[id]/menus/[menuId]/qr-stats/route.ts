import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; menuId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id: restaurantId, menuId } = await params

    // Verifica che l'utente abbia accesso al ristorante
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Verifica che il menu appartenga al ristorante
    const menu = await prisma.menu.findFirst({
      where: {
        id: menuId,
        restaurantId: restaurantId
      }
    })

    if (!menu) {
      return NextResponse.json({ error: 'Menu non trovato' }, { status: 404 })
    }

    // Ottieni tutti i QR codes per questo menu
    const qrCodes = await prisma.qRCode.findMany({
      where: {
        menuId: menuId
      },
      select: {
        id: true
      }
    })

    if (qrCodes.length === 0) {
      return NextResponse.json({
        totalScans: 0,
        uniqueIPs: 0,
        countries: {},
        cities: {},
        regions: {},
        timezones: {},
        organizations: {},
        scansByDay: {},
        recentScans: []
      })
    }

    const qrCodeIds = qrCodes.map(qr => qr.id)

    // Ottieni tutte le scansioni per questi QR codes
    const scans = await prisma.qRScan.findMany({
      where: {
        qrCodeId: {
          in: qrCodeIds
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calcola statistiche
    const totalScans = scans.length
    const uniqueIPs = new Set(scans.map(scan => scan.ipAddress)).size

    // Aggrega per paese
    const countries: { [key: string]: number } = {}
    const cities: { [key: string]: number } = {}
    const regions: { [key: string]: number } = {}
    const timezones: { [key: string]: number } = {}
    const organizations: { [key: string]: number } = {}
    const scansByDay: { [key: string]: number } = {}

    scans.forEach(scan => {
      if (scan.location) {
        const location = scan.location as any
        
        // Paese
        if (location.country) {
          countries[location.country] = (countries[location.country] || 0) + 1
        }
        
        // Città
        if (location.city) {
          cities[location.city] = (cities[location.city] || 0) + 1
        }
        
        // Regione
        if (location.region) {
          regions[location.region] = (regions[location.region] || 0) + 1
        }
        
        // Timezone
        if (location.timezone) {
          timezones[location.timezone] = (timezones[location.timezone] || 0) + 1
        }
        
        // Organizzazione
        if (location.organization) {
          organizations[location.organization] = (organizations[location.organization] || 0) + 1
        }
      }
      
      // Scansioni per giorno
      const day = new Date(scan.createdAt).toISOString().split('T')[0]
      scansByDay[day] = (scansByDay[day] || 0) + 1
    })

    // Prepara scansioni recenti
    const recentScans = scans.slice(0, 50).map(scan => ({
      id: scan.id,
      ipAddress: scan.ipAddress,
      userAgent: scan.userAgent,
      scannedAt: scan.createdAt.toISOString(),
      location: scan.location ? {
        city: (scan.location as any).city || 'Unknown',
        region: (scan.location as any).region || 'Unknown',
        country: (scan.location as any).country || 'Unknown',
        latitude: (scan.location as any).latitude || 0,
        longitude: (scan.location as any).longitude || 0,
        timezone: (scan.location as any).timezone || 'Unknown',
        organization: (scan.location as any).organization || 'Unknown'
      } : null
    }))

    return NextResponse.json({
      totalScans,
      uniqueIPs,
      countries,
      cities,
      regions,
      timezones,
      organizations,
      scansByDay,
      recentScans
    })

  } catch (error) {
    console.error('Error fetching QR stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
