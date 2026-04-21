import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import type { DashboardStats, StockMovement, Product } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Stats generales
  const [
    { count: totalProducts },
    { data: stockData },
    { count: lowStockCount },
    { count: outOfStockCount },
    { data: todaySales },
    { data: monthSales },
    { data: recentMovements },
    { data: recentProducts },
    { data: topProducts },
    { data: salesChart },
  ] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('products').select('stock').eq('is_active', true),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true).gt('stock', 0).lte('stock', 5),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('stock', 0),
    supabase.from('sales').select('total').gte('created_at', new Date().toISOString().split('T')[0]).neq('status', 'cancelada'),
    supabase.from('sales').select('total').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()).neq('status', 'cancelada'),
    supabase.from('stock_movements').select('*, product:products(name, sku)').order('created_at', { ascending: false }).limit(8),
    supabase.from('products').select('*, category:categories(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('sale_items').select('product_id, quantity, product:products(name, sku)').order('quantity', { ascending: false }).limit(5),
    supabase.from('sales').select('created_at, total').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).neq('status', 'cancelada').order('created_at', { ascending: true }),
  ])

  const totalStockUnits = stockData?.reduce((acc, p) => acc + (p.stock || 0), 0) || 0
  const todayRevenue = todaySales?.reduce((acc, s) => acc + (s.total || 0), 0) || 0
  const monthRevenue = monthSales?.reduce((acc, s) => acc + (s.total || 0), 0) || 0

  const stats: DashboardStats = {
    total_products: totalProducts || 0,
    total_stock_units: totalStockUnits,
    low_stock_products: lowStockCount || 0,
    out_of_stock_products: outOfStockCount || 0,
    today_sales: todaySales?.length || 0,
    today_revenue: todayRevenue,
    month_sales: monthSales?.length || 0,
    month_revenue: monthRevenue,
  }

  // Procesar datos del gráfico (ventas por día, últimos 7 días)
  const chartData = buildChartData(salesChart || [])

  return (
    <DashboardClient
      stats={stats}
      recentMovements={(recentMovements || []) as StockMovement[]}
      recentProducts={(recentProducts || []) as Product[]}
      chartData={chartData}
    />
  )
}

function buildChartData(sales: { created_at: string; total: number }[]) {
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      date: d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }),
      dateKey: d.toISOString().split('T')[0],
      total: 0,
      count: 0,
    }
  })

  sales.forEach((sale) => {
    const dateKey = sale.created_at.split('T')[0]
    const day = last7.find((d) => d.dateKey === dateKey)
    if (day) {
      day.total += sale.total
      day.count += 1
    }
  })

  return last7.map(({ date, total, count }) => ({ date, total, count }))
}
