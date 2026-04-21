'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { X, Upload, Package, Loader2 } from 'lucide-react'
import { cn, generateSKU } from '@/lib/utils'
import type { Product, Category } from '@/types'

interface ProductModalProps {
  product: Product | null
  categories: Category[]
  onClose: () => void
  onSaved: (product: Product) => void
}

const UNITS = ['unidad', 'par', 'kit', 'set', 'litro', 'metro', 'caja', 'rollo']

export function ProductModal({ product, categories, onClose, onSaved }: ProductModalProps) {
  const isEditing = !!product

  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    category_id: product?.category_id || '',
    brand: product?.brand || '',
    compatible_model: product?.compatible_model || '',
    short_description: product?.short_description || '',
    description: product?.description || '',
    cost_price: product?.cost_price || 0,
    sale_price: product?.sale_price || 0,
    promo_price: product?.promo_price || '',
    stock: product?.stock || 0,
    min_stock: product?.min_stock || 3,
    unit: product?.unit || 'unidad',
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured || false,
    is_new: product?.is_new || false,
    is_on_sale: product?.is_on_sale || false,
    image_url: product?.image_url || '',
    technical_notes: product?.technical_notes || '',
    location: product?.location || '',
  })

  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'general' | 'precios' | 'stock' | 'extra'>('general')

  const handleChange = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'name' && !isEditing && !form.sku) {
      setForm((prev) => ({ ...prev, sku: generateSKU(String(value)) }))
    }
  }

  const margin = form.cost_price > 0
    ? (((Number(form.sale_price) - Number(form.cost_price)) / Number(form.cost_price)) * 100).toFixed(1)
    : '0'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.sku || !form.sale_price) {
      toast.error('Completá los campos obligatorios: nombre, SKU y precio de venta')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const payload = {
      ...form,
      cost_price: Number(form.cost_price),
      sale_price: Number(form.sale_price),
      promo_price: form.promo_price ? Number(form.promo_price) : null,
      stock: Number(form.stock),
      min_stock: Number(form.min_stock),
      category_id: form.category_id || null,
    }

    try {
      if (isEditing) {
        const { data, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', product.id)
          .select('*, category:categories(id, name)')
          .single()

        if (error) throw error
        toast.success('Producto actualizado correctamente')
        onSaved(data)
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(payload)
          .select('*, category:categories(id, name)')
          .single()

        if (error) throw error
        toast.success('Producto creado correctamente')
        onSaved(data)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      if (message.includes('duplicate') || message.includes('unique')) {
        toast.error('El SKU ya existe. Usá un código diferente.')
      } else {
        toast.error('Error al guardar el producto')
      }
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'precios', label: 'Precios' },
    { id: 'stock', label: 'Stock' },
    { id: 'extra', label: 'Extra' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#111] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-black/60 animate-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600/15 border border-red-600/20 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="text-white font-semibold">{isEditing ? 'Editar producto' : 'Nuevo producto'}</h2>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1f1f1f] px-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors border-b-2',
                tab === t.id
                  ? 'text-red-400 border-red-500'
                  : 'text-neutral-500 border-transparent hover:text-neutral-300'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {tab === 'general' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">Nombre del producto <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="input"
                      placeholder="Ej: Pastilla de freno trasera Honda"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">SKU / Código interno <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={form.sku}
                      onChange={(e) => handleChange('sku', e.target.value.toUpperCase())}
                      className="input font-mono"
                      placeholder="PAST-0001"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Código de barras</label>
                    <input
                      type="text"
                      value={form.barcode}
                      onChange={(e) => handleChange('barcode', e.target.value)}
                      className="input"
                      placeholder="7890123456789"
                    />
                  </div>
                  <div>
                    <label className="label">Categoría</label>
                    <select
                      value={form.category_id}
                      onChange={(e) => handleChange('category_id', e.target.value)}
                      className="input"
                    >
                      <option value="">Sin categoría</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Marca</label>
                    <input
                      type="text"
                      value={form.brand}
                      onChange={(e) => handleChange('brand', e.target.value)}
                      className="input"
                      placeholder="Honda, Yamaha, Genérico..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Modelo compatible</label>
                    <input
                      type="text"
                      value={form.compatible_model}
                      onChange={(e) => handleChange('compatible_model', e.target.value)}
                      className="input"
                      placeholder="Ej: Honda Wave 110, 125 - 2018 a 2023"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Descripción corta</label>
                    <input
                      type="text"
                      value={form.short_description}
                      onChange={(e) => handleChange('short_description', e.target.value)}
                      className="input"
                      placeholder="Descripción breve para listas y catálogo"
                      maxLength={150}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">URL de imagen principal</label>
                    <input
                      type="url"
                      value={form.image_url}
                      onChange={(e) => handleChange('image_url', e.target.value)}
                      className="input"
                      placeholder="https://... (URL de la imagen)"
                    />
                  </div>
                </div>
              </>
            )}

            {tab === 'precios' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Precio de costo <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
                      <input
                        type="number"
                        value={form.cost_price}
                        onChange={(e) => handleChange('cost_price', e.target.value)}
                        className="input pl-7"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Precio de venta <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
                      <input
                        type="number"
                        value={form.sale_price}
                        onChange={(e) => handleChange('sale_price', e.target.value)}
                        className="input pl-7"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Precio promocional</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
                      <input
                        type="number"
                        value={form.promo_price}
                        onChange={(e) => handleChange('promo_price', e.target.value)}
                        className="input pl-7"
                        min="0"
                        step="0.01"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 w-full">
                      <p className="text-neutral-500 text-xs mb-1">Margen estimado</p>
                      <p className={cn('text-2xl font-bold', Number(margin) > 0 ? 'text-green-400' : 'text-red-400')}>
                        {margin}%
                      </p>
                      {form.cost_price > 0 && form.sale_price > 0 && (
                        <p className="text-neutral-600 text-xs mt-1">
                          Ganancia: ${(Number(form.sale_price) - Number(form.cost_price)).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  {[
                    { key: 'is_on_sale', label: 'En oferta' },
                    { key: 'is_featured', label: 'Destacado' },
                    { key: 'is_new', label: 'Nuevo' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => handleChange(key, !form[key as keyof typeof form])}
                        className={cn(
                          'w-10 h-5 rounded-full relative transition-colors cursor-pointer',
                          form[key as keyof typeof form] ? 'bg-red-600' : 'bg-[#333]'
                        )}
                      >
                        <div className={cn(
                          'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all',
                          form[key as keyof typeof form] ? 'left-5' : 'left-0.5'
                        )} />
                      </div>
                      <span className="text-neutral-400 text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}

            {tab === 'stock' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Stock actual</label>
                    <input
                      type="number"
                      value={form.stock}
                      onChange={(e) => handleChange('stock', e.target.value)}
                      className="input"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="label">Stock mínimo</label>
                    <input
                      type="number"
                      value={form.min_stock}
                      onChange={(e) => handleChange('min_stock', e.target.value)}
                      className="input"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="label">Unidad</label>
                    <select
                      value={form.unit}
                      onChange={(e) => handleChange('unit', e.target.value)}
                      className="input"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Ubicación interna</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="input"
                    placeholder="Ej: Estante A - Fila 3"
                  />
                </div>
                <div>
                  <label className="label">Notas técnicas / observaciones</label>
                  <textarea
                    value={form.technical_notes}
                    onChange={(e) => handleChange('technical_notes', e.target.value)}
                    className="input min-h-[80px] resize-none"
                    placeholder="Compatibilidades, medidas, observaciones técnicas..."
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => handleChange('is_active', !form.is_active)}
                      className={cn(
                        'w-10 h-5 rounded-full relative transition-colors cursor-pointer',
                        form.is_active ? 'bg-red-600' : 'bg-[#333]'
                      )}
                    >
                      <div className={cn(
                        'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all',
                        form.is_active ? 'left-5' : 'left-0.5'
                      )} />
                    </div>
                    <span className="text-neutral-400 text-sm">Producto activo</span>
                  </label>
                </div>
              </>
            )}

            {tab === 'extra' && (
              <>
                <div>
                  <label className="label">Descripción completa</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="input min-h-[120px] resize-y"
                    placeholder="Descripción detallada del producto para uso interno y futuro catálogo web..."
                  />
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                  <p className="text-neutral-400 text-sm font-medium mb-1">Integración web (futuro)</p>
                  <p className="text-neutral-600 text-xs">
                    Este producto podrá sincronizarse automáticamente con la página web pública del negocio.
                    La imagen, descripción y precio se usarán en el catálogo online.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#1f1f1f] flex items-center justify-between bg-[#0f0f0f] rounded-b-2xl">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <div className="flex items-center gap-3">
              {tab !== 'general' && (
                <button
                  type="button"
                  onClick={() => {
                    const order: Array<'general' | 'precios' | 'stock' | 'extra'> = ['general', 'precios', 'stock', 'extra']
                    const idx = order.indexOf(tab)
                    if (idx > 0) setTab(order[idx - 1])
                  }}
                  className="btn-secondary"
                >
                  Anterior
                </button>
              )}
              {tab !== 'extra' ? (
                <button
                  type="button"
                  onClick={() => {
                    const order: Array<'general' | 'precios' | 'stock' | 'extra'> = ['general', 'precios', 'stock', 'extra']
                    const idx = order.indexOf(tab)
                    setTab(order[idx + 1])
                  }}
                  className="btn-primary"
                >
                  Siguiente
                </button>
              ) : (
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    isEditing ? 'Guardar cambios' : 'Crear producto'
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
