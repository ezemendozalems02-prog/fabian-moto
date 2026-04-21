'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface DashboardLayoutClientProps {
  children: React.ReactNode
  userName: string
  alertCount: number
}

export function DashboardLayoutClient({ children, userName, alertCount }: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        alertCount={alertCount}
      />

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          alertCount={alertCount}
          userName={userName}
        />
        <main className="flex-1 p-5 md:p-6 animate-in">
          {children}
        </main>
      </div>
    </div>
  )
}
