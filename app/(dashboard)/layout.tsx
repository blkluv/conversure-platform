/**
 * Dashboard Layout (Server Component)
 * 
 * Main layout for all dashboard pages
 */

import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default async function DashboardLayoutRoot({
  children,
}: {
  children: ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  const user = {
    fullName: session.fullName,
    email: session.email,
    role: session.role,
    avatarUrl: undefined
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header user={user} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-muted/10">
          {children}
        </main>
      </div>
    </div>
  )
}

