'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import './swagger-ui.css'

// Carica Swagger UI dinamicamente per evitare problemi SSR
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
})

export default function ApiDocsPage() {
  const [swaggerSpec, setSwaggerSpec] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSwaggerSpec = async () => {
      try {
        const response = await fetch('/api/docs')
        const spec = await response.json()
        setSwaggerSpec(spec)
      } catch (error) {
        console.error('Error fetching Swagger spec:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSwaggerSpec()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento documentazione API...</p>
        </div>
      </div>
    )
  }

  if (!swaggerSpec) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Errore</h1>
          <p className="text-gray-600">Impossibile caricare la documentazione API</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Menu API Documentation</h1>
          <p className="text-gray-600">
            Documentazione completa delle API per il sistema QR Menu
          </p>
        </div>
        
        <SwaggerUI 
          spec={swaggerSpec}
          docExpansion="list"
          defaultModelsExpandDepth={2}
          defaultModelExpandDepth={2}
          tryItOutEnabled={true}
          supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch']}
        />
      </div>
    </div>
  )
}
