'use client'

import { useEffect } from 'react'

interface QRScanTrackerProps {
  qrCodeId: string
}

export default function QRScanTracker({ qrCodeId }: QRScanTrackerProps) {
  useEffect(() => {
    const trackScan = async () => {
      try {
        const response = await fetch('/api/track-scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            qrCodeId,
            userAgent: navigator.userAgent
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('QR scan tracked:', data)
        } else {
          console.error('Failed to track QR scan')
        }
      } catch (error) {
        console.error('Error tracking QR scan:', error)
      }
    }

    // Track the scan
    trackScan()
  }, [qrCodeId])

  return null // This component doesn't render anything
}
