'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Tag, Edit, Trash2, ToggleLeft, ToggleRight, X, Loader2, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

export default function CategoriasPage() {
  const [categories, setCategories] = useState<(Category & { product_count: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', description: '', image_url: '', is_active: true })
  const [saving, setSaving] = useState(false)

  const fetchCategories = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('categories')
      .select('*, products(id)')
      .is('parent_id', null)
      .order('sort_order')
    if (data) {
      setCategories(data.map(c => ({
        ...c,
        product_count: (c.products as unknown[])?.length || 0,
      })))
    }
    setLoading(false)
  }

  useEffect(() => { fetchCategories() }, [])

  const openModal = (cat?: Category) => {
    if (cat) {
      setEditing(cat)
      setForm({ name: cat.name, description: cat.description || '', image_url: cat.image_url || '', is_active: cat.is_active })
    } else {
      setEditing(null)
      setForm({ name: '', description: '', image_url: '', is_active: true })
    }
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('El nombre es obligatorio')
    setSaving(true)

    const supabase = createClient()
    const slug = form.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')
    const payload = { ...form, slug }

    if (editing) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editing.id)
      if (error) { toast.error('Error al actualizar'); setSaving(false); return }
      toast.success('Categoría actualizada')
    } else {
      const { error } = await supabase.from('categories').insert(payload)
      if (error) { toast.error('Error al crear la categoría'); setSaving(false); return }
      toast.success('Categoría creada')
    }

    setSaving(false)
    setShowModal(false)
    fetchCategories()
  }

  const handleToggle = async (cat: Category) => {
    const supabase = createClient()
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id)
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
    toast.success(cat.is_active ? 'Categoría desactivada' : 'Categoría activada')
  }

  const handleDelete = async (cat: Category) => {
    if (!confirm(`¿Eliminar la categoría "${cat.name}"? Los productos no se eliminarán.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('categories').delete().eq('id', cat.id)
    if (error) { toast.error('No se puede eliminar si tiene productos asociados'); return }
    setCategories(prev => prev.filter(c => c.id !== cat.id))
    toast.success('Categoría eliminada')
  }

  return (
    <div className="space-y-5 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Categorías</h1>
          <p className="page-subtitle">{categories.length} categorías registradas</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nueva categoría
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-red-500" />
        </div>
      ) : categories.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-neutral-600">
          <Tag className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-medium text-neutral-500">Sin categorías</p>
          <button onClick={() => openModal()} className="btn-primary mt-4">
            <Plus className="w-4 h-4" />
            Crear primera categoría
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className={cn('card hover:border-[#333] transition-all group', !cat.is_active && 'opacity-60')}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-center">
                  <Tag className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleToggle(cat)} className="p-1.5 text-neutral-500 hover:text-white hover:bg-[#252525] rounded-lg transition-colors" title={cat.is_active ? 'Desactivar' : 'Activar'}>
                    {cat.is_active ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openModal(cat)} className="p-1.5 text-neutral-500 hover:text-white hover:bg-[#252525] rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cat)} className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-white font-semibold">{cat.name}</h3>
              {cat.description && <p className="text-neutral-500 text-xs mt-1">{cat.description}</p>}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#252525]">
                <Package className="w-3.5 h-3.5 text-neutral-600" />
                <span className="text-neutral-500 text-xs">{cat.product_count} productos</span>
                <span className={cn('ml-auto badge', cat.is_active ? 'bg-green-400/10 text-green-400' : 'bg-neutral-800 text-neutral-500')}>
                  {cat.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#111] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl animate-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f1f]">
              <h2 className="text-white font-semibold">{editing ? 'Editar categoría' : 'Nueva categoría'}</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="label">Nombre <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input"
                  placeholder="Ej: Motor, Frenos, Accesorios..."
                  required
                />
              </div>
              <div>
                <label className="label">Descripción</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  className="input"
                  placeholder="Descripción breve de la categoría"
                />
              </div>
              <div>
                <label className="label">URL de imagen (opcional)</label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))}
                  className="input"
                  placeholder="https://..."
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={cn('w-10 h-5 rounded-full relative transition-colors cursor-pointer', form.is_active ? 'bg-red-600' : 'bg-[#333]')}
                >
                  <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all', form.is_active ? 'left-5' : 'left-0.5')} />
                </div>
                <span className="text-neutral-400 text-sm">Categoría activa</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : (editing ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
