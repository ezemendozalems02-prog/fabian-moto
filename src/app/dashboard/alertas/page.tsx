'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Bell, AlertTriangle, XCircle, Package, Truck, RefreshCw, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { cn, formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'

export default function AlertasPage() {
  const [outOfStock, setOutOfStock] = useState<Product[]>([])
  const [lowStock, setLowStock] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = async () => {
    setLoading(true)
    const supabase = createClient()
    const [{ data: out }, { data: lowData }] = await Promise.all([
      supabase.from('products').select('*, category:categories(name)').eq('is_active', true).eq('stock', 0).order('name'),
      supabase.from('products').select('*, category:categories(name)').eq('is_active', true).gt('stock', 0).order('stock'),
    ])

    setOutOfStock(out || [])
    setLowStock((lowData || []).filter(p => p.stock <= p.min_stock))
    setLoading(false)
  }

  useEffect(() => { fetchAlerts() }, [])

  const handleQuickRestock = async (product: Product, qty: number) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const newStock = product.stock + qty

    await supabase.from('products').update({ stock: newStock }).eq('id', product.id)
    await supabase.from('stock_movements').insert({
      product_id: product.id,
      type: 'ingreso',
      quantity: qty,
      stock_before: product.stock,
      stock_after: newStock,
      notes: 'Reposición rápida desde alertas',
      user_id: user?.id,
    })
    toast.success(`+${qty} unidades repuestas en "${product.name}"`)
    fetchAlerts()
  }

  const totalAlerts = outOfStock.length + lowStock.length

  return (
    <div className="space-y-5 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Alertas de stock</h1>
          <p className="page-subtitle">{totalAlerts} alertas activas</p>
        </div>
        <button onClick={fetchAlerts} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card border-red-900/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-neutral-500 text-xs">Sin stock</p>
              <p className="text-red-400 font-bold text-2xl">{outOfStock.length}</p>
            </div>
          </div>
          <p className="text-neutral-600 text-xs">Productos que necesitan reposición urgente</p>
        </div>
        <div className="card border-yellow-900/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-neutral-500 text-xs">Stock bajo</p>
              <p className="text-yellow-400 font-bold text-2xl">{lowStock.length}</p>
            </div>
          </div>
          <p className="text-neutral-600 text-xs">Por debajo del mínimo configurado</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-red-500" /></div>
      ) : (
        <>
          {/* Sin stock */}
          {outOfStock.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[#1f1f1f] bg-red-900/10">
                <XCircle className="w-4 h-4 text-red-400" />
                <h3 className="text-red-400 font-semibold text-sm">Productos sin stock ({outOfStock.length})</h3>
              </div>
              <div className="divide-y divide-[#1f1f1f]">
                {outOfStock.map(p => (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[#1a1a1a] transition-colors">
                    <div className="w-9 h-9 bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{p.name}</p>
                      <p className="text-neutral-600 text-xs">{p.sku} · Mín: {p.min_stock} · Precio: {formatCurrency(p.sale_price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuickRestock(p, 10)}
                        className="btn-ghost text-xs py-1.5 px-2.5 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        +10
                      </button>
                      <button
                        onClick={() => handleQuickRestock(p, p.min_stock)}
                        className="btn-secondary text-xs py-1.5"
                      >
                        Reponer mínimo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock bajo */}
          {lowStock.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[#1f1f1f] bg-yellow-900/10">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <h3 className="text-yellow-400 font-semibold text-sm">Stock bajo ({lowStock.length})</h3>
              </div>
              <div className="divide-y divide-[#1f1f1f]">
                {lowStock.map(p => (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[#1a1a1a] transition-colors">
                    <div className="w-9 h-9 bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{p.name}</p>
                      <p className="text-neutral-600 text-xs">{p.sku} · Stock: {p.stock} / Mín: {p.min_stock}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-yellow-900/20 rounded-lg px-2.5 py-1">
                        <span className="text-yellow-400 font-bold text-sm">{p.stock}</span>
                        <span className="text-yellow-700 text-xs"> / {p.min_stock}</span>
                      </div>
                      <button
                        onClick={() => handleQuickRestock(p, p.min_stock - p.stock + 5)}
                        className="btn-secondary text-xs py-1.5"
                      >
                        Reponer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalAlerts === 0 && (
            <div className="card flex flex-col items-center justify-center py-20 text-neutral-600">
              <Bell className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-neutral-500">¡Todo en orden!</p>
              <p className="text-sm mt-1">No hay alertas de stock en este momento</p>
            </div>
          )}

          {/* Links de acción */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/dashboard/compras/nueva" className="card hover:border-[#333] transition-all flex items-center gap-3 group">
              <div className="w-10 h-10 bg-emerald-600/10 border border-emerald-600/20 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-semibold group-hover:text-emerald-400 transition-colors">Registrar ingreso</p>
                <p className="text-neutral-500 text-xs">Cargar nueva mercadería</p>
              </div>
            </Link>
            <Link href="/dashboard/inventario" className="card hover:border-[#333] transition-all flex items-center gap-3 group">
              <div className="w-10 h-10 bg-blue-600/10 border border-blue-600/20 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-semibold group-hover:text-blue-400 transition-colors">Ver inventario</p>
                <p className="text-neutral-500 text-xs">Ajustar stock manualmente</p>
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
