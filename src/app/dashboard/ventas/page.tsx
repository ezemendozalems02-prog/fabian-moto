'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  ShoppingCart, Plus, Search, Eye, X, Loader2, Trash2,
  ChevronDown, Package, User, CreditCard, FileText
} from 'lucide-react'
import { cn, formatCurrency, formatDateTime, saleStatusLabel, saleStatusColor, paymentMethodLabel } from '@/lib/utils'
import type { Sale, Product, Customer } from '@/types'

interface SaleItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
}

export default function VentasPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchSales = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('sales')
      .select('*, customer:customers(name), items:sale_items(id)')
      .order('created_at', { ascending: false })
      .limit(100)
    setSales((data as unknown as Sale[]) || [])
    setLoading(false)
  }

  useEffect(() => { fetchSales() }, [])

  const filtered = useMemo(() => {
    return sales.filter(s => {
      const matchSearch = !search || s.sale_number.toLowerCase().includes(search.toLowerCase()) ||
        (s.customer as unknown as { name: string })?.name?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || s.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [sales, search, statusFilter])

  const stats = useMemo(() => {
    const active = sales.filter(s => s.status !== 'cancelada')
    return {
      total: sales.length,
      revenue: active.reduce((acc, s) => acc + s.total, 0),
      pending: sales.filter(s => s.status === 'pendiente').length,
      confirmed: sales.filter(s => s.status === 'confirmada').length,
    }
  }, [sales])

  const handleStatusChange = async (id: string, status: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('sales').update({ status }).eq('id', id)
    if (error) { toast.error('Error al actualizar el estado'); return }
    setSales(prev => prev.map(s => s.id === id ? { ...s, status: status as Sale['status'] } : s))
    toast.success(`Venta actualizada: ${saleStatusLabel(status)}`)
  }

  return (
    <div className="space-y-5 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Ventas</h1>
          <p className="page-subtitle">{stats.total} ventas registradas</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nueva venta
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><p className="text-neutral-500 text-xs mb-1">Total ventas</p><p className="text-white font-bold text-xl">{stats.total}</p></div>
        <div className="card"><p className="text-neutral-500 text-xs mb-1">Ingresos totales</p><p className="text-white font-bold text-xl">{formatCurrency(stats.revenue)}</p></div>
        <div className="card"><p className="text-neutral-500 text-xs mb-1">Pendientes</p><p className="text-yellow-400 font-bold text-xl">{stats.pending}</p></div>
        <div className="card"><p className="text-neutral-500 text-xs mb-1">Confirmadas</p><p className="text-green-400 font-bold text-xl">{stats.confirmed}</p></div>
      </div>

      {/* Filtros */}
      <div className="card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" placeholder="Buscar por número o cliente..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="all">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="confirmada">Confirmada</option>
          <option value="entregada">Entregada</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-red-500" /></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Método de pago</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(sale => (
                  <tr key={sale.id}>
                    <td>
                      <span className="text-white font-mono font-semibold text-sm">#{sale.sale_number}</span>
                    </td>
                    <td>
                      <span className="text-neutral-400 text-xs whitespace-nowrap">{formatDateTime(sale.created_at)}</span>
                    </td>
                    <td>
                      <span className="text-neutral-300 text-sm">
                        {(sale.customer as unknown as { name: string })?.name || <span className="text-neutral-600">Sin cliente</span>}
                      </span>
                    </td>
                    <td>
                      <span className="text-neutral-400 text-sm">
                        {(sale.items as unknown as unknown[])?.length || 0} ítems
                      </span>
                    </td>
                    <td>
                      <span className="text-white font-bold">{formatCurrency(sale.total)}</span>
                    </td>
                    <td>
                      <span className="text-neutral-400 text-xs">{paymentMethodLabel(sale.payment_method)}</span>
                    </td>
                    <td>
                      <select
                        value={sale.status}
                        onChange={e => handleStatusChange(sale.id, e.target.value)}
                        className={cn('text-xs font-medium rounded-lg px-2 py-1 border-0 outline-none cursor-pointer', saleStatusColor(sale.status))}
                        style={{ background: 'transparent' }}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="entregada">Entregada</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button className="p-1.5 text-neutral-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Ver detalle">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-neutral-600">
              <ShoppingCart className="w-8 h-8 mb-2 opacity-30" />
              <p>Sin ventas registradas</p>
            </div>
          )}
          <div className="px-4 py-3 border-t border-[#1f1f1f]">
            <p className="text-neutral-500 text-xs">{filtered.length} ventas</p>
          </div>
        </div>
      )}

      {/* Modal nueva venta */}
      {showNew && <NuevaVentaModal onClose={() => setShowNew(false)} onSaved={() => { fetchSales(); setShowNew(false) }} />}
    </div>
  )
}

function NuevaVentaModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<SaleItem[]>([])
  const [form, setForm] = useState({
    customer_id: '',
    payment_method: 'efectivo',
    discount: 0,
    notes: '',
  })
  const [productSearch, setProductSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [showProducts, setShowProducts] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('customers').select('*').eq('is_active', true).order('name'),
      supabase.from('products').select('*').eq('is_active', true).gt('stock', 0).order('name'),
    ]).then(([{ data: c }, { data: p }]) => {
      setCustomers((c as unknown as Customer[]) || [])
      setProducts((p as unknown as Product[]) || [])
    })
  }, [])

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 20)
    return products.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 20)
  }, [products, productSearch])

  const addItem = (product: Product) => {
    const existing = items.find(i => i.product_id === product.id)
    if (existing) {
      setItems(prev => prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setItems(prev => [...prev, { product_id: product.id, product_name: product.name, quantity: 1, unit_price: product.sale_price }])
    }
    setShowProducts(false)
    setProductSearch('')
  }

  const removeItem = (pid: string) => setItems(prev => prev.filter(i => i.product_id !== pid))
  const updateQty = (pid: string, qty: number) => setItems(prev => prev.map(i => i.product_id === pid ? { ...i, quantity: Math.max(1, qty) } : i))
  const updatePrice = (pid: string, price: number) => setItems(prev => prev.map(i => i.product_id === pid ? { ...i, unit_price: price } : i))

  const subtotal = items.reduce((acc, i) => acc + i.quantity * i.unit_price, 0)
  const total = Math.max(0, subtotal - form.discount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) { toast.error('Agregá al menos un producto'); return }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Número de venta
    const saleNumber = `${Date.now()}`.slice(-8)

    const { data: sale, error } = await supabase.from('sales').insert({
      sale_number: saleNumber,
      customer_id: form.customer_id || null,
      status: 'pendiente',
      payment_method: form.payment_method,
      subtotal,
      discount: form.discount,
      total,
      notes: form.notes,
      user_id: user?.id,
    }).select().single()

    if (error) { toast.error('Error al crear la venta'); setSaving(false); return }

    const saleItems = items.map(i => ({
      sale_id: sale.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }))

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
    if (itemsError) { toast.error('Error al guardar los productos de la venta'); setSaving(false); return }

    toast.success(`Venta #${saleNumber} creada. Confirmala para descontar el stock.`)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#111] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600/15 border border-red-600/20 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="text-white font-semibold">Nueva venta</h2>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Cliente y pago */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label"><User className="inline w-3 h-3 mr-1" />Cliente (opcional)</label>
                <select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))} className="input">
                  <option value="">Sin cliente</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label"><CreditCard className="inline w-3 h-3 mr-1" />Método de pago</label>
                <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} className="input">
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="debito">Débito</option>
                  <option value="credito">Crédito</option>
                  <option value="mixto">Mixto</option>
                  <option value="mercadopago">Mercado Pago</option>
                </select>
              </div>
            </div>

            {/* Productos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0"><Package className="inline w-3 h-3 mr-1" />Productos</label>
                <button type="button" onClick={() => setShowProducts(!showProducts)} className="btn-ghost text-xs py-1">
                  <Plus className="w-3 h-3" />Agregar
                </button>
              </div>

              {showProducts && (
                <div className="mb-3 bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
                  <div className="p-2 border-b border-[#2a2a2a]">
                    <input
                      type="text"
                      placeholder="Buscar producto..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      className="input text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addItem(p)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#252525] transition-colors text-left"
                      >
                        <div className="flex-1">
                          <p className="text-white text-sm">{p.name}</p>
                          <p className="text-neutral-600 text-xs">{p.sku} · Stock: {p.stock}</p>
                        </div>
                        <span className="text-green-400 font-semibold text-sm">{formatCurrency(p.sale_price)}</span>
                      </button>
                    ))}
                    {filteredProducts.length === 0 && <p className="text-neutral-600 text-sm text-center py-4">Sin resultados</p>}
                  </div>
                </div>
              )}

              {items.length === 0 ? (
                <div className="border border-dashed border-[#333] rounded-xl p-6 text-center text-neutral-600">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Agregá productos a la venta</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.product_id} className="flex items-center gap-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.product_name}</p>
                      </div>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => updateQty(item.product_id, Number(e.target.value))}
                        className="input w-16 text-center text-sm py-1.5"
                        min="1"
                      />
                      <span className="text-neutral-500 text-xs">×</span>
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={e => updatePrice(item.product_id, Number(e.target.value))}
                        className="input w-28 text-sm py-1.5"
                        min="0"
                        step="0.01"
                      />
                      <span className="text-white font-semibold text-sm w-20 text-right">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </span>
                      <button type="button" onClick={() => removeItem(item.product_id)} className="text-neutral-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totales */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Subtotal</span>
                <span className="text-neutral-300">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-4">
                <span className="text-neutral-500">Descuento</span>
                <input
                  type="number"
                  value={form.discount}
                  onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) }))}
                  className="input w-28 py-1 text-sm"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-[#333]">
                <span className="text-white">Total</span>
                <span className="text-red-400 text-lg">{formatCurrency(total)}</span>
              </div>
            </div>

            <div>
              <label className="label"><FileText className="inline w-3 h-3 mr-1" />Observaciones</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="input min-h-[60px] resize-none"
                placeholder="Notas adicionales..."
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[#1f1f1f] flex gap-3 bg-[#0f0f0f] rounded-b-2xl">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving || items.length === 0} className="btn-primary flex-1">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : 'Registrar venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
