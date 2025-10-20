import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Verifica che l'utente sia admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    }

    // Get QR scan statistics
    const totalScans = await prisma.qRScan.count()
    
    // Get all scans with location data
    const scansWithLocation = await prisma.qRScan.findMany({
      select: {
        location: true
      }
    })

    // Get recent scans (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentScans = await prisma.qRScan.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        qrCode: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    })

    // Get top restaurants by scans
    const topRestaurants = await prisma.qRCode.findMany({
      include: {
        restaurant: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            scans: true
          }
        }
      },
      orderBy: {
        scanCount: 'desc'
      },
      take: 10
    })

    // Filter scans with valid location data
    const validLocationScans = scansWithLocation.filter(item => item.location !== null)

    // Process country data
    const countryStats = validLocationScans.map(item => {
      const location = item.location as any
      return {
        country: location?.country || 'Unknown',
        region: location?.region || 'Unknown',
        city: location?.city || 'Unknown'
      }
    }).reduce((acc, item) => {
      const existing = acc.find(x => x.country === item.country)
      if (existing) {
        existing.count += 1
      } else {
        acc.push({ ...item, count: 1 })
      }
      return acc
    }, [] as any[])

    // Process city data
    const cityStats = validLocationScans.map(item => {
      const location = item.location as any
      return {
        city: location?.city || 'Unknown',
        region: location?.region || 'Unknown',
        country: location?.country || 'Unknown'
      }
    }).reduce((acc, item) => {
      const key = `${item.city}, ${item.region}`
      const existing = acc.find(x => x.key === key)
      if (existing) {
        existing.count += 1
      } else {
        acc.push({ ...item, key, count: 1 })
      }
      return acc
    }, [] as any[])

    return NextResponse.json({
      totalScans,
      countryStats: countryStats.sort((a, b) => b.count - a.count),
      cityStats: cityStats.sort((a, b) => b.count - a.count),
      recentScans,
      topRestaurants
    })

  } catch (error) {
    console.error('Error fetching QR stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
