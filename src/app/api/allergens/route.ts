import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching allergens...')
    const allergens = await prisma.allergen.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log('Found allergens:', allergens.length)
    return NextResponse.json({ allergens })
  } catch (error: any) {
    console.error('Error fetching allergens:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
