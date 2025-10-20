import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import IngredientsManager from '@/components/admin/IngredientsManager'

export default async function IngredientsPage() {
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
      <IngredientsManager />
    </div>
  )
}
