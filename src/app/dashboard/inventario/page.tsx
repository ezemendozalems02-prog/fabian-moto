'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Boxes, Search, SlidersHorizontal, AlertTriangle, XCircle, CheckCircle,
  Edit, X, Loader2, ArrowUp, ArrowDown, RotateCcw
} from 'lucide-react'
import { cn, formatCurrency, getStockStatus, stockStatusLabel, stockStatusColor, formatDateTime } from '@/lib/utils'
import type { Product } from '@/types'

type AdjustType = 'aumento' | 'descuento' | 'correccion'

export default function InventarioPage() {
  const [products, setProducts] = useState<(Product & { category_name?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'low' | 'out'>('all')
  const [adjusting, setAdjusting] = useState<Product | null>(null)
  const [adjustForm, setAdjustForm] = useState({ type: 'aumento' as AdjustType, quantity: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const fetchProducts = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(name)')
      .eq('is_active', true)
      .order('name')
    if (data) {
      setProducts(data.map(p => ({
        ...p,
        category_name: (p.category as unknown as { name: string })?.name,
      })))
    }
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  const filtered = useMemo(() => {
    return products.filter(p => {
      const q = search.toLowerCase()
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      const status = getStockStatus(p.stock, p.min_stock)
      const matchStatus = statusFilter === 'all' || status === statusFilter
      return matchSearch && matchStatus
    })
  }, [products, search, statusFilter])

  const stats = useMemo(() => ({
    total: products.length,
    ok: products.filter(p => getStockStatus(p.stock, p.min_stock) === 'ok').length,
    low: products.filter(p => getStockStatus(p.stock, p.min_stock) === 'low').length,
    out: products.filter(p => getStockStatus(p.stock, p.min_stock) === 'out').length,
    totalValue: products.reduce((acc, p) => acc + (p.stock * p.cost_price), 0),
    totalSaleValue: products.reduce((acc, p) => acc + (p.stock * p.sale_price), 0),
  }), [products])

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjusting || !adjustForm.quantity) return
    const qty = Number(adjustForm.quantity)
    if (qty <= 0) { toast.error('La cantidad debe ser mayor a 0'); return }

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const stockBefore = adjusting.stock
    let stockAfter: number
    let movType: string
    let movQty: number

    if (adjustForm.type === 'aumento') {
      stockAfter = stockBefore + qty
      movType = 'ingreso'
      movQty = qty
    } else if (adjustForm.type === 'descuento') {
      if (qty > stockBefore) { toast.error('No hay suficiente stock'); setSaving(false); return }
      stockAfter = stockBefore - qty
      movType = 'egreso'
      movQty = -qty
    } else {
      stockAfter = qty
      movType = 'correccion'
      movQty = qty - stockBefore
    }

    const { error } = await supabase.from('products').update({ stock: stockAfter }).eq('id', adjusting.id)
    if (error) { toast.error('Error al ajustar el stock'); setSaving(false); return }

    await supabase.from('stock_movements').insert({
      product_id: adjusting.id,
      type: movType,
      quantity: movQty,
      stock_before: stockBefore,
      stock_after: stockAfter,
      notes: adjustForm.notes || `Ajuste manual de stock`,
      user_id: user?.id,
    })

    setProducts(prev => prev.map(p => p.id === adjusting.id ? { ...p, stock: stockAfter } : p))
    toast.success(`Stock actualizado: ${stockBefore} → ${stockAfter}`)
    setAdjusting(null)
    setAdjustForm({ type: 'aumento', quantity: '', notes: '' })
    setSaving(false)
  }

  return (
    <div className="space-y-5 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Inventario</h1>
          <p className="page-subtitle">Control de stock en tiempo real</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="w-8 h-8 bg-blue-400/10 rounded-lg flex items-center justify-center mb-2">
            <Boxes className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-white font-bold text-xl">{stats.total}</p>
          <p className="text-neutral-500 text-xs">Productos activos</p>
        </div>
        <div className="card cursor-pointer hover:border-[#333] transition-all" onClick={() => setStatusFilter(statusFilter === 'low' ? 'all' : 'low')}>
          <div className="w-8 h-8 bg-yellow-400/10 rounded-lg flex items-center justify-center mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-white font-bold text-xl">{stats.low}</p>
          <p className="text-neutral-500 text-xs">Stock bajo</p>
        </div>
        <div className="card cursor-pointer hover:border-[#333] transition-all" onClick={() => setStatusFilter(statusFilter === 'out' ? 'all' : 'out')}>
          <div className="w-8 h-8 bg-red-400/10 rounded-lg flex items-center justify-center mb-2">
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-white font-bold text-xl">{stats.out}</p>
          <p className="text-neutral-500 text-xs">Sin stock</p>
        </div>
        <div className="card">
          <div className="w-8 h-8 bg-emerald-400/10 rounded-lg flex items-center justify-center mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-white font-bold text-lg">{formatCurrency(stats.totalValue)}</p>
          <p className="text-neutral-500 text-xs">Valor al costo</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'Todos' },
            { value: 'ok', label: 'En stock' },
            { value: 'low', label: 'Bajo' },
            { value: 'out', label: 'Agotado' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value as typeof statusFilter)}
              className={cn('px-3 py-2 rounded-lg text-sm font-medium transition-colors', statusFilter === f.value ? 'bg-red-600 text-white' : 'bg-[#1e1e1e] text-neutral-400 hover:text-white border border-[#333]')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-red-500" />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Mínimo</th>
                  <th>Estado</th>
                  <th>Valor en stock</th>
                  <th className="text-right">Ajustar</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const status = getStockStatus(p.stock, p.min_stock)
                  return (
                    <tr key={p.id}>
                      <td>
                        <div>
                          <p className="text-white font-medium text-sm">{p.name}</p>
                          <p className="text-neutral-600 text-xs font-mono">{p.sku}</p>
                        </div>
                      </td>
                      <td><span className="text-neutral-500 text-xs">{p.category_name || '-'}</span></td>
                      <td>
                        <span className={cn('text-lg font-bold', status === 'out' ? 'text-red-400' : status === 'low' ? 'text-yellow-400' : 'text-white')}>
                          {p.stock}
                        </span>
                        <span className="text-neutral-600 text-xs ml-1">{p.unit}</span>
                      </td>
                      <td><span className="text-neutral-500 text-sm">{p.min_stock}</span></td>
                      <td><span className={cn('badge', stockStatusColor(status))}>{stockStatusLabel(status)}</span></td>
                      <td><span className="text-neutral-300 text-sm">{formatCurrency(p.stock * p.cost_price)}</span></td>
                      <td>
                        <div className="flex justify-end">
                          <button
                            onClick={() => { setAdjusting(p); setAdjustForm({ type: 'aumento', quantity: '', notes: '' }) }}
                            className="p-1.5 text-neutral-500 hover:text-white hover:bg-[#252525] rounded-lg transition-colors"
                            title="Ajustar stock"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-neutral-600">
              <Boxes className="w-8 h-8 mb-2 opacity-30" />
              <p>Sin productos para mostrar</p>
            </div>
          )}
          <div className="px-4 py-3 border-t border-[#1f1f1f]">
            <p className="text-neutral-500 text-xs">{filtered.length} de {products.length} productos</p>
          </div>
        </div>
      )}

      {/* Modal ajuste de stock */}
      {adjusting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="absolute inset-0 bg-black/70" onClick={() => setAdjusting(null)} />
          <div className="relative bg-[#111] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl animate-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f1f]">
              <h2 className="text-white font-semibold">Ajustar stock</h2>
              <button onClick={() => setAdjusting(null)} className="text-neutral-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#1a1a1a] rounded-xl p-3">
                <p className="text-white font-medium text-sm">{adjusting.name}</p>
                <p className="text-neutral-500 text-xs mt-0.5">Stock actual: <span className="text-white font-bold">{adjusting.stock} {adjusting.unit}</span></p>
              </div>
              <form onSubmit={handleAdjust} className="space-y-4">
                <div>
                  <label className="label">Tipo de ajuste</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'aumento', label: 'Aumentar', icon: ArrowUp, color: 'text-green-400' },
                      { value: 'descuento', label: 'Reducir', icon: ArrowDown, color: 'text-red-400' },
                      { value: 'correccion', label: 'Corregir', icon: RotateCcw, color: 'text-blue-400' },
                    ].map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setAdjustForm(f => ({ ...f, type: t.value as AdjustType }))}
                        className={cn('flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-sm font-medium transition-all', adjustForm.type === t.value ? 'border-red-600/40 bg-red-600/10 text-white' : 'border-[#333] text-neutral-500 hover:border-[#444] hover:text-neutral-300')}
                      >
                        <t.icon className={cn('w-4 h-4', t.color)} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">
                    {adjustForm.type === 'correccion' ? 'Stock correcto' : 'Cantidad'}
                    <span className="text-red-500"> *</span>
                  </label>
                  <input
                    type="number"
                    value={adjustForm.quantity}
                    onChange={(e) => setAdjustForm(f => ({ ...f, quantity: e.target.value }))}
                    className="input"
                    min="0"
                    placeholder={adjustForm.type === 'correccion' ? 'Ingresá el stock real' : 'Cantidad a ajustar'}
                    required
                  />
                  {adjustForm.quantity && adjustForm.type !== 'correccion' && (
                    <p className="text-neutral-500 text-xs mt-1">
                      Stock resultante: {adjustForm.type === 'aumento' ? adjusting.stock + Number(adjustForm.quantity) : adjusting.stock - Number(adjustForm.quantity)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="label">Motivo / Observaciones</label>
                  <input
                    type="text"
                    value={adjustForm.notes}
                    onChange={(e) => setAdjustForm(f => ({ ...f, notes: e.target.value }))}
                    className="input"
                    placeholder="Ej: Inventario físico, devolución..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setAdjusting(null)} className="btn-secondary flex-1">Cancelar</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : 'Confirmar ajuste'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
