'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Download, Copy, Check } from 'lucide-react'

interface QRCodeGeneratorProps {
  url: string
  menuName: string
  className?: string
}

export default function QRCodeGenerator({ url, menuName, className = '' }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const generateQRCode = async () => {
      if (canvasRef.current) {
        try {
          const dataUrl = await QRCode.toDataURL(url, {
            width: 200,
            margin: 2,
            color: {
              dark: '#1f2937', // gray-800
              light: '#ffffff'
            }
          })
          setQrCodeDataUrl(dataUrl)
        } catch (error) {
          console.error('Error generating QR code:', error)
        }
      }
    }

    generateQRCode()
  }, [url])

  const downloadQRCode = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a')
      link.download = `qr-menu-${menuName.toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = qrCodeDataUrl
      link.click()
    }
  }

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying URL:', error)
    }
  }

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          QR Code per il Menu
        </h3>
        
        {qrCodeDataUrl ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img 
                src={qrCodeDataUrl} 
                alt="QR Code Menu" 
                className="border rounded-lg shadow-sm"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                I clienti scansionano questo QR code per accedere al menu
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={downloadQRCode}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Download className="h-4 w-4" />
                  Scarica QR Code
                </button>
                
                <button
                  onClick={copyUrl}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copiato!' : 'Copia URL'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  )
}
