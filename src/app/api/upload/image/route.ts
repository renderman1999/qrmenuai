import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

/**
 * @swagger
 * components:
 *   schemas:
 *     UploadImageResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         imageUrl:
 *           type: string
 *           description: URL dell'immagine caricata
 *         filename:
 *           type: string
 *           description: Nome del file generato
 *         size:
 *           type: number
 *           description: Dimensione del file in bytes
 *         originalSize:
 *           type: number
 *           description: Dimensione originale del file in bytes
 */

/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     summary: Carica un'immagine
 *     description: Carica e processa un'immagine convertendola in WebP
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File immagine da caricare
 *     responses:
 *       200:
 *         description: Immagine caricata con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadImageResponse'
 *       400:
 *         description: File non valido o troppo grande
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Errore durante l'upload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
