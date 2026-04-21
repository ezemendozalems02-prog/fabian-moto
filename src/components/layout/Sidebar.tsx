'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  Tag,
  Boxes,
  ArrowLeftRight,
  ShoppingCart,
  Truck,
  Users,
  Building2,
  Bell,
  BarChart3,
  Settings,
  Zap,
  LogOut,
  ChevronRight,
  X,
} from 'lucide-react'

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Productos',
    href: '/dashboard/productos',
    icon: Package,
  },
  {
    label: 'Categorías',
    href: '/dashboard/categorias',
    icon: Tag,
  },
  {
    label: 'Inventario',
    href: '/dashboard/inventario',
    icon: Boxes,
  },
  {
    label: 'Movimientos',
    href: '/dashboard/movimientos',
    icon: ArrowLeftRight,
  },
  {
    label: 'Ventas',
    href: '/dashboard/ventas',
    icon: ShoppingCart,
  },
  {
    label: 'Compras',
    href: '/dashboard/compras',
    icon: Truck,
  },
  {
    label: 'Clientes',
    href: '/dashboard/clientes',
    icon: Users,
  },
  {
    label: 'Proveedores',
    href: '/dashboard/proveedores',
    icon: Building2,
  },
  {
    label: 'Alertas',
    href: '/dashboard/alertas',
    icon: Bell,
    badge: true,
  },
  {
    label: 'Reportes',
    href: '/dashboard/reportes',
    icon: BarChart3,
  },
  {
    label: 'Configuración',
    href: '/dashboard/configuracion',
    icon: Settings,
  },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  alertCount?: number
}

export function Sidebar({ isOpen = true, onClose, alertCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Sesión cerrada correctamente')
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden modal-backdrop"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-[#0f0f0f] border-r border-[#1f1f1f] flex flex-col z-50 transition-transform duration-300',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#1f1f1f]">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-red-600/15 border border-red-600/30 rounded-xl flex items-center justify-center group-hover:bg-red-600/25 transition-colors">
              <Zap className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Moto Repuestos</p>
              <p className="text-red-500 font-semibold text-sm leading-tight">Fabián</p>
            </div>
          </Link>
          {onClose && (
            <button onClick={onClose} className="lg:hidden text-neutral-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
                    active
                      ? 'sidebar-active text-white border border-red-600/20'
                      : 'text-neutral-500 hover:text-neutral-200 hover:bg-[#1a1a1a]'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4.5 h-4.5 flex-shrink-0 transition-colors',
                      active ? 'text-red-500' : 'text-neutral-600 group-hover:text-neutral-400'
                    )}
                    size={18}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && alertCount > 0 && (
                    <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {alertCount > 99 ? '99+' : alertCount}
                    </span>
                  )}
                  {active && (
                    <ChevronRight className="w-3.5 h-3.5 text-red-500/60" />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[#1f1f1f]">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-500 hover:text-red-400 hover:bg-red-900/10 transition-all duration-150 group disabled:opacity-50"
          >
            <LogOut className="w-4.5 h-4.5 group-hover:text-red-400 transition-colors" size={18} />
            <span>{loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
          </button>
          <div className="mt-2 px-3 py-1">
            <p className="text-neutral-700 text-[10px]">v1.0.0 · Sistema de Gestión</p>
          </div>
        </div>
      </aside>
    </>
  )
}
