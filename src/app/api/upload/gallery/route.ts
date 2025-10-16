import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readdir, unlink } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 })
    }

    // Verifica che tutti i file siano immagini
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Tutti i file devono essere immagini' }, { status: 400 })
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Uno o più file sono troppo grandi (max 10MB)' }, { status: 400 })
      }
    }

    // Crea la directory se non esiste
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'gallery')
    await mkdir(uploadDir, { recursive: true })

    const uploadedImages = []

    for (const file of files) {
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

      uploadedImages.push({
        filename,
        imageUrl: `/uploads/gallery/${filename}`,
        size: webpBuffer.length,
        originalSize: file.size
      })
    }

    return NextResponse.json({ 
      success: true, 
      images: uploadedImages
    })

  } catch (error) {
    console.error('Error uploading images:', error)
    return NextResponse.json({ error: 'Errore durante l\'upload' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const galleryDir = join(process.cwd(), 'public', 'uploads', 'gallery')
    
    try {
      const files = await readdir(galleryDir)
      const images = files
        .filter(file => file.endsWith('.webp'))
        .map(file => ({
          filename: file,
          imageUrl: `/uploads/gallery/${file}`,
          name: file.replace('.webp', '')
        }))
        .sort((a, b) => b.filename.localeCompare(a.filename)) // Più recenti prima

      return NextResponse.json({ images })
    } catch (error) {
      // Directory non esiste ancora
      return NextResponse.json({ images: [] })
    }
  } catch (error) {
    console.error('Error fetching gallery:', error)
    return NextResponse.json({ error: 'Errore durante il caricamento della galleria' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    
    if (!filename) {
      return NextResponse.json({ error: 'Nome file richiesto' }, { status: 400 })
    }

    const filepath = join(process.cwd(), 'public', 'uploads', 'gallery', filename)
    
    try {
      await unlink(filepath)
      return NextResponse.json({ success: true, message: 'Immagine eliminata con successo' })
    } catch (error) {
      return NextResponse.json({ error: 'File non trovato' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json({ error: 'Errore durante l\'eliminazione' }, { status: 500 })
  }
}
