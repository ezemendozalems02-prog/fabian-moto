import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, Edit, Tag, Boxes, TrendingDown } from 'lucide-react'
import { formatCurrency, formatDateTime, getStockStatus, stockStatusLabel, stockStatusColor, movementTypeLabel, movementTypeColor } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: product }, { data: movements }] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(name)')
      .eq('id', id)
      .single(),
    supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!product) notFound()

  const status = getStockStatus(product.stock, product.min_stock)
  const margin = product.cost_price > 0
    ? (((product.sale_price - product.cost_price) / product.cost_price) * 100).toFixed(1)
    : '0'

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/productos" className="btn-ghost">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-7 h-7 text-neutral-600" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{product.name}</h1>
            <p className="text-neutral-500 font-mono text-sm">{product.sku}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn('badge', stockStatusColor(status))}>{stockStatusLabel(status)}</span>
              {!product.is_active && <span className="badge bg-neutral-800 text-neutral-400">Inactivo</span>}
              {product.is_featured && <span className="badge bg-yellow-400/10 text-yellow-400">Destacado</span>}
              {product.is_new && <span className="badge bg-blue-400/10 text-blue-400">Nuevo</span>}
              {product.is_on_sale && <span className="badge bg-red-400/10 text-red-400">Oferta</span>}
            </div>
          </div>
        </div>
        <Link href={`/dashboard/productos`} className="btn-secondary">
          <Edit className="w-4 h-4" />
          Editar
        </Link>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-neutral-500 text-xs mb-1">Precio de venta</p>
          <p className="text-white font-bold text-xl">{formatCurrency(product.sale_price)}</p>
          {product.promo_price && (
            <p className="text-red-400 text-xs mt-0.5">Promo: {formatCurrency(product.promo_price)}</p>
          )}
        </div>
        <div className="card">
          <p className="text-neutral-500 text-xs mb-1">Costo</p>
          <p className="text-white font-bold text-xl">{formatCurrency(product.cost_price)}</p>
        </div>
        <div className="card">
          <p className="text-neutral-500 text-xs mb-1">Margen</p>
          <p className={cn('font-bold text-xl', Number(margin) >= 0 ? 'text-green-400' : 'text-red-400')}>{margin}%</p>
        </div>
        <div className="card">
          <p className="text-neutral-500 text-xs mb-1">Stock actual</p>
          <p className="text-white font-bold text-xl">{product.stock} <span className="text-neutral-500 text-sm font-normal">{product.unit}</span></p>
          <p className="text-neutral-600 text-xs">Mín: {product.min_stock}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Detalles */}
        <div className="card space-y-3">
          <h3 className="text-white font-semibold">Información del producto</h3>
          <InfoRow label="Categoría" value={(product.category as unknown as { name: string })?.name || '-'} />
          <InfoRow label="Marca" value={product.brand || '-'} />
          <InfoRow label="Modelo compatible" value={product.compatible_model || '-'} />
          <InfoRow label="Unidad" value={product.unit} />
          <InfoRow label="Ubicación" value={product.location || '-'} />
          {product.barcode && <InfoRow label="Código de barras" value={product.barcode} mono />}
          {product.technical_notes && (
            <div>
              <p className="text-neutral-500 text-xs mb-1">Notas técnicas</p>
              <p className="text-neutral-300 text-sm">{product.technical_notes}</p>
            </div>
          )}
          {product.short_description && (
            <div>
              <p className="text-neutral-500 text-xs mb-1">Descripción</p>
              <p className="text-neutral-300 text-sm">{product.short_description}</p>
            </div>
          )}
        </div>

        {/* Historial de movimientos */}
        <div className="card">
          <h3 className="text-white font-semibold mb-3">Historial de movimientos</h3>
          {movements && movements.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {movements.map((mv) => (
                <div key={mv.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors">
                  <span className={cn('badge text-xs', movementTypeColor(mv.type))}>
                    {movementTypeLabel(mv.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-500 text-xs">{formatDateTime(mv.created_at)}</p>
                    {mv.notes && <p className="text-neutral-600 text-xs truncate">{mv.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-semibold', mv.quantity > 0 ? 'text-green-400' : 'text-red-400')}>
                      {mv.quantity > 0 ? '+' : ''}{mv.quantity}
                    </p>
                    <p className="text-neutral-600 text-xs">{mv.stock_before} → {mv.stock_after}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-600 text-sm text-center py-8">Sin movimientos registrados</p>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-500 text-xs">{label}</span>
      <span className={cn('text-neutral-300 text-sm', mono && 'font-mono')}>{value}</span>
    </div>
  )
}
