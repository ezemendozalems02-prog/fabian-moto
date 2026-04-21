'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Truck, Plus, Search, X, Loader2, Trash2, Package } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { Supplier, Product } from '@/types'

interface PurchaseItem {
  product_id: string
  product_name: string
  quantity: number
  unit_cost: number
}

interface Purchase {
  id: string
  purchase_number: string
  total_cost: number
  notes?: string
  created_at: string
  supplier: { name: string } | null
  items: { id: string }[]
}

export default function ComprasPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')

  const fetchPurchases = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('purchases')
      .select('*, supplier:suppliers(name), items:purchase_items(id)')
      .order('created_at', { ascending: false })
      .limit(100)
    setPurchases((data as unknown as Purchase[]) || [])
    setLoading(false)
  }

  useEffect(() => { fetchPurchases() }, [])

  const filtered = useMemo(() => {
    if (!search) return purchases
    const q = search.toLowerCase()
    return purchases.filter(p =>
      p.purchase_number.toLowerCase().includes(q) ||
      p.supplier?.name?.toLowerCase().includes(q)
    )
  }, [purchases, search])

  const stats = useMemo(() => ({
    total: purchases.length,
    totalSpent: purchases.reduce((acc, p) => acc + p.total_cost, 0),
  }), [purchases])

  return (
    <div className="space-y-5 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Compras / Ingresos</h1>
          <p className="page-subtitle">Registro de reposición de mercadería</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nueva compra
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card"><p className="text-neutral-500 text-xs mb-1">Total compras</p><p className="text-white font-bold text-xl">{stats.total}</p></div>
        <div className="card"><p className="text-neutral-500 text-xs mb-1">Total invertido</p><p className="text-white font-bold text-xl">{formatCurrency(stats.totalSpent)}</p></div>
      </div>

      <div className="card flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" placeholder="Buscar por número o proveedor..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
      </div>

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
                  <th>Proveedor</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td><span className="text-white font-mono font-semibold text-sm">#{p.purchase_number}</span></td>
                    <td><span className="text-neutral-400 text-xs whitespace-nowrap">{formatDateTime(p.created_at)}</span></td>
                    <td><span className="text-neutral-300 text-sm">{p.supplier?.name || <span className="text-neutral-600">Sin proveedor</span>}</span></td>
                    <td><span className="text-neutral-400 text-sm">{p.items?.length || 0} ítems</span></td>
                    <td><span className="text-white font-bold">{formatCurrency(p.total_cost)}</span></td>
                    <td><span className="text-neutral-600 text-xs max-w-[150px] truncate block">{p.notes || '-'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-neutral-600">
              <Truck className="w-8 h-8 mb-2 opacity-30" />
              <p>Sin compras registradas</p>
            </div>
          )}
          <div className="px-4 py-3 border-t border-[#1f1f1f]">
            <p className="text-neutral-500 text-xs">{filtered.length} compras</p>
          </div>
        </div>
      )}

      {showNew && <NuevaCompraModal onClose={() => setShowNew(false)} onSaved={() => { fetchPurchases(); setShowNew(false) }} />}
    </div>
  )
}

function NuevaCompraModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [form, setForm] = useState({ supplier_id: '', notes: '' })
  const [productSearch, setProductSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [showProducts, setShowProducts] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('suppliers').select('id, name').eq('is_active', true).order('name'),
      supabase.from('products').select('id, name, sku, cost_price').eq('is_active', true).order('name'),
    ]).then(([{ data: s }, { data: p }]) => {
      setSuppliers((s as unknown as Supplier[]) || [])
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
      setItems(prev => [...prev, { product_id: product.id, product_name: product.name, quantity: 1, unit_cost: product.cost_price }])
    }
    setShowProducts(false)
    setProductSearch('')
  }

  const total = items.reduce((acc, i) => acc + i.quantity * i.unit_cost, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) { toast.error('Agregá al menos un producto'); return }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const purchaseNumber = `${Date.now()}`.slice(-8)

    const { data: purchase, error } = await supabase.from('purchases').insert({
      purchase_number: purchaseNumber,
      supplier_id: form.supplier_id || null,
      total_cost: total,
      notes: form.notes,
      user_id: user?.id,
    }).select().single()

    if (error) { toast.error('Error al registrar la compra'); setSaving(false); return }

    const purchaseItems = items.map(i => ({
      purchase_id: purchase.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_cost: i.unit_cost,
    }))

    const { error: itemsError } = await supabase.from('purchase_items').insert(purchaseItems)
    if (itemsError) { toast.error('Error al guardar los productos'); setSaving(false); return }

    toast.success(`Compra #${purchaseNumber} registrada. Stock actualizado automáticamente.`)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#111] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600/15 border border-emerald-600/20 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-white font-semibold">Nueva compra / ingreso</h2>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Proveedor (opcional)</label>
                <select value={form.supplier_id} onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))} className="input">
                  <option value="">Sin proveedor</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Observaciones</label>
                <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input" placeholder="Notas del ingreso..." />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Productos ingresados</label>
                <button type="button" onClick={() => setShowProducts(!showProducts)} className="btn-ghost text-xs py-1"><Plus className="w-3 h-3" />Agregar</button>
              </div>
              {showProducts && (
                <div className="mb-3 bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
                  <div className="p-2 border-b border-[#2a2a2a]">
                    <input type="text" placeholder="Buscar producto..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="input text-sm" autoFocus />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredProducts.map(p => (
                      <button key={p.id} type="button" onClick={() => addItem(p)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#252525] transition-colors text-left">
                        <div className="flex-1"><p className="text-white text-sm">{p.name}</p><p className="text-neutral-600 text-xs">{p.sku}</p></div>
                        <span className="text-neutral-400 text-sm">Costo: {formatCurrency(p.cost_price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {items.length === 0 ? (
                <div className="border border-dashed border-[#333] rounded-xl p-6 text-center text-neutral-600">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Agregá productos al ingreso</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.product_id} className="flex items-center gap-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3">
                      <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium truncate">{item.product_name}</p></div>
                      <input type="number" value={item.quantity} onChange={e => setItems(prev => prev.map(i => i.product_id === item.product_id ? { ...i, quantity: Math.max(1, Number(e.target.value)) } : i))} className="input w-16 text-center text-sm py-1.5" min="1" />
                      <span className="text-neutral-500 text-xs">×</span>
                      <input type="number" value={item.unit_cost} onChange={e => setItems(prev => prev.map(i => i.product_id === item.product_id ? { ...i, unit_cost: Number(e.target.value) } : i))} className="input w-28 text-sm py-1.5" min="0" step="0.01" />
                      <span className="text-white font-semibold text-sm w-20 text-right">{formatCurrency(item.quantity * item.unit_cost)}</span>
                      <button type="button" onClick={() => setItems(prev => prev.filter(i => i.product_id !== item.product_id))} className="text-neutral-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
              <div className="flex justify-between font-bold">
                <span className="text-white">Total de la compra</span>
                <span className="text-emerald-400 text-lg">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-[#1f1f1f] flex gap-3 bg-[#0f0f0f] rounded-b-2xl">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving || items.length === 0} className="btn-primary flex-1">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : 'Registrar ingreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
