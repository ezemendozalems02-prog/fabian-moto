'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart3, TrendingUp, Package, ShoppingCart,
  Calendar, Loader2, DollarSign
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { formatCurrency, formatDate } from '@/lib/utils'

type DateRange = '7' | '30' | '90' | 'custom'

const PIE_COLORS = ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a']

export default function ReportesPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30')
  const [salesChart, setSalesChart] = useState<{ date: string; total: number; count: number }[]>([])
  const [topProducts, setTopProducts] = useState<{ name: string; quantity: number; revenue: number }[]>([])
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([])
  const [summary, setSummary] = useState({ totalRevenue: 0, totalSales: 0, avgTicket: 0, totalCost: 0 })
  const [loading, setLoading] = useState(true)

  const fetchReports = async () => {
    setLoading(true)
    const supabase = createClient()
    const days = Number(dateRange)
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const [
      { data: sales },
      { data: saleItems },
    ] = await Promise.all([
      supabase.from('sales').select('created_at, total, subtotal').gte('created_at', from).neq('status', 'cancelada').order('created_at'),
      supabase.from('sale_items').select('quantity, unit_price, product:products(name, cost_price, category:categories(name))').gte('created_at', from),
    ])

    // Gráfico ventas por día
    const byDay: Record<string, { total: number; count: number }> = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      byDay[key] = { total: 0, count: 0 }
    }
    sales?.forEach(s => {
      const key = s.created_at.split('T')[0]
      if (byDay[key]) {
        byDay[key].total += s.total
        byDay[key].count += 1
      }
    })
    const chartData = Object.entries(byDay).map(([date, data]) => ({
      date: formatDate(date, 'dd/MM'),
      ...data,
    }))
    setSalesChart(chartData)

    // Summary
    const totalRevenue = sales?.reduce((acc, s) => acc + s.total, 0) || 0
    const totalSales = sales?.length || 0
    setSummary({
      totalRevenue,
      totalSales,
      avgTicket: totalSales > 0 ? totalRevenue / totalSales : 0,
      totalCost: 0,
    })

    // Top productos
    const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {}
    saleItems?.forEach((item) => {
      const prod = item.product as unknown as { name: string }
      if (!prod) return
      if (!productMap[prod.name]) productMap[prod.name] = { name: prod.name, quantity: 0, revenue: 0 }
      productMap[prod.name].quantity += item.quantity
      productMap[prod.name].revenue += item.quantity * item.unit_price
    })
    setTopProducts(Object.values(productMap).sort((a, b) => b.quantity - a.quantity).slice(0, 10))

    // Categorías
    const catMap: Record<string, number> = {}
    saleItems?.forEach((item) => {
      const catName = (item.product as unknown as { category: { name: string } })?.category?.name || 'Sin categoría'
      catMap[catName] = (catMap[catName] || 0) + item.quantity
    })
    setCategoryData(Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value))

    setLoading(false)
  }

  useEffect(() => { fetchReports() }, [dateRange])

  return (
    <div className="space-y-5 animate-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Reportes y Analíticas</h1>
          <p className="page-subtitle">Análisis del rendimiento del negocio</p>
        </div>
        <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-1">
          {([
            { value: '7', label: '7 días' },
            { value: '30', label: '30 días' },
            { value: '90', label: '90 días' },
          ] as { value: DateRange; label: string }[]).map(opt => (
            <button
              key={opt.value}
              onClick={() => setDateRange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${dateRange === opt.value ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="w-8 h-8 bg-red-400/10 rounded-lg flex items-center justify-center mb-2"><DollarSign className="w-4 h-4 text-red-400" /></div>
          <p className="text-white font-bold text-xl">{formatCurrency(summary.totalRevenue)}</p>
          <p className="text-neutral-500 text-xs">Ingresos totales</p>
        </div>
        <div className="card">
          <div className="w-8 h-8 bg-blue-400/10 rounded-lg flex items-center justify-center mb-2"><ShoppingCart className="w-4 h-4 text-blue-400" /></div>
          <p className="text-white font-bold text-xl">{summary.totalSales}</p>
          <p className="text-neutral-500 text-xs">Ventas realizadas</p>
        </div>
        <div className="card">
          <div className="w-8 h-8 bg-emerald-400/10 rounded-lg flex items-center justify-center mb-2"><TrendingUp className="w-4 h-4 text-emerald-400" /></div>
          <p className="text-white font-bold text-xl">{formatCurrency(summary.avgTicket)}</p>
          <p className="text-neutral-500 text-xs">Ticket promedio</p>
        </div>
        <div className="card">
          <div className="w-8 h-8 bg-yellow-400/10 rounded-lg flex items-center justify-center mb-2"><Package className="w-4 h-4 text-yellow-400" /></div>
          <p className="text-white font-bold text-xl">{topProducts.reduce((acc, p) => acc + p.quantity, 0)}</p>
          <p className="text-neutral-500 text-xs">Unidades vendidas</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-red-500" /></div>
      ) : (
        <>
          {/* Gráfico de ventas */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Ventas por período</h3>
              <div className="flex items-center gap-2 text-neutral-500 text-xs">
                <Calendar className="w-3.5 h-3.5" />
                Últimos {dateRange} días
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#525252', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#525252', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={40} />
                  <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 8, color: '#f5f5f5', fontSize: 12 }} formatter={(v: number) => [formatCurrency(v), 'Ventas']} />
                  <Area type="monotone" dataKey="total" stroke="#dc2626" strokeWidth={2} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top productos */}
            <div className="card">
              <h3 className="text-white font-semibold mb-4">Productos más vendidos</h3>
              {topProducts.length > 0 ? (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 10 }}>
                      <XAxis type="number" tick={{ fill: '#525252', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#a3a3a3', fontSize: 10 }} width={100} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 8, color: '#f5f5f5', fontSize: 12 }} />
                      <Bar dataKey="quantity" fill="#dc2626" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-neutral-600">
                  <Package className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">Sin datos de ventas</p>
                </div>
              )}
            </div>

            {/* Por categoría */}
            <div className="card">
              <h3 className="text-white font-semibold mb-4">Ventas por categoría</h3>
              {categoryData.length > 0 ? (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10} fill="#dc2626">
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 8, color: '#f5f5f5', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-neutral-600">
                  <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">Sin datos de categorías</p>
                </div>
              )}
            </div>
          </div>

          {/* Tabla top productos */}
          {topProducts.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-[#1f1f1f]">
                <h3 className="text-white font-semibold">Detalle de productos vendidos</h3>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Producto</th>
                      <th>Unidades vendidas</th>
                      <th>Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, i) => (
                      <tr key={p.name}>
                        <td><span className="text-neutral-500 font-mono text-xs">{i + 1}</span></td>
                        <td><span className="text-white font-medium text-sm">{p.name}</span></td>
                        <td><span className="text-neutral-300 font-semibold">{p.quantity}</span></td>
                        <td><span className="text-emerald-400 font-bold">{formatCurrency(p.revenue)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
