'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeftRight, Search, Filter, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'
import { cn, formatDateTime, movementTypeLabel, movementTypeColor } from '@/lib/utils'

interface Movement {
  id: string
  type: string
  quantity: number
  stock_before: number
  stock_after: number
  notes?: string
  created_at: string
  product: { name: string; sku: string } | null
  user: { name: string } | null
}

const MOVEMENT_TYPES = ['all', 'ingreso', 'egreso', 'ajuste', 'venta', 'devolucion', 'correccion', 'compra']

export default function MovimientosPage() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const supabase = createClient()
      let query = supabase
        .from('stock_movements')
        .select('*, product:products(name, sku), user:profiles(name)')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (typeFilter !== 'all') query = query.eq('type', typeFilter)
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

      const { data } = await query
      setMovements((data as unknown as Movement[]) || [])
      setLoading(false)
    }
    fetch()
  }, [typeFilter, dateFrom, dateTo, page])

  const filtered = useMemo(() => {
    if (!search) return movements
    const q = search.toLowerCase()
    return movements.filter(m =>
      m.product?.name.toLowerCase().includes(q) ||
      m.product?.sku.toLowerCase().includes(q) ||
      m.type.includes(q)
    )
  }, [movements, search])

  const stats = useMemo(() => ({
    ingresos: movements.filter(m => ['ingreso', 'compra', 'devolucion'].includes(m.type)).length,
    egresos: movements.filter(m => ['egreso', 'venta'].includes(m.type)).length,
    ajustes: movements.filter(m => ['ajuste', 'correccion'].includes(m.type)).length,
  }), [movements])

  return (
    <div className="space-y-5 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Movimientos de Stock</h1>
          <p className="page-subtitle">Trazabilidad completa del inventario</p>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="w-4 h-4 text-green-400" />
            <span className="text-neutral-500 text-xs">Ingresos</span>
          </div>
          <p className="text-white font-bold text-xl">{stats.ingresos}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownRight className="w-4 h-4 text-red-400" />
            <span className="text-neutral-500 text-xs">Egresos / Ventas</span>
          </div>
          <p className="text-white font-bold text-xl">{stats.egresos}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <ArrowLeftRight className="w-4 h-4 text-blue-400" />
            <span className="text-neutral-500 text-xs">Ajustes</span>
          </div>
          <p className="text-white font-bold text-xl">{stats.ajustes}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
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
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}
            className="input w-auto"
          >
            <option value="all">Todos los tipos</option>
            {MOVEMENT_TYPES.filter(t => t !== 'all').map(t => (
              <option key={t} value={t}>{movementTypeLabel(t)}</option>
            ))}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0) }} className="input w-auto" />
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0) }} className="input w-auto" />
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
                  <th>Fecha y hora</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Stock anterior</th>
                  <th>Stock resultante</th>
                  <th>Usuario</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(mv => (
                  <tr key={mv.id}>
                    <td>
                      <span className="text-neutral-400 text-xs whitespace-nowrap">{formatDateTime(mv.created_at)}</span>
                    </td>
                    <td>
                      <div>
                        <p className="text-white text-sm font-medium">{mv.product?.name || '-'}</p>
                        <p className="text-neutral-600 text-xs font-mono">{mv.product?.sku}</p>
                      </div>
                    </td>
                    <td>
                      <span className={cn('badge', movementTypeColor(mv.type))}>
                        {movementTypeLabel(mv.type)}
                      </span>
                    </td>
                    <td>
                      <span className={cn('font-bold text-sm', mv.quantity > 0 ? 'text-green-400' : 'text-red-400')}>
                        {mv.quantity > 0 ? '+' : ''}{mv.quantity}
                      </span>
                    </td>
                    <td><span className="text-neutral-500 text-sm">{mv.stock_before}</span></td>
                    <td><span className="text-white font-semibold text-sm">{mv.stock_after}</span></td>
                    <td><span className="text-neutral-500 text-xs">{mv.user?.name || '-'}</span></td>
                    <td><span className="text-neutral-600 text-xs max-w-[150px] truncate block">{mv.notes || '-'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-10 text-neutral-600">
              <ArrowLeftRight className="w-8 h-8 mb-2 opacity-30" />
              <p>Sin movimientos para mostrar</p>
            </div>
          )}
          {/* Paginación */}
          <div className="px-4 py-3 border-t border-[#1f1f1f] flex items-center justify-between">
            <p className="text-neutral-500 text-xs">{filtered.length} movimientos</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="flex items-center text-neutral-500 text-xs px-2">Página {page + 1}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={movements.length < PAGE_SIZE}
                className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
