import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'
import DashboardStats from '@/components/admin/DashboardStats'
import RecentActivity from '@/components/admin/RecentActivity'
import QuickActions from '@/components/admin/QuickActions'

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/admin-login')
  }

  // Get user's restaurants
  const restaurants = await prisma.restaurant.findMany({
    where: {
      ownerId: session.user.id
    },
    include: {
      _count: {
        select: {
          menus: true,
          qrCodes: true,
          orders: true
        }
      }
    }
  })

  // Get recent orders
  const recentOrders = await prisma.order.findMany({
    where: {
      restaurant: {
        ownerId: session.user.id
      }
    },
    include: {
      restaurant: true,
      items: {
        include: {
          dish: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  })

  // Get analytics data
  const totalScans = await prisma.qRScan.count({
    where: {
      qrCode: {
        restaurant: {
          ownerId: session.user.id
        }
      }
    }
  })

  const totalOrders = await prisma.order.count({
    where: {
      restaurant: {
        ownerId: session.user.id
      }
    }
  })

  const totalRevenue = await prisma.order.aggregate({
    where: {
      restaurant: {
        ownerId: session.user.id
      },
      status: {
        in: ['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED']
      }
    },
    _sum: {
      totalAmount: true
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {session.user.name || session.user.email}!
          </p>
        </div>

        {/* Stats Cards */}
        <DashboardStats
          totalRestaurants={restaurants.length}
          totalScans={totalScans}
          totalOrders={totalOrders}
          totalRevenue={totalRevenue._sum.totalAmount || 0}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <QuickActions restaurants={restaurants} />
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <RecentActivity orders={recentOrders} />
          </div>
        </div>
      </div>
    </div>
  )
}
