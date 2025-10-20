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
  const [isGenerating, setIsGenerating] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const generateQRCode = async () => {
      if (!url) {
        setError('URL non valida')
        setIsGenerating(false)
        return
      }

      try {
        setIsGenerating(true)
        setError(null)
        
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
        setError('Errore nella generazione del QR Code')
      } finally {
        setIsGenerating(false)
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
          QR Code per questo Menu
        </h3>
        
        {isGenerating ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Generazione QR Code...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="text-red-500 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm text-red-600">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Riprova
              </button>
            </div>
          </div>
        ) : qrCodeDataUrl ? (
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
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={downloadQRCode}
                  className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Download className="h-4 w-4" />
                  Scarica QR Code
                </button>
                
                <button
                  onClick={copyUrl}
                  className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copiato!' : 'Copia URL'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
