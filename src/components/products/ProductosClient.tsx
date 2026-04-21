'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Plus, Search, Filter, Package, Edit, Trash2, Eye,
  LayoutGrid, List, AlertTriangle, XCircle, CheckCircle,
  ChevronDown, Copy, Tag
} from 'lucide-react'
import { cn, formatCurrency, getStockStatus, stockStatusLabel, stockStatusColor, truncate } from '@/lib/utils'
import { ProductModal } from './ProductModal'
import type { Product, Category } from '@/types'

interface ProductosClientProps {
  products: Product[]
  categories: Category[]
}

type ViewMode = 'table' | 'grid'
type StockFilter = 'all' | 'ok' | 'low' | 'out'

export function ProductosClient({ products: initialProducts, categories }: ProductosClientProps) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q)

      const matchCategory = categoryFilter === 'all' || p.category_id === categoryFilter
      const status = getStockStatus(p.stock, p.min_stock)
      const matchStock = stockFilter === 'all' || status === stockFilter
      const matchActive =
        activeFilter === 'all' ||
        (activeFilter === 'active' && p.is_active) ||
        (activeFilter === 'inactive' && !p.is_active)

      return matchSearch && matchCategory && matchStock && matchActive
    })
  }, [products, search, categoryFilter, stockFilter, activeFilter])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Desactivar el producto "${name}"? Esto lo ocultará del sistema pero conservará el historial.`)) return

    setDeletingId(id)
    const supabase = createClient()
    const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id)

    if (error) {
      toast.error('Error al desactivar el producto')
    } else {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: false } : p)))
      toast.success('Producto desactivado correctamente')
    }
    setDeletingId(null)
  }

  const handleDuplicate = async (product: Product) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('products')
      .insert({
        ...product,
        id: undefined,
        sku: `${product.sku}-COPIA`,
        name: `${product.name} (copia)`,
        stock: 0,
        created_at: undefined,
        updated_at: undefined,
      })
      .select()
      .single()

    if (error) {
      toast.error('Error al duplicar el producto')
    } else {
      setProducts((prev) => [data, ...prev])
      toast.success('Producto duplicado correctamente')
    }
  }

  const handleSaved = (product: Product) => {
    if (editingProduct) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)))
    } else {
      setProducts((prev) => [product, ...prev])
    }
    setShowModal(false)
    setEditingProduct(null)
  }

  const stats = useMemo(() => ({
    total: products.filter(p => p.is_active).length,
    ok: products.filter(p => p.is_active && getStockStatus(p.stock, p.min_stock) === 'ok').length,
    low: products.filter(p => p.is_active && getStockStatus(p.stock, p.min_stock) === 'low').length,
    out: products.filter(p => p.is_active && getStockStatus(p.stock, p.min_stock) === 'out').length,
  }), [products])

  return (
    <div className="space-y-5 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">{stats.total} productos activos</p>
        </div>
        <button onClick={() => { setEditingProduct(null); setShowModal(true) }} className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>Nuevo producto</span>
        </button>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total activos', value: stats.total, icon: Package, color: 'text-blue-400', bg: 'bg-blue-400/10', filter: 'all' as StockFilter },
          { label: 'En stock', value: stats.ok, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10', filter: 'ok' as StockFilter },
          { label: 'Stock bajo', value: stats.low, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10', filter: 'low' as StockFilter },
          { label: 'Sin stock', value: stats.out, icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', filter: 'out' as StockFilter },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setStockFilter(stockFilter === s.filter && s.filter !== 'all' ? 'all' : s.filter)}
            className={cn('card text-left transition-all hover:border-[#333]', stockFilter === s.filter && s.filter !== 'all' && 'border-red-600/30')}
          >
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', s.bg)}>
              <s.icon className={cn('w-4 h-4', s.color)} />
            </div>
            <p className="text-white font-bold text-xl">{s.value}</p>
            <p className="text-neutral-500 text-xs mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filtros y búsqueda */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, SKU o marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input w-auto min-w-[140px]"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="input w-auto"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            <div className="flex items-center gap-1 bg-[#1e1e1e] border border-[#333] rounded-lg p-1">
              <button onClick={() => setViewMode('table')} className={cn('p-1.5 rounded transition-colors', viewMode === 'table' ? 'bg-[#333] text-white' : 'text-neutral-500 hover:text-neutral-300')}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('grid')} className={cn('p-1.5 rounded transition-colors', viewMode === 'grid' ? 'bg-[#333] text-white' : 'text-neutral-500 hover:text-neutral-300')}>
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-neutral-600">
          <Package className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-medium text-neutral-500">No se encontraron productos</p>
          <p className="text-sm mt-1">Probá con otros filtros o agregá un nuevo producto</p>
          <button onClick={() => { setEditingProduct(null); setShowModal(true) }} className="btn-primary mt-4">
            <Plus className="w-4 h-4" />
            Agregar producto
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Costo</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const status = getStockStatus(product.stock, product.min_stock)
                  return (
                    <tr key={product.id} className={cn(!product.is_active && 'opacity-50')}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#252525] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-neutral-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{truncate(product.name, 40)}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-neutral-600 text-xs font-mono">{product.sku}</span>
                              {product.brand && <span className="text-neutral-600 text-xs">· {product.brand}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-neutral-400 text-xs">
                          {(product.category as unknown as { name: string })?.name || '-'}
                        </span>
                      </td>
                      <td>
                        <span className="text-white font-semibold">{formatCurrency(product.sale_price)}</span>
                      </td>
                      <td>
                        <span className="text-neutral-500">{formatCurrency(product.cost_price)}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{product.stock}</span>
                          <span className="text-neutral-600 text-xs">/ mín. {product.min_stock}</span>
                        </div>
                      </td>
                      <td>
                        <span className={cn('badge', stockStatusColor(status))}>
                          {stockStatusLabel(status)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => router.push(`/dashboard/productos/${product.id}`)}
                            className="p-1.5 text-neutral-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingProduct(product); setShowModal(true) }}
                            className="p-1.5 text-neutral-500 hover:text-white hover:bg-[#252525] rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(product)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-[#252525] rounded-lg transition-colors"
                            title="Duplicar"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            disabled={deletingId === product.id}
                            className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Desactivar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#1f1f1f]">
            <p className="text-neutral-500 text-xs">{filtered.length} productos · {products.length} total</p>
          </div>
        </div>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const status = getStockStatus(product.stock, product.min_stock)
            return (
              <div key={product.id} className={cn('card hover:border-[#333] transition-all group relative', !product.is_active && 'opacity-50')}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-[#252525] rounded-xl flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-neutral-600" />
                    )}
                  </div>
                  <span className={cn('badge', stockStatusColor(status))}>
                    {stockStatusLabel(status)}
                  </span>
                </div>
                <h3 className="text-white font-semibold text-sm mb-1 leading-tight">{product.name}</h3>
                <p className="text-neutral-600 text-xs font-mono mb-1">{product.sku}</p>
                {product.brand && <p className="text-neutral-500 text-xs mb-3">{product.brand}</p>}
                <div className="flex items-center justify-between pt-3 border-t border-[#252525]">
                  <div>
                    <p className="text-white font-bold">{formatCurrency(product.sale_price)}</p>
                    <p className="text-neutral-600 text-xs">Stock: <span className="font-semibold">{product.stock}</span></p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingProduct(product); setShowModal(true) }}
                      className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#252525] rounded-lg transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => { setShowModal(false); setEditingProduct(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
