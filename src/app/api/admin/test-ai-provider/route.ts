import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { z } from 'zod'

const testProviderSchema = z.object({
  provider: z.enum(['openai', 'deepseek']),
  apiKey: z.string().min(1)
})

// POST - Testa provider AI
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { provider, apiKey } = testProviderSchema.parse(body)

    let testResult: { success: boolean, message: string }

    if (provider === 'openai') {
      testResult = await testOpenAI(apiKey)
    } else if (provider === 'deepseek') {
      testResult = await testDeepSeek(apiKey)
    } else {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    return NextResponse.json({
      success: testResult.success,
      message: testResult.message
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    
    console.error('Error testing AI provider:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function testOpenAI(apiKey: string): Promise<{ success: boolean, message: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: 'Test connection'
          }
        ],
        max_tokens: 10
      })
    })

    if (response.ok) {
      return {
        success: true,
        message: 'OpenAI API connessa correttamente'
      }
    } else {
      const errorData = await response.json()
      return {
        success: false,
        message: `Errore OpenAI: ${errorData.error?.message || 'API key non valida'}`
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Errore di connessione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
    }
  }
}

async function testDeepSeek(apiKey: string): Promise<{ success: boolean, message: string }> {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: 'Test connection'
          }
        ],
        max_tokens: 10
      })
    })

    if (response.ok) {
      return {
        success: true,
        message: 'DeepSeek API connessa correttamente'
      }
    } else {
      const errorData = await response.json()
      return {
        success: false,
        message: `Errore DeepSeek: ${errorData.error?.message || 'API key non valida'}`
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Errore di connessione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
    }
  }
}
