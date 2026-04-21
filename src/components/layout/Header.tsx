'use client'

import { useState } from 'react'
import { Menu, Search, Bell, User } from 'lucide-react'
import Link from 'next/link'

interface HeaderProps {
  onMenuClick: () => void
  title?: string
  alertCount?: number
  userName?: string
}

export function Header({ onMenuClick, title, alertCount = 0, userName }: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <header className="h-14 bg-[#0f0f0f] border-b border-[#1f1f1f] flex items-center justify-between px-4 gap-4 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-neutral-500 hover:text-white transition-colors p-1"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h1 className="text-white font-semibold text-base hidden sm:block">{title}</h1>
        )}
      </div>

      {/* Search */}
      <div
        className={`hidden md:flex items-center gap-2 bg-[#1a1a1a] border rounded-lg px-3 py-2 flex-1 max-w-sm transition-all duration-200 ${searchFocused ? 'border-red-600/50' : 'border-[#2a2a2a]'}`}
      >
        <Search className="w-4 h-4 text-neutral-500 flex-shrink-0" />
        <input
          type="text"
          placeholder="Buscar productos, ventas..."
          className="bg-transparent text-sm text-neutral-300 placeholder-neutral-600 outline-none w-full"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <kbd className="hidden sm:inline-flex text-[10px] text-neutral-600 bg-[#252525] rounded px-1.5 py-0.5 font-mono">
          ⌘K
        </kbd>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Alertas */}
        <Link
          href="/dashboard/alertas"
          className="relative p-2 text-neutral-500 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-all"
        >
          <Bell className="w-5 h-5" />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </Link>

        {/* Usuario */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#2a2a2a] ml-1">
          <div className="w-8 h-8 bg-red-600/15 border border-red-600/20 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-red-400" />
          </div>
          <div className="hidden sm:block">
            <p className="text-white text-xs font-medium leading-tight">
              {userName || 'Admin'}
            </p>
            <p className="text-neutral-600 text-[10px]">Administrador</p>
          </div>
        </div>
      </div>
    </header>
  )
}
