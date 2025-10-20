import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const aiConfigSchema = z.object({
  provider: z.enum(['openai', 'deepseek']),
  openaiApiKey: z.string().optional(),
  deepseekApiKey: z.string().optional(),
  isEnabled: z.boolean().optional()
})

// GET - Carica configurazione AI
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Carica configurazione dal database o usa default
    let config = await prisma.systemConfig.findFirst({
      where: { key: 'ai_config' }
    })

    if (!config) {
      // Configurazione di default - crea nel database
      const defaultConfig = {
        provider: 'openai',
        openaiApiKey: process.env.OPENAI_API_KEY || '',
        deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
        isEnabled: true
      }

      // Salva configurazione di default nel database
      const newConfig = await prisma.systemConfig.create({
        data: {
          key: 'ai_config',
          value: JSON.stringify(defaultConfig)
        }
      })

      return NextResponse.json({ 
        config: defaultConfig 
      })
    }

    const parsedConfig = JSON.parse(config.value)
    return NextResponse.json({ 
      config: parsedConfig 
    })

  } catch (error) {
    console.error('Error loading AI config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Salva configurazione AI
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedConfig = aiConfigSchema.parse(body)

    // Salva configurazione nel database
    const config = await prisma.systemConfig.upsert({
      where: { key: 'ai_config' },
      update: {
        value: JSON.stringify(validatedConfig),
        updatedAt: new Date()
      },
      create: {
        key: 'ai_config',
        value: JSON.stringify(validatedConfig),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Aggiorna variabili ambiente per il provider attivo
    if (validatedConfig.provider === 'openai' && validatedConfig.openaiApiKey) {
      process.env.OPENAI_API_KEY = validatedConfig.openaiApiKey
    } else if (validatedConfig.provider === 'deepseek' && validatedConfig.deepseekApiKey) {
      process.env.DEEPSEEK_API_KEY = validatedConfig.deepseekApiKey
    }

    return NextResponse.json({ 
      success: true,
      config: JSON.parse(config.value)
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid configuration', details: error.errors }, { status: 400 })
    }
    
    console.error('Error saving AI config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
