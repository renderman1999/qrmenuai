import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import AllergensManager from '@/components/admin/AllergensManager'

export default async function AllergensPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/admin-login')
  }

  // Verifica che l'utente sia admin
  if (session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <AllergensManager />
    </div>
  )
}
