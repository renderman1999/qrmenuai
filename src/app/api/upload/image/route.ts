import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 })
    }

    // Verifica il tipo di file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Il file deve essere un\'immagine' }, { status: 400 })
    }

    // Verifica la dimensione (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Il file è troppo grande (max 10MB)' }, { status: 400 })
    }

    // Crea la directory se non esiste
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'images')
    await mkdir(uploadDir, { recursive: true })

    // Genera un nome file unico
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const filename = `${timestamp}_${randomString}.webp`

    // Converte l'immagine in WebP
    const buffer = await file.arrayBuffer()
    const webpBuffer = await sharp(Buffer.from(buffer))
      .resize(1200, 1200, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .webp({ quality: 85 })
      .toBuffer()

    // Salva il file
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, webpBuffer)

    // Restituisce l'URL dell'immagine
    const imageUrl = `/uploads/images/${filename}`

    return NextResponse.json({ 
      success: true, 
      imageUrl,
      filename,
      size: webpBuffer.length,
      originalSize: file.size
    })

  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ error: 'Errore durante l\'upload' }, { status: 500 })
  }
}
