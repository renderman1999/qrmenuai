import { NextResponse } from 'next/server'
import { CATEGORY_PRESETS } from '@/lib/categories/presets'

export async function GET() {
  try {
    return NextResponse.json({ categories: CATEGORY_PRESETS })
  } catch (error) {
    console.error('Error fetching preset categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
