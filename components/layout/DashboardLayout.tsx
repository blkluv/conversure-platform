/**
 * Main Dashboard Layout
 * 
 * Combines Sidebar + Header + Content area for dashboard pages
 */

import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

interface DashboardLayoutProps {
    children: ReactNode
}

export async function DashboardLayout({ children }: DashboardLayoutProps) {
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
