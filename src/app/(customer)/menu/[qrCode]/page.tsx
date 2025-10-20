import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import MenuDisplay from '@/components/MenuDisplay'
import RestaurantLanding from '@/components/RestaurantLanding'

interface MenuPageProps {
  params: {
    qrCode: string
  }
  searchParams: {
    menuId?: string
  }
}

export default async function MenuPage({ params, searchParams }: MenuPageProps) {
  const { qrCode } = await params
  const { menuId } = await searchParams

  // Try to find by QR code first, then by slug
  let restaurant = null
  
  // First try QR code
  const qrCodeData = await prisma.qRCode.findUnique({
    where: {
      code: qrCode,
      isActive: true
    },
    include: {
      restaurant: {
        include: {
          menus: {
            where: { isActive: true }
          },
          articles: {
            orderBy: { createdAt: 'desc' }
          },
          reviews: {
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    }
  })

  if (qrCodeData && qrCodeData.restaurant) {
    restaurant = qrCodeData.restaurant
  } else {
    // Try to find by slug
    const restaurantBySlug = await prisma.restaurant.findUnique({
      where: {
        slug: qrCode,
        isActive: true
      },
      include: {
        menus: {
          where: { isActive: true }
        },
        articles: {
          orderBy: { createdAt: 'desc' }
        },
        reviews: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    if (restaurantBySlug) {
      restaurant = restaurantBySlug
    }
  }

  if (!restaurant) {
    notFound()
  }

  // Assicurati che i campi ordersEnabled e chatbotEnabled esistano
  if (restaurant) {
    const restaurantAny = restaurant as any
    
    // Controlla ordersEnabled
    if (typeof restaurantAny.ordersEnabled === 'undefined') {
      // Prova a leggere dal campo socialLinks
      const socialLinks = restaurantAny.socialLinks
      if (socialLinks && typeof socialLinks === 'object' && socialLinks.ordersEnabled !== undefined) {
        console.log('📦 Using socialLinks for ordersEnabled:', socialLinks.ordersEnabled)
        restaurantAny.ordersEnabled = socialLinks.ordersEnabled
      } else {
        console.log('⚠️ Using default for ordersEnabled')
        restaurantAny.ordersEnabled = false
      }
    } else {
      console.log('✅ Using direct database field for ordersEnabled:', restaurantAny.ordersEnabled)
    }
    
    // Controlla chatbotEnabled
    if (typeof restaurantAny.chatbotEnabled === 'undefined') {
      // Prova a leggere dal campo socialLinks
      const socialLinks = restaurantAny.socialLinks
      if (socialLinks && typeof socialLinks === 'object' && socialLinks.chatbotEnabled !== undefined) {
        console.log('📦 Using socialLinks for chatbotEnabled:', socialLinks.chatbotEnabled)
        restaurantAny.chatbotEnabled = socialLinks.chatbotEnabled
      } else {
        console.log('⚠️ Using default for chatbotEnabled')
        restaurantAny.chatbotEnabled = false
      }
    } else {
      console.log('✅ Using direct database field for chatbotEnabled:', restaurantAny.chatbotEnabled)
    }
  }

  // Debug: log dei valori per verificare
  console.log('🔍 Restaurant debug:', {
    id: restaurant?.id,
    name: restaurant?.name,
    ordersEnabled: (restaurant as any)?.ordersEnabled,
    chatbotEnabled: (restaurant as any)?.chatbotEnabled,
    socialLinks: (restaurant as any)?.socialLinks,
    hasSocialLinks: !!(restaurant as any)?.socialLinks
  })

  // Track QR scan only if accessed via QR code
  if (qrCodeData) {
    // The tracking will be handled by the client-side component
    // to get accurate IP and user agent information
  }

  // Calculate average rating
  const averageRating = restaurant.reviews && restaurant.reviews.length > 0 
    ? restaurant.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / restaurant.reviews.length 
    : 0

  // If menuId is provided, show the specific menu
  if (menuId) {
    const specificMenu = restaurant.menus?.find(menu => menu.id === menuId)
    if (specificMenu) {
      // Load the menu with categories and dishes
      const menuWithData = await prisma.menu.findUnique({
        where: { id: menuId },
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
          }
        }
      })
      
      if (menuWithData) {
        // Converti i valori Decimal in stringhe per evitare errori di serializzazione
        const serializedMenu = JSON.parse(JSON.stringify(menuWithData, (key, value) => {
          if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
            return value.toString()
          }
          return value
        }))
        
        return (
          <div className="min-h-screen bg-gray-50">
            <MenuDisplay 
              restaurant={restaurant}
              menu={serializedMenu}
              qrCodeId={qrCodeData?.id}
            />
          </div>
        )
      }
    }
  }

  // Serializza i dati per evitare errori con oggetti Decimal
  const serializedRestaurant = JSON.parse(JSON.stringify(restaurant, (key, value) => {
    if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
      return value.toString()
    }
    return value
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <RestaurantLanding
        restaurant={serializedRestaurant}
        menus={serializedRestaurant.menus || []}
        articles={serializedRestaurant.articles || []}
        reviews={serializedRestaurant.reviews || []}
        averageRating={averageRating}
        totalReviews={serializedRestaurant.reviews?.length || 0}
        qrCodeId={qrCodeData?.id}
      />
    </div>
  )
}

export async function generateMetadata({ params }: MenuPageProps) {
  const { qrCode } = await params
  
  // Try to find by QR code first, then by slug
  let restaurant = null
  
  const qrCodeData = await prisma.qRCode.findUnique({
    where: { code: qrCode },
    include: {
      restaurant: true
    }
  })

  if (qrCodeData?.restaurant) {
    restaurant = qrCodeData.restaurant
  } else {
    // Try to find by slug
    const restaurantBySlug = await prisma.restaurant.findUnique({
      where: { slug: qrCode }
    })
    if (restaurantBySlug) {
      restaurant = restaurantBySlug
    }
  }

  if (!restaurant) {
    return {
      title: 'Ristorante non trovato',
      description: 'Il ristorante richiesto non è stato trovato.'
    }
  }

  return {
    title: `${restaurant.name} - Menu Digitale`,
    description: restaurant.description || `Scopri il menu di ${restaurant.name}`,
  }
}
