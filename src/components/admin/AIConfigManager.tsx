'use client'

import { useState, useEffect } from 'react'
import { Bot, Settings, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface AIConfig {
  provider: 'openai' | 'deepseek'
  openaiApiKey: string
  deepseekApiKey: string
  isEnabled: boolean
}

interface AIConfigManagerProps {
  onConfigChange?: (config: AIConfig) => void
}

export default function AIConfigManager({ onConfigChange }: AIConfigManagerProps) {
  const [config, setConfig] = useState<AIConfig>({
    provider: 'openai',
    openaiApiKey: '',
    deepseekApiKey: '',
    isEnabled: true
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [testResults, setTestResults] = useState<{
    openai: { status: 'idle' | 'testing' | 'success' | 'error', message: string }
    deepseek: { status: 'idle' | 'testing' | 'success' | 'error', message: string }
  }>({
    openai: { status: 'idle', message: '' },
    deepseek: { status: 'idle', message: '' }
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/ai-config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
      }
    } catch (error) {
      console.error('Errore nel caricamento della configurazione AI:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
        if (onConfigChange) {
          onConfigChange(data.config)
        }
        alert('Configurazione AI salvata con successo!')
      } else {
        const error = await response.json()
        alert(`Errore nel salvataggio: ${error.message}`)
      }
    } catch (error) {
      console.error('Errore nel salvataggio della configurazione:', error)
      alert('Errore di connessione')
    } finally {
      setIsSaving(false)
    }
  }

  const testProvider = async (provider: 'openai' | 'deepseek') => {
    setTestResults(prev => ({
      ...prev,
      [provider]: { status: 'testing', message: 'Testando connessione...' }
    }))

    try {
      const response = await fetch('/api/admin/test-ai-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider, apiKey: config[provider === 'openai' ? 'openaiApiKey' : 'deepseekApiKey'] })
      })

      if (response.ok) {
        const data = await response.json()
        setTestResults(prev => ({
          ...prev,
          [provider]: { status: 'success', message: data.message }
        }))
      } else {
        const error = await response.json()
        setTestResults(prev => ({
          ...prev,
          [provider]: { status: 'error', message: error.message }
        }))
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [provider]: { status: 'error', message: 'Errore di connessione' }
      }))
    }
  }

  const handleConfigChange = (field: keyof AIConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600">Caricamento configurazione AI...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Configurazione AI Chatbot
              </h3>
              <p className="text-sm text-gray-600">
                Configura il provider AI per il chatbot del menu
              </p>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Provider AI
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  config.provider === 'openai'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleConfigChange('provider', 'openai')}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="provider"
                    value="openai"
                    checked={config.provider === 'openai'}
                    onChange={() => handleConfigChange('provider', 'openai')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">OpenAI GPT-4</div>
                    <div className="text-sm text-gray-500">Provider originale, più stabile</div>
                  </div>
                </div>
              </div>

              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  config.provider === 'deepseek'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleConfigChange('provider', 'deepseek')}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="provider"
                    value="deepseek"
                    checked={config.provider === 'deepseek'}
                    onChange={() => handleConfigChange('provider', 'deepseek')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">DeepSeek</div>
                    <div className="text-sm text-gray-500">Più economico, open source</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* API Keys */}
          <div className="space-y-4">
            {/* OpenAI API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key
              </label>
              <div className="flex space-x-2">
                <input
                  type="password"
                  value={config.openaiApiKey}
                  onChange={(e) => handleConfigChange('openaiApiKey', e.target.value)}
                  placeholder="sk-proj-..."
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => testProvider('openai')}
                  disabled={!config.openaiApiKey || testResults.openai.status === 'testing'}
                  className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {testResults.openai.status === 'testing' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Test'
                  )}
                </button>
              </div>
              {testResults.openai.status !== 'idle' && (
                <div className={`mt-2 flex items-center text-sm ${
                  testResults.openai.status === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {testResults.openai.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mr-1" />
                  )}
                  {testResults.openai.message}
                </div>
              )}
            </div>

            {/* DeepSeek API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DeepSeek API Key
              </label>
              <div className="flex space-x-2">
                <input
                  type="password"
                  value={config.deepseekApiKey}
                  onChange={(e) => handleConfigChange('deepseekApiKey', e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => testProvider('deepseek')}
                  disabled={!config.deepseekApiKey || testResults.deepseek.status === 'testing'}
                  className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {testResults.deepseek.status === 'testing' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Test'
                  )}
                </button>
              </div>
              {testResults.deepseek.status !== 'idle' && (
                <div className={`mt-2 flex items-center text-sm ${
                  testResults.deepseek.status === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {testResults.deepseek.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mr-1" />
                  )}
                  {testResults.deepseek.message}
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Provider Attivo: {config.provider === 'openai' ? 'OpenAI GPT-4' : 'DeepSeek'}
                </div>
                <div className="text-sm text-gray-500">
                  {config.isEnabled ? 'Chatbot abilitato' : 'Chatbot disabilitato'}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={loadConfig}
              className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              onClick={saveConfig}
              disabled={isSaving}
              className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Salva Configurazione'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
