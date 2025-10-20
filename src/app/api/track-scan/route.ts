import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getGeolocationData, getClientIP } from '@/lib/services/ipinfo'

export async function POST(request: NextRequest) {
  try {
    const { qrCodeId, userAgent } = await request.json()

    if (!qrCodeId) {
      return NextResponse.json({ error: 'QR Code ID is required' }, { status: 400 })
    }

    // Get client IP address
    const clientIP = getClientIP(request)
    console.log('🔍 Tracking QR scan:', { qrCodeId, clientIP })
    
    // Get geolocation data (with error handling)
    let geoData = null
    try {
      geoData = await getGeolocationData(clientIP)
      console.log('🌍 Geolocation data:', geoData)
    } catch (error) {
      console.error('Error getting geolocation data:', error)
      // Continue without geolocation data
    }

    // Create QR scan record with geolocation data
    const scanRecord = await prisma.qRScan.create({
      data: {
        qrCodeId,
        ipAddress: clientIP,
        userAgent: userAgent || request.headers.get('user-agent') || 'unknown',
        location: geoData ? {
          // Basic geolocation data
          ip: geoData.ip,
          city: geoData.city,
          region: geoData.region,
          country: geoData.country,
          latitude: geoData.latitude,
          longitude: geoData.longitude,
          timezone: geoData.timezone,
          organization: geoData.organization,
          postal: geoData.postal,
          hostname: geoData.hostname,
          // Extended data from ipinfo.io
          countryCode: geoData.countryCode,
          continent: geoData.continent,
          continentCode: geoData.continentCode,
          asn: geoData.asn,
          asName: geoData.asName,
          asDomain: geoData.asDomain,
          asType: geoData.asType,
          asLastChanged: geoData.asLastChanged,
          isAnonymous: geoData.isAnonymous,
          isAnycast: geoData.isAnycast,
          isHosting: geoData.isHosting,
          isMobile: geoData.isMobile,
          isSatellite: geoData.isSatellite,
          mobile: geoData.mobile,
          anonymous: geoData.anonymous,
          bogon: geoData.bogon
        } : undefined
      }
    })

    // Update QR code scan count and last scanned time
    await prisma.qRCode.update({
      where: { id: qrCodeId },
      data: {
        scanCount: { increment: 1 },
        lastScanned: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      scanId: scanRecord.id,
      geoData: geoData ? {
        city: geoData.city,
        region: geoData.region,
        country: geoData.country
      } : null
    })

  } catch (error) {
    console.error('Error tracking QR scan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
