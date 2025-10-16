import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import MenuDisplay from '@/components/MenuDisplay'

interface MenuPageProps {
  params: {
    qrCode: string
  }
}

export default async function MenuPage({ params }: MenuPageProps) {
  const { qrCode } = await params

  // Find QR code and get menu data
  const qrCodeData = await prisma.qRCode.findUnique({
    where: {
      code: qrCode,
      isActive: true
    },
    include: {
      menu: {
        include: {
          categories: {
            where: { isActive: true },
            include: {
              dishes: {
                where: { isActive: true },
                include: {
                  dishAllergens: {
                    include: {
                      allergen: true
                    }
                  },
                  dishIngredients: {
                    include: {
                      ingredient: true
                    }
                  }
                },
                orderBy: { sortOrder: 'asc' }
              }
            },
            orderBy: { sortOrder: 'asc' }
          },
          restaurant: true
        }
      },
      restaurant: true
    }
  })

  if (!qrCodeData || !qrCodeData.menu) {
    notFound()
  }

  // Track QR scan
  await prisma.qRCode.update({
    where: { id: qrCodeData.id },
    data: {
      scanCount: { increment: 1 },
      lastScanned: new Date()
    }
  })

  // Create QR scan record
  await prisma.qRScan.create({
    data: {
      qrCodeId: qrCodeData.id,
      ipAddress: 'unknown', // Will be filled by middleware
      userAgent: 'unknown' // Will be filled by middleware
    }
  })

  // Convert Decimal prices to numbers for client components
  const serializedMenu = {
    ...qrCodeData.menu,
    categories: qrCodeData.menu.categories.map(category => ({
      ...category,
      dishes: category.dishes.map(dish => ({
        ...dish,
        price: Number(dish.price)
      }))
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MenuDisplay 
        menu={serializedMenu}
        restaurant={qrCodeData.restaurant}
      />
    </div>
  )
}

export async function generateMetadata({ params }: MenuPageProps) {
  const { qrCode } = await params
  
  const qrCodeData = await prisma.qRCode.findUnique({
    where: { code: qrCode },
    include: {
      menu: {
        include: { restaurant: true }
      }
    }
  })

  if (!qrCodeData?.menu) {
    return {
      title: 'Menu Not Found',
      description: 'The requested menu could not be found.'
    }
  }

  return {
    title: `${qrCodeData.menu.name} - ${qrCodeData.menu.restaurant.name}`,
    description: qrCodeData.menu.description || `Menu for ${qrCodeData.menu.restaurant.name}`,
  }
}
