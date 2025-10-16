import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userType = formData.get('userType') as string // 'client', 'restaurant', 'dish'
    const userId = formData.get('userId') as string
    const dishId = formData.get('dishId') as string // Solo per i piatti
    
    console.log('Profile image upload request:', {
      userType,
      userId,
      dishId,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type
    })
    
    if (!file) {
      return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 })
    }

    if (!userType || !userId) {
      return NextResponse.json({ error: 'userType e userId sono richiesti' }, { status: 400 })
    }

    // Verifica il tipo di file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Il file deve essere un\'immagine' }, { status: 400 })
    }

    // Verifica la dimensione (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Il file è troppo grande (max 10MB)' }, { status: 400 })
    }

    // Determina la struttura delle directory
    let uploadPath: string
    let imageUrl: string

    if (userType === 'dish') {
      if (dishId) {
        // Per piatti esistenti: uploads/profiles/restaurants/[restaurantId]/dishes/[dishId]/immagine.jpg
        uploadPath = join(process.cwd(), 'public', 'uploads', 'profiles', 'restaurants', userId, 'dishes', dishId)
        imageUrl = `/uploads/profiles/restaurants/${userId}/dishes/${dishId}`
      } else {
        // Per nuovi piatti: uploads/profiles/restaurants/[restaurantId]/dishes/temp/immagine.jpg
        uploadPath = join(process.cwd(), 'public', 'uploads', 'profiles', 'restaurants', userId, 'dishes', 'temp')
        imageUrl = `/uploads/profiles/restaurants/${userId}/dishes/temp`
      }
    } else if (userType === 'restaurant') {
      // Per i ristoranti: uploads/profiles/restaurants/[restaurantId]/immagine.jpg
      uploadPath = join(process.cwd(), 'public', 'uploads', 'profiles', 'restaurants', userId)
      imageUrl = `/uploads/profiles/restaurants/${userId}`
    } else if (userType === 'client') {
      // Per i clienti: uploads/profiles/clients/[clientId]/immagine.jpg
      uploadPath = join(process.cwd(), 'public', 'uploads', 'profiles', 'clients', userId)
      imageUrl = `/uploads/profiles/clients/${userId}`
    } else {
      return NextResponse.json({ error: 'Tipo utente non valido' }, { status: 400 })
    }

    // Crea la directory se non esiste
    await mkdir(uploadPath, { recursive: true })

    // Genera un nome file unico
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const filename = `${timestamp}_${randomString}.webp`

    // Converte l'immagine in WebP
    const buffer = await file.arrayBuffer()
    let webpBuffer: Buffer
    
    try {
      webpBuffer = await sharp(Buffer.from(buffer))
        .resize(1200, 1200, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .webp({ quality: 85 })
        .toBuffer()
    } catch (sharpError) {
      console.error('Sharp processing error:', sharpError)
      return NextResponse.json({ 
        error: 'Errore durante la conversione dell\'immagine. Assicurati che il file sia un\'immagine valida (JPG, PNG, GIF, WebP)',
        details: sharpError instanceof Error ? sharpError.message : 'Unknown error'
      }, { status: 400 })
    }

    // Salva il file
    const filepath = join(uploadPath, filename)
    await writeFile(filepath, webpBuffer)

    // Restituisce l'URL dell'immagine
    const finalImageUrl = `${imageUrl}/${filename}`

    return NextResponse.json({ 
      success: true, 
      imageUrl: finalImageUrl,
      filename,
      size: webpBuffer.length,
      originalSize: file.size,
      path: uploadPath
    })

  } catch (error) {
    console.error('Error uploading profile image:', error)
    return NextResponse.json({ error: 'Errore durante l\'upload' }, { status: 500 })
  }
}
