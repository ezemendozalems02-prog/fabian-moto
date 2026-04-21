'use client'

import Link from 'next/link'
import {
  Package,
  Boxes,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  TrendingUp,
  Plus,
  Truck,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency, formatDateTime, movementTypeLabel, movementTypeColor } from '@/lib/utils'
import type { DashboardStats, StockMovement, Product } from '@/types'
import { cn } from '@/lib/utils'

interface DashboardClientProps {
  stats: DashboardStats
  recentMovements: StockMovement[]
  recentProducts: Product[]
  chartData: { date: string; total: number; count: number }[]
}

export function DashboardClient({ stats, recentMovements, recentProducts, chartData }: DashboardClientProps) {
  return (
    <div className="space-y-6 animate-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Resumen general del negocio</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/productos/nuevo" className="btn-primary">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo producto</span>
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Productos activos"
          value={stats.total_products.toLocaleString()}
          icon={Package}
          iconColor="text-blue-400"
          iconBg="bg-blue-400/10"
          href="/dashboard/productos"
        />
        <StatCard
          title="Unidades en stock"
          value={stats.total_stock_units.toLocaleString()}
          icon={Boxes}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-400/10"
          href="/dashboard/inventario"
        />
        <StatCard
          title="Stock bajo"
          value={stats.low_stock_products.toLocaleString()}
          icon={AlertTriangle}
          iconColor="text-yellow-400"
          iconBg="bg-yellow-400/10"
          href="/dashboard/alertas"
          urgent={stats.low_stock_products > 0}
        />
        <StatCard
          title="Sin stock"
          value={stats.out_of_stock_products.toLocaleString()}
          icon={XCircle}
          iconColor="text-red-400"
          iconBg="bg-red-400/10"
          href="/dashboard/alertas"
          urgent={stats.out_of_stock_products > 0}
        />
      </div>

      {/* Ventas del día / mes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card stat-card-glow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600/15 border border-red-600/20 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-neutral-500 text-xs">Ventas de hoy</p>
                <p className="text-white font-bold text-xl">{formatCurrency(stats.today_revenue)}</p>
              </div>
            </div>
            <Link href="/dashboard/ventas" className="text-neutral-600 hover:text-red-400 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-neutral-600 text-xs">
            <span className="text-neutral-400 font-medium">{stats.today_sales}</span> ventas realizadas
          </p>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600/15 border border-emerald-600/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-neutral-500 text-xs">Ventas del mes</p>
                <p className="text-white font-bold text-xl">{formatCurrency(stats.month_revenue)}</p>
              </div>
            </div>
            <Link href="/dashboard/reportes" className="text-neutral-600 hover:text-emerald-400 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-neutral-600 text-xs">
            <span className="text-neutral-400 font-medium">{stats.month_sales}</span> ventas este mes
          </p>
        </div>
      </div>

      {/* Gráfico de ventas */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-semibold">Ventas últimos 7 días</h3>
            <p className="text-neutral-500 text-xs mt-0.5">Ingresos por día</p>
          </div>
          <Link href="/dashboard/reportes" className="btn-ghost text-xs py-1.5 px-3">
            Ver reportes
          </Link>
        </div>
        <div className="h-48">
          {chartData.some(d => d.total > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#525252', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#525252', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={45}
                />
                <Tooltip
                  contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 8, color: '#f5f5f5' }}
                  formatter={(val: number) => [formatCurrency(val), 'Ventas']}
                  labelStyle={{ color: '#a3a3a3' }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#dc2626"
                  strokeWidth={2}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={TrendingUp} message="Aún no hay ventas registradas" />
          )}
        </div>
      </div>

      {/* 2 columnas: Movimientos + Accesos rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Movimientos recientes */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Últimos movimientos</h3>
            <Link href="/dashboard/movimientos" className="btn-ghost text-xs py-1.5 px-3">
              Ver todos
            </Link>
          </div>
          {recentMovements.length > 0 ? (
            <div className="space-y-2">
              {recentMovements.map((mv) => (
                <div key={mv.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#1a1a1a] transition-colors">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', movementTypeColor(mv.type))}>
                    {mv.type === 'ingreso' || mv.type === 'compra' ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {(mv.product as unknown as { name: string })?.name || 'Producto'}
                    </p>
                    <p className="text-neutral-500 text-xs">
                      {movementTypeLabel(mv.type)} · {formatDateTime(mv.created_at)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn('font-semibold text-sm', mv.quantity > 0 ? 'text-green-400' : 'text-red-400')}>
                      {mv.quantity > 0 ? '+' : ''}{mv.quantity}
                    </p>
                    <p className="text-neutral-600 text-xs">Stock: {mv.stock_after}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Clock} message="Sin movimientos recientes" />
          )}
        </div>

        {/* Accesos rápidos */}
        <div className="space-y-3">
          <div className="card">
            <h3 className="text-white font-semibold mb-3">Acciones rápidas</h3>
            <div className="space-y-2">
              <QuickAction href="/dashboard/productos/nuevo" icon={Package} label="Agregar producto" color="text-blue-400" />
              <QuickAction href="/dashboard/compras/nueva" icon={Truck} label="Registrar ingreso" color="text-emerald-400" />
              <QuickAction href="/dashboard/ventas/nueva" icon={ShoppingCart} label="Nueva venta" color="text-red-400" />
              <QuickAction href="/dashboard/alertas" icon={Bell} label="Ver alertas" color="text-yellow-400" />
            </div>
          </div>

          {/* Últimos productos */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Productos recientes</h3>
              <Link href="/dashboard/productos" className="text-neutral-500 hover:text-red-400 transition-colors">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {recentProducts.length > 0 ? (
              <div className="space-y-2">
                {recentProducts.slice(0, 4).map((product) => (
                  <Link
                    key={product.id}
                    href={`/dashboard/productos/${product.id}`}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors group"
                  >
                    <div className="w-7 h-7 bg-[#252525] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-3.5 h-3.5 text-neutral-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-neutral-300 text-xs font-medium truncate group-hover:text-white transition-colors">
                        {product.name}
                      </p>
                      <p className="text-neutral-600 text-[10px]">{product.sku}</p>
                    </div>
                    <span className={cn('text-xs font-semibold', product.stock === 0 ? 'text-red-400' : product.stock <= product.min_stock ? 'text-yellow-400' : 'text-green-400')}>
                      {product.stock}u
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-neutral-600 text-xs text-center py-3">Sin productos cargados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title, value, icon: Icon, iconColor, iconBg, href, urgent
}: {
  title: string
  value: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  href: string
  urgent?: boolean
}) {
  return (
    <Link href={href} className={cn('card hover:border-[#333] transition-all duration-200 group', urgent && 'border-red-900/30')}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-4.5 h-4.5', iconColor)} size={18} />
        </div>
        {urgent && (
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-neutral-500 text-xs mt-1">{title}</p>
    </Link>
  )
}

function QuickAction({ href, icon: Icon, label, color }: { href: string; icon: React.ElementType; label: string; color: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#1a1a1a] transition-colors group"
    >
      <div className="w-7 h-7 bg-[#252525] rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className={cn('w-3.5 h-3.5', color)} size={14} />
      </div>
      <span className="text-neutral-400 text-sm group-hover:text-white transition-colors">{label}</span>
      <ArrowUpRight className="w-3 h-3 text-neutral-700 ml-auto group-hover:text-neutral-400 transition-colors" />
    </Link>
  )
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-neutral-600">
      <Icon className="w-8 h-8 mb-2 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
