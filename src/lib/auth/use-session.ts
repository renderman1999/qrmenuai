'use client'

import { useSession as useNextAuthSession } from 'next-auth/react'
import { auth } from './auth'

export function useSession() {
  // Per NextAuth v5, usiamo il hook standard
  return useNextAuthSession()
}
